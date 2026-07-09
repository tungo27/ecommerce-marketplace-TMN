import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dtos/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const MAX_RETRIES = 3;
    let attempt = 0;

    // 1. Lấy thông tin giỏ hàng từ CartService
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng của bạn đang trống.');
    }

    const { shippingAddress, phoneNumber, paymentMethod } = createOrderDto;

    // VÒNG LẶP RETRY: Thử lại tối đa MAX_RETRIES lần nếu gặp xung đột dữ liệu (Conflict)
    while (attempt < MAX_RETRIES) {
      try {
        // Thực thi toàn bộ logic trong 1 Interactive Transaction của Prisma
        const result = await this.prisma.$transaction(async (tx) => {
          const productIds = cart.items.map((item) => item.productId);

          // Lấy dữ liệu sản phẩm mới nhất để lấy version và tồn kho
          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
          });

          // 2. Kiểm tra tồn kho
          for (const item of cart.items) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
              throw new BadRequestException(`Sản phẩm ${item.name} không tồn tại`);
            }
            if (product.stock < item.quantity) {
              throw new BadRequestException(`Sản phẩm ${product.name} không đủ số lượng trong kho`);
            }
          }

          // 3. Trừ kho với OPTIMISTIC LOCKING
          for (const item of cart.items) {
            const product = products.find((p) => p.id === item.productId)!;

            const updateResult = await tx.product.updateMany({
              where: {
                id: product.id,
                version: product.version, // ĐIỀU KIỆN LOCK
              },
              data: {
                stock: { decrement: item.quantity },
                version: { increment: 1 }, // Tăng version
              },
            });

            // Nếu updateResult.count === 0 nghĩa là version đã bị thay đổi
            if (updateResult.count === 0) {
              throw new Error('OPTIMISTIC_LOCK_CONFLICT');
            }
          }

          // 4. Khởi tạo record Order và OrderItem
          const order = await tx.order.create({
            data: {
              userId,
              totalAmount: cart.totalCartPrice,
              shippingAddress,
              phoneNumber,
              paymentMethod,
              status: 'PENDING',
              items: {
                create: cart.items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                })),
              },
            },
          });

          return order;
        });

        // 5. Xóa giỏ hàng sau khi checkout thành công (ngoài scope transaction)
        await this.cartService.clearCart(userId);

        this.logger.log(`Order ${result.id} created successfully for user ${userId}`);
        return result;
      } catch (error) {
        if (error instanceof Error && error.message === 'OPTIMISTIC_LOCK_CONFLICT') {
          attempt++;
          this.logger.warn(`[Checkout] Xung đột dữ liệu. Đang thử lại lần ${attempt}/${MAX_RETRIES}`);
          
          if (attempt >= MAX_RETRIES) {
            throw new ConflictException(
              'Hệ thống đang có quá nhiều giao dịch. Vui lòng thử lại sau.'
            );
          }
          continue;
        }

        throw error;
      }
    }
  }
}
