export type ToastVariant = 'success' | 'error';

export type ToastPayload = {
  message: string;
  variant: ToastVariant;
};

type ToastListener = (payload: ToastPayload) => void;

const listeners = new Set<ToastListener>();

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(payload: ToastPayload) {
  listeners.forEach((listener) => listener(payload));
}

export const toast = {
  success: (message: string) => emit({ message, variant: 'success' }),
  error: (message: string) => emit({ message, variant: 'error' }),
};
