// ĐÂY LÀ FILE MẪU CHO AI. KHÔNG ĐƯỢC CHỈNH SỬA.
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../src/modules/products/products.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  // Tạo mock object mô phỏng các API của Prisma Client
  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService, // Inject Prisma mock vào Service thay vì kết nối thật
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

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const expectedProducts = [
        { id: '1', name: 'Product A', price: 100 },
        { id: '2', name: 'Product B', price: 200 },
      ];
      // Giả lập kết quả trả về thành công từ Prisma
      mockPrismaService.product.findMany.mockResolvedValue(expectedProducts);

      const result = await service.findAll();

      expect(result).toEqual(expectedProducts);
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      const product = { id: '1', name: 'Product A', price: 100 };
      mockPrismaService.product.findUnique.mockResolvedValue(product);

      const result = await service.findOne('1');

      expect(result).toEqual(product);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw an error if product is not found', async () => {
      // Giả lập Prisma không tìm thấy bản ghi (trả về null)
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow();
    });
  });
});
