import { Category, PrismaClient, ProductStatus, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';

const TOTAL_PRODUCTS = 50;

// ---------------------------------------------------------------------------
// Product Templates — 50 UNIQUE templates (10 per Category)
// Images sourced from cdn.dummyjson.com to guarantee uniqueness and zero Next.js 404s.
// ---------------------------------------------------------------------------
interface ProductTemplate {
  name: string;
  description: string;
  category: Category;
  imageUrl: string;
  priceMin: number;
  priceMax: number;
}

const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // Cosmetics (10)
  { name: 'Intense Volumizing Mascara', description: 'Long-lasting, waterproof mascara for extreme volume and length without smudging.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp', priceMin: 15, priceMax: 30 },
  { name: 'Eyeshadow Palette with Mirror', description: '12-color trendy eyeshadow palette with a convenient built-in makeup mirror.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/eyeshadow-palette-with-mirror/1.webp', priceMin: 25, priceMax: 50 },
  { name: 'Oil-Control Setting Powder', description: 'Ultra-fine setting powder that controls oil all day and blurs pores perfectly.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/powder-canister/1.webp', priceMin: 20, priceMax: 40 },
  { name: 'Ruby Red Matte Lipstick', description: 'Luxurious ruby red matte lipstick, moisturizing formula that keeps lips soft.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp', priceMin: 18, priceMax: 35 },
  { name: 'Classic Red Nail Polish', description: 'Classic pure red nail polish, quick-drying, long-lasting, and safe for nails.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/red-nail-polish/1.webp', priceMin: 5, priceMax: 15 },
  { name: 'Basic Unisex Perfume', description: 'Gentle unisex fragrance with long-lasting scent from 8 to 12 hours.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/1.webp', priceMin: 100, priceMax: 200 },
  { name: 'Mysterious Black Perfume for Women', description: 'Captivating and elegant scent, perfect for evening parties and special events.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/chanel-coco-noir-eau-de/1.webp', priceMin: 200, priceMax: 350 },
  { name: 'Fresh Floral Perfume for Women', description: 'Radiant jasmine and orchid scent, perfect for an active and vibrant summer.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/dior-j\'adore/1.webp', priceMin: 180, priceMax: 300 },
  { name: 'Sunlight Glamour Perfume', description: 'A perfect combination of sweet tropical fruit notes for a charming aura.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/dolce-shine-eau-de/1.webp', priceMin: 150, priceMax: 250 },
  { name: 'Vintage Rose Perfume', description: 'Gentle, romantic fragrance extracted from classic French roses.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/1.webp', priceMin: 180, priceMax: 320 },

  // Home Living (10)
  { name: 'Neoclassical Oak Wood Bed', description: 'Natural oak wood bed featuring an elegant and luxurious neoclassical design.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/1.webp', priceMin: 1500, priceMax: 2500 },
  { name: 'Luxury Fabric Upholstered Sofa', description: 'Premium fabric sofa, incredibly soft and comfortable for the living room.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/1.webp', priceMin: 2000, priceMax: 3500 },
  { name: 'African Cherry Bedside Table', description: 'Compact and convenient bedside table with sharp natural wood grain details.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/bedside-table-african-cherry/1.webp', priceMin: 200, priceMax: 400 },
  { name: 'Premium Swivel Office Chair', description: 'Ergonomic office chair with highly comfortable molded foam padding to prevent back pain.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/knoll-saarinen-executive-conference-chair/1.webp', priceMin: 350, priceMax: 600 },
  { name: 'Bathroom Vanity Cabinet with Mirror', description: 'Waterproof bathroom sink cabinet set paired with a smart makeup mirror.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/wooden-bathroom-sink-with-mirror/1.webp', priceMin: 400, priceMax: 700 },
  { name: 'Artistic Decorative Swing', description: 'Relaxing swing suitable for the living room or balcony, featuring sturdy ropes.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/decoration-swing/1.webp', priceMin: 150, priceMax: 300 },
  { name: 'Family Wall Photo Frame Set', description: 'Multi-size family photo frame combo made from premium pressed wood.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/family-tree-photo-frame/1.webp', priceMin: 30, priceMax: 60 },
  { name: 'Decorative Model Plant', description: 'Vivid model plant to decorate your workspace, requires zero watering.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/house-showpiece-plant/1.webp', priceMin: 15, priceMax: 40 },
  { name: 'Nordic Ceramic Plant Pot', description: 'Mini ceramic plant pot featuring a tranquil Nordic glazed finish.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/1.webp', priceMin: 10, priceMax: 25 },
  { name: 'Classic Warm Light Table Lamp', description: 'Decorative table lamp providing warm ambient light, perfect for the bedroom.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/table-lamp/1.webp', priceMin: 45, priceMax: 90 },

  // Food (10)
  { name: 'Imported Whole Box Apples', description: 'Crisp, sweet, thin-skinned red apples, 100% freshly imported.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/apple/1.webp', priceMin: 10, priceMax: 20 },
  { name: 'US Beef Tenderloin for Steak', description: 'Premium US beef tenderloin with ideal marble fat patterns for perfect steaks.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/beef-steak/1.webp', priceMin: 40, priceMax: 80 },
  { name: 'Nutritious Dry Cat Food', description: 'Premium dry food promoting comprehensive growth and a shiny coat for cats.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/cat-food/1.webp', priceMin: 20, priceMax: 35 },
  { name: 'Packaged Fresh Chicken Meat', description: 'Clean and fresh chicken drumsticks meeting food safety standards, tender and sweet.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/chicken-meat/1.webp', priceMin: 8, priceMax: 15 },
  { name: 'Pure Sunflower Cooking Oil', description: 'Cooking oil extracted from sunflower seeds, rich in Vitamin E, good for the heart.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/cooking-oil/1.webp', priceMin: 6, priceMax: 12 },
  { name: 'Crispy Organic Green Cucumber', description: 'Organically grown cucumbers, fresh and crunchy for salads, chemical-free.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/cucumber/1.webp', priceMin: 3, priceMax: 8 },
  { name: 'Nutritious Dry Dog Food', description: 'Provides calcium and vitamins to ensure a healthy skeletal system for your dog.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/dog-food/1.webp', priceMin: 25, priceMax: 45 },
  { name: 'Brown Shell Fresh Eggs (10-Pack)', description: 'Eggs from green farms with rich yolks, meeting high agricultural standards.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/eggs/1.webp', priceMin: 4, priceMax: 8 },
  { name: 'Norwegian Imported Salmon Fillet', description: 'Salmon fillet with natural fat marbling, fresh and perfect for sushi or pan-searing.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/fish-steak/1.webp', priceMin: 30, priceMax: 65 },
  { name: 'Dalat Green Bell Pepper', description: 'Crisp and juicy green bell pepper, rich in vitamin C, excellent for salads.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/green-bell-pepper/1.webp', priceMin: 3, priceMax: 7 },

  // Electronics (10)
  { name: 'Macbook Pro 14 inch Space Grey', description: 'Apple\'s powerful M-chip laptop featuring a brilliant Liquid Retina XDR display.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/1.webp', priceMin: 3500, priceMax: 4500 },
  { name: 'Asus Zenbook Dual Screen Laptop', description: 'Unique dual-screen technology, offering maximum support for designers and editors.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/1.webp', priceMin: 3000, priceMax: 4000 },
  { name: 'Huawei Matebook X Pro', description: 'Ultra-thin bezels with a premium solid aluminum casing for a luxurious feel.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/1.webp', priceMin: 2500, priceMax: 3200 },
  { name: 'Lenovo Yoga Touch Convertible', description: '360-degree convertible laptop featuring a highly sensitive and convenient touch screen.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/1.webp', priceMin: 1800, priceMax: 2600 },
  { name: 'Dell XPS 13 InfinityEdge Display', description: 'Ultra-thin business laptop with a quiet keyboard and a razor-sharp 4K display.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/1.webp', priceMin: 2800, priceMax: 3500 },
  { name: 'Amazon Echo Plus Smart Speaker', description: 'Alexa voice assistant integrated with powerful 360-degree surround sound.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/1.webp', priceMin: 150, priceMax: 250 },
  { name: 'Apple Airpods V2 Earbuds', description: 'Compact TWS earbuds offering stable connectivity within the Apple ecosystem.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/1.webp', priceMin: 200, priceMax: 300 },
  { name: 'Airpods Max Silver Noise Cancelling', description: 'Ultimate audio experience with comfortable ear cushions and absolute noise cancellation.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp', priceMin: 800, priceMax: 1200 },
  { name: 'AirPower Wireless Charging Pad', description: 'High-speed Qi standard charging pad, conveniently charges multiple devices at once.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpower-wireless-charger/1.webp', priceMin: 50, priceMax: 100 },
  { name: 'HomePod Mini Black Smart Assistant', description: 'Deep bass sound and smart home voice control capabilities.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-homepod-mini-cosmic-grey/1.webp', priceMin: 120, priceMax: 200 },

  // Fashion (10)
  { name: 'Men\'s Blue/Black Check Shirt', description: 'Breathable linen material with a loose fit for a comfortable wearing experience.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/1.webp', priceMin: 25, priceMax: 40 },
  { name: 'Aorus Gaming Men\'s T-Shirt', description: 'Patterned cotton T-shirt designed exclusively for gamers looking for a cool style.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/1.webp', priceMin: 15, priceMax: 30 },
  { name: 'Dynamic Plaid Check Shirt', description: 'Easy to mix and match with jeans, providing a dynamic and youthful appearance.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/1.webp', priceMin: 20, priceMax: 45 },
  { name: 'Short Sleeve Beach Shirt', description: 'Soft, lightweight silk-like fabric with colorful patterns ideal for summer travel.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/1.webp', priceMin: 18, priceMax: 35 },
  { name: 'Office Striped Dress Shirt', description: 'Fitted shape that flatters the body, suitable for work or attending parties.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/1.webp', priceMin: 30, priceMax: 60 },
  { name: 'Jordan 1 High Top Red/Black', description: 'A highly sought-after, rare classic basketball sneaker edition.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/1.webp', priceMin: 350, priceMax: 600 },
  { name: 'Nike Turf Football Cleats', description: 'Absolute field-gripping studded soles, supporting powerful jumps during matches.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/1.webp', priceMin: 120, priceMax: 200 },
  { name: 'Puma Assist Running Shoes', description: 'Soft foam padding with smart woven fabric covering to minimize ankle injuries.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/1.webp', priceMin: 80, priceMax: 150 },
  { name: 'Dynamic Red-Trim Sports Sneaker', description: 'Aggressive and edgy design, featuring a 3cm elevated sole for a slight height boost.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/1.webp', priceMin: 45, priceMax: 90 },
  { name: 'Soft & Light Exercise Sneaker', description: 'Super flexible vulcanized rubber sole, incredibly agile weighing under 300g.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/1.webp', priceMin: 40, priceMax: 80 },
];

/**
 * Seeds 50 unique realistic products distributed among all Sellers in the database.
 * Uses 50 unique image URLs from cdn.dummyjson.com to ensure ZERO duplicates.
 */
export async function seedProducts(prisma: PrismaClient, _legacySellerId?: string) {
  console.log('--- Seed products ---');

  // Fetch all sellers seeded by seedUsers
  const sellers = await prisma.user.findMany({
    where: { role: Role.SELLER },
    select: { id: true },
  });

  if (sellers.length === 0) {
    throw new Error('No SELLER accounts found. Run seedUsers before seedProducts.');
  }

  // Delete old products
  await prisma.auditLog.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.product.deleteMany();
  console.log('--- Cleared old products ---');

  let createdCount = 0;

  for (let i = 0; i < TOTAL_PRODUCTS; i++) {
    // Pick unique template, exactly 50 total templates so i-th product maps to i-th template
    const template = PRODUCT_TEMPLATES[i];
    const seller = sellers[i % sellers.length];

    const price = faker.number.int({ min: template.priceMin, max: template.priceMax }) * 10000;
    const stock = faker.number.int({ min: 0, max: 200 });

    const name = template.name;
    const images: string[] = [template.imageUrl];

    await prisma.product.create({
      data: {
        name,
        description: template.description,
        price,
        category: template.category,
        stock,
        images,
        status: ProductStatus.Published,
        sellerId: seller.id,
      },
    });

    createdCount++;
  }
  
  // Seed reviews for the first published product to mock HomepageSocialProof data
  const firstProduct = await prisma.product.findFirst({
    where: { status: ProductStatus.Published },
    orderBy: { createdAt: 'asc' }
  });

  if (firstProduct) {
    console.log('--- Seeding 4 authentic English Reviews for the first product ---');
    const customers = await prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      take: 4,
    });

    const mockReviewTexts = [
      "Absolutely love this product! The quality exceeded my expectations and delivery was super fast. Highly recommended!",
      "Great value for the price. I've been using it for a week now and it works exactly as described. Very satisfied.",
      "Good quality overall. The packaging was a bit dented, but the item itself was in perfect condition.",
      "Amazing shopping experience! Customer service was very helpful and the product is stunning."
    ];

    let totalRating = 0;

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const rating = i === 2 ? 4 : 5; // one 4-star, three 5-star
      totalRating += rating;

      // 1. Create dummy order
      const order = await prisma.order.create({
        data: {
          userId: customer.id,
          totalAmount: firstProduct.price,
          shippingAddress: faker.location.streetAddress(),
          phoneNumber: faker.phone.number(),
          paymentMethod: 'COD',
          status: 'DELIVERED',
        }
      });

      // 2. Create order item
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: firstProduct.id,
          quantity: 1,
          price: firstProduct.price,
        }
      });

      // 3. Create review
      await prisma.review.create({
        data: {
          rating,
          comment: mockReviewTexts[i],
          productId: firstProduct.id,
          userId: customer.id,
          orderId: order.id,
        }
      });
    }

    // Update product average rating
    await prisma.product.update({
      where: { id: firstProduct.id },
      data: { averageRating: totalRating / customers.length }
    });
  }

  console.log(`seedProducts done. Created: ${createdCount}. Distributed across ${sellers.length} seller(s).`);
}
