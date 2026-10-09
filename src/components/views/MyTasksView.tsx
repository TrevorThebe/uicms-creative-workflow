import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import {
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  Filter,
  Layers,
  Plus,
  Search,
  User,
} from 'lucide-react';

interface MyTasksViewProps {
  onOpenProject: (id: string, initialTab?: string) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({ onOpenProject }) => {
  const { tasks, projects, users, currentUser, updateTaskStatus, createTask } = useApp();

  const [filterMode, setFilterMode] = useState<'my' | 'all' | 'pending' | 'completed'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState(projects[0]?.id || '');
  const [newTaskOwnerId, setNewTaskOwnerId] = useState(currentUser.id);
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );

  React.useEffect(() => {
    if (!newTaskProjectId && projects.length > 0) {
      setNewTaskProjectId(projects[0].id);
    }
  }, [projects, newTaskProjectId]);

  const filteredTasks = tasks.filter((t) => {
    if (filterMode === 'my' && t.ownerId !== currentUser.id) return false;
    if (filterMode === 'pending' && t.status === 'complete') return false;
    if (filterMode === 'completed' && t.status !== 'complete') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const prj = projects.find((p) => p.id === t.projectId);
      const matches =
        t.name.toLowerCase().includes(q) ||
        (prj?.projectName.toLowerCase().includes(q) ?? false) ||
        t.projectId.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const handleCreateNewTask = () => {
    if (!newTaskName.trim()) return;
    const targetProject = projects.find((p) => p.id === newTaskProjectId);
    createTask({
      projectId: newTaskProjectId,
      name: newTaskName.trim(),
      description: `Task for project ${targetProject?.projectName || newTaskProjectId}`,
      ownerId: newTaskOwnerId,
      departmentId: targetProject?.departmentId || 'marketing',
      priority: newTaskPriority,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: newTaskDueDate,
      status: 'in_progress',
    });
    setNewTaskName('');
    setShowNewTaskModal(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Task Operations & Work Breakdown
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              {filteredTasks.length} Tasks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rule 4: Every task must have an owner and due date. Direct status updates and milestone tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewTaskModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {[
            { id: 'my', label: 'My Assigned Tasks' },
            { id: 'pending', label: 'All Pending' },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All Tasks' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setFilterMode(mode.id as any)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                filterMode === mode.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tasks by name or project..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 space-y-2">
            <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No tasks match current filter</p>
            <p className="text-xs text-slate-400">All caught up or try clearing your search.</p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === 'complete';
            const prj = projects.find((p) => p.id === t.projectId);
            const taskOwner = users.find((u) => u.id === t.ownerId);

            return (
              <div
                key={t.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => updateTaskStatus(t.id, isDone ? 'in_progress' : 'complete')}
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0 mt-0.5 sm:mt-0 ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-700 bg-slate-950 hover:border-indigo-500'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isDone ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {t.name}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                          t.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : t.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span
                        onClick={() => prj && onOpenProject(prj.id, 'tasks')}
                        className="text-indigo-400 hover:underline cursor-pointer font-medium"
                      >
                        {prj?.projectName || t.projectId} ({t.projectId})
                      </span>
                      <span>•</span>
                      <span>Owner: <strong className="text-slate-200">{taskOwner?.name}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due {t.dueDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {t.status}
                  </span>
                  {prj && (
                    <button
                      type="button"
                      onClick={() => onOpenProject(prj.id, 'tasks')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      Open Project →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewTaskModal(false);
          }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create New Workflow Task</h3>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="e.g. Verify CMYK Pantone color matching for Litho printer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Associated Project
                </label>
                <select
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}: {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Assignee
                  </label>
                  <select
                    value={newTaskOwnerId}
                    onChange={(e) => setNewTaskOwnerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewTask}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
