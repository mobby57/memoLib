declare module 'sonner' {
  export const toast: {
    success: (message: string, options?: Record<string, unknown>) => void;
    error: (message: string, options?: Record<string, unknown>) => void;
    info: (message: string, options?: Record<string, unknown>) => void;
    warning: (message: string, options?: Record<string, unknown>) => void;
    message: (message: string, options?: Record<string, unknown>) => void;
  };
}
