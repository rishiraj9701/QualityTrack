import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800/80 rounded ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
      <div className="p-4 flex gap-4 bg-slate-50 dark:bg-slate-850">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4 items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-60" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
};
