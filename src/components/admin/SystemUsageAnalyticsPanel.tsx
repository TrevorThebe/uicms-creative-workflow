import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  FolderKanban,
  Layers,
  Lock,
  PieChart as PieIcon,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#14b8a6'];

const getMonthBuckets = (range: '6m' | '12m' | 'ytd') => {
  const now = new Date();
  const monthCount = range === 'ytd' ? now.getMonth() + 1 : range === '6m' ? 6 : 12;
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - monthCount + 1 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { key, name: date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) };
  });
};

const formatGroupName = (key: string) =>
  key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

export const SystemUsageAnalyticsPanel: React.FC = () => {
  const { projects, users, activityLogs, tasks, versions, qaSubmissions, approvals } = useApp();

  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'ytd'>('6m');
  const [requestChartType, setRequestChartType] = useState<'stacked' | 'area'>('area');
  const [userDistributionType, setUserDistributionType] = useState<'department' | 'role'>('department');
  const departmentKeys = useMemo(
    () => Array.from(new Set(projects.map((project) => project.departmentId || 'unassigned'))),
    [projects]
  );

  // Build month and department buckets from the selected period and persisted projects.
  const monthlyRequestsData = useMemo(() => {
    const months = getMonthBuckets(timeRange);
    const monthMap = new Map<string, Record<string, string | number>>();
    months.forEach(({ key, name }) => {
      const bucket: Record<string, string | number> = { month: name, total: 0 };
      departmentKeys.forEach((departmentId) => { bucket[departmentId] = 0; });
      monthMap.set(key, bucket);
    });

    projects.forEach((project) => {
      const timestamp = Date.parse(project.createdAt || '');
      if (!Number.isFinite(timestamp)) return;
      const date = new Date(timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthMap.get(key);
      if (!bucket) return;
      const departmentId = project.departmentId || 'unassigned';
      bucket[departmentId] = Number(bucket[departmentId] || 0) + 1;
      bucket.total = Number(bucket.total) + 1;
    });

    return Array.from(monthMap.values());
  }, [departmentKeys, projects, timeRange]);

  // Compute active vs suspended user counts
  const userMetrics = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.active && !u.isSuspended).length;
    const suspendedUsers = users.filter((u) => u.isSuspended || !u.active).length;

    const departmentDistribution = new Map<string, { active: number; suspended: number; total: number }>();
    const roleDistribution = new Map<string, { active: number; count: number }>();

    users.forEach((u) => {
      const departmentId = u.departmentId || 'unassigned';
      const department = departmentDistribution.get(departmentId) || { active: 0, suspended: 0, total: 0 };
      department.total += 1;
      if (u.active && !u.isSuspended) department.active += 1;
      else department.suspended += 1;
      departmentDistribution.set(departmentId, department);

      const roleId = u.role || 'unassigned';
      const role = roleDistribution.get(roleId) || { active: 0, count: 0 };
      role.count += 1;
      if (u.active && !u.isSuspended) role.active += 1;
      roleDistribution.set(roleId, role);
    });

    const departmentChartData = Array.from(departmentDistribution, ([key, value], index) => ({
      key, name: formatGroupName(key), ...value, color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const roleChartData = Array.from(roleDistribution, ([key, value], index) => ({
      key, name: formatGroupName(key), value: value.count, active: value.active,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      activeRatio: Math.round((activeUsers / Math.max(totalUsers, 1)) * 100),
      departmentChartData,
      roleChartData,
    };
  }, [users]);

  // Aggregate event data from database records for the selected period.
  const activityEventData = useMemo(() => {
    const actionCounts: Record<string, number> = {};
    activityLogs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({
        action: action.replace('_', ' '),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const monthlyMap = new Map<string, { month: string; briefLocks: number; qaAudits: number; approvals: number; uploads: number }>();
    getMonthBuckets(timeRange).forEach(({ key, name }) => {
      monthlyMap.set(key, { month: name, briefLocks: 0, qaAudits: 0, approvals: 0, uploads: 0 });
    });

    const incrementEvent = (value: string | undefined, field: 'briefLocks' | 'qaAudits' | 'approvals' | 'uploads') => {
      const timestamp = Date.parse(value || '');
      if (!Number.isFinite(timestamp)) return;
      const date = new Date(timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthlyMap.get(key);
      if (bucket) bucket[field] += 1;
    };

    activityLogs.forEach((log) => {
      if (log.action === 'BRIEF_LOCKED') incrementEvent(log.timestamp, 'briefLocks');
    });
    versions.forEach((version) => incrementEvent(version.uploadedAt, 'uploads'));
    qaSubmissions.forEach((submission) => incrementEvent(submission.performedAt, 'qaAudits'));
    approvals.forEach((approval) => incrementEvent(approval.approvedAt, 'approvals'));

    const monthlyEvents = Array.from(monthlyMap.values());

    return { topActions, monthlyEvents };
  }, [activityLogs, approvals, qaSubmissions, timeRange, versions]);

  // Total calculated requests
  const totalRequestsCount = useMemo(() => {
    return monthlyRequestsData.reduce((acc, curr) => acc + Number(curr.total), 0);
  }, [monthlyRequestsData]);

  // Calculate highest month
  const peakMonth = useMemo(() => {
    if (monthlyRequestsData.length === 0) return { month: 'No period', total: 0 };
    return [...monthlyRequestsData].sort((a, b) => Number(b.total) - Number(a.total))[0];
  }, [monthlyRequestsData]);

  // Recharts Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl text-xs space-y-1.5 z-50 min-w-[160px]">
          <p className="font-bold text-white pb-1 border-b border-slate-800 font-mono text-[11px]">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-slate-300 capitalize">
                  {entry.name.replace('_', ' ')}
                </span>
              </div>
              <span className="font-mono font-bold text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in duration-150">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base lg:text-lg font-bold text-white tracking-tight">
                  Superuser System Usage Telemetry & Recharts Analytics
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Superuser Exclusive</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live metrics monitoring monthly project request volume, active user accounts, and system event velocity.
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Controls */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeRange('6m')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === '6m'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 6 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('12m')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === '12m'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Year
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('ytd')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'ytd'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Year to date
            </button>
          </div>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* KPI 1: Total Requests */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Total Monthly Requests</span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {totalRequestsCount}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 font-mono">
              <span>{timeRange === 'ytd' ? 'Year to date' : timeRange === '6m' ? 'Last 6 months' : 'Last 12 months'}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Sum of creative briefs in selected time horizon.
          </p>
        </div>

        {/* KPI 2: Active User Accounts */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Active User Accounts</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {userMetrics.activeUsers} <span className="text-sm font-normal text-slate-400">/ {userMetrics.totalUsers}</span>
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {userMetrics.activeRatio}% Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {userMetrics.suspendedUsers} user account(s) currently suspended.
          </p>
        </div>

        {/* KPI 3: Peak Volume Month */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Peak Monthly Demand</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {peakMonth.total} <span className="text-xs font-normal text-slate-400">reqs</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {peakMonth.month}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Highest demand month in the selected period.
          </p>
        </div>

        {/* KPI 4: Audit Event Throughput */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Audit Event Velocity</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {activityLogs.length}
            </span>
            <span className="text-xs font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
              Loaded records
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Activity records currently loaded from the database.
          </p>
        </div>
      </div>

      {/* Main Chart 1: Monthly Requests Visualization */}
      <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Total Project Requests per Month by Department</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Monthly breakdown showing creative workload volume submitted across departments.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setRequestChartType('area')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                requestChartType === 'area'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gradient Area
            </button>
            <button
              type="button"
              onClick={() => setRequestChartType('stacked')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                requestChartType === 'stacked'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Stacked Bars
            </button>
          </div>
        </div>

        {/* Recharts Area / Bar Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {requestChartType === 'area' ? (
              <AreaChart data={monthlyRequestsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Reqs"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradTotal)"
                />
                  {departmentKeys.map((departmentId, index) => (
                    <Area
                      key={departmentId}
                      type="monotone"
                      dataKey={departmentId}
                      name={formatGroupName(departmentId)}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={1.5}
                      fillOpacity={0.12}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
              </AreaChart>
            ) : (
              <BarChart data={monthlyRequestsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }}
                  iconType="square"
                />
                {departmentKeys.map((departmentId, index) => (
                  <Bar
                    key={departmentId}
                    dataKey={departmentId}
                    name={formatGroupName(departmentId)}
                    stackId="a"
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Row 2: User Counts & Audit Event Velocity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* User Distribution & Active Accounts */}
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Active User Accounts & Role Distribution</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Breakdown of active users, role permissions, and department allocations.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setUserDistributionType('department')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  userDistributionType === 'department'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Department
              </button>
              <button
                type="button"
                onClick={() => setUserDistributionType('role')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  userDistributionType === 'role'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Role Matrix
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Donut Pie Chart */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      userDistributionType === 'department'
                        ? userMetrics.departmentChartData
                        : userMetrics.roleChartData
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey={userDistributionType === 'department' ? 'active' : 'value'}
                  >
                    {(userDistributionType === 'department'
                      ? userMetrics.departmentChartData
                      : userMetrics.roleChartData
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* User Breakdown Stats List */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pb-1 border-b border-slate-800">
                {userDistributionType === 'department' ? 'Department Active Count' : 'System Role Breakdown'}
              </span>
              {(userDistributionType === 'department'
                ? userMetrics.departmentChartData
                : userMetrics.roleChartData
              ).map((item: any) => (
                <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {item.active !== undefined ? item.active : item.value} active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Event Velocity & Operations Stream */}
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4">
          <div className="pb-3 border-b border-slate-800/80">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>System Activity Event Volume Trend</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Monthly stream of brief locks, QA certifications, deliverable uploads, and approvals.
            </p>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityEventData.monthlyEvents} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }} iconType="circle" />
                <Line type="monotone" dataKey="uploads" name="Deliverable Uploads" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="qaAudits" name="QA Certifications" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="briefLocks" name="Brief Locks" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="approvals" name="Client Approvals" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
