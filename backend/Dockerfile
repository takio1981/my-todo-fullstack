# ใช้ Node.js เวอร์ชัน 22
FROM node:22

# สร้างโฟลเดอร์ทำงานข้างใน Container
WORKDIR /app

# ก๊อปปี้ไฟล์ package.json ไปก่อนเพื่อลงโปรแกรม
COPY package*.json ./
RUN npm install

# ก๊อปปี้ไฟล์โค้ดทั้งหมดตามไป
COPY . .

# เปิดประตู Port 3000
EXPOSE 3000

# คำสั่งรันเมื่อเริ่ม Container
CMD ["node", "server.js"]