import { PrismaClient, FlashSaleStatus, ProductStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedFlashSales(prisma: PrismaClient) {
  console.log('--- Seed flash sales ---');

  // Clear existing flash sales
  await prisma.flashSale.deleteMany();

  // Get some published products to put on flash sale
  const products = await prisma.product.findMany({
    where: { status: ProductStatus.Published, stock: { gt: 0 } },
    include: { seller: true },
    take: 50,
  });

  if (products.length === 0) {
    console.log('No published products found, skipping flash sales seed.');
    return;
  }

  const now = new Date();
  let createdCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    // Mix of statuses: APPROVED (active now), APPROVED (future), PENDING, REJECTED
    let status: FlashSaleStatus = FlashSaleStatus.APPROVED;
    let startTime = new Date(now);
    let endTime = new Date(now);

    if (i < 5) {
      // Active right now (APPROVED, ends in 1-24 hours)
      status = FlashSaleStatus.APPROVED;
      startTime.setHours(startTime.getHours() - 1); // Started 1 hr ago
      endTime.setHours(endTime.getHours() + faker.number.int({ min: 2, max: 48 })); 
    } else if (i < 8) {
      // Pending
      status = FlashSaleStatus.PENDING;
      startTime.setHours(startTime.getHours() + 24); // Starts tomorrow
      endTime.setHours(endTime.getHours() + 48);
    } else if (i < 10) {
      // Rejected
      status = FlashSaleStatus.REJECTED;
      startTime.setHours(startTime.getHours() + 24);
      endTime.setHours(endTime.getHours() + 48);
    } else {
      // Future approved
      status = FlashSaleStatus.APPROVED;
      startTime.setHours(startTime.getHours() + 24);
      endTime.setHours(endTime.getHours() + 48);
    }

    const discountPercentage = faker.number.int({ min: 10, max: 70 });
    const originalPrice = Number(product.price);
    const salePrice = originalPrice * (1 - discountPercentage / 100);

    await prisma.flashSale.create({
      data: {
        productId: product.id,
        sellerId: product.sellerId,
        discountPercentage,
        salePrice,
        startTime,
        endTime,
        status,
        adminNote: status === FlashSaleStatus.REJECTED ? 'Discount too low' : null,
      },
    });

    createdCount++;
  }

  console.log(`seedFlashSales done. Created: ${createdCount} flash sales.`);
}
