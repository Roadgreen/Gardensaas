export default function TipsLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-44 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-green-900/20 rounded-md" />
        </div>

        {/* Tip cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
