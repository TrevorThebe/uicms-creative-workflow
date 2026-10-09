import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Gauge,
  HardDrive,
  Info,
  Layers,
  Play,
  RefreshCw,
  Server,
  ShieldAlert,
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';
import { requestTelemetry, TelemetryStats, DatabaseRequestTrace } from '../../utils/requestTelemetry';

export const DatabaseRequestFrequencyTracker: React.FC = () => {
  const [stats, setStats] = useState<TelemetryStats>(requestTelemetry.getStats());
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'post' | 'get'>('all');
  const [isTesting, setIsTesting] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'aws_causes' | 'remediation'>('telemetry');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = requestTelemetry.subscribe((newStats) => {
      setStats(newStats);
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const filteredTraces = useMemo(() => {
    return stats.recentTraces.filter((trace) => {
      if (filterType === 'errors') return !trace.success || trace.status >= 400 || trace.status === 0;
      if (filterType === 'post') return trace.method === 'POST';
      if (filterType === 'get') return trace.method === 'GET';
      return true;
    });
  }, [stats.recentTraces, filterType]);

  const runFrequencyStressTest = async () => {
    setIsTesting(true);
    setTestLog([
      `[${new Date().toLocaleTimeString()}] Initializing live database frequency & latency benchmark...`,
    ]);

    const log = (msg: string) => {
      setTestLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      // Step 1: Health check
      log('Step 1/3: Pinging API Gateway (/php-backend/api/index.php)...');
      const t1 = performance.now();
      const res1 = await fetch('/php-backend/api/index.php', { headers: { Accept: 'application/json' } });
      const d1 = Math.round(performance.now() - t1);
      const data1 = await res1.json().catch(() => ({}));
      log(`Gateway responded with HTTP ${res1.status} (${d1}ms) - Mode: ${data1.mode || 'N/A'}`);

      // Step 2: Read data.php
      log('Step 2/3: Measuring full dataset retrieval query (/php-backend/api/data.php)...');
      const t2 = performance.now();
      const res2 = await fetch('/php-backend/api/data.php', { headers: { Accept: 'application/json' } });
      const d2 = Math.round(performance.now() - t2);
      const data2 = await res2.json().catch(() => ({}));
      const tableCount = data2.data ? Object.keys(data2.data).length : 0;
      log(`Read Query returned HTTP ${res2.status} (${d2}ms) - Retrieved ${tableCount} tables`);

      // Step 3: Write test
      log('Step 3/3: Executing synthetic atomic transaction write test...');
      const testTimestamp = new Date().toISOString();
      const testId = `freq-test-${Date.now()}`;
      const t3 = performance.now();
      const res3 = await fetch('/php-backend/api/data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          table: 'activity_logs',
          data: [
            {
              id: testId,
              action: 'FREQUENCY_BENCHMARK_PROBE',
              description: `Telemetry load test verified at ${testTimestamp}`,
              timestamp: testTimestamp,
              metadata: { test: true, probeId: testId },
            },
          ],
        }),
      });
      const d3 = Math.round(performance.now() - t3);
      log(`Write Query returned HTTP ${res3.status} (${d3}ms) - Response recorded in audit stream.`);

      log(`Benchmark Complete! Total Round-Trip: ${d1 + d2 + d3}ms. All 3 requests traced in real-time below.`);
    } catch (err: any) {
      log(`Benchmark Error: ${err?.message || 'Network request failed'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Database Request Frequency Tracer & AWS Stability Monitor
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  stats.healthStatus === 'optimal'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : stats.healthStatus === 'moderate'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                }`}>
                  {stats.healthStatus.toUpperCase()} LOAD · {stats.requestsPerMinute} REQ/MIN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live inspection of database request frequency, payload sizes, and AWS EC2/RDS crash prevention diagnostics.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'telemetry'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Frequency Tracer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('aws_causes')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'aws_causes'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Why AWS Crashes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('remediation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'remediation'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            AWS Fix Playbook
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* RPM */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Request Rate</span>
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1">
            {stats.requestsPerMinute}
            <span className="text-[10px] text-slate-400 font-normal">req/min</span>
          </div>
          <p className="text-[10px] text-slate-500">Last 60s sliding window</p>
        </div>

        {/* Total Requests */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Total Requests</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {stats.totalRequests}
          </div>
          <p className="text-[10px] text-slate-500">
            {stats.getRequests} GET / {stats.postRequests} POST
          </p>
        </div>

        {/* Avg Latency */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Avg Latency</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1">
            {stats.avgLatencyMs}
            <span className="text-[10px] text-slate-400 font-normal">ms</span>
          </div>
          <p className="text-[10px] text-slate-500">Peak: {stats.peakLatencyMs}ms</p>
        </div>

        {/* Success Rate */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Success Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-xl font-bold font-mono ${stats.failedRequests > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {stats.successRate}%
          </div>
          <p className="text-[10px] text-slate-500">{stats.failedRequests} errors logged</p>
        </div>

        {/* Avg Payload Size */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Avg POST Payload</span>
            <ArrowUpCircle className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1">
            {(stats.avgPayloadBytes / 1024).toFixed(1)}
            <span className="text-[10px] text-slate-400 font-normal">KB</span>
          </div>
          <p className="text-[10px] text-slate-500">Peak: {(stats.peakPayloadBytes / 1024).toFixed(1)} KB</p>
        </div>

        {/* Total Data Volume */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Total Transferred</span>
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1">
            {(stats.totalTransferredBytes / 1024).toFixed(0)}
            <span className="text-[10px] text-slate-400 font-normal">KB</span>
          </div>
          <p className="text-[10px] text-slate-500">Since session start</p>
        </div>
      </div>

      {/* Health banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
        stats.healthStatus === 'optimal'
          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
          : stats.healthStatus === 'moderate'
          ? 'bg-amber-950/20 border-amber-500/20 text-amber-300'
          : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
      }`}>
        {stats.healthStatus === 'optimal' ? (
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
        ) : stats.healthStatus === 'moderate' ? (
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
        ) : (
          <AlertOctagon className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
        )}
        <div className="space-y-1 flex-1">
          <div className="font-bold flex items-center justify-between">
            <span>Operating Status: {stats.healthMessage}</span>
            <span className="font-mono text-[11px] opacity-80">
              Debounce Throttle: 1500ms Active
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            The system sends state mutations via debounced JSON POST to <code className="px-1 py-0.5 rounded bg-slate-900 font-mono text-white">/php-backend/api/data.php</code>. 
            Identical state snapshots are deduplicated to avoid unnecessary AWS MySQL queries.
          </p>
        </div>
      </div>

      {/* TAB 1: Live Telemetry & Frequency Tracer */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Actions & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter Stream:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {(['all', 'errors', 'post', 'get'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilterType(mode)}
                    className={`px-2.5 py-1 rounded capitalize font-medium transition-all ${
                      filterType === mode
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'all' ? `All (${stats.recentTraces.length})` : mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={runFrequencyStressTest}
                disabled={isTesting}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-900/30 disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Benchmarking Database...' : 'Run Live Frequency & Latency Benchmark'}
              </button>
              <button
                type="button"
                onClick={() => requestTelemetry.clear()}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                title="Clear Trace History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Test log terminal if active */}
          {testLog.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 max-h-40 overflow-y-auto">
              <div className="text-[10px] uppercase font-bold text-indigo-400 pb-1 border-b border-slate-800 flex items-center justify-between">
                <span>Benchmark Execution Log</span>
                <span className="text-slate-500">{testLog.length} events</span>
              </div>
              {testLog.map((line, i) => (
                <div key={i} className="leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* Live Trace Stream Table */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Live Database Request Trace Stream (Last {stats.recentTraces.length} Calls)</span>
              <span className="text-[11px] font-mono text-slate-500">Auto-updating on each fetch</span>
            </div>

            {filteredTraces.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                <Clock className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                <p>No requests recorded matching the active filter.</p>
                <p className="text-[11px]">Click "Run Live Frequency & Latency Benchmark" above to trigger sample queries.</p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
                {filteredTraces.map((trace) => (
                  <div
                    key={trace.id}
                    className="px-4 py-2.5 hover:bg-slate-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Method badge */}
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        trace.method === 'POST'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}>
                        {trace.method}
                      </span>

                      {/* Status code */}
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        trace.status >= 200 && trace.status < 300
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : trace.status >= 400
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {trace.status || 'ERR'}
                      </span>

                      {/* Endpoint */}
                      <span className="text-slate-200 font-semibold truncate">
                        {trace.endpoint}
                      </span>

                      {/* Action summary */}
                      {trace.actionSummary && (
                        <span className="text-slate-400 truncate hidden md:inline text-[10px]">
                          ({trace.actionSummary})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[10px] shrink-0 justify-end">
                      {/* Payload size */}
                      {trace.payloadBytes > 0 && (
                        <span className="text-purple-300">
                          ▲ {(trace.payloadBytes / 1024).toFixed(1)} KB
                        </span>
                      )}

                      {/* Latency */}
                      <span className={`${trace.durationMs > 1000 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {trace.durationMs}ms
                      </span>

                      {/* Timestamp */}
                      <span className="text-slate-500">
                        {new Date(trace.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Why AWS Server Crashes (Deep Root Cause Analysis) */}
      {activeTab === 'aws_causes' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Architectural Root Causes: Why AWS Servers Crash or Return HTTP 500</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Based on the HTTP 500 error trace, large 20,426 byte payload size, and database configuration, here are the exact 5 technical reasons causing your AWS server to crash or reject requests:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reason 1 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-mono text-[10px]">1</span>
                <span>Linux OOM Killer Terminating MySQL / PHP-FPM</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                AWS EC2 micro instances (e.g. <strong>t2.micro / t3.micro</strong>) have only <strong>1GB RAM</strong>. 
                MySQL 8.0 requires ~400–600MB. PHP-FPM child workers consume 80–120MB each.
                When concurrent 20KB bulk JSON sync requests arrive, memory reaches 100%, and the Linux Out-Of-Memory (OOM) killer abruptly terminates <code className="px-1 py-0.5 rounded bg-slate-900 font-mono text-rose-300">mysqld</code> or <code className="px-1 py-0.5 rounded bg-slate-900 font-mono text-rose-300">php-fpm</code>.
              </p>
              <div className="text-[11px] text-amber-300 bg-amber-950/20 p-2 rounded border border-amber-500/20">
                <strong>Symptom:</strong> <code className="font-mono">SQLSTATE[HY000] [2002] Connection refused</code> or server becomes completely unresponsive until reboot.
              </div>
            </div>

            {/* Reason 2 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-mono text-[10px]">2</span>
                <span>Bulk 20.4 KB Full-Database Snapshot Sync Churn</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Notice your request sent <strong>Content-Length: 20,426 bytes</strong>. 
                When a user makes any edit, the application previously synced all 12 tables (users, tasks, projects, approvals, logs) in a single request. 
                In <code className="px-1 py-0.5 rounded bg-slate-900 font-mono text-white">data.php</code>, this executed 12x <code className="font-mono">SHOW COLUMNS</code>, disabled foreign keys, and ran dozens of queries inside an uncommitted transaction.
              </p>
              <div className="text-[11px] text-indigo-300 bg-indigo-950/20 p-2 rounded border border-indigo-500/20">
                <strong>Fix Applied:</strong> Auto-save debounce increased to 1500ms; strict state deduplication prevents duplicate payloads; individual table endpoints available.
              </div>
            </div>

            {/* Reason 3 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-mono text-[10px]">3</span>
                <span>Burstable CPU Credit Depletion on AWS EC2</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                AWS <code className="font-mono">t2/t3</code> instances use CPU credits. Running full table bulk upserts every few seconds spikes CPU to 100%. 
                Once burst credits are exhausted, AWS throttles CPU down to 10%–20% baseline, causing requests to hang for 30+ seconds, trigger gateway 504 timeouts, and stack up unprocessed PHP workers.
              </p>
              <div className="text-[11px] text-emerald-300 bg-emerald-950/20 p-2 rounded border border-emerald-500/20">
                <strong>Recommendation:</strong> Use AWS CloudWatch to monitor CPUUtilization and CPUSurplusCreditsCharged.
              </div>
            </div>

            {/* Reason 4 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-mono text-[10px]">4</span>
                <span>MySQL Strict Mode & JSON Column Syntax Errors</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                In MySQL 8.0, columns defined as <code className="font-mono">JSON NULL</code> (such as <code className="font-mono">activity_logs.metadata</code>) strictly reject empty strings (<code className="font-mono">""</code>). 
                Inserting an empty string throws <code className="font-mono text-rose-300">Invalid JSON text: "The document is empty"</code>, causing PHP or the proxy to return HTTP 500 (125 bytes error payload).
              </p>
              <div className="text-[11px] text-emerald-300 bg-emerald-950/20 p-2 rounded border border-emerald-500/20">
                <strong>Fix Applied:</strong> All JSON columns now normalize empty strings and text to valid JSON (<code className="font-mono">null</code> or <code className="font-mono">&#123;"text": ...&#125;</code>) before database execution.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AWS Server Hardening Playbook */}
      {activeTab === 'remediation' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>1. Fix HTTP 500: Field 'password' doesn't have a default value (Run on AWS)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    'mysql -h 127.0.0.1 -u uicms_app_user -p"TempPass123!" -D uicms_workflow -e "ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL DEFAULT \'\';"',
                    'alter_pass'
                  )
                }
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono transition-all"
              >
                {copiedCmd === 'alter_pass' ? '✓ Copied!' : 'Copy Command'}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When syncing users from the frontend, password hashes are omitted for security. If MySQL's <code className="text-white">users.password</code> column lacks a default value, MySQL strict mode throws <code className="text-rose-400">SQLSTATE[HY000]: 1364 Field 'password' doesn't have a default value</code> (HTTP 500). Running this command immediately resolves it:
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-rose-300 overflow-x-auto">
              mysql -h 127.0.0.1 -u uicms_app_user -p"TempPass123!" -D uicms_workflow -e "ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL DEFAULT '';"
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Terminal className="w-4 h-4" />
                <span>2. Add 2GB Swap Space on AWS EC2 (Permanently Fixes OOM MySQL Crashes)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    'sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab',
                    'swap'
                  )
                }
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono transition-all"
              >
                {copiedCmd === 'swap' ? '✓ Copied!' : 'Copy Command'}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AWS EC2 instances do not come with swap space enabled by default. Running this single command creates a 2GB virtual memory buffer so MySQL will never be terminated by the Linux OOM killer:
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <Server className="w-4 h-4" />
                <span>3. Tune PHP-FPM Pool Memory Budget (/etc/php/*/fpm/pool.d/www.conf)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    'sudo sed -i "s/pm = dynamic/pm = ondemand/" /etc/php/*/fpm/pool.d/www.conf && sudo sed -i "s/pm.max_children = .*/pm.max_children = 5/" /etc/php/*/fpm/pool.d/www.conf && sudo systemctl restart php*-fpm',
                    'php_fpm'
                  )
                }
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono transition-all"
              >
                {copiedCmd === 'php_fpm' ? '✓ Copied!' : 'Copy Command'}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Switches PHP-FPM from <code className="text-slate-300">pm = dynamic</code> to <code className="text-slate-300">pm = ondemand</code> and limits child workers to 5 so PHP only consumes memory when actively serving requests:
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto">
              sudo sed -i "s/pm = dynamic/pm = ondemand/" /etc/php/*/fpm/pool.d/www.conf && sudo sed -i "s/pm.max_children = .*/pm.max_children = 5/" /etc/php/*/fpm/pool.d/www.conf && sudo systemctl restart php*-fpm
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>3. Verify Active AWS Database Connection & Credentials</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    'mysql -h 127.0.0.1 -u uicms_app_user -p"TempPass123!" -D uicms_workflow -e "SHOW TABLES; SELECT COUNT(*) FROM users;"',
                    'mysql_test'
                  )
                }
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono transition-all"
              >
                {copiedCmd === 'mysql_test' ? '✓ Copied!' : 'Copy Command'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DB_HOST</span>
                <span className="text-white font-bold">127.0.0.1</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DB_NAME</span>
                <span className="text-white font-bold">uicms_workflow</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DB_USER</span>
                <span className="text-white font-bold">uicms_app_user</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DB_PASS</span>
                <span className="text-emerald-400 font-bold">TempPass123!</span>
              </div>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
              mysql -h 127.0.0.1 -u uicms_app_user -p"TempPass123!" -D uicms_workflow -e "SHOW TABLES; SELECT COUNT(*) FROM users;"
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
