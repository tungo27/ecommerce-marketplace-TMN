# HƯỚNG DẪN DÀNH CHO AI AGENTS - REACT VITE BACKOFFICE

Tuyệt đối tuân thủ các quy tắc nghiêm ngặt sau đây khi phát triển phân hệ Backoffice (Vite + React + Material UI):

1. **Không nhầm lẫn với Next.js**
   - Phân hệ `frontend-backoffice` là ứng dụng Single Page Application (SPA) xây dựng trên nền tảng **React + Vite**.
   - Tuyệt đối không sử dụng Next.js App Router, Edge runtime, server components, hay bất kỳ API nào thuộc framework Next.js tại thư mục này.

2. **Tách biệt logic API ra Custom Hooks**
   - Không gọi Axios hoặc thực hiện các cuộc gọi mạng trực tiếp bên trong các component giao diện (UI Components).
   - Toàn bộ luồng kết nối API, xử lý bất đồng bộ, loading, error, và định dạng dữ liệu trả về bắt buộc phải được đóng gói gọn gàng trong các Custom Hooks.

3. **Quản lý Global State bằng Zustand**
   - Sử dụng Zustand để quản lý các trạng thái toàn cục của ứng dụng (như Auth Store, Config Store, UI Store).
   - Tuyệt đối không lạm dụng React Context API hoặc thực hiện truyền props liên cấp không cần thiết (Prop Drilling).

4. **Thiết kế Flat Design & Brand Color #FF4742**
   - Sử dụng tông màu cam đỏ chính hãng **Orange-Red (Hex: #FF4742)** làm màu chủ đạo (Primary Color) cho các nút bấm chính (Call-to-Action), biểu tượng nổi bật, trạng thái cảnh báo quan trọng.
   - Tuân thủ phong cách Flat Design phẳng hoàn toàn:
     - Không sử dụng màu Gradient (No Gradients).
     - Loại bỏ hiệu ứng nổi, bóng đổ dày (ví dụ: cấu hình `disableElevation` cho các Material UI Button).
     - Ưu tiên sử dụng viền tinh tế (subtle border `#E5E7EB`) kết hợp khoảng trắng (White-space) rộng rãi, nhất quán để phân chia bố cục.
     - Sử dụng bóng đổ nhẹ (`shadow-sm` hoặc `shadow-md`) trên nền nhạt nhẽo dạng phẳng (`#F9FAFB`).
