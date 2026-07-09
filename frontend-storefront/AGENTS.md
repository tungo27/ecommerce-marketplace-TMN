<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 1. Frontend UI & Form Rules
- **Form & Validation**: Bắt buộc sử dụng `react-hook-form` kết hợp với `zod` để validate tất cả các form (đặc biệt là form Checkout). Thêm dấu `*` màu đỏ cho các trường bắt buộc.
- **State Management**: Sử dụng `Zustand` (ví dụ `useCart`) để quản lý global state, gọi actions (vd: clearCart) và móc data hiển thị lên UI để đảm bảo tốc độ.
- **Design System (UI/UX)**:
  - Bám sát **Flat Design**: Không dùng viền nổi, bóng đổ dày, hay Gradient.
  - Sử dụng Brand Color **#FF4742** cho mọi nút bấm quan trọng (Call-to-Action).
- **Checkout API**: Tích hợp thanh toán bằng axios interceptor (`apiClient`), redirect tự động đến `/orders` sau khi thành công.
