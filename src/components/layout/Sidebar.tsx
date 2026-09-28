import React from 'react';
import { ActiveNavSection } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  FileCheck2,
  FolderKanban,
  Folders,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Milestone,
  Moon,
  PlusCircle,
  Settings,
  Shield,
  Sun,
  Table,
  Users,
} from 'lucide-react';

interface SidebarProps {
  activeSection?: ActiveNavSection;
  onSelectSection?: (section: ActiveNavSection) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    projects,
    tasks,
    notifications,
    approvals,
    currentUser,
    activeNavSection,
    setActiveNavSection,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setIsNewRequestOpen,
    themeMode,
    toggleThemeMode,
  } = useApp();

  const activeSection = props.activeSection || activeNavSection;
  const isCollapsed = props.isCollapsed !== undefined ? props.isCollapsed : isSidebarCollapsed;
  const onSelectSection = (section: ActiveNavSection) => {
    if (section === 'new_request') {
      setIsNewRequestOpen(true);
      return;
    }
    if (props.onSelectSection) {
      props.onSelectSection(section);
    } else {
      setActiveNavSection(section);
    }
  };

  const myRequestsCount = projects.filter(
    (p) => p.accountableUserId === currentUser.id && p.stage !== 'ARCHIVE'
  ).length;

  const myTasksCount = tasks.filter(
    (t) => t.ownerId === currentUser.id && t.status !== 'complete' && t.status !== 'cancelled'
  ).length;

  const pendingApprovalsCount = projects.filter(
    (p) => (p.stage === 'CLIENT_REVIEW' || p.stage === 'CLIENT_APPROVAL') && p.approvalStatus !== 'approved'
  ).length;

  const unreadNotifsCount = notifications.filter(
    (n) => !n.read && n.userId === currentUser.id
  ).length;

  const urgentIssuesCount = projects.filter(
    (p) => (p.blockers && p.blockers.trim() !== '') || p.status === 'overdue'
  ).length;

  const navItems: Array<{
    id: ActiveNavSection;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    group: 'primary' | 'workspace' | 'management' | 'config';
  }> = [
    // Primary Core
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'primary' },
    { id: 'weekly_summary', label: 'Weekly Work Summary', icon: Milestone, badge: urgentIssuesCount, badgeColor: 'bg-rose-600 animate-pulse', group: 'primary' },
    { id: 'my_requests', label: 'My Requests', icon: Inbox, badge: myRequestsCount, group: 'primary' },
    { id: 'all_projects', label: 'All Projects (Kanban)', icon: FolderKanban, group: 'primary' },
    { id: 'new_request', label: 'New Request', icon: PlusCircle, group: 'primary' },

    // Workspace Operations
    { id: 'my_tasks', label: 'My Tasks', icon: CheckSquare, badge: myTasksCount, badgeColor: 'bg-indigo-600', group: 'workspace' },
    { id: 'approvals', label: 'Approvals & Sign-off', icon: FileCheck2, badge: pendingApprovalsCount, badgeColor: 'bg-amber-600', group: 'workspace' },
    { id: 'tracker', label: 'Project Tracker (Excel)', icon: Table, group: 'workspace' },
    { id: 'calendar', label: 'Deadlines & Calendar', icon: Calendar, group: 'workspace' },
    { id: 'messages', label: 'Messages & Chat', icon: MessageSquare, group: 'workspace' },
    { id: 'notifications', label: 'Notifications', icon: CheckCircle2, badge: unreadNotifsCount, badgeColor: 'bg-sky-600', group: 'workspace' },
    { id: 'files', label: 'File Repository', icon: Folders, group: 'workspace' },

    // Management & Insights
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, group: 'management' },
    { id: 'team', label: 'Team Workload', icon: Users, group: 'management' },
    { id: 'clients', label: 'Clients & CI Books', icon: Building2, group: 'management' },

    // System Config & Help
    { id: 'user_guide', label: 'System Manual & ReadMe', icon: BookOpen, group: 'config' },
    { id: 'departments', label: 'Departments & Workflow', icon: Settings, group: 'config' },
    ...(currentUser.role === 'super_admin'
      ? [{ id: 'administration' as ActiveNavSection, label: 'Admin Settings & Audit', icon: Shield, group: 'config' as const }]
      : []),
  ];

  return (
    <aside
      className={`h-[calc(100vh-53px)] sticky top-[53px] bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
        {/* Section 1: Main */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Core Workflow
            </p>
          )}
          {navItems
            .filter((item) => item.group === 'primary')
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Section 2: Workspace */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Operations & Tasks
            </p>
          )}
          {navItems
            .filter((item) => item.group === 'workspace')
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-white ${
                        item.badgeColor || 'bg-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Section 3: Management */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Management & Insights
            </p>
          )}
          {navItems
            .filter((item) => item.group === 'management')
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
        </div>

        {/* Section 4: Administration */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Governance & Admin
            </p>
          )}
          {navItems
            .filter((item) => item.group === 'config')
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Sidebar Footer: Theme Switcher & System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
        <button
          type="button"
          onClick={toggleThemeMode}
          title={themeMode === 'light' ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)'}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all`}
        >
          <div className="flex items-center gap-2">
            {themeMode === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            )}
            {!isCollapsed && (
              <span className="font-medium text-[11px]">
                {themeMode === 'light' ? 'Day Mode' : 'Night Mode'}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {themeMode === 'light' ? 'Active' : 'Active'}
            </span>
          )}
        </button>

        {!isCollapsed && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Workflow Engine Active</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">v1.0-2026</span>
          </div>
        )}
      </div>
    </aside>
  );
};
