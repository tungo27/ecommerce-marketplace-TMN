import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCartDto } from './dtos/update-cart.dto';
import { REDIS_CLIENT } from '../../redis/redis.module';
import type { Redis } from 'ioredis';

/**
 * Cấu trúc của một item trong giỏ hàng được lưu tại Redis.
 */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  images: string[];
  quantity: number;
  stock: number;
}

/**
 * Cấu trúc response trả về cho client sau mỗi thao tác giỏ hàng.
 */
export interface CartResponse {
  items: Array<CartItem & { subtotal: number }>;
  totalCartPrice: number;
  totalItems: number;
}

/**
 * CartService - Xử lý toàn bộ business logic giỏ hàng cho Authenticated User.
 *
 * Chiến lược lưu trữ:
 *  - Key Redis: `cart:{userId}` (string, dạng JSON)
 *  - TTL: 7 ngày (604800 giây) - gia hạn mỗi lần có thao tác
 *
 * Lưu ý: RedisService được inject thông qua DI token 'REDIS_CLIENT'.
 * Trong môi trường thực tế, đây là instance của ioredis.Redis hoặc class wrapper.
 */
@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly CART_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 ngày

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Tạo key Redis theo định dạng chuẩn.
   */
  private buildCartKey(userId: string): string {
    return `cart:${userId}`;
  }

  /**
   * Đọc giỏ hàng từ Redis. Trả về mảng rỗng nếu chưa có.
   */
  private async readCartFromRedis(userId: string): Promise<CartItem[]> {
    const key = this.buildCartKey(userId);
    try {
      const raw = await this.redis.get(key);
      if (!raw) return [];
      return JSON.parse(raw) as CartItem[];
    } catch (error) {
      this.logger.error(`Lỗi đọc giỏ hàng từ Redis [key=${key}]:`, error);
      return [];
    }
  }

  /**
   * Ghi giỏ hàng vào Redis và gia hạn TTL.
   */
  private async writeCartToRedis(
    userId: string,
    items: CartItem[],
  ): Promise<void> {
    const key = this.buildCartKey(userId);
    try {
      await this.redis.set(key, JSON.stringify(items), 'EX', this.CART_TTL_SECONDS);
    } catch (error) {
      this.logger.error(`Lỗi ghi giỏ hàng vào Redis [key=${key}]:`, error);
      throw new BadRequestException(
        'Không thể lưu giỏ hàng. Vui lòng thử lại.',
      );
    }
  }

  /**
   * Tính toán và xây dựng CartResponse từ danh sách CartItem.
   */
  private buildCartResponse(items: CartItem[]): CartResponse {
    const enrichedItems = items.map((item) => ({
      ...item,
      subtotal: Math.round(item.price * item.quantity * 100) / 100,
    }));

    const totalCartPrice = enrichedItems.reduce(
      (acc, item) => acc + item.subtotal,
      0,
    );

    const totalItems = items.reduce((acc, item) => acc + (item.quantity || 0), 0);

    return {
      items: enrichedItems,
      totalCartPrice: Math.round(totalCartPrice * 100) / 100,
      totalItems,
    };
  }

  /**
   * Thêm hoặc cập nhật sản phẩm trong giỏ hàng.
   *
   * Logic:
   *  1. Kiểm tra quantity hợp lệ (>= 1).
   *  2. Truy vấn DB lấy thông tin sản phẩm và tồn kho.
   *  3. Đọc giỏ hàng hiện tại từ Redis.
   *  4. Nếu sản phẩm đã có trong giỏ: tổng số lượng = cũ + mới thêm.
   *     Nếu chưa có: số lượng = mới thêm.
   *  5. So sánh tổng số lượng với tồn kho.
   *  6. Ghi lại giỏ hàng vào Redis.
   *  7. Trả về CartResponse đầy đủ.
   *
   * @param userId - ID của người dùng đã đăng nhập.
   * @param dto - Payload chứa productId và quantity.
   */
  async updateCart(userId: string, dto: UpdateCartDto): Promise<CartResponse> {
    const { productId, quantity } = dto;

    // Bước 1: Validate quantity (class-validator đã check >= 1, nhưng double-check ở service)
    if ((!quantity || quantity <= 0)) {
      throw new BadRequestException(
        'Số lượng sản phẩm phải lớn hơn 0.',
      );
    }

    // Bước 2: Truy vấn DB để lấy thông tin và tồn kho sản phẩm
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        stock: true,
        status: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Sản phẩm với ID "${productId}" không tồn tại.`,
      );
    }

    // Kiểm tra trạng thái sản phẩm - chỉ cho phép thêm sản phẩm Published
    if (product.status !== 'Published') {
      throw new BadRequestException(
        'Sản phẩm hiện không khả dụng để thêm vào giỏ hàng.',
      );
    }

    // Bước 3: Đọc giỏ hàng hiện tại từ Redis
    const currentItems = await this.readCartFromRedis(userId);

    // Bước 4: Tính toán số lượng mới
    const existingItemIndex = currentItems.findIndex(
      (item) => item.productId === productId,
    );

    const currentQuantityInCart =
      existingItemIndex !== -1 ? currentItems[existingItemIndex].quantity : 0;

    const newTotalQuantity = currentQuantityInCart + (quantity || 0);

    // Bước 5: Kiểm tra tồn kho
    if (newTotalQuantity > product.stock) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    // Bước 6: Cập nhật hoặc thêm mới item vào giỏ hàng
    const productPrice = Number(product.price);

    if (existingItemIndex !== -1) {
      // Cập nhật quantity và đảm bảo thông tin sản phẩm luôn mới nhất
      currentItems[existingItemIndex] = {
        ...currentItems[existingItemIndex],
        quantity: newTotalQuantity,
        name: product.name,
        price: productPrice,
        images: product.images,
        stock: product.stock,
      };
    } else {
      // Thêm mới item
      currentItems.push({
        productId: product.id,
        name: product.name,
        price: productPrice,
        images: product.images,
        quantity: quantity || 0,
        stock: product.stock,
      });
    }

    // Bước 7: Ghi lại giỏ hàng vào Redis
    await this.writeCartToRedis(userId, currentItems);

    this.logger.log(
      `Đã cập nhật giỏ hàng: userId=${userId}, productId=${productId}, quantity=${newTotalQuantity}`,
    );

    // Bước 8: Trả về CartResponse đầy đủ
    return this.buildCartResponse(currentItems);
  }

  /**
   * Lấy toàn bộ giỏ hàng của user từ Redis.
   * Được gọi khi user vào trang cart hoặc cần đồng bộ state.
   *
   * @param userId - ID của người dùng đã đăng nhập.
   */
  async getCart(userId: string): Promise<CartResponse> {
    const items = await this.readCartFromRedis(userId);
    return this.buildCartResponse(items);
  }

  /**
   * Xóa một sản phẩm cụ thể khỏi giỏ hàng.
   *
   * @param userId - ID của người dùng.
   * @param productId - ID sản phẩm cần xóa.
   */
  async removeItem(userId: string, productId: string): Promise<CartResponse> {
    const currentItems = await this.readCartFromRedis(userId);

    const filteredItems = currentItems.filter(
      (item) => item.productId !== productId,
    );

    if (filteredItems.length === currentItems.length) {
      throw new NotFoundException(
        `Sản phẩm với ID "${productId}" không có trong giỏ hàng.`,
      );
    }

    await this.writeCartToRedis(userId, filteredItems);

    this.logger.log(
      `Đã xóa sản phẩm khỏi giỏ hàng: userId=${userId}, productId=${productId}`,
    );

    return this.buildCartResponse(filteredItems);
  }

  /**
   * Cập nhật trực tiếp số lượng của một item (dùng cho nút +/- trên giao diện).
   * Khác với updateCart() (cộng thêm), phương thức này SET số lượng về giá trị mới.
   *
   * @param userId - ID của người dùng.
   * @param productId - ID sản phẩm cần cập nhật.
   * @param newQuantity - Số lượng mới muốn đặt (phải >= 1).
   */
  async setItemQuantity(
    userId: string,
    productId: string,
    newQuantity: number,
  ): Promise<CartResponse> {
    if (newQuantity <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0.');
    }

    // Lấy thông tin tồn kho từ DB để validate
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, name: true, price: true, images: true },
    });

    if (!product) {
      throw new NotFoundException(
        `Sản phẩm với ID "${productId}" không tồn tại.`,
      );
    }

    if (newQuantity > product.stock) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    const currentItems = await this.readCartFromRedis(userId);
    const itemIndex = currentItems.findIndex(
      (item) => item.productId === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Sản phẩm với ID "${productId}" không có trong giỏ hàng.`,
      );
    }

    currentItems[itemIndex] = {
      ...currentItems[itemIndex],
      quantity: newQuantity,
      stock: product.stock,
    };

    await this.writeCartToRedis(userId, currentItems);

    return this.buildCartResponse(currentItems);
  }

  /**
   * Xóa toàn bộ giỏ hàng (thường gọi sau khi đặt hàng thành công).
   *
   * @param userId - ID của người dùng.
   */
  async clearCart(userId: string): Promise<void> {
    const key = this.buildCartKey(userId);
    try {
      await this.redis.del(key);
      this.logger.log(`Đã xóa toàn bộ giỏ hàng: userId=${userId}`);
    } catch (error) {
      this.logger.error(
        `Lỗi xóa giỏ hàng khỏi Redis [key=${key}]:`,
        error,
      );
    }
  }

  /**
   * Đồng bộ giỏ hàng Guest (từ LocalStorage) lên Redis sau khi đăng nhập.
   * Với mỗi item từ guest cart: cộng thêm số lượng vào giỏ hàng của user,
   * nhưng không vượt quá tồn kho.
   *
   * @param userId - ID của người dùng vừa đăng nhập.
   * @param guestItems - Danh sách các CartItem từ LocalStorage của guest.
   */
  async syncGuestCartToUser(
    userId: string,
    guestItems: Array<{ productId: string; quantity: number }>,
  ): Promise<CartResponse> {
    // Đọc giỏ hàng hiện tại của user từ Redis (nếu có)
    const userItems = await this.readCartFromRedis(userId);

    // Lấy thông tin tất cả sản phẩm trong guest cart từ DB (batch query)
    const productIds = guestItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'Published',
      },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        stock: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Merge từng guest item vào user cart
    for (const guestItem of guestItems) {
      const product = productMap.get(guestItem.productId);

      // Bỏ qua sản phẩm không tồn tại hoặc không Published
      if (!product) continue;

      const existingIndex = userItems.findIndex(
        (item) => item.productId === guestItem.productId,
      );

      const currentQty =
        existingIndex !== -1 ? userItems[existingIndex].quantity : 0;

      // Tổng số lượng sau merge, bị giới hạn bởi tồn kho
      const mergedQty = Math.min(
        currentQty + (guestItem.quantity || 0),
        product.stock,
      );

      if (mergedQty <= 0) continue;

      const productPrice = Number(product.price);

      if (existingIndex !== -1) {
        userItems[existingIndex] = {
          ...userItems[existingIndex],
          quantity: mergedQty,
          name: product.name,
          price: productPrice,
          images: product.images,
          stock: product.stock,
        };
      } else {
        userItems.push({
          productId: product.id,
          name: product.name,
          price: productPrice,
          images: product.images,
          quantity: mergedQty,
          stock: product.stock,
        });
      }
    }

    await this.writeCartToRedis(userId, userItems);

    this.logger.log(
      `Đã đồng bộ guest cart lên Redis: userId=${userId}, guestItems=${guestItems.length}`,
    );

    return this.buildCartResponse(userItems);
  }
}
