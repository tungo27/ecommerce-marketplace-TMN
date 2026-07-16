interface Review {
  id: string;
  avatarUrl: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

const REVIEWS: Review[] = [
  {
    id: '1',
    avatarUrl: 'https://picsum.photos/seed/user-review-1/80/80',
    name: 'Nguyễn Thị Lan',
    rating: 5,
    comment: 'Sản phẩm chất lượng tuyệt vời! Giao hàng nhanh, đóng gói cẩn thận. Sẽ quay lại mua tiếp!',
    date: '12/07/2025',
  },
  {
    id: '2',
    avatarUrl: 'https://picsum.photos/seed/user-review-2/80/80',
    name: 'Trần Minh Tuấn',
    rating: 5,
    comment: 'Mình rất hài lòng với trải nghiệm mua sắm. Shop tư vấn nhiệt tình và giao hàng đúng hẹn.',
    date: '10/07/2025',
  },
  {
    id: '3',
    avatarUrl: 'https://picsum.photos/seed/user-review-3/80/80',
    name: 'Phạm Hồng Nhung',
    rating: 4,
    comment: 'Sản phẩm đúng mô tả, chất liệu đẹp. Giá cả hợp lý so với chất lượng nhận được.',
    date: '08/07/2025',
  },
  {
    id: '4',
    avatarUrl: 'https://picsum.photos/seed/user-review-4/80/80',
    name: 'Lê Văn Đức',
    rating: 5,
    comment: 'Ứng dụng dễ sử dụng, thanh toán nhanh. Đây là lần mua thứ 3 của mình rồi, cực kỳ tin tưởng!',
    date: '05/07/2025',
  },
];

const PARTNERS = [
  { name: 'Visa', color: 'text-blue-700' },
  { name: 'MasterCard', color: 'text-red-600' },
  { name: 'MoMo', color: 'text-pink-600' },
  { name: 'VNPay', color: 'text-blue-500' },
  { name: 'ZaloPay', color: 'text-blue-400' },
  { name: 'GHN', color: 'text-orange-500' },
  { name: 'GHTK', color: 'text-red-500' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function HomepageSocialProof() {
  return (
    <section className="rounded-2xl bg-white px-6 py-10 shadow-sm sm:px-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
          Khách Hàng Nói Gì?
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Hơn 10.000 khách hàng hài lòng đã tin chọn chúng tôi
        </p>
        {/* Overall rating */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <StarRating rating={5} />
          <span className="text-xl font-black text-gray-900">4.9</span>
          <span className="text-sm text-gray-400">/ 5.0</span>
        </div>
      </div>

      {/* Reviews grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REVIEWS.map((review) => (
          <div
            key={review.id}
            className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-5 transition-shadow duration-300 hover:shadow-md"
          >
            {/* Stars */}
            <StarRating rating={review.rating} />
            {/* Comment */}
            <p className="flex-1 text-sm text-gray-700 leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
            {/* User */}
            <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
              <img
                src={review.avatarUrl}
                alt={review.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-orange-100"
              />
              <div>
                <p className="text-sm font-bold text-gray-900">{review.name}</p>
                <p className="text-xs text-gray-400">{review.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Partner logos */}
      <div className="mt-10 border-t border-gray-100 pt-8">
        <p className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
          Đối Tác Thanh Toán & Vận Chuyển
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {PARTNERS.map((partner) => (
            <div
              key={partner.name}
              className="flex h-10 min-w-[72px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50"
            >
              <span className={`text-sm font-extrabold tracking-tight ${partner.color}`}>
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
