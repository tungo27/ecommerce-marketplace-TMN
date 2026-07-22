import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: { status: 'Published' },
    select: { id: true, images: true }
  });

  if (!product) {
    console.log('No published product found');
    return;
  }

  const storefrontConfig = await prisma.storefrontConfig.findUnique({
    where: { key: 'hero_banner' }
  });

  if (storefrontConfig) {
    const value: any = typeof storefrontConfig.value === 'string' ? JSON.parse(storefrontConfig.value) : storefrontConfig.value;
    value.heroProductId = product.id;
    if (product.images && product.images.length > 0) {
      value.heroImage = product.images[0];
    }
    await prisma.storefrontConfig.update({
      where: { key: 'hero_banner' },
      data: { value }
    });
    console.log('Updated hero banner with new product ID:', product.id);
  } else {
    console.log('hero_banner config not found, creating one...');
    await prisma.storefrontConfig.create({
      data: {
        key: 'hero_banner',
        value: {
          heroProductId: product.id,
          heroImage: product.images[0] || '',
          mode: 'product'
        }
      }
    });
    console.log('Created hero banner with product ID:', product.id);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
