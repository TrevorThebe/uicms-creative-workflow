import { useEffect } from 'react';

export const useSSE = (onUpdate: () => void) => {
  useEffect(() => {
    const url = '/php-backend/api/sse.php';
    console.log(`[SSE] Connecting to: ${url}`);
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'refresh') {
        onUpdate();
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onUpdate]);
};
