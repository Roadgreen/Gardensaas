export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
          <div className="h-4 w-72 bg-gray-200 dark:bg-green-900/20 rounded-md" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Large card */}
          <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
          {/* Side card */}
          <div className="h-64 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
          <div className="h-48 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
        </div>
      </div>
    </div>
  );
}
