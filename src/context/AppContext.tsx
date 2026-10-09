import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  PriorityLevel,
  ProjectStatus,
  QASubmission,
  Task,
  ThemeMode,
  User,
  UserRole,
  WorkflowStage,
} from '../types';
import { calculateBriefCompleteness } from '../data/briefSchemas';
import { DEFAULT_CLIENTS } from '../data/defaultClients';
import {
  deleteLocalFileBlob,
  purgeLocalIndexedDBVault,
} from '../utils/localFileStore';
import {
  isPasswordHashed,
  hashPasswordSync,
} from '../utils/security';
import { safeRandomUUID } from '../utils/uuid';
const EMPTY_USER: User = {
  id: '',
  name: '',
  email: '',
  role: 'super_admin',
  roleTitle: '',
  departmentId: 'development',
  avatar: '',
  active: false,
  workloadCount: 0,
};

const EMPTY_ADMIN_CONFIG: AdminConfig = {
  appName: 'UICMS Creative Workflow',
  appSubtitle: 'Brief. Create. Review. Approve. Deliver.',
  emailNotifications: {
    newRequests: true,
    assignment: true,
    taskDue: true,
    taskOverdue: true,
    feedback: true,
    approval: true,
    qa: true,
    completion: true,
  },
  escalationRules: {
    notify3DaysBefore: true,
    notify1DayBefore: true,
    notifyDueToday: true,
    notifyOverdue: true,
    escalate2DaysOverdue: true,
  },
  activeDepartments: {
    marketing: true,
    incentive_travel: true,
    online_ram: true,
    development: true,
  },
  workflowRules: {
    enforceBriefLockForProduction: true,
    enforceQABeforeClientReview: true,
    enforceApprovalBeforeRelease: true,
    allowManagerOverride: true,
    logAllActions: true,
  },
};

const DB_DATA_ENDPOINTS = [
  '/php-backend/api/data.php',
  'http://localhost/php-backend/api/data.php',
  'http://127.0.0.1/php-backend/api/data.php',
  'http://localhost:80/php-backend/api/data.php',
  'http://localhost:8080/php-backend/api/data.php',
  'http://localhost:8088/php-backend/api/data.php',
  'http://localhost:8000/php-backend/api/data.php',
  'http://localhost/uicms/php-backend/api/data.php',
  'http://localhost/uicms-workflow/php-backend/api/data.php',
];

const persistTableToBackend = async (
  tableName: string,
  data: any[],
  extraPayload?: Record<string, any>
): Promise<boolean> => {
  const payload = {
    table: tableName,
    data,
    [tableName]: data,
    ...(tableName === 'chat_messages' ? { chatMessages: data } : {}),
    ...(tableName === 'activity_logs' ? { activityLogs: data } : {}),
    ...(extraPayload || {}),
  };

  let persisted = false;
  for (const endpoint of DB_DATA_ENDPOINTS) {
    try {
      const isCrossDomain = endpoint.startsWith('http://') || endpoint.startsWith('https://');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: isCrossDomain ? 'omit' : 'include',
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        persisted = true;
        console.log(`[Database Sync] Successfully saved ${data.length} records to table "${tableName}" on endpoint: ${endpoint}`);
        break;
      } else {
        const text = await response.text();
        console.warn(`[Database Sync Warning] Endpoint ${endpoint} returned status ${response.status} when saving table "${tableName}":`, text);
      }
    } catch (err: any) {
      console.warn(`[Database Connection Warning] Failed to reach endpoint ${endpoint} for table "${tableName}":`, err.message || err);
    }
  }
  return persisted;
};

const deleteRecordFromBackend = async (
  tableName: string,
  id: string
): Promise<boolean> => {
  const payload = {
    action: 'delete',
    table: tableName,
    id,
  };

  let deleted = false;
  for (const endpoint of DB_DATA_ENDPOINTS) {
    try {
      const isCrossDomain = endpoint.startsWith('http://') || endpoint.startsWith('https://');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: isCrossDomain ? 'omit' : 'include',
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        deleted = true;
        console.log(`[Database Sync] Successfully deleted record (ID: ${id}) from table "${tableName}" on endpoint: ${endpoint}`);
        break;
      } else {
        const text = await response.text();
        console.warn(`[Database Sync Warning] Endpoint ${endpoint} returned status ${response.status} when deleting from table "${tableName}":`, text);
      }
    } catch (err: any) {
      console.warn(`[Database Connection Warning] Failed to reach endpoint ${endpoint} for deleting in table "${tableName}":`, err.message || err);
    }
  }
  return deleted;
};

const executeBackendAction = async (
  actionPayload: Record<string, any>
): Promise<boolean> => {
  let executed = false;
  for (const endpoint of DB_DATA_ENDPOINTS) {
    try {
      const isCrossDomain = endpoint.startsWith('http://') || endpoint.startsWith('https://');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: isCrossDomain ? 'omit' : 'include',
        body: JSON.stringify(actionPayload),
      });
      if (response.ok) {
        executed = true;
        break;
      }
    } catch {}
  }
  return executed;
};
const AUTH_ENDPOINTS = [
  '/php-backend/api/auth.php',
  'http://localhost/php-backend/api/auth.php',
  'http://127.0.0.1/php-backend/api/auth.php',
  'http://localhost:80/php-backend/api/auth.php',
  'http://localhost:8080/php-backend/api/auth.php',
  'http://localhost:8088/php-backend/api/auth.php',
  'http://localhost:8000/php-backend/api/auth.php',
  'http://localhost/uicms/php-backend/api/auth.php',
  'http://localhost/uicms-workflow/php-backend/api/auth.php',
];
const AUTH_ENDPOINT = '/php-backend/api/auth.php';
const SESSION_STORAGE_KEY = 'uicms_auth_session_v1';
const SESSION_TIMEOUT_NOTICE_KEY = 'uicms_auth_timeout_notice_v1';
const INACTIVITY_TIMEOUT_SECONDS = 60 * 60; // 60 minutes session duration
const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_SECONDS * 1000;

const persistSessionActivity = (lastActivityAt: number, userOverride?: User): void => {
  try {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
    const session = rawSession ? JSON.parse(rawSession) : {};
    const userToSave = userOverride || session.user;
    if (userToSave && userToSave.id) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...session, user: userToSave, lastActivityAt }));
    }
  } catch {}
};

const postAuthAction = async (action: string, payload: Record<string, unknown> = {}) => {
  let lastErrorMessage = '';
  for (const endpoint of AUTH_ENDPOINTS) {
    try {
      const isCrossDomain = endpoint.startsWith('http://') || endpoint.startsWith('https://');
      const response = await fetch(`${endpoint}?action=${encodeURIComponent(action)}`, {
        method: 'POST',
        credentials: isCrossDomain ? 'omit' : 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, action }),
      });
      const result = await response.json().catch(() => null);
      if (result) {
        if (response.ok && result.status === 'success') {
          return {
            success: true,
            ...result,
          };
        }
        if (result.message || result.error) {
          lastErrorMessage = result.message || result.error;
          if (
            response.status === 400 ||
            response.status === 401 ||
            response.status === 403 ||
            response.status === 409 ||
            response.status === 422
          ) {
            return {
              success: false,
              error: lastErrorMessage,
              ...result,
            };
          }
        }
      }
    } catch {
      // try next candidate endpoint
    }
  }
  return { success: false, error: lastErrorMessage || 'Could not connect to the authentication service.' };
};

const asBoolean = (value: unknown, defaultVal = false): boolean => {
  if (value === undefined || value === null) return defaultVal;
  return value === true || value === 1 || value === '1' || value === 'true';
};

const parseJsonArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const parseJsonObject = (value: unknown, fallback: Record<string, any> = {}): Record<string, any> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {
      // Ignore invalid JSON and use supplied fallback.
    }
  }

  return fallback;
};

const normalizeUsers = (data: any[] = []): User[] =>
  data.map((user) => ({
    id: user.id || '',
    name: user.name || 'Unknown User',
    email: user.email || '',
    role: (user.role || 'designer') as UserRole,
    roleTitle: user.role_title || user.roleTitle || user.role || 'Team Member',
    departmentId: (user.department_id || user.departmentId || 'marketing') as DepartmentId,
    avatar: user.avatar || '',
    active: asBoolean(user.active, true),
    isSuspended: asBoolean(user.is_suspended ?? user.isSuspended, false),
    suspendedReason: user.suspension_reason || user.suspendedReason || '',
    workloadCount: Number(user.workload_count ?? user.workloadCount ?? 0),
    createdAt: user.created_at || user.createdAt || new Date().toISOString(),
  }));

const normalizeClients = (data: any[] = []): ClientRecord[] => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  const valid = data.filter((c) => c && typeof c === 'object');
  if (valid.length === 0) return [];

  const mapped = valid.map((client, index) => {
    const rawId = client.id || client.client_id || client.code;
    const fallbackDefault = DEFAULT_CLIENTS[index % DEFAULT_CLIENTS.length] || DEFAULT_CLIENTS[0];
    const id = rawId ? String(rawId) : fallbackDefault.id;
    const name = String(client.name || client.client_name || fallbackDefault.name);
    const code = String(client.code || client.client_code || fallbackDefault.code);
    return {
      id,
      name,
      code,
      logoUrl: client.logo_url || client.logoUrl || fallbackDefault.logoUrl || '',
      brandGuidelines: client.brand_guidelines || client.brandGuidelines || fallbackDefault.brandGuidelines || '',
      ciDocumentUrl: client.ci_document_url || client.ciDocumentUrl || fallbackDefault.ciDocumentUrl,
      primaryContact: {
        name: client.primary_contact_name || client.primaryContact?.name || fallbackDefault.primaryContact.name,
        email: client.primary_contact_email || client.primaryContact?.email || fallbackDefault.primaryContact.email,
        phone: client.primary_contact_phone || client.primaryContact?.phone || fallbackDefault.primaryContact.phone,
        position: client.primary_contact_position || client.primaryContact?.position || fallbackDefault.primaryContact.position,
      },
      primaryEmail: client.primary_contact_email || client.primaryEmail || fallbackDefault.primaryEmail || '',
      brandColors: parseJsonArray(client.default_ci_colors || client.brandColors || client.defaultCiColors || fallbackDefault.brandColors),
      fontFamily: client.font_requirements || client.fontRequirements || fallbackDefault.fontFamily || '',
      guidelinesNotes: client.notes || client.guidelinesNotes || fallbackDefault.guidelinesNotes || '',
      website: client.website || fallbackDefault.website || '',
      notes: client.notes || fallbackDefault.notes || '',
      defaultCiColors: parseJsonArray(client.default_ci_colors || client.defaultCiColors || fallbackDefault.defaultCiColors),
      fontRequirements: client.font_requirements || client.fontRequirements || fallbackDefault.fontRequirements || '',
      activeProjectsCount: Number(client.active_projects_count ?? client.activeProjectsCount ?? fallbackDefault.activeProjectsCount ?? 0),
    };
  });
  return mapped;
};

const normalizeProjects = (data: any[] = []): Project[] =>
  data.map((project) => ({
    id: project.id || '',
    projectNumber: Number(project.project_number ?? project.projectNumber ?? 0),
    clientId: project.client_id || project.clientId || '',
    departmentId: (project.department_id || project.departmentId || 'marketing') as DepartmentId,
    requestTypeId: project.request_type_id || project.requestTypeId || '',
    projectName: project.project_name || project.projectName || 'Untitled Project',
    campaignName: project.campaign_name || project.campaignName || '',
    description: project.description || '',
    priority: (project.priority || 'medium') as PriorityLevel,
    stage: (project.stage === 'FINAL_RELEASE' ? 'RELEASE_PUBLISH' : project.stage === 'COMPLETED' ? 'ARCHIVE' : project.stage || 'REQUESTED') as WorkflowStage,
    status: (project.status || 'on_track') as ProjectStatus,
    version: project.version || 'V0.1',
    accountableUserId: project.accountable_user_id || project.accountableUserId || '',
    projectOwnerId: project.project_owner_id || project.projectOwnerId || '',
    qaOwnerId: project.qa_owner_id || project.qaOwnerId || '',
    approverId: project.approver_id || project.approverId || '',
    contributorIds: parseJsonArray(project.contributor_ids || project.contributorIds),
    createdAt: project.created_at || project.createdAt || new Date().toISOString(),
    updatedAt: project.updated_at || project.updatedAt || new Date().toISOString(),
    briefDueDate: project.brief_due_date || project.briefDueDate || new Date().toISOString().split('T')[0],
    briefLockedAt: project.brief_locked_at || project.briefLockedAt,
    briefLockedBy: project.brief_locked_by || project.briefLockedBy,
    productionDueDate: project.production_due_date || project.productionDueDate || new Date().toISOString().split('T')[0],
    internalQaDueDate: project.internal_qa_due_date || project.internalQaDueDate || new Date().toISOString().split('T')[0],
    clientReviewDueDate: project.client_review_due_date || project.clientReviewDueDate || new Date().toISOString().split('T')[0],
    clientApprovalDueDate: project.client_approval_due_date || project.clientApprovalDueDate || new Date().toISOString().split('T')[0],
    finalQaDueDate: project.final_qa_due_date || project.finalQaDueDate || new Date().toISOString().split('T')[0],
    releaseDate: project.release_date || project.releaseDate || new Date().toISOString().split('T')[0],
    dependencies: project.dependencies || '',
    risks: project.risks || '',
    blockers: project.blockers || '',
    externalSuppliers: project.external_suppliers || project.externalSuppliers || '',
    nextAction: {
      task: project.next_action_task || project.nextAction?.task || 'Review project progress',
      ownerName: project.next_action_owner || project.nextAction?.ownerName || 'Project Owner',
      dueDate: project.next_action_due || project.nextAction?.dueDate || new Date().toISOString().split('T')[0],
    },
    approvalStatus: (project.approval_status === 'changes_requested' ? 'changes_requested' : project.approval_status || project.approvalStatus || 'none') as Project['approvalStatus'],
    isBriefLocked: asBoolean(project.is_brief_locked ?? project.isBriefLocked),
    isVersionLocked: asBoolean(project.is_version_locked ?? project.isVersionLocked),
    briefData: parseJsonObject(project.brief_data ?? project.briefData, {}),
    briefCompleteness: Number(project.brief_completeness ?? project.briefCompleteness ?? 0),
  }));

const normalizeTasks = (data: any[] = []): Task[] =>
  data.map((task) => ({
    id: task.id || '',
    projectId: task.project_id || task.projectId || '',
    name: task.title || task.name || 'Untitled Task',
    description: task.description || '',
    ownerId: task.assigned_to_user_id || task.ownerId || '',
    departmentId: (task.department_id || task.departmentId || 'marketing') as DepartmentId,
    priority: (task.priority || 'medium') as PriorityLevel,
    startDate: task.start_date || task.startDate || task.created_at || new Date().toISOString().split('T')[0],
    dueDate: task.due_date || task.dueDate || new Date().toISOString().split('T')[0],
    status: (task.status === 'todo' ? 'not_started' : task.status === 'completed' ? 'complete' : task.status || 'not_started') as Task['status'],
    roleRequired: task.role_required || task.roleRequired || 'designer',
    assignedToName: task.assigned_to_name || task.assignedToName || '',
    stage: task.stage as WorkflowStage | undefined,
    isBlocking: asBoolean(task.is_blocking ?? task.isBlocking),
    estimatedHours: Number(task.estimated_hours ?? task.estimatedHours ?? 0),
    actualHours: Number(task.actual_hours ?? task.actualHours ?? 0),
    checklist: parseJsonArray(task.checklist),
    completedAt: task.completed_at || task.completedAt,
    commentsCount: Number(task.comments_count ?? task.commentsCount ?? 0),
  }));

const normalizeVersions = (data: any[] = []): DeliverableVersion[] =>
  data.map((version) => ({
    id: version.id || '',
    projectId: version.project_id || version.projectId || '',
    versionNumber: version.version_number || version.versionNumber || 'V0.1',
    title: version.title || 'Untitled Version',
    fileUrl: version.file_url || version.fileUrl,
    previewUrl: version.preview_url || version.previewUrl,
    uploadedBy: version.uploaded_by || version.uploadedBy || '',
    uploadedByName: version.uploaded_by_name || version.uploadedByName || '',
    uploadedAt: version.uploaded_at || version.uploadedAt || new Date().toISOString(),
    description: version.description || '',
    notes: version.qa_notes || version.notes,
    status: (version.status || 'draft') as DeliverableVersion['status'],
    isLocked: asBoolean(version.is_locked ?? version.isLocked),
    qaResult: (version.qa_result || version.qaResult) as DeliverableVersion['qaResult'],
    qaNotes: version.qa_notes || version.qaNotes,
    approvedAt: version.approved_at || version.approvedAt,
    approverName: version.approver_name || version.approverName,
    changelog: version.changelog,
  }));

const normalizeQaSubmissions = (data: any[] = []): QASubmission[] =>
  data.map((entry) => ({
    id: entry.id || '',
    projectId: entry.project_id || entry.projectId || '',
    versionId: entry.version_id || entry.versionId || '',
    versionNumber: entry.version_number || entry.versionNumber,
    result: (entry.result || 'PASS') as QASubmission['result'],
    performedBy: entry.performed_by || entry.performedBy || '',
    performedByName: entry.performed_by_name || entry.performedByName || 'QA Lead',
    performedAt: entry.performed_at || entry.performedAt || new Date().toISOString(),
    checklist: parseJsonArray(entry.checklist || entry.items || entry.checklistItems),
    items: parseJsonArray(entry.checklist || entry.items || entry.checklistItems),
    overallNotes: entry.overall_notes || entry.overallNotes || '',
    passedCount: Number(entry.passed_count ?? entry.passedCount ?? 0),
    failedCount: Number(entry.failed_count ?? entry.failedCount ?? 0),
    naCount: Number(entry.na_count ?? entry.naCount ?? 0),
  }));

const normalizeApprovals = (data: any[] = []): ClientApprovalRecord[] =>
  data.map((approval) => ({
    id: approval.id || '',
    projectId: approval.project_id || approval.projectId || '',
    versionId: approval.version_id || approval.versionId || '',
    versionNumber: approval.version_number || approval.versionNumber,
    clientId: approval.client_id || approval.clientId,
    decision: (approval.decision || 'APPROVED') as ClientApprovalRecord['decision'],
    clientName: approval.client_name || approval.clientName || 'Client',
    clientPosition: approval.client_position || approval.clientPosition || '',
    confirmationText: approval.confirmation_text || approval.confirmationText || '',
    comments: approval.comments || '',
    changesRequested: parseJsonArray(approval.changes_requested || approval.changesRequested),
    approvedAt: approval.approved_at || approval.approvedAt || new Date().toISOString(),
    signatureHash: approval.signature_hash || approval.signatureHash,
  }));

const normalizeFeedbackItems = (data: any[] = []): FeedbackItem[] =>
  data.map((item) => ({
    id: item.id || '',
    projectId: item.project_id || item.projectId || '',
    version: item.version || 'V0.1',
    submittedBy: item.submitted_by || item.submittedBy || '',
    submittedByName: item.submitted_by_name || item.submittedByName || 'User',
    submittedAt: item.submitted_at || item.submittedAt || new Date().toISOString(),
    feedbackText: item.feedback_text || item.feedbackText || '',
    attachmentUrl: item.attachment_url || item.attachmentUrl,
    assignedTo: item.assigned_to || item.assignedTo || '',
    assignedToName: item.assigned_to_name || item.assignedToName || 'Assignee',
    priority: (item.priority || 'medium') as PriorityLevel,
    status: (item.status || 'open') as FeedbackItem['status'],
    type: (item.type || 'action_required') as FeedbackItem['type'],
  }));

const normalizeNotifications = (data: any[] = []): Notification[] =>
  data.map((notification) => ({
    id: notification.id || '',
    userId: notification.user_id || notification.userId || '',
    projectId: notification.project_id || notification.projectId,
    type: (notification.type || 'system_alert') as Notification['type'],
    title: notification.title || 'Notification',
    message: notification.message || notification.text || '',
    read: asBoolean(notification.is_read ?? notification.read),
    createdAt: notification.created_at || notification.createdAt || notification.timestamp || new Date().toISOString(),
    targetTab: notification.target_tab || notification.targetTab,
  }));

const normalizeChatMessages = (data: any[] = []): ChatMessage[] =>
  data.map((message) => {
    const rawProjectId = message.project_id || message.projectId;
    const rawRecipientId = message.recipient_id || message.recipientId;
    const rawChannelId = message.channel_id || message.channelId;

    const cleanProjectId = rawProjectId && rawProjectId !== 'SYSTEM' && !rawProjectId.startsWith('dept-') ? rawProjectId : undefined;
    const cleanRecipientId = rawRecipientId && rawRecipientId.trim() ? rawRecipientId : undefined;
    const cleanChannelId = rawChannelId && rawChannelId.trim()
      ? rawChannelId
      : (!cleanProjectId && !cleanRecipientId ? (rawProjectId?.startsWith('dept-') ? rawProjectId : 'general') : undefined);

    return {
      id: message.id || '',
      projectId: cleanProjectId,
      recipientId: cleanRecipientId,
      channelId: cleanChannelId,
      senderId: message.sender_id || message.senderId || '',
      senderName: message.sender_name || message.senderName || 'User',
      senderAvatar: message.sender_avatar || message.senderAvatar || '',
      message: message.message || message.text || '',
      createdAt: message.created_at || message.createdAt || message.timestamp || new Date().toISOString(),
      attachments: parseJsonArray(message.attachments),
      mentions: parseJsonArray(message.mentions),
      referencedTaskId: message.referenced_task_id || message.referencedTaskId,
      referencedVersion: message.referenced_version || message.referencedVersion,
      isImportant: asBoolean(message.is_important ?? message.isImportant),
      readBy: parseJsonArray(message.read_by || message.readBy),
    };
  });

const normalizeActivityLogs = (data: any[] = []): ActivityLog[] =>
  data.map((log) => ({
    id: log.id || '',
    projectId: log.project_id || log.projectId || '',
    userId: log.user_id || log.userId || '',
    userName: log.user_name || log.userName || 'User',
    action: log.action || 'UPDATE',
    description: log.description || '',
    versionRef: log.version_ref || log.versionRef,
    timestamp: log.timestamp || new Date().toISOString(),
    previousStage: (log.previous_stage || log.previousStage) as WorkflowStage | undefined,
    newStage: (log.new_stage || log.newStage) as WorkflowStage | undefined,
    metadata: parseJsonObject(log.metadata),
  }));

const normalizeAdminConfig = (data: any): AdminConfig => {
  const adminSettings = data && typeof data === 'object' ? data : {};
  const keyedSettings = Array.isArray(adminSettings)
    ? Object.fromEntries(
        adminSettings.map((setting: any) => [setting.setting_key || setting.key, setting.setting_value || setting.value || {}])
      )
    : adminSettings;
  const systemConfig = keyedSettings.system_config || keyedSettings.systemConfig || keyedSettings;
  const config = parseJsonObject(systemConfig, EMPTY_ADMIN_CONFIG);

  return {
    appName: config.appName || EMPTY_ADMIN_CONFIG.appName,
    appSubtitle: config.appSubtitle || EMPTY_ADMIN_CONFIG.appSubtitle,
    emailNotifications: {
      ...EMPTY_ADMIN_CONFIG.emailNotifications,
      ...(config.emailNotifications || {}),
    },
    escalationRules: {
      ...EMPTY_ADMIN_CONFIG.escalationRules,
      ...(config.escalationRules || {}),
    },
    activeDepartments: {
      ...EMPTY_ADMIN_CONFIG.activeDepartments,
      ...(config.activeDepartments || {}),
    },
    workflowRules: {
      ...EMPTY_ADMIN_CONFIG.workflowRules,
      ...(config.workflowRules || {}),
    },
  };
};

export interface DatabaseStateFetchResult {
  state: {
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
  };
  source: 'mysql' | 'json_fallback';
  endpointUsed: string;
}

let cachedDatabaseState: DatabaseStateFetchResult | null = null;

const fetchDatabaseState = async (forceRefresh = false): Promise<DatabaseStateFetchResult | null> => {
  if (!forceRefresh && cachedDatabaseState) {
    return cachedDatabaseState;
  }

  // 1. PRIMARY: Explicitly query MySQL REST API endpoints first
  for (const endpoint of DB_DATA_ENDPOINTS) {
    try {
      const isCrossDomain = endpoint.startsWith('http://') || endpoint.startsWith('https://');
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}_t=${Date.now()}`;
      const response = await fetch(url, {
        credentials: isCrossDomain ? 'omit' : 'include',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      // If MySQL endpoint returns 404 or an error, try next candidate
      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) continue;

      const payload = await response.json().catch(() => null);
      if (!payload || payload.status !== 'success') continue;

      const dataset = payload.data || payload;
      const isJsonFallback = payload.source === 'standalone_json_fallback' || payload.source === 'json_fallback';
      
      // If it returned a standalone JSON fallback, we ignore it because SQL database is the ONLY place!
      if (isJsonFallback) {
        continue;
      }

      const nextState = {
        users: normalizeUsers(dataset.users ?? []),
        projects: normalizeProjects(dataset.projects ?? []),
        tasks: normalizeTasks(dataset.tasks ?? []),
        files: (() => {
          const fileRows = dataset.files ?? [];
          if (fileRows.length === 0 && Array.isArray(dataset.versions)) {
            return dataset.versions.map((v: any) => ({
              id: v.id,
              projectId: v.project_id || v.projectId,
              filename: v.title || 'Deliverable',
              size: 'db',
              type: 'application/octet-stream',
              version: v.version_number || v.versionNumber || 'V0.1',
              uploadedBy: v.uploaded_by || v.uploadedBy || '',
              uploadedByName: v.uploaded_by_name || v.uploadedByName || '',
              uploadedAt: v.uploaded_at || v.uploadedAt || new Date().toISOString(),
              category: 'approved_files',
              url: v.file_url || v.fileUrl || '',
              description: v.description || '',
            }));
          }
          return fileRows;
        })(),
        versions: normalizeVersions(dataset.versions ?? []),
        qaSubmissions: normalizeQaSubmissions(dataset.qa_submissions ?? dataset.qaSubmissions ?? []),
        approvals: normalizeApprovals(dataset.client_approvals ?? dataset.approvals ?? []),
        feedbackItems: normalizeFeedbackItems(dataset.feedback_items ?? dataset.feedbackItems ?? []),
        notifications: normalizeNotifications(dataset.notifications ?? []),
        chatMessages: normalizeChatMessages(dataset.chat_messages ?? dataset.chatMessages ?? []),
        activityLogs: normalizeActivityLogs(dataset.activity_logs ?? dataset.activityLogs ?? []),
        clients: normalizeClients(dataset.clients ?? []),
        adminConfig: normalizeAdminConfig(dataset.admin_settings ?? dataset.adminSettings ?? dataset.adminConfig ?? EMPTY_ADMIN_CONFIG),
      };

      const result: DatabaseStateFetchResult = {
        state: nextState,
        source: 'mysql',
        endpointUsed: endpoint,
      };

      cachedDatabaseState = result;
      return result;
    } catch {
      // Endpoint unreachable; continue to next endpoint
    }
  }

  return null;
};

const EMPTY_STATE = () => ({
  users: [],
  currentUser: EMPTY_USER,
  projects: [],
  tasks: [],
  files: [],
  versions: [],
  qaSubmissions: [],
  approvals: [],
  feedbackItems: [],
  notifications: [],
  chatMessages: [],
  activityLogs: [],
  clients: [],
  adminConfig: EMPTY_ADMIN_CONFIG,
});

export interface AppContextType {
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
  importDatabaseJson: (payload: DatabaseBackupPayload | string, mode?: 'replace' | 'merge') => Promise<{ success: boolean; message: string; details?: any }>;
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
  markMessagesAsRead: (messageIds: string[]) => void;

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

  // Authentication, Session & Inactivity Timeout
  databaseReady: boolean;
  isAuthenticated: boolean;
  sessionRemainingSeconds: number;
  inactivityNotice: string | null;
  setInactivityNotice: (notice: string | null) => void;
  resetInactivityTimer: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot_password';
  isProfileModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  setAuthModalMode: (mode: 'login' | 'register' | 'forgot_password') => void;
  setIsProfileModalOpen: (open: boolean) => void;
  addUser: (userData: {
    name: string;
    email: string;
    personalEmail?: string;
    password?: string;
    role: UserRole;
    roleTitle?: string;
    departmentId: DepartmentId;
    avatar?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  registerUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    roleTitle?: string;
    departmentId: DepartmentId;
    avatar?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  forgotPassword: (
    emailOrPersonal: string,
    personalEmailOverride?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  verifyResetCode: (
    email: string,
    code: string
  ) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetUserEmail: (
    userId: string,
    newWorkEmail: string,
    newPersonalEmail?: string
  ) => { success: boolean; error?: string; user?: User };
  logoutUser: () => void;
  suspendUser: (userId: string, reason: string) => { success: boolean; error?: string };
  reactivateUser: (userId: string) => { success: boolean; error?: string };
  deleteUser: (userId: string, reassignToUserId?: string) => { success: boolean; error?: string };
  updateUserPassword: (userId: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (
    userId: string,
    updates: Partial<Pick<User, 'name' | 'email' | 'personalEmail' | 'avatar' | 'roleTitle' | 'departmentId' | 'role'>>
  ) => { success: boolean; error?: string; user?: User };
  encryptAllUserPasswords: () => { success: boolean; count: number };
  refreshDatabase: () => Promise<boolean>;
  purgeLocalBrowserDataAndSync: () => Promise<{ success: boolean; message: string; data?: any }>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const emptyState = EMPTY_STATE();
  
  // Read initial session synchronously from localStorage to prevent auth layout flashes
  const initialSessionData = (() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const userObj = parsed.user || (parsed.id && parsed.email ? parsed : null);
        const lastActive = parsed.lastActivityAt || 0;
        if (userObj && (Date.now() - lastActive < INACTIVITY_TIMEOUT_MS)) {
          return { user: { ...EMPTY_USER, ...userObj }, isAuthenticated: true };
        }
      }
    } catch {}
    return { user: emptyState.currentUser, isAuthenticated: false };
  })();

  const [databaseReady, setDatabaseReady] = useState(true);
  const [applicationStateLoaded, setApplicationStateLoaded] = useState(false);

  const [users, setUsers] = useState<User[]>(emptyState.users);
  const [currentUser, setCurrentUser] = useState<User>(initialSessionData.user);
  const [projects, setProjects] = useState<Project[]>(emptyState.projects);
  const [tasks, setTasks] = useState<Task[]>(emptyState.tasks);
  const [files, setFiles] = useState<ProjectFile[]>(emptyState.files);
  const [versions, setVersions] = useState<DeliverableVersion[]>(emptyState.versions);
  const [qaSubmissions, setQaSubmissions] = useState<QASubmission[]>(emptyState.qaSubmissions);
  const [approvals, setApprovals] = useState<ClientApprovalRecord[]>(emptyState.approvals);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(emptyState.feedbackItems);
  const [notifications, setNotifications] = useState<Notification[]>(emptyState.notifications);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(emptyState.chatMessages);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(emptyState.activityLogs);
  const [clients, setClients] = useState<ClientRecord[]>(emptyState.clients);
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(emptyState.adminConfig);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<string>('brief');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeNavSection, setActiveNavSection] = useState<ActiveNavSection>('dashboard');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Auth, Profile Modal & Session Inactivity States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSessionData.isAuthenticated);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(!initialSessionData.isAuthenticated);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Inactivity Auto-Logout Timer State
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(INACTIVITY_TIMEOUT_SECONDS);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const lastActivityRef = React.useRef<number>(Date.now());
  const lastSavedStateRef = React.useRef<string>('');

  const resetInactivityTimer = React.useCallback(() => {
    lastActivityRef.current = Date.now();
    setSessionRemainingSeconds(INACTIVITY_TIMEOUT_SECONDS);
    persistSessionActivity(lastActivityRef.current);
  }, []);

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('uicms_theme_mode');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {}
    return 'dark';
  });

  const applyDatabaseState = (state: any) => {
    if (!state) return;
    const actualState = state.state || state;
    const appliedUsers = actualState.users ?? [];
    const appliedProjects = actualState.projects ?? [];
    const appliedTasks = actualState.tasks ?? [];
    const appliedFiles = actualState.files ?? [];
    const appliedVersions = actualState.versions ?? [];
    const appliedQaSubmissions = actualState.qaSubmissions ?? [];
    const appliedApprovals = actualState.approvals ?? [];
    const appliedFeedbackItems = actualState.feedbackItems ?? [];
    const appliedNotifications = actualState.notifications ?? [];
    const appliedChatMessages = actualState.chatMessages ?? [];
    const appliedActivityLogs = actualState.activityLogs ?? [];
    const appliedClients = actualState.clients ?? [];
    const appliedAdminConfig = actualState.adminConfig;

    setUsers(appliedUsers);
    setProjects(appliedProjects);
    setTasks(appliedTasks);
    setFiles(appliedFiles);
    setVersions(appliedVersions);
    setQaSubmissions(appliedQaSubmissions);
    setApprovals(appliedApprovals);
    setFeedbackItems(appliedFeedbackItems);
    setNotifications(appliedNotifications);
    setChatMessages(appliedChatMessages);
    setActivityLogs(appliedActivityLogs);
    setClients(appliedClients);
    setAdminConfig(appliedAdminConfig);
    setApplicationStateLoaded(true);
    setDatabaseReady(true);

    const serializedState = {
      users: appliedUsers,
      clients: appliedClients,
      projects: appliedProjects,
      tasks: appliedTasks,
      files: appliedFiles,
      versions: appliedVersions,
      qa_submissions: appliedQaSubmissions,
      client_approvals: appliedApprovals,
      feedback_items: appliedFeedbackItems,
      notifications: appliedNotifications,
      chat_messages: appliedChatMessages,
      activity_logs: appliedActivityLogs,
      admin_settings: appliedAdminConfig,
    };
    lastSavedStateRef.current = JSON.stringify(serializedState);
  };

  useEffect(() => {
    const hydrateFromDatabase = async () => {
      // 1. Purge all legacy browser-held mock data, IndexedDB vault, and orphaned caches
      try {
        await purgeLocalIndexedDBVault();
        const legacyKeys = [
          'uicms_workflow_v1_store',
          'uicms_workflow_store',
          'uicms_workflow_data',
          'uicms_local_data',
          'uicms_db_cache',
          'uicms_offline_store',
          'uicms_local_storage',
          'uicms_cached_projects',
          'uicms_cached_users',
          'uicms_tasks_cache',
        ];
        legacyKeys.forEach((key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
      } catch {}

      // 2. Explicitly query MySQL REST API first, falling back to JSON only on 404 or connection error
      const fetchResult = await fetchDatabaseState();
      if (fetchResult && fetchResult.state) {
        applyDatabaseState(fetchResult.state);
      }

      // 3. Check for active server-side session or active client-side session
      let sessionUser: User | null = null;
      try {
        const response = await fetch(`${AUTH_ENDPOINT}?action=session`, { credentials: 'include', headers: { Accept: 'application/json' } });
        if (response.ok) {
          const sessionPayload = await response.json().catch(() => null);
          if (sessionPayload?.status === 'success' && sessionPayload.user) {
            sessionUser = sessionPayload.user;
          }
        }
      } catch {}

      // If no server session returned, check client-side session within inactivity limit
      if (!sessionUser) {
        try {
          const stored = localStorage.getItem(SESSION_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            const userObj = parsed.user || (parsed.id && parsed.email ? parsed : null);
            const lastActive = parsed.lastActivityAt || 0;
            if (userObj && Date.now() - lastActive < INACTIVITY_TIMEOUT_MS) {
              sessionUser = userObj;
            }
          }
        } catch {}
      }

      // 4. Strict validation against live MySQL database users:
      // If the user was deleted from MySQL, clear browser session and prompt for login
      const currentDbUsers = fetchResult?.state?.users || [];
      if (sessionUser && currentDbUsers.length > 0) {
        const liveUser = currentDbUsers.find(
          (u: User) => u.id === sessionUser!.id || u.email.toLowerCase() === sessionUser!.email.toLowerCase()
        );
        if (liveUser && liveUser.active && !liveUser.isSuspended) {
          setCurrentUser(liveUser);
          setIsAuthenticated(true);
          setIsAuthModalOpen(false);
          lastActivityRef.current = Date.now();
          setSessionRemainingSeconds(INACTIVITY_TIMEOUT_SECONDS);
          persistSessionActivity(Date.now(), liveUser);
        } else {
          try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(SESSION_TIMEOUT_NOTICE_KEY);
          } catch {}
          setCurrentUser(EMPTY_USER);
          setIsAuthenticated(false);
          setIsAuthModalOpen(true);
        }
      } else if (!sessionUser) {
        setCurrentUser(EMPTY_USER);
        setIsAuthenticated(false);
        setIsAuthModalOpen(true);
      }

      const timeoutNotice = localStorage.getItem(SESSION_TIMEOUT_NOTICE_KEY);
      if (timeoutNotice) setInactivityNotice(timeoutNotice);

      setApplicationStateLoaded(true);
      setDatabaseReady(true);
    };

    hydrateFromDatabase();
  }, []);

  // Window user activity listener to reset inactivity timer when working
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastThrottle = Date.now();
    let lastPersistedActivityAt = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottle > 1000) {
        lastThrottle = now;
        lastActivityRef.current = now;
      }
      if (now - lastPersistedActivityAt >= 5000) {
        persistSessionActivity(now);
        lastPersistedActivityAt = now;
      }
    };

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [isAuthenticated]);

  // Live real-time polling effect disabled per user request (only pull when requested manual sync)

  // Session inactivity timeout interval check
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));

      // Only update remaining seconds state when under 60 seconds (warning zone) or every 30s to prevent render thrashing
      if (remaining <= 60 || remaining % 30 === 0) {
        setSessionRemainingSeconds(remaining);
      }

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        void postAuthAction('logout');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.setItem(
          SESSION_TIMEOUT_NOTICE_KEY,
          'Your session timed out after 60 minutes of inactivity. Please sign in to resume your workspace session.'
        );
        setIsAuthenticated(false);
        setIsAuthModalOpen(true);
        setAuthModalMode('login');
        setInactivityNotice(
          'Your session timed out after 60 minutes of inactivity. Please sign in to resume your workspace session.'
        );

        setActivityLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            projectId: 'SYSTEM',
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'SESSION_TIMEOUT',
            description: `Session expired: ${currentUser.name} was automatically logged out due to inactivity.`,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (!databaseReady || !isAuthenticated || !applicationStateLoaded) return;

    const data = {
      users,
      clients,
      projects,
      tasks,
      files,
      versions,
      qa_submissions: qaSubmissions,
      client_approvals: approvals,
      feedback_items: feedbackItems,
      notifications,
      chat_messages: chatMessages,
      activity_logs: activityLogs,
      admin_settings: adminConfig,
    };

    const serialized = JSON.stringify(data);
    if (serialized === lastSavedStateRef.current) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      lastSavedStateRef.current = serialized;
      try {
        const response = await fetch(DB_DATA_ENDPOINTS[0], {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          await response.json().catch(() => null);
        }
      } catch {
        // Silently persist to browser storage without logging console error spam
      }
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [
    databaseReady,
    isAuthenticated,
    applicationStateLoaded,
    users,
    clients,
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
    adminConfig,
  ]);

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
      projectId: projectId || 'SYSTEM',
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

    // Persist activity log to backend
    void persistTableToBackend('activity_logs', [newLog]);
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

    // Persist notification to backend
    void persistTableToBackend('notifications', [newNotif]);
  };

  const createProject = (projectData: Partial<Project>): Project => {
    const deptCodeMap: Record<DepartmentId, string> = {
      marketing: 'MKT',
      incentive_travel: 'TRV',
      online_ram: 'RAM',
      development: 'DEV',
    };
    const departmentId = projectData.departmentId || currentUser.departmentId;
    const deptCode = deptCodeMap[departmentId] || 'PRJ';
    const nextNum = Math.max(0, ...projects.map((project) => Number(project.projectNumber) || 0)) + 1;
    const generatedId = `PRJ-${deptCode}-${new Date().getFullYear()}-${safeRandomUUID()}`;

    const briefCompletenessReport = calculateBriefCompleteness(
      projectData.requestTypeId || '',
      projectData.briefData || {}
    );

    const newProject: Project = {
      id: generatedId,
      projectNumber: nextNum,
      clientId: projectData.clientId || clients[0]?.id || '',
      departmentId,
      requestTypeId: projectData.requestTypeId || '',
      projectName: projectData.projectName || '',
      campaignName: projectData.campaignName || projectData.projectName || '',
      description: projectData.description || '',
      priority: projectData.priority || 'medium',
      stage: 'BRIEF_VALIDATION',
      status: 'on_track',
      version: 'V0.1',
      accountableUserId: projectData.accountableUserId || currentUser.id,
      projectOwnerId: projectData.projectOwnerId || currentUser.id,
      qaOwnerId: projectData.qaOwnerId || users.find((user) => user.role === 'qa_user')?.id || '',
      approverId: projectData.approverId || users.find((user) => user.role === 'client')?.id || '',
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

    addNotification({
      userId: project.projectOwnerId,
      projectId,
      type: 'revision_requested',
      title: 'Brief Unlocked for Revisions',
      message: `Brief for "${project.projectName}" was unlocked by ${currentUser.name}. Reason: "${reason}".`,
      targetTab: 'brief',
    });

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

    if (nextOwnerId && nextOwnerId !== currentUser.id) {
      addNotification({
        userId: nextOwnerId,
        projectId,
        type: newStage === 'INTERNAL_QA' || newStage === 'FINAL_QA' ? 'qa_required'
          : newStage === 'CLIENT_REVIEW' || newStage === 'CLIENT_APPROVAL' ? 'approval_required'
          : newStage === 'REVISION' ? 'revision_requested'
          : 'system_alert',
        title: `Project Advanced: ${newStage.replace(/_/g, ' ')}`,
        message: `Project "${project.projectName}" (${project.id}) advanced to ${newStage.replace(/_/g, ' ')}. Next action: "${nextTask}".`,
        targetTab: newStage === 'INTERNAL_QA' || newStage === 'FINAL_QA' ? 'qa'
          : newStage === 'CLIENT_REVIEW' || newStage === 'CLIENT_APPROVAL' ? 'approval'
          : 'overview',
      });
    }

    return { success: true };
  };

  const createTask = (taskData: Omit<Task, 'id'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `tsk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setTasks((prev) => [newTask, ...prev]);

    // Persist to backend database
    void persistTableToBackend('tasks', [newTask]);

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
    let updatedTask: Task | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isComplete = status === 'complete';
          updatedTask = {
            ...t,
            status,
            completedAt: isComplete ? new Date().toISOString() : undefined,
          };
          return updatedTask;
        }
        return t;
      })
    );
    if (updatedTask) {
      void persistTableToBackend('tasks', [updatedTask]);
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    void deleteRecordFromBackend('tasks', taskId);
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

    // Uploaded files are persisted on the server-side upload endpoint.
    // Do not mirror every uploaded asset into browser storage.
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
    deleteLocalFileBlob(fileId).catch(() => {});
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

    // Uploaded deliverables are persisted on the server-side upload endpoint.
    // Avoid storing duplicate local copies in browser storage.

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

    // Persist chat message to backend
    void persistTableToBackend('chat_messages', [newMsg]);

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
    void deleteRecordFromBackend('chat_messages', id);
  };

  const toggleImportantMessage = (id: string) => {
    let updatedMsg: ChatMessage | null = null;
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          updatedMsg = { ...m, isImportant: !m.isImportant };
          return updatedMsg;
        }
        return m;
      })
    );
    if (updatedMsg) {
      void persistTableToBackend('chat_messages', [updatedMsg]);
    }
  };

  const markMessagesAsRead = useCallback((messageIds: string[]) => {
    if (!messageIds || messageIds.length === 0) return;
    const currentUserId = currentUser.id;
    setChatMessages((prev) => {
      let changed = false;
      const updated = prev.map((msg) => {
        if (messageIds.includes(msg.id)) {
          const readByList = msg.readBy || [];
          if (!readByList.includes(currentUserId)) {
            changed = true;
            return { ...msg, readBy: [...readByList, currentUserId] };
          }
        }
        return msg;
      });
      if (changed) {
        const changedMsgs = updated.filter((m) => messageIds.includes(m.id));
        void persistTableToBackend('chat_messages', changedMsgs);
      }
      return updated;
    });
  }, [currentUser.id]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    void persistTableToBackend('notifications', [{ id, is_read: 1, read: true }]);
  };

  const toggleNotificationRead = (id: string) => {
    let targetNotif: Notification | null = null;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          targetNotif = { ...n, read: !n.read };
          return targetNotif;
        }
        return n;
      })
    );
    if (targetNotif) {
      const isReadVal = (targetNotif as Notification).read ? 1 : 0;
      void persistTableToBackend('notifications', [{ id, is_read: isReadVal, read: (targetNotif as Notification).read }]);
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    void deleteRecordFromBackend('notifications', id);
  };

  const clearReadNotifications = () => {
    setNotifications((prev) => prev.filter((n) => !n.read || n.userId !== currentUser.id));
    void executeBackendAction({ action: 'clear_read_notifications', userId: currentUser.id });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser.id ? { ...n, read: true } : n))
    );
    void executeBackendAction({ action: 'mark_all_read', userId: currentUser.id });
  };

  const updateAdminConfig = (updates: Partial<AdminConfig>) => {
    setAdminConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateClient = (client: ClientRecord) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));

    logActivity(
      'SYSTEM',
      'CLIENT_UPDATED',
      `Client profile "${client.name}" (${client.code}) updated by ${currentUser.name}.`
    );

    // Asynchronously persist to backend endpoints
    (async () => {
      for (const endpoint of DB_DATA_ENDPOINTS) {
        try {
          const isCrossDomain = endpoint.startsWith('http://') || endpoint.startsWith('https://');
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            credentials: isCrossDomain ? 'omit' : 'include',
            body: JSON.stringify({
              table: 'clients',
              data: [client],
            }),
          });
        } catch (err) {
          console.warn(`Could not persist client update to ${endpoint}:`, err);
        }
      }
    })();
  };

  const addClient = (client: ClientRecord) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id || c.code === client.code);
      if (exists) {
        return prev.map((c) => (c.id === client.id ? client : c));
      }
      return [...prev, client];
    });

    logActivity(
      'SYSTEM',
      'CLIENT_REGISTERED',
      `New Client / Account "${client.name}" (${client.code}) registered by ${currentUser.name} (${currentUser.role}).`
    );

    addNotification({
      userId: currentUser.id,
      title: 'New Client Registered',
      message: `Client account "${client.name}" (${client.code}) was successfully created and added to the corporate directory.`,
      type: 'account_created',
    });

    // Asynchronously persist to backend endpoints
    (async () => {
      for (const endpoint of DB_DATA_ENDPOINTS) {
        try {
          const isCrossDomain = endpoint.startsWith('http://') || endpoint.startsWith('https://');
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            credentials: isCrossDomain ? 'omit' : 'include',
            body: JSON.stringify({
              table: 'clients',
              data: [client],
            }),
          });
        } catch (err) {
          console.warn(`Could not persist new client to ${endpoint}:`, err);
        }
      }
    })();
  };

  const exportDatabaseJson = (): string => {
    const payload: DatabaseBackupPayload = {
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      exportedBy: `${currentUser.name} (${currentUser.role})`,
      users: users.map((user) => {
        const { password: _password, ...safeUser } = user;
        return safeUser;
      }),
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

  const importDatabaseJson = async (
    payloadInput: DatabaseBackupPayload | string,
    mode: 'replace' | 'merge' = 'replace'
  ): Promise<{ success: boolean; message: string; details?: any }> => {
    try {
      let rawObj: any;
      if (typeof payloadInput === 'string') {
        rawObj = JSON.parse(payloadInput);
      } else {
        rawObj = payloadInput;
      }

      if (!rawObj || typeof rawObj !== 'object') {
        return { success: false, message: 'Invalid JSON payload structure.' };
      }

      // Unwrap nested wrapper objects if present
      const container = rawObj.data || rawObj.state || rawObj.dataset || rawObj;

      // Extract raw entities supporting both camelCase and snake_case properties
      const rawProjects = container.projects || (container.table === 'projects' ? container.data : null);
      const rawTasks = container.tasks || (container.table === 'tasks' ? container.data : null);
      const rawFiles = container.files || container.project_files || container.projectFiles || (container.table === 'project_files' || container.table === 'files' ? container.data : null);
      const rawVersions = container.versions || container.deliverable_versions || container.deliverableVersions || (container.table === 'deliverable_versions' || container.table === 'versions' ? container.data : null);
      const rawQaSubmissions = container.qaSubmissions || container.qa_submissions || (container.table === 'qa_submissions' ? container.data : null);
      const rawApprovals = container.approvals || container.client_approvals || container.clientApprovals || (container.table === 'client_approvals' ? container.data : null);
      const rawFeedbackItems = container.feedbackItems || container.feedback_items || (container.table === 'feedback_items' ? container.data : null);
      const rawNotifications = container.notifications || (container.table === 'notifications' ? container.data : null);
      const rawChatMessages = container.chatMessages || container.chat_messages || (container.table === 'chat_messages' ? container.data : null);
      const rawActivityLogs = container.activityLogs || container.activity_logs || (container.table === 'activity_logs' ? container.data : null);
      const rawClients = container.clients || (container.table === 'clients' ? container.data : null);
      const rawUsers = container.users || (container.table === 'users' ? container.data : null);
      const rawAdminConfig = container.adminConfig || container.admin_settings || container.adminSettings || (container.table === 'admin_settings' ? container.data : null);

      // Normalize entities through system parsers
      const normProjects = Array.isArray(rawProjects) ? normalizeProjects(rawProjects) : null;
      const normTasks = Array.isArray(rawTasks) ? normalizeTasks(rawTasks) : null;
      const normFiles = Array.isArray(rawFiles) ? rawFiles : null;
      const normVersions = Array.isArray(rawVersions) ? normalizeVersions(rawVersions) : null;
      const normQaSubmissions = Array.isArray(rawQaSubmissions) ? normalizeQaSubmissions(rawQaSubmissions) : null;
      const normApprovals = Array.isArray(rawApprovals) ? normalizeApprovals(rawApprovals) : null;
      const normFeedbackItems = Array.isArray(rawFeedbackItems) ? normalizeFeedbackItems(rawFeedbackItems) : null;
      const normNotifications = Array.isArray(rawNotifications) ? normalizeNotifications(rawNotifications) : null;
      const normChatMessages = Array.isArray(rawChatMessages) ? normalizeChatMessages(rawChatMessages) : null;
      const normActivityLogs = Array.isArray(rawActivityLogs) ? normalizeActivityLogs(rawActivityLogs) : null;
      const normClients = Array.isArray(rawClients) ? normalizeClients(rawClients) : null;
      const normUsers = Array.isArray(rawUsers) ? normalizeUsers(rawUsers) : null;
      const normAdminConfig = rawAdminConfig ? normalizeAdminConfig(rawAdminConfig) : null;

      const mergeById = <T extends { id: string }>(prev: T[], next: T[] | null): T[] => {
        if (!next) return prev;
        const map = new Map(prev.map((i) => [i.id, i]));
        next.forEach((i) => map.set(i.id, i));
        return Array.from(map.values());
      };

      // Determine new state values
      const targetProjects = mode === 'replace' ? (normProjects ?? projects) : mergeById(projects, normProjects);
      const targetTasks = mode === 'replace' ? (normTasks ?? tasks) : mergeById(tasks, normTasks);
      const targetFiles = mode === 'replace' ? (normFiles ?? files) : mergeById(files, normFiles);
      const targetVersions = mode === 'replace' ? (normVersions ?? versions) : mergeById(versions, normVersions);
      const targetQaSubmissions = mode === 'replace' ? (normQaSubmissions ?? qaSubmissions) : mergeById(qaSubmissions, normQaSubmissions);
      const targetApprovals = mode === 'replace' ? (normApprovals ?? approvals) : mergeById(approvals, normApprovals);
      const targetFeedbackItems = mode === 'replace' ? (normFeedbackItems ?? feedbackItems) : mergeById(feedbackItems, normFeedbackItems);
      const targetNotifications = mode === 'replace' ? (normNotifications ?? notifications) : mergeById(notifications, normNotifications);
      const targetChatMessages = mode === 'replace' ? (normChatMessages ?? chatMessages) : mergeById(chatMessages, normChatMessages);
      const targetActivityLogs = mode === 'replace' ? (normActivityLogs ?? activityLogs) : mergeById(activityLogs, normActivityLogs);
      const targetClients = mode === 'replace' ? (normClients ?? clients) : mergeById(clients, normClients);
      const targetUsers = mode === 'replace' ? (normUsers ?? users) : mergeById(users, normUsers);
      const targetAdminConfig = normAdminConfig || adminConfig;

      // Update React context states
      if (normProjects !== null || mode === 'replace') setProjects(targetProjects);
      if (normTasks !== null || mode === 'replace') setTasks(targetTasks);
      if (normFiles !== null || mode === 'replace') setFiles(targetFiles);
      if (normVersions !== null || mode === 'replace') setVersions(targetVersions);
      if (normQaSubmissions !== null || mode === 'replace') setQaSubmissions(targetQaSubmissions);
      if (normApprovals !== null || mode === 'replace') setApprovals(targetApprovals);
      if (normFeedbackItems !== null || mode === 'replace') setFeedbackItems(targetFeedbackItems);
      if (normNotifications !== null || mode === 'replace') setNotifications(targetNotifications);
      if (normChatMessages !== null || mode === 'replace') setChatMessages(targetChatMessages);
      if (normActivityLogs !== null || mode === 'replace') setActivityLogs(targetActivityLogs);
      if (normClients !== null || mode === 'replace') setClients(targetClients);
      if (normUsers !== null || mode === 'replace') setUsers(targetUsers);
      if (normAdminConfig !== null) setAdminConfig(targetAdminConfig);

      // Persist to PHP & MySQL database backends so data is retained on refresh
      const backendPayload = {
        exportedAt: new Date().toISOString(),
        __purge_unlisted__: mode === 'replace' ? true : false,
        data: {
          users: targetUsers,
          projects: targetProjects,
          tasks: targetTasks,
          files: targetFiles,
          versions: targetVersions,
          qa_submissions: targetQaSubmissions,
          client_approvals: targetApprovals,
          feedback_items: targetFeedbackItems,
          notifications: targetNotifications,
          chat_messages: targetChatMessages,
          activity_logs: targetActivityLogs,
          clients: targetClients,
          admin_settings: targetAdminConfig,
        },
      };

      let backendPersisted = false;
      for (const endpoint of DB_DATA_ENDPOINTS) {
        try {
          const isCrossDomain = endpoint.startsWith('http://') || endpoint.startsWith('https://');
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            credentials: isCrossDomain ? 'omit' : 'include',
            body: JSON.stringify(backendPayload),
          });
          if (response.ok) {
            backendPersisted = true;
            break;
          }
        } catch (e) {
          console.warn(`Could not persist state to endpoint ${endpoint}:`, e);
        }
      }

      logActivity(
        'SYSTEM',
        'DATABASE_IMPORTED',
        `Database successfully imported (${mode.toUpperCase()} mode) by ${currentUser.name}. Projects: ${targetProjects.length}, Files: ${targetFiles.length}. Backend saved: ${backendPersisted}.`
      );

      return {
        success: true,
        message: `Database successfully updated (${mode} mode) and persisted to backend! ${targetProjects.length} projects, ${targetFiles.length} files loaded.`,
        details: {
          projectsCount: targetProjects.length,
          filesCount: targetFiles.length,
          usersCount: targetUsers.length,
          backendPersisted,
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
      const responseData = rawData?.data ?? rawData;
      
      // Auto-detect format: Array of projects, or { projects: [...], files: [...] }
      let incomingProjects: Project[] = [];
      let incomingFiles: ProjectFile[] = [];

      if (Array.isArray(responseData)) {
        incomingProjects = responseData.map((item, idx) => ({
          id: item.id || `PRJ-${Date.now()}-${idx}`,
          projectNumber: item.projectNumber || item.project_number || 100 + idx,
          clientId: item.clientId || item.client_id || clients[0]?.id || '',
          departmentId: item.departmentId || item.department_id || currentUser.departmentId || '',
          requestTypeId: item.requestTypeId || item.request_type_id || '',
          projectName: item.projectName || item.project_name || item.name || '',
          campaignName: item.campaignName || item.campaign_name || '',
          description: item.description || '',
          priority: item.priority || 'medium',
          stage: item.stage || 'PRODUCTION',
          status: item.status || 'on_track',
          version: item.version || 'V1.0',
          accountableUserId: item.accountableUserId || item.accountable_user_id || currentUser.id,
          projectOwnerId: item.projectOwnerId || item.project_owner_id || currentUser.id,
          qaOwnerId: item.qaOwnerId || item.qa_owner_id || users.find((user) => user.role === 'qa_user')?.id || '',
          approverId: item.approverId || item.approver_id || currentUser.id,
          contributorIds: Array.isArray(item.contributorIds) ? item.contributorIds : [],
          dependencies: typeof item.dependencies === 'string' ? item.dependencies : '',
          risks: typeof item.risks === 'string' ? item.risks : '',
          blockers: typeof item.blockers === 'string' ? item.blockers : '',
          externalSuppliers: typeof item.externalSuppliers === 'string' ? item.externalSuppliers : '',
          nextAction: item.nextAction && typeof item.nextAction === 'object' ? item.nextAction : {
            task: '',
            ownerName: currentUser.name,
            dueDate: '',
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
      } else if (responseData && typeof responseData === 'object') {
        if (Array.isArray(responseData.projects)) {
          incomingProjects = responseData.projects;
        }
        if (Array.isArray(responseData.files)) {
          incomingFiles = responseData.files;
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
        data: {
          users,
          clients,
          projects,
          tasks,
          files,
          versions,
          qa_submissions: qaSubmissions,
          client_approvals: approvals,
          feedback_items: feedbackItems,
          notifications,
          chat_messages: chatMessages,
          activity_logs: activityLogs,
          admin_settings: adminConfig,
        },
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

  const refreshDatabase = async (): Promise<boolean> => {
    try {
      const result = await fetchDatabaseState(true);
      if (result && result.state) {
        applyDatabaseState(result.state);
        return true;
      }
    } catch (err) {
      console.error('Failed to refresh database state:', err);
    }
    return false;
  };

  /**
   * Purges all browser local storage & cache and strictly connects all app state
   * to the live MySQL database: uicms_workflow
   * phpMyAdmin: http://localhost/phpmyadmin/index.php?route=/database/structure&db=uicms_workflow
   */
  const purgeLocalBrowserDataAndSync = async (): Promise<{ success: boolean; message: string; data?: any }> => {
    // 1. Delete all browser-stored mock data and cache keys
    const legacyKeys = [
      'uicms_workflow_v1_store',
      'uicms_workflow_store',
      'uicms_workflow_data',
      'uicms_local_data',
      'uicms_db_cache',
      'uicms_offline_store',
      'uicms_local_storage',
      'uicms_cached_projects',
      'uicms_cached_users',
      'uicms_tasks_cache',
    ];

    try {
      await purgeLocalIndexedDBVault();
      legacyKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Clear any non-essential uicms_* local keys
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('uicms_') && k !== SESSION_STORAGE_KEY && k !== 'uicms_theme_mode') {
          keysToDelete.push(k);
        }
      }
      keysToDelete.forEach((k) => localStorage.removeItem(k));
    } catch {}

    // 2. Fetch fresh data directly from MySQL database uicms_workflow
    try {
      const fetchResult = await fetchDatabaseState(true);
      if (fetchResult && fetchResult.state) {
        const nextState = fetchResult.state;
        setUsers(nextState.users);
        setProjects(nextState.projects);
        setTasks(nextState.tasks);
        setFiles(nextState.files);
        setVersions(nextState.versions);
        setQaSubmissions(nextState.qaSubmissions);
        setApprovals(nextState.approvals);
        setFeedbackItems(nextState.feedbackItems);
        setNotifications(nextState.notifications ?? []);
        setChatMessages(nextState.chatMessages ?? []);
        setActivityLogs(nextState.activityLogs ?? []);
        setClients(nextState.clients ?? []);
        setAdminConfig(nextState.adminConfig);

        // Verify current session user still exists in live MySQL
        if (currentUser.id) {
          const liveUser = nextState.users.find(
            (u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
          );
          if (liveUser && liveUser.active && !liveUser.isSuspended) {
            setCurrentUser(liveUser);
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setCurrentUser(EMPTY_USER);
            setIsAuthenticated(false);
            setIsAuthModalOpen(true);
          }
        }

        return {
          success: true,
          message: 'All local browser data deleted. Application state is now fully pointed to live MySQL database "uicms_workflow" (phpMyAdmin: http://localhost/phpmyadmin/index.php?route=/database/structure&db=uicms_workflow).',
          data: {
            database: 'uicms_workflow',
            phpMyAdminUrl: 'http://localhost/phpmyadmin/index.php?route=/database/structure&db=uicms_workflow',
            source: fetchResult.source,
            endpoint: fetchResult.endpointUsed,
            usersCount: nextState.users.length,
            projectsCount: nextState.projects.length,
            tasksCount: nextState.tasks.length,
            clientsCount: nextState.clients.length,
          },
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Purged local data, but backend database fetch returned: ${err?.message || 'Server error'}. Ensure Apache & MySQL are running in XAMPP.`,
      };
    }

    return {
      success: true,
      message: 'All local browser data deleted and reset to live MySQL database "uicms_workflow".',
    };
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

  const addUser = async (userData: {
    name: string;
    email: string;
    personalEmail?: string;
    password?: string;
    role: UserRole;
    roleTitle?: string;
    departmentId: DepartmentId;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanName = userData.name.trim();

    if (!cleanName) {
      return { success: false, error: 'User full name is required.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'A valid email address is required.' };
    }

    // Check duplicate email locally in state
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email address already exists in the database.' };
    }

    const defaultRoleTitle = userData.roleTitle?.trim() || getRoleTitleDefault(userData.role);
    const password = userData.password?.trim() || 'Password123!';

    // Try posting to backend create-user API
    let createdUser: User | null = null;
    try {
      const result = await postAuthAction('create-user', {
        name: cleanName,
        email: cleanEmail,
        personalEmail: userData.personalEmail?.trim() || undefined,
        password,
        role: userData.role,
        roleTitle: defaultRoleTitle,
        departmentId: userData.departmentId,
        avatar: userData.avatar || '',
      });

      if (result.success && result.user) {
        createdUser = result.user as User;
      }
    } catch {}

    if (!createdUser) {
      // Fallback construct if backend action returned client-managed entity
      createdUser = {
        id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        email: cleanEmail,
        personalEmail: userData.personalEmail?.trim() || undefined,
        role: userData.role,
        roleTitle: defaultRoleTitle,
        departmentId: userData.departmentId,
        avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        active: true,
        isSuspended: false,
        workloadCount: 0,
        createdAt: new Date().toISOString(),
      };
    }

    // Update users state
    setUsers((prev) => [createdUser!, ...prev.filter((u) => u.id !== createdUser!.id)]);

    // Record immutable audit log
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: currentUser.id || 'admin',
      userName: currentUser.name || 'Administrator',
      action: 'USER_CREATED',
      description: `New user account was created and persisted to database: ${cleanName} (${userData.role}, ${cleanEmail}).`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return { success: true, user: createdUser };
  };

  const registerUser = async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    roleTitle?: string;
    departmentId: DepartmentId;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const result = await postAuthAction('register', {
      name: userData.name,
      email: cleanEmail,
      password: userData.password,
      role: userData.role || 'designer',
      roleTitle: userData.roleTitle,
      departmentId: userData.departmentId,
      avatar: userData.avatar,
    });
    if (!result.success || !result.user) {
      return {
        success: false,
        error: result.error || 'Registration failed. Could not write user to database.',
      };
    }

    const newUser = result.user as User;
    const safeUser: User = { ...newUser };
    delete (safeUser as any).password;

    setCurrentUser(safeUser);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setInactivityNotice(null);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user: safeUser, lastActivityAt: Date.now() }));
    localStorage.removeItem(SESSION_TIMEOUT_NOTICE_KEY);
    lastActivityRef.current = Date.now();
    setSessionRemainingSeconds(INACTIVITY_TIMEOUT_SECONDS);

    setUsers((prev) => {
      const exists = prev.some((u) => u.id === safeUser.id || u.email.toLowerCase() === safeUser.email.toLowerCase());
      if (exists) return prev.map((u) => (u.id === safeUser.id || u.email.toLowerCase() === safeUser.email.toLowerCase() ? safeUser : u));
      return [...prev, safeUser];
    });

    const refreshed = await fetchDatabaseState(true);
    if (refreshed) {
      applyDatabaseState(refreshed);
    }

    return { success: true, user: safeUser };
  };

  const loginUser = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = email.trim().toLowerCase();
    const result = await postAuthAction('login', { email: cleanEmail, password });
    if (!result.success || !result.user) {
      return {
        success: false,
        error: result.error || 'Invalid credentials or database connection failed.',
      };
    }

    const authenticatedUser = result.user as User;
    const safeUser: User = { ...authenticatedUser };
    delete (safeUser as any).password;

    setCurrentUser(safeUser);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setInactivityNotice(null);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user: safeUser, lastActivityAt: Date.now() }));
    localStorage.removeItem(SESSION_TIMEOUT_NOTICE_KEY);
    lastActivityRef.current = Date.now();
    setSessionRemainingSeconds(INACTIVITY_TIMEOUT_SECONDS);

    // Refresh dynamic state from database
    const refreshed = await fetchDatabaseState(true);
    if (refreshed) {
      applyDatabaseState(refreshed);
    }

    return { success: true, user: safeUser };
  };

  const forgotPassword = async (
    emailOrPersonal: string,
    _personalEmailOverride?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const result = await postAuthAction('request-password-reset', { email: emailOrPersonal });
    return { success: result.success, error: result.error, message: result.message };
  };

  const resetUserEmail = (
    userId: string,
    newWorkEmail: string,
    newPersonalEmail?: string
  ): { success: boolean; error?: string; user?: User } => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const cleanWorkEmail = newWorkEmail.trim().toLowerCase();
    if (!cleanWorkEmail || !cleanWorkEmail.includes('@') || !cleanWorkEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid work email address.' };
    }

    const duplicate = users.find(
      (u) => u.id !== userId && u.email.toLowerCase() === cleanWorkEmail
    );
    if (duplicate) {
      return { success: false, error: 'This email address is already assigned to another user.' };
    }

    let cleanPersonal = user.personalEmail;
    if (newPersonalEmail !== undefined) {
      const p = newPersonalEmail.trim().toLowerCase();
      if (p && (!p.includes('@') || !p.includes('.'))) {
        return { success: false, error: 'Please enter a valid personal email address format.' };
      }
      cleanPersonal = p || undefined;
    }

    const updatedUser: User = {
      ...user,
      email: cleanWorkEmail,
      personalEmail: cleanPersonal,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    if (currentUser.id === userId) {
      setCurrentUser(updatedUser);
      try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.email = cleanWorkEmail;
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (err) {
        console.error('Failed to update session email', err);
      }
    }

    // Audit log
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      projectId: 'SYSTEM',
      userId: user.id,
      userName: user.name,
      action: 'USER_EMAIL_RESET',
      description: `Email address was reset for user ${user.name}. Work: ${cleanWorkEmail}${cleanPersonal ? `, Personal: ${cleanPersonal}` : ''}`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return { success: true, user: updatedUser };
  };

  const verifyResetCode = async (
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const result = await postAuthAction('verify-reset-code', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    });
    if (!result.success) {
      return { success: false, error: result.error || 'Verification code is invalid or has expired.' };
    }
    return { success: true, message: result.message || 'Verification successful' };
  };

  const resetPassword = async (
    email: string,
    resetToken: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const result = await postAuthAction('reset-password', {
      email: email.trim().toLowerCase(),
      code: resetToken.trim(),
      token: resetToken.trim(),
      password: newPassword,
    });
    if (!result.success) {
      return { success: false, error: result.error || 'Password reset failed in database.' };
    }
    return { success: true, message: result.message || 'Password successfully changed' };
  };

  const encryptAllUserPasswords = (): { success: boolean; count: number } => {
    let count = 0;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.password && !isPasswordHashed(u.password)) {
          count++;
          return { ...u, password: hashPasswordSync(u.password) };
        }
        return u;
      })
    );
    return { success: true, count };
  };

  const logoutUser = () => {
    void postAuthAction('logout');
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMEOUT_NOTICE_KEY);
    setInactivityNotice(null);
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

    // Persist to backend database
    postAuthAction('suspend-user', { userId, isSuspended: true, reason }).catch(() => {});

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

    // Persist to backend database
    postAuthAction('suspend-user', { userId, isSuspended: false }).catch(() => {});

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

    // Persist deletion to backend database
    postAuthAction('delete-user', { userId }).catch(() => {});

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

  const updateUserPassword = async (
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await postAuthAction('change-password', { userId, oldPassword, newPassword });
    return { success: result.success, error: result.error };
  };

  const updateUserProfile = (
    userId: string,
    updates: Partial<Pick<User, 'name' | 'email' | 'personalEmail' | 'avatar' | 'roleTitle' | 'departmentId' | 'role'>>
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

    const isRoleChanged = updates.role !== undefined && updates.role !== user.role;

    const updatedUser: User = {
      ...user,
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : user.name,
      email: updates.email !== undefined ? updates.email.trim().toLowerCase() : user.email,
      personalEmail: updates.personalEmail !== undefined ? updates.personalEmail.trim().toLowerCase() : user.personalEmail,
      roleTitle: updates.roleTitle !== undefined ? updates.roleTitle.trim() : user.roleTitle,
      avatar: updates.avatar !== undefined ? updates.avatar : user.avatar,
      departmentId: updates.departmentId !== undefined ? updates.departmentId : user.departmentId,
      role: updates.role !== undefined ? updates.role : user.role,
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
      userId: currentUser.id,
      userName: currentUser.name,
      action: isRoleChanged ? 'USER_ROLE_ALLOCATED' : 'USER_PROFILE_UPDATED',
      description: isRoleChanged
        ? `Role reallocated for ${updatedUser.name} (${updatedUser.email}): ${user.role} ➔ ${updatedUser.role} by ${currentUser.name}.`
        : `User profile updated for ${updatedUser.name} (${updatedUser.email}) by ${currentUser.name}.`,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return { success: true, user: updatedUser };
  };


  return (
    <AppContext.Provider
      value={{
        databaseReady,
        currentUser,
        users,
        sessionRemainingSeconds,
        inactivityNotice,
        setInactivityNotice,
        resetInactivityTimer,
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
        addUser,
        registerUser,
        loginUser,
        encryptAllUserPasswords,
        forgotPassword,
        verifyResetCode,
        resetPassword,
        resetUserEmail,
        logoutUser,
        suspendUser,
        reactivateUser,
        deleteUser,
        updateUserPassword,
        updateUserProfile,
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
        refreshDatabase,
        purgeLocalBrowserDataAndSync,
        submitQA,
        submitClientApproval,
        addFeedbackItem,
        updateFeedbackStatus,
        sendChatMessage,
        deleteChatMessage,
        toggleImportantMessage,
        markMessagesAsRead,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        toggleNotificationRead,
        deleteNotification,
        clearReadNotifications,
        addNotification,
        updateAdminConfig,
        updateClient,
        addClient,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
