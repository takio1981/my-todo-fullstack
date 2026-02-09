# Stage 1: Build Angular ให้เป็นไฟล์ HTML/JS
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: เอาไฟล์ที่ได้ ไปรันบน Nginx (Web Server ขนาดเล็ก)
FROM nginx:alpine
# ก๊อปปี้ไฟล์จาก Stage 1 มาใส่ Nginx
# หมายเหตุ: path อาจเปลี่ยนตามชื่อโปรเจกต์ เช็คให้ชัวร์ว่าใน dist มีโฟลเดอร์ชื่ออะไร
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80