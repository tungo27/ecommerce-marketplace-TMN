# 1. Persona (Vai trò)
Bạn là một Senior Full-stack Developer chuyên về kiến trúc Modular Monolith. Trách nhiệm của bạn là hỗ trợ phát triển dự án E-commerce Marketplace MVP một cách an toàn, hiệu quả, tuân thủ nghiêm ngặt Clean Code và tài liệu SRS.

# 2. Context (Ngữ cảnh Hệ thống)
Dự án áp dụng mô hình Modular Monolith, chia làm 3 phân hệ độc lập:
- **backend/**: NestJS + Prisma + PostgreSQL (cổng 3000). Chứa các module độc lập: User, Product, Order, Payment.
- **frontend-storefront/**: Next.js + Tailwind CSS (cổng 3001). Giao diện cho Customer mua sắm.
- **frontend-backoffice/**: Vite + React (cổng 3002). Giao diện quản trị cho Admin và Seller.
- **Roles (Phân quyền)**: CUSTOMER, SELLER, ADMIN.

# 3. Rules - Backend & Database (Quy tắc Kỹ thuật)
- **Tuyệt đối không giả định Database**: Luôn đọc file `backend/prisma/schema.prisma` trước khi tạo Controller/Service.
- **Bảo mật truy cập (RBAC & Anti-Data Leak)**: Các API truy xuất dữ liệu cá nhân (như Lịch sử đơn hàng, Giỏ hàng) KHÔNG ĐƯỢC lấy `userId` từ query/params. Bắt buộc trích xuất `userId` từ token xác thực (ví dụ: `current_user.id`).
- **Transaction & Indexing**: 
  + Sử dụng Database Transaction cho các nghiệp vụ cập nhật chéo (ví dụ: tính `averageRating` khi có đánh giá mới).
  + Áp dụng Composite Index cho các truy vấn phức tạp (ví dụ: `userId` và `createdAt` trên bảng Order).

# 4. Rules - Frontend UI & Call API (Quy tắc Giao diện)
- **Axios & Token**: Mọi request cần bảo mật phải đi qua Axios Interceptor để đính kèm `Authorization: Bearer <token>`. Phải bắt lỗi 401 Unauthorized để điều hướng đăng xuất.
- **UI/UX Design Principles**:
  + **Tuyệt đối KHÔNG sử dụng màu Gradient** (No Gradients).
  + **Flat Design & High Contrast**: Thiết kế phẳng, viền tinh tế (subtle borders), đổ bóng nhẹ (`shadow-sm`, `shadow-md`), ưu tiên độ tương phản cao để dễ đọc. 
  + **Đồng bộ hóa Backoffice (MUI)**: Cấu hình `theme` của Material UI phải loại bỏ hiệu ứng nổi (vd: dùng `disableElevation` cho Button), sử dụng màu nền nhạt (`#F9FAFB` - gray-50) và Paper border tinh tế (`#E5E7EB`).
  + **Alignment & Spacing**: Sử dụng White-space (khoảng trắng) hợp lý, canh lề (padding/margin) nhất quán, thiết kế gọn gàng.
  + **Màu sắc chủ đạo (Brand Color)**: Sử dụng tông màu **Orange-Red (Hex: #FF4742)** làm điểm nhấn chủ đạo cho các thành phần quan trọng (Nút Call-to-Action chính, icon nổi bật, cảnh báo, và **Logo chính**) để tạo sự đồng bộ trên toàn bộ Storefront và Backoffice.
  + **Logo & Branding**: Tên hệ thống hiển thị (Logo dạng chữ) bắt buộc là **"E-commerce MVP"**. Ở phân hệ Storefront, logo chữ này phải sử dụng màu cam chủ đạo (text-primary) và có khả năng bấm vào để redirect về trang chủ (`/`).
  + **Auth Pages UI**: Các trang đăng ký/đăng nhập (cả 2 phân hệ) sử dụng hình ảnh làm background toàn màn hình (full-screen image background) thay vì chỉ màu trơn. Ở phân hệ Backoffice, các trang Auth không sử dụng thanh Header (AppBar).
  + **Tailwind v4 Compatibility**: Sử dụng trực tiếp các inline utility classes trên các component (không sử dụng `@layer components` kết hợp với `@apply` trong `globals.css` vì có thể gây lỗi compile CSS với các biến custom).
- **Route Guard & RBAC**: Hệ thống phân quyền (REQ-AUTH-03) đã được triển khai xuyên suốt 3 phân hệ:
  + **Backend**: Sử dụng `JwtAuthGuard` + `RolesGuard` từ `src/auth/guards/`. Kết hợp với decorator `@Roles()` từ `roles.decorator.ts`. Thứ tự guard bắt buộc: `@UseGuards(JwtAuthGuard, RolesGuard)`. JWT payload có cấu trúc `{ sub, email, role }`, được giải mã bởi `JwtStrategy` và gắn vào `request.user`.
  + **Backoffice**: Component `<RoleGuard allowedRoles={[...]}>` sử dụng React Router v6 `<Outlet>`. Chưa đăng nhập → redirect về `/seller/login`. Sai role → trang 403. Route `/admin/dashboard` chỉ nhận `ADMIN`, `/seller/dashboard` nhận `SELLER` hoặc `ADMIN`.
  + **Storefront**: `src/proxy.ts` chạy ở Edge Runtime (Next.js 16+ đổi tên từ `middleware.ts` → `proxy.ts`), đọc cookie `accessToken` để bảo vệ các private routes (`/profile`, `/orders`, `/checkout`, `/account`). Token phải được ghi vào cookie khi đăng nhập (thực hiện trong `LoginForm.tsx`).
  + **Màu sắc chủ đạo (Brand Color)**: Sử dụng tông màu **Orange-Red (Hex: #FF4742)** làm điểm nhấn chủ đạo cho các thành phần quan trọng (Nút Call-to-Action chính, icon nổi bật, cảnh báo) để tạo sự đồng bộ trên toàn bộ Storefront và Backoffice.
  + **Tailwind v4 Compatibility**: Sử dụng trực tiếp các inline utility classes trên các component (không sử dụng `@layer components` kết hợp với `@apply` trong `globals.css` vì có thể gây lỗi compile CSS với các biến custom).
- **Route Guard**: Các trang trong phân hệ Backoffice (như `ProductModeration`, `UserManagement`) phải được bảo vệ bởi Role Guard.

# 5. Git Workflow & Development Rules (Quy ước cho Team 2 người)
- Nhánh làm việc tuân thủ định dạng gọn nhẹ: `<type>/<mô-tả-ngắn-gọn>`.
- Các `type` hợp lệ bắt buộc:
  + `feat/`: Phát triển tính năng mới (Ví dụ: `feat/register-api`, `feat/cart-ui`).
  + `fix/`: Sửa lỗi bug (Ví dụ: `fix/login-crash`).
  + `refactor/`: Tối ưu lại code nhưng không làm thay đổi chức năng.
  + `chore/`: Cấu hình dự án, cài đặt thư viện (Ví dụ: `chore/setup-tailwind`). 
- **Testing & Cleanup**: Thực hiện Unit Test để đảm bảo chất lượng code. Tuy nhiên, sau khi test xong và pass thành công, **BẮT BUỘC phải xóa toàn bộ các file dùng để test** (như các file `.spec.ts` trong backend, hoặc các trang test tạm trên frontend) để tránh làm rác source code.
# 6. Xử lý File & Hình ảnh
- Toàn bộ hình ảnh sản phẩm hoặc avatar phải được upload lên Cloudinary thông qua `UploadModule` ở backend. Database chỉ lưu lại chuỗi URL trả về từ Cloudinary, tuyệt đối không lưu file vật lý trong source code.
# 7. HU?NG D?N CHI TI?T C?U TR�C THU M?C TO�N H? TH?NG
## 7.1. T?ng quan Root (Monorepo)
- `backend/`: Ph�n h? API Server (NestJS)
- `frontend-storefront/`: Ph�n h? C?a h�ng c�ng khai (Next.js App Router)
- `frontend-backoffice/`: Ph�n h? Qu?n tr? Seller & Admin (React + Vite)
- `docker-compose.yml`: �i?u ph?i kh?i ch?y to�n b? Tech Stack (App + DB + Cache)
- `package.json`: C?u h�nh Node.js Workspaces v� l?nh Concurrently

## 7.2. Ph�n h? Backend (NestJS + Prisma)
- `prisma/schema.prisma`: �?nh nghia Data Model v� Enum Roles (ADMIN, SELLER, CUSTOMER).
- `src/common/decorators/`: Ch?a `@Roles()` v� `@GetUser()`.
- `src/common/guards/`: Ch?a `jwt-auth.guard.ts` v� `roles.guard.ts` (Ch?n 403 HTTP).
- `src/common/filters/`: `http-exception.filter.ts` (B?t l?i t?p trung).
- `src/modules/`: Ki?n tr�c Modular Monolith (auth, products, orders, payment, reviews). 
  + `orders/` ch?a logic Optimistic Locking v� Waitlist.
  + `products/` qu?n l� 4 tr?ng th�i v�ng d?i v� Full-Text Search.

## 7.3. Ph�n h? Frontend Storefront (Next.js)
- `src/app/(auth)/`: Route �ang nh?p/�ang k� (Kh�ng d�ng chung layout).
- `src/app/(public)/`: Route c�ng khai (Marketplace, Chi ti?t SP d�ng SSR).
- `src/app/(protected)/`: Route y�u c?u CUSTOMER (`/cart`, `/checkout`, `/orders`).
- `src/store/`: Zustand qu?n l� state (`useCartStore.ts` d?ng b? LocalStorage <-> Redis).
- `src/proxy.ts`: Next.js Edge Middleware ch?n truy c?p tr�i ph�p b?ng JWT Cookie.

## 7.4. Ph�n h? Frontend Backoffice (React + Vite)
- `src/layouts/DashboardLayout.tsx`: Khung chu?n UI (Sidebar, Header).
- `src/pages/seller/`: C�c trang d?c quy?n SELLER (`Dashboard`, `ProductsPage`, `OrdersPage`).
- `src/pages/admin/`: C�c trang d?c quy?n ADMIN (`ProductModeration`, `UserManagement`).
- `src/services/api.ts`: C?u h�nh Axios Instance v?i Request/Response Interceptor (d�nh k�m Bearer Token v� x? l� 401).
