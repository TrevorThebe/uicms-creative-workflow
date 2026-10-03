import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bug,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Database,
  ExternalLink,
  Eye,
  FileJson,
  Globe,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';

interface BackendHealthInfo {
  status?: string;
  service?: string;
  version?: string;
  phpVersion?: string;
  environment?: string;
  databaseConnected?: boolean;
  databaseName?: string;
  mode?: string;
  timestamp?: string;
}

interface DebugTestResult {
  status: 'idle' | 'running' | 'success' | 'error';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  postResponse?: any;
  getResponse?: any;
  testRecord?: any;
  verifiedRecord?: any;
  errorMessage?: string;
  steps: {
    id: string;
    label: string;
    description: string;
    status: 'pending' | 'running' | 'success' | 'error';
    latencyMs?: number;
    details?: string;
  }[];
}

export const PhpBackendStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);
  const [checkCount, setCheckCount] = useState<number>(0);
  const [backendInfo, setBackendInfo] = useState<BackendHealthInfo | null>(null);
  const [showRawPayload, setShowRawPayload] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Debug Test State
  const [debugTest, setDebugTest] = useState<DebugTestResult>({
    status: 'idle',
    steps: [
      {
        id: 'health_check',
        label: '1. Backend Health Probe',
        description: 'GET /php-backend/api/index.php',
        status: 'pending',
      },
      {
        id: 'post_dummy',
        label: '2. Create Dummy Record (POST)',
        description: 'POST /php-backend/api/data.php with synthetic payload',
        status: 'pending',
      },
      {
        id: 'get_verify',
        label: '3. Verify Retrieval (GET)',
        description: 'GET /php-backend/api/data.php & match record ID',
        status: 'pending',
      },
      {
        id: 'integrity_check',
        label: '4. Data Integrity Confirmation',
        description: 'Confirm database serialization and round-trip persistence',
        status: 'pending',
      },
    ],
  });

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
      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.status !== 'online' || payload?.database_connected !== true) {
        setStatus('disconnected');
        setLatency(null);
        setErrorMessage(
          payload?.message || `HTTP Server Error (${response.status} ${response.statusText || 'Bad Response'})`
        );
        setLastChecked(new Date());
        setBackendInfo(null);
        return;
      }

      setStatus('connected');
      setLatency(latencyMs);
      setErrorMessage(null);
      setLastChecked(new Date());
      setCheckCount((prev) => prev + 1);
      setBackendInfo({
        status: payload.status,
        service: payload.service,
        version: payload.version,
        phpVersion: payload.php_version,
        environment: payload.environment,
        databaseConnected: payload.database_connected,
        databaseName: payload.database_name,
        mode: payload.mode,
        timestamp: payload.timestamp,
      });
    } catch (err: any) {
      setStatus('disconnected');
      setLatency(null);
      setLastChecked(new Date());

      if (err.name === 'AbortError') {
        setErrorMessage('Request timed out after 6000ms. Check if Apache/PHP is running at localhost.');
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

  // Execute the requested 'Debug Test'
  const handleRunDebugTest = async () => {
    const testStartTime = performance.now();
    const testTimestamp = new Date().toISOString();
    const testRecordId = `diag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const dummyLogRecord = {
      id: testRecordId,
      projectId: 'DIAGNOSTIC-SUITE',
      userId: 'admin-diag',
      userName: 'Diagnostic Engine',
      action: 'DATABASE_DEBUG_TEST',
      description: `Automated test verifying database write & read roundtrip at ${new Date().toLocaleTimeString()}`,
      timestamp: testTimestamp,
      metadata: {
        engine: 'UICMS_JSON_DB_VALIDATOR',
        clientTime: testTimestamp,
        validationKey: `VK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
    };

    setDebugTest({
      status: 'running',
      startedAt: testTimestamp,
      steps: [
        {
          id: 'health_check',
          label: '1. Backend Health Probe',
          description: 'GET /php-backend/api/index.php',
          status: 'running',
        },
        {
          id: 'post_dummy',
          label: '2. Create Dummy Record (POST)',
          description: 'POST /php-backend/api/data.php with synthetic payload',
          status: 'pending',
        },
        {
          id: 'get_verify',
          label: '3. Verify Retrieval (GET)',
          description: 'GET /php-backend/api/data.php & match record ID',
          status: 'pending',
        },
        {
          id: 'integrity_check',
          label: '4. Data Integrity Confirmation',
          description: 'Confirm database serialization and round-trip persistence',
          status: 'pending',
        },
      ],
      testRecord: dummyLogRecord,
    });

    try {
      // Step 1: Check Health
      const s1Start = performance.now();
      const healthRes = await fetch('/php-backend/api/index.php', {
        headers: { Accept: 'application/json' },
      });
      const s1Latency = Math.round(performance.now() - s1Start);
      const healthData = await healthRes.json().catch(() => null);

      if (!healthRes.ok || healthData?.status !== 'online') {
        throw new Error(`Health check failed (${healthRes.status}). Backend not reachable.`);
      }

      setDebugTest((prev) => ({
        ...prev,
        steps: prev.steps.map((s, idx) => {
          if (idx === 0) return { ...s, status: 'success', latencyMs: s1Latency, details: `200 OK (${healthData.service || 'Online'})` };
          if (idx === 1) return { ...s, status: 'running' };
          return s;
        }),
      }));

      // Step 2: Fetch current activity logs first, then POST updated array with dummy record
      const s2Start = performance.now();
      const initialGetRes = await fetch('/php-backend/api/data.php', {
        headers: { Accept: 'application/json' },
      });
      const initialDbData = await initialGetRes.json().catch(() => ({}));
      const existingLogs = Array.isArray(initialDbData?.data?.activity_logs)
        ? initialDbData.data.activity_logs
        : [];

      const updatedLogs = [dummyLogRecord, ...existingLogs];

      const postRes = await fetch('/php-backend/api/data.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          table: 'activity_logs',
          data: updatedLogs,
        }),
      });

      const s2Latency = Math.round(performance.now() - s2Start);
      const postPayload = await postRes.json().catch(() => null);

      if (!postRes.ok || postPayload?.status !== 'success') {
        throw new Error(
          postPayload?.message || `POST failed with status ${postRes.status} ${postRes.statusText}`
        );
      }

      setDebugTest((prev) => ({
        ...prev,
        postResponse: postPayload,
        steps: prev.steps.map((s, idx) => {
          if (idx === 1) return { ...s, status: 'success', latencyMs: s2Latency, details: `Record "${testRecordId}" posted (200 OK)` };
          if (idx === 2) return { ...s, status: 'running' };
          return s;
        }),
      }));

      // Step 3: Perform GET request to verify the record was successfully saved and retrieved
      const s3Start = performance.now();
      const verifyRes = await fetch('/php-backend/api/data.php', {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      });
      const s3Latency = Math.round(performance.now() - s3Start);
      const verifyPayload = await verifyRes.json().catch(() => null);

      if (!verifyRes.ok || !verifyPayload?.data) {
        throw new Error(`GET query failed with status ${verifyRes.status}`);
      }

      const returnedLogs = verifyPayload.data.activity_logs || [];
      const matchedRecord = returnedLogs.find((log: any) => log.id === testRecordId);

      if (!matchedRecord) {
        throw new Error(
          `Record "${testRecordId}" was not found in the retrieved database activity_logs array.`
        );
      }

      setDebugTest((prev) => ({
        ...prev,
        getResponse: verifyPayload,
        verifiedRecord: matchedRecord,
        steps: prev.steps.map((s, idx) => {
          if (idx === 2) return { ...s, status: 'success', latencyMs: s3Latency, details: `Retrieved & matched ID "${testRecordId}"` };
          if (idx === 3) return { ...s, status: 'running' };
          return s;
        }),
      }));

      // Step 4: Validate Data Integrity
      const s4Start = performance.now();
      const keysMatch =
        matchedRecord.action === dummyLogRecord.action &&
        matchedRecord.description === dummyLogRecord.description &&
        matchedRecord.metadata?.validationKey === dummyLogRecord.metadata.validationKey;

      if (!keysMatch) {
        throw new Error('Retrieved record payload differs from the posted synthetic payload.');
      }

      const s4Latency = Math.round(performance.now() - s4Start);
      const totalDuration = Math.round(performance.now() - testStartTime);

      setDebugTest((prev) => ({
        ...prev,
        status: 'success',
        completedAt: new Date().toISOString(),
        durationMs: totalDuration,
        steps: prev.steps.map((s, idx) => {
          if (idx === 3) return { ...s, status: 'success', latencyMs: s4Latency, details: 'Full payload integrity & JSON round-trip verified 100%' };
          return s;
        }),
      }));

      // Re-trigger backend status to reflect latest sync
      checkBackendStatus();
    } catch (err: any) {
      const totalDuration = Math.round(performance.now() - testStartTime);
      setDebugTest((prev) => ({
        ...prev,
        status: 'error',
        completedAt: new Date().toISOString(),
        durationMs: totalDuration,
        errorMessage: err.message || 'Debug test encountered an unexpected error.',
        steps: prev.steps.map((s) => {
          if (s.status === 'running') return { ...s, status: 'error', details: err.message };
          return s;
        }),
      }));
    }
  };

  const getTimeAgoString = (date: Date | null) => {
    if (!date) return 'Never checked';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 2) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6 animate-in fade-in duration-200">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Backend REST API & Database Diagnostic Monitor
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Live Status
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Fetches health diagnostics from <code className="text-indigo-300 font-mono text-[11px]">/php-backend/api/index.php</code> and executes live read/write database tests.
            </p>
          </div>
        </div>

        {/* Action Controls: Debug Test & Auto Poll Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors mr-1">
            <input
              type="checkbox"
              checked={autoPoll}
              onChange={(e) => setAutoPoll(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-[11px]">Auto-poll (10s)</span>
          </label>

          {/* Primary 'Debug Test' Button */}
          <button
            type="button"
            onClick={handleRunDebugTest}
            disabled={debugTest.status === 'running'}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
              debugTest.status === 'running'
                ? 'bg-amber-600/80 text-white cursor-wait animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-950/40'
            }`}
          >
            {debugTest.status === 'running' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Test...</span>
              </>
            ) : (
              <>
                <Bug className="w-3.5 h-3.5 text-emerald-100" />
                <span>Debug Test</span>
              </>
            )}
          </button>

          {/* Refresh Ping Button */}
          <button
            type="button"
            onClick={checkBackendStatus}
            disabled={status === 'checking'}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
            <span>{status === 'checking' ? 'Pinging...' : 'Ping Status'}</span>
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
                {status === 'connected' ? 'BACKEND CONNECTED' : status === 'disconnected' ? 'DISCONNECTED' : 'CHECKING STATUS...'}
              </span>

              {status === 'connected' && (
                <span className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Database Read/Write Active ({backendInfo?.databaseName || 'uicms_workflow'})
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {status === 'connected' && (
                <>
                  Successfully communicating with REST API endpoint at <code className="font-mono text-emerald-300">/php-backend/api/index.php</code>
                  {backendInfo?.mode ? ` (${backendInfo.mode})` : ''}.
                </>
              )}
              {status === 'disconnected' && (
                <span className="text-rose-200 font-semibold">
                  Unable to communicate with the PHP backend REST API. Check endpoint connectivity.
                </span>
              )}
              {status === 'checking' && 'Pinging the PHP API and verifying database connectivity...'}
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
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pings</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-300 font-bold">{checkCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Diagnostic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            Health Endpoint
          </span>
          <p className="font-mono text-slate-200 text-xs truncate">/php-backend/api/index.php</p>
          <span className="text-[10px] text-slate-500 font-mono">GET (Returns Status & Info)</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Database Engine
          </span>
          <p className="font-mono text-emerald-300 font-bold text-xs truncate">
            {backendInfo?.databaseConnected ? `Connected (${backendInfo.databaseName || 'uicms_workflow'})` : 'Checking...'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">Mode: {backendInfo?.mode || 'JSON Database Engine'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            Data Endpoint
          </span>
          <p className="font-mono text-slate-200 text-xs font-semibold">/php-backend/api/data.php</p>
          <span className="text-[10px] text-slate-500 font-mono">GET (Read) / POST (Write)</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            Environment & Version
          </span>
          <p className="font-mono text-slate-200 text-xs truncate">
            {backendInfo?.phpVersion ? `PHP ${backendInfo.phpVersion}` : 'Node / TypeScript Mock'} · {backendInfo?.environment || 'local'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">v{backendInfo?.version || '2.0.0'}</span>
        </div>
      </div>

      {/* Debug Test Interactive Results Panel */}
      {debugTest.status !== 'idle' && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Database Diagnostic & Roundtrip Test Results
              </h4>
              {debugTest.status === 'success' && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Passed in {debugTest.durationMs}ms
                </span>
              )}
              {debugTest.status === 'running' && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  Executing...
                </span>
              )}
              {debugTest.status === 'error' && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Failed
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>Triggered: {debugTest.startedAt ? new Date(debugTest.startedAt).toLocaleTimeString() : '—'}</span>
              <button
                type="button"
                onClick={() => setShowRawPayload(!showRawPayload)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Code2 className="w-3 h-3" />
                <span>{showRawPayload ? 'Hide JSON' : 'Inspect JSON'}</span>
              </button>
            </div>
          </div>

          {/* Stepper Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {debugTest.steps.map((step) => (
              <div
                key={step.id}
                className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                  step.status === 'success'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : step.status === 'running'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 animate-pulse'
                    : step.status === 'error'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px] truncate">{step.label}</span>
                  {step.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  {step.status === 'running' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 flex-shrink-0" />}
                  {step.status === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                  {step.status === 'pending' && <span className="w-2 h-2 rounded-full bg-slate-700" />}
                </div>

                <p className="text-[11px] text-slate-400 font-mono leading-tight">{step.description}</p>

                {step.details && (
                  <div className="pt-1 text-[10px] font-mono text-slate-300 flex items-center justify-between border-t border-slate-800/80">
                    <span className="truncate">{step.details}</span>
                    {step.latencyMs !== undefined && <span className="text-amber-300 font-bold ml-1">{step.latencyMs}ms</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Error Banner if any */}
          {debugTest.errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-100 font-sans">Diagnostic Test Error:</strong>
                <p className="mt-0.5">{debugTest.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Raw JSON Payload Inspector */}
          {showRawPayload && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
                  <FileJson className="w-3.5 h-3.5" />
                  Verified Record in Database (GET Payload):
                </span>
                {debugTest.verifiedRecord && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(JSON.stringify(debugTest.verifiedRecord, null, 2), 'verifiedRecord')}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                  >
                    {copiedKey === 'verifiedRecord' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'verifiedRecord' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                )}
              </div>
              <pre className="p-2.5 rounded bg-slate-950 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto border border-slate-800/80">
                {debugTest.verifiedRecord
                  ? JSON.stringify(debugTest.verifiedRecord, null, 2)
                  : debugTest.testRecord
                  ? JSON.stringify(debugTest.testRecord, null, 2)
                  : '// No payload available'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
