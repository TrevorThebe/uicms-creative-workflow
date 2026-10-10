import { useEffect } from 'react';
import { logError } from './logger';

export const useGlobalErrorLogging = () => {
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      logError('Global', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError('UnhandledRejection', event.reason);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};
