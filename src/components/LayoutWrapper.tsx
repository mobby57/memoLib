import { ReactNode } from 'react';

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        {children}
      </main>
    </div>
  );
}

export default LayoutWrapper;
