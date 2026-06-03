import { useEffect, useState } from 'react';
import { subscribeToast, type ToastPayload } from '@/utils/toast';
import { cn } from '@/utils';

type ToastItem = ToastPayload & {
  id: string;
};

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToast((payload) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, ...payload }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, AUTO_DISMISS_MS);
    });
  }, []);

  return (
    <>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[200] flex max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto animate-[slideIn_0.25s_ease-out] rounded-lg border px-4 py-3 text-sm font-medium shadow-lg',
              t.variant === 'success' &&
                'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100',
              t.variant === 'error' &&
                'border-ember-200 bg-ember-50 text-ember-800 dark:border-ember-900 dark:bg-ember-950/90 dark:text-ember-200',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
