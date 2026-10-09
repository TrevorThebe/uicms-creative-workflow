import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StageBadge, StatusBadge } from '../common/StatusBadge';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileCheck2,
  Lock,
  MessageSquare,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

interface ApprovalsCenterViewProps {
  onOpenProject: (id: string, initialTab?: string) => void;
}

export const ApprovalsCenterView: React.FC<ApprovalsCenterViewProps> = ({
  onOpenProject,
}) => {
  const { projects, clients, approvals, versions, currentUser } = useApp();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const pendingProjects = projects.filter(
    (p) =>
      (p.stage === 'CLIENT_REVIEW' || p.stage === 'CLIENT_APPROVAL') &&
      p.approvalStatus !== 'approved'
  );

  const approvedProjects = projects.filter(
    (p) => p.approvalStatus === 'approved' || p.approvalStatus === 'approved_with_notes'
  );

  const displayList =
    filter === 'pending'
      ? pendingProjects
      : filter === 'approved'
      ? approvedProjects
      : projects.filter((p) => p.stage !== 'REQUESTED' && p.stage !== 'BRIEF_VALIDATION');

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Approvals & Formal Sign-Off Center
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              {pendingProjects.length} Pending Sign-Off
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rules 5 & 6: Pre-flight internal QA must pass before review. Final release is strictly blocked without documented approval.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Awaiting Approval ({pendingProjects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filter === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Approved ({approvedProjects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Lifecycle Proofs
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {displayList.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 space-y-2">
            <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No projects in this approval queue</p>
            <p className="text-xs text-slate-400">All deliverables have been processed.</p>
          </div>
        ) : (
          displayList.map((p) => {
            const client = clients.find((c) => c.id === p.clientId);
            const projectVersion = versions.find((v) => v.projectId === p.id);
            const projectApproval = approvals.find((a) => a.projectId === p.id);

            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      {p.id}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-300">
                      {p.version}
                    </span>
                    <StageBadge stage={p.stage} size="sm" />
                    <StatusBadge status={p.status} size="sm" />
                  </div>

                  <span className="text-xs text-slate-400">
                    Client Approval Target: <strong className="text-indigo-300">{p.clientApprovalDueDate}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
                  <div className="lg:col-span-2 space-y-1">
                    <h3 className="text-base font-bold text-white hover:text-indigo-300 transition-colors">
                      {p.projectName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Client: <strong className="text-slate-200">{client?.name}</strong> • Campaign:{' '}
                      <span className="text-slate-300">{p.campaignName}</span>
                    </p>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 mt-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                        Current Milestone Next Action:
                      </span>
                      {p.nextAction.task} (Owner: {p.nextAction.ownerName})
                    </div>
                  </div>

                  {/* Right: Approval Status & CTA */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Approval Status
                      </span>
                      {projectApproval ? (
                        <div className="space-y-1 mt-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Signed by {projectApproval.clientName}</span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 truncate">
                            Hash: {projectApproval.signatureHash}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>Pending formal client sign-off</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenProject(p.id, 'approval')}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Open Approval Workspace</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
