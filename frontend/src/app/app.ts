import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      
      <div *ngIf="!isLoggedIn" class="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
        <h1 class="text-2xl font-bold mb-6 text-center text-indigo-600">🔒 เข้าสู่ระบบ</h1>
        
        <div class="space-y-4">
          <input [(ngModel)]="loginData.username" 
                 class="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" 
                 placeholder="ชื่อผู้ใช้ (admin)">
          
          <input [(ngModel)]="loginData.password" 
                 type="password"
                 class="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" 
                 placeholder="รหัสผ่าน (1234)">
          
          <button (click)="onLogin()" 
                  class="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 font-bold transition">
            Login
          </button>
          
          <p *ngIf="errorMessage" class="text-red-500 text-center text-sm">{{ errorMessage }}</p>
        </div>
      </div>

      <div *ngIf="isLoggedIn" class="bg-white p-8 rounded-xl shadow-xl w-full max-w-lg">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-extrabold text-indigo-600">🚀 My Super To-Do</h1>
          <button (click)="onLogout()" class="text-sm text-gray-500 hover:text-red-500 underline">ออกจากระบบ</button>
        </div>
        
        <div class="flex gap-2 mb-6">
          <input [(ngModel)]="newTask" (keyup.enter)="addTask()" class="border-2 border-gray-200 p-3 rounded-lg w-full focus:outline-none focus:border-indigo-500 transition" placeholder="วันนี้จะทำอะไรดี?">
          <button (click)="addTask()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-bold shadow-md">เพิ่ม</button>
        </div>

        <ul class="space-y-3">
          <li *ngFor="let task of tasks" 
              class="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between hover:shadow-md transition">
            
            <div class="flex items-center gap-3">
              <input type="checkbox" 
                     [checked]="task.is_completed" 
                     (change)="toggleTask(task)"
                     class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer">
              
              <span class="text-gray-700 text-lg font-medium" 
                    [class.line-through]="task.is_completed"
                    [class.text-gray-400]="task.is_completed">
                {{ task.title }}
              </span>
            </div>
            
            <div class="flex gap-2">
              <button (click)="editTask(task)" class="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 p-2 rounded-full transition">✏️</button>
              <button (click)="deleteTask(task.id)" class="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition">🗑️</button>
            </div>

          </li>
        </ul>
      </div>

    </div>
  `,
  styleUrls: []
})
export class AppComponent implements OnInit {
  // ตัวแปรสำหรับ Login
  isLoggedIn = false;
  loginData = { username: '', password: '' };
  errorMessage = '';

  // ตัวแปรสำหรับ To-Do List
  tasks: any[] = [];
  newTask: string = '';
  // ใช้ localhost เพื่อให้ Browser เข้าถึงได้ (Backend ต้อง map port 3000 ออกมาแล้วใน docker-compose)
  apiUrl = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    // ยังไม่ต้องโหลด tasks จนกว่าจะ Login ผ่าน
  }

  // ฟังก์ชัน Login
  onLogin() {
    this.http.post(`${this.apiUrl}/login`, this.loginData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.isLoggedIn = true; // สลับหน้าจอ
          this.fetchTasks();      // โหลดข้อมูลงาน
          this.errorMessage = '';
          this.cd.detectChanges(); // <--- จุดที่ 3: สั่งอัปเดตหน้าจอทันที!
        }
      },
      error: (err) => {
        this.errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!';
        this.cd.detectChanges(); // <--- สั่งอัปเดตเผื่อกรณี Error ด้วย
      }
    });
  }

  // ฟังก์ชัน Logout
  onLogout() {
    this.isLoggedIn = false;
    this.loginData = { username: '', password: '' };
    this.tasks = [];
  }

  // --- ฟังก์ชันเดิมของ To-Do List ---
  fetchTasks() {
    this.http.get<any[]>(`${this.apiUrl}/tasks`).subscribe(data => {
      this.tasks = data;
      this.cd.detectChanges(); // <--- จุดที่ 4: สั่งอัปเดตหน้าจอหลังโหลดข้อมูล
    });
  }

  addTask() {
    if (!this.newTask.trim()) return;
    this.http.post(`${this.apiUrl}/tasks`, { title: this.newTask }).subscribe(() => {
      this.newTask = '';
      this.fetchTasks();
    });
  }

  deleteTask(id: number) {
    if(confirm('ลบรายการนี้?')) {
      this.http.delete(`${this.apiUrl}/tasks/${id}`).subscribe(() => this.fetchTasks());
    }
  }

  editTask(task: any) {
    const newTitle = prompt('แก้ไขรายการ:', task.title);
    if (newTitle && newTitle !== task.title) {
      this.http.put(`${this.apiUrl}/tasks/${task.id}`, { title: newTitle }).subscribe(() => this.fetchTasks());
    }
  }

  // ฟังก์ชันสลับสถานะ (เสร็จ/ไม่เสร็จ)
  toggleTask(task: any) {
    // สลับค่า (ถ้าจริงเป็นเท็จ ถ้าเท็จเป็นจริง)
    const newStatus = !task.is_completed;
    
    // ส่งไปอัปเดตที่ Backend
    this.http.put(`${this.apiUrl}/tasks/${task.id}`, { 
      title: task.title, 
      is_completed: newStatus 
    }).subscribe(() => {
      this.fetchTasks(); // โหลดข้อมูลใหม่เพื่อความชัวร์
      // this.cd.detectChanges(); // (ใส่หรือไม่ใส่ก็ได้ เพราะ fetchTasks มีอยู่แล้ว)
    });
  }
}