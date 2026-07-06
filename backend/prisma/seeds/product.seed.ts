import { Category, PrismaClient, ProductStatus } from '@prisma/client';

export async function seedProducts(prisma: PrismaClient, sellerId: string) {
  console.log('--- Seed products ---');

  const productsData = [
    { name: 'Laptop Pro 16 inch', description: 'Laptop hieu nang cao', price: 2500, category: Category.Electronics, stock: 10, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Smartphone Z Fold', description: 'Man hinh gap', price: 1500, category: Category.Electronics, stock: 20, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Tai nghe Bluetooth', description: 'Chong on ANC', price: 200, category: Category.Electronics, stock: 50, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Dong ho thong minh X', description: 'Do nhip tim', price: 300, category: Category.Electronics, stock: 30, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Ao thun Cotton Nam', description: 'Thoang mat', price: 20, category: Category.Fashion, stock: 100, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Quan Jeans Nu', description: 'Co gian tot', price: 40, category: Category.Fashion, stock: 80, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Giay Sneaker Trang', description: 'Sieu nhe', price: 60, category: Category.Fashion, stock: 60, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Balo Du lich', description: 'Chong nuoc', price: 50, category: Category.Fashion, stock: 40, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Son Kem Li Do', description: 'Mem moi', price: 25, category: Category.Cosmetics, stock: 200, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Kem Chong Nang SPF50', description: 'Bao ve da', price: 35, category: Category.Cosmetics, stock: 150, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Nuoc Tay Trang', description: 'Lam sach sau', price: 15, category: Category.Cosmetics, stock: 120, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Serum Duong Am', description: 'Phuc hoi da', price: 45, category: Category.Cosmetics, stock: 90, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'San pham nhap 1', description: 'Dang viet mo ta', price: 10, category: Category.Fashion, stock: 10, status: ProductStatus.Draft, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'San pham nhap 2', description: 'Cho duyet', price: 20, category: Category.Electronics, stock: 10, status: ProductStatus.Draft, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Tui xach chay hang', description: 'Da het stock', price: 100, category: Category.Fashion, stock: 0, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
    { name: 'Man hinh 4K (Het)', description: 'Cho nhap them', price: 400, category: Category.Electronics, stock: 0, status: ProductStatus.Published, sellerId, images: ['https://via.placeholder.com/500'] },
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of productsData) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: item.name },
      select: { id: true },
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: item,
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
