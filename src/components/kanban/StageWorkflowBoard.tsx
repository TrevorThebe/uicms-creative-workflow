import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DepartmentId, PriorityLevel, Project, ProjectStatus, WorkflowStage } from '../../types';
import { STAGE_CONFIG, STAGE_ORDER, StatusBadge, StageBadge } from '../common/StatusBadge';
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  Filter,
  Layers,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { getRequestTypeConfig } from '../../data/briefSchemas';

interface StageWorkflowBoardProps {
  onOpenProject: (id: string, initialTab?: string) => void;
  onOpenNewRequest?: () => void;
}

export const StageWorkflowBoard: React.FC<StageWorkflowBoardProps> = ({
  onOpenProject,
  onOpenNewRequest,
}) => {
  const {
    projects,
    users,
    clients,
    tasks,
    chatMessages,
    files,
    changeProjectStage,
    currentUser,
    setIsNewRequestOpen,
  } = useApp();

  const handleOpenNewRequest = () => {
    if (onOpenNewRequest) {
      onOpenNewRequest();
    } else {
      setIsNewRequestOpen(true);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<DepartmentId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');

  const filteredProjects = projects.filter((p) => {
    if (deptFilter !== 'all' && p.departmentId !== deptFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
    if (selectedClientFilter !== 'all' && p.clientId !== selectedClientFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const client = clients.find((c) => c.id === p.clientId);
      const matches =
        p.projectName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.campaignName.toLowerCase().includes(q) ||
        (client?.name.toLowerCase().includes(q) ?? false);
      if (!matches) return false;
    }
    return true;
  });

  const [kanbanNotice, setKanbanNotice] = useState<string | null>(null);

  const handleQuickAdvance = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setKanbanNotice(null);
    const currentIdx = STAGE_ORDER.indexOf(project.stage);
    if (currentIdx < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIdx + 1];
      const res = changeProjectStage(project.id, nextStage);
      if (!res.success) {
        setKanbanNotice(res.error || 'Cannot advance stage: workflow validation rules not met.');
        setTimeout(() => setKanbanNotice(null), 4000);
      }
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 flex flex-col h-[calc(100vh-53px)] overflow-hidden">
      {kanbanNotice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between flex-shrink-0 animate-in fade-in">
          <span>{kanbanNotice}</span>
          <button type="button" onClick={() => setKanbanNotice(null)} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>
      )}

      {/* Board Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Stage Workflow Kanban Board
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
              {filteredProjects.length} Projects
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            11-Stage enforced enterprise workflow engine: Intake → Validation → Production → QA → Review → Approval → Release
          </p>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={handleOpenNewRequest}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Request</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2.5 flex-shrink-0 text-xs">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, campaign, client..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Department */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Departments</option>
          <option value="marketing">Marketing</option>
          <option value="incentive_travel">Incentive Travel</option>
          <option value="online_ram">Online RAM</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="on_track">🟢 On Track</option>
          <option value="due_soon">🟡 Due Soon</option>
          <option value="overdue">🔴 Overdue</option>
          <option value="waiting">🔵 Waiting</option>
          <option value="revision_required">🟠 Revision Required</option>
          <option value="blocked">⚫ Blocked</option>
          <option value="completed">🟢 Complete</option>
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Client */}
        <select
          value={selectedClientFilter}
          onChange={(e) => setSelectedClientFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {(c.name || 'Client').split('(')[0]}
            </option>
          ))}
        </select>

        {(searchQuery || deptFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || selectedClientFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setDeptFilter('all');
              setStatusFilter('all');
              setPriorityFilter('all');
              setSelectedClientFilter('all');
            }}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* 11-Stage Kanban Columns (Horizontal Scroll Container) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 -mx-2 px-2 no-scrollbar">
        <div className="flex gap-3.5 h-full min-w-[2800px]">
          {STAGE_ORDER.map((stage) => {
            const conf = STAGE_CONFIG[stage];
            const stageProjects = filteredProjects.filter((p) => p.stage === stage);

            return (
              <div
                key={stage}
                className="w-72 flex-shrink-0 flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-700">
                      {conf.step}
                    </span>
                    <h3 className="text-xs font-bold text-white tracking-tight truncate">
                      {conf.label}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {stageProjects.length}
                  </span>
                </div>

                {/* Cards Scroll Area */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {stageProjects.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-center p-3">
                      <p className="text-[11px] text-slate-400">
                        No projects in {conf.shortLabel}
                      </p>
                    </div>
                  ) : (
                    stageProjects.map((project) => {
                      const client = clients.find((c) => c.id === project.clientId);
                      const reqConfig = getRequestTypeConfig(project.requestTypeId);
                      const projectTasks = tasks.filter((t) => t.projectId === project.id);
                      const openTasks = projectTasks.filter((t) => t.status !== 'complete');
                      const projectFiles = files.filter((f) => f.projectId === project.id);
                      const projectChat = chatMessages.filter((m) => m.projectId === project.id);
                      const assignedOwner = users.find((u) => u.id === project.projectOwnerId);
                      const accountManager = users.find((u) => u.id === project.accountableUserId);

                      return (
                        <div
                          key={project.id}
                          onClick={() => onOpenProject(project.id)}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950 transition-all shadow-md cursor-pointer group space-y-2.5"
                        >
                          {/* Top Row: Client & Priority */}
                          <div className="flex items-center justify-between gap-1 text-[10px]">
                            <span className="font-semibold text-slate-400 truncate max-w-[140px]">
                              {client?.name ? client.name.split('(')[0].trim() : project.clientId}
                            </span>
                            <span
                              className={`uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                                project.priority === 'urgent'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : project.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {project.priority}
                            </span>
                          </div>

                          {/* Project Name & ID */}
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                              {project.projectName}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                              <span>{project.id}</span>
                              <span>•</span>
                              <span className="text-indigo-300 font-semibold">{project.version}</span>
                            </div>
                          </div>

                          {/* Request Type & Dept */}
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {reqConfig?.name || project.requestTypeId}
                          </div>

                          {/* Next Action Box */}
                          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[10px] space-y-0.5">
                            <div className="text-slate-400 font-medium">Next Action:</div>
                            <div className="text-slate-200 font-semibold truncate" title={project.nextAction.task}>
                              {project.nextAction.task}
                            </div>
                            <div className="text-indigo-400 text-[9px] flex items-center justify-between">
                              <span>Owner: {project.nextAction.ownerName.split(' ')[0]}</span>
                              <span>Due {project.nextAction.dueDate}</span>
                            </div>
                          </div>

                          {/* Status & Indicators */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                            <StatusBadge status={project.status} size="sm" />

                            {/* Meta counts */}
                            <div className="flex items-center gap-2 text-slate-400">
                              {openTasks.length > 0 && (
                                <span className="flex items-center gap-0.5 text-indigo-400" title="Open tasks">
                                  <Clock className="w-3 h-3" />
                                  <span>{openTasks.length}</span>
                                </span>
                              )}
                              {projectFiles.length > 0 && (
                                <span className="flex items-center gap-0.5" title="Attached files">
                                  <Paperclip className="w-3 h-3" />
                                  <span>{projectFiles.length}</span>
                                </span>
                              )}
                              {projectChat.length > 0 && (
                                <span className="flex items-center gap-0.5" title="Messages">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{projectChat.length}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Assigned Owners Footer */}
                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                            <div className="flex items-center gap-1.5 truncate">
                              <img
                                src={assignedOwner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                                alt="Owner"
                                className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-700"
                              />
                              <span className="truncate">{assignedOwner?.name.split(' ')[0] || 'Unassigned'}</span>
                            </div>

                            {/* Advance stage button */}
                            {conf.step < 11 && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickAdvance(e, project)}
                                title="Advance to next workflow stage"
                                className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
