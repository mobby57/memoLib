import { classifyError, reportError } from '@/lib/error-handler';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface RunUiAsyncActionOptions<T> {
  action: () => Promise<T>;
  showToast?: (message: string, variant: ToastVariant, title?: string) => void;
  successMessage?: string;
  fallbackErrorMessage?: string;
  context?: Record<string, unknown>;
}

/**
 * Runs an async UI action with standardized error handling and optional user feedback.
 */
export async function runUiAsyncAction<T>({
  action,
  showToast,
  successMessage,
  fallbackErrorMessage,
  context,
}: RunUiAsyncActionOptions<T>): Promise<T | null> {
  try {
    const result = await action();
    if (successMessage && showToast) {
      showToast(successMessage, 'success');
    }
    return result;
  } catch (error) {
    const classified = classifyError(error);
    reportError(classified, context);

    if (showToast) {
      showToast(fallbackErrorMessage || classified.userMessage, 'error');
    }

    return null;
  }
}
