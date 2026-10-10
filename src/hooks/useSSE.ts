import { useEffect } from 'react';
import { logError } from '../utils/logger';

export const useSSE = (onUpdate: () => void) => {
  useEffect(() => {
    const endpoints = [
      '/php-backend/api/sse.php',
      'http://13.247.178.29/php-backend/api/sse.php',
      'http://localhost/php-backend/api/sse.php',
    ];

    let currentEndpointIndex = 0;
    let eventSource: EventSource | null = null;

    const connect = () => {
      if (currentEndpointIndex >= endpoints.length) {
        logError('SSE', 'All endpoints failed');
        return;
      }

      const url = endpoints[currentEndpointIndex];
      console.log(`[SSE] Connecting to URL: ${url}`);
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'refresh') {
          onUpdate();
        }
      };

      eventSource.onerror = (err) => {
        console.error(`[SSE] Error connecting to ${url}`, err);
        eventSource?.close();
        currentEndpointIndex++;
        connect();
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, [onUpdate]);
};
