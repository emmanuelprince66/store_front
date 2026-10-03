export const ProductCardSkeleton = () => (
  <div className="flex flex-col animate-pulse">
    <div className="w-full aspect-square bg-[#f0f0f0] rounded-2xl"></div>
    <div className="pt-4 px-1 space-y-2">
      <div className="h-4 bg-[#f0f0f0] rounded w-3/4"></div>
      <div className="h-3 bg-[#f0f0f0] rounded w-1/3"></div>
      <div className="h-5 bg-[#f0f0f0] rounded w-1/2"></div>
    </div>
  </div>
);

export const HeaderSkeleton = () => (
  <header className="bg-white border-b border-gray-200 z-30 sticky top-0">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#f0f0f0] rounded-md w-9 h-9 sm:w-10 sm:h-10 animate-pulse"></div>
          <div className="h-6 bg-[#f0f0f0] rounded w-32 animate-pulse"></div>
        </div>
        <div className="w-10 h-10 bg-[#f0f0f0] rounded-full animate-pulse"></div>
      </div>
    </div>
  </header>
);
