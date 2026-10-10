import { useEffect } from 'react';
import { logError } from '../utils/logger';

export const useSSE = (onUpdate: () => void) => {
  useEffect(() => {
    const url = '/php-backend/api/sse.php';
    console.log(`[SSE] Connecting to origin: ${window.location.origin}, URL: ${url}, Full URL: ${window.location.origin + url}`);
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'refresh') {
        onUpdate();
      }
    };

    eventSource.onerror = (err) => {
      logError('SSE', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onUpdate]);
};
