import { Search, Home, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🌵</div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-green-50">
            Page not found
          </h2>
          <p className="text-green-400/60 text-sm leading-relaxed">
            This plot is empty! The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
          <Link
            href="/plants"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A2F23] hover:bg-[#243D2E] text-green-200 text-sm font-medium rounded-xl border border-green-800/30 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Browse plants
          </Link>
        </div>
      </div>
    </div>
  );
}
