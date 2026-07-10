import { IsString, IsInt, IsNotEmpty, Min } from 'class-validator';

/**
 * UpdateCartDto - Payload để thêm/cập nhật sản phẩm trong giỏ hàng.
 *
 * Ràng buộc:
 *  - productId: bắt buộc, phải là chuỗi không rỗng (UUID sản phẩm).
 *  - quantity: bắt buộc, phải là số nguyên dương >= 1.
 *    (Việc xóa sản phẩm khỏi giỏ được xử lý bằng endpoint riêng DELETE /api/cart/:productId,
 *     không thông qua quantity = 0 để tránh nhầm lẫn nghiệp vụ.)
 */
export class UpdateCartDto {
  @IsString({ message: 'productId must be a valid string.' })
  @IsNotEmpty({ message: 'productId must not be empty.' })
  productId!: string;

  @IsInt({ message: 'quantity must be a valid integer.' })
  @Min(1, {
    message: 'quantity must be a valid number greater than or equal to 1.',
  })
  quantity!: number;
}
