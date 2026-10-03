import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, StageBadge, STAGE_CONFIG, STAGE_ORDER } from '../common/StatusBadge';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  Flame,
  Layers,
  MessageSquare,
  Milestone,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { DepartmentId, Project, WorkflowStage } from '../../types';

interface ExecutiveDashboardProps {
  onOpenProject: (id: string, initialTab?: string) => void;
  onNavigateTo?: (section: any) => void;
  onOpenNewRequest?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onOpenProject,
  onNavigateTo,
  onOpenNewRequest,
}) => {
  const {
    currentUser,
    projects,
    tasks,
    feedbackItems,
    approvals,
    clients,
    setActiveNavSection,
    setIsNewRequestOpen,
  } = useApp();

  const handleNavigate = (section: any) => {
    if (onNavigateTo) {
      onNavigateTo(section);
    } else {
      setActiveNavSection(section);
    }
  };

  const handleOpenNewRequest = () => {
    if (onOpenNewRequest) {
      onOpenNewRequest();
    } else {
      setIsNewRequestOpen(true);
    }
  };

  // Compute time-of-day greeting based on true local system time
  const getTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<DepartmentId | 'all'>('all');

  const filteredProjects = projects.filter((p) =>
    selectedDeptFilter === 'all' ? true : p.departmentId === selectedDeptFilter
  );

  // Calculations for KPIs
  const activeProjects = filteredProjects.filter((p) => p.stage !== 'ARCHIVE');
  const newRequests = filteredProjects.filter((p) => p.stage === 'REQUESTED');
  const awaitingBrief = filteredProjects.filter((p) => p.stage === 'BRIEF_VALIDATION');
  const inProduction = filteredProjects.filter((p) => p.stage === 'PRODUCTION');
  const inInternalQa = filteredProjects.filter((p) => p.stage === 'INTERNAL_QA');
  const awaitingClientReview = filteredProjects.filter((p) => p.stage === 'CLIENT_REVIEW');
  const awaitingClientApproval = filteredProjects.filter((p) => p.stage === 'CLIENT_APPROVAL');
  const overdueProjects = filteredProjects.filter((p) => p.status === 'overdue');
  const completedProjects = filteredProjects.filter((p) => p.stage === 'ARCHIVE' || p.status === 'completed');

  // Today & this week
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayProjects = filteredProjects.filter(
    (p) => p.stage !== 'ARCHIVE' && p.releaseDate === todayStr
  );
  const dueThisWeekProjects = filteredProjects.filter(
    (p) => p.stage !== 'ARCHIVE' && p.status === 'due_soon'
  );

  // User attention queues
  const myTasks = tasks.filter(
    (t) => t.ownerId === currentUser.id && t.status !== 'complete' && t.status !== 'cancelled'
  );
  const myResponsibleProjects = projects.filter(
    (p) => p.accountableUserId === currentUser.id || p.projectOwnerId === currentUser.id
  );
  const pendingApprovals = projects.filter(
    (p) => (p.stage === 'CLIENT_REVIEW' || p.stage === 'CLIENT_APPROVAL') && p.approvalStatus !== 'approved'
  );
  const activeFeedbacks = feedbackItems.filter((f) => f.status === 'open' || f.status === 'in_progress');

  const kpis = [
    {
      title: 'Active Projects',
      value: activeProjects.length,
      icon: Layers,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      trend: '+2 this week',
    },
    {
      title: 'New Requests',
      value: newRequests.length,
      icon: Sparkles,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      trend: 'Intake queue',
    },
    {
      title: 'Awaiting Brief',
      value: awaitingBrief.length,
      icon: FileText,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      trend: 'Validation needed',
    },
    {
      title: 'In Production',
      value: inProduction.length,
      icon: Flame,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      trend: 'Design in progress',
    },
    {
      title: 'In Internal QA',
      value: inInternalQa.length,
      icon: CheckCircle2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      trend: 'Pre-flight check',
    },
    {
      title: 'Client Review',
      value: awaitingClientReview.length,
      icon: Users,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      trend: 'External feedback',
    },
    {
      title: 'Client Approval',
      value: awaitingClientApproval.length,
      icon: FileCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      trend: 'Sign-off pending',
    },
    {
      title: 'Overdue / Alerts',
      value: overdueProjects.length,
      icon: AlertCircle,
      color: overdueProjects.length > 0 ? 'text-rose-400' : 'text-slate-400',
      bg: overdueProjects.length > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800/40 border-slate-700',
      trend: overdueProjects.length > 0 ? 'Action required' : '0 overdue',
    },
    {
      title: 'Due This Week',
      value: dueThisWeekProjects.length,
      icon: Clock,
      color: 'text-amber-300',
      bg: 'bg-amber-500/10 border-amber-500/20',
      trend: 'Upcoming releases',
    },
    {
      title: 'Completed',
      value: completedProjects.length,
      icon: CheckCircle2,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      trend: 'Archived & delivered',
    },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Greeting (Section 37 requirement) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {getTimeGreeting()}, {currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}
            </h1>
            <span className="text-xl">👋</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Here's what needs your attention across the design & development workflow lifecycle.
          </p>
        </div>

        {/* Right side controls: Weekly Summary link & Department Filter Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigate('weekly_summary')}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            title="Open Weekly Department Work Summary & Urgent Issues Brief"
          >
            <Milestone className="w-3.5 h-3.5" />
            <span>Weekly Work Summary</span>
            {overdueProjects.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-black animate-pulse">
                {overdueProjects.length}
              </span>
            )}
          </button>

          {/* Department Filter Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            {[
              { id: 'all', label: 'All Departments' },
              { id: 'marketing', label: 'Marketing' },
              { id: 'incentive_travel', label: 'Incentive Travel' },
              { id: 'online_ram', label: 'Online RAM' },
            ].map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => setSelectedDeptFilter(dept.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDeptFilter === dept.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {dept.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. KPI Cards Grid (Section 7 requirement) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lifecycle KPI Pipeline
          </h2>
          <span className="text-[11px] text-slate-400">
            Showing live metrics for {filteredProjects.length} projects
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border ${kpi.bg} transition-all hover:translate-y-[-2px] shadow-sm flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400 truncate">
                    {kpi.title}
                  </span>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {kpi.value}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {kpi.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Attention Grid (Section 37): "Here's what needs your attention" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Immediate Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: High Priority Action Items */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    My Pending Tasks & Next Actions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tasks assigned directly to you across active campaigns
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('my_tasks')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View all ({myTasks.length})
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {myTasks.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">
                  You have no pending tasks assigned. All caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myTasks.slice(0, 4).map((task) => {
                  const prj = projects.find((p) => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => prj && onOpenProject(prj.id, 'tasks')}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                            {task.name}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                              task.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          Project: {prj?.projectName || task.projectId} • Due {task.dueDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                          Open →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card: Stage Distribution Overview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Workflow Pipeline Stage Distribution
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live project volume across all 11 lifecycle stages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('all_projects')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Open Kanban Board
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Stage Bar visualization */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {STAGE_ORDER.slice(0, 8).map((stage) => {
                  const conf = STAGE_CONFIG[stage];
                  const count = filteredProjects.filter((p) => p.stage === stage).length;
                  return (
                    <div
                      key={stage}
                      onClick={() => handleNavigate('all_projects')}
                      className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="truncate">{conf.shortLabel}</span>
                        <span className="font-bold text-white text-xs">{count}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, count * 25)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Approvals & Feedback Queues */}
        <div className="space-y-6">
          {/* Approvals Required */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Approvals & Sign-off
                  </h3>
                  <span className="text-xs text-slate-400">
                    {pendingApprovals.length} pending client sign-off
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('approvals')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Workspace →
              </button>
            </div>

            <div className="space-y-2">
              {pendingApprovals.slice(0, 3).map((p) => {
                const client = clients.find((c) => c.id === p.clientId);
                return (
                  <div
                    key={p.id}
                    onClick={() => onOpenProject(p.id, 'approval')}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        {p.version} • {p.id}
                      </span>
                      <StageBadge stage={p.stage} size="sm" />
                    </div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {p.projectName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Client: {client?.name || p.clientId}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Feedback Items */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Active Feedback
                  </h3>
                  <span className="text-xs text-slate-400">
                    Actionable client & internal notes
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {activeFeedbacks.slice(0, 3).map((fb) => (
                <div
                  key={fb.id}
                  onClick={() => onOpenProject(fb.projectId, 'feedback')}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-orange-500/30 transition-all cursor-pointer group text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400">
                      From <span className="text-white font-medium">{fb.submittedByName}</span>
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20 font-semibold">
                      {fb.type === 'action_required' ? 'Action Req' : 'Info'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    "{fb.feedbackText}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Campaigns Stage Quick Tracker */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Active Project Workspaces ({activeProjects.length})
            </h3>
            <p className="text-xs text-slate-400">
              Direct access to live project workspaces, stage status, accountable owners, and next actions
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewRequest}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            + Create Request
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Project ID & Name</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Accountable</th>
                <th className="py-2.5 px-3">Next Action</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeProjects.slice(0, 7).map((p) => {
                const client = clients.find((c) => c.id === p.clientId);
                return (
                  <tr
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {p.projectName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {p.id} • {p.version}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {client?.name.split('(')[0] || p.clientId}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-slate-300 capitalize">
                        {p.departmentId.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StageBadge stage={p.stage} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {p.nextAction.ownerName}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={p.nextAction.task}>
                      {p.nextAction.task}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProject(p.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
