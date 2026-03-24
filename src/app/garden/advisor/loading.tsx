export default function AdvisorLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] flex flex-col animate-pulse">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-green-900/30 flex items-center gap-3">
        <div className="h-8 w-8 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
        <div className="h-6 w-32 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
      </div>

      {/* Chat area */}
      <div className="flex-1 p-4 space-y-4 max-w-3xl mx-auto w-full">
        {/* Bot message skeleton */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-green-900/30 shrink-0" />
          <div className="space-y-2 flex-1 max-w-[80%]">
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-green-900/20 rounded-md" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-green-900/20 rounded-md" />
          </div>
        </div>
        {/* Quick reply buttons skeleton */}
        <div className="flex gap-2 pl-11">
          <div className="h-8 w-24 bg-gray-200 dark:bg-green-900/20 rounded-full" />
          <div className="h-8 w-28 bg-gray-200 dark:bg-green-900/20 rounded-full" />
          <div className="h-8 w-20 bg-gray-200 dark:bg-green-900/20 rounded-full" />
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 dark:border-green-900/30">
        <div className="max-w-3xl mx-auto h-12 bg-gray-200 dark:bg-green-900/20 rounded-xl" />
      </div>
    </div>
  );
}
