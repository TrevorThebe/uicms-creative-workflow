import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ActivityLog,
  AdminConfig,
  ActiveNavSection,
  ApiSyncResult,
  ChatMessage,
  ClientApprovalRecord,
  ClientRecord,
  DatabaseBackupPayload,
  DeliverableVersion,
  DepartmentId,
  FeedbackItem,
  Notification,
  Project,
  ProjectFile,
  ProjectStatus,
  QASubmission,
  Task,
  ThemeMode,
  User,
  UserRole,
  WorkflowStage,
} from '../types';
import {
  INITIAL_ACTIVITY_LOGS,
  INITIAL_ADMIN_CONFIG,
  INITIAL_APPROVALS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_CLIENTS,
  INITIAL_FILES,
  INITIAL_FEEDBACK,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROJECTS,
  INITIAL_QA_SUBMISSIONS,
  INITIAL_TASKS,
  INITIAL_USERS,
  INITIAL_VERSIONS,
} from '../data/initialData';
import { calculateBriefCompleteness } from '../data/briefSchemas';

interface AppContextType {
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  files: ProjectFile[];
  versions: DeliverableVersion[];
  qaSubmissions: QASubmission[];
  approvals: ClientApprovalRecord[];
  feedbackItems: FeedbackItem[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
  activityLogs: ActivityLog[];
  clients: ClientRecord[];
  adminConfig: AdminConfig;
  selectedProjectId: string | null;
  activeProjectTab: string;
  isSearchOpen: boolean;
  activeNavSection: ActiveNavSection;
  isNewRequestOpen: boolean;
  isSidebarCollapsed: boolean;
  themeMode: ThemeMode;

  // Actions
  setCurrentUser: (user: User) => void;
  setSelectedProjectId: (id: string | null) => void;
  setActiveProjectTab: (tab: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setActiveNavSection: (section: ActiveNavSection) => void;
  setIsNewRequestOpen: (open: boolean) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;

  // Project Actions
  createProject: (projectData: Partial<Project>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateBriefData: (projectId: string, briefData: Record<string, any>) => void;
  lockBrief: (projectId: string) => { success: boolean; error?: string };
  unlockBrief: (projectId: string, reason: string) => { success: boolean };
  changeProjectStage: (
    projectId: string,
    newStage: WorkflowStage,
    reason?: string,
    isOverride?: boolean
  ) => { success: boolean; error?: string };

  // Task Actions
  createTask: (taskData: Omit<Task, 'id'>) => Task;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  deleteTask: (taskId: string) => void;

  // File & Deliverable Version Actions
  uploadFile: (fileData: Omit<ProjectFile, 'id' | 'uploadedAt' | 'uploadedByName'>) => ProjectFile;
  deleteFile: (fileId: string) => void;
  updateFile: (fileId: string, updates: Partial<ProjectFile>) => void;
  uploadDeliverableVersion: (versionData: Omit<DeliverableVersion, 'id' | 'uploadedAt' | 'uploadedByName' | 'status' | 'isLocked'>) => DeliverableVersion;

  // Database Backup, Sync & API Connector
  exportDatabaseJson: () => string;
  importDatabaseJson: (payload: DatabaseBackupPayload | string, mode?: 'replace' | 'merge') => { success: boolean; message: string; details?: any };
  syncWithLocalApi: (apiUrl: string) => Promise<ApiSyncResult>;
  pushToLocalApi: (apiUrl: string) => Promise<ApiSyncResult>;

  // QA Actions
  submitQA: (submission: Omit<QASubmission, 'id' | 'performedAt' | 'performedByName'>) => void;

  // Approval Actions
  submitClientApproval: (approvalData: Omit<ClientApprovalRecord, 'id' | 'approvedAt'>) => void;

  // Feedback Actions
  addFeedbackItem: (item: Omit<FeedbackItem, 'id' | 'submittedAt' | 'submittedByName' | 'assignedToName'>) => void;
  updateFeedbackStatus: (feedbackId: string, status: FeedbackItem['status']) => void;

  // Messaging & Chat
  sendChatMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt' | 'senderName' | 'senderAvatar'>) => void;
  deleteChatMessage: (id: string) => void;
  toggleImportantMessage: (id: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  toggleNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearReadNotifications: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;

  // Admin Config
  updateAdminConfig: (updates: Partial<AdminConfig>) => void;
  updateClient: (client: ClientRecord) => void;
  addClient: (client: ClientRecord) => void;
  resetAllDataToDemo: () => void;

  // Authentication & User Administration
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot_password';
  isProfileModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  setAuthModalMode: (mode: 'login' | 'register' | 'forgot_password') => void;
  setIsProfileModalOpen: (open: boolean) => void;
  registerUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    roleTitle?: string;
    departmentId: DepartmentId;
    avatar?: string;
  }) => { success: boolean; error?: string; user?: User };
  loginUser: (email: string, password: string) => { success: boolean; error?: string; user?: User };
  forgotPassword: (email: string) => { success: boolean; error?: string; resetToken?: string };
  resetPassword: (email: string, resetToken: string, newPassword: string) => { success: boolean; error?: string };
  logoutUser: () => void;
  suspendUser: (userId: string, reason: string) => { success: boolean; error?: string };
  reactivateUser: (userId: string) => { success: boolean; error?: string };
  deleteUser: (userId: string, reassignToUserId?: string) => { success: boolean; error?: string };
  updateUserPassword: (userId: string, oldPassword: string, newPassword: string) => { success: boolean; error?: string };
  updateUserProfile: (
    userId: string,
    updates: Partial<Pick<User, 'name' | 'email' | 'avatar' | 'roleTitle' | 'departmentId'>>
  ) => { success: boolean; error?: string; user?: User };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'uicms_workflow_v1_store';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or initial
  const loadState = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load storage', e);
    }
    return null;
  };

  const initial = loadState();

  const [users, setUsers] = useState<User[]>(initial?.users || INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(
    initial?.currentUser || INITIAL_USERS[0]
  );
  const [projects, setProjects] = useState<Project[]>(
    initial?.projects || INITIAL_PROJECTS
  );
  const [tasks, setTasks] = useState<Task[]>(initial?.tasks || INITIAL_TASKS);
  const [files, setFiles] = useState<ProjectFile[]>(
    initial?.files || INITIAL_FILES
  );
  const [versions, setVersions] = useState<DeliverableVersion[]>(
    initial?.versions || INITIAL_VERSIONS
  );
  const [qaSubmissions, setQaSubmissions] = useState<QASubmission[]>(
    initial?.qaSubmissions || INITIAL_QA_SUBMISSIONS
  );
  const [approvals, setApprovals] = useState<ClientApprovalRecord[]>(
    initial?.approvals || INITIAL_APPROVALS
  );
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(
    initial?.feedbackItems || INITIAL_FEEDBACK
  );
  const [notifications, setNotifications] = useState<Notification[]>(
    initial?.notifications || INITIAL_NOTIFICATIONS
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    initial?.chatMessages || INITIAL_CHAT_MESSAGES
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(
    initial?.activityLogs || INITIAL_ACTIVITY_LOGS
  );
  const [clients, setClients] = useState<ClientRecord[]>(
    initial?.clients || INITIAL_CLIENTS
  );
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(
    initial?.adminConfig || INITIAL_ADMIN_CONFIG
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<string>('brief');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeNavSection, setActiveNavSection] = useState<ActiveNavSection>('dashboard');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Auth & Profile Modal states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    initial?.isAuthenticated !== undefined ? initial.isAuthenticated : true
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('uicms_theme_mode');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {}
    return 'dark';
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('uicms_theme_mode', mode);
    } catch {}
  };

  const toggleThemeMode = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [themeMode]);

  // Auto-save state with quota-safe sanitization and fallback
  useEffect(() => {
    const sanitizeStateForStorage = (data: any, detailLevel: number) => {
      const maxLogs = detailLevel === 2 ? 80 : detailLevel === 1 ? 30 : 10;
      const maxChats = detailLevel === 2 ? 100 : detailLevel === 1 ? 40 : 15;
      const maxNotifs = detailLevel === 2 ? 50 : detailLevel === 1 ? 25 : 10;

      // Safe copy of logs, chat, notifs
      const safeLogs = (data.activityLogs || []).slice(0, maxLogs);
      const safeChats = (data.chatMessages || []).slice(0, maxChats);
      const safeNotifs = (data.notifications || []).slice(0, maxNotifs);

      // Clean large data URLs in file repository
      const safeFiles = (data.files || []).map((f: any) => {
        if (f.url && f.url.startsWith('data:') && f.url.length > 50000) {
          return { ...f, url: `https://files.uicms.com/assets/${encodeURIComponent(f.filename)}` };
        }
        return f;
      });

      // Clean large data URLs in version deliverables
      const safeVersions = (data.versions || []).map((v: any) => {
        const assets = (v.assets || []).map((a: any) => {
          if (a.url && a.url.startsWith('data:') && a.url.length > 50000) {
            return { ...a, url: `https://files.uicms.com/versions/${encodeURIComponent(a.filename || 'asset')}` };
          }
          return a;
        });
        return { ...v, assets };
      });

      return {
        ...data,
        activityLogs: safeLogs,
        chatMessages: safeChats,
        notifications: safeNotifs,
        files: safeFiles,
        versions: safeVersions,
      };
    };

    const rawState = {
      users,
      currentUser,
      projects,
      tasks,
      files,
      versions,
      qaSubmissions,
      approvals,
      feedbackItems,
      notifications,
      chatMessages,
      activityLogs,
      clients,
      adminConfig,
    };

    // Progressive reduction save strategy
    try {
      const payload = sanitizeStateForStorage(rawState, 2);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      try {
        const payload1 = sanitizeStateForStorage(rawState, 1);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload1));
      } catch {
        try {
          const payload0 = sanitizeStateForStorage(rawState, 0);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload0));
        } catch {
          // Gracefully suppress quota errors while keeping full memory state
          console.warn('Local storage quota limit reached. Current session state retained in memory.');
        }
      }
    }
  }, [
    users,
    currentUser,
    projects,
    tasks,
    files,
    versions,
    qaSubmissions,
    approvals,
    feedbackItems,
    notifications,
    chatMessages,
    activityLogs,
    clients,
    adminConfig,
  ]);

  const logActivity = (
    projectId: string,
    action: string,
    description: string,
    opts?: {
      versionRef?: string;
      previousStage?: WorkflowStage;
      newStage?: WorkflowStage;
      metadata?: Record<string, any>;
    }
  ) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      description,
      versionRef: opts?.versionRef,
      timestamp: new Date().toISOString(),
      previousStage: opts?.previousStage,
      newStage: opts?.newStage,
      metadata: opts?.metadata,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const addNotification = (
    notif: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ) => {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const createProject = (projectData: Partial<Project>): Project => {
    const deptCodeMap: Record<DepartmentId, string> = {
      marketing: 'MKT',
      incentive_travel: 'TRV',
      online_ram: 'RAM',
      development: 'DEV',
    };
    const deptCode = deptCodeMap[projectData.departmentId || 'marketing'] || 'PRJ';
    const nextNum = projects.length + 101;
    const generatedId = `PRJ-${deptCode}-2026-${String(nextNum).padStart(3, '0')}`;

    const briefCompletenessReport = calculateBriefCompleteness(
      projectData.requestTypeId || '',
      projectData.briefData || {}
    );

    const newProject: Project = {
      id: generatedId,
      projectNumber: nextNum,
      clientId: projectData.clientId || 'cl-discovery',
      departmentId: projectData.departmentId || 'marketing',
      requestTypeId: projectData.requestTypeId || 'mkt-social-instagram',
      projectName: projectData.projectName || 'New Creative Request',
      campaignName: projectData.campaignName || 'General Campaign 2026',
      description: projectData.description || '',
      priority: projectData.priority || 'medium',
      stage: 'BRIEF_VALIDATION',
      status: 'on_track',
      version: 'V0.1',
      accountableUserId: projectData.accountableUserId || currentUser.id,
      projectOwnerId: projectData.projectOwnerId || currentUser.id,
      qaOwnerId: projectData.qaOwnerId || 'usr-qa-1',
      approverId: projectData.approverId || 'usr-client-1',
      contributorIds: projectData.contributorIds || [currentUser.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      briefDueDate: projectData.briefDueDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      productionDueDate: projectData.productionDueDate || new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
      internalQaDueDate: projectData.internalQaDueDate || new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
      clientReviewDueDate: projectData.clientReviewDueDate || new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      clientApprovalDueDate: projectData.clientApprovalDueDate || new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
      finalQaDueDate: projectData.finalQaDueDate || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      releaseDate: projectData.releaseDate || new Date(Date.now() + 86400000 * 16).toISOString().split('T')[0],
      dependencies: projectData.dependencies || 'None noted.',
      risks: projectData.risks || '',
      blockers: '',
      externalSuppliers: projectData.externalSuppliers || '',
      nextAction: {
        task: 'Validate brief completeness and verify client CI assets',
        ownerName: currentUser.name,
        dueDate: projectData.briefDueDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      },
      approvalStatus: 'none',
      isBriefLocked: false,
      isVersionLocked: false,
      briefData: projectData.briefData || {},
      briefCompleteness: briefCompletenessReport.score,
    };

    setProjects((prev) => [newProject, ...prev]);

    // Create initial kick-off task
    createTask({
      projectId: generatedId,
      name: 'Validate Brief & Asset Completeness',
      description: 'Review the master brief and ensure all brand CI guidelines and logos are attached.',
      ownerId: newProject.accountableUserId,
      departmentId: newProject.departmentId,
      priority: newProject.priority,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: newProject.briefDueDate,
      status: 'in_progress',
    });

    logActivity(
      generatedId,
      'REQUEST_CREATED',
      `Request "${newProject.projectName}" was submitted by ${currentUser.name}. Stage set to Brief Validation.`,
      { newStage: 'BRIEF_VALIDATION' }
    );

    // Notify AM and Department Manager
    addNotification({
      userId: newProject.accountableUserId,
      projectId: generatedId,
      type: 'new_request',
      title: 'New Request Created',
      message: `Project ${generatedId}: "${newProject.projectName}" is in Brief Validation.`,
      targetTab: 'brief',
    });

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
          return updated;
        }
        return p;
      })
    );
  };

  const updateBriefData = (projectId: string, briefData: Record<string, any>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          if (p.isBriefLocked) return p; // Cannot edit locked brief
          const report = calculateBriefCompleteness(p.requestTypeId, briefData);
          return {
            ...p,
            briefData,
            briefCompleteness: report.score,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  const lockBrief = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return { success: false, error: 'Project not found.' };

    const report = calculateBriefCompleteness(project.requestTypeId, project.briefData);
    if (!report.isComplete) {
      return {
        success: false,
        error: `Cannot lock brief: ${report.missingMandatoryFields.length} mandatory fields are missing: ${report.missingMandatoryFields.join(', ')}.`,
      };
    }

    const previousStage = project.stage;
    const newStage: WorkflowStage = 'PRODUCTION';

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            isBriefLocked: true,
            briefLockedAt: new Date().toISOString(),
            briefLockedBy: currentUser.name,
            stage: newStage,
            status: 'on_track',
            nextAction: {
              task: 'Commence V1.0 creative production and prepare deliverables',
              ownerName: users.find((u) => u.id === p.projectOwnerId)?.name || 'Project Owner',
              dueDate: p.productionDueDate,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    // Create production task
    createTask({
      projectId,
      name: `Design & Produce V1.0 Deliverables`,
      description: `Complete production per approved brief specification for ${project.projectName}.`,
      ownerId: project.projectOwnerId,
      departmentId: project.departmentId,
      priority: project.priority,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: project.productionDueDate,
      status: 'in_progress',
    });

    logActivity(
      projectId,
      'BRIEF_LOCKED',
      `Master Brief was validated at 100% completeness and officially LOCKED by ${currentUser.name}. Stage moved to PRODUCTION.`,
      { previousStage, newStage }
    );

    addNotification({
      userId: project.projectOwnerId,
      projectId,
      type: 'brief_locked',
      title: 'Brief Locked — Production Can Begin',
      message: `Brief for "${project.projectName}" has been locked by ${currentUser.name}. You are assigned to complete V1.0 production.`,
      targetTab: 'tasks',
    });

    return { success: true };
  };

  const unlockBrief = (projectId: string, reason: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return { success: false };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            isBriefLocked: false,
            stage: 'BRIEF_VALIDATION',
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    logActivity(
      projectId,
      'BRIEF_UNLOCKED',
      `Brief was unlocked by ${currentUser.name}. Reason: ${reason}. Project reverted to Brief Validation.`,
      { previousStage: project.stage, newStage: 'BRIEF_VALIDATION' }
    );

    return { success: true };
  };

  const changeProjectStage = (
    projectId: string,
    newStage: WorkflowStage,
    reason?: string,
    isOverride?: boolean
  ): { success: boolean; error?: string } => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return { success: false, error: 'Project not found.' };

    const previousStage = project.stage;

    // Rule 1: No complete brief = no production start
    if (
      (newStage === 'PRODUCTION' || newStage === 'INTERNAL_QA') &&
      !project.isBriefLocked &&
      adminConfig.workflowRules.enforceBriefLockForProduction &&
      !isOverride
    ) {
      return {
        success: false,
        error: 'Rule 1 Enforced: Brief must be 100% completed and locked before production can begin.',
      };
    }

    // Rule 5: Internal QA must be completed before client review/approval
    if (
      (newStage === 'CLIENT_REVIEW' || newStage === 'CLIENT_APPROVAL') &&
      adminConfig.workflowRules.enforceQABeforeClientReview &&
      !isOverride
    ) {
      const hasPassedQA = qaSubmissions.some(
        (q) => q.projectId === projectId && (q.result === 'PASS' || q.result === 'PASS_WITH_NOTES')
      );
      if (!hasPassedQA) {
        return {
          success: false,
          error: 'Rule 5 Enforced: Internal QA inspection must be completed and passed before moving to Client Review.',
        };
      }
    }

    // Rule 6: Final release cannot happen without documented approval
    if (
      (newStage === 'RELEASE_PUBLISH' || newStage === 'ARCHIVE') &&
      adminConfig.workflowRules.enforceApprovalBeforeRelease &&
      !isOverride
    ) {
      const hasApproval = approvals.some(
        (a) => a.projectId === projectId && (a.decision === 'APPROVED' || a.decision === 'APPROVED_WITH_NOTES')
      );
      if (!hasApproval) {
        return {
          success: false,
          error: 'Rule 6 Enforced: Final release cannot occur without documented client approval sign-off.',
        };
      }
    }

    let nextTask = '';
    let nextOwnerId = project.projectOwnerId;
    let nextDueDate = project.productionDueDate;

    switch (newStage) {
      case 'BRIEF_VALIDATION':
        nextTask = 'Validate brief fields & verify client CI assets';
        nextOwnerId = project.accountableUserId;
        nextDueDate = project.briefDueDate;
        break;
      case 'PRODUCTION':
        nextTask = 'Design and produce deliverable version';
        nextOwnerId = project.projectOwnerId;
        nextDueDate = project.productionDueDate;
        break;
      case 'INTERNAL_QA':
        nextTask = 'Complete internal QA inspection checklist';
        nextOwnerId = project.qaOwnerId;
        nextDueDate = project.internalQaDueDate;
        break;
      case 'CLIENT_REVIEW':
        nextTask = 'Conduct client review presentation and collect feedback';
        nextOwnerId = project.approverId;
        nextDueDate = project.clientReviewDueDate;
        break;
      case 'REVISION':
        nextTask = 'Implement revision changes per feedback';
        nextOwnerId = project.projectOwnerId;
        nextDueDate = project.productionDueDate;
        break;
      case 'CLIENT_APPROVAL':
        nextTask = 'Obtain written digital sign-off';
        nextOwnerId = project.approverId;
        nextDueDate = project.clientApprovalDueDate;
        break;
      case 'FINAL_QA':
        nextTask = 'Pre-flight printer check and release package verification';
        nextOwnerId = project.qaOwnerId;
        nextDueDate = project.finalQaDueDate;
        break;
      case 'RELEASE_PUBLISH':
        nextTask = 'Publish digital assets / send to litho print partner';
        nextOwnerId = project.accountableUserId;
        nextDueDate = project.releaseDate;
        break;
      case 'ARCHIVE':
        nextTask = 'Project successfully delivered and archived in records';
        nextOwnerId = project.accountableUserId;
        nextDueDate = project.releaseDate;
        break;
    }

    const nextOwnerName = users.find((u) => u.id === nextOwnerId)?.name || 'Responsible Owner';

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            stage: newStage,
            status: newStage === 'ARCHIVE' ? 'completed' : newStage === 'REVISION' ? 'revision_required' : 'on_track',
            nextAction: {
              task: nextTask,
              ownerName: nextOwnerName,
              dueDate: nextDueDate,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    logActivity(
      projectId,
      isOverride ? 'STAGE_OVERRIDDEN' : 'STAGE_CHANGED',
      isOverride
        ? `Manager ${currentUser.name} OVERRODE workflow stage from ${previousStage} to ${newStage}. Reason: ${reason || 'Manual manager intervention'}`
        : `Project stage advanced from ${previousStage} to ${newStage} by ${currentUser.name}.`,
      { previousStage, newStage, metadata: { isOverride, reason } }
    );

    return { success: true };
  };

  const createTask = (taskData: Omit<Task, 'id'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `tsk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setTasks((prev) => [newTask, ...prev]);

    logActivity(
      newTask.projectId,
      'TASK_CREATED',
      `New task "${newTask.name}" assigned to ${users.find((u) => u.id === newTask.ownerId)?.name || 'user'}. Due: ${newTask.dueDate}.`
    );

    addNotification({
      userId: newTask.ownerId,
      projectId: newTask.projectId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned task: "${newTask.name}" for project ${newTask.projectId}.`,
      targetTab: 'tasks',
    });

    return newTask;
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isComplete = status === 'complete';
          return {
            ...t,
            status,
            completedAt: isComplete ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const uploadFile = (
    fileData: Omit<ProjectFile, 'id' | 'uploadedAt' | 'uploadedByName'>
  ): ProjectFile => {
    const newFile: ProjectFile = {
      ...fileData,
      id: `fil-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      uploadedByName: currentUser.name,
      uploadedAt: new Date().toISOString(),
    };
    setFiles((prev) => [newFile, ...prev]);

    logActivity(
      newFile.projectId,
      'FILE_UPLOADED',
      `File "${newFile.filename}" (${newFile.category}) uploaded by ${currentUser.name}.`
    );

    return newFile;
  };

  const deleteFile = (fileId: string) => {
    const f = files.find((item) => item.id === fileId);
    setFiles((prev) => prev.filter((item) => item.id !== fileId));
    if (f) {
      logActivity(
        f.projectId,
        'FILE_DELETED',
        `File "${f.filename}" (${f.category}) was removed by ${currentUser.name}.`
      );
    }
  };

  const updateFile = (fileId: string, updates: Partial<ProjectFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f)));
  };

  const uploadDeliverableVersion = (
    versionData: Omit<
      DeliverableVersion,
      'id' | 'uploadedAt' | 'uploadedByName' | 'status' | 'isLocked'
    >
  ): DeliverableVersion => {
    const newVersion: DeliverableVersion = {
      ...versionData,
      id: `ver-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      uploadedByName: currentUser.name,
      uploadedAt: new Date().toISOString(),
      status: 'in_qa',
      isLocked: false,
    };

    setVersions((prev) => [newVersion, ...prev]);

    // Update project version reference & advance stage to INTERNAL_QA
    const project = projects.find((p) => p.id === newVersion.projectId);
    if (project) {
      updateProject(project.id, {
        version: newVersion.versionNumber,
        stage: 'INTERNAL_QA',
        status: 'on_track',
        nextAction: {
          task: `Perform Internal QA on ${newVersion.versionNumber}`,
          ownerName: users.find((u) => u.id === project.qaOwnerId)?.name || 'QA Lead',
          dueDate: project.internalQaDueDate,
        },
      });

      logActivity(
        newVersion.projectId,
        'VERSION_UPLOADED',
        `Deliverable Version ${newVersion.versionNumber} ("${newVersion.title}") uploaded by ${currentUser.name}. Stage moved to INTERNAL_QA.`,
        { versionRef: newVersion.versionNumber, previousStage: project.stage, newStage: 'INTERNAL_QA' }
      );

      // Notify QA owner
      addNotification({
        userId: project.qaOwnerId,
        projectId: project.id,
        type: 'qa_required',
        title: `QA Required: ${newVersion.versionNumber}`,
        message: `${newVersion.versionNumber} for "${project.projectName}" is ready for your QA checklist inspection.`,
        targetTab: 'qa',
      });
    }

    return newVersion;
  };

  const submitQA = (
    submissionData: Omit<QASubmission, 'id' | 'performedAt' | 'performedByName'>
  ) => {
    const newSubmission: QASubmission = {
      ...submissionData,
      id: `qa-sub-${Date.now()}`,
      performedByName: currentUser.name,
      performedAt: new Date().toISOString(),
    };

    setQaSubmissions((prev) => [newSubmission, ...prev]);

    const project = projects.find((p) => p.id === newSubmission.projectId);
    if (!project) return;

    // Update version status
    setVersions((prev) =>
      prev.map((v) => {
        if (v.id === newSubmission.versionId) {
          return {
            ...v,
            qaResult: newSubmission.result,
            qaNotes: newSubmission.overallNotes,
            status: newSubmission.result === 'FAIL' ? 'revision_requested' : 'client_review',
          };
        }
        return v;
      })
    );

    if (newSubmission.result === 'PASS' || newSubmission.result === 'PASS_WITH_NOTES') {
      // Advance to CLIENT_REVIEW
      updateProject(project.id, {
        stage: 'CLIENT_REVIEW',
        status: 'on_track',
        nextAction: {
          task: 'Present V1 deliverables to client and collect feedback/approval',
          ownerName: users.find((u) => u.id === project.approverId)?.name || 'Client',
          dueDate: project.clientReviewDueDate,
        },
      });

      logActivity(
        project.id,
        'QA_PASSED',
        `Internal QA inspection PASSED (${newSubmission.result}) by ${currentUser.name}. Notes: ${newSubmission.overallNotes}. Stage moved to CLIENT_REVIEW.`,
        { previousStage: project.stage, newStage: 'CLIENT_REVIEW' }
      );

      addNotification({
        userId: project.accountableUserId,
        projectId: project.id,
        type: 'approval_required',
        title: 'QA Passed — Ready for Client Review',
        message: `Project "${project.projectName}" has passed internal QA and is ready for client review.`,
        targetTab: 'approval',
      });
    } else {
      // FAILED QA -> Move to REVISION
      updateProject(project.id, {
        stage: 'REVISION',
        status: 'revision_required',
        nextAction: {
          task: 'Address QA corrective action points and produce updated version',
          ownerName: users.find((u) => u.id === project.projectOwnerId)?.name || 'Designer',
          dueDate: project.productionDueDate,
        },
      });

      logActivity(
        project.id,
        'QA_FAILED',
        `Internal QA inspection FAILED by ${currentUser.name}. QA Notes: ${newSubmission.overallNotes}. Project returned to REVISION.`,
        { previousStage: project.stage, newStage: 'REVISION' }
      );

      // Create corrective feedback item
      addFeedbackItem({
        projectId: project.id,
        version: project.version,
        submittedBy: currentUser.id,
        feedbackText: `QA Correction Required: ${newSubmission.overallNotes}`,
        assignedTo: project.projectOwnerId,
        priority: 'urgent',
        status: 'open',
        type: 'action_required',
      });

      addNotification({
        userId: project.projectOwnerId,
        projectId: project.id,
        type: 'qa_failed',
        title: 'QA Corrections Required',
        message: `Internal QA for "${project.projectName}" failed. Review QA checklist notes and upload revised version.`,
        targetTab: 'qa',
      });
    }
  };

  const submitClientApproval = (
    approvalData: Omit<ClientApprovalRecord, 'id' | 'approvedAt'>
  ) => {
    const signatureHash = `sig_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const newApproval: ClientApprovalRecord = {
      ...approvalData,
      id: `appr-${Date.now()}`,
      approvedAt: new Date().toISOString(),
      signatureHash,
    };

    setApprovals((prev) => [newApproval, ...prev]);

    const project = projects.find((p) => p.id === newApproval.projectId);
    if (!project) return;

    if (newApproval.decision === 'APPROVED' || newApproval.decision === 'APPROVED_WITH_NOTES') {
      // Lock version (Rule 6 & 7)
      setVersions((prev) =>
        prev.map((v) => {
          if (v.id === newApproval.versionId || v.projectId === project.id) {
            return {
              ...v,
              isLocked: true,
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approverName: newApproval.clientName,
            };
          }
          return v;
        })
      );

      updateProject(project.id, {
        isVersionLocked: true,
        approvalStatus: newApproval.decision === 'APPROVED' ? 'approved' : 'approved_with_notes',
        stage: 'FINAL_QA',
        status: 'on_track',
        nextAction: {
          task: 'Perform Final QA pre-flight audit and certify release package',
          ownerName: users.find((u) => u.id === project.qaOwnerId)?.name || 'QA Lead',
          dueDate: project.finalQaDueDate,
        },
      });

      // Create Final QA task
      createTask({
        projectId: project.id,
        name: 'Perform Final QA Pre-Flight Certification',
        description: `Audit print separations / digital package before release. Approved by ${newApproval.clientName}.`,
        ownerId: project.qaOwnerId,
        departmentId: project.departmentId,
        priority: 'urgent',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: project.finalQaDueDate,
        status: 'in_progress',
      });

      logActivity(
        project.id,
        'CLIENT_APPROVED',
        `Client ${newApproval.clientName} (${newApproval.clientPosition}) officially APPROVED deliverable. Signature Hash: ${signatureHash}. Version LOCKED. Stage moved to FINAL_QA.`,
        { previousStage: project.stage, newStage: 'FINAL_QA', metadata: { comments: newApproval.comments } }
      );

      addNotification({
        userId: project.accountableUserId,
        projectId: project.id,
        type: 'approval_received',
        title: 'Client Approval Received!',
        message: `${newApproval.clientName} has approved "${project.projectName}". Version is locked for Final QA.`,
        targetTab: 'approval',
      });
    } else {
      // Not approved -> REVISION
      updateProject(project.id, {
        approvalStatus: 'rejected',
        stage: 'REVISION',
        status: 'revision_required',
        nextAction: {
          task: 'Implement client feedback revisions',
          ownerName: users.find((u) => u.id === project.projectOwnerId)?.name || 'Designer',
          dueDate: project.productionDueDate,
        },
      });

      addFeedbackItem({
        projectId: project.id,
        version: project.version,
        submittedBy: currentUser.id,
        feedbackText: `Client Sign-off Feedback: ${newApproval.comments}`,
        assignedTo: project.projectOwnerId,
        priority: 'urgent',
        status: 'open',
        type: 'action_required',
      });

      logActivity(
        project.id,
        'CLIENT_REJECTED',
        `Client ${newApproval.clientName} requested revisions: "${newApproval.comments}". Project moved to REVISION.`,
        { previousStage: project.stage, newStage: 'REVISION' }
      );

      addNotification({
        userId: project.projectOwnerId,
        projectId: project.id,
        type: 'approval_rejected',
        title: 'Client Revisions Requested',
        message: `${newApproval.clientName} did not approve current deliverable. Revisions are required.`,
        targetTab: 'feedback',
      });
    }
  };

  const addFeedbackItem = (
    item: Omit<
      FeedbackItem,
      'id' | 'submittedAt' | 'submittedByName' | 'assignedToName'
    >
  ) => {
    const assignedUser = users.find((u) => u.id === item.assignedTo);
    const newFeedback: FeedbackItem = {
      ...item,
      id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      submittedByName: currentUser.name,
      submittedAt: new Date().toISOString(),
      assignedToName: assignedUser?.name || 'Assignee',
    };

    setFeedbackItems((prev) => [newFeedback, ...prev]);

    logActivity(
      item.projectId,
      'FEEDBACK_ADDED',
      `Feedback added by ${currentUser.name} (${item.type}): "${item.feedbackText.substring(0, 80)}..." assigned to ${assignedUser?.name}.`
    );

    addNotification({
      userId: item.assignedTo,
      projectId: item.projectId,
      type: 'client_feedback',
      title: 'New Feedback Added',
      message: `Feedback for project ${item.projectId}: ${item.feedbackText.substring(0, 100)}`,
      targetTab: 'feedback',
    });
  };

  const updateFeedbackStatus = (feedbackId: string, status: FeedbackItem['status']) => {
    setFeedbackItems((prev) =>
      prev.map((f) => (f.id === feedbackId ? { ...f, status } : f))
    );
  };

  const sendChatMessage = (
    msg: Omit<ChatMessage, 'id' | 'createdAt' | 'senderName' | 'senderAvatar'>
  ) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, newMsg]);

    // 1. If direct message, notify recipient
    if (msg.recipientId && msg.recipientId !== currentUser.id) {
      addNotification({
        userId: msg.recipientId,
        projectId: msg.projectId,
        type: 'internal_feedback',
        title: `Direct Message from ${currentUser.name}`,
        message: `${currentUser.name}: "${msg.message.substring(0, 100)}"`,
        targetTab: 'chat',
      });
    }

    // 2. If mentions present, notify mentioned users
    if (msg.mentions && msg.mentions.length > 0) {
      for (const mId of msg.mentions) {
        if (mId !== currentUser.id && mId !== msg.recipientId) {
          const project = projects.find((p) => p.id === msg.projectId);
          addNotification({
            userId: mId,
            projectId: msg.projectId,
            type: 'internal_feedback',
            title: project ? `Mentioned in ${project.id} Chat` : `Mentioned by ${currentUser.name}`,
            message: `${currentUser.name} mentioned you: "${msg.message.substring(0, 90)}..."`,
            targetTab: 'chat',
          });
        }
      }
    }

    // 3. If important message in project channel, notify project lead
    if (msg.isImportant && msg.projectId) {
      const project = projects.find((p) => p.id === msg.projectId);
      if (project) {
        const notifyTargetId =
          project.projectOwnerId !== currentUser.id
            ? project.projectOwnerId
            : project.accountableUserId !== currentUser.id
            ? project.accountableUserId
            : undefined;

        if (notifyTargetId && (!msg.mentions || !msg.mentions.includes(notifyTargetId))) {
          addNotification({
            userId: notifyTargetId,
            projectId: msg.projectId,
            type: 'internal_feedback',
            title: `Important Notice: ${project.id}`,
            message: `${currentUser.name} marked an urgent update in project chat: "${msg.message.substring(0, 90)}..."`,
            targetTab: 'chat',
          });
        }
      }
    }
  };

  const deleteChatMessage = (id: string) => {
    setChatMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleImportantMessage = (id: string) => {
    setChatMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isImportant: !m.isImportant } : m))
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const toggleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearReadNotifications = () => {
    setNotifications((prev) => prev.filter((n) => !n.read || n.userId !== currentUser.id));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser.id ? { ...n, read: true } : n))
    );
  };

  const updateAdminConfig = (updates: Partial<AdminConfig>) => {
    setAdminConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateClient = (client: ClientRecord) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
  };

  const addClient = (client: ClientRecord) => {
    setClients((prev) => [...prev, client]);
  };

  const resetAllDataToDemo = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setIsAuthenticated(true);
    setProjects(INITIAL_PROJECTS);
    setTasks(INITIAL_TASKS);
    setFiles(INITIAL_FILES);
    setVersions(INITIAL_VERSIONS);
    setQaSubmissions(INITIAL_QA_SUBMISSIONS);
    setApprovals(INITIAL_APPROVALS);
    setFeedbackItems(INITIAL_FEEDBACK);
    setNotifications(INITIAL_NOTIFICATIONS);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setClients(INITIAL_CLIENTS);
    setAdminConfig(INITIAL_ADMIN_CONFIG);
  };

  const exportDatabaseJson = (): string => {
    const payload: DatabaseBackupPayload = {
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      exportedBy: `${currentUser.name} (${currentUser.role})`,
      users,
      projects,
      tasks,
      files,
      versions,
      qaSubmissions,
      approvals,
      feedbackItems,
      notifications,
      chatMessages,
      activityLogs,
      clients,
      adminConfig,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDatabaseJson = (
    payloadInput: DatabaseBackupPayload | string,
    mode: 'replace' | 'merge' = 'replace'
  ): { success: boolean; message: string; details?: any } => {
    try {
      let payload: DatabaseBackupPayload;
      if (typeof payloadInput === 'string') {
        payload = JSON.parse(payloadInput);
      } else {
        payload = payloadInput;
      }

      if (!payload || typeof payload !== 'object') {
        return { success: false, message: 'Invalid JSON payload structure.' };
      }

      if (mode === 'replace') {
        if (Array.isArray(payload.projects)) setProjects(payload.projects);
        if (Array.isArray(payload.tasks)) setTasks(payload.tasks);
        if (Array.isArray(payload.files)) setFiles(payload.files);
        if (Array.isArray(payload.versions)) setVersions(payload.versions);
        if (Array.isArray(payload.qaSubmissions)) setQaSubmissions(payload.qaSubmissions);
        if (Array.isArray(payload.approvals)) setApprovals(payload.approvals);
        if (Array.isArray(payload.feedbackItems)) setFeedbackItems(payload.feedbackItems);
        if (Array.isArray(payload.notifications)) setNotifications(payload.notifications);
        if (Array.isArray(payload.chatMessages)) setChatMessages(payload.chatMessages);
        if (Array.isArray(payload.activityLogs)) setActivityLogs(payload.activityLogs);
        if (Array.isArray(payload.clients)) setClients(payload.clients);
        if (Array.isArray(payload.users)) setUsers(payload.users);
        if (payload.adminConfig) setAdminConfig(payload.adminConfig);
      } else {
        // Merge mode
        if (Array.isArray(payload.projects)) {
          setProjects((prev) => {
            const map = new Map(prev.map((p) => [p.id, p]));
            payload.projects!.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(payload.files)) {
          setFiles((prev) => {
            const map = new Map(prev.map((f) => [f.id, f]));
            payload.files!.forEach((f) => map.set(f.id, f));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(payload.tasks)) {
          setTasks((prev) => {
            const map = new Map(prev.map((t) => [t.id, t]));
            payload.tasks!.forEach((t) => map.set(t.id, t));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(payload.clients)) {
          setClients((prev) => {
            const map = new Map(prev.map((c) => [c.id, c]));
            payload.clients!.forEach((c) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }
      }

      logActivity(
        'SYSTEM',
        'DATABASE_IMPORTED',
        `Database successfully imported and updated (${mode.toUpperCase()} mode) by ${currentUser.name}. Projects: ${payload.projects?.length || 0}, Files: ${payload.files?.length || 0}.`
      );

      return {
        success: true,
        message: `Database successfully updated (${mode} mode). ${payload.projects?.length || 0} projects, ${payload.files?.length || 0} files loaded.`,
        details: {
          projectsCount: payload.projects?.length,
          filesCount: payload.files?.length,
          usersCount: payload.users?.length,
        },
      };
    } catch (err: any) {
      return { success: false, message: `Import failed: ${err?.message || 'JSON parse error'}` };
    }
  };

  const syncWithLocalApi = async (apiUrl: string): Promise<ApiSyncResult> => {
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Auto-detect format: Array of projects, or { projects: [...], files: [...] }
      let incomingProjects: Project[] = [];
      let incomingFiles: ProjectFile[] = [];

      if (Array.isArray(rawData)) {
        incomingProjects = rawData.map((item, idx) => ({
          id: item.id || `PRJ-${Date.now()}-${idx}`,
          projectNumber: item.projectNumber || item.project_number || 100 + idx,
          clientId: item.clientId || item.client_id || 'cl-discovery',
          departmentId: item.departmentId || item.department_id || 'marketing',
          requestTypeId: item.requestTypeId || item.request_type_id || 'mkt-social-instagram',
          projectName: item.projectName || item.project_name || item.name || `Synced Project ${idx + 1}`,
          campaignName: item.campaignName || item.campaign_name || '',
          description: item.description || '',
          priority: item.priority || 'medium',
          stage: item.stage || 'PRODUCTION',
          status: item.status || 'on_track',
          version: item.version || 'V1.0',
          accountableUserId: item.accountableUserId || item.accountable_user_id || currentUser.id,
          projectOwnerId: item.projectOwnerId || item.project_owner_id || currentUser.id,
          qaOwnerId: item.qaOwnerId || item.qa_owner_id || 'usr-qa-1',
          approverId: item.approverId || item.approver_id || currentUser.id,
          contributorIds: Array.isArray(item.contributorIds) ? item.contributorIds : [],
          dependencies: typeof item.dependencies === 'string' ? item.dependencies : 'None',
          risks: typeof item.risks === 'string' ? item.risks : 'Low risk profile',
          blockers: typeof item.blockers === 'string' ? item.blockers : 'None',
          externalSuppliers: typeof item.externalSuppliers === 'string' ? item.externalSuppliers : 'Direct in-house',
          nextAction: item.nextAction && typeof item.nextAction === 'object' ? item.nextAction : {
            task: 'Initial Production Milestone',
            ownerName: currentUser.name,
            dueDate: new Date().toISOString().split('T')[0],
          },
          briefData: item.briefData || item.brief_data || {},
          createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
          briefDueDate: item.briefDueDate || item.brief_due_date || new Date().toISOString().split('T')[0],
          productionDueDate: item.productionDueDate || item.production_due_date || new Date().toISOString().split('T')[0],
          internalQaDueDate: item.internalQaDueDate || item.internal_qa_due_date || new Date().toISOString().split('T')[0],
          clientReviewDueDate: item.clientReviewDueDate || item.client_review_due_date || new Date().toISOString().split('T')[0],
          clientApprovalDueDate: item.clientApprovalDueDate || item.client_approval_due_date || new Date().toISOString().split('T')[0],
          finalQaDueDate: item.finalQaDueDate || item.final_qa_due_date || new Date().toISOString().split('T')[0],
          releaseDate: item.releaseDate || item.release_date || new Date().toISOString().split('T')[0],
          approvalStatus: item.approvalStatus || 'none',
          isBriefLocked: item.isBriefLocked ?? true,
          isVersionLocked: item.isVersionLocked ?? false,
          briefCompleteness: item.briefCompleteness || 100,
        }));
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.projects)) {
          incomingProjects = rawData.projects;
        }
        if (Array.isArray(rawData.files)) {
          incomingFiles = rawData.files;
        }
      }

      if (incomingProjects.length > 0) {
        setProjects((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          incomingProjects.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      }

      if (incomingFiles.length > 0) {
        setFiles((prev) => {
          const map = new Map(prev.map((f) => [f.id, f]));
          incomingFiles.forEach((f) => map.set(f.id, f));
          return Array.from(map.values());
        });
      }

      logActivity(
        'SYSTEM',
        'API_SYNC_COMPLETED',
        `Synchronized with endpoint ${apiUrl}: ${incomingProjects.length} projects and ${incomingFiles.length} files merged.`
      );

      return {
        success: true,
        message: `Successfully connected and synced ${incomingProjects.length} projects and ${incomingFiles.length} files from ${apiUrl}.`,
        syncedProjectsCount: incomingProjects.length,
        syncedFilesCount: incomingFiles.length,
        timestamp: new Date().toISOString(),
        rawResponse: rawData,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Sync connection error: ${err?.message || 'Could not connect to API server'}. Ensure your local server is running with CORS enabled.`,
        timestamp: new Date().toISOString(),
      };
    }
  };

  const pushToLocalApi = async (apiUrl: string): Promise<ApiSyncResult> => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        projects,
        files,
        tasks,
        clients,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      logActivity(
        'SYSTEM',
        'API_PUSH_COMPLETED',
        `Pushed ${projects.length} projects and ${files.length} files to server ${apiUrl}.`
      );

      return {
        success: true,
        message: `Successfully pushed state to server (${projects.length} projects, ${files.length} files).`,
        syncedProjectsCount: projects.length,
        syncedFilesCount: files.length,
        timestamp: new Date().toISOString(),
        rawResponse: result,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Push failed: ${err?.message || 'Network error'}. Check server URL and CORS headers.`,
        timestamp: new Date().toISOString(),
      };
    }
  };

  const getRoleTitleDefault = (role: UserRole): string => {
    switch (role) {
      case 'super_admin': return 'Chief Systems Administrator & Governance Lead';
      case 'department_manager': return 'Creative & Production Department Head';
      case 'account_manager': return 'Senior Account Director & Client Partner';
      case 'designer': return 'Creative Designer & Visual Specialist';
      case 'qa_user': return 'Quality Assurance & CI Compliance Lead';
      case 'client': return 'Client Brand Director & Approver';
      default: return 'Team Member';
    }
  };

  const registerUser = (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    roleTitle?: string;
    departmentId: DepartmentId;
    avatar?: string;
  }): { success: boolean; error?: string; user?: User } => {
    const emailClean = userData.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === emailClean);
    if (existing) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please log in or reset your password.',
      };
    }

    const newUserId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const defaultAvatar = userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    const newUser: User = {
      id: newUserId,
      name: userData.name.trim(),
      email: emailClean,
      password: userData.password,
      role: userData.role,
      roleTitle: userData.roleTitle?.trim() || getRoleTitleDefault(userData.role),
      departmentId: userData.departmentId,
      avatar: defaultAvatar,
      active: true,
      isSuspended: false,
      workloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);

    // Audit log
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: newUser.id,
      userName: newUser.name,
      action: 'USER_REGISTERED',
      description: `New account registered: ${newUser.name} (${newUser.email}) as ${newUser.roleTitle}.`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    // Welcome notification
    const notifId = `notif-${Date.now()}`;
    setNotifications((prev) => [
      {
        id: notifId,
        userId: newUser.id,
        type: 'account_created',
        title: 'Welcome to Unified Creative Workflow',
        message: `Your account has been created with ${newUser.roleTitle} permissions.`,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    return { success: true, user: newUser };
  };

  const loginUser = (
    email: string,
    password: string
  ): { success: boolean; error?: string; user?: User } => {
    const emailClean = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === emailClean);

    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }

    if (user.password && user.password !== password) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    if (user.isSuspended || !user.active) {
      return {
        success: false,
        error: `Account suspended: ${user.suspendedReason || 'Administrative suspension'}. Please contact your System Administrator.`,
      };
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);

    // Audit log
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: user.id,
      userName: user.name,
      action: 'USER_LOGIN',
      description: `${user.name} logged into the system portal.`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return { success: true, user };
  };

  const forgotPassword = (
    email: string
  ): { success: boolean; error?: string; resetToken?: string } => {
    const emailClean = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === emailClean);

    if (!user) {
      return { success: false, error: 'No user account found with that email address.' };
    }

    const resetToken = `SEC-${Math.floor(100000 + Math.random() * 900000)}`;

    // Log simulated reset dispatch
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: user.id,
      userName: user.name,
      action: 'PASSWORD_RESET_REQUESTED',
      description: `Password recovery token generated for ${user.email} (Token: ${resetToken}).`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return { success: true, resetToken };
  };

  const resetPassword = (
    email: string,
    resetToken: string,
    newPassword: string
  ): { success: boolean; error?: string } => {
    const emailClean = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === emailClean);

    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u))
    );

    if (currentUser.id === user.id) {
      setCurrentUser((prev) => ({ ...prev, password: newPassword }));
    }

    // Audit log
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: user.id,
      userName: user.name,
      action: 'PASSWORD_RESET_SUCCESS',
      description: `Password was successfully updated for account ${user.email}.`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return { success: true };
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
    setAuthModalMode('login');
  };

  const suspendUser = (
    userId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'Target user not found.' };
    }

    if (targetUser.role === 'super_admin' && currentUser.id === userId) {
      return { success: false, error: 'You cannot suspend your own Super Admin account.' };
    }

    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              active: false,
              isSuspended: true,
              suspendedReason: reason || 'Administrative suspension',
              suspendedAt: now,
              suspendedBy: currentUser.name,
            }
          : u
      )
    );

    // Audit log
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'USER_SUSPENDED',
      description: `User account for ${targetUser.name} (${targetUser.email}) was SUSPENDED by ${currentUser.name}. Reason: ${reason || 'Administrative action'}`,
      timestamp: now,
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    // If current logged-in user is suspended, log them out
    if (currentUser.id === userId) {
      logoutUser();
    }

    return { success: true };
  };

  const reactivateUser = (userId: string): { success: boolean; error?: string } => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'Target user not found.' };
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              active: true,
              isSuspended: false,
              suspendedReason: undefined,
              suspendedAt: undefined,
              suspendedBy: undefined,
            }
          : u
      )
    );

    // Audit log
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'USER_REACTIVATED',
      description: `User account for ${targetUser.name} (${targetUser.email}) was REACTIVATED by ${currentUser.name}.`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return { success: true };
  };

  const deleteUser = (
    userId: string,
    reassignToUserId?: string
  ): { success: boolean; error?: string } => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    // If reassign specified, reassign projects and tasks
    if (reassignToUserId) {
      const reassignUser = users.find((u) => u.id === reassignToUserId);
      if (reassignUser) {
        setProjects((prev) =>
          prev.map((p) => {
            const updates: Partial<Project> = {};
            if (p.accountableUserId === userId) updates.accountableUserId = reassignToUserId;
            if (p.projectOwnerId === userId) updates.projectOwnerId = reassignToUserId;
            if (p.qaOwnerId === userId) updates.qaOwnerId = reassignToUserId;
            if (p.approverId === userId) updates.approverId = reassignToUserId;
            return Object.keys(updates).length > 0 ? { ...p, ...updates } : p;
          })
        );

        setTasks((prev) =>
          prev.map((t) => (t.ownerId === userId ? { ...t, ownerId: reassignToUserId } : t))
        );
      }
    }

    // Remove user
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    // Audit log
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'USER_DELETED',
      description: `User account ${targetUser.name} (${targetUser.email}) was permanently DELETED by ${currentUser.name}.`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    // If current logged-in user was deleted, switch to fallback super admin or logout
    if (currentUser.id === userId) {
      const remainingAdmin = users.find((u) => u.id !== userId && u.role === 'super_admin');
      if (remainingAdmin) {
        setCurrentUser(remainingAdmin);
      } else {
        const remaining = users.find((u) => u.id !== userId);
        if (remaining) {
          setCurrentUser(remaining);
        } else {
          logoutUser();
        }
      }
    }

    return { success: true };
  };

  const updateUserPassword = (
    userId: string,
    oldPassword: string,
    newPassword: string
  ): { success: boolean; error?: string } => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.password && user.password !== oldPassword) {
      return { success: false, error: 'Current password does not match.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, password: newPassword }));
    }

    return { success: true };
  };

  const updateUserProfile = (
    userId: string,
    updates: Partial<Pick<User, 'name' | 'email' | 'avatar' | 'roleTitle' | 'departmentId'>>
  ): { success: boolean; error?: string; user?: User } => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User account not found.' };

    if (updates.email) {
      const emailClean = updates.email.trim().toLowerCase();
      const existing = users.find((u) => u.email.toLowerCase() === emailClean && u.id !== userId);
      if (existing) {
        return { success: false, error: 'An account with this email address already exists.' };
      }
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : user.name,
      email: updates.email !== undefined ? updates.email.trim().toLowerCase() : user.email,
      roleTitle: updates.roleTitle !== undefined ? updates.roleTitle.trim() : user.roleTitle,
      avatar: updates.avatar !== undefined ? updates.avatar : user.avatar,
      departmentId: updates.departmentId !== undefined ? updates.departmentId : user.departmentId,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    if (currentUser.id === userId) {
      setCurrentUser(updatedUser);
    }

    // Audit log
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: updatedUser.id,
      userName: updatedUser.name,
      action: 'USER_PROFILE_UPDATED',
      description: `User profile details/avatar updated for ${updatedUser.name} (${updatedUser.email}).`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return { success: true, user: updatedUser };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        projects,
        tasks,
        files,
        versions,
        qaSubmissions,
        approvals,
        feedbackItems,
        notifications,
        chatMessages,
        activityLogs,
        clients,
        adminConfig,
        selectedProjectId,
        activeProjectTab,
        isSearchOpen,
        activeNavSection,
        isNewRequestOpen,
        isSidebarCollapsed,
        themeMode,
        isAuthenticated,
        isAuthModalOpen,
        authModalMode,
        isProfileModalOpen,
        setIsAuthModalOpen,
        setAuthModalMode,
        setIsProfileModalOpen,
        registerUser,
        loginUser,
        forgotPassword,
        resetPassword,
        logoutUser,
        suspendUser,
        reactivateUser,
        deleteUser,
        updateUserPassword,
        updateUserProfile,
        setCurrentUser,
        setSelectedProjectId,
        setActiveProjectTab,
        setIsSearchOpen,
        setActiveNavSection,
        setIsNewRequestOpen,
        setIsSidebarCollapsed,
        setThemeMode,
        toggleThemeMode,
        createProject,
        updateProject,
        updateBriefData,
        lockBrief,
        unlockBrief,
        changeProjectStage,
        createTask,
        updateTaskStatus,
        deleteTask,
        uploadFile,
        deleteFile,
        updateFile,
        uploadDeliverableVersion,
        exportDatabaseJson,
        importDatabaseJson,
        syncWithLocalApi,
        pushToLocalApi,
        submitQA,
        submitClientApproval,
        addFeedbackItem,
        updateFeedbackStatus,
        sendChatMessage,
        deleteChatMessage,
        toggleImportantMessage,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        toggleNotificationRead,
        deleteNotification,
        clearReadNotifications,
        addNotification,
        updateAdminConfig,
        updateClient,
        addClient,
        resetAllDataToDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
