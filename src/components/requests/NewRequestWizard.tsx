import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DepartmentId, PriorityLevel, RequestTypeConfig } from '../../types';
import {
  DEPARTMENTS_DATA,
  calculateBriefCompleteness,
  getRequestTypeConfig,
  getRequestTypesForDepartment,
} from '../../data/briefSchemas';
import { PREDEFINED_TRAVEL_DOCUMENTS } from '../../data/travelCatalogue';
import { DEFAULT_CLIENTS } from '../../data/defaultClients';
import { NewClientModal } from '../clients/NewClientModal';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  FileCheck2,
  FilePlus,
  FileText,
  FolderOpen,
  HardDrive,
  Layers,
  Megaphone,
  MonitorCheck,
  PlaneTakeoff,
  Plus,
  ShieldAlert,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { formatBytes } from '../../utils/localFileStore';

interface NewRequestWizardProps {
  onClose?: () => void;
  onProjectCreated?: (projectId: string) => void;
}

export const NewRequestWizard: React.FC<NewRequestWizardProps> = (props) => {
  const {
    clients,
    users,
    currentUser,
    createProject,
    uploadFile,
    isNewRequestOpen,
    setIsNewRequestOpen,
    setSelectedProjectId,
  } = useApp();

  const handleClose = () => {
    if (props.onClose) {
      props.onClose();
    } else {
      setIsNewRequestOpen(false);
    }
  };

  const handleProjectCreated = (projectId: string) => {
    if (props.onProjectCreated) {
      props.onProjectCreated(projectId);
    } else {
      setIsNewRequestOpen(false);
      setSelectedProjectId(projectId);
    }
  };

  // Wizard Steps (1 to 7)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState<boolean>(false);

  // Step 1: Department
  const defaultDept = (currentUser.departmentId && currentUser.departmentId !== 'development'
    ? currentUser.departmentId
    : DEPARTMENTS_DATA.find((d) => d.id !== 'development')?.id || 'marketing') as DepartmentId;

  const [selectedDept, setSelectedDept] = useState<DepartmentId>(defaultDept);
  // Step 2: Request Type
  const [selectedRequestTypeId, setSelectedRequestTypeId] = useState<string>(
    getRequestTypesForDepartment(defaultDept)[0]?.id || ''
  );
  // Client selection (guarantee non-empty list with enterprise defaults)
  const activeClients = Array.isArray(clients) && clients.length > 0 ? clients : DEFAULT_CLIENTS;
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClients[0]?.id || 'cl-discovery');

  React.useEffect(() => {
    if (!selectedClientId || !activeClients.some((c) => c.id === selectedClientId)) {
      setSelectedClientId(activeClients[0]?.id || 'cl-discovery');
    }
  }, [activeClients, selectedClientId]);

  const [projectName, setProjectName] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');

  // Step 3: Brief Data Form
  const [briefData, setBriefData] = useState<Record<string, any>>({});

  // Step 4: Files / Assets
  const [tempUploadedFiles, setTempUploadedFiles] = useState<
    Array<{ name: string; size: string; type: string; category: any; fileUrl: string }>
  >([]);
  const [newFileCategory, setNewFileCategory] = useState<string>('brief');

  // Step 5: Deadlines
  const [briefDueDate, setBriefDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [productionDueDate, setProductionDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0]
  );
  const [internalQaDueDate, setInternalQaDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0]
  );
  const [clientReviewDueDate, setClientReviewDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0]
  );
  const [clientApprovalDueDate, setClientApprovalDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0]
  );
  const [releaseDate, setReleaseDate] = useState<string>(
    new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0]
  );

  // Step 6: Team Assignment
  const defaultQaUser = users.find((u) => u.role === 'qa_user' || u.role === 'super_admin' || u.role === 'department_manager') || users[0];
  const defaultClientUser = users.find((u) => u.role === 'client') || users.find((u) => u.role === 'account_manager') || users[0];
  const defaultDesignerUser = users.find((u) => u.role === 'designer') || currentUser;

  const [accountableUserId, setAccountableUserId] = useState<string>(currentUser.id || users[0]?.id || '');
  const [projectOwnerId, setProjectOwnerId] = useState<string>(defaultDesignerUser?.id || currentUser.id);
  const [qaOwnerId, setQaOwnerId] = useState<string>(defaultQaUser?.id || '');
  const [approverId, setApproverId] = useState<string>(defaultClientUser?.id || '');
  const [dependencies, setDependencies] = useState<string>('');
  const [risks, setRisks] = useState<string>('');

  // Keep dropdown state populated when users/clients finish loading
  React.useEffect(() => {
    if ((!selectedClientId || !clients.some((c) => c.id === selectedClientId)) && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
    if (!qaOwnerId && users.length > 0) {
      const qaCandidate = users.find((u) => u.role === 'qa_user' || u.role === 'super_admin' || u.role === 'department_manager') || users[0];
      if (qaCandidate) setQaOwnerId(qaCandidate.id);
    }
    if (!approverId && users.length > 0) {
      const approverCandidate = users.find((u) => u.role === 'client') || users.find((u) => u.role === 'account_manager') || users[0];
      if (approverCandidate) setApproverId(approverCandidate.id);
    }
    if (!projectOwnerId && users.length > 0) {
      const designerCandidate = users.find((u) => u.role === 'designer') || currentUser;
      if (designerCandidate) setProjectOwnerId(designerCandidate.id);
    }
    if (!accountableUserId && users.length > 0) {
      setAccountableUserId(currentUser.id || users[0].id);
    }
  }, [users, clients, currentUser, selectedClientId, qaOwnerId, approverId, projectOwnerId, accountableUserId]);

  const reqTypeConfig = getRequestTypeConfig(selectedRequestTypeId);
  const briefCompleteness = calculateBriefCompleteness(selectedRequestTypeId, briefData);

  const handleFieldChange = (fieldId: string, val: any) => {
    setWizardError(null);
    setBriefData((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleDeptSelect = (deptId: DepartmentId) => {
    setWizardError(null);
    setSelectedDept(deptId);
    const availableTypes = getRequestTypesForDepartment(deptId);
    if (availableTypes.length > 0) {
      setSelectedRequestTypeId(availableTypes[0].id);
      setBriefData({});
    }
  };

  const wizardFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLocalFileSelect = async (file: File) => {
    setWizardError(null);
    try {
      let finalUrl = '';
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', file.type.startsWith('image/') ? 'image' : 'file');
        const response = await fetch('/php-backend/api/upload.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (response.ok && result.status === 'success' && result.url) {
          finalUrl = result.url;
        }
      } catch {}

      if (!finalUrl) {
        // Fallback convert to local base64 data URL
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Could not read file'));
          reader.readAsDataURL(file);
        });
      }

      setTempUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: formatBytes(file.size),
          type: file.type || 'application/octet-stream',
          category: newFileCategory,
          fileUrl: finalUrl,
        },
      ]);
    } catch (err) {
      console.error('Failed to attach file:', err);
      setWizardError(err instanceof Error ? err.message : 'The selected file could not be attached.');
    }
  };

  const handleNextStep = () => {
    setWizardError(null);
    if (currentStep === 1) {
      if (!selectedDept) {
        setWizardError('Please select a department.');
        return;
      }
      const activeClient = selectedClientId || activeClients[0]?.id || clients[0]?.id || 'cl-discovery';
      if (!selectedClientId && activeClient) {
        setSelectedClientId(activeClient);
      }
    } else if (currentStep === 2) {
      if (!selectedRequestTypeId) {
        setWizardError('Please select a request type.');
        return;
      }
      if (!projectName.trim()) {
        setWizardError('Please enter a project working name before proceeding.');
        return;
      }
    } else if (currentStep === 3) {
      if (briefCompleteness.missingMandatoryFields.length > 0) {
        setWizardError(`Master brief incomplete: missing ${briefCompleteness.missingMandatoryFields.join(', ')}.`);
        return;
      }
    } else if (currentStep === 6) {
      if (!accountableUserId || !projectOwnerId || !qaOwnerId || !approverId) {
        setWizardError('Please ensure all team roles (Accountable, Project Owner, QA Inspector, and Approver) are assigned.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(7, prev + 1));
  };

  const handleSubmitRequest = () => {
    setWizardError(null);
    if (!projectName.trim()) {
      setWizardError('Please enter a valid project name.');
      setCurrentStep(2);
      return;
    }
    if (!activeClients.some((client) => client.id === selectedClientId)) {
      setWizardError('Select an existing client before submitting this request.');
      setCurrentStep(1);
      return;
    }
    const finalQaOwner = qaOwnerId || defaultQaUser?.id || currentUser.id;
    const finalApprover = approverId || defaultClientUser?.id || currentUser.id;
    if (!selectedDept || !selectedRequestTypeId || !finalQaOwner || !finalApprover) {
      setWizardError('Select a department, request type, QA owner, and approver before submitting.');
      return;
    }

    if (briefCompleteness.missingMandatoryFields.length > 0) {
      setWizardError(
        `Cannot submit: Mandatory brief fields missing: ${briefCompleteness.missingMandatoryFields.join(', ')}`
      );
      setCurrentStep(3);
      return;
    }

    const created = createProject({
      projectName,
      campaignName: campaignName || projectName,
      clientId: selectedClientId,
      departmentId: selectedDept,
      requestTypeId: selectedRequestTypeId,
      priority,
      briefData,
      accountableUserId: accountableUserId || currentUser.id,
      projectOwnerId: projectOwnerId || currentUser.id,
      qaOwnerId: finalQaOwner,
      approverId: finalApprover,
      briefDueDate,
      productionDueDate,
      internalQaDueDate,
      clientReviewDueDate,
      clientApprovalDueDate,
      releaseDate,
      dependencies,
      risks,
    });

    // Upload files to created project
    for (const f of tempUploadedFiles) {
      uploadFile({
        projectId: created.id,
        filename: f.name,
        size: f.size,
        type: f.type,
        version: 'V1.0',
        uploadedBy: currentUser.id,
        category: f.category,
        url: f.fileUrl,
      });
    }

    handleProjectCreated(created.id);
  };

  const stepsMeta = [
    { num: 1, title: 'Department' },
    { num: 2, title: 'Request Type' },
    { num: 3, title: 'Master Brief' },
    { num: 4, title: 'Files & Assets' },
    { num: 5, title: 'Deadlines' },
    { num: 6, title: 'Accountability' },
    { num: 7, title: 'Review & Submit' },
  ];

  if (!isNewRequestOpen && !props.onClose) return null;

  return (
    <>
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onClientCreated={(newId) => setSelectedClientId(newId)}
      />
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                New Creative Request Intake Wizard
              </h2>
              <p className="text-xs text-slate-400">
                Step {currentStep} of 7 — {stepsMeta[currentStep - 1]?.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between min-w-[550px] text-xs">
            {stepsMeta.map((s) => {
              const isPast = s.num < currentStep;
              const isCurr = s.num === currentStep;
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurr
                        ? 'bg-indigo-600 text-white border-2 border-indigo-400 ring-2 ring-indigo-400/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold whitespace-nowrap ${
                      isCurr ? 'text-indigo-400 font-bold' : isPast ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </span>
                  {s.num < 7 && <span className="text-slate-700 mx-1">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {wizardError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{wizardError}</span>
              </div>
              <button
                type="button"
                onClick={() => setWizardError(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-rose-950/40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* STEP 1: Select Department */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-white">Select Department</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose the organizational department responsible for this intake request
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {DEPARTMENTS_DATA.filter((d) => d.id !== 'development').map((dept) => {
                  const isSelected = selectedDept === dept.id;
                  const iconsMap: Record<string, React.ElementType> = {
                    Megaphone,
                    PlaneTakeoff,
                    MonitorCheck,
                  };
                  const Icon = iconsMap[dept.iconName] || Layers;

                  return (
                    <div
                      key={dept.id}
                      onClick={() => handleDeptSelect(dept.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/40 text-white'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-slate-950 text-indigo-400 border border-indigo-500/40' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400 stroke-[3]" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{dept.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {dept.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Client selection */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Target Client / Account <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {activeClients.length} Available Accounts
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {activeClients.map((c) => {
                    const clientName = c?.name || 'Client';
                    const displayName = (clientName.includes('(') ? clientName.split('(')[0] : clientName).trim();
                    const displayCode = c?.code || (c?.id ? c.id.slice(0, 4).toUpperCase() : 'CL');
                    return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClientId(c.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                        selectedClientId === c.id
                          ? 'bg-indigo-600/10 border-indigo-500 text-white ring-2 ring-indigo-500/40 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {c.logoUrl ? (
                          <img
                            src={c.logoUrl}
                            alt={displayName}
                            className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {displayCode.slice(0, 2)}
                          </div>
                        )}
                        <div className="truncate">
                          <span className="text-xs font-bold block text-white truncate group-hover:text-indigo-300 transition-colors">
                            {displayName}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {displayCode}
                          </span>
                        </div>
                      </div>
                      {selectedClientId === c.id && (
                        <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                    );
                  })}

                  {/* Add New Client Card */}
                  <button
                    type="button"
                    onClick={() => setIsNewClientModalOpen(true)}
                    className="p-3 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400 hover:text-indigo-300 transition-all flex items-center justify-center gap-2 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-900 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-300 border border-slate-800 group-hover:border-indigo-500/40 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">+ Register New Client</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Select Request Type */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Selected Target Client / Account Banner */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs truncate">
                    <span className="text-slate-400">Target Client / Account: </span>
                    <strong className="text-white font-semibold">
                      {((activeClients.find((c) => c.id === selectedClientId)?.name || 'Discovery Group').split('(')[0]).trim()}
                    </strong>
                    <span className="text-indigo-400 font-mono text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                      {activeClients.find((c) => c.id === selectedClientId)?.code || 'DISC'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-[11px] text-slate-400 whitespace-nowrap">Switch Client:</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {activeClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.split('(')[0].trim()} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  Select Request Type for {DEPARTMENTS_DATA.find((d) => d.id === selectedDept)?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Loading dynamic master brief fields and automated QA checklist for this type
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {getRequestTypesForDepartment(selectedDept).map((reqType) => {
                  const isSelected = selectedRequestTypeId === reqType.id;
                  return (
                    <div
                      key={reqType.id}
                      onClick={() => setSelectedRequestTypeId(reqType.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/40 text-white'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{reqType.name}</h4>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400 stroke-[3]" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {reqType.description}
                      </p>
                      <div className="text-[10px] text-indigo-400 font-mono">
                        {reqType.fields.length} Brief Fields • {reqType.defaultQaItems.length} QA Checkpoints
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Project & Campaign Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Working Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Q4 Executive Leadership Series"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Campaign / Programme Title
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Vitality Longevity 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Dynamic Master Brief Form (Section 11, 12, 13, 14) */}
          {currentStep === 3 && reqTypeConfig && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Master Brief: {reqTypeConfig.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Rule 1: No complete brief = no production start. Complete all mandatory fields.
                  </p>
                </div>
                {/* Live Completeness Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-300">
                    Completeness: {briefCompleteness.score}%
                  </span>
                  <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        briefCompleteness.score >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${briefCompleteness.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Special Predefined Travel Catalog Selector for Incentive Travel Docs */}
              {selectedRequestTypeId === 'trv-printed-docs' && (
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-300">
                      Predefined Travel Document Catalogue (21 Standards)
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Click to quickly add standard document items:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {PREDEFINED_TRAVEL_DOCUMENTS.map((doc) => {
                      const selected = (briefData.selected_catalog_items || []).includes(doc.name);
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            const currentList: string[] = briefData.selected_catalog_items || [];
                            const updated = selected
                              ? currentList.filter((n) => n !== doc.name)
                              : [...currentList, doc.name];
                            handleFieldChange('selected_catalog_items', updated);
                          }}
                          className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-400 ring-1 ring-indigo-400/40 shadow-sm'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          {selected && '✓ '}
                          {doc.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Field Renderer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reqTypeConfig.fields.map((field) => {
                  const isTextarea = field.type === 'textarea';
                  const isSelect = field.type === 'select';
                  const isMultiselect = field.type === 'multiselect';
                  const rawVal = briefData ? briefData[field.id] : undefined;
                  const val = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';

                  return (
                    <div
                      key={field.id}
                      className={`space-y-1.5 ${isTextarea || isMultiselect ? 'md:col-span-2' : ''}`}
                    >
                      <label className="block text-xs font-semibold text-slate-300">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </label>

                      {isTextarea ? (
                        <textarea
                          rows={3}
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed"
                        />
                      ) : isSelect ? (
                        <select
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Files / Assets Upload (Section 29) */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-white">Upload Project Files & Brand Assets</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Attach logos, brand CI guidelines, content manuscripts, or reference artwork
                </p>
              </div>

              {/* Upload Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
                <input
                  ref={wizardFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleLocalFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <FolderOpen className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <span>Upload deliverable assets or proofs from your local device:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => wizardFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors flex-shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse Local Files</span>
                  </button>
                </div>

              </div>

              {/* Uploaded List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">
                  Attached Files ({tempUploadedFiles.length})
                </h4>
                {tempUploadedFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No files attached yet.</p>
                ) : (
                  tempUploadedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="font-semibold text-white truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">({f.size})</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                          {f.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTempUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="p-1 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Set Deadlines (Section 10 & 25) */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-white">Project Milestone Deadlines</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enforce sequential turnaround targets across the 11-stage delivery workflow
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Brief Validation Due
                  </label>
                  <input
                    type="date"
                    value={briefDueDate}
                    onChange={(e) => setBriefDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Production (V1) Due
                  </label>
                  <input
                    type="date"
                    value={productionDueDate}
                    onChange={(e) => setProductionDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Internal QA Sign-off Due
                  </label>
                  <input
                    type="date"
                    value={internalQaDueDate}
                    onChange={(e) => setInternalQaDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client Review Presentation
                  </label>
                  <input
                    type="date"
                    value={clientReviewDueDate}
                    onChange={(e) => setClientReviewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client Approval Sign-Off
                  </label>
                  <input
                    type="date"
                    value={clientApprovalDueDate}
                    onChange={(e) => setClientApprovalDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Final Release / Print / Go-Live
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Assign Accountable Person & Delivery Team (Section 16) */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Accountability & Delivery Assignment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rule 2 & 4: Every project and task must have an accountable owner and due date.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Accountable Person */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Accountable Person (Ultimate Request Responsibility)
                  </label>
                  <select
                    value={accountableUserId}
                    onChange={(e) => setAccountableUserId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {(u.roleTitle || u.role || 'Member').split('(')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Owner / Designer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Delivery Owner (Lead Designer / Producer)
                  </label>
                  <select
                    value={projectOwnerId}
                    onChange={(e) => setProjectOwnerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {(u.roleTitle || u.role || 'Member').split('(')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* QA Owner */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    QA Inspector Owner (Internal Pre-flight QA)
                  </label>
                  <select
                    value={qaOwnerId}
                    onChange={(e) => setQaOwnerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {(u.roleTitle || u.role || 'Member').split('(')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Approver */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client Approver / Authority Sign-Off
                  </label>
                  <select
                    value={approverId}
                    onChange={(e) => setApproverId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {(u.roleTitle || u.role || 'Member').split('(')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dependencies & Blockers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    External Dependencies / Suppliers
                  </label>
                  <input
                    type="text"
                    value={dependencies}
                    onChange={(e) => setDependencies(e.target.value)}
                    placeholder="e.g. Litho printer lead time, Emirates flight manifests..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Identified Project Risks / Contingencies
                  </label>
                  <input
                    type="text"
                    value={risks}
                    onChange={(e) => setRisks(e.target.value)}
                    placeholder="e.g. Strict customs clearance dates in Dubai..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review & Submit (Section 39 Brief Completeness Check) */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                      Pre-Submission Validation
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {projectName || 'Untitled Creative Request'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-lg font-bold ${
                        briefCompleteness.isComplete ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      Brief Completeness: {briefCompleteness.score}%
                    </span>
                  </div>
                </div>

                {/* Completeness Section Checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-xs">
                  {Object.entries(briefCompleteness.breakdown).map(([secKey, secVal]) => (
                    <div
                      key={secKey}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-center"
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                        {secKey}
                      </span>
                      <span
                        className={`text-xs font-bold mt-1 block ${
                          secVal.score >= 80 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {secVal.score}% {secVal.score >= 80 ? '✓' : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Missing Mandatory Fields Warning */}
                {briefCompleteness.missingMandatoryFields.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Submission Blocked — Missing Mandatory Brief Data:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                      {briefCompleteness.missingMandatoryFields.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Client & Department
                  </span>
                  <div className="font-bold text-white">
                    {(activeClients.find((c) => c.id === selectedClientId)?.name || clients.find((c) => c.id === selectedClientId)?.name || 'Discovery Group').split('(')[0].trim()}
                  </div>
                  <div className="text-slate-400">
                    {DEPARTMENTS_DATA.find((d) => d.id === selectedDept)?.name}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Assigned Accountable
                  </span>
                  <div className="font-bold text-white">
                    {users.find((u) => u.id === accountableUserId)?.name}
                  </div>
                  <div className="text-slate-400">
                    Owner: {users.find((u) => u.id === projectOwnerId)?.name}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Target Release Date
                  </span>
                  <div className="font-bold text-indigo-300">{releaseDate}</div>
                  <div className="text-slate-400">
                    QA Due: {internalQaDueDate}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitRequest}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Creative Request</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
