export default function Garden3DLoading() {
  return (
    <div className="h-[calc(100dvh-64px-68px)] md:h-[calc(100dvh-64px)] bg-[#0D1F17] flex flex-col animate-pulse">
      {/* Top bar skeleton */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-green-900/30">
        <div className="h-8 w-20 bg-green-900/30 rounded-lg" />
        <div className="h-4 w-32 bg-green-900/20 rounded-md hidden sm:block" />
        <div className="ml-auto flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-16 bg-green-900/30 rounded-lg hidden sm:block" />
          ))}
          <div className="h-8 w-10 bg-green-900/30 rounded-lg sm:hidden" />
        </div>
      </div>

      {/* Canvas area skeleton */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-900/30" />
            <div className="h-4 w-32 bg-green-900/20 rounded-md" />
          </div>
        </div>
        {/* Fake grid lines for depth */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        </div>
      </div>

      {/* Bottom sidebar skeleton (mobile) */}
      <div className="sm:hidden h-16 border-t border-green-900/30 flex items-center justify-around px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-10 h-10 bg-green-900/30 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
