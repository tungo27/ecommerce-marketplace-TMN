import { PrismaClient, ProductStatus, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedProducts(prisma: PrismaClient, _legacySellerId?: string) {
  console.log('--- Seed products ---');

  const sellers = await prisma.user.findMany({
    where: { role: Role.SELLER },
    select: { id: true },
  });

  const customers = await prisma.user.findMany({
    where: { role: Role.CUSTOMER },
    select: { id: true },
  });

  if (sellers.length === 0 || customers.length === 0) {
    throw new Error('No SELLER or CUSTOMER accounts found. Run seedUsers before seedProducts.');
  }

  // Clear data
  await prisma.auditLog.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.reviewReply.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.flashSale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storefrontConfig.deleteMany();
  console.log('--- Cleared old products, categories, and storefront configs ---');

  // Fetch products from DummyJSON
  console.log('--- Fetching real products from DummyJSON ---');
  let fetchedProducts: any[] = [];
  try {
    const res = await fetch('https://dummyjson.com/products?limit=150');
    const data = await res.json();
    fetchedProducts = data.products;
  } catch (error) {
    console.error('Failed to fetch from DummyJSON:', error);
    return;
  }

  // Category Image Mapping
  const CATEGORY_IMAGE_MAP: Record<string, string> = {
    electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=300&auto=format&fit=crop',
    fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=300&auto=format&fit=crop',
    smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop',
    laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=300&auto=format&fit=crop',
    fragrances: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&auto=format&fit=crop',
    skincare: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=300&auto=format&fit=crop',
    groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop',
    'home-decoration': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=300&auto=format&fit=crop',
    furniture: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=300&auto=format&fit=crop',
    tops: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=300&auto=format&fit=crop',
    'womens-dresses': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=300&auto=format&fit=crop',
    'womens-shoes': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=300&auto=format&fit=crop',
    'mens-shirts': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=300&auto=format&fit=crop',
    'mens-shoes': 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=300&auto=format&fit=crop',
    'mens-watches': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=300&auto=format&fit=crop',
    'womens-watches': 'https://images.unsplash.com/photo-1508656937048-985160df6463?q=80&w=300&auto=format&fit=crop',
    'womens-bags': 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=300&auto=format&fit=crop',
    'womens-jewellery': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=300&auto=format&fit=crop',
    sunglasses: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=300&auto=format&fit=crop',
    automotive: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=300&auto=format&fit=crop',
    motorcycle: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=300&auto=format&fit=crop',
    lighting: 'https://images.unsplash.com/photo-1513506003901-1e6a229e9d15?q=80&w=300&auto=format&fit=crop',
    beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop',
  };

  const uniqueCategoryNames = Array.from(new Set(fetchedProducts.map((p: any) => p.category)));
  const categoryMap = new Map<string, string>();
  for (const name of uniqueCategoryNames) {
    const formattedName = name.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    
    // Find matching image url
    const key = name.toLowerCase();
    const imageUrl = CATEGORY_IMAGE_MAP[key] || 'https://images.unsplash.com/photo-1472851294502-8a8bef1cf152?q=80&w=300&auto=format&fit=crop';
    
    const category = await prisma.category.create({
      data: {
        name: formattedName,
        slug: name,
        description: `Category for ${formattedName}`,
        imageUrl,
      },
    });
    categoryMap.set(name, category.id);
  }
  console.log(`--- Seeded ${categoryMap.size} categories ---`);

  let createdCount = 0;
  console.log('--- Seeding Products, Orders, and Reviews ---');

  for (let i = 0; i < fetchedProducts.length; i++) {
    const item = fetchedProducts[i];
    const seller = sellers[i % sellers.length];
    const categoryId = categoryMap.get(item.category)!;

    const product = await prisma.product.create({
      data: {
        name: item.title,
        description: item.description,
        price: Math.min(99999999, Math.max(10, Math.round(item.price * 25000))), // Cap at 99 million
        categoryId,
        stock: item.stock || faker.number.int({ min: 10, max: 200 }),
        images: item.images && item.images.length > 0 ? item.images : [item.thumbnail],
        status: ProductStatus.Published,
        sellerId: seller.id,
      },
    });
    createdCount++;

    // Generate 3-8 reviews for this product
    const numReviews = faker.number.int({ min: 3, max: 8 });
    let totalRating = 0;

    for (let r = 0; r < numReviews; r++) {
      const customer = faker.helpers.arrayElement(customers);
      const rating = faker.number.int({ min: 3, max: 5 }); // mostly positive
      totalRating += rating;

      // 1. Order
      const order = await prisma.order.create({
        data: {
          userId: customer.id,
          totalAmount: product.price,
          shippingAddress: faker.location.streetAddress(),
          phoneNumber: faker.phone.number(),
          paymentMethod: 'COD',
          status: 'DELIVERED',
        },
      });

      // 2. OrderItem
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          price: product.price,
        },
      });

      // 3. Review
      const comments = [
        "Absolutely love this product! Highly recommended.",
        "Great value for the price. Works exactly as described.",
        "Good quality overall, fast shipping.",
        "Amazing experience! Customer service was very helpful.",
        "It's decent, but could be slightly better.",
        "Very satisfied with my purchase.",
        "Exactly what I was looking for. Fits perfectly.",
        "The material is fantastic, really premium feel."
      ];
      
      const review = await prisma.review.create({
        data: {
          rating,
          comment: faker.helpers.arrayElement(comments),
          productId: product.id,
          userId: customer.id,
          orderId: order.id,
        },
      });

      // 4. Randomly reply to some reviews (Seller Reply)
      if (faker.datatype.boolean()) {
        const replies = [
          "Thank you for your feedback! We are glad you like it.",
          "We appreciate your purchase and your review.",
          "Thanks for choosing our store! Enjoy!",
        ];
        await prisma.reviewReply.create({
          data: {
            reviewId: review.id,
            comment: faker.helpers.arrayElement(replies),
          },
        });
      }
    }

    // Update average rating
    if (numReviews > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: { averageRating: totalRating / numReviews },
      });
    }
  }

  console.log(`seedProducts done. Created: ${createdCount} products with thousands of orders & reviews. Distributed across ${sellers.length} sellers and ${customers.length} customers.`);
}
