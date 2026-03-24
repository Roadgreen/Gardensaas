'use client';

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg bg-gray-200 dark:bg-green-900/30',
        className
      )}
    />
  );
}

/** Skeleton matching the PlantCard layout */
export function PlantCardSkeleton() {
  return (
    <div className="rounded-xl p-6" style={{ background: 'var(--surface-container-low)' }}>
      {/* Plant image + name row */}
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4 mt-1">
        <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex-shrink-0" />
        <div className="flex-1 min-w-0 pt-0.5 sm:pt-1 space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-3.5 w-1/2 rounded-md" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-3.5 w-full rounded-md" />
        <Skeleton className="h-3.5 w-5/6 rounded-md" />
      </div>

      {/* Season badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>

      {/* Info row */}
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-3.5 w-16 rounded-md" />
        <Skeleton className="h-3.5 w-10 rounded-md" />
        <Skeleton className="h-3.5 w-14 rounded-md" />
      </div>
    </div>
  );
}

/** Skeleton matching the PlantListItem layout */
export function PlantListSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#142A1E] border border-gray-200 dark:border-green-900/40">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-2/5 rounded-md" />
        <Skeleton className="h-3 w-1/4 rounded-md" />
      </div>
      <div className="hidden sm:flex items-center gap-4">
        <Skeleton className="h-3 w-12 rounded-md" />
        <Skeleton className="h-3 w-10 rounded-md" />
        <Skeleton className="h-3 w-14 rounded-md" />
      </div>
    </div>
  );
}

/** Skeleton for dashboard weather widget */
export function WeatherCardSkeleton() {
  return (
    <div className="rounded-xl p-6 bg-gradient-to-br from-[#142A1E] to-[#1A3528]">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    </div>
  );
}
