import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { ForbiddenException } from '@nestjs/common';
import { CreateReviewDto } from './dtos/create-review.dto';
import { validate } from 'class-validator';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prismaService: any;
  let redisClient: any;

  beforeEach(async () => {
    prismaService = {
      order: {
        findFirst: jest.fn(),
      },
      review: {
        findFirst: jest.fn(),
        create: jest.fn(),
        aggregate: jest.fn(),
      },
      product: {
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(prismaService);
      }),
    };

    redisClient = {
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: REDIS_CLIENT, useValue: redisClient },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const userId = 'user-1';
    const productId = 'prod-1';
    const orderId = 'order-1';
    const dto: CreateReviewDto = { orderId, rating: 5, comment: 'Sản phẩm quá đỉnh!' };

    it('Case 1 (Thành công): Trả về bản ghi review mới tạo thành công, trigger transaction tính lại điểm trung bình', async () => {
      prismaService.order.findFirst.mockResolvedValue({ id: orderId, userId, status: 'Delivered' });
      prismaService.review.findFirst.mockResolvedValue(null);
      prismaService.review.create.mockResolvedValue({ id: 'review-1', ...dto, userId, productId });
      prismaService.review.aggregate.mockResolvedValue({ _avg: { rating: 4.8 } });
      prismaService.product.update.mockResolvedValue({ id: productId, averageRating: 4.8 });

      const result = await service.createReview(userId, productId, dto);

      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: {
          id: orderId,
          userId,
          status: 'Delivered',
          items: { some: { productId } },
        },
      });
      expect(prismaService.review.findFirst).toHaveBeenCalledWith({
        where: { orderId, productId, userId },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.review.create).toHaveBeenCalledWith({
        data: { userId, productId, orderId, rating: dto.rating, comment: dto.comment },
      });
      expect(prismaService.review.aggregate).toHaveBeenCalledWith({
        where: { productId },
        _avg: { rating: true },
      });
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { averageRating: 4.8 },
      });
      expect(redisClient.del).toHaveBeenCalledWith(`product_${productId}`);
      expect(result).toEqual({ id: 'review-1', ...dto, userId, productId });
    });

    it('Case 2 (Thất bại - Không có quyền): Order không tồn tại hoặc không thuộc về user', async () => {
      prismaService.order.findFirst.mockResolvedValue(null); // Return null

      await expect(service.createReview(userId, productId, dto)).rejects.toThrow(ForbiddenException);
      await expect(service.createReview(userId, productId, dto)).rejects.toThrow('Đơn hàng không tồn tại, không thuộc về bạn hoặc chưa được giao thành công.');
    });

    it('Case 3 (Thất bại - Sai trạng thái): Đơn hàng tồn tại nhưng trạng thái chưa phải là Delivered', async () => {
      // Do mocked logic findFirst filter status 'Delivered', nó sẽ trả null nếu status khác
      prismaService.order.findFirst.mockResolvedValue(null);

      await expect(service.createReview(userId, productId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('Case 4 (Thất bại - Đã đánh giá): User đã đánh giá sản phẩm cho đơn hàng này rồi', async () => {
      prismaService.order.findFirst.mockResolvedValue({ id: orderId, userId, status: 'Delivered' });
      prismaService.review.findFirst.mockResolvedValue({ id: 'existing-review' });

      await expect(service.createReview(userId, productId, dto)).rejects.toThrow(ForbiddenException);
      await expect(service.createReview(userId, productId, dto)).rejects.toThrow('Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi.');
    });
  });

  describe('CreateReviewDto Validation (Case 5)', () => {
    it('Case 5 (Thất bại - Sai dữ liệu đầu vào): rating ngoài khoảng 1-5 hoặc comment dài hơn 200 ký tự', async () => {
      const invalidDto = new CreateReviewDto();
      invalidDto.orderId = 'order-1';
      invalidDto.rating = 6; // Lỗi (Max: 5)
      invalidDto.comment = 'a'.repeat(201); // Lỗi (MaxLength: 200)

      const errors = await validate(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
      
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError?.constraints).toHaveProperty('max');

      const commentError = errors.find((e) => e.property === 'comment');
      expect(commentError?.constraints).toHaveProperty('maxLength');

      // Test Min(1)
      const invalidDto2 = new CreateReviewDto();
      invalidDto2.orderId = 'order-1';
      invalidDto2.rating = 0; 
      const errors2 = await validate(invalidDto2);
      expect(errors2.find((e) => e.property === 'rating')?.constraints).toHaveProperty('min');
    });
  });
});
