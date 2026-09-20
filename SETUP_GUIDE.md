# 📦 E-commerce Marketplace TMN — Hướng Dẫn Cài Đặt Dự Án

> Tài liệu này hướng dẫn từng bước để một người mới có thể **cài đặt và chạy toàn bộ dự án** từ đầu trên máy local.

---

## 📐 Tổng Quan Kiến Trúc

```
ecommerce-marketplace-TMN/
├── backend/               # NestJS API (Port 4000)
├── frontend-storefront/   # Next.js — Giao diện khách hàng (Port 3000)
├── frontend-backoffice/   # Vite + React — Giao diện quản trị (Port 3001)
└── docker-compose.yml     # PostgreSQL + PgBouncer + Redis
```

| Service | Công nghệ | Port |
|---|---|---|
| Backend API | NestJS + TypeScript + Prisma | `4000` |
| Storefront (Khách hàng) | Next.js 16 + React 19 + TypeScript | `3000` |
| Backoffice (Quản trị) | Vite + React 19 + TypeScript + MUI | `3001` |
| Database | PostgreSQL 15 (qua Docker) | `5432` |
| Connection Pool | PgBouncer (qua Docker) | `6432` |
| Cache | Redis 7 (qua Docker) | `6379` |

---

## 🖥️ Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo máy bạn đã cài đặt các phần mềm sau:

| Phần mềm | Phiên bản tối thiểu | Link tải |
|---|---|---|
| **Node.js** | v18+ (khuyến nghị v20+) | [nodejs.org](https://nodejs.org/) |
| **npm** | v9+ (đi kèm Node.js) | — |
| **Docker Desktop** | Phiên bản mới nhất | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | Phiên bản mới nhất | [git-scm.com](https://git-scm.com/) |

### Kiểm tra phiên bản sau khi cài

```bash
node -v      # Phải hiện v18.x.x trở lên
npm -v       # Phải hiện v9.x.x trở lên
docker -v    # Phải hiện Docker version ...
git -v       # Phải hiện git version ...
```

---

## 🚀 Hướng Dẫn Cài Đặt Từng Bước

### Bước 1 — Clone Repository

```bash
git clone <your-repo-url>
cd ecommerce-marketplace-TMN
```

---

### Bước 2 — Cài Đặt Dependencies

Dự án sử dụng **npm workspaces**, bạn chỉ cần chạy **một lệnh duy nhất** từ thư mục gốc để cài đặt cho tất cả các workspace (backend + cả hai frontend):

```bash
npm install
```

> ✅ Lệnh này sẽ tự động cài đặt `node_modules` cho `backend/`, `frontend-storefront/`, và `frontend-backoffice/`.

---

### Bước 3 — Khởi Động Database & Redis (Docker)

Dự án sử dụng Docker để chạy PostgreSQL, PgBouncer và Redis. **Đây là bước bắt buộc trước khi chạy backend.**

Đảm bảo Docker Desktop đang chạy, sau đó chạy lệnh sau từ thư mục gốc:

```bash
docker compose up -d
```

Lệnh này sẽ tự động tải và khởi động 3 service:

| Container | Mô tả | Port |
|---|---|---|
| `marketplace-postgres` | PostgreSQL database | `5432` |
| `marketplace-pgbouncer` | Connection pooler cho Postgres | `6432` |
| `marketplace-redis` | Cache Redis | `6379` |

**Kiểm tra các container đang chạy:**
```bash
docker ps
```

Bạn sẽ thấy 3 container đang ở trạng thái `Up`.

> 💡 Để dừng tất cả container: `docker compose down`

---

### Bước 4 — Cấu Hình Biến Môi Trường (`.env`)

Bạn cần tạo file `.env` cho **backend** và cả hai **frontend**.

#### 4.1 Backend (`backend/.env`)

Tạo file `backend/.env` bằng cách copy từ file mẫu:

```bash
# Windows (PowerShell)
copy backend\.env.example backend\.env

# macOS / Linux
cp backend/.env.example backend/.env
```

Sau đó mở file `backend/.env` và điền các giá trị:

```env
# Database (kết nối qua PgBouncer - connection pooling)
DATABASE_URL="postgresql://postgres:root@localhost:6432/ecommerce_TMN_db?schema=public&pgbouncer=true"

# Direct URL (dùng cho Prisma migrations - kết nối trực tiếp)
DIRECT_URL="postgresql://postgres:root@localhost:5432/ecommerce_TMN_db?schema=public"

# Server
PORT=4000

# Sentry (bỏ trống hoặc dùng dummy nếu chưa có)
SENTRY_DSN="https://dummy@sentry.io/123"

# JWT Authentication
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRATION="24h"

# Cloudinary (lưu trữ ảnh) - Đăng ký miễn phí tại cloudinary.com
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Google OAuth - Lấy từ Google Cloud Console
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/auth/google/callback"
```

> ⚠️ **Lưu ý:** Nếu chưa muốn dùng Google OAuth và Cloudinary, hãy điền giá trị placeholder. Backend sẽ vẫn chạy nhưng các tính năng login Google và upload ảnh sẽ không hoạt động.

**Tóm tắt ý nghĩa các biến quan trọng:**

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Kết nối DB qua PgBouncer (port `6432`) — dùng cho query thông thường |
| `DIRECT_URL` | Kết nối DB trực tiếp (port `5432`) — dùng cho Prisma migrate |
| `JWT_SECRET` | Khóa bí mật để ký JWT token, có thể là chuỗi bất kỳ |
| `CLOUDINARY_*` | Thông tin tài khoản Cloudinary để upload ảnh sản phẩm |
| `GOOGLE_CLIENT_ID/SECRET` | Thông tin OAuth app từ Google Cloud Console |

---

#### 4.2 Frontend Storefront (`frontend-storefront/.env.local`)

```bash
# Windows (PowerShell)
copy frontend-storefront\.env.example frontend-storefront\.env.local

# macOS / Linux
cp frontend-storefront/.env.example frontend-storefront/.env.local
```

Nội dung file `frontend-storefront/.env.local`:

```env
# URL của Backend API
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

#### 4.3 Frontend Backoffice (`frontend-backoffice/.env`)

```bash
# Windows (PowerShell)
copy frontend-backoffice\.env.example frontend-backoffice\.env

# macOS / Linux
cp frontend-backoffice/.env.example frontend-backoffice/.env
```

Nội dung file `frontend-backoffice/.env`:

```env
# URL của Backend API (bao gồm /api prefix)
VITE_API_URL="http://localhost:4000/api"
```

---

### Bước 5 — Khởi Tạo Database với Prisma

Sau khi Docker đang chạy và file `.env` đã được cấu hình đúng, chạy các lệnh sau từ thư mục **`backend/`**:

```bash
cd backend
```

#### 5.1 Generate Prisma Client

Tạo Prisma Client dựa trên schema đã định nghĩa:

```bash
npx prisma generate
```

#### 5.2 Chạy Migrations

Áp dụng tất cả các migration để tạo bảng trong database:

```bash
npx prisma migrate deploy
```

> 💡 Lệnh này sẽ tạo toàn bộ cấu trúc bảng trong database bao gồm: Users, Products, Orders, Categories, Reviews, Disputes, FlashSales, v.v.

#### 5.3 Seed Dữ Liệu Mẫu (Tùy chọn nhưng khuyến nghị)

Để có dữ liệu mẫu (categories, users, products) để test:

```bash
npx prisma db seed
```

#### 5.4 Quay lại thư mục gốc

```bash
cd ..
```

---

### Bước 6 — Chạy Toàn Bộ Hệ Thống

Từ thư mục gốc của dự án, chạy lệnh:

```bash
npm run dev
```

Lệnh này sẽ khởi động **đồng thời** tất cả 3 server:

```
=== SYSTEM ACCESS URLS ===
 Frontend Storefront : http://localhost:3000
 Frontend Backoffice : http://localhost:3001
 Backend NestJS API  : http://localhost:4000
=================================
```

> ⚠️ **Windows Note:** Nếu terminal bị "đóng băng" sau khi chạy `npm run dev`, hãy click vào terminal đó rồi nhấn `Enter` hoặc `Esc` để tiếp tục. Đây là tính năng Windows Quick Edit Mode.

---

## 🌐 Các URL Truy Cập

| Dịch vụ | URL | Mô tả |
|---|---|---|
| **Storefront** | http://localhost:3000 | Giao diện mua sắm cho khách hàng |
| **Backoffice** | http://localhost:3001 | Dashboard quản trị |
| **Backend API** | http://localhost:4000 | REST API NestJS |
| **Swagger UI** | http://localhost:4000/api/docs | Tài liệu và test API trực tiếp |

---

## 📋 Tóm Tắt Các File `.env` Cần Tạo

| File | Copy từ |
|---|---|
| `backend/.env` | `backend/.env.example` |
| `frontend-storefront/.env.local` | `frontend-storefront/.env.example` |
| `frontend-backoffice/.env` | `frontend-backoffice/.env.example` |

---

## 🗂️ Cấu Trúc Database

Database sử dụng **PostgreSQL** với **Prisma ORM**. Các bảng chính:

| Model | Mô tả |
|---|---|
| `User` | Người dùng (CUSTOMER / SELLER / ADMIN) |
| `Product` | Sản phẩm của người bán |
| `Category` | Danh mục sản phẩm |
| `Order` | Đơn hàng |
| `OrderItem` | Chi tiết từng sản phẩm trong đơn hàng |
| `Transaction` | Giao dịch tài chính |
| `Review` | Đánh giá sản phẩm |
| `ReviewReply` | Phản hồi đánh giá từ seller |
| `Waitlist` | Danh sách chờ sản phẩm hết hàng |
| `FlashSale` | Chương trình flash sale |
| `Dispute` | Khiếu nại của khách hàng |
| `DisputeMessage` | Tin nhắn trong khiếu nại |
| `AuditLog` | Lịch sử hành động admin |
| `StorefrontConfig` | Cấu hình giao diện storefront |

---

## 🔧 Scripts Hữu Ích

### Toàn bộ dự án (từ thư mục gốc)

```bash
npm run dev          # Chạy tất cả 3 server cùng lúc
npm install          # Cài đặt dependencies cho toàn bộ workspace
```

### Backend (trong thư mục `backend/`)

```bash
npm run start:dev    # Chạy backend với hot-reload
npm run start:prod   # Chạy backend production
npm run build        # Build TypeScript
npm run test         # Chạy unit tests
npm run test:e2e     # Chạy end-to-end tests
npm run test:cov     # Chạy tests với coverage report

npx prisma studio          # Mở GUI quản lý database
npx prisma generate        # Tái tạo Prisma Client
npx prisma migrate deploy  # Áp dụng migrations
npx prisma db seed         # Seed dữ liệu mẫu
```

### Frontend Storefront (trong thư mục `frontend-storefront/`)

```bash
npm run dev          # Chạy dev server tại port 3000
npm run build        # Build production
npm run lint         # Kiểm tra lỗi ESLint
```

### Frontend Backoffice (trong thư mục `frontend-backoffice/`)

```bash
npm run dev          # Chạy dev server tại port 3001
npm run build        # Build production
npm run lint         # Kiểm tra lỗi ESLint
npm run preview      # Preview bản build production
```

### Docker

```bash
docker compose up -d      # Khởi động tất cả services (nền)
docker compose down       # Dừng tất cả services
docker compose logs -f    # Xem logs realtime
docker compose restart    # Khởi động lại tất cả services
```

---

## 🔐 Hướng Dẫn Lấy API Keys

### Cloudinary (Upload ảnh sản phẩm)

1. Truy cập [cloudinary.com](https://cloudinary.com/) và tạo tài khoản miễn phí
2. Vào **Dashboard** → Copy `Cloud Name`, `API Key`, `API Secret`
3. Điền vào `backend/.env`

### Google OAuth (Đăng nhập bằng Google)

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo dự án mới (hoặc chọn dự án hiện có)
3. Vào **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
4. Application type: **Web application**
5. Thêm Authorized redirect URI: `http://localhost:4000/api/auth/google/callback`
6. Copy `Client ID` và `Client Secret` vào `backend/.env`

---

## 🛠️ Xử Lý Sự Cố Thường Gặp

### ❌ Lỗi kết nối Database

**Triệu chứng:** `Can't reach database server at localhost:6432`

**Giải pháp:**
1. Kiểm tra Docker Desktop đang chạy
2. Chạy `docker ps` — đảm bảo 3 container đang ở trạng thái `Up`
3. Nếu không, chạy lại: `docker compose up -d`

---

### ❌ Lỗi Prisma Client không tìm thấy

**Triệu chứng:** `@prisma/client did not initialize yet` hoặc lỗi import

**Giải pháp:**
```bash
cd backend
npx prisma generate
```

---

### ❌ Port đã bị chiếm dụng

**Triệu chứng:** `Error: listen EADDRINUSE: address already in use :::4000`

**Giải pháp (Windows PowerShell):**
```powershell
# Tìm process đang chiếm port
netstat -ano | findstr :4000

# Kill process (thay <PID> bằng số PID tìm được)
taskkill /PID <PID> /F
```

**Giải pháp (macOS / Linux):**
```bash
lsof -ti:4000 | xargs kill -9
```

---

### ❌ `npm install` lỗi trên Windows

**Triệu chứng:** Lỗi liên quan đến symlinks hoặc permissions

**Giải pháp:**
```bash
# Chạy terminal với quyền Administrator, sau đó:
npm install --legacy-peer-deps
```

---

### ❌ Docker compose lỗi với PgBouncer

**Triệu chứng:** Container `marketplace-pgbouncer` liên tục restart

**Giải pháp:** Đảm bảo container PostgreSQL đã khởi động hoàn toàn trước. Chờ 5-10 giây rồi chạy lại:
```bash
docker compose restart pgbouncer
```

---

## 📖 Tài Liệu Tham Khảo

| Công nghệ | Tài liệu |
|---|---|
| NestJS | https://docs.nestjs.com |
| Prisma | https://www.prisma.io/docs |
| Next.js | https://nextjs.org/docs |
| Vite | https://vitejs.dev/guide |
| Docker Compose | https://docs.docker.com/compose |
| Swagger API (local) | http://localhost:4000/api/docs |

---

*Tài liệu được tạo bởi SapotaCorp — Cập nhật lần cuối: Tháng 9, 2026*
