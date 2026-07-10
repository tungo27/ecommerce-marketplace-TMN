import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CartService, CartResponse } from './cart.service';
import { UpdateCartDto } from './dtos/update-cart.dto';
import { SyncCartDto } from './dtos/sync-cart.dto';

/**
 * OptionalJwtGuard - Guard tùy chọn: cho phép request đi qua kể cả khi không có JWT.
 * Nếu có JWT hợp lệ, sẽ populate req.user. Nếu không có, req.user = undefined.
 *
 * Điều này cho phép endpoint POST /api/cart/update hỗ trợ cả User lẫn Guest
 * trên cùng một route, phân luồng logic bên trong controller/service.
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
class OptionalJwtGuard extends PassportAuthGuard('jwt') {
  /**
   * Override handleRequest để không ném lỗi khi không có token.
   * Thay vào đó, trả về null và cho phép request tiếp tục.
   */
  handleRequest(err: any, user: any) {
    // Nếu có lỗi token không hợp lệ (malformed, expired), vẫn trả null (không chặn).
    // Nếu muốn chặn token lỗi (expired/invalid), hãy throw err ở đây.
    if (err) return null;
    return user || null;
  }

  /**
   * Override canActivate để không throw khi không có Authorization header.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // Bỏ qua lỗi - cho phép request không có token đi qua
    }
    return true;
  }
}

/**
 * CartController - Xử lý toàn bộ API endpoints liên quan đến giỏ hàng.
 *
 * Phân luồng Guest vs User:
 *  - Guest (không có JWT): POST /api/cart/update sẽ trả về 200 với message hướng dẫn
 *    sử dụng LocalStorage (frontend tự xử lý, không cần backend).
 *  - Authenticated User (có JWT hợp lệ): Toàn bộ logic được xử lý tại CartService,
 *    giỏ hàng được persist tại Redis với key `cart:{userId}`.
 *
 * Endpoints:
 *  - POST   /api/cart/update          - Thêm/cập nhật sản phẩm (Guest trả về 200 hint)
 *  - GET    /api/cart                 - Lấy giỏ hàng (chỉ User)
 *  - DELETE /api/cart/:productId      - Xóa một sản phẩm (chỉ User)
 *  - PATCH  /api/cart/:productId      - Set số lượng chính xác (chỉ User, dùng cho nút +/-)
 *  - POST   /api/cart/sync            - Đồng bộ guest cart lên Redis sau login (chỉ User)
 *  - DELETE /api/cart                 - Xóa toàn bộ giỏ hàng (chỉ User)
 */
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * POST /api/cart/update
   *
   * Endpoint công khai hỗ trợ cả Guest lẫn User.
   *
   * - Nếu không có JWT (Guest): Trả về 200 với flag `requiresLocalStorage: true`.
   *   Frontend sẽ đọc flag này và tự lưu vào LocalStorage.
   * - Nếu có JWT (User): Ủy thác cho CartService xử lý Redis.
   *
   * Lý do chọn cách phân luồng này thay vì 2 route riêng:
   *  - Giữ nguyên interface đơn giản cho frontend (1 URL duy nhất).
   *  - Frontend chỉ cần kiểm tra `requiresLocalStorage` flag để biết có nên
   *    lưu LocalStorage hay không.
   */
  @Post('update')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtGuard)
  async updateCart(
    @Body() dto: UpdateCartDto,
    @Req() req: Request,
  ): Promise<CartResponse | { requiresLocalStorage: true; message: string }> {
    const user = (req as any).user;

    // Guest: Frontend tự quản lý LocalStorage
    if (!user) {
      return {
        requiresLocalStorage: true,
        message:
          'Guest mode: Vui lòng lưu giỏ hàng tại LocalStorage. Đăng nhập để đồng bộ lên server.',
      };
    }

    // Authenticated User: Xử lý qua Redis
    return this.cartService.updateCart(user.id, dto);
  }

  /**
   * GET /api/cart
   * Lấy toàn bộ giỏ hàng của user đang đăng nhập.
   * Chỉ dành cho Authenticated User.
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getCart(@Req() req: Request): Promise<CartResponse> {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException('Bạn cần đăng nhập để xem giỏ hàng.');
    }
    return this.cartService.getCart(user.id);
  }

  /**
   * DELETE /api/cart/:productId
   * Xóa một sản phẩm cụ thể khỏi giỏ hàng.
   * Chỉ dành cho Authenticated User.
   */
  @Delete(':productId')
  @UseGuards(AuthGuard('jwt'))
  async removeItem(
    @Param('productId') productId: string,
    @Req() req: Request,
  ): Promise<CartResponse> {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException(
        'Bạn cần đăng nhập để thực hiện thao tác này.',
      );
    }
    if (!productId || productId.trim() === '') {
      throw new BadRequestException('productId không hợp lệ.');
    }
    return this.cartService.removeItem(user.id, productId);
  }

  /**
   * PATCH /api/cart/:productId
   * Set số lượng chính xác cho một sản phẩm trong giỏ (dùng cho nút +/- UI).
   * Khác với POST /api/cart/update (cộng thêm), endpoint này SET giá trị mới.
   * Chỉ dành cho Authenticated User.
   *
   * Body: { quantity: number } - số lượng mới muốn đặt.
   */
  @Patch(':productId')
  @UseGuards(AuthGuard('jwt'))
  async setItemQuantity(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
    @Req() req: Request,
  ): Promise<CartResponse> {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException(
        'Bạn cần đăng nhập để thực hiện thao tác này.',
      );
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new BadRequestException('quantity phải là số nguyên dương.');
    }

    return this.cartService.setItemQuantity(user.id, productId, parsedQuantity);
  }

  /**
   * POST /api/cart/sync
   * Đồng bộ guest cart từ LocalStorage lên Redis ngay sau khi đăng nhập thành công.
   * Chỉ dành cho Authenticated User.
   *
   * Body: { items: Array<{ productId: string; quantity: number }> }
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async syncGuestCart(
    @Body() dto: SyncCartDto,
    @Req() req: Request,
  ): Promise<CartResponse> {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException('Bạn cần đăng nhập để đồng bộ giỏ hàng.');
    }

    if (!dto.items || dto.items.length === 0) {
      // Không có item hợp lệ, chỉ trả về giỏ hàng hiện tại của user
      return this.cartService.getCart(user.id);
    }

    return this.cartService.syncGuestCartToUser(user.id, dto.items);
  }

  /**
   * DELETE /api/cart
   * Xóa toàn bộ giỏ hàng của user.
   * Chỉ dành cho Authenticated User.
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'))
  async clearCart(@Req() req: Request): Promise<void> {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException(
        'Bạn cần đăng nhập để thực hiện thao tác này.',
      );
    }
    await this.cartService.clearCart(user.id);
  }
}
