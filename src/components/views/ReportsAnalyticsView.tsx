import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  FileCheck,
  Flame,
  Layers,
  PieChart,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react';

export const ReportsAnalyticsView: React.FC = () => {
  const { projects, qaSubmissions, approvals, tasks } = useApp();

  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.stage === 'ARCHIVE' || p.status === 'completed').length;
  const overdueProjects = projects.filter((p) => p.status === 'overdue').length;
  const onTimeRate = totalProjects > 0 ? Math.round(((totalProjects - overdueProjects) / totalProjects) * 1000) / 10 : null;

  const totalQAs = qaSubmissions.length;
  const passedQAs = qaSubmissions.filter((q) => q.result === 'PASS' || q.result === 'PASS_WITH_NOTES').length;
  const qaPassRate = totalQAs > 0 ? Math.round((passedQAs / totalQAs) * 100) : null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'complete').length;

  const completedDurations = projects
    .filter((project) => project.stage === 'ARCHIVE' || project.stage === 'RELEASE_PUBLISH' || project.status === 'completed')
    .map((project) => ({
      created: Date.parse(project.createdAt || ''),
      released: Date.parse(project.releaseDate || ''),
    }))
    .filter(({ created, released }) => Number.isFinite(created) && Number.isFinite(released))
    .map(({ created, released }) => Math.max(1, Math.round((released - created) / (1000 * 60 * 60 * 24))));
  const avgDays = completedDurations.length
    ? Math.round((completedDurations.reduce((sum, days) => sum + days, 0) / completedDurations.length) * 10) / 10
    : null;

  const departmentStats = Array.from(new Set(projects.map((project) => project.departmentId || 'unassigned')))
    .map((departmentId, index) => ({
      departmentId,
      count: projects.filter((project) => (project.departmentId || 'unassigned') === departmentId).length,
      color: ['bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][index % 5],
    }));
  const qaResults = Array.from(new Set(qaSubmissions.map((submission) => submission.result)));

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Workflow Intelligence & Operational Reports
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              Executive SLA Metrics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Section 34, 35, 36: Turnaround velocities, QA inspection pass rates, department project distribution, and bottlenecks.
          </p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>On-Time Delivery SLA</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{onTimeRate === null ? '—' : `${onTimeRate}%`}</div>
          <p className="text-[11px] text-slate-400 font-medium">{overdueProjects} overdue of {totalProjects} projects</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pre-Flight QA Pass Rate</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{qaPassRate === null ? '—' : `${qaPassRate}%`}</div>
          <p className="text-[11px] text-slate-400 font-medium">
            {passedQAs} passed of {totalQAs} total inspections
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Turnaround Cycle</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{avgDays === null ? '—' : `${avgDays} Days`}</div>
          <p className="text-[11px] text-slate-400 font-medium">Intake to Final Release Delivery</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Milestone Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{totalTasks}</div>
          <p className="text-[11px] text-slate-400 font-medium">
            {completedTasks} completed ({totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
          </p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Volume by Department
          </h3>
          <div className="space-y-3 pt-1">
            {departmentStats.length === 0 ? (
              <p className="text-xs text-slate-400">No project records are available.</p>
            ) : departmentStats.map((department) => {
              const pct = totalProjects ? Math.round((department.count / totalProjects) * 100) : 0;
              return (
                <div key={department.departmentId} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{department.departmentId.replace(/[_-]+/g, ' ')}</span>
                    <span className="font-mono text-slate-400">
                      {department.count} projects ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${department.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quality Assurance Audit Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Pre-flight QA Verification Audits
          </h3>
          <div className="space-y-2 pt-1">
            {qaResults.length === 0 ? (
              <p className="text-xs text-slate-400">No QA submissions are available.</p>
            ) : qaResults.map((result) => {
              const count = qaSubmissions.filter((submission) => submission.result === result).length;
              return (
                <div key={result} className="flex items-center justify-between rounded-lg bg-slate-950 p-3 text-xs">
                  <span className="text-slate-300">{result.replace(/[_-]+/g, ' ')}</span>
                  <span className="font-mono font-semibold text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
