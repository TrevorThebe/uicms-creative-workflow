import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Clock, Layers, Users } from 'lucide-react';

interface TeamWorkloadViewProps {
  onOpenProject: (id: string, initialTab?: string) => void;
}

export const TeamWorkloadView: React.FC<TeamWorkloadViewProps> = ({ onOpenProject }) => {
  const { users, projects, tasks } = useApp();

  const activeProjects = projects.filter((p) => p.stage !== 'ARCHIVE');

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Team Capacity & Workload Balancing
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              {users.length} Team Members
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Section 27 & 28: Monitor individual active project loads, pending tasks, and production bandwidth across departments.
          </p>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const userProjects = activeProjects.filter(
            (p) => p.accountableUserId === user.id || p.projectOwnerId === user.id
          );
          const userTasks = tasks.filter((t) => t.ownerId === user.id && t.status !== 'complete');
          const maxCapacity = 5;
          const loadPercent = Math.min(100, Math.round((userProjects.length / maxCapacity) * 100));

          return (
            <div
              key={user.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-4"
            >
              <div className="flex items-start gap-3">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate">{user.name}</h3>
                  <p className="text-xs text-indigo-400 font-medium truncate">{user.roleTitle}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Workload Capacity Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Production Load:</span>
                  <span
                    className={`font-bold ${
                      loadPercent >= 80 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {userProjects.length} / {maxCapacity} Projects ({loadPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      loadPercent >= 80 ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>
              </div>

              {/* Assigned Projects List */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Active Projects Assigned ({userProjects.length})
                </span>
                {userProjects.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No active project assignments.</p>
                ) : (
                  userProjects.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onOpenProject(p.id)}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-white truncate max-w-[180px]">
                        {p.projectName}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300">{p.version}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
