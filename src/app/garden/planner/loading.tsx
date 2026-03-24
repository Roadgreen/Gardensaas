export default function PlannerLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] p-4 sm:p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
          <div className="h-7 w-40 bg-gray-200 dark:bg-green-900/30 rounded-lg" />
        </div>

        {/* Toolbar */}
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-20 bg-gray-200 dark:bg-green-900/20 rounded-lg border border-gray-100 dark:border-green-900/30" />
          ))}
        </div>

        {/* Grid canvas area */}
        <div className="aspect-[4/3] max-h-[70vh] bg-gray-200 dark:bg-green-900/10 rounded-xl border border-gray-100 dark:border-green-900/30">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(74,222,128,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        </div>
      </div>
    </div>
  );
}
