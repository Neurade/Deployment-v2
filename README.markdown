# 🚀 Hướng dẫn triển khai hệ thống Neurade

Tài liệu này hướng dẫn cách sử dụng thư mục `Deployment` để chạy toàn bộ hệ thống Neurade bằng Docker và Docker Compose.

---

## 🧱 Cấu trúc thư mục

Mỗi thư mục con trong `Deployment/` tương ứng với một service riêng biệt và đều chứa:

- `Dockerfile`: mô tả cách build image
- `docker-compose.yml`: cấu hình chạy container
- `.env`: chứa các biến môi trường (**đã có sẵn – cần chỉnh sửa**)

```plaintext
Deployment/
│
├── Backend_v2/
├── code-review-platform/
├── LLM-Health-Service/
├── PR-Chatbot/
├── PR-Reviewer/
└── Webhook/
```

---

## 🔧 Bước 1: Chỉnh sửa file `.env`

Trong mỗi thư mục con, bạn cần **mở và chỉnh sửa file `.env`** tương ứng để điền đúng các thông tin cấu hình:

Ví dụ với `Backend_v2/.env`:

```env
DB_USER=neurade_user
DB_PASSWORD=securepassword
DB_NAME=neurade_db
WEB_PORT=8080
MINIO_PORT=9000
MINIO_ACCESS=minioadmin
MINIO_SECRET=minioadmin
```

> **Lưu ý**: 
> - Hãy đảm bảo các port không bị trùng.
> - Các thông tin như username, password, token cần được đặt đúng.
> - Đối với thư mục `Webhook/`, sử dụng biến `SECRET_TOKEN` (token của GitHub Actions) và `BACKEND_URL` (URL của webhook) trong file `.env`.

---

## ▶️ Bước 2: Chạy toàn bộ hệ thống

Từ thư mục `Deployment/`, chạy script sau để khởi động tất cả các dịch vụ:

```bash
chmod +x deploy.sh
./deploy.sh
```

Script này sẽ:

- Truy cập vào từng thư mục service
- Chạy `docker-compose up -d` cho từng service
- Khởi động toàn bộ hệ thống ở chế độ nền

---

## 🛑 Dừng toàn bộ dịch vụ

Để dừng và gỡ toàn bộ container, chạy:

```bash
chmod +x stop.sh
./deploy.sh
```
