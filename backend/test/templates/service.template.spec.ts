// ĐÂY LÀ FILE MẪU CHO AI. KHÔNG ĐƯỢC CHỈNH SỬA.
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../src/modules/products/products.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ProductRepository } from '../../src/modules/products/repositories/product.repository';
import { UploadService } from '../../src/upload/upload.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  // Tạo mock object mô phỏng các API của Prisma Client
  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockProductRepository = {
    findPublicProducts: jest.fn(),
  };

  const mockUploadService = {
    uploadImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService, // Inject Prisma mock vào Service thay vì kết nối thật
        },
        {
          provide: ProductRepository,
          useValue: mockProductRepository,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    // Xóa sạch tất cả mock history sau mỗi case test để tránh rò rỉ trạng thái (test state leak)
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPublicProducts', () => {
    it('should return an array of products', async () => {
      const expectedProducts = {
        data: [
          { id: '1', name: 'Product A', price: 100 },
          { id: '2', name: 'Product B', price: 200 },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      // Giả lập kết quả trả về thành công từ Repository
      mockProductRepository.findPublicProducts.mockResolvedValue(
        expectedProducts,
      );

      const result = await service.findPublicProducts({ page: 1, limit: 10 });

      expect(result).toEqual(expectedProducts);
      expect(mockProductRepository.findPublicProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('findPublicProductById', () => {
    it('should return a product by ID', async () => {
      const product = { id: '1', name: 'Product A', price: 100 };
      mockPrismaService.product.findFirst.mockResolvedValue(product);

      const result = await service.findPublicProductById('1');

      expect(result).toEqual(product);
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: '1', status: 'Published' },
        include: { seller: { select: { name: true } } },
      });
    });

    it('should throw an error if product is not found', async () => {
      // Giả lập Prisma không tìm thấy bản ghi (trả về null)
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.findPublicProductById('invalid-id'),
      ).rejects.toThrow();
    });
  });
});
