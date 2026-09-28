import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DepartmentId,
  DeliverableVersion,
  FeedbackItem,
  Project,
  ProjectFile,
  QACheckItem,
  WorkflowStage,
} from '../../types';
import { STAGE_CONFIG, STAGE_ORDER, StageBadge, StatusBadge } from '../common/StatusBadge';
import { StageTimeline } from '../common/StageTimeline';
import { calculateBriefCompleteness, getRequestTypeConfig } from '../../data/briefSchemas';
import { generateQAChecklist } from '../../data/qaSchemas';
import { PREDEFINED_TRAVEL_DOCUMENTS } from '../../data/travelCatalogue';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileCode,
  FilePlus,
  FileSpreadsheet,
  FileText,
  Flame,
  HelpCircle,
  History,
  Layers,
  Lock,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Unlock,
  Upload,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';

interface ProjectDetailWorkspaceProps {
  projectId: string;
  onClose: () => void;
  initialTab?: string;
}

export const ProjectDetailWorkspace: React.FC<ProjectDetailWorkspaceProps> = ({
  projectId,
  onClose,
  initialTab = 'overview',
}) => {
  const {
    projects,
    users,
    clients,
    tasks,
    files,
    versions,
    qaSubmissions,
    approvals,
    feedbackItems,
    chatMessages,
    activityLogs,
    currentUser,
    adminConfig,
    activeProjectTab,
    setActiveProjectTab,
    updateProject,
    updateBriefData,
    lockBrief,
    unlockBrief,
    changeProjectStage,
    createTask,
    updateTaskStatus,
    uploadFile,
    uploadDeliverableVersion,
    submitQA,
    submitClientApproval,
    addFeedbackItem,
    updateFeedbackStatus,
    sendChatMessage,
  } = useApp();

  const [currentTab, setCurrentTab] = useState<string>(initialTab || 'overview');
  const project = projects.find((p) => p.id === projectId);

  // Local states for forms
  const [briefEditData, setBriefEditData] = useState<Record<string, any>>(project?.briefData || {});

  useEffect(() => {
    if (project?.briefData) {
      setBriefEditData(project.briefData);
    } else {
      setBriefEditData({});
    }
  }, [project?.id, project?.briefData]);
  const [unlockReason, setUnlockReason] = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStage, setOverrideStage] = useState<WorkflowStage>('PRODUCTION');
  const [overrideReason, setOverrideReason] = useState('');

  // Deliverable Upload Modal
  const [showUploadVersionModal, setShowUploadVersionModal] = useState(false);
  const [newVersionNum, setNewVersionNum] = useState('V1.0');
  const [newVersionTitle, setNewVersionTitle] = useState('Initial Creative Deliverable');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [newVersionUrl, setNewVersionUrl] = useState('https://files.uicms.com/proofs/sample-deliverable.pdf');

  // QA form state
  const [qaItems, setQaItems] = useState<QACheckItem[]>(() => {
    if (!project) return [];
    return generateQAChecklist(
      project.id,
      project.version || 'V1.0',
      project.departmentId,
      project.requestTypeId
    );
  });
  const [qaOverallResult, setQaOverallResult] = useState<'PASS' | 'PASS_WITH_NOTES' | 'FAIL'>('PASS');
  const [qaOverallNotes, setQaOverallNotes] = useState('');

  // Client approval form
  const [clientSignName, setClientSignName] = useState(currentUser.name);
  const [clientSignRole, setClientSignRole] = useState(currentUser.roleTitle);
  const [clientDecision, setClientDecision] = useState<'APPROVED' | 'APPROVED_WITH_NOTES' | 'REJECTED'>('APPROVED');
  const [clientComments, setClientComments] = useState('All creative specifications and copy confirmed. Ready for final print & release.');

  // Task creation state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState(currentUser.id);
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Feedback form state
  const [newFeedbackText, setNewFeedbackText] = useState('');
  const [newFeedbackType, setNewFeedbackType] = useState<FeedbackItem['type']>('action_required');
  const [newFeedbackAssignee, setNewFeedbackAssignee] = useState(project?.projectOwnerId || currentUser.id);

  // Chat input
  const [chatInput, setChatInput] = useState('');

  if (!project) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-slate-300">Project not found.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const client = clients.find((c) => c.id === project.clientId);
  const accountableUser = users.find((u) => u.id === project.accountableUserId);
  const projectOwner = users.find((u) => u.id === project.projectOwnerId);
  const qaOwner = users.find((u) => u.id === project.qaOwnerId);
  const approver = users.find((u) => u.id === project.approverId);
  const reqConfig = getRequestTypeConfig(project.requestTypeId);

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectFiles = files.filter((f) => f.projectId === project.id);
  const projectVersions = versions.filter((v) => v.projectId === project.id);
  const projectQAs = qaSubmissions.filter((q) => q.projectId === project.id);
  const projectApprovals = approvals.filter((a) => a.projectId === project.id);
  const projectFeedbacks = feedbackItems.filter((f) => f.projectId === project.id);
  const projectChat = chatMessages.filter((m) => m.projectId === project.id);
  const projectLogs = activityLogs.filter((l) => l.projectId === project.id);

  const briefCompleteness = calculateBriefCompleteness(project.requestTypeId, briefEditData);

  // Handlers
  const handleSaveBrief = () => {
    updateBriefData(project.id, briefEditData);
    alert('Master brief data updated successfully.');
  };

  const handleLockBrief = () => {
    const res = lockBrief(project.id);
    if (!res.success) {
      alert(res.error || 'Failed to lock brief.');
    }
  };

  const handleUnlockBrief = () => {
    if (!unlockReason.trim()) {
      alert('Please provide a valid justification reason for unlocking the brief.');
      return;
    }
    unlockBrief(project.id, unlockReason);
    setShowUnlockModal(false);
    setUnlockReason('');
  };

  const handleOverrideStage = () => {
    if (!overrideReason.trim()) {
      alert('Please provide a valid management override reason.');
      return;
    }
    const res = changeProjectStage(project.id, overrideStage, overrideReason, true);
    if (!res.success) {
      alert(res.error || 'Failed to override stage.');
    } else {
      setShowOverrideModal(false);
      setOverrideReason('');
    }
  };

  const handleUploadVersion = () => {
    if (!newVersionTitle.trim()) return;
    uploadDeliverableVersion({
      projectId: project.id,
      versionNumber: newVersionNum,
      title: newVersionTitle,
      description: newVersionNotes || newVersionTitle,
      fileUrl: newVersionUrl,
      notes: newVersionNotes,
      uploadedBy: currentUser.id,
    });
    setShowUploadVersionModal(false);
    setNewVersionNotes('');
  };

  const handleSubmitQAForm = () => {
    const passedCount = qaItems.filter((i) => i.status === 'PASS').length;
    const failedCount = qaItems.filter((i) => i.status === 'FAIL').length;
    const naCount = qaItems.filter((i) => i.status === 'NA').length;

    submitQA({
      projectId: project.id,
      versionId: projectVersions[0]?.id || `ver-${project.id}`,
      versionNumber: project.version,
      performedBy: currentUser.id,
      items: qaItems,
      result: qaOverallResult,
      overallNotes: qaOverallNotes || `QA inspection performed with ${passedCount} passed, ${failedCount} failed items.`,
      passedCount,
      failedCount,
      naCount,
    });

    alert(`Internal QA submission recorded: Result = ${qaOverallResult}`);
  };

  const handleSubmitApprovalForm = () => {
    submitClientApproval({
      projectId: project.id,
      versionId: projectVersions[0]?.id || `ver-${project.id}`,
      versionNumber: project.version,
      clientId: project.clientId,
      clientName: clientSignName,
      clientPosition: clientSignRole,
      decision: clientDecision,
      comments: clientComments,
      changesRequested: clientDecision === 'REJECTED' ? [clientComments] : [],
    });
    alert(`Client approval sign-off recorded: Decision = ${clientDecision}`);
  };

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;
    createTask({
      projectId: project.id,
      name: newTaskName.trim(),
      description: `Task for project ${project.projectName}`,
      ownerId: newTaskOwner,
      departmentId: project.departmentId,
      priority: project.priority,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: newTaskDueDate,
      status: 'not_started',
    });
    setNewTaskName('');
  };

  const handleAddFeedback = () => {
    if (!newFeedbackText.trim()) return;
    addFeedbackItem({
      projectId: project.id,
      version: project.version,
      submittedBy: currentUser.id,
      feedbackText: newFeedbackText.trim(),
      assignedTo: newFeedbackAssignee,
      priority: 'high',
      status: 'open',
      type: newFeedbackType,
    });
    setNewFeedbackText('');
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const mentionedUserIds: string[] = [];
    users.forEach((u) => {
      if (chatInput.includes(`@${u.name}`)) {
        mentionedUserIds.push(u.id);
      }
    });
    sendChatMessage({
      projectId: project.id,
      senderId: currentUser.id,
      message: chatInput.trim(),
      mentions: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
    });
    setChatInput('');
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Timeline' },
    { id: 'brief', label: 'Master Brief' },
    { id: 'versions', label: `Deliverables & Files (${projectVersions.length + projectFiles.length})` },
    { id: 'qa', label: `Internal QA (${projectQAs.length})` },
    { id: 'approval', label: 'Client Approval & Sign-Off' },
    { id: 'tasks', label: `Tasks (${projectTasks.length})` },
    { id: 'feedback', label: `Feedback (${projectFeedbacks.length})` },
    { id: 'chat', label: `Chat & Audit Trail (${projectLogs.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Workspace Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                {project.id}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-300">
                {project.version}
              </span>
              <StageBadge stage={project.stage} size="sm" />
              <StatusBadge status={project.status} size="sm" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {project.projectName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Client: <strong className="text-slate-200">{client?.name.split('(')[0]}</strong></span>
              <span>•</span>
              <span className="capitalize">{project.departmentId.replace('_', ' ')}</span>
              <span>•</span>
              <span>Target Release: <strong className="text-indigo-300">{project.releaseDate}</strong></span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Override Stage Button (for managers/admins) */}
            {(currentUser.role === 'super_admin' || currentUser.role === 'department_manager') && (
              <button
                type="button"
                onClick={() => setShowOverrideModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5"
                title="Management Override Stage"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Stage Override</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 11-Stage Progress Bar Header Component */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex-shrink-0">
          <StageTimeline currentStage={project.stage} interactive={false} />
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 bg-slate-900/80 border-b border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                currentTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Workspace Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: Overview & Timeline */}
          {currentTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Next Action Priority Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                    Current Milestone & Next Action
                  </span>
                  <span className="text-xs text-indigo-300 font-medium">
                    Due: {project.nextAction.dueDate}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {project.nextAction.task}
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Accountable Owner: <strong className="text-white">{project.nextAction.ownerName}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      if (project.stage === 'BRIEF_VALIDATION') setCurrentTab('brief');
                      else if (project.stage === 'PRODUCTION') setCurrentTab('versions');
                      else if (project.stage === 'INTERNAL_QA') setCurrentTab('qa');
                      else if (project.stage === 'CLIENT_REVIEW' || project.stage === 'CLIENT_APPROVAL') setCurrentTab('approval');
                      else setCurrentTab('tasks');
                    }}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Go to workspace action →
                  </button>
                </div>
              </div>

              {/* Accountability & Team Assignment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Accountable Lead
                  </span>
                  <div className="font-bold text-white truncate">{accountableUser?.name || 'Unassigned'}</div>
                  <div className="text-slate-400 text-[11px] truncate">{accountableUser?.roleTitle.split('(')[0]}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Lead Designer / Producer
                  </span>
                  <div className="font-bold text-white truncate">{projectOwner?.name || 'Unassigned'}</div>
                  <div className="text-slate-400 text-[11px] truncate">{projectOwner?.roleTitle.split('(')[0]}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    QA Inspector Lead
                  </span>
                  <div className="font-bold text-white truncate">{qaOwner?.name || 'Unassigned'}</div>
                  <div className="text-slate-400 text-[11px] truncate">{qaOwner?.roleTitle.split('(')[0]}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Client Approver
                  </span>
                  <div className="font-bold text-white truncate">{approver?.name || 'Unassigned'}</div>
                  <div className="text-slate-400 text-[11px] truncate">{client?.name.split('(')[0]}</div>
                </div>
              </div>

              {/* Milestones Schedule Table */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Workflow Milestone Schedule & Deadlines
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Brief Validation</span>
                    <span className="font-bold text-white">{project.briefDueDate}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Production V1</span>
                    <span className="font-bold text-white">{project.productionDueDate}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Internal QA</span>
                    <span className="font-bold text-white">{project.internalQaDueDate}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Client Review</span>
                    <span className="font-bold text-white">{project.clientReviewDueDate}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Client Approval</span>
                    <span className="font-bold text-white">{project.clientApprovalDueDate}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-indigo-400 block font-semibold">Final Release</span>
                    <span className="font-bold text-indigo-300">{project.releaseDate}</span>
                  </div>
                </div>
              </div>

              {/* Dependencies & Blockers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Dependencies & External Suppliers
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {project.dependencies || 'No external suppliers noted.'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Identified Risks & Mitigation
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {project.risks || 'No high severity risks flagged.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Master Brief */}
          {currentTab === 'brief' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Brief Lock Control Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      Master Brief Specification: {reqConfig?.name || project.requestTypeId}
                    </h3>
                    {project.isBriefLocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <Lock className="w-3 h-3" /> Brief Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Unlock className="w-3 h-3" /> In Validation
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {project.isBriefLocked
                      ? `Locked by ${project.briefLockedBy} on ${new Date(project.briefLockedAt || '').toLocaleDateString()}. Production is authorized.`
                      : 'Rule 1: No complete brief = no production start. Complete all fields and lock brief to advance to Production.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!project.isBriefLocked ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveBrief}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={handleLockBrief}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Lock Brief & Start Production</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowUnlockModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock Brief (Audit Logged)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Brief Fields Editor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                {reqConfig?.fields.map((field) => {
                  const isTextarea = field.type === 'textarea';
                  const isSelect = field.type === 'select';
                  const rawVal = briefEditData ? briefEditData[field.id] : undefined;
                  const val = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';

                  return (
                    <div
                      key={field.id}
                      className={`space-y-1.5 ${isTextarea ? 'md:col-span-2' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">
                          {field.label} {field.required && <span className="text-rose-400">*</span>}
                        </label>
                        {val && <span className="text-[10px] text-emerald-400 font-semibold">✓ Filled</span>}
                      </div>

                      {isTextarea ? (
                        <textarea
                          rows={3}
                          disabled={project.isBriefLocked}
                          value={val}
                          onChange={(e) =>
                            setBriefEditData((prev) => ({ ...prev, [field.id]: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed"
                        />
                      ) : isSelect ? (
                        <select
                          disabled={project.isBriefLocked}
                          value={val}
                          onChange={(e) =>
                            setBriefEditData((prev) => ({ ...prev, [field.id]: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="">-- Select option --</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                          disabled={project.isBriefLocked}
                          value={val}
                          onChange={(e) =>
                            setBriefEditData((prev) => ({ ...prev, [field.id]: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Deliverables & Versions */}
          {currentTab === 'versions' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Deliverable Proofs & Version Control
                  </h3>
                  <p className="text-xs text-slate-400">
                    Rule 7: Changes after approval create a new version. Uploading moves stage to Internal QA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadVersionModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Deliverable Version</span>
                </button>
              </div>

              {/* Versions List */}
              <div className="space-y-3">
                {projectVersions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400">
                      No deliverable versions uploaded yet. Click "Upload Deliverable Version" when V1.0 is ready.
                    </p>
                  </div>
                ) : (
                  projectVersions.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {v.versionNumber}
                          </span>
                          <h4 className="text-sm font-bold text-white">{v.title}</h4>
                          {v.isLocked && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Approved & Locked
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          Uploaded by {v.uploadedByName} on {new Date(v.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {v.notes && (
                        <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                          {v.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">QA Status:</span>
                          <span className="font-semibold text-white uppercase">{v.qaResult || 'Pending QA'}</span>
                        </div>
                        <a
                          href={v.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof / Artwork</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Project Files Repository */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Supporting Files & CI Assets ({projectFiles.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {projectFiles.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate">{f.filename}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{f.category} • {f.size}</span>
                        </div>
                      </div>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Internal QA Inspection */}
          {currentTab === 'qa' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Internal Pre-flight QA Inspection Checklist
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rule 5: QA inspection must be completed before client review. Verified for version {project.version}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Inspector:</span>
                  <strong className="text-xs text-white">{qaOwner?.name || currentUser.name}</strong>
                </div>
              </div>

              {/* Dynamic QA Checklist Table */}
              <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-400">
                  <span>QA Inspection Checkpoint</span>
                  <span className="text-right">Inspection Result</span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {qaItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">{idx + 1}.</span>
                          <span className="font-bold text-white">{item.label}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setQaItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, status: 'PASS' } : i))
                            );
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                            item.status === 'PASS'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          PASS
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQaItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, status: 'FAIL' } : i))
                            );
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                            item.status === 'FAIL'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          FAIL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQaItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, status: 'NA' } : i))
                            );
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                            item.status === 'NA'
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit QA Decision Form */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Overall QA Outcome Decision
                    </label>
                    <select
                      value={qaOverallResult}
                      onChange={(e) => setQaOverallResult(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                    >
                      <option value="PASS">PASS (Advance to Client Review)</option>
                      <option value="PASS_WITH_NOTES">PASS WITH NOTES (Advance to Client Review)</option>
                      <option value="FAIL">FAIL (Return to REVISION)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      QA Inspector Notes & Corrective Requirements
                    </label>
                    <input
                      type="text"
                      value={qaOverallNotes}
                      onChange={(e) => setQaOverallNotes(e.target.value)}
                      placeholder="e.g. All 14 checkpoints verified. 300DPI, CMYK, fonts converted to outlines."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitQAForm}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Record QA Submission</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Client Approval & Sign-Off */}
          {currentTab === 'approval' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Formal Client Approval & Digital Sign-Off
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                    Version: {project.version}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Rule 6 & 7: Final release cannot happen without documented approval. Approval freezes the deliverable version and initiates Final QA.
                </p>
              </div>

              {/* Existing Approvals History */}
              {projectApprovals.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Approval Audit Trail ({projectApprovals.length})
                  </h4>
                  {projectApprovals.map((appr) => (
                    <div
                      key={appr.id}
                      className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">
                            {appr.clientName} ({appr.clientPosition})
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            {appr.decision}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(appr.approvedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        "{appr.comments}"
                      </p>
                      <div className="text-[10px] font-mono text-slate-400">
                        Digital Signature Hash: <span className="text-indigo-300">{appr.signatureHash}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Digital Sign-off Form */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Execute Digital Sign-Off
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Signee Full Name
                    </label>
                    <input
                      type="text"
                      value={clientSignName}
                      onChange={(e) => setClientSignName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Title / Authority Role
                    </label>
                    <input
                      type="text"
                      value={clientSignRole}
                      onChange={(e) => setClientSignRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Approval Decision
                  </label>
                  <select
                    value={clientDecision}
                    onChange={(e) => setClientDecision(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="APPROVED">APPROVED (Lock Version & Initiate Final QA)</option>
                    <option value="APPROVED_WITH_NOTES">APPROVED WITH MINOR NOTES</option>
                    <option value="REJECTED">REJECTED (Requires Revision Cycle)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Written Sign-Off Notes / Declaration
                  </label>
                  <textarea
                    rows={3}
                    value={clientComments}
                    onChange={(e) => setClientComments(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitApprovalForm}
                    className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Submit Digital Sign-Off</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Tasks */}
          {currentTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Project Work Breakdown & Tasks</h3>
                  <p className="text-xs text-slate-400">
                    Rule 4: Every task must have an owner and due date.
                  </p>
                </div>
              </div>

              {/* Task Creator */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="New task description..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <select
                    value={newTaskOwner}
                    onChange={(e) => setNewTaskOwner(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name.split(' ')[0]} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTask}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {projectTasks.map((t) => {
                  const isDone = t.status === 'complete';
                  const taskOwner = users.find((u) => u.id === t.ownerId);
                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isDone
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => updateTaskStatus(t.id, isDone ? 'in_progress' : 'complete')}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isDone ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div className="min-w-0">
                          <span className={`font-semibold block truncate ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                            {t.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Assigned to: {taskOwner?.name} • Due: {t.dueDate}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {t.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: Feedback */}
          {currentTab === 'feedback' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Feedback & Change Requests</h3>
                  <p className="text-xs text-slate-400">
                    Track client and internal change requests with direct assignee accountability
                  </p>
                </div>
              </div>

              {/* Add Feedback */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <textarea
                  rows={2}
                  value={newFeedbackText}
                  onChange={(e) => setNewFeedbackText(e.target.value)}
                  placeholder="Enter feedback notes, copy corrections, or design adjustments..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <select
                      value={newFeedbackType}
                      onChange={(e) => setNewFeedbackType(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                    >
                      <option value="action_required">Action Required</option>
                      <option value="client_change">Client Change Request</option>
                      <option value="internal_note">Internal Note</option>
                    </select>
                    <select
                      value={newFeedbackAssignee}
                      onChange={(e) => setNewFeedbackAssignee(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          Assign to: {u.name.split(' ')[0]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeedback}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    Post Feedback
                  </button>
                </div>
              </div>

              {/* Feedback list */}
              <div className="space-y-2.5">
                {projectFeedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{f.submittedByName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({f.version})</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold">
                          {f.type}
                        </span>
                      </div>
                      <select
                        value={f.status}
                        onChange={(e) => updateFeedbackStatus(f.id, e.target.value as any)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved ✓</option>
                      </select>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{f.feedbackText}</p>
                    <div className="text-[10px] text-slate-400">
                      Assigned to: <strong className="text-slate-200">{f.assignedToName}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: Chat & Audit Trail */}
          {currentTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
              {/* Left: Project Chat */}
              <div className="space-y-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col h-96">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Project Collaboration Chat
                </h4>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {projectChat.length === 0 ? (
                    <p className="text-slate-400 text-center py-10">No messages yet. Send a note to the team!</p>
                  ) : (
                    projectChat.map((m) => (
                      <div key={m.id} className="flex items-start gap-2.5">
                        <img
                          src={m.senderAvatar}
                          alt={m.senderName}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-700"
                        />
                        <div className="min-w-0 flex-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-white text-[11px]">{m.senderName}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed">{m.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Type message or @mention teammate..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendChat}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right: Full Audit Trail (Section 31 & 32) */}
              <div className="space-y-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col h-96">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Immutable Audit Trail
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    WHO • WHAT • WHEN
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                  {projectLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-indigo-300">{log.action}</span>
                        <span className="text-slate-400">
                          {new Date(log.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{log.description}</p>
                      <div className="text-[10px] text-slate-400">
                        Actor: <strong className="text-slate-200">{log.userName}</strong>
                        {log.versionRef && ` • Version: ${log.versionRef}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unlock Brief Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Unlock Master Brief</h3>
            </div>
            <p className="text-xs text-slate-300">
              Unlocking the brief will revert the project stage to <strong>Brief Validation</strong> and log a permanent entry in the immutable audit trail.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Justification Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="e.g. Client requested alteration to headline and added new vector sponsor logo..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlockBrief}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
              >
                Confirm Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Stage Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Management Stage Override</h3>
            </div>
            <p className="text-xs text-slate-300">
              Authorized managers can force-advance or revert the project stage. All actions are timestamped and attributed in the audit trail.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Stage
              </label>
              <select
                value={overrideStage}
                onChange={(e) => setOverrideStage(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {STAGE_ORDER.map((stg) => (
                  <option key={stg} value={stg}>
                    {STAGE_CONFIG[stg].step}. {STAGE_CONFIG[stg].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Override Justification Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Urgent executive expedite approved by Managing Director..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverrideStage}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Apply Stage Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Deliverable Version Modal */}
      {showUploadVersionModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Upload New Deliverable Version</h3>
              <button
                type="button"
                onClick={() => setShowUploadVersionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Version Identifier
                </label>
                <input
                  type="text"
                  value={newVersionNum}
                  onChange={(e) => setNewVersionNum(e.target.value)}
                  placeholder="e.g. V1.0, V1.1, V2.0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Version Title / Headline
                </label>
                <input
                  type="text"
                  value={newVersionTitle}
                  onChange={(e) => setNewVersionTitle(e.target.value)}
                  placeholder="e.g. Master High-Resolution Print Separations"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Version Release Notes
                </label>
                <textarea
                  rows={2}
                  value={newVersionNotes}
                  onChange={(e) => setNewVersionNotes(e.target.value)}
                  placeholder="Describe revisions made, Pantone ink codes, or asset adjustments..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadVersionModal(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadVersion}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Upload & Move to Internal QA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
