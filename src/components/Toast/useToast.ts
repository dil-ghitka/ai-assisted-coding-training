import { useState, useCallback } from 'react';

export interface ToastState {
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  open: boolean;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    severity: 'info',
    open: false,
  });

  const showToast = useCallback(
    (message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'info') => {
      setToast({ message, severity, open: true });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};
