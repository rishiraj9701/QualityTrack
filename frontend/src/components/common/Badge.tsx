import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'purple'
    | 'method-get'
    | 'method-post'
    | 'method-put'
    | 'method-patch'
    | 'method-delete';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  let variantClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  switch (variant) {
    case 'success':
      variantClasses = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80';
      break;
    case 'danger':
      variantClasses = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800/80';
      break;
    case 'warning':
      variantClasses = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/80';
      break;
    case 'info':
      variantClasses = 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-800/80';
      break;
    case 'purple':
      variantClasses = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80';
      break;
    case 'method-get':
      variantClasses = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 font-mono font-bold';
      break;
    case 'method-post':
      variantClasses = 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border-amber-300 dark:border-amber-700 font-mono font-bold';
      break;
    case 'method-put':
      variantClasses = 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-400 border-sky-300 dark:border-sky-700 font-mono font-bold';
      break;
    case 'method-patch':
      variantClasses = 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-400 border-purple-300 dark:border-purple-700 font-mono font-bold';
      break;
    case 'method-delete':
      variantClasses = 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border-rose-300 dark:border-rose-700 font-mono font-bold';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-medium transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const MethodBadge: React.FC<{ method: string; size?: 'sm' | 'md' }> = ({ method, size = 'sm' }) => {
  const m = method.toUpperCase();
  let v: any = 'default';
  if (m === 'GET') v = 'method-get';
  else if (m === 'POST') v = 'method-post';
  else if (m === 'PUT') v = 'method-put';
  else if (m === 'PATCH') v = 'method-patch';
  else if (m === 'DELETE') v = 'method-delete';

  return <Badge variant={v} size={size}>{m}</Badge>;
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const s = status.toUpperCase();
  let v: any = 'default';
  if (s === 'PASSED' || s === 'RESOLVED' || s === 'CLOSED') v = 'success';
  else if (s === 'FAILED' || s === 'CRITICAL') v = 'danger';
  else if (s === 'ERROR' || s === 'HIGH' || s === 'IN PROGRESS') v = 'warning';
  else if (s === 'RUNNING' || s === 'OPEN') v = 'info';
  else if (s === 'SKIPPED') v = 'default';

  return <Badge variant={v} size={size}>{status}</Badge>;
};
