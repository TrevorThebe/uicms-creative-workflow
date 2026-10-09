import React from 'react';
import { ProjectStatus, WorkflowStage } from '../../types';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = {
    on_track: {
      label: 'On Track',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
      icon: CheckCircle2,
    },
    due_soon: {
      label: 'Due Soon',
      bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      dot: 'bg-amber-400',
      icon: Clock,
    },
    overdue: {
      label: 'Overdue',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dot: 'bg-rose-500',
      icon: AlertCircle,
    },
    waiting: {
      label: 'Waiting',
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      dot: 'bg-sky-400',
      icon: HelpCircle,
    },
    revision_required: {
      label: 'Revision Required',
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      dot: 'bg-orange-400',
      icon: RotateCcw,
    },
    blocked: {
      label: 'Blocked',
      bg: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
      dot: 'bg-slate-400',
      icon: XCircle,
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
      icon: CheckCircle2,
    },
  }[status] || {
    label: status,
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-400',
    icon: HelpCircle,
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses} tracking-tight whitespace-nowrap`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};

export const STAGE_CONFIG: Record<
  WorkflowStage,
  { label: string; shortLabel: string; step: number; color: string; desc: string }
> = {
  REQUESTED: {
    label: 'Requested',
    shortLabel: 'Request',
    step: 1,
    color: 'slate',
    desc: 'Initial request submitted by requestor',
  },
  BRIEF_VALIDATION: {
    label: 'Brief Validation',
    shortLabel: 'Brief Check',
    step: 2,
    color: 'amber',
    desc: 'Brief fields completeness & asset check',
  },
  BRIEF_LOCKED: {
    label: 'Brief Locked',
    shortLabel: 'Locked',
    step: 3,
    color: 'indigo',
    desc: 'Brief 100% complete and frozen for production',
  },
  PRODUCTION: {
    label: 'Production',
    shortLabel: 'Produce',
    step: 4,
    color: 'blue',
    desc: 'Designers actively crafting deliverables',
  },
  INTERNAL_QA: {
    label: 'Internal QA',
    shortLabel: 'Internal QA',
    step: 5,
    color: 'purple',
    desc: 'QA checklist verification before client review',
  },
  CLIENT_REVIEW: {
    label: 'Client Review',
    shortLabel: 'Review',
    step: 6,
    color: 'cyan',
    desc: 'Stakeholder / client inspecting deliverable',
  },
  REVISION: {
    label: 'Revision',
    shortLabel: 'Revision',
    step: 7,
    color: 'orange',
    desc: 'Addressing feedback or QA corrections',
  },
  CLIENT_APPROVAL: {
    label: 'Client Approval',
    shortLabel: 'Approval',
    step: 8,
    color: 'emerald',
    desc: 'Formal client digital sign-off',
  },
  FINAL_QA: {
    label: 'Final QA',
    shortLabel: 'Final QA',
    step: 9,
    color: 'teal',
    desc: 'Pre-flight printer check & packaging',
  },
  RELEASE_PUBLISH: {
    label: 'Release / Publish',
    shortLabel: 'Release',
    step: 10,
    color: 'emerald',
    desc: 'Delivery to printers or digital CMS launch',
  },
  ARCHIVE: {
    label: 'Archive',
    shortLabel: 'Archived',
    step: 11,
    color: 'slate',
    desc: 'Project completed & historical assets archived',
  },
};

export const STAGE_ORDER: WorkflowStage[] = [
  'REQUESTED',
  'BRIEF_VALIDATION',
  'BRIEF_LOCKED',
  'PRODUCTION',
  'INTERNAL_QA',
  'CLIENT_REVIEW',
  'REVISION',
  'CLIENT_APPROVAL',
  'FINAL_QA',
  'RELEASE_PUBLISH',
  'ARCHIVE',
];

export const StageBadge: React.FC<{ stage: WorkflowStage; size?: 'sm' | 'md' }> = ({
  stage,
  size = 'md',
}) => {
  const conf = STAGE_CONFIG[stage] || {
    label: stage,
    shortLabel: stage,
    step: 1,
    color: 'slate',
  };

  const colorStyles: Record<string, string> = {
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    orange: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    teal: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-medium ${
        size === 'sm' ? 'text-[11px]' : 'text-xs'
      } ${colorStyles[conf.color] || colorStyles.slate} tracking-tight whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {conf.label}
    </span>
  );
};
