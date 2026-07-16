import Header from '@/components/Header';

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />

      <main className="mx-auto max-w-[1600px] px-4 py-8">
        {/* Breadcrumbs Skeleton */}
        <div className="mb-6 h-5 w-64 rounded bg-gray-200 animate-pulse"></div>

        <div className="rounded-[1.25rem] bg-white p-6 shadow-sm lg:p-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            
            {/* Left: Image Skeleton */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square w-full rounded-xl bg-gray-200 animate-pulse border border-gray-100"></div>
              <div className="flex gap-4 overflow-hidden pb-2">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="h-24 w-24 flex-shrink-0 rounded-lg bg-gray-200 animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Right: Info Skeleton */}
            <div className="flex flex-col">
              <div className="mb-2 h-4 w-24 rounded bg-gray-200 animate-pulse"></div>
              
              <div className="h-10 w-3/4 rounded bg-gray-200 animate-pulse mb-4"></div>
              <div className="h-10 w-1/2 rounded bg-gray-200 animate-pulse"></div>

              <div className="mt-6 flex items-center gap-4">
                <div className="h-5 w-32 rounded bg-gray-200 animate-pulse"></div>
                <div className="h-5 w-24 rounded bg-gray-200 animate-pulse"></div>
              </div>

              <div className="mt-8 flex items-end gap-4 border-b border-gray-100 pb-6">
                <div className="h-12 w-48 rounded bg-gray-200 animate-pulse"></div>
                <div className="mb-1 h-6 w-24 rounded bg-gray-200 animate-pulse"></div>
              </div>

              <div className="mt-6">
                <div className="h-4 w-32 rounded bg-gray-200 animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full rounded bg-gray-200 animate-pulse"></div>
                  <div className="h-4 w-5/6 rounded bg-gray-200 animate-pulse"></div>
                  <div className="h-4 w-4/6 rounded bg-gray-200 animate-pulse"></div>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <div className="h-14 w-36 rounded-md bg-gray-200 animate-pulse"></div>
                <div className="h-14 flex-1 rounded-md bg-gray-200 animate-pulse"></div>
              </div>

              {/* Trust badges Skeleton */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-4">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="h-3 w-16 rounded bg-gray-200 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
