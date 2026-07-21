const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORY_IMAGE_MAP = {
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

async function main() {
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    const slug = cat.slug.toLowerCase();
    const imageUrl = CATEGORY_IMAGE_MAP[slug] || 'https://images.unsplash.com/photo-1472851294502-8a8bef1cf152?q=80&w=300&auto=format&fit=crop';
    
    await prisma.$executeRawUnsafe(`UPDATE "Category" SET "imageUrl" = $1 WHERE id = $2`, imageUrl, cat.id);
    console.log(`Updated category ${cat.name} with image url`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
