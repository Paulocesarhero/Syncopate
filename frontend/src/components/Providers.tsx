import type { ReactNode } from 'react';
import { AppProvider, ToastProvider } from '../context';
import { ToastContainer } from './Toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AppProvider>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </AppProvider>
  );
}