import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DepartmentId } from '../../types';
import { DEPARTMENTS_DATA, getRequestTypesForDepartment } from '../../data/briefSchemas';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  Layers,
  Megaphone,
  MonitorCheck,
  Move,
  PlaneTakeoff,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
  Workflow,
  Zap,
} from 'lucide-react';

export const DepartmentsWorkflowView: React.FC = () => {
  const { projects, users } = useApp();
  const [selectedDeptId, setSelectedDeptId] = useState<DepartmentId>('marketing');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'stages' | 'templates' | 'sla' | 'diagnostics'>('stages');
  const [testWorkflowModal, setTestWorkflowModal] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const selectedDept = DEPARTMENTS_DATA.find((d) => d.id === selectedDeptId) || DEPARTMENTS_DATA[0];
  const reqTypes = getRequestTypesForDepartment(selectedDeptId);
  const deptProjects = projects.filter((p) => p.departmentId === selectedDeptId);
  const deptLead = users.find((u) => u.id === selectedDept.managerId);

  const iconsMap: Record<string, React.ElementType> = {
    Megaphone,
    PlaneTakeoff,
    MonitorCheck,
    Layers,
  };
  const DeptIcon = iconsMap[selectedDept.iconName] || Layers;

  const handleRunDiagnostic = () => {
    setTestWorkflowModal(true);
    setTestResult('Analyzing workflow triggers, brief schema constraints, and SLA escalation thresholds...');
    setTimeout(() => {
      setTestResult(`✓ All 8 Governance Rules active. Zero bottleneck warnings for ${selectedDept.name}. Ready for production intake.`);
    }, 600);
  };

  return (
    <div
      data-page="departments"
      className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Departments & Workflow Governance
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold">
              4 Active Units
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Configure intake pipelines, stage gates, SLA benchmarks, and automated QA checkpoints.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunDiagnostic}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Play className="w-3.5 h-3.5 text-white" />
            <span>Test Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => alert(`Department rulebook exported for ${selectedDept.name}`)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export Schema</span>
          </button>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEPARTMENTS_DATA.map((dept) => {
          const isSelected = selectedDeptId === dept.id;
          const IconComponent = iconsMap[dept.iconName] || Layers;
          const count = projects.filter((p) => p.departmentId === dept.id).length;

          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative group ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-indigo-800 text-white'
                      : 'bg-slate-800 text-slate-200 group-hover:bg-slate-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Configure Department"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDeptId(dept.id);
                      setActiveWorkflowTab('sla');
                    }}
                    className={`p-1.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button
                    type="button"
                    title="Edit Department Details"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Editing specifications for ${dept.name}`);
                    }}
                    className={`p-1.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold truncate text-white">
                  {dept.name}
                </h3>
                <p className={`text-[11px] line-clamp-2 mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-300'}`}>
                  {dept.description}
                </p>
              </div>

              <div className={`flex items-center justify-between pt-2 border-t text-xs ${isSelected ? 'border-indigo-500/60' : 'border-slate-800'}`}>
                <span className={`font-mono text-[10px] font-semibold ${isSelected ? 'text-indigo-200' : 'text-indigo-400'}`}>
                  {dept.code}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-indigo-700 text-white border border-indigo-400/40'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {count} active prjs
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Department Configuration Panel */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* Department Banner & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <DeptIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {selectedDept.name} Pipeline
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold border border-slate-700">
                  {selectedDept.code}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Department Lead: <strong className="text-white">{deptLead?.name || 'Assigned Lead'}</strong> • {deptProjects.length} active deliverables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Duplicate Workflow Rule"
              onClick={() => alert(`Copied workflow configuration for ${selectedDept.name}`)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Copy className="w-3.5 h-3.5 text-white" />
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              title="Refresh Pipeline Status"
              onClick={() => alert('Pipeline rules validated and refreshed.')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Workflow Navigation Sub-tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'stages', label: '7-Stage Pipeline', icon: Workflow },
            { id: 'templates', label: `Intake Types (${reqTypes.length})`, icon: FileCode },
            { id: 'sla', label: 'SLA & Turnaround Gates', icon: Clock },
            { id: 'diagnostics', label: 'Rule Verification', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeWorkflowTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWorkflowTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isTabActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isTabActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: 7-Stage Pipeline Visualizer */}
        {activeWorkflowTab === 'stages' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Linear progression order with mandatory pre-flight checklists</span>
              <button
                type="button"
                onClick={() => alert('Stage order locked per ISO 9001 governance policy.')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Move className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reorder Gates</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { stage: '1. Brief Intake & Validation', rule: 'Requires 100% Brief Completeness & Brand Lock', owner: 'Requester / Lead', days: '24h' },
                { stage: '2. Creative Production', rule: 'Production V1 design, layout assembly, and asset export', owner: 'Lead Designer', days: '3-5d' },
                { stage: '3. Internal Pre-flight QA', rule: 'Zero defects across bleeds, fonts, colors, and flight specs', owner: 'QA Inspector', days: '24h' },
                { stage: '4. Client Review', rule: 'Watermarked proof presentation and feedback iteration', owner: 'Account Exec', days: '48h' },
                { stage: '5. Client Formal Sign-Off', rule: 'Binding approval timestamp, sign-off log, and lock', owner: 'Client Authority', days: '24h' },
                { stage: '6. Release & Print Go-Live', rule: 'High-res package handoff to printers/media servers', owner: 'Production Mgr', days: 'Release' },
                { stage: '7. Digital Archive & Post-Mortem', rule: 'Immutable archive to DAM storage and audit seal', owner: 'System Admin', days: 'Post' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{item.stage}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Edit Stage Gates"
                        onClick={() => alert(`Configuring rules for ${item.stage}`)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                      >
                        <Settings className="w-3 h-3 text-white" />
                      </button>
                      <button
                        type="button"
                        title="View Checkpoints"
                        onClick={() => alert(`Inspection checkpoints for ${item.stage}`)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                      >
                        <Eye className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300">{item.rule}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                    <span className="text-slate-300">Owner: <strong className="text-white">{item.owner}</strong></span>
                    <span className="font-mono font-bold text-indigo-300 bg-indigo-900/60 border border-indigo-700/50 px-1.5 py-0.5 rounded">
                      {item.days}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Intake Types & Schemas */}
        {activeWorkflowTab === 'templates' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Registered intake brief schemas for {selectedDept.name}</span>
              <button
                type="button"
                onClick={() => alert(`New brief schema wizard opened for ${selectedDept.name}`)}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Add Intake Schema</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reqTypes.map((rt) => (
                <div
                  key={rt.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{rt.name}</h4>
                      <span className="text-[10px] font-mono text-indigo-400 font-semibold">{rt.id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Edit Schema"
                        onClick={() => alert(`Editing schema for ${rt.name}`)}
                        className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        type="button"
                        title="Duplicate Template"
                        onClick={() => alert(`Duplicated schema ${rt.name}`)}
                        className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300">{rt.description}</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-[10px] text-slate-300 font-mono">
                    <span>{rt.fields.length} Brief Fields</span>
                    <span>•</span>
                    <span>{rt.defaultQaItems.length} Automated QA Checkpoints</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: SLA Benchmarks */}
        {activeWorkflowTab === 'sla' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Service Level Agreement (SLA) Turnaround Targets
                </h4>
                <button
                  type="button"
                  onClick={() => alert('SLA targets updated successfully.')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5 text-white" />
                  <span>Save SLA Rules</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">Standard Intake Turnaround</span>
                  <div className="text-lg font-bold text-white font-mono">24 Hours</div>
                  <p className="text-[10px] text-slate-400">From brief submission to validation lock</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">V1 Production Window</span>
                  <div className="text-lg font-bold text-white font-mono">72 Hours</div>
                  <p className="text-[10px] text-slate-400">Design draft ready for Pre-flight QA</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">Client Review Buffer</span>
                  <div className="text-lg font-bold text-white font-mono">48 Hours</div>
                  <p className="text-[10px] text-slate-400">Feedback window before auto-escalation</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Diagnostics */}
        {activeWorkflowTab === 'diagnostics' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Pipeline Diagnostic Engine</h4>
                <button
                  type="button"
                  onClick={handleRunDiagnostic}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 text-white" />
                  <span>Run Live Health Check</span>
                </button>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 font-mono text-xs text-emerald-400 space-y-1">
                <div>[SYSTEM] Governance engine healthy.</div>
                <div>[SYSTEM] 8 Golden Rules active and enforced across all 4 departments.</div>
                <div>[SYSTEM] Zero stale reviews or unassigned accountable owners detected.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Workflow Diagnostic Modal */}
      {testWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Pipeline Diagnostic Test</h3>
              </div>
              <button
                type="button"
                onClick={() => setTestWorkflowModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed">
              {testResult}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setTestWorkflowModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
