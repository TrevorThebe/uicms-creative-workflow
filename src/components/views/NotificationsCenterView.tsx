import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Notification, NotificationType } from '../../types';
import { StageBadge } from '../common/StatusBadge';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Inbox,
  Layers,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

interface NotificationsCenterViewProps {
  onOpenProject?: (projectId: string, initialTab?: string) => void;
}

type CategoryTab = 'all' | 'action_required' | 'tasks' | 'approvals' | 'mentions';

export const NotificationsCenterView: React.FC<NotificationsCenterViewProps> = ({
  onOpenProject,
}) => {
  const {
    currentUser,
    users,
    notifications,
    projects,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    toggleNotificationRead,
    deleteNotification,
    clearReadNotifications,
    setSelectedProjectId,
    setActiveProjectTab,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Test Notification Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTitle, setTestTitle] = useState('Test System Notification');
  const [testMsg, setTestMsg] = useState('This is a test notification verifying dynamic database persistence and unread count.');
  const [testType, setTestType] = useState<NotificationType>('system_alert');
  const [testUserId, setTestUserId] = useState<string>(currentUser.id);
  const [testProjectId, setTestProjectId] = useState<string>('');

  // User-relevant notifications
  const userNotifications = useMemo(() => {
    return notifications.filter(
      (n) => n.userId === currentUser.id || currentUser.role === 'super_admin'
    );
  }, [notifications, currentUser]);

  // Counts for summary metrics
  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => !n.read).length;
  }, [userNotifications]);

  const actionRequiredCount = useMemo(() => {
    return userNotifications.filter(
      (n) =>
        !n.read &&
        (n.type === 'approval_required' ||
          n.type === 'qa_required' ||
          n.type === 'client_feedback' ||
          n.type === 'new_request')
    ).length;
  }, [userNotifications]);

  const taskUpdatesCount = useMemo(() => {
    return userNotifications.filter(
      (n) =>
        n.type === 'task_assigned' ||
        n.type === 'task_due_soon' ||
        n.type === 'task_overdue'
    ).length;
  }, [userNotifications]);

  // Filtered Notifications List
  const filteredNotifications = useMemo(() => {
    return userNotifications
      .filter((n) => {
        // Category Filter
        if (activeCategory === 'action_required') {
          return (
            n.type === 'approval_required' ||
            n.type === 'qa_required' ||
            n.type === 'client_feedback' ||
            n.type === 'revision_requested' ||
            n.type === 'qa_failed' ||
            n.type === 'new_request'
          );
        }
        if (activeCategory === 'tasks') {
          return (
            n.type === 'task_assigned' ||
            n.type === 'task_due_soon' ||
            n.type === 'task_overdue'
          );
        }
        if (activeCategory === 'approvals') {
          return (
            n.type === 'approval_required' ||
            n.type === 'approval_received' ||
            n.type === 'approval_rejected' ||
            n.type === 'brief_locked' ||
            n.type === 'final_release'
          );
        }
        if (activeCategory === 'mentions') {
          return n.type === 'internal_feedback';
        }
        return true;
      })
      .filter((n) => {
        // Read Filter
        if (readFilter === 'unread') return !n.read;
        if (readFilter === 'read') return n.read;
        return true;
      })
      .filter((n) => {
        // Project Filter
        if (selectedProjectIdFilter === 'all') return true;
        return n.projectId === selectedProjectIdFilter;
      })
      .filter((n) => {
        // Search Filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.projectId && n.projectId.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [
    userNotifications,
    activeCategory,
    readFilter,
    selectedProjectIdFilter,
    searchQuery,
  ]);

  const handleOpenTarget = (notif: Notification) => {
    if (!notif.read) {
      markNotificationAsRead(notif.id);
    }
    if (notif.projectId) {
      const tab = notif.targetTab || 'overview';
      if (onOpenProject) {
        onOpenProject(notif.projectId, tab);
      } else {
        setSelectedProjectId(notif.projectId);
        setActiveProjectTab(tab);
      }
    }
  };

  const getNotificationIconAndStyle = (type: NotificationType) => {
    switch (type) {
      case 'approval_required':
        return {
          icon: AlertCircle,
          iconColor: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          badge: 'Approval Action Required',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'qa_required':
        return {
          icon: ShieldAlert,
          iconColor: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          badge: 'QA Inspection Due',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      case 'approval_received':
        return {
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          badge: 'Client Approval Confirmed',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'brief_locked':
        return {
          icon: Lock,
          iconColor: 'text-sky-400',
          bg: 'bg-sky-500/10',
          border: 'border-sky-500/30',
          badge: 'Brief Locked',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        };
      case 'new_request':
        return {
          icon: Sparkles,
          iconColor: 'text-indigo-400',
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/30',
          badge: 'New Request Intake',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        };
      case 'client_feedback':
        return {
          icon: AlertTriangle,
          iconColor: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          badge: 'Client Revision Requested',
          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        };
      case 'internal_feedback':
        return {
          icon: MessageSquare,
          iconColor: 'text-purple-400',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          badge: 'Team Discussion & Mention',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        };
      case 'task_assigned':
        return {
          icon: CheckCircle2,
          iconColor: 'text-cyan-400',
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          badge: 'Task Assignment',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        };
      case 'task_due_soon':
        return {
          icon: Clock,
          iconColor: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          badge: 'Task Due Soon',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'task_overdue':
        return {
          icon: Flame,
          iconColor: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          badge: 'Overdue Deadline SLA',
          badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
        };
      default:
        return {
          icon: Bell,
          iconColor: 'text-slate-400',
          bg: 'bg-slate-800/40',
          border: 'border-slate-800',
          badge: 'Notification',
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header View Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Notification & Escalation Center
                  </h1>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time alerts for approvals, QA inspections, task deadlines, and client revisions.
                </p>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowTestModal(true)}
                className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-4 h-4 text-sky-200" />
                <span>Test Send Notification</span>
              </button>

              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                disabled={unreadCount === 0}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Mark All Read</span>
              </button>

              <button
                type="button"
                onClick={clearReadNotifications}
                className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Clear Read</span>
              </button>
            </div>
          </div>

          {/* Metric Highlights Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Total Alerts
                </span>
                <span className="text-lg font-bold text-white">{userNotifications.length}</span>
              </div>
              <Inbox className="w-5 h-5 text-indigo-400 opacity-80" />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Unread Items
                </span>
                <span className="text-lg font-bold text-sky-400">{unreadCount}</span>
              </div>
              <Bell className="w-5 h-5 text-sky-400 opacity-80" />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Action Required
                </span>
                <span className="text-lg font-bold text-amber-400">{actionRequiredCount}</span>
              </div>
              <AlertCircle className="w-5 h-5 text-amber-400 opacity-80" />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Task Updates
                </span>
                <span className="text-lg font-bold text-emerald-400">{taskUpdatesCount}</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Controls Bar: Category Tabs, Read Filter, Project Selector, Search */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm mb-6 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All Alerts ({userNotifications.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('action_required')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeCategory === 'action_required'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Action Required ({actionRequiredCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('tasks')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeCategory === 'tasks'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tasks & Deadlines</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('approvals')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeCategory === 'approvals'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Approvals & QA</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('mentions')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeCategory === 'mentions'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                <span>Mentions</span>
              </button>
            </div>

            {/* Read / Unread Toggle & Search */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Read Filter */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setReadFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    readFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setReadFilter('unread')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    readFilter === 'unread' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Unread
                </button>
                <button
                  type="button"
                  onClick={() => setReadFilter('read')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    readFilter === 'read' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Read
                </button>
              </div>

              {/* Project Filter */}
              <select
                value={selectedProjectIdFilter}
                onChange={(e) => setSelectedProjectIdFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} - {p.projectName.substring(0, 24)}...
                  </option>
                ))}
              </select>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter alerts..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3 shadow-inner">
                <BellOff className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-white">No notifications found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                You're completely caught up! There are no matching alerts for the selected category and filter.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const style = getNotificationIconAndStyle(notif.type);
              const IconComp = style.icon;
              const relatedProject = projects.find((p) => p.id === notif.projectId);

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all duration-150 flex flex-col sm:flex-row items-start justify-between gap-4 ${
                    !notif.read
                      ? 'bg-slate-900/90 border-sky-500/40 shadow-md ring-1 ring-sky-500/20'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Icon Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl ${style.bg} ${style.border} border flex items-center justify-center ${style.iconColor} flex-shrink-0 shadow-inner mt-0.5`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    {/* Main Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${style.badgeColor}`}
                        >
                          {style.badge}
                        </span>

                        {relatedProject && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                            {relatedProject.id}
                          </span>
                        )}

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-bold tracking-tight ${
                          !notif.read ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {notif.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                      {relatedProject && (
                        <div className="pt-1 flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-slate-400 font-medium truncate">
                            Project: {relatedProject.projectName}
                          </span>
                          <span>•</span>
                          <StageBadge stage={relatedProject.stage} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {notif.projectId && (
                      <button
                        type="button"
                        onClick={() => handleOpenTarget(notif)}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <span>View & Act</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleNotificationRead(notif.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      title={notif.read ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      {notif.read ? <Eye className="w-4 h-4" /> : <Check className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Test Send Notification Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Test Send Notification</h3>
                  <p className="text-xs text-slate-400">Dispatch custom text & alert notifications to database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addNotification({
                  userId: testUserId,
                  type: testType,
                  title: testTitle.trim() || 'Test Notification',
                  message: testMsg.trim() || 'Sample test message notification content.',
                  projectId: testProjectId || undefined,
                  targetTab: 'chat',
                });
                setShowTestModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target User</label>
                <select
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                >
                  <option value={currentUser.id}>Current User ({currentUser.name})</option>
                  <option value="ALL">All Users (Broadcast)</option>
                  {users.filter(u => u.id !== currentUser.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleTitle})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notification Type</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as NotificationType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                >
                  <option value="system_alert">System Alert</option>
                  <option value="task_assigned">Task Assigned</option>
                  <option value="approval_required">Approval Required</option>
                  <option value="qa_required">QA Inspection Required</option>
                  <option value="internal_feedback">Internal Chat Feedback</option>
                  <option value="client_feedback">Client Feedback</option>
                  <option value="general_alert">General Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notification Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                  placeholder="e.g. Action Required: Project Revision Needed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message Body</label>
                <textarea
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                  placeholder="Write test notification text message..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Associate Project (Optional)</label>
                <select
                  value={testProjectId}
                  onChange={(e) => setTestProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                >
                  <option value="">None (Global)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.id} - {p.projectName}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Notification Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
