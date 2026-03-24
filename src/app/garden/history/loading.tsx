export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-52 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
          <div className="h-4 w-80 bg-gray-200 dark:bg-green-900/20 rounded-md" />
        </div>

        {/* Year tabs */}
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-20 bg-gray-200 dark:bg-green-900/20 rounded-lg" />
          ))}
        </div>

        {/* Timeline entries */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-green-900/20 rounded-full shrink-0" />
              <div className="flex-1 h-20 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
