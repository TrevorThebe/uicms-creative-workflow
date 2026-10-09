import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  CheckCircle2,
  FileText,
  FolderKanban,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { StageBadge, StatusBadge } from './StatusBadge';

interface GlobalSearchModalProps {
  onOpenProject: (id: string, initialTab?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onOpenProject }) => {
  const { isSearchOpen, setIsSearchOpen, projects, tasks, clients, files, users } = useApp();
  const [query, setQuery] = useState('');

  // Handle Escape and Ctrl+K shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingProjects = q
    ? projects.filter(
        (p) =>
          p.projectName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.campaignName.toLowerCase().includes(q)
      )
    : projects.slice(0, 4);

  const matchingTasks = q
    ? tasks.filter((t) => t.name.toLowerCase().includes(q) || t.projectId.toLowerCase().includes(q))
    : [];

  const matchingClients = q
    ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    : [];

  const matchingFiles = q
    ? files.filter((f) => f.filename.toLowerCase().includes(q) || f.projectId.toLowerCase().includes(q))
    : [];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsSearchOpen(false);
      }}
      className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, master briefs, tasks, clients, files..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Projects Results */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
              <span>Projects ({matchingProjects.length})</span>
            </span>
            <div className="space-y-1.5">
              {matchingProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onOpenProject(p.id);
                    setIsSearchOpen(false);
                  }}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {p.projectName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {p.nextAction.task} (Due {p.nextAction.dueDate})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StageBadge stage={p.stage} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Results */}
          {matchingTasks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tasks ({matchingTasks.length})</span>
              </span>
              <div className="space-y-1.5">
                {matchingTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onOpenProject(t.projectId, 'tasks');
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-medium text-white truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-400">Due {t.dueDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clients Results */}
          {matchingClients.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Clients ({matchingClients.length})</span>
              </span>
              <div className="space-y-1.5">
                {matchingClients.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{c.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Results */}
          {matchingFiles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Files ({matchingFiles.length})</span>
              </span>
              <div className="space-y-1.5">
                {matchingFiles.slice(0, 3).map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      onOpenProject(f.projectId, 'versions');
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-medium text-white truncate">{f.filename}</span>
                    <span className="text-[10px] uppercase text-indigo-300 font-mono">{f.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
