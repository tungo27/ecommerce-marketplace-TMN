import Link from 'next/link';

interface HeroBannerProps {
  product?: any;
  heroImage?: string;
  heroProductId?: string;
}

export default function HeroBanner({ product, heroImage, heroProductId }: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-primary text-white shadow-xl">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-8 px-6 py-14 md:flex-row md:px-12 md:py-16 lg:px-20">
        {/* Left content */}
        <div className="flex-1 text-center md:text-left">
          <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            Summer Deals
          </span>
          <h2 className="mt-5 text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Mega Summer Sale
            <br />
            <span className="text-yellow-200">Up To 50% Off</span>
          </h2>
          <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
            Thousands of authentic products are waiting for you — electronics, fashion, cosmetics, and groceries.
            Shop now before they run out!
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
            <Link
              href={heroProductId ? `/products/${heroProductId}` : product ? `/products/${product.id}` : '/?category=Electronics'}
              style={{ backgroundColor: '#ffffff', color: '#ea580c' }}
              className="group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-extrabold shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              SHOP NOW
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-10 flex flex-wrap justify-center gap-8 md:justify-start">
            {[
              { value: '50+', label: 'Products' },
              { value: '10+', label: 'Sellers' },
              { value: '4.9★', label: 'Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-xs text-white/75 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right image */}
        <div className="relative hidden md:block md:w-64 lg:w-80">
          <div className="absolute -top-4 -right-4 z-10 rounded-2xl bg-red-500 px-4 py-2 text-center shadow-xl">
            <p className="text-xs font-semibold text-white/80">Save up to</p>
            <p className="text-3xl font-black text-white leading-none">50%</p>
          </div>
          <img
            src={heroImage || product?.images?.[0] || "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop"}
            alt="Hero Shopping"
            className="h-72 w-full rounded-2xl object-cover shadow-2xl ring-4 ring-white/20 transition-transform duration-500 hover:-translate-y-2 lg:h-80 bg-white"
          />
        </div>
      </div>
    </section>
  );
}
