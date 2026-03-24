export default function SetupLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
          <div className="h-4 w-72 bg-gray-200 dark:bg-green-900/20 rounded-md" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 justify-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-green-900/20 rounded-full" />
              {i < 3 && <div className="w-12 h-0.5 bg-gray-200 dark:bg-green-900/20" />}
            </div>
          ))}
        </div>

        {/* Form area */}
        <div className="h-80 bg-gray-200 dark:bg-green-900/20 rounded-xl border border-gray-100 dark:border-green-900/30" />

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <div className="h-11 w-24 bg-gray-200 dark:bg-green-900/20 rounded-xl" />
          <div className="h-11 w-24 bg-gray-200 dark:bg-green-900/30 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
