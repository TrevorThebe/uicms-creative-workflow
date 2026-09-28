import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StageBadge, StatusBadge } from '../common/StatusBadge';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Layers,
} from 'lucide-react';

interface CalendarDeadlinesViewProps {
  onOpenProject: (id: string, initialTab?: string) => void;
}

export const CalendarDeadlinesView: React.FC<CalendarDeadlinesViewProps> = ({
  onOpenProject,
}) => {
  const { projects, clients } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | 'releases' | 'qa' | 'production'>('all');

  // Sort projects by release date
  const sortedProjects = [...projects]
    .filter((p) => p.stage !== 'ARCHIVE')
    .sort((a, b) => (a.releaseDate > b.releaseDate ? 1 : -1));

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Deadlines & Campaign Calendar
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              {sortedProjects.length} Active Deadlines
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Section 25 & 26: Milestone turnaround targets, QA inspection deadlines, and final release countdowns.
          </p>
        </div>
      </div>

      {/* Timeline Schedule Cards */}
      <div className="space-y-4">
        {sortedProjects.map((p) => {
          const client = clients.find((c) => c.id === p.clientId);
          const daysLeft = Math.ceil(
            (new Date(p.releaseDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );

          return (
            <div
              key={p.id}
              onClick={() => onOpenProject(p.id)}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-md cursor-pointer group space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                    {p.id}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {p.version}
                  </span>
                  <StageBadge stage={p.stage} size="sm" />
                  <StatusBadge status={p.status} size="sm" />
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      daysLeft <= 2
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : daysLeft <= 5
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {daysLeft < 0
                      ? `${Math.abs(daysLeft)} days overdue`
                      : daysLeft === 0
                      ? 'Releasing Today'
                      : `${daysLeft} days until release`}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {p.projectName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client: <strong className="text-slate-200">{client?.name}</strong> • Accountable:{' '}
                  <span className="text-slate-300">{p.nextAction.ownerName}</span>
                </p>
              </div>

              {/* Sequential Milestone Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Brief Validation</span>
                  <span className="font-semibold text-white">{p.briefDueDate}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Production V1</span>
                  <span className="font-semibold text-white">{p.productionDueDate}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Internal QA</span>
                  <span className="font-semibold text-white">{p.internalQaDueDate}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Client Review</span>
                  <span className="font-semibold text-white">{p.clientReviewDueDate}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Client Approval</span>
                  <span className="font-semibold text-white">{p.clientApprovalDueDate}</span>
                </div>
                <div className="p-2 rounded-lg bg-indigo-600 border border-indigo-500 shadow-sm">
                  <span className="text-[10px] text-indigo-100 block font-bold">Release Date</span>
                  <span className="font-extrabold text-white">{p.releaseDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
