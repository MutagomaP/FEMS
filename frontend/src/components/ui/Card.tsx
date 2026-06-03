import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function Card({ title, description, action, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>}
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn(!title && !description && !action ? 'p-5' : 'p-5')}>{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  accent = 'fire',
}: {
  label: string;
  value: string | number;
  accent?: 'fire' | 'ember' | 'amber' | 'slate';
}) {
  const accents = {
    fire: 'from-fire-500/20 to-fire-600/10 text-fire-700 dark:text-fire-300',
    ember: 'from-ember-500/20 to-ember-600/10 text-ember-700 dark:text-ember-300',
    amber: 'from-amber-500/20 to-amber-600/10 text-amber-700 dark:text-amber-300',
    slate: 'from-slate-500/10 to-slate-600/5 text-slate-700 dark:text-slate-300',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={cn(
          'mt-2 text-3xl font-bold bg-gradient-to-br bg-clip-text text-transparent',
          accents[accent],
        )}
      >
        {value}
      </p>
    </div>
  );
}
