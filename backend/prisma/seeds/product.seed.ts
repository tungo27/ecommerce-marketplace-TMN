import { Category, PrismaClient, ProductStatus } from '@prisma/client';

export async function seedProducts(prisma: PrismaClient, sellerId: string) {
  console.log('--- Seed products ---');

  const productsData = [
    { id: 'P01', name: 'Laptop Pro 16 inch', description: 'Laptop hieu nang cao', price: 25000000, category: Category.Electronics, stock: 10, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P02', name: 'Smartphone Z Fold', description: 'Man hinh gap', price: 18000000, category: Category.Electronics, stock: 20, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P03', name: 'Tai nghe Bluetooth', description: 'Chong on ANC', price: 2500000, category: Category.Electronics, stock: 50, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P04', name: 'Dong ho thong minh X', description: 'Do nhip tim', price: 3500000, category: Category.Electronics, stock: 30, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P05', name: 'Ao thun Cotton Nam', description: 'Thoang mat', price: 250000, category: Category.Fashion, stock: 100, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P06', name: 'Quan Jeans Nu', description: 'Co gian tot', price: 450000, category: Category.Fashion, stock: 80, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P07', name: 'Giay Sneaker Trang', description: 'Sieu nhe', price: 650000, category: Category.Fashion, stock: 60, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P08', name: 'Balo Du lich', description: 'Chong nuoc', price: 550000, category: Category.Fashion, stock: 40, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P09', name: 'Son Kem Li Do', description: 'Mem moi', price: 250000, category: Category.Cosmetics, stock: 200, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P10', name: 'Kem Chong Nang SPF50', description: 'Bao ve da', price: 350000, category: Category.Cosmetics, stock: 150, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P11', name: 'Nuoc Tay Trang', description: 'Lam sach sau', price: 150000, category: Category.Cosmetics, stock: 120, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P12', name: 'Serum Duong Am', description: 'Phuc hoi da', price: 450000, category: Category.Cosmetics, stock: 90, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P13', name: 'San pham nhap 1', description: 'Dang viet mo ta', price: 100000, category: Category.Fashion, stock: 10, status: ProductStatus.Draft, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P14', name: 'San pham nhap 2', description: 'Cho duyet', price: 200000, category: Category.Electronics, stock: 10, status: ProductStatus.Draft, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P15', name: 'Tui xach chay hang', description: 'Da het stock', price: 100000, category: Category.Fashion, stock: 0, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { id: 'P16', name: 'Man hinh 4K (Het)', description: 'Cho nhap them', price: 4000000, category: Category.Electronics, stock: 0, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of productsData) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: item.name },
      select: { id: true },
    });

    if (existingProduct) {
      const { id, ...productData } = item;
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      updatedCount++;
    } else {
      await prisma.product.create({ data: item });
      createdCount++;
    }
  }

  console.log(
    `Seed products done. Created: ${createdCount}, updated: ${updatedCount}, total seed items: ${productsData.length}.`,
  );
}
