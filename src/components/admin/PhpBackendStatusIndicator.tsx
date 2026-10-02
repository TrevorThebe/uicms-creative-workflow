import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  RefreshCw,
  Server,
  ShieldCheck,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';

export const PhpBackendStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);
  const [checkCount, setCheckCount] = useState<number>(0);
  const [backendInfo, setBackendInfo] = useState<{ phpVersion?: string; environment?: string; databaseConnected?: boolean } | null>(null);

  const checkBackendStatus = useCallback(async () => {
    setStatus('checking');
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch('/php-backend/api/index.php', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        setStatus('disconnected');
        setLatency(null);
        setErrorMessage(`HTTP Server Error (${response.status} ${response.statusText || 'Bad Response'})`);
        setLastChecked(new Date());
        return;
      }

      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.status !== 'online' || payload?.database_connected !== true) {
        setStatus('disconnected');
        setLatency(null);
        setErrorMessage(payload?.message || 'PHP Backend API returned unsuccessful payload status.');
        setLastChecked(new Date());
        setBackendInfo(null);
      } else {
        setStatus('connected');
        setLatency(latencyMs);
        setErrorMessage(null);
        setLastChecked(new Date());
        setCheckCount((prev) => prev + 1);
        setBackendInfo({
          phpVersion: payload.php_version,
          environment: payload.environment,
          databaseConnected: payload.database_connected,
        });
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setStatus('disconnected');
      setLatency(null);
      setLastChecked(new Date());

      if (err.name === 'AbortError') {
        setErrorMessage(`Request timed out after 6000ms. Check if Apache/PHP is running at localhost.`);
      } else {
        setErrorMessage(err.message || 'Network connection failed. Could not reach PHP endpoint.');
      }
    }
  }, []);

  // Poll every 10 seconds if autoPoll is enabled
  useEffect(() => {
    checkBackendStatus();

    if (!autoPoll) return;

    const intervalId = setInterval(() => {
      checkBackendStatus();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [autoPoll, checkBackendStatus]);

  const getTimeAgoString = (date: Date | null) => {
    if (!date) return 'Never checked';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 2) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                PHP Backend & MySQL Connectivity Monitor
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Live Poller
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Checks the PHP health endpoint and its live MySQL connection status.
            </p>
          </div>
        </div>

        {/* Action Controls & Auto Poll Toggle */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={autoPoll}
              onChange={(e) => setAutoPoll(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Auto-poll (10s)</span>
          </label>

          <button
            type="button"
            onClick={checkBackendStatus}
            disabled={status === 'checking'}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-950/50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
            <span>{status === 'checking' ? 'Pinging...' : 'Ping Backend Now'}</span>
          </button>
        </div>
      </div>

      {/* Main Status Display Banner */}
      <div
        className={`p-4 sm:p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          status === 'connected'
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-950/20'
            : status === 'disconnected'
            ? 'bg-rose-950/20 border-rose-500/30 text-rose-300 shadow-lg shadow-rose-950/20'
            : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
        }`}
      >
        {/* Status Badge & Primary Details */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`p-3 rounded-xl border flex-shrink-0 ${
              status === 'connected'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-950/50'
                : status === 'disconnected'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-md shadow-rose-950/50'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}
          >
            {status === 'connected' && <Wifi className="w-6 h-6 animate-pulse" />}
            {status === 'disconnected' && <WifiOff className="w-6 h-6" />}
            {status === 'checking' && <RefreshCw className="w-6 h-6 animate-spin" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : status === 'disconnected'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'connected'
                      ? 'bg-emerald-400 animate-ping'
                      : status === 'disconnected'
                      ? 'bg-rose-500'
                      : 'bg-amber-400 animate-spin'
                  }`}
                />
                {status === 'connected' ? 'CONNECTED' : status === 'disconnected' ? 'DISCONNECTED' : 'CHECKING STATUS...'}
              </span>

              {status === 'connected' && (
                <span className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Database Integration Active
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {status === 'connected' && (
                <>
                  PHP API health check passed{backendInfo?.phpVersion ? ` on PHP ${backendInfo.phpVersion}` : ''}.
                </>
              )}
              {status === 'disconnected' && (
                <span className="text-rose-200 font-semibold">
                  Unable to communicate with the PHP backend REST API. Check local Apache/MySQL server status.
                </span>
              )}
              {status === 'checking' && 'Checking the PHP API and database connection...'}
            </p>

            {errorMessage && (
              <div className="text-[11px] font-mono text-rose-300/90 pt-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>Error: {errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Polling Metrics Pill Group */}
        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 divide-x divide-slate-800 flex-shrink-0 self-start md:self-auto">
          <div className="pr-3 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Latency</span>
            <div className="flex items-center gap-1">
              <Zap className={`w-3.5 h-3.5 ${status === 'connected' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className={`font-bold ${status === 'connected' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {latency !== null ? `${latency} ms` : '—'}
              </span>
            </div>
          </div>

          <div className="px-3 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Last Poll</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-200">{getTimeAgoString(lastChecked)}</span>
            </div>
          </div>

          <div className="pl-3 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pings Sent</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-300 font-bold">{checkCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Details Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            PHP REST Endpoint
          </span>
          <p className="font-mono text-slate-200 text-xs truncate">/php-backend/api/index.php</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Database Connection
          </span>
          <p className="font-mono text-emerald-300 font-bold text-xs truncate">
            {backendInfo?.databaseConnected ? 'Connected' : 'Not verified'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            PHP Version
          </span>
          <p className="font-mono text-slate-200 text-xs font-semibold">
            {backendInfo?.phpVersion || '—'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            Environment
          </span>
          <p className="font-mono text-slate-200 text-xs truncate">{backendInfo?.environment || '—'}</p>
        </div>
      </div>
    </div>
  );
};
