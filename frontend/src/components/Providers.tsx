import type { ReactNode } from "react";
import { ToastContainer } from "./Toast";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
