export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-green-900/20 rounded-md" />
        </div>

        {/* Settings sections */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 dark:border-green-900/30 p-5 space-y-4">
            <div className="h-5 w-32 bg-gray-200 dark:bg-green-900/30 rounded-md" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 dark:bg-green-900/20 rounded-lg" />
              <div className="h-10 bg-gray-200 dark:bg-green-900/20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
