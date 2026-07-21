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
  name: any;
  price: number;
  originalPrice?: number;
  isFlashSale?: boolean;
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
        'Failed to save cart. Please try again.',
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
   * Đồng bộ lại danh sách CartItem với database để cập nhật giá (bao gồm Flash Sale) và tồn kho.
   */
  private async syncCartItemsWithDB(items: CartItem[]): Promise<CartItem[]> {
    if (items.length === 0) return [];

    const productIds = items.map((item) => item.productId);
    const now = new Date();

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        flashSales: {
          where: {
            status: 'APPROVED',
            startTime: { lte: now },
            endTime: { gte: now },
          },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const syncedItems: CartItem[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || product.status !== 'Published') {
        continue; // Bỏ qua sản phẩm không tồn tại hoặc đã bị ẩn
      }

      const activeFlashSale = product.flashSales[0];
      const originalPrice = Number(product.price);
      let currentPrice = originalPrice;
      let isFlashSale = false;

      if (activeFlashSale) {
        currentPrice = Number(activeFlashSale.salePrice);
        isFlashSale = true;
      }

      // Giới hạn quantity theo tồn kho hiện tại
      const validQuantity = Math.min(item.quantity, product.stock);
      if (validQuantity <= 0) continue;

      syncedItems.push({
        productId: product.id,
        name: product.name,
        price: currentPrice,
        originalPrice,
        isFlashSale,
        images: product.images,
        quantity: validQuantity,
        stock: product.stock,
      });
    }

    return syncedItems;
  }

  /**
   * Thêm hoặc cập nhật sản phẩm trong giỏ hàng.
   *
   * Logic:
   *  1. Kiểm tra quantity hợp lệ (>= 1).
   *  2. Đọc giỏ hàng hiện tại từ Redis.
   *  3. Tính toán số lượng mới.
   *  4. Cập nhật mảng items.
   *  5. Đồng bộ lại với DB (cập nhật giá Flash Sale, giới hạn tồn kho).
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
        'Product quantity must be greater than 0.',
      );
    }

    // Bước 2: Truy vấn DB để lấy thông tin tồn kho
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, status: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" does not exist.`);
    }

    if (product.status !== 'Published') {
      throw new BadRequestException('This product is currently unavailable to add to cart.');
    }

    // Bước 3: Đọc giỏ hàng hiện tại từ Redis
    let currentItems = await this.readCartFromRedis(userId);

    // Bước 4: Tính toán số lượng mới
    const existingItemIndex = currentItems.findIndex((item) => item.productId === productId);
    const currentQuantityInCart = existingItemIndex !== -1 ? currentItems[existingItemIndex].quantity : 0;
    const newTotalQuantity = currentQuantityInCart + (quantity || 0);

    // Bước 5: Kiểm tra tồn kho
    if (newTotalQuantity > product.stock) {
      throw new BadRequestException('Requested quantity exceeds available stock');
    }

    // Bước 6: Thêm tạm vào giỏ hàng trước khi đồng bộ
    if (existingItemIndex !== -1) {
      currentItems[existingItemIndex].quantity = newTotalQuantity;
    } else {
      currentItems.push({
        productId,
        name: {}, // Will be synced
        price: 0, // Will be synced
        images: [],
        quantity: quantity || 0,
        stock: product.stock,
      });
    }

    // Đồng bộ lại tất cả giá trị (bao gồm Flash Sale) từ DB
    currentItems = await this.syncCartItemsWithDB(currentItems);

    // Bước 7: Ghi lại giỏ hàng vào Redis
    await this.writeCartToRedis(userId, currentItems);

    this.logger.log(
      `Đã cập nhật giỏ hàng: userId=${userId}, productId=${productId}, quantity=${newTotalQuantity}`,
    );

    // Bước 8: Trả về CartResponse đầy đủ
    return this.buildCartResponse(currentItems);
  }

  async getCart(userId: string): Promise<CartResponse> {
    let items = await this.readCartFromRedis(userId);
    // Luôn đồng bộ lại giỏ hàng khi lấy để cập nhật giá flash sale mới nhất
    items = await this.syncCartItemsWithDB(items);
    await this.writeCartToRedis(userId, items);
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
        `Product with ID "${productId}" is not in your cart.`,
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
      throw new BadRequestException('Quantity must be greater than 0.');
    }

    // Lấy thông tin tồn kho từ DB để validate
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" does not exist.`);
    }

    if (newQuantity > product.stock) {
      throw new BadRequestException('Requested quantity exceeds available stock');
    }

    let currentItems = await this.readCartFromRedis(userId);
    const itemIndex = currentItems.findIndex((item) => item.productId === productId);

    if (itemIndex === -1) {
      throw new NotFoundException(`Product with ID "${productId}" is not in your cart.`);
    }

    currentItems[itemIndex].quantity = newQuantity;

    // Đồng bộ lại tất cả giá trị từ DB
    currentItems = await this.syncCartItemsWithDB(currentItems);

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
    let userItems = await this.readCartFromRedis(userId);

    // Thêm các item của guest vào user cart
    for (const guestItem of guestItems) {
      const existingIndex = userItems.findIndex((item) => item.productId === guestItem.productId);
      if (existingIndex !== -1) {
        userItems[existingIndex].quantity += guestItem.quantity;
      } else {
        userItems.push({
          productId: guestItem.productId,
          name: {},
          price: 0,
          images: [],
          quantity: guestItem.quantity,
          stock: 0,
        });
      }
    }

    // Đồng bộ toàn bộ với DB để cập nhật gộp, check stock và giá Flash Sale
    userItems = await this.syncCartItemsWithDB(userItems);

    await this.writeCartToRedis(userId, userItems);

    this.logger.log(
      `Đã đồng bộ guest cart lên Redis: userId=${userId}, guestItems=${guestItems.length}`,
    );

    return this.buildCartResponse(userItems);
  }
}
