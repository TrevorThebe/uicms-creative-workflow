import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DepartmentId, Project, PriorityLevel } from '../../types';
import { StatusBadge, StageBadge } from '../common/StatusBadge';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  Info,
  Layers,
  MessageSquare,
  Milestone,
  Palette,
  Plane,
  Printer,
  RefreshCw,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

interface WeeklyDepartmentSummaryViewProps {
  onOpenProject?: (projectId: string, initialTab?: string) => void;
}

export const WeeklyDepartmentSummaryView: React.FC<WeeklyDepartmentSummaryViewProps> = ({
  onOpenProject,
}) => {
  const {
    projects,
    tasks,
    users,
    clients,
    versions,
    approvals,
    qaSubmissions,
    activityLogs,
    feedbackItems,
    currentUser,
    setActiveNavSection,
  } = useApp();

  const [selectedDept, setSelectedDept] = useState<DepartmentId | 'all'>('all');
  const [selectedWeek, setSelectedWeek] = useState<'current' | 'previous' | 'upcoming'>('current');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [issueFilter, setIssueFilter] = useState<'all' | 'blockers' | 'overdue' | 'qa_fail' | 'client_delay'>('all');
  const [dismissedIssueIds, setDismissedIssueIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reportingRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const daysSinceMonday = (start.getDay() + 6) % 7;
    const weekOffset = selectedWeek === 'previous' ? -7 : selectedWeek === 'upcoming' ? 7 : 0;
    start.setDate(start.getDate() - daysSinceMonday + weekOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const lastDay = new Date(end);
    lastDay.setDate(lastDay.getDate() - 1);
    return {
      start,
      end,
      label: `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
  }, [selectedWeek]);

  const isInReportingWeek = (value?: string) => {
    const timestamp = Date.parse(value || '');
    return Number.isFinite(timestamp) && timestamp >= reportingRange.start.getTime() && timestamp < reportingRange.end.getTime();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const departmentIds = Array.from(new Set([
    ...users.map((user) => user.departmentId),
    ...projects.map((project) => project.departmentId),
  ].filter(Boolean)));
  const departmentColors = [
    'from-sky-500/20 to-indigo-500/10 text-sky-400 border-sky-500/30',
    'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
    'from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30',
  ];
  const departmentIcons = [Palette, Plane, Flame, Zap, Layers];
  const departmentsList = departmentIds.map((id, index) => {
    const departmentUsers = users.filter((user) => user.departmentId === id);
    const departmentProjects = projects.filter((project) => project.departmentId === id);
    const name = id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
    return {
      id: id as DepartmentId,
      name,
      shortName: name,
      icon: departmentIcons[index % departmentIcons.length],
      color: departmentColors[index % departmentColors.length],
      head: departmentUsers.find((user) => user.role === 'department_manager')?.name || 'Unassigned',
      description: `${departmentUsers.length} users · ${departmentProjects.length} projects`,
    };
  });

  // Include projects created, updated, or due in the selected reporting week.
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (selectedDept !== 'all' && project.departmentId !== selectedDept) return false;
      return [
        project.createdAt,
        project.updatedAt,
        project.briefDueDate,
        project.productionDueDate,
        project.internalQaDueDate,
        project.clientReviewDueDate,
        project.clientApprovalDueDate,
        project.finalQaDueDate,
        project.releaseDate,
      ].some(isInReportingWeek);
    });
  }, [projects, selectedDept, reportingRange]);

  // Urgent Issues Computation
  const urgentIssues = useMemo(() => {
    const list: Array<{
      id: string;
      projectId: string;
      projectNumber: number;
      projectName: string;
      clientName: string;
      departmentId: DepartmentId;
      severity: 'critical' | 'high' | 'warning';
      category: 'blocker' | 'overdue' | 'qa_fail' | 'client_delay' | 'approvals';
      title: string;
      description: string;
      ownerName: string;
      dueDate?: string;
      impact: string;
      recommendedAction: string;
    }> = [];

    projects.forEach((p) => {
      const client = clients.find((c) => c.id === p.clientId)?.name || p.clientId;
      const owner = users.find((u) => u.id === p.projectOwnerId)?.name || 'Unassigned';

      // 1. Explicit Blockers
      if (p.blockers && p.blockers.trim() !== '') {
        list.push({
          id: `blk-${p.id}`,
          projectId: p.id,
          projectNumber: p.projectNumber,
          projectName: p.projectName,
          clientName: client,
          departmentId: p.departmentId,
          severity: 'critical',
          category: 'blocker',
          title: `Active Workflow Blocker`,
          description: p.blockers,
          ownerName: owner,
          dueDate: p.releaseDate,
          impact: 'Halts downstream production and threatens release target.',
          recommendedAction: 'Resolve dependency with supplier/client to unblock task.',
        });
      }

      // 2. Overdue or At-Risk Status
      if (p.status === 'overdue') {
        list.push({
          id: `ovd-${p.id}`,
          projectId: p.id,
          projectNumber: p.projectNumber,
          projectName: p.projectName,
          clientName: client,
          departmentId: p.departmentId,
          severity: 'critical',
          category: 'overdue',
          title: `Overdue Milestone Deadline`,
          description: `Target release date (${p.releaseDate || 'Not set'}) has elapsed while in stage ${p.stage}.`,
          ownerName: owner,
          dueDate: p.releaseDate,
          impact: 'SLA breach; client delivery deadline exceeded.',
          recommendedAction: 'Expedite pending task or re-align delivery baseline with client.',
        });
      }

      // 3. Revisions / Client Changes Requested
      if (p.stage === 'REVISION' || p.status === 'revision_required' || p.approvalStatus === 'rejected') {
        list.push({
          id: `rev-${p.id}`,
          projectId: p.id,
          projectNumber: p.projectNumber,
          projectName: p.projectName,
          clientName: client,
          departmentId: p.departmentId,
          severity: 'high',
          category: 'client_delay',
          title: `Client Revision Required`,
          description: `Client requested artwork modifications before formal sign-off.`,
          ownerName: owner,
          dueDate: p.nextAction?.dueDate || p.releaseDate,
          impact: 'Holding final QA sign-off until revised proof is uploaded.',
          recommendedAction: 'Incorporate client feedback and upload updated proof version.',
        });
      }

      // 4. Stalled in Internal QA or Failed QA
      const projectQA = qaSubmissions.filter((q) => q.projectId === p.id);
      const latestQA = projectQA[projectQA.length - 1];
      if (latestQA && latestQA.result === 'FAIL') {
        list.push({
          id: `qa-${p.id}`,
          projectId: p.id,
          projectNumber: p.projectNumber,
          projectName: p.projectName,
          clientName: client,
          departmentId: p.departmentId,
          severity: 'high',
          category: 'qa_fail',
          title: `QA Inspection Failed`,
          description: latestQA.overallNotes || 'Non-compliance detected in brand guidelines or pre-flight standards.',
          ownerName: latestQA.performedByName,
          dueDate: p.releaseDate,
          impact: 'Cannot advance to client review without compliance certification.',
          recommendedAction: 'Review QA defect items and re-submit corrected proof.',
        });
      }

      // 5. Client Review Pending > 2 Days
      if (p.stage === 'CLIENT_REVIEW' && p.approvalStatus === 'pending') {
        list.push({
          id: `appr-${p.id}`,
          projectId: p.id,
          projectNumber: p.projectNumber,
          projectName: p.projectName,
          clientName: client,
          departmentId: p.departmentId,
          severity: 'warning',
          category: 'client_delay',
          title: `Awaiting Client Review & Sign-Off`,
          description: `Proof V${p.version} has been submitted to client stakeholders for sign-off.`,
          ownerName: p.nextAction?.ownerName || owner,
          dueDate: p.clientReviewDueDate || p.releaseDate,
          impact: 'Production lead time depends on client review turnaround.',
          recommendedAction: 'Send reminder ping to client executive approver.',
        });
      }
    });

    return list.filter((item) => !dismissedIssueIds.includes(item.id));
  }, [projects, clients, users, qaSubmissions, dismissedIssueIds]);

  // Filter urgent issues by active department & issue type
  const activeIssues = useMemo(() => {
    return urgentIssues.filter((issue) => {
      if (selectedDept !== 'all' && issue.departmentId !== selectedDept) return false;
      if (issueFilter !== 'all') {
        if (issueFilter === 'blockers' && issue.category !== 'blocker') return false;
        if (issueFilter === 'overdue' && issue.category !== 'overdue') return false;
        if (issueFilter === 'qa_fail' && issue.category !== 'qa_fail') return false;
        if (issueFilter === 'client_delay' && issue.category !== 'client_delay') return false;
      }
      return true;
    });
  }, [urgentIssues, selectedDept, issueFilter]);

  // Key Achievements & Highlights This Week
  const weeklyAchievements = useMemo(() => {
    const list: Array<{
      id: string;
      projectId: string;
      projectName: string;
      departmentId: DepartmentId;
      clientName: string;
      type: 'release' | 'approval' | 'qa_pass' | 'brief_locked';
      title: string;
      description: string;
      date: string;
      metric: string;
      leadName: string;
    }> = [];

    // 1. Projects Completed or in Final Release
    projects
      .filter((p) =>
        (p.stage === 'RELEASE_PUBLISH' || p.stage === 'ARCHIVE' || p.status === 'completed') &&
        isInReportingWeek(p.releaseDate || p.updatedAt)
      )
      .forEach((p) => {
        const client = clients.find((c) => c.id === p.clientId)?.name || p.clientId;
        const owner = users.find((u) => u.id === p.projectOwnerId)?.name || 'Unassigned';
        list.push({
          id: `ach-rel-${p.id}`,
          projectId: p.id,
          projectName: p.projectName,
          departmentId: p.departmentId,
          clientName: client,
          type: 'release',
          title: `Final Artwork Pack Delivered & Published`,
          description: `Successfully published deliverable ${p.version} to production repository.`,
          date: p.releaseDate || p.updatedAt,
          metric: 'Completed',
          leadName: owner,
        });
      });

    // 2. Client Approvals Secured
    approvals.forEach((appr) => {
      const p = projects.find((proj) => proj.id === appr.projectId);
      if (p && (appr.decision === 'APPROVED' || appr.decision === 'APPROVED_WITH_NOTES') && isInReportingWeek(appr.approvedAt)) {
        const client = clients.find((c) => c.id === p.clientId)?.name || p.clientId;
        list.push({
          id: `ach-appr-${appr.id}`,
          projectId: p.id,
          projectName: p.projectName,
          departmentId: p.departmentId,
          clientName: client,
          type: 'approval',
          title: `Executive Client Sign-Off Secured`,
          description: `${appr.clientName} (${appr.clientPosition}) formally signed off on ${appr.versionNumber}.`,
          date: new Date(appr.approvedAt).toLocaleDateString(),
          metric: appr.decision,
          leadName: appr.clientName,
        });
      }
    });

    // 3. QA Passed
    qaSubmissions
      .filter((q) => q.result === 'PASS' && isInReportingWeek(q.performedAt))
      .forEach((q) => {
        const p = projects.find((proj) => proj.id === q.projectId);
        if (p) {
          const client = clients.find((c) => c.id === p.clientId)?.name || p.clientId;
          list.push({
            id: `ach-qa-${q.id}`,
            projectId: p.id,
            projectName: p.projectName,
            departmentId: p.departmentId,
            clientName: client,
            type: 'qa_pass',
            title: `Zero-Defect QA Pre-flight Certification`,
            description: `Passed ${q.passedCount ?? 0} recorded checks.`,
            date: new Date(q.performedAt).toLocaleDateString(),
            metric: q.result,
            leadName: q.performedByName,
          });
        }
      });

    // 4. Briefs Validated & Locked
    projects
      .filter((p) => p.isBriefLocked && p.stage !== 'REQUESTED' && isInReportingWeek(p.briefLockedAt || p.updatedAt))
      .slice(0, 4)
      .forEach((p) => {
        const client = clients.find((c) => c.id === p.clientId)?.name || p.clientId;
        const accountable = users.find((u) => u.id === p.accountableUserId)?.name || 'Unassigned';
        list.push({
          id: `ach-brf-${p.id}`,
          projectId: p.id,
          projectName: p.projectName,
          departmentId: p.departmentId,
          clientName: client,
          type: 'brief_locked',
          title: `Mandatory Brief Locked & Scoped`,
          description: `All technical specifications, dimensions, and CI rules validated and locked into production.`,
          date: p.briefLockedAt || p.updatedAt,
          metric: `${p.briefCompleteness}% Complete`,
          leadName: accountable,
        });
      });

    return list.filter((ach) => (selectedDept === 'all' ? true : ach.departmentId === selectedDept));
  }, [projects, clients, users, approvals, qaSubmissions, selectedDept, reportingRange]);

  // Department Summaries Breakdown
  const deptStats = useMemo(() => {
    return departmentsList.map((dept) => {
      const deptProjects = filteredProjects.filter((p) => p.departmentId === dept.id);
      const active = deptProjects.filter((p) => p.stage !== 'ARCHIVE' && p.status !== 'completed');
      const completed = deptProjects.filter((p) => p.stage === 'ARCHIVE' || p.status === 'completed' || p.stage === 'RELEASE_PUBLISH');
      const inProd = deptProjects.filter((p) => p.stage === 'PRODUCTION' || p.stage === 'INTERNAL_QA');
      const inReview = deptProjects.filter((p) => p.stage === 'CLIENT_REVIEW' || p.stage === 'CLIENT_APPROVAL');
      const issues = urgentIssues.filter((i) => i.departmentId === dept.id);
      const onTrack = deptProjects.filter((p) => p.status === 'on_track' && p.stage !== 'ARCHIVE');
      const healthPercentage = active.length > 0 ? Math.round((onTrack.length / active.length) * 100) : 0;

      return {
        ...dept,
        totalProjects: deptProjects.length,
        activeProjects: active.length,
        completedProjects: completed.length,
        inProduction: inProd.length,
        inReview: inReview.length,
        urgentIssuesCount: issues.length,
        healthPercentage,
        active,
      };
    });
  }, [filteredProjects, urgentIssues]);

  // Overall KPI Calculations
  const totalActive = filteredProjects.filter((p) => p.stage !== 'ARCHIVE' && p.status !== 'completed').length;
  const totalCompletedThisCycle = filteredProjects.filter(
    (p) => p.stage === 'ARCHIVE' || p.status === 'completed' || p.stage === 'RELEASE_PUBLISH'
  ).length;
  const totalOnTrack = filteredProjects.filter((p) => p.status === 'on_track' && p.stage !== 'ARCHIVE').length;
  const overallVelocityScore = totalActive > 0 ? Math.round((totalOnTrack / totalActive) * 100) : 0;

  // Generate and Copy Executive Brief text
  const handleCopyMarkdownSummary = () => {
    const activeDeptObj = departmentsList.find((d) => d.id === selectedDept);
    const deptTitle = activeDeptObj ? activeDeptObj.name : 'All Creative & Engineering Departments';

    let md = `# 📊 UICMS Executive Weekly Work Summary: ${deptTitle}\n`;
    md += `**Reporting Period:** ${reportingRange.label} | **Generated By:** ${currentUser.name}\n\n`;

    md += `## 🚀 Velocity & Output Summary\n`;
    md += `- **Active Projects in Flight:** ${totalActive}\n`;
    md += `- **Completed & Released:** ${totalCompletedThisCycle}\n`;
    md += `- **Workflow On-Track Health:** ${overallVelocityScore}%\n`;
    md += `- **Urgent Action Items:** ${activeIssues.length}\n\n`;

    md += `## 🚨 Urgent Issues Requiring Immediate Attention (${activeIssues.length})\n`;
    if (activeIssues.length === 0) {
      md += `*No critical blockers or overdue items reported.*\n\n`;
    } else {
      activeIssues.forEach((issue, idx) => {
        md += `${idx + 1}. **[${issue.severity.toUpperCase()}] ${issue.projectName}** (${issue.clientName})\n`;
        md += `   - **Issue:** ${issue.title} - ${issue.description}\n`;
        md += `   - **Impact:** ${issue.impact}\n`;
        md += `   - **Assigned Owner:** ${issue.ownerName} | **Due:** ${issue.dueDate || 'ASAP'}\n`;
        md += `   - **Required Action:** ${issue.recommendedAction}\n\n`;
      });
    }

    md += `## 🏆 Key Achievements & Major Milestones (${weeklyAchievements.length})\n`;
    weeklyAchievements.slice(0, 6).forEach((ach, idx) => {
      md += `${idx + 1}. **${ach.projectName}** (${ach.clientName}) - *${ach.title}*\n`;
      md += `   - ${ach.description} (Lead: ${ach.leadName} | ${ach.metric})\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedSummary(true);
    showToast('Executive Markdown summary copied to clipboard! Ready to paste into Slack or Email.');
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-indigo-500/40 text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Milestone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  Weekly Department Work Summary
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  {reportingRange.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Executive progress overview, departmental throughput, key achievements, and urgent blocker alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Week Horizon, Export, Markdown Copy */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedWeek('previous')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedWeek === 'previous'
                  ? 'bg-slate-800 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Previous Week
            </button>
            <button
              type="button"
              onClick={() => setSelectedWeek('current')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedWeek === 'current'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Current Week
            </button>
            <button
              type="button"
              onClick={() => setSelectedWeek('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedWeek === 'upcoming'
                  ? 'bg-slate-800 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Next Week Outlook
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyMarkdownSummary}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Copy formatted markdown report for Slack or Executive Emails"
          >
            {copiedSummary ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'Copied!' : 'Copy Brief (MD)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition-colors shadow-xs"
            title="Print or Export PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Department Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedDept('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
            selectedDept === 'all'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Departments Matrix</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 text-indigo-300">
            {projects.length}
          </span>
        </button>

        {departmentsList.map((dept) => {
          const Icon = dept.icon;
          const isSelected = selectedDept === dept.id;
          const deptCount = projects.filter((p) => p.departmentId === dept.id).length;
          const deptUrgent = urgentIssues.filter((i) => i.departmentId === dept.id).length;

          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{dept.shortName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 text-slate-300 font-mono">
                {deptCount}
              </span>
              {deptUrgent > 0 && (
                <span className="flex items-center justify-center w-4 h-4 text-[9px] rounded-full bg-rose-500 text-white font-black animate-pulse">
                  {deptUrgent}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Executive Summary KPI Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Active In-Flight */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Workflow In-Flight
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">{totalActive}</span>
            <span className="text-xs text-slate-400">deliverables</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{totalOnTrack} on track</span>
            <span>·</span>
            <span className="text-slate-400">{filteredProjects.length - totalActive} completed</span>
          </div>
        </div>

        {/* Card 2: Critical Blockers & Alerts */}
        <div
          className={`p-5 rounded-2xl border shadow-md relative overflow-hidden transition-all ${
            activeIssues.length > 0
              ? 'bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 border-rose-500/40 ring-1 ring-rose-500/20'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
              Urgent Attention Required
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400 tracking-tight">{activeIssues.length}</span>
            <span className="text-xs text-rose-300">issues requiring action</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-rose-400 font-semibold">
              {activeIssues.filter((i) => i.severity === 'critical').length} Critical Blockers
            </span>
            <span>·</span>
            <span>{activeIssues.filter((i) => i.severity === 'high').length} High Priority</span>
          </div>
        </div>

        {/* Card 3: Major Achievements & Released */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Milestones & Achievements
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">{weeklyAchievements.length}</span>
            <span className="text-xs text-emerald-300">completed wins</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{totalCompletedThisCycle} Final Releases</span>
            <span>·</span>
            <span>{approvals.length} Signed Approvals</span>
          </div>
        </div>

        {/* Card 4: Workflow Health & Velocity */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Department Delivery Health
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-300 tracking-tight">{overallVelocityScore}%</span>
            <span className="text-xs text-slate-400">on-track rate</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Target SLA: 95% on-time turnaround</span>
          </div>
        </div>
      </div>

      {/* 4. 🚨 URGENT ATTENTION QUEUE (Highlighted Red Alert Section) */}
      <div className="p-6 rounded-2xl bg-slate-900/95 border border-rose-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Urgent Issues Requiring Immediate Attendance
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold font-mono">
                  {activeIssues.length} Items
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Critical blockers, overdue deadlines, QA rejections, and pending client reviews blocking project release.
              </p>
            </div>
          </div>

          {/* Filter tabs for urgent issues */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            {[
              { id: 'all', label: 'All Urgent' },
              { id: 'blockers', label: 'Blockers' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'qa_fail', label: 'QA Issues' },
              { id: 'client_delay', label: 'Client Reviews' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setIssueFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  issueFilter === f.id
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {activeIssues.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Zero Urgent Blockers Reported</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All active projects for the selected department view are progressing smoothly without critical blockers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeIssues.map((issue) => {
              const deptObj = departmentsList.find((d) => d.id === issue.departmentId);
              const isCritical = issue.severity === 'critical';

              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isCritical
                      ? 'bg-gradient-to-br from-rose-950/30 to-slate-950 border-rose-500/40 hover:border-rose-400'
                      : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wider ${
                            isCritical ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-300 font-mono">
                          {issue.projectId}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{deptObj?.shortName}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{issue.projectName}</h4>
                      <p className="text-xs text-indigo-300 font-medium mt-0.5">Client: {issue.clientName}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1">
                      <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{issue.title}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{issue.description}</p>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div>
                        <strong className="text-slate-300">Impact:</strong> {issue.impact}
                      </div>
                      <div>
                        <strong className="text-slate-300">Action:</strong> {issue.recommendedAction}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div className="text-[11px] text-slate-400">
                      Owner: <span className="text-white font-medium">{issue.ownerName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          showToast(`Nudge notification sent to ${issue.ownerName} regarding ${issue.projectId}.`);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        Ping Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenProject) {
                            onOpenProject(issue.projectId);
                          }
                        }}
                        className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <span>Open Project</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. 🏆 KEY ACHIEVEMENTS & COMPLETED HIGHLIGHTS */}
      <div className="p-6 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Major Department Wins & Achievements This Cycle
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                  {weeklyAchievements.length} Wins
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed deliverables, approved proofs, zero-defect QA certifications, and locked briefs.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weeklyAchievements.map((ach) => {
            const deptObj = departmentsList.find((d) => d.id === ach.departmentId);

            return (
              <div
                key={ach.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase font-mono">
                      {ach.type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 font-medium text-[11px]">{deptObj?.shortName}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug">{ach.projectName}</h4>
                    <p className="text-[11px] text-indigo-300 font-medium">{ach.clientName}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{ach.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{ach.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 font-mono">{ach.metric}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenProject) {
                        onOpenProject(ach.projectId);
                      }
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>View Project</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. DEPARTMENT-BY-DEPARTMENT COMPARATIVE MATRIX */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Departmental Capacity & Progress Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-400">4 Operational Units</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {deptStats.map((dept) => {
            const Icon = dept.icon;
            const isSelected = selectedDept === dept.id;

            return (
              <div
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-4 ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">{dept.shortName}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      dept.urgentIssuesCount > 0
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {dept.healthPercentage}% Health
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">{dept.description}</p>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Active Projects:</span>
                    <span className="font-bold text-white">{dept.activeProjects}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>In Production / QA:</span>
                    <span className="font-bold text-indigo-300">{dept.inProduction}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Client Review / Approvals:</span>
                    <span className="font-bold text-cyan-300">{dept.inReview}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Urgent Blockers:</span>
                    <span
                      className={`font-bold ${
                        dept.urgentIssuesCount > 0 ? 'text-rose-400 font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      {dept.urgentIssuesCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Lead: {dept.head}</span>
                  <span className="text-indigo-400 font-semibold group-hover:underline">Filter View →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
