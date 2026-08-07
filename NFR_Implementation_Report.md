# Báo cáo triển khai Non-Functional Requirements (Yêu cầu phi chức năng)

Tài liệu này giải thích chi tiết cách hệ thống E-commerce Marketplace (nhiều nhà bán hàng) áp dụng các khía cạnh Non-Functional Requirements (NFR) để đảm bảo hệ thống có khả năng mở rộng, bảo mật, nhất quán dữ liệu và dễ dàng bảo trì.

## 1. Hiệu suất và Khả năng mở rộng (Performance & Scalability)

- **Redis Caching (Quản lý bộ nhớ đệm):** 
  - Hệ thống sử dụng Redis để lưu trữ toàn bộ dữ liệu Giỏ hàng (Cart) thay vì lưu trên PostgreSQL. Điều này giảm đáng kể tải (load) cho database chính khi người dùng liên tục thêm, bớt, hoặc sửa số lượng sản phẩm.
  - Sử dụng module `CacheModule` với `cache-manager-redis-yet` để cache các dữ liệu có tần suất truy cập cao nhưng ít thay đổi (ví dụ: danh sách danh mục, cấu hình CMS).
- **Rate Limiting (Chống Spam API):** 
  - Tích hợp `@nestjs/throttler` để giới hạn số lượng request từ một địa chỉ IP trong một khoảng thời gian nhất định. Giúp hệ thống chống lại các đợt tấn công DDoS nhỏ lẻ hoặc bot spam tạo request ảo.
- **Tối ưu kết nối Database (Connection Pooling):** 
  - Sử dụng Prisma ORM để tự động xử lý và tối ưu hóa Connection Pooling, tránh tình trạng cạn kiệt kết nối (Connection Exhaustion) tới PostgreSQL khi lượng traffic tăng đột biến.

## 2. Tính toàn vẹn Dữ liệu & Xử lý Đồng thời (Data Integrity & Concurrency)

- **Optimistic Locking (Khóa lạc quan):**
  - Vấn đề **Race Condition** (nhiều người cùng mua 1 sản phẩm flash sale cùng lúc) được xử lý triệt để bằng trường `version` trong bảng `Product`. 
  - Tại bước thanh toán, hệ thống sẽ tự động cập nhật version. Lệnh update sẽ thất bại nếu version đã bị người khác thay đổi trước đó 1 mili-giây, ngăn chặn tuyệt đối tình trạng bán vượt quá số lượng tồn kho (overselling).
- **Database Transactions (Giao dịch ACID):**
  - Mọi thao tác ghi dữ liệu liên quan đến luồng quan trọng (ví dụ: Tạo đơn hàng -> Cập nhật tồn kho -> Ghi Audit Log) đều được gói gọn trong một khối `prisma.$transaction`. Nếu một bước thất bại, toàn bộ quá trình sẽ được tự động hoàn tác (rollback), đảm bảo tính toàn vẹn tuyệt đối.

## 3. Độ tin cậy & Giám sát Hệ thống (Reliability & Monitoring)

- **Health Checks (Kiểm tra sức khỏe hệ thống):**
  - Tích hợp thư viện `@nestjs/terminus` để xây dựng API `/api/health`. 
  - Endpoint này tự động kiểm tra xem ứng dụng có đang kết nối thành công với PostgreSQL và Redis hay không. Nếu ứng dụng được deploy trên Docker hoặc Kubernetes, hệ thống điều phối sẽ sử dụng endpoint này để tự động restart container nếu ứng dụng bị treo.
- **Centralized Error Tracking (Giám sát lỗi tập trung):**
  - Tích hợp **Sentry** (`@sentry/nestjs` và `@sentry/node`) vào ứng dụng để tự động thu thập và báo cáo các lỗi Runtime chưa được bắt (Unhandled Exceptions).
  - Giúp team phát triển nhận được thông báo lỗi ngay lập tức qua email/dashboard kèm theo call-stack chi tiết thay vì phải thủ công tra cứu file log trên server.

## 4. Bảo mật & Tính minh bạch (Security & Compliance)

- **Authentication & Authorization (Xác thực và Phân quyền):**
  - Sử dụng Passport JWT để bảo mật các API.
  - Phân quyền chặt chẽ bằng Role-based Access Control (RBAC) với các Guards (`@Roles()`), tách biệt rành mạch quyền hạn của `CUSTOMER`, `SELLER` và `ADMIN`.
- **Hệ thống Audit Log (Dấu vết kiểm toán):**
  - Triển khai cấu trúc bảng đa hình (Polymorphic schema) thông qua `targetType` và `targetId` để ghi nhận lại toàn bộ lịch sử thao tác quan trọng của Admin (cập nhật CMS, kiểm duyệt sản phẩm, xử lý khiếu nại).
  - Đảm bảo tính **Accountability (Trách nhiệm giải trình)**: Hệ thống ghi nhận rõ ràng ai đã làm gì, vào thời gian nào, và dữ liệu JSON chi tiết (trước/sau khi đổi) để dễ dàng đối soát khi xảy ra tranh chấp.
- **Bảo vệ ứng dụng Web:**
  - Áp dụng `helmet` để che giấu thông tin framework và bổ sung các HTTP headers bảo mật (ngăn chặn XSS, Clickjacking).
  - Cấu hình `cors` chặt chẽ, chỉ cho phép các domain được cấp quyền giao tiếp với backend API.

## 5. Thiết kế Kiến trúc (Architectural Design)

- **Order Splitting (Phân tách đơn hàng logic):**
  - Trong nghiệp vụ Checkout của Marketplace, 1 giỏ hàng có thể chứa sản phẩm của 3 nhà bán (Seller) khác nhau. Hệ thống backend sẽ tự động bóc tách giỏ hàng đó thành 3 bản ghi `Order` riêng biệt thuộc về 3 Seller. 
  - Điều này giải quyết hoàn toàn sự ràng buộc logic (Logical Coupling), giúp mỗi Seller có thể phê duyệt hoặc từ chối đơn hàng độc lập mà không ảnh hưởng tới doanh thu của các Seller khác trong cùng phiên thanh toán đó.
- **Kiến trúc Monorepo:**
  - Mã nguồn được tổ chức theo cấu trúc Workspace, tách biệt rõ ràng 3 project: Backend (NestJS), Frontend Storefront (Next.js cho khách) và Frontend Backoffice (Next.js cho Admin/Seller).
  - Tổ chức này giúp việc phát triển được chuyên biệt hóa, dễ dàng mở rộng team (Scale nhân sự) mà vẫn chia sẻ chung các tài nguyên dễ dàng khi cần.
