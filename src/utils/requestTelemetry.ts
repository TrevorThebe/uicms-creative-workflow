/**
 * Database Request Telemetry & Frequency Tracer
 * Captures all incoming and outgoing database requests to /php-backend/*
 * Calculates real-time requests/minute, latency, payload sizes, and failure rates.
 */

export interface DatabaseRequestTrace {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  endpoint: string;
  status: number;
  statusText: string;
  durationMs: number;
  payloadBytes: number;
  responseBytes: number;
  success: boolean;
  actionSummary?: string;
}

export interface TelemetryStats {
  totalRequests: number;
  getRequests: number;
  postRequests: number;
  failedRequests: number;
  successRate: number;
  requestsPerMinute: number;
  avgLatencyMs: number;
  peakLatencyMs: number;
  totalTransferredBytes: number;
  avgPayloadBytes: number;
  peakPayloadBytes: number;
  recentTraces: DatabaseRequestTrace[];
  healthStatus: 'optimal' | 'moderate' | 'critical';
  healthMessage: string;
}

type Listener = (stats: TelemetryStats) => void;

class RequestTelemetryService {
  private traces: DatabaseRequestTrace[] = [];
  private listeners: Set<Listener> = new Set();
  private maxTraces = 60;
  private totalRequests = 0;
  private getCount = 0;
  private postCount = 0;
  private failCount = 0;
  private totalLatencyMs = 0;
  private peakLatencyMs = 0;
  private totalBytes = 0;
  private totalPayloadBytes = 0;
  private peakPayloadBytes = 0;

  constructor() {
    this.installFetchInterceptor();
  }

  private installFetchInterceptor() {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

    try {
      const originalFetch = window.fetch.bind(window);
      const self = this;

      const patchedFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let urlStr = '';
        try {
          urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url || '';
        } catch {
          urlStr = String(input);
        }

        const isBackendApi = urlStr.includes('/php-backend/') || urlStr.includes('/api/');

        if (!isBackendApi) {
          return originalFetch(input, init);
        }

        const method = (init?.method || 'GET').toUpperCase();
        const startTime = performance.now();
        let payloadSize = 0;

        if (init?.body) {
          try {
            if (typeof init.body === 'string') {
              payloadSize = new Blob([init.body]).size;
            } else if (init.body instanceof Blob) {
              payloadSize = init.body.size;
            } else if (init.body instanceof ArrayBuffer) {
              payloadSize = init.body.byteLength;
            }
          } catch {}
        }

        let actionSummary = '';
        if (init?.body && typeof init.body === 'string') {
          try {
            const parsed = JSON.parse(init.body);
            if (parsed.action) actionSummary = `Action: ${parsed.action}`;
            else if (parsed.table) actionSummary = `Table: ${parsed.table}`;
            else if (parsed.data) {
              const keys = Object.keys(parsed.data);
              actionSummary = `Bulk Sync (${keys.length} entities: ${keys.slice(0, 3).join(', ')})`;
            }
          } catch {}
        }

        try {
          const response = await originalFetch(input, init);
          const durationMs = Math.round(performance.now() - startTime);

          // Estimate response bytes from headers if available
          let responseBytes = 0;
          try {
            const contentLength = response.headers?.get?.('content-length');
            responseBytes = contentLength ? parseInt(contentLength, 10) : 0;
          } catch {}

          self.recordTrace({
            id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date().toISOString(),
            method,
            url: urlStr,
            endpoint: urlStr.split('?')[0],
            status: response.status,
            statusText: response.statusText,
            durationMs,
            payloadBytes: payloadSize,
            responseBytes,
            success: response.ok,
            actionSummary,
          });

          return response;
        } catch (err: any) {
          const durationMs = Math.round(performance.now() - startTime);
          self.recordTrace({
            id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date().toISOString(),
            method,
            url: urlStr,
            endpoint: urlStr.split('?')[0],
            status: 0,
            statusText: err?.message || 'Network Failure',
            durationMs,
            payloadBytes: payloadSize,
            responseBytes: 0,
            success: false,
            actionSummary: err?.message || 'Failed Network Call',
          });
          throw err;
        }
      };

      // Safely assign fetch avoiding Firefox & sandboxed iframe "getter-only property 'fetch'" error
      try {
        Object.defineProperty(window, 'fetch', {
          value: patchedFetch,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        try {
          (window as any).fetch = patchedFetch;
        } catch {
          // If environment prevents modifying fetch, continue gracefully
        }
      }
    } catch (err) {
      console.warn('RequestTelemetryService: fetch interceptor bypassed gracefully:', err);
    }
  }

  public recordTrace(trace: DatabaseRequestTrace) {
    this.traces.unshift(trace);
    if (this.traces.length > this.maxTraces) {
      this.traces.pop();
    }

    this.totalRequests++;
    if (trace.method === 'GET') this.getCount++;
    if (trace.method === 'POST') this.postCount++;
    if (!trace.success) this.failCount++;

    this.totalLatencyMs += trace.durationMs;
    if (trace.durationMs > this.peakLatencyMs) this.peakLatencyMs = trace.durationMs;

    const netBytes = trace.payloadBytes + trace.responseBytes;
    this.totalBytes += netBytes;
    this.totalPayloadBytes += trace.payloadBytes;
    if (trace.payloadBytes > this.peakPayloadBytes) this.peakPayloadBytes = trace.payloadBytes;

    this.notify();
  }

  public getStats(): TelemetryStats {
    const now = Date.now();
    // Count requests in the last 60 seconds
    const oneMinAgo = now - 60000;
    const recentOneMinTraces = this.traces.filter(
      (t) => new Date(t.timestamp).getTime() > oneMinAgo
    );
    const rpm = recentOneMinTraces.length;

    const avgLatency = this.totalRequests > 0 ? Math.round(this.totalLatencyMs / this.totalRequests) : 0;
    const avgPayload = this.postCount > 0 ? Math.round(this.totalPayloadBytes / this.postCount) : 0;
    const successRate = this.totalRequests > 0 ? Math.round(((this.totalRequests - this.failCount) / this.totalRequests) * 100) : 100;

    let healthStatus: 'optimal' | 'moderate' | 'critical' = 'optimal';
    let healthMessage = 'Normal request frequency. Database load is within safe AWS operating limits.';

    if (rpm > 35 || this.failCount > 3) {
      healthStatus = 'critical';
      healthMessage = `Critical frequency (${rpm} req/min). High risk of AWS MySQL connection pool exhaustion or OOM crash.`;
    } else if (rpm >= 15 || avgPayload > 15000) {
      healthStatus = 'moderate';
      healthMessage = `Elevated activity (${rpm} req/min, ${Math.round(avgPayload / 1024)} KB avg payload). Monitor AWS memory usage.`;
    }

    return {
      totalRequests: this.totalRequests,
      getRequests: this.getCount,
      postRequests: this.postCount,
      failedRequests: this.failCount,
      successRate,
      requestsPerMinute: rpm,
      avgLatencyMs: avgLatency,
      peakLatencyMs: this.peakLatencyMs,
      totalTransferredBytes: this.totalBytes,
      avgPayloadBytes: avgPayload,
      peakPayloadBytes: this.peakPayloadBytes,
      recentTraces: [...this.traces],
      healthStatus,
      healthMessage,
    };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getStats());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const stats = this.getStats();
    for (const listener of this.listeners) {
      try {
        listener(stats);
      } catch {}
    }
  }

  public clear() {
    this.traces = [];
    this.totalRequests = 0;
    this.getCount = 0;
    this.postCount = 0;
    this.failCount = 0;
    this.totalLatencyMs = 0;
    this.peakLatencyMs = 0;
    this.totalBytes = 0;
    this.totalPayloadBytes = 0;
    this.peakPayloadBytes = 0;
    this.notify();
  }
}

export const requestTelemetry = new RequestTelemetryService();
