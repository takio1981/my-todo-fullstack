const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // เรียกใช้ตัวเข้ารหัสรหัสผ่าน

const app = express();
app.use(cors());
app.use(bodyParser.json());

// เชื่อมต่อ Database
const db = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: 'root',
  password: 'mypassword',
  database: 'todo_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Attempting to connect to DB at host:', process.env.DB_HOST || 'db');

// สร้างตารางข้อมูลถ้ายังไม่มี
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL
  )
`;
db.query(createTableQuery);

// API 1: ดึงข้อมูลทั้งหมด (GET)
app.get('/api/tasks', (req, res) => {
  db.query('SELECT * FROM tasks', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// API 2: เพิ่มข้อมูล (POST)
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  db.query('INSERT INTO tasks (title) VALUES (?)', [title], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId, title });
  });
});

// API 5: เข้าสู่ระบบ (Login) - แบบปลอดภัย
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // ค้นหาในตาราง users ว่ามีชื่อและรหัสนี้ไหม
  const query = 'SELECT * FROM users WHERE username = ?';
  
  db.query(query, [username], (err, results) => {
    if (err) return res.status(500).send(err);
    
// ถ้าไม่เจอ User นี้เลย
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'ไม่พบผู้ใช้นี้' });
    }

    const user = results[0];

    // 2. เอารหัสที่กรอก (password) มาเทียบกับ รหัสใน DB (user.password)
    const isMatch = bcrypt.compareSync(password, user.password);

    if (isMatch) {
      // ถ้ารหัสตรงกัน
      res.json({ success: true, message: 'Login สำเร็จ!', user: user });
    } else {
      // ถ้ารหัสไม่ตรง
      res.status(401).json({ success: false, message: 'รหัสผ่านผิด' });
    }
  });
});

// API 6: ลงทะเบียน (Register) -> สร้าง User ใหม่พร้อมเข้ารหัส
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  // 1. เข้ารหัสรหัสผ่าน (Hashing)
  // เลข 10 คือความยากในการเข้ารหัส (ยิ่งเยอะยิ่งปลอดภัยแต่ช้าลงนิดนึง)
  const hashedPassword = bcrypt.hashSync(password, 10);

  // 2. บันทึกลง Database (สังเกตว่าเราส่ง hashedPassword ไปแทน password จริง)
  const query = 'INSERT INTO users (username, password) VALUES (?, ?)';

  db.query(query, [username, hashedPassword], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'User created successfully' });
  });
});

// รัน Server ที่ Port 3000
app.listen(3000, () => {
  console.log('Backend server running on http://localhost:3000');
});

// API 3: แก้ไขข้อมูล (UPDATE/PUT)
// :id คือตัวแปรที่เราจะส่งเลข ID ของงานที่ต้องการแก้มา
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;      // รับเลข ID จาก URL
  const { title, is_completed } = req.body;     // รับข้อความใหม่จากตัวข้อมูล รับค่า is_completed เพิ่มมาด้วย
  
  const query = 'UPDATE tasks SET title = ?, is_completed = ? WHERE id = ?';

  db.query(query, [title, is_completed, id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Updated successfully' });
  });
});

// API 4: ลบข้อมูล (DELETE)
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params; // รับเลข ID ว่าจะลบตัวไหน
  
  const query = 'DELETE FROM tasks WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Deleted successfully' });
  });
});