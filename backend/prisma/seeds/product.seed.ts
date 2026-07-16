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
  { name: 'Mascara Dày Mi Chuyên Sâu', description: 'Mascara làm dày mi dài mi chống nước, không lem không trôi.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp', priceMin: 15, priceMax: 30 },
  { name: 'Bảng Phấn Mắt Kèm Gương', description: 'Bảng màu mắt 12 ô thời thượng, có sẵn gương trang điểm tiện dụng.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/eyeshadow-palette-with-mirror/1.webp', priceMin: 25, priceMax: 50 },
  { name: 'Phấn Phủ Dạng Bột Kiềm Dầu', description: 'Phấn phủ siêu mịn giúp kiềm dầu cả ngày, che phủ lỗ chân lông tốt.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/powder-canister/1.webp', priceMin: 20, priceMax: 40 },
  { name: 'Son Thỏi Lì Đỏ Ruby', description: 'Son môi lì màu đỏ Ruby sang trọng, dưỡng ẩm không làm khô môi.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp', priceMin: 18, priceMax: 35 },
  { name: 'Sơn Móng Tay Đỏ Thuần', description: 'Sơn móng tay màu đỏ thuần cổ điển, mau khô và lâu trôi, an toàn móng.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/beauty/red-nail-polish/1.webp', priceMin: 5, priceMax: 15 },
  { name: 'Nước Hoa Unisex Basic', description: 'Nước hoa unisex với hương thơm dịu nhẹ, lưu hương lâu từ 8-12 tiếng.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/1.webp', priceMin: 100, priceMax: 200 },
  { name: 'Nước Hoa Nữ Đen Bí Ẩn', description: 'Hương thơm quyến rũ, đậm chất quý phái dành cho các buổi tiệc đêm.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/chanel-coco-noir-eau-de/1.webp', priceMin: 200, priceMax: 350 },
  { name: 'Nước Hoa Nữ Hoa Cỏ Tươi Mát', description: 'Hương hoa nhài, hoa lan tỏa rạng rỡ, thích hợp cho mùa hè năng động.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/dior-j\'adore/1.webp', priceMin: 180, priceMax: 300 },
  { name: 'Nước Hoa Ánh Dương Quyến Rũ', description: 'Sự kết hợp hoàn hảo của các nốt hương trái cây nhiệt đới ngọt ngào.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/dolce-shine-eau-de/1.webp', priceMin: 150, priceMax: 250 },
  { name: 'Nước Hoa Hương Hoa Hồng Cổ', description: 'Hương thơm dịu dàng, lãng mạn chiết xuất từ hoa hồng cổ điển nước Pháp.', category: Category.Cosmetics, imageUrl: 'https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/1.webp', priceMin: 180, priceMax: 320 },

  // Home Living (10)
  { name: 'Giường Ngủ Gỗ Sồi Tân Cổ Điển', description: 'Giường ngủ chất liệu gỗ sồi tự nhiên, thiết kế tân cổ điển sang trọng.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/1.webp', priceMin: 1500, priceMax: 2500 },
  { name: 'Ghế Sofa Bọc Nỉ Sang Trọng', description: 'Ghế sofa nỉ cao cấp mềm mại, êm ái cho phòng khách gia đình.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/1.webp', priceMin: 2000, priceMax: 3500 },
  { name: 'Tủ Đầu Giường Gỗ Phong Phi', description: 'Tủ đầu giường nhỏ gọn, tiện lợi, đường nét gỗ tự nhiên sắc sảo.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/bedside-table-african-cherry/1.webp', priceMin: 200, priceMax: 400 },
  { name: 'Ghế Xoay Văn Phòng Cao Cấp', description: 'Ghế làm việc chống đau lưng với lớp đệm mút đúc cực kỳ thoải mái.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/knoll-saarinen-executive-conference-chair/1.webp', priceMin: 350, priceMax: 600 },
  { name: 'Tủ Lavabo Nhà Tắm Kèm Gương', description: 'Bộ tủ chậu rửa mặt chống nước đi kèm gương trang điểm thông minh.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/furniture/wooden-bathroom-sink-with-mirror/1.webp', priceMin: 400, priceMax: 700 },
  { name: 'Xích Đu Trang Trí Nghệ Thuật', description: 'Xích đu thư giãn treo phòng khách hoặc ban công, dây đan chắc chắn.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/decoration-swing/1.webp', priceMin: 150, priceMax: 300 },
  { name: 'Khung Ảnh Gia Đình Treo Tường', description: 'Combo khung ảnh gia đình đa kích thước làm từ gỗ ép cao cấp.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/family-tree-photo-frame/1.webp', priceMin: 30, priceMax: 60 },
  { name: 'Cây Mô Hình Trang Trí', description: 'Cây mô hình sinh động trang trí phòng làm việc, không cần tưới nước.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/house-showpiece-plant/1.webp', priceMin: 15, priceMax: 40 },
  { name: 'Chậu Cây Gốm Sứ Bắc Âu', description: 'Chậu cây mini bằng gốm tráng men phong cách Bắc Âu tĩnh lặng.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/1.webp', priceMin: 10, priceMax: 25 },
  { name: 'Đèn Bàn Cổ Điển Ánh Sáng Vàng', description: 'Đèn bàn trang trí với ánh sáng vàng ấm áp, thích hợp cho phòng ngủ.', category: Category.Home_Living, imageUrl: 'https://cdn.dummyjson.com/product-images/home-decoration/table-lamp/1.webp', priceMin: 45, priceMax: 90 },

  // Food (10)
  { name: 'Táo Nhập Khẩu Nguyên Thùng', description: 'Táo đỏ giòn ngọt, vỏ mỏng nhập khẩu chính ngạch 100% tươi mới.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/apple/1.webp', priceMin: 10, priceMax: 20 },
  { name: 'Thăn Bò Mỹ Làm Bít Tết', description: 'Thăn bò Mỹ thượng hạng vân mỡ cẩm thạch lý tưởng làm món bít tết.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/beef-steak/1.webp', priceMin: 40, priceMax: 80 },
  { name: 'Hạt Khô Dinh Dưỡng Cho Mèo', description: 'Thức ăn hạt cao cấp giúp mèo phát triển toàn diện, lông bóng mượt.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/cat-food/1.webp', priceMin: 20, priceMax: 35 },
  { name: 'Thịt Gà Tươi Sạch Đóng Gói', description: 'Thịt đùi gà tươi sạch đạt chuẩn an toàn thực phẩm, thịt chắc và ngọt.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/chicken-meat/1.webp', priceMin: 8, priceMax: 15 },
  { name: 'Dầu Ăn Hướng Dương Nguyên Chất', description: 'Dầu ăn chiết xuất từ hạt hướng dương, chứa nhiều Vitamin E tốt cho tim mạch.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/cooking-oil/1.webp', priceMin: 6, priceMax: 12 },
  { name: 'Dưa Leo Hữu Cơ Xanh Giòn', description: 'Dưa leo trồng theo tiêu chuẩn hữu cơ, ăn sống tươi mát, không hóa chất.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/cucumber/1.webp', priceMin: 3, priceMax: 8 },
  { name: 'Thức Ăn Hạt Khô Cho Chó Bổ Dưỡng', description: 'Cung cấp canxi và vitamin giúp hệ xương khớp của cún khỏe mạnh.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/dog-food/1.webp', priceMin: 25, priceMax: 45 },
  { name: 'Trứng Gà Tươi Vỏ Nâu Vĩ 10 Quả', description: 'Trứng gà lấy từ nông trại xanh, lòng đỏ béo ngậy, đạt chuẩn VietGAP.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/eggs/1.webp', priceMin: 4, priceMax: 8 },
  { name: 'Cá Hồi Fillet Nhập Khẩu Na Uy', description: 'Fillet cá hồi vân mỡ tự nhiên, tươi ngon thích hợp làm sushi hoặc áp chảo.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/fish-steak/1.webp', priceMin: 30, priceMax: 65 },
  { name: 'Ớt Chuông Xanh Đà Lạt', description: 'Ớt chuông giòn ngọt mọng nước, giàu vitamin C dùng làm salad tuyệt vời.', category: Category.Food, imageUrl: 'https://cdn.dummyjson.com/product-images/groceries/green-bell-pepper/1.webp', priceMin: 3, priceMax: 7 },

  // Electronics (10)
  { name: 'Macbook Pro 14 inch Space Grey', description: 'Siêu phẩm laptop Apple chip M mạnh mẽ, màn hình Liquid Retina XDR rực rỡ.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/1.webp', priceMin: 3500, priceMax: 4500 },
  { name: 'Laptop Asus Zenbook Hai Màn Hình', description: 'Công nghệ màn hình kép độc đáo, hỗ trợ tối đa cho designer và editor.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/1.webp', priceMin: 3000, priceMax: 4000 },
  { name: 'Laptop Huawei Matebook X Pro', description: 'Viền màn hình siêu mỏng, vỏ nhôm nguyên khối sang trọng cao cấp.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/1.webp', priceMin: 2500, priceMax: 3200 },
  { name: 'Laptop Lenovo Yoga Cảm Ứng Xoay', description: 'Máy tính xách tay xoay lật 360 độ, màn hình cảm ứng độ nhạy cao tiện lợi.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/1.webp', priceMin: 1800, priceMax: 2600 },
  { name: 'Dell XPS 13 Viền Màn Hình Tràn', description: 'Dòng máy doanh nhân siêu mỏng nhẹ, bàn phím gõ êm, màn 4K sắc nét.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/1.webp', priceMin: 2800, priceMax: 3500 },
  { name: 'Loa Thông Minh Amazon Echo Plus', description: 'Trợ lý ảo Alexa tích hợp âm thanh vòm 360 độ mạnh mẽ.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/1.webp', priceMin: 150, priceMax: 250 },
  { name: 'Tai Nghe Apple Airpods V2', description: 'Tai nghe TWS nhỏ gọn, kết nối ổn định trong hệ sinh thái Apple.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/1.webp', priceMin: 200, priceMax: 300 },
  { name: 'Tai Nghe Airpods Max Silver Chống Ồn', description: 'Trải nghiệm âm thanh đỉnh cao với chụp tai êm ái chống ồn tuyệt đối.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp', priceMin: 800, priceMax: 1200 },
  { name: 'Đế Sạc Không Dây AirPower', description: 'Đế sạc chuẩn Qi tốc độ cao, cùng lúc sạc nhiều thiết bị tiện dụng.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpower-wireless-charger/1.webp', priceMin: 50, priceMax: 100 },
  { name: 'Loa Trợ Lý Ảo HomePod Mini Đen', description: 'Âm bass dày dặn, điều khiển ngôi nhà thông minh bằng giọng nói.', category: Category.Electronics, imageUrl: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-homepod-mini-cosmic-grey/1.webp', priceMin: 120, priceMax: 200 },

  // Fashion (10)
  { name: 'Áo Sơ Mi Nam Kẻ Caro Xanh Đen', description: 'Chất liệu vải lanh thoáng mát, dáng áo suông rộng mặc thoải mái.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/1.webp', priceMin: 25, priceMax: 40 },
  { name: 'Áo Thun Nam Chơi Game Aorus', description: 'Áo thun cotton họa tiết dành riêng cho game thủ cực ngầu.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/1.webp', priceMin: 15, priceMax: 30 },
  { name: 'Áo Sơ Mi Caro Plaid Năng Động', description: 'Dễ dàng mix & match cùng quần jean, mang lại vẻ ngoài năng động trẻ trung.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/1.webp', priceMin: 20, priceMax: 45 },
  { name: 'Áo Sơ Mi Ngắn Tay Đi Biển', description: 'Chất vải lụa mềm mượt mỏng nhẹ, họa tiết sặc sỡ lý tưởng du lịch hè.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/1.webp', priceMin: 18, priceMax: 35 },
  { name: 'Áo Sơ Mi Kẻ Sọc Công Sở', description: 'Dáng vừa vặn tôn body, phù hợp đi làm hay tham gia các buổi tiệc.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/1.webp', priceMin: 30, priceMax: 60 },
  { name: 'Giày Jordan 1 Cổ Cao Đỏ Đen', description: 'Phiên bản sneaker bóng rổ kinh điển siêu hiếm được săn đón nhiều nhất.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/1.webp', priceMin: 350, priceMax: 600 },
  { name: 'Giày Thể Thao Nike Đinh Sân Cỏ', description: 'Đế đinh bám sân tuyệt đối, hỗ trợ lực bật nhảy cực mạnh khi thi đấu.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/1.webp', priceMin: 120, priceMax: 200 },
  { name: 'Giày Chạy Bộ Puma Trợ Lực', description: 'Lớp đệm xốp êm ái, bọc vải dệt thông minh hạn chế chấn thương cổ chân.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/1.webp', priceMin: 80, priceMax: 150 },
  { name: 'Sneaker Thể Thao Viền Đỏ Năng Động', description: 'Thiết kế hầm hố phá cách, đế độn cao 3cm giúp hack dáng nhẹ nhàng.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/1.webp', priceMin: 45, priceMax: 90 },
  { name: 'Sneaker Chạy Thể Dục Mềm Nhẹ', description: 'Đế cao su lưu hóa siêu dẻo dai, trọng lượng giày chưa tới 300g rất linh hoạt.', category: Category.Fashion, imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/1.webp', priceMin: 40, priceMax: 80 },
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

  console.log(`seedProducts done. Created: ${createdCount}. Distributed across ${sellers.length} seller(s).`);
}
