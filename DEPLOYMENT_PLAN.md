# 🚀 KẾ HOẠCH TRIỂN KHAI HỆ THỐNG E-COMMERCE MARKETPLACE TMN (DEPLOYMENT PLAN)

> **Nhánh triển khai:** `deploy`  
> **Tài liệu hướng dẫn:** Thực hiện chi tiết từng bước (Step-by-Step Guide)  
> **Dự án bao gồm:**
> - **Backend API:** NestJS + TypeScript + Prisma ORM + Redis Cache + WebSockets (Socket.IO)
> - **Frontend Storefront:** Next.js 16 (App Router, SSR + ISR) + Tailwind CSS
> - **Frontend Backoffice:** Vite + React 19 + MUI (Single Page Application - SPA)
> - **Database & Cache:** PostgreSQL 15 + Redis 7 (+ PgBouncer Connection Pooling)

---

## 📑 MỤC LỤC
1. [Lựa Chọn Phương Án Triển Khai (Comparison)](#1-lựa-chọn-phương-án-triển-khai)
2. [Phương Án 1: Triển Khai Trọn Gói Trên 1 VPS Với Docker Compose (Khuyến Nghị)](#2-phương-án-1-triển-khai-trọn-gói-trên-1-vps-với-docker-compose)
   - [Bước 1: Chuẩn bị máy chủ VPS Ubuntu](#bước-1-chuẩn-bị-máy-chủ-vps-ubuntu)
   - [Bước 2: Cấu hình DNS Tên Miền (Domain Setup)](#bước-2-cấu-hình-dns-tên-miền)
   - [Bước 3: Tải mã nguồn nhánh `deploy`](#bước-3-tải-mã-nguồn-nhánh-deploy)
   - [Bước 4: Cấu hình biến môi trường Production (`.env`)](#bước-4-cấu-hình-biến-môi-trường-production-env)
   - [Bước 5: Build và Khởi động Container](#bước-5-build-và-khởi-động-container)
   - [Bước 6: Chạy Migration & Seed Database](#bước-6-chạy-migration--seed-database)
   - [Bước 7: Cấu hình Nginx Reverse Proxy & SSL HTTPS (Certbot)](#bước-7-cấu-hình-nginx-reverse-proxy--ssl-https-certbot)
   - [Bước 8: Kiểm thử hệ thống sau triển khai (Verification)](#bước-8-kiểm-thử-hệ-thống-sau-triển-khai)
3. [Phương Án 2: Triển Khai Phân Tán Đám Mây Miễn Phí / Tiết Kiệm (Cloud PaaS)](#3-phương-án-2-triển-khai-phân-tán-đám-mây-cloud-paas)
   - [3.1 Database & Redis (Supabase / Neon + Upstash)](#31-database--redis-supabase--upstash)
   - [3.2 Backend API (Render hoặc Railway)](#32-backend-api-render--railway)
   - [3.3 Frontend Storefront (Vercel)](#33-frontend-storefront-vercel)
   - [3.4 Frontend Backoffice (Vercel hoặc Cloudflare Pages)](#34-frontend-backoffice-vercel--cloudflare-pages)
4. [Bảo Mật & Tối Ưu Hệ Thống (Production Checklist)](#4-bảo-mật--tối-ưu-hệ-thống)
5. [Quy Trình Cập Nhật Code (Update / Release Flow)](#5-quy-trình-cập-nhật-code)
6. [Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#6-xử-lý-sự-cố-thường-gặp)

---

## 1. LỰA CHỌN PHƯƠNG ÁN TRIỂN KHAI

| Tiêu chí | Phương Án 1: VPS Độc Lập (Docker Compose) | Phương Án 2: Cloud PaaS (Vercel + Render + Supabase) |
|---|---|---|
| **Độ phức tạp setup** | Trung bình (Cần biết dùng SSH, Docker, Nginx) | Đơn giản (Chủ yếu click giao diện web) |
| **Chi phí** | Rất tiết kiệm (1 VPS từ $5 - $10/tháng, ví dụ Hetzner/DigitalOcean) | Có gói Free Tier, nhưng vượt hạn mức sẽ tốn kém |
| **Hiệu năng & Tốc độ** | Tối đa (Cùng mạng nội bộ localhost giữa DB, Redis & API) | Có độ trễ network giữa các dịch vụ khác nhau |
| **Kiểm soát & Dữ liệu** | 100% tự chủ toàn bộ database, logs, cấu hình | Phụ thuộc vào chính sách của bên thứ 3 |
| **Phù hợp nhất cho** | **Đồ án tốt nghiệp, Production quy mô vừa, doanh nghiệp tự host** | **Demo nhanh, POC, chưa có VPS** |

---

## 2. PHƯƠNG ÁN 1: TRIỂN KHAI TRỌN GÓI TRÊN 1 VPS VỚI DOCKER COMPOSE

### Yêu cầu cấu hình VPS đề xuất:
- **Hệ điều hành:** Ubuntu 22.04 LTS hoặc 24.04 LTS (x64)
- **CPU:** Tối thiểu 2 vCPU
- **RAM:** Tối thiểu 2GB (Khuyến nghị 4GB). Nếu VPS 2GB, **bắt buộc tạo thêm 2GB Swap Memory** theo hướng dẫn bên dưới.
- **Ổ cứng:** SSD 25GB trở lên.

---

### Bước 1: Chuẩn bị máy chủ VPS Ubuntu

1.1. Đăng nhập vào VPS qua SSH từ máy tính của bạn:
```bash
ssh root@<IP_CUA_VPS>
```

1.2. Cập nhật hệ thống và cài đặt công cụ cần thiết:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx htop
```

1.3. **(Quan trọng nếu RAM <= 2GB)** Tạo 2GB Swap Memory để tránh tràn RAM khi build Docker:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

1.4. Cài đặt Docker & Docker Compose:
```bash
# Cài Docker tự động chính hãng
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Kiểm tra phiên bản
docker --version
docker compose version
```

1.5. Cấu hình Firewall (UFW) mở các port cần thiết:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

---

### Bước 2: Cấu hình DNS Tên Miền

Truy cập nhà cung cấp tên miền của bạn (Cloudflare, Namecheap, GoDaddy, v.v.) và trỏ 3 bản ghi `A` về IP của VPS:

| Loại | Tên (Host) | Giá trị (Value) | Mục đích |
|---|---|---|---|
| `A` | `@` hoặc `yourdomain.com` | `<IP_CỦA_VPS>` | Frontend Storefront |
| `A` | `www` | `<IP_CỦA_VPS>` | Frontend Storefront phụ |
| `A` | `admin` | `<IP_CỦA_VPS>` | Frontend Backoffice (`admin.yourdomain.com`) |
| `A` | `api` | `<IP_CỦA_VPS>` | Backend NestJS API (`api.yourdomain.com`) |

*(Nếu chưa có tên miền riêng, bạn có thể tạm dùng trực tiếp IP VPS với các port `3000`, `3001`, `4000`)*.

---

### Bước 3: Tải mã nguồn nhánh `deploy`

3.1. Clone dự án về thư mục `/var/www/ecommerce-marketplace`:
```bash
cd /var/www
git clone <URL_REPO_GIT_CUA_BAN> ecommerce-marketplace
cd ecommerce-marketplace
```

3.2. Chuyển sang nhánh `deploy`:
```bash
git checkout deploy
git pull origin deploy
```

---

### Bước 4: Cấu hình biến môi trường Production (`.env`)

Tạo file `.env` ở thư mục gốc của dự án từ file mẫu:
```bash
cp .env.production.example .env
nano .env
```

Điền các thông tin thực tế của bạn:
```env
# 1. Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=MatKhauDatabaseBaoMat2026!
POSTGRES_DB=ecommerce_TMN_db

# 2. JWT Key (Tạo chuỗi ngẫu nhiên dài: chạy lệnh openssl rand -base64 32 để lấy)
JWT_SECRET=cung_cap_mot_chuoi_ngau_nhien_dai_it_nhat_32_ky_tu_123456
JWT_EXPIRATION=24h

# 3. Domains
FRONTEND_URL=https://yourdomain.com
BACKOFFICE_URL=https://admin.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com,https://www.yourdomain.com

# URL để Frontend gọi tới API (Nếu có domain dùng HTTPS, nếu dùng IP thì http://IP:4000)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api

# 4. Cloudinary (Lấy từ dashboard cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 5. Google OAuth (Tùy chọn)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback

# 6. Sentry (Tùy chọn)
SENTRY_DSN=
```
*Nhấn `Ctrl + O` để lưu, `Enter`, sau đó `Ctrl + X` để thoát.*

---

### Bước 5: Build và Khởi động Container

Chạy lệnh Docker Compose để tự động build các image và chạy background:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Kiểm tra trạng thái các container:
```bash
docker compose -f docker-compose.prod.yml ps
```

Bạn sẽ thấy 5 container đều ở trạng thái `running` / `healthy`:
1. `marketplace-postgres-prod` (Port 5432 nội bộ)
2. `marketplace-redis-prod` (Port 6379 nội bộ)
3. `marketplace-backend-prod` (Port 4000)
4. `marketplace-storefront-prod` (Port 3000)
5. `marketplace-backoffice-prod` (Port 3001)

Xem log của Backend để đảm bảo NestJS khởi động thành công:
```bash
docker logs -f marketplace-backend-prod
```

---

### Bước 6: Chạy Migration & Seed Database

Do database mới được dựng lên, bạn cần chạy Prisma Migration để tạo đầy đủ các bảng dữ liệu:

6.1. Chạy migration vào database trong container:
```bash
docker exec -it marketplace-backend-prod npx prisma migrate deploy
```

6.2. (Tùy chọn) Nạp dữ liệu mẫu ban đầu (Danh mục, Admin, Demo):
```bash
docker exec -it marketplace-backend-prod npx prisma db seed
```

---

### Bước 7: Cấu hình Nginx Reverse Proxy & SSL HTTPS (Certbot)

7.1. Copy cấu hình Nginx mẫu vào thư mục sites-available:
```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/marketplace
```

7.2. Mở file chỉnh sửa đúng tên domain của bạn:
```bash
sudo nano /etc/nginx/sites-available/marketplace
```
*(Thay thế tất cả `yourdomain.com`, `admin.yourdomain.com`, `api.yourdomain.com` bằng tên miền thực tế)*.

7.3. Kích hoạt cấu hình và kiểm tra cú pháp Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/marketplace /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

7.4. Cấp chứng chỉ bảo mật HTTPS (SSL) tự động hoàn toàn miễn phí qua Let's Encrypt:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d admin.yourdomain.com -d api.yourdomain.com
```
*Làm theo hướng dẫn trên màn hình (nhập email, chọn đồng ý).*

---

### Bước 8: Kiểm thử hệ thống sau triển khai

| Kiểm tra | Đường dẫn truy cập | Kết quả mong đợi |
|---|---|---|
| **Khách hàng** | `https://yourdomain.com` | Giao diện Next.js Storefront hiển thị mượt mà, load sản phẩm |
| **Quản trị viên** | `https://admin.yourdomain.com` | Giao diện Backoffice đăng nhập được tài khoản Admin |
| **API Health** | `https://api.yourdomain.com/api` | Trả về thông tin API |
| **Swagger Docs** | `https://api.yourdomain.com/api/docs` | Hiển thị đầy đủ tài liệu API |
| **Chat Socket** | `wss://api.yourdomain.com/socket.io/` | Kết nối WebSocket thành công |

---

## 3. PHƯƠNG ÁN 2: TRIỂN KHAI PHÂN TÁN ĐÁM MÂY (CLOUD PAAS)

Dành cho trường hợp bạn muốn dùng dịch vụ Cloud Managed Services (Free / Serverless):

### 3.1 Database & Redis (Supabase + Upstash)
1. **Database PostgreSQL:**
   - Đăng ký tại [supabase.com](https://supabase.com) tạo 1 project mới.
   - Lấy `Transaction Connection String` (dùng làm `DATABASE_URL` có pgbouncer).
   - Lấy `Direct Connection String` (dùng làm `DIRECT_URL` qua port 5432).
2. **Redis:**
   - Đăng ký tại [upstash.com](https://upstash.com) tạo Redis Database miễn phí.
   - Copy chuỗi kết nối `REDIS_URL` (dạng `rediss://default:xxx@xxx.upstash.io:6379`).

### 3.2 Backend API (Render hoặc Railway)
1. **Render ([render.com](https://render.com)):**
   - Chọn **New Web Service**, kết nối GitHub repo, chọn nhánh `deploy`.
   - **Root Directory:** `backend`
   - **Runtime:** `Node` hoặc `Docker` (Khuyến nghị chọn `Docker` để dùng Dockerfile sẵn có).
   - Điền các biến môi trường: `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `CLOUDINARY_*`, `PORT=4000`.
   - Chạy lệnh migration sau khi build: `npx prisma migrate deploy`.

### 3.3 Frontend Storefront (Vercel)
1. Truy cập [vercel.com](https://vercel.com), bấm **Add New Project**, import repo này.
2. Thiết lập:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend-storefront`
   - **Environment Variables:**
     - `NEXT_PUBLIC_API_URL` = URL Backend Render (ví dụ: `https://backend-xxx.onrender.com`)
3. Bấm **Deploy**.

### 3.4 Frontend Backoffice (Vercel hoặc Cloudflare Pages)
1. Tạo project mới trên Vercel hoặc Cloudflare Pages:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend-backoffice`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:**
     - `VITE_API_URL` = `https://backend-xxx.onrender.com/api`
2. Bấm **Deploy**.

---

## 4. BẢO MẬT & TỐI ƯU HỆ THỐNG (PRODUCTION CHECKLIST)

- [x] **CORS:** Đã cấu hình dynamic `ALLOWED_ORIGINS` chỉ cho phép Storefront & Backoffice truy cập.
- [x] **Network Binding:** Backend NestJS đã được bind vào `0.0.0.0` để phục vụ container.
- [x] **Helmet:** Đã bật HTTP Security Headers bảo vệ chống XSS, Clickjacking, MIME-sniffing.
- [x] **Throttler (Rate Limiting):** Đã cấu hình giới hạn số lượt request để chống tấn công brute-force / DDoS.
- [x] **Database Isolation:** Database Postgres và Redis không mở public port ra ngoài Internet khi chạy qua Docker nội bộ.
- [x] **Winston Logger & Daily Rotate:** Ghi log hệ thống xoay vòng theo ngày để tránh tràn đĩa cứng.

---

## 5. QUY TRÌNH CẬP NHẬT CODE (RELEASE FLOW)

Khi bạn có bản cập nhật code mới, thực hiện quy trình sau trên VPS:

```bash
# 1. Di chuyển vào thư mục dự án
cd /var/www/ecommerce-marketplace

# 2. Kéo code mới nhất từ nhánh deploy
git pull origin deploy

# 3. Build lại và cập nhật container không gián đoạn
docker compose -f docker-compose.prod.yml up -d --build

# 4. Chạy migration nếu có thay đổi trong schema DB
docker exec -it marketplace-backend-prod npx prisma migrate deploy

# 5. Dọn dẹp các Docker image cũ không còn sử dụng
docker image prune -f
```

---

## 6. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

### 6.1 Lỗi "Out of Memory" khi build Next.js hoặc Docker
- **Nguyên nhân:** VPS có ít RAM (1GB hoặc 2GB).
- **Khắc phục:** Đảm bảo đã bật 2GB Swap Memory (xem Bước 1.3). Hoặc build image trên máy local rồi push lên Docker Hub, sau đó chỉ cần pull về VPS chạy.

### 6.2 Lỗi CORS khi gọi API từ Browser
- **Triệu chứng:** Console báo `Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy`.
- **Khắc phục:** Kiểm tra biến `ALLOWED_ORIGINS` trong file `.env` đã có chính xác tên miền của Frontend (bao gồm cả `https://` và không có dấu `/` ở cuối). Sau đó restart lại backend:
  ```bash
  docker compose -f docker-compose.prod.yml restart backend
  ```

### 6.3 Lỗi kết nối WebSocket Chat (Socket.IO)
- **Triệu chứng:** Chat không nhận tin nhắn thời gian thực, báo lỗi polling/websocket.
- **Khắc phục:** Đảm bảo trong cấu hình Nginx đã có block `proxy_set_header Upgrade $http_upgrade;` và `proxy_set_header Connection "upgrade";` cho location `/socket.io/`.

### 6.4 Muốn xem log để gỡ lỗi
```bash
# Xem log toàn bộ hệ thống
docker compose -f docker-compose.prod.yml logs -f

# Xem riêng log backend
docker logs -f marketplace-backend-prod

# Xem riêng log storefront
docker logs -f marketplace-storefront-prod
```
