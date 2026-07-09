# HƯỚNG DẪN DÀNH CHO AI AGENTS - NESTJS BACKEND

Tuyệt đối tuân thủ các quy tắc nghiêm ngặt sau đây khi phát triển phân hệ Backend (NestJS):

1. **Bắt buộc dùng Dependency Injection (DI)**
   - Không được tự ý khởi tạo instance bằng `new` đối với các Service, Repository, hay Provider.
   - Toàn bộ dependency phải được inject thông qua `constructor` của Class và khai báo đầy đủ trong `providers` của Module tương ứng.

2. **Nghiêm cấm sử dụng kiểu dữ liệu `any`**
   - Phải khai báo kiểu dữ liệu rõ ràng (Strong Typing). Sử dụng `unknown` nếu thực sự không xác định được kiểu dữ liệu tại thời điểm biên dịch.
   - Tuyệt đối không dùng các comment vô hiệu hóa kiểu hoặc linter cảnh báo liên quan đến `any` (như `@ts-ignore` hay `eslint-disable-next-line @typescript-eslint/no-explicit-any`).

3. **Truy vấn Database qua Prisma Service & Schema**
   - Bắt buộc đọc và đối chiếu chính xác cấu trúc dữ liệu định nghĩa trong file `backend/prisma/schema.prisma` trước khi viết bất kỳ truy vấn hay logic nghiệp vụ nào.
   - Mọi thao tác ghi và đọc dữ liệu phải đi qua `PrismaService` được inject trực tiếp. Không tự ý kết nối DB ngoài luồng hoặc dùng raw SQL khi không có yêu cầu đặc biệt.

4. **Sử dụng DTO (Data Transfer Object) cho mọi Request**
   - Mọi dữ liệu đầu vào (bao gồm Request Body, Query Parameters, và Path Parameters) đều bắt buộc phải định nghĩa bằng Class DTO riêng biệt.
   - Bắt buộc gắn các decorator xác thực từ `class-validator` (ví dụ: `@IsString()`, `@IsNotEmpty()`, `@IsInt()`) để bảo vệ luồng dữ liệu đầu vào.

5. **Order Checkout & Concurrency Handling**
   - Bắt buộc sử dụng field `version` trong model `Product` khi trừ kho (stock) thông qua `updateMany` để tránh Race Condition (Optimistic Locking).
   - Phải xử lý logic Retry (tối đa 3 lần) nếu xảy ra lỗi phiên bản.
   - Mọi thao tác checkout phải nằm trong một Prisma Interactive ``.
   - Lấy giỏ hàng từ `CartService` và thông tin user từ `@GetUser()`, không được nhận từ payload để đảm bảo an toàn.
