import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Check,
  ChevronDown,
  KeyRound,
  Layers,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sun,
  User as UserIcon,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  onOpenNewRequest?: () => void;
  onOpenProject?: (id: string, initialTab?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewRequest, onOpenProject }) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setSelectedProjectId,
    setActiveProjectTab,
    setIsSearchOpen,
    resetAllDataToDemo,
    adminConfig,
    setIsNewRequestOpen,
    themeMode,
    toggleThemeMode,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    setIsProfileModalOpen,
    logoutUser,
    setActiveNavSection,
  } = useApp();

  const handleOpenNewRequest = () => {
    if (onOpenNewRequest) {
      onOpenNewRequest();
    } else {
      setIsNewRequestOpen(true);
    }
  };

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read && n.userId === currentUser.id).length;
  const userNotifications = notifications.filter((n) => n.userId === currentUser.id || !n.userId);

  const roleLabels: Record<UserRole, { label: string; badge: string }> = {
    super_admin: { label: 'Super Admin', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    department_manager: { label: 'Dept Manager', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    account_manager: { label: 'Account Manager', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    designer: { label: 'Designer / Producer', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    qa_user: { label: 'QA Lead', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    client: { label: 'Client Approver', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20 flex-shrink-0">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight truncate">
              {adminConfig.appName}
            </h1>
            <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Enterprise 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate hidden md:block">
            {adminConfig.appSubtitle}
          </p>
        </div>
      </div>

      {/* Middle: Search trigger */}
      <div className="flex-1 max-w-md mx-2 hidden sm:block">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs transition-colors group shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            <span>Search projects, briefs, clients, QA logs...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Mobile search button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick New Request CTA */}
        <button
          type="button"
          onClick={handleOpenNewRequest}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all focus:outline-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden xs:inline">New Request</span>
        </button>

        {/* Day / Night Mode Toggle */}
        <button
          type="button"
          onClick={toggleThemeMode}
          title={themeMode === 'light' ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)'}
          aria-label="Toggle theme mode"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          {themeMode === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500 hover:text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400 hover:text-indigo-300 transition-transform hover:-rotate-12" />
          )}
          <span className="hidden md:inline text-[11px] font-medium text-slate-400 capitalize">
            {themeMode === 'light' ? 'Day' : 'Night'}
          </span>
        </button>

        {/* Messages & Chat Quick Button */}
        <button
          type="button"
          onClick={() => setActiveNavSection('messages')}
          title="Messages & Live Chat"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {isNotifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
                {userNotifications.length === 0 ? (
                  <p className="text-slate-400 text-center py-6 text-xs">
                    No new notifications
                  </p>
                ) : (
                  userNotifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.projectId) {
                          if (onOpenProject) {
                            onOpenProject(n.projectId, n.targetTab || 'overview');
                          } else {
                            setSelectedProjectId(n.projectId);
                            if (n.targetTab) setActiveProjectTab(n.targetTab);
                          }
                        } else if (n.targetTab === 'chat' || n.type === 'internal_feedback') {
                          setActiveNavSection('messages');
                        }
                        setIsNotifDropdownOpen(false);
                      }}
                      className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                        n.read
                          ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/50'
                          : 'bg-indigo-950/20 border-indigo-500/20 text-slate-200 hover:bg-indigo-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-white text-xs">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveNavSection('notifications');
                    setIsNotifDropdownOpen(false);
                  }}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open Notification Center</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Persona Dropdown or Sign In button */}
        {!isAuthenticated ? (
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Sign In / Register
          </button>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all text-left"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500/40"
              />
              <div className="hidden sm:block text-left leading-none">
                <span className="text-xs font-semibold text-white block truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block truncate max-w-[110px]">
                  {roleLabels[currentUser.role]?.label || currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Active User Header */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 mb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>My Profile & Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        logoutUser();
                      }}
                      className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>

                <div className="px-2.5 py-1.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Quick Persona Switch
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setAuthModalMode('register');
                      setIsAuthModalOpen(true);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Register User</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 mt-1">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    const roleMeta = roleLabels[u.role] || { label: u.role, badge: 'bg-slate-700 text-slate-300' };
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setCurrentUser(u);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold truncate text-white">
                              {u.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border ${roleMeta.badge}`}>
                              {roleMeta.label}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {u.roleTitle.split('(')[0]}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/80 px-2 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset demo state back to default seeded data?')) {
                        resetAllDataToDemo();
                        setIsUserDropdownOpen(false);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
