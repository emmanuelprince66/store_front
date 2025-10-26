// ============================================
// FILE: components/skeletons/ProductCardSkeleton.tsx
// ============================================

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
    <div className="w-full h-56 bg-gray-200"></div>
    <div className="p-5 space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-12 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

// ============================================
// FILE: components/skeletons/HeaderSkeleton.tsx
// ============================================

export const HeaderSkeleton = () => (
  <header className="bg-white shadow-md z-20 sticky top-0">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-200 p-2 rounded-xl w-12 h-12 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    </div>
  </header>
);
