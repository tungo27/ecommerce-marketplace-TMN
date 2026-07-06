import Image from 'next/image';

interface ProductProps {
  product: any;
}

export default function ProductCard({ product }: ProductProps) {
  // Giả lập giá gốc cao hơn 15% để làm UI giảm giá y hình VietMart
  const originalPrice = (Number(product.price) * 1.15).toFixed(0);
  
  return (
    <div className="bg-white border border-gray-100 rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full overflow-hidden relative">
      {/* Discount Tag */}
      <div className="absolute top-2 left-2 bg-[#FF4742] text-white text-xs font-bold px-2 py-1 rounded z-10">
        -15%
      </div>
      
      <div className="relative w-full aspect-square bg-gray-50">
        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-xs text-gray-500 mb-1">{product.seller?.name || 'Official Store'}</p>
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
        
        {/* Rating Stars */}
        <div className="flex items-center text-yellow-400 text-xs mb-2">
          ★★★★★ <span className="text-gray-400 ml-1">({Math.floor(Math.random() * 50) + 1})</span>
        </div>

        <div className="mt-auto">
          <div className="text-[#FF4742] font-bold text-lg mb-1">
            {Number(product.price).toLocaleString('vi-VN')} ₫
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 line-through">{Number(originalPrice).toLocaleString('vi-VN')} ₫</span>
            <span className="text-gray-500">Stock: {product.stock}</span>
          </div>
        </div>
      </div>
    </div>
  );
}