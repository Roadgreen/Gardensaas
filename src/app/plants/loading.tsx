export default function PlantsLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] py-6 sm:py-8 px-4 sm:px-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 space-y-2">
          <div className="h-9 w-56 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
          <div className="h-4 w-40 bg-gray-200 dark:bg-green-900/20 rounded-md" />
        </div>

        {/* Search bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-12 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
          <div className="flex gap-2">
            <div className="h-12 w-32 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
            <div className="h-12 w-20 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
          </div>
        </div>

        {/* Results count */}
        <div className="h-4 w-24 bg-gray-200 dark:bg-green-900/20 rounded-md mb-4" />

        {/* Plant grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-green-900/30 overflow-hidden">
              <div className="h-32 bg-gray-200 dark:bg-green-900/20" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-green-900/30 rounded-md" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-green-900/20 rounded-md" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-16 bg-gray-200 dark:bg-green-900/20 rounded-full" />
                  <div className="h-6 w-12 bg-gray-200 dark:bg-green-900/20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
