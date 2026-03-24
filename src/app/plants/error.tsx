'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function PlantsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Plants error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-900/20 border border-amber-800/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-green-50">
            Could not load plants
          </h2>
          <p className="text-green-400/60 text-sm leading-relaxed">
            We had trouble fetching the plant database. Please try again.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A2F23] hover:bg-[#243D2E] text-green-200 text-sm font-medium rounded-xl border border-green-800/30 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
