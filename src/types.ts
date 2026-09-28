export type UserRole =
  | 'super_admin'
  | 'department_manager'
  | 'account_manager'
  | 'designer'
  | 'qa_user'
  | 'client';

export type DepartmentId =
  | 'marketing'
  | 'incentive_travel'
  | 'online_ram'
  | 'development';

export type WorkflowStage =
  | 'REQUESTED'
  | 'BRIEF_VALIDATION'
  | 'BRIEF_LOCKED'
  | 'PRODUCTION'
  | 'INTERNAL_QA'
  | 'CLIENT_REVIEW'
  | 'REVISION'
  | 'CLIENT_APPROVAL'
  | 'FINAL_QA'
  | 'RELEASE_PUBLISH'
  | 'ARCHIVE';

export type ProjectStatus =
  | 'on_track'
  | 'due_soon'
  | 'overdue'
  | 'waiting'
  | 'revision_required'
  | 'blocked'
  | 'completed';

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roleTitle: string;
  departmentId: DepartmentId;
  avatar: string;
  active: boolean;
  isSuspended?: boolean;
  suspendedReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  workloadCount?: number;
  createdAt?: string;
}

export interface Department {
  id: DepartmentId;
  name: string;
  code: string;
  description: string;
  active: boolean;
  iconName: string;
  managerId: string;
  requestTypeCount?: number;
}

export interface RequestTypeField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'file' | 'tags' | 'url' | 'multiselect';
  required: boolean;
  placeholder?: string;
  options?: string[];
  helperText?: string;
  section: 'content' | 'branding' | 'specifications' | 'deliverables' | 'schedule';
}

export interface RequestTypeConfig {
  id: string;
  departmentId: DepartmentId;
  name: string;
  description: string;
  active: boolean;
  fields: RequestTypeField[];
  defaultQaItems: string[];
}

export interface Project {
  id: string;
  projectNumber: number;
  clientId: string;
  departmentId: DepartmentId;
  requestTypeId: string;
  projectName: string;
  campaignName: string;
  description: string;
  priority: PriorityLevel;
  stage: WorkflowStage;
  status: ProjectStatus;
  version: string;
  accountableUserId: string;
  projectOwnerId: string;
  qaOwnerId: string;
  approverId: string;
  contributorIds: string[];
  createdAt: string;
  updatedAt: string;
  briefDueDate: string;
  briefLockedAt?: string;
  briefLockedBy?: string;
  productionDueDate: string;
  internalQaDueDate: string;
  clientReviewDueDate: string;
  clientApprovalDueDate: string;
  finalQaDueDate: string;
  releaseDate: string;
  dependencies: string;
  risks: string;
  blockers: string;
  externalSuppliers: string;
  nextAction: {
    task: string;
    ownerName: string;
    dueDate: string;
  };
  approvalStatus: 'pending' | 'approved' | 'approved_with_notes' | 'rejected' | 'none';
  isBriefLocked: boolean;
  isVersionLocked: boolean;
  briefData: Record<string, any>;
  briefCompleteness: number;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  ownerId: string;
  departmentId: DepartmentId;
  priority: PriorityLevel;
  startDate: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'waiting' | 'blocked' | 'complete' | 'cancelled';
  completedAt?: string;
  commentsCount?: number;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  filename: string;
  size: string;
  type: string;
  version: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  category:
    | 'brief'
    | 'ci_brand'
    | 'content'
    | 'images'
    | 'videos'
    | 'working_files'
    | 'proofs'
    | 'qa'
    | 'client_feedback'
    | 'approved_files'
    | 'final_files';
  url: string;
  description?: string;
}

export interface DeliverableVersion {
  id: string;
  projectId: string;
  versionNumber: string;
  title: string;
  fileUrl?: string;
  previewUrl?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  description: string;
  notes?: string;
  status: 'draft' | 'in_qa' | 'client_review' | 'revision_requested' | 'approved' | 'locked';
  isLocked: boolean;
  qaResult?: 'PASS' | 'PASS_WITH_NOTES' | 'FAIL';
  qaNotes?: string;
  approvedAt?: string;
  approverName?: string;
  changelog?: string;
}

export interface QACheckItem {
  id: string;
  projectId: string;
  versionId: string;
  title: string;
  label?: string;
  category?: string;
  status?: 'PASS' | 'FAIL' | 'NA';
  description?: string;
  checked: boolean;
  notes?: string;
  checkedBy?: string;
  checkedAt?: string;
}

export interface QASubmission {
  id: string;
  projectId: string;
  versionId: string;
  versionNumber?: string;
  result: 'PASS' | 'PASS_WITH_NOTES' | 'FAIL';
  performedBy: string;
  performedByName: string;
  performedAt: string;
  checklist?: QACheckItem[];
  items?: QACheckItem[];
  overallNotes: string;
  passedCount?: number;
  failedCount?: number;
  naCount?: number;
}

export interface ClientApprovalRecord {
  id: string;
  projectId: string;
  versionId: string;
  versionNumber?: string;
  clientId?: string;
  decision: 'APPROVED' | 'APPROVED_WITH_NOTES' | 'NOT_APPROVED' | 'REJECTED';
  clientName: string;
  clientPosition: string;
  confirmationText?: string;
  comments: string;
  changesRequested?: string[];
  approvedAt: string;
  signatureHash?: string;
}

export interface FeedbackItem {
  id: string;
  projectId: string;
  version: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  feedbackText: string;
  attachmentUrl?: string;
  assignedTo: string;
  assignedToName: string;
  priority: PriorityLevel;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected' | 'closed';
  type: 'action_required' | 'for_information';
}

export type NotificationType =
  | 'new_request'
  | 'brief_submitted'
  | 'brief_incomplete'
  | 'brief_locked'
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_overdue'
  | 'client_feedback'
  | 'internal_feedback'
  | 'revision_requested'
  | 'qa_required'
  | 'qa_failed'
  | 'approval_required'
  | 'approval_received'
  | 'approval_rejected'
  | 'final_release'
  | 'project_completed'
  | 'account_created'
  | 'system_alert';

export interface Notification {
  id: string;
  userId: string;
  projectId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  targetTab?: string;
}

export interface ChatMessage {
  id: string;
  projectId?: string;
  recipientId?: string;
  channelId?: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  createdAt: string;
  attachments?: string[];
  mentions?: string[];
  referencedTaskId?: string;
  referencedVersion?: string;
  isImportant?: boolean;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  versionRef?: string;
  timestamp: string;
  previousStage?: WorkflowStage;
  newStage?: WorkflowStage;
  metadata?: Record<string, any>;
}

export interface ClientRecord {
  id: string;
  name: string;
  code: string;
  logoUrl: string;
  brandGuidelines: string;
  ciDocumentUrl?: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  primaryEmail?: string;
  brandColors?: string[];
  fontFamily?: string;
  guidelinesNotes?: string;
  website: string;
  notes: string;
  defaultCiColors: string[];
  fontRequirements: string;
  activeProjectsCount?: number;
}

export interface AdminConfig {
  appName: string;
  appSubtitle: string;
  emailNotifications: {
    newRequests: boolean;
    assignment: boolean;
    taskDue: boolean;
    taskOverdue: boolean;
    feedback: boolean;
    approval: boolean;
    qa: boolean;
    completion: boolean;
  };
  escalationRules: {
    notify3DaysBefore: boolean;
    notify1DayBefore: boolean;
    notifyDueToday: boolean;
    notifyOverdue: boolean;
    escalate2DaysOverdue: boolean;
  };
  activeDepartments: Record<DepartmentId, boolean>;
  workflowRules: {
    enforceBriefLockForProduction: boolean;
    enforceQABeforeClientReview: boolean;
    enforceApprovalBeforeRelease: boolean;
    allowManagerOverride: boolean;
    logAllActions?: boolean;
  };
}

export type ActiveNavSection =
  | 'dashboard'
  | 'my_requests'
  | 'all_projects'
  | 'new_request'
  | 'my_tasks'
  | 'weekly_summary'
  | 'team'
  | 'calendar'
  | 'notifications'
  | 'messages'
  | 'approvals'
  | 'reports'
  | 'files'
  | 'clients'
  | 'departments'
  | 'tracker'
  | 'settings'
  | 'administration';

export type ThemeMode = 'dark' | 'light';

export interface DatabaseBackupPayload {
  version: string;
  exportedAt: string;
  exportedBy: string;
  users?: User[];
  projects?: Project[];
  tasks?: Task[];
  files?: ProjectFile[];
  versions?: DeliverableVersion[];
  qaSubmissions?: QASubmission[];
  approvals?: ClientApprovalRecord[];
  feedbackItems?: FeedbackItem[];
  notifications?: Notification[];
  chatMessages?: ChatMessage[];
  activityLogs?: ActivityLog[];
  clients?: ClientRecord[];
  adminConfig?: AdminConfig;
}

export interface ApiSyncResult {
  success: boolean;
  message: string;
  syncedProjectsCount?: number;
  syncedFilesCount?: number;
  timestamp: string;
  rawResponse?: any;
}

