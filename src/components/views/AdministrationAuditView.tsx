import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Moon,
  Palette,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Sliders,
  Sun,
  Users,
} from 'lucide-react';
import { UserManagementPanel } from '../admin/UserManagementPanel';
import { DatabaseSyncManager } from '../admin/DatabaseSyncManager';

export const AdministrationAuditView: React.FC = () => {
  const { adminConfig, updateAdminConfig, activityLogs, users, resetAllDataToDemo, themeMode, setThemeMode } = useApp();

  const [searchLog, setSearchLog] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  const filteredLogs = activityLogs.filter((log) => {
    if (selectedActionFilter !== 'all' && log.action !== selectedActionFilter) return false;
    if (searchLog.trim()) {
      const q = searchLog.toLowerCase();
      return (
        log.description.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.projectId.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const distinctActions = Array.from(new Set(activityLogs.map((l) => l.action)));

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Administration, Workflow Rules & Immutable Audit Trail
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
              Governance Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Section 30, 31, 32: Manage core workflow policies, enforce approval rules, and audit all platform activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Reset entire system demo state to initial defaults?')) {
              resetAllDataToDemo();
              alert('System demo data successfully re-seeded.');
            }
          }}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo System State</span>
        </button>
      </div>

      {/* Local Files, Database & API Sync Manager */}
      <DatabaseSyncManager />

      {/* User Administration & Governance Section */}
      <UserManagementPanel />

      {/* Theme & Display Mode */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Workspace Appearance & Display Mode
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Switch between Day Mode (high-contrast crisp daylight theme) and Night Mode (low-glare dark studio theme).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Day Mode Option */}
          <button
            type="button"
            onClick={() => setThemeMode('light')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
              themeMode === 'light'
                ? 'bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Day Mode (Light)</span>
                {themeMode === 'light' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Optimized for bright daylight environments, print proofing, and executive client reviews.
              </p>
            </div>
          </button>

          {/* Night Mode Option */}
          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
              themeMode === 'dark'
                ? 'bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 flex-shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Night Mode (Dark)</span>
                {themeMode === 'dark' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Reduced eye strain for extended production sessions, creative design, and late QA shifts.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 1. Workflow Rule Enforcement Toggles (The 8 Golden Rules) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Mandatory Business Workflow Rule Enforcement
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          The 8 system-enforced governance rules guarantee brand safety, zero-defect print output, and client accountability.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white">Rule 1: Enforce Brief Lock for Production</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No creative production can start until master brief has reached 100% completeness and is locked.
              </p>
            </div>
            <input
              type="checkbox"
              checked={adminConfig.workflowRules.enforceBriefLockForProduction}
              onChange={(e) =>
                updateAdminConfig({
                  workflowRules: {
                    ...adminConfig.workflowRules,
                    enforceBriefLockForProduction: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white">Rule 5: Enforce QA Prior to Client Review</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Internal pre-flight QA checklist must be passed before deliverable proofs can be presented to client.
              </p>
            </div>
            <input
              type="checkbox"
              checked={adminConfig.workflowRules.enforceQABeforeClientReview}
              onChange={(e) =>
                updateAdminConfig({
                  workflowRules: {
                    ...adminConfig.workflowRules,
                    enforceQABeforeClientReview: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white">Rule 6: Enforce Formal Client Sign-Off Before Release</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Final print packaging or digital publish is blocked without recorded client digital signature hash.
              </p>
            </div>
            <input
              type="checkbox"
              checked={adminConfig.workflowRules.enforceApprovalBeforeRelease}
              onChange={(e) =>
                updateAdminConfig({
                  workflowRules: {
                    ...adminConfig.workflowRules,
                    enforceApprovalBeforeRelease: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white">Rule 8: Immutable Full-System Audit Trail</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Log WHO, WHAT, WHEN, TO WHICH VERSION, and NEXT ACTION for every single mutation across the workspace.
              </p>
            </div>
            <input
              type="checkbox"
              checked={adminConfig.workflowRules.logAllActions}
              onChange={(e) =>
                updateAdminConfig({
                  workflowRules: {
                    ...adminConfig.workflowRules,
                    logAllActions: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. System-wide Immutable Audit Trail Explorer */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                System Audit Trail Explorer ({filteredLogs.length} Events)
              </h3>
              <p className="text-xs text-slate-400">
                Tamper-proof chronological record of all state transitions and management overrides
              </p>
            </div>
          </div>

          {/* Filter logs */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300"
            >
              <option value="all">All Event Types</option>
              {distinctActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              placeholder="Search audit trail..."
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto divide-y divide-slate-800/60 text-xs">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-3.5 hover:bg-slate-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-400 text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {log.action}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">{log.projectId}</span>
                  {log.versionRef && (
                    <span className="font-mono text-slate-300 text-[10px]">({log.versionRef})</span>
                  )}
                </div>
                <p className="text-white text-xs leading-relaxed">{log.description}</p>
                <div className="text-[10px] text-slate-400">
                  Triggered by: <strong className="text-slate-300">{log.userName}</strong>
                </div>
              </div>
              <div className="text-right flex-shrink-0 text-[10px] text-slate-400 font-mono">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
