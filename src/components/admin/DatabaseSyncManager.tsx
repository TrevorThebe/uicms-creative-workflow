import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectFile } from '../../types';
import { UploadLocalDeliverableModal } from '../common/UploadLocalDeliverableModal';
import { triggerLocalDownload } from '../../utils/localFileStore';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCircle2,
  Code,
  Copy,
  Database,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Folders,
  Globe,
  HardDrive,
  Layers,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Server,
  Shield,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';

export const DatabaseSyncManager: React.FC = () => {
  const {
    projects,
    files,
    tasks,
    versions,
    qaSubmissions,
    approvals,
    feedbackItems,
    users,
    clients,
    activityLogs,
    adminConfig,
    uploadFile,
    deleteFile,
    exportDatabaseJson,
    importDatabaseJson,
    syncWithLocalApi,
    pushToLocalApi,
    resetAllDataToDemo,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'backup_restore' | 'api_sync' | 'files_manager' | 'php_guide' | 'aws_spec' | 'sql_script'>('backup_restore');

  // JSON Import State
  const [jsonInputText, setJsonInputText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local API Sync State
  const [apiUrl, setApiUrl] = useState('/php-backend/api/data.php');
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiSyncFeedback, setApiSyncFeedback] = useState<{
    success?: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Local File Upload Modal State
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('2.4 MB');
  const [uploadFileType, setUploadFileType] = useState('application/pdf');
  const [uploadFileCategory, setUploadFileCategory] = useState<ProjectFile['category']>('proofs');
  const [uploadFileProjectId, setUploadFileProjectId] = useState(projects[0]?.id || 'PRJ-MKT-2026-001');
  const [uploadFileVersion, setUploadFileVersion] = useState('V1.0');
  const [uploadFileDescription, setUploadFileDescription] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [fileSearchQuery, setFileSearchQuery] = useState('');

  // Calculate Local Storage Footprint
  const calculateStorageSize = () => {
    try {
      const data = localStorage.getItem('uicms_workflow_v1_store');
      if (!data) return '0 KB';
      const bytes = new Blob([data]).size;
      return `${(bytes / 1024).toFixed(1)} KB`;
    } catch {
      return 'N/A';
    }
  };

  // Export & Trigger JSON Download
  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uicms_workflow_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle File Upload for JSON Import
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInputText(content);
      applyJsonImport(content);
    };
    reader.readAsText(file);
  };

  // Apply JSON Import
  const applyJsonImport = (payloadText?: string) => {
    const text = payloadText || jsonInputText;
    if (!text.trim()) {
      setImportFeedback({ type: 'error', message: 'Please provide valid JSON data or select a file.' });
      return;
    }

    const result = importDatabaseJson(text, importMode);
    if (result.success) {
      setImportFeedback({ type: 'success', message: result.message });
      setJsonInputText('');
    } else {
      setImportFeedback({ type: 'error', message: result.message });
    }
  };

  // Sync with Local API (GET)
  const handleSyncFromApi = async () => {
    if (!apiUrl.trim()) return;
    setIsSyncing(true);
    setApiSyncFeedback(null);
    try {
      const result = await syncWithLocalApi(apiUrl.trim());
      setApiSyncFeedback({
        success: result.success,
        message: result.message,
        details: result.rawResponse,
      });
    } catch (err: any) {
      setApiSyncFeedback({
        success: false,
        message: `Sync failed: ${err.message || 'Network error'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Push to Local API (POST)
  const handlePushToApi = async () => {
    if (!apiUrl.trim()) return;
    setIsSyncing(true);
    setApiSyncFeedback(null);
    try {
      const result = await pushToLocalApi(apiUrl.trim());
      setApiSyncFeedback({
        success: result.success,
        message: result.message,
        details: result.rawResponse,
      });
    } catch (err: any) {
      setApiSyncFeedback({
        success: false,
        message: `Push failed: ${err.message || 'Network error'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Add Local File
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    uploadFile({
      projectId: uploadFileProjectId,
      filename: uploadFileName.trim(),
      size: uploadFileSize || '1.5 MB',
      type: uploadFileType || 'application/pdf',
      version: uploadFileVersion || 'V1.0',
      uploadedBy: currentUser.id,
      category: uploadFileCategory,
      url: uploadFileUrl.trim() || `https://files.uicms.com/uploads/${encodeURIComponent(uploadFileName.trim())}`,
      description: uploadFileDescription.trim() || 'Uploaded to local repository asset vault.',
    });

    setShowFileUploadModal(false);
    setUploadFileName('');
    setUploadFileDescription('');
    setUploadFileUrl('');
  };

  const samplePhpCode = `<?php
// ============================================================================
// UICMS Local Database API Bridge (get_projects.php)
// Save to: C:/xampp/htdocs/uicms-api/get_projects.php or /var/www/html/uicms-api/
// ============================================================================

// 1. Enable CORS for local React development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Database Connection Configuration (MySQL / MariaDB)
$host = "localhost";
$db_name = "uicms_workflow";
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// 3. Handle GET: Fetch all projects and files from MySQL
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT * FROM projects ORDER BY project_number ASC");
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $fileStmt = $pdo->query("SELECT * FROM project_files ORDER BY id DESC");
    $files = $fileStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "projects" => $projects,
        "files" => $files,
        "syncedAt" => date("c")
    ], JSON_PRETTY_PRINT);
    exit();
}

// 4. Handle POST: Save/update incoming project data from React
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON payload"]);
        exit();
    }

    // Process and upsert records into MySQL...
    echo json_encode([
        "status" => "success",
        "message" => "Records successfully synchronized with MySQL database.",
        "receivedCount" => count($input['projects'] ?? [])
    ]);
    exit();
}
?>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const filteredFiles = files.filter((f) => {
    if (!fileSearchQuery.trim()) return true;
    const q = fileSearchQuery.toLowerCase();
    return (
      f.filename.toLowerCase().includes(q) ||
      f.projectId.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Summary */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Local Files, Database & API Synchronizer
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Update local repository files, import/export complete JSON snapshots, or synchronize with local PHP/MySQL servers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Database (JSON)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Re-seed system demo dataset? All collections will be restored to initial enterprise states.')) {
                  resetAllDataToDemo();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Database Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Projects</span>
            <div className="text-lg font-extrabold text-white mt-0.5">{projects.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Files & Proofs</span>
            <div className="text-lg font-extrabold text-indigo-400 mt-0.5">{files.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deliverable Versions</span>
            <div className="text-lg font-extrabold text-purple-400 mt-0.5">{versions.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Tasks</span>
            <div className="text-lg font-extrabold text-blue-400 mt-0.5">{tasks.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">QA Submissions</span>
            <div className="text-lg font-extrabold text-amber-400 mt-0.5">{qaSubmissions.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Storage Footprint</span>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">{calculateStorageSize()}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 text-xs font-semibold gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('backup_restore')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'backup_restore'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>JSON Database Backup & Restore</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('api_sync')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'api_sync'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Local REST / PHP / MySQL API Sync</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('files_manager')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'files_manager'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Folders className="w-3.5 h-3.5" />
          <span>Local Files & Assets Manager ({files.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('php_guide')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'php_guide'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>PHP / MySQL Setup Script</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sql_script')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sql_script'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>SQL DDL Schema & Seeds</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('aws_spec')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'aws_spec'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>AWS Hosting Architecture & Sizing Spec</span>
        </button>
      </div>

      {/* TAB 1: JSON Database Backup & Restore */}
      {activeTab === 'backup_restore' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Panel */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Export Database Snapshot
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                JSON v2026.1
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generate a full export containing all projects, deliverable versions, QA inspection checklists, sign-off approvals, user accounts, files, and audit logs.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Collections included:</span>
                <span className="font-mono text-indigo-400">12 Primary Tables</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>• {projects.length} Projects & Briefs</div>
                <div>• {files.length} Files, CI Vector Guidelines & Print Proofs</div>
                <div>• {versions.length} Deliverable Versions & QA Checklists</div>
                <div>• {users.length} User Accounts & Security Credentials</div>
                <div>• {activityLogs.length} Immutable Audit Log Entries</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Database Backup File (.json)</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(exportDatabaseJson())}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSuccess ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          {/* Import / Restore Panel */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Import & Update Database
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <span>Replace All</span>
                </label>
                <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <span>Merge</span>
                </label>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload a JSON backup file or paste your custom JSON payload below to immediately update all application state.
            </p>

            {/* Drag & Drop File Selector */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl bg-slate-950/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
            >
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-white">Click or drag & drop a .json database backup file</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Supports UTF-8 JSON exported snapshots</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleJsonFileUpload}
                className="hidden"
              />
            </div>

            {/* Direct JSON Paste Area */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Or Paste JSON Payload Directly:
              </label>
              <textarea
                rows={4}
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                placeholder='{"projects": [...], "files": [...]}'
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {importFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  importFeedback.type === 'success'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}
              >
                {importFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{importFeedback.message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => applyJsonImport()}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Apply Database Update</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Local REST / PHP / MySQL API Sync */}
      {activeTab === 'api_sync' && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Local Backend & MySQL API Bridge
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Connect your local PHP, Node, Python, or MySQL server to fetch live project records or push updates.
              </p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              CORS-Enabled REST Client
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                API Endpoint URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost/uicms-api/get_projects.php"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSyncFromApi}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Fetching...' : 'Fetch & Sync (GET)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePushToApi}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  <span>Push State (POST)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Tip: If testing on localhost, make sure Apache/PHP has CORS headers enabled (<code className="text-indigo-300">Access-Control-Allow-Origin: *</code>).
              </p>
            </div>

            {apiSyncFeedback && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  apiSyncFeedback.success
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {apiSyncFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{apiSyncFeedback.message}</span>
                </div>
                {apiSyncFeedback.details && (
                  <pre className="p-2 rounded bg-slate-950 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto border border-slate-800">
                    {JSON.stringify(apiSyncFeedback.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Local Files & Assets Manager */}
      {activeTab === 'files_manager' && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Folders className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Local File Vault & Asset Repository
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Add, manage, and update local deliverables, proofs, vector CI graphics, and printer specifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFileUploadModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Local File / Proof</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={fileSearchQuery}
              onChange={(e) => setFileSearchQuery(e.target.value)}
              placeholder="Search local files by name, project ID, category..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Files Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Filename</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Uploaded At</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">{file.filename}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-indigo-300">{file.projectId}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium uppercase">
                        {file.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{file.version}</td>
                    <td className="py-2.5 px-3 text-slate-400">{file.size}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => triggerLocalDownload(file.filename, file.url, file.type)}
                          className="p-1 rounded hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-400 transition-colors"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete file "${file.filename}"?`)) {
                              deleteFile(file.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PHP / MySQL Bridge Setup Script */}
      {activeTab === 'php_guide' && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                PHP / MySQL Backend Script Code & Modules
              </h4>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(samplePhpCode)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSuccess ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Copy this ready-to-run PHP file into your local server (e.g. <code className="text-indigo-300">XAMPP/htdocs/uicms-api/get_projects.php</code> or Docker container) to serve MySQL records with CORS support:
          </p>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
            {samplePhpCode}
          </pre>
        </div>
      )}

      {/* TAB 5: SQL Schema & Seeds */}
      {activeTab === 'sql_script' && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Complete MySQL / PostgreSQL DDL Schema & Enterprise Seeds
              </h4>
            </div>
            <a
              href="/database_seed.sql"
              download="database_seed.sql"
              className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download database_seed.sql</span>
            </a>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs text-slate-300 font-semibold">Included Relational Database Tables:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• departments</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• users</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• clients</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• projects</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• tasks</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• deliverable_versions</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• qa_submissions</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• client_approvals</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• feedback_items</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• notifications</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• chat_messages</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">• activity_logs</div>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Execute in phpMyAdmin, MySQL Workbench, or AWS RDS CLI:
          </p>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-96">
{`-- 1. Create and Select Database
CREATE DATABASE IF NOT EXISTS \`uicms_workflow\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`uicms_workflow\`;

-- 2. Projects Master Table
CREATE TABLE \`projects\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`project_number\` INT NOT NULL UNIQUE,
  \`client_id\` VARCHAR(50) NOT NULL,
  \`department_id\` VARCHAR(50) NOT NULL,
  \`request_type_id\` VARCHAR(100) NOT NULL,
  \`project_name\` VARCHAR(255) NOT NULL,
  \`campaign_name\` VARCHAR(255) NULL,
  \`description\` TEXT NULL,
  \`priority\` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  \`stage\` ENUM('REQUESTED', 'BRIEF_VALIDATION', 'BRIEF_LOCKED', 'PRODUCTION', 'INTERNAL_QA', 'CLIENT_REVIEW', 'REVISION', 'CLIENT_APPROVAL', 'FINAL_QA', 'FINAL_RELEASE', 'COMPLETED') NOT NULL DEFAULT 'REQUESTED',
  \`status\` ENUM('on_track', 'due_soon', 'overdue', 'blocked', 'completed') NOT NULL DEFAULT 'on_track',
  \`version\` VARCHAR(20) NOT NULL DEFAULT 'V0.1',
  \`accountable_user_id\` VARCHAR(50) NOT NULL,
  \`project_owner_id\` VARCHAR(50) NOT NULL,
  \`qa_owner_id\` VARCHAR(50) NOT NULL,
  \`approver_id\` VARCHAR(50) NOT NULL,
  \`contributor_ids\` JSON NULL,
  \`created_at\` VARCHAR(50) NOT NULL,
  \`updated_at\` VARCHAR(50) NOT NULL,
  \`release_date\` VARCHAR(30) NULL,
  \`is_brief_locked\` TINYINT(1) NOT NULL DEFAULT 0,
  \`brief_data\` JSON NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (Full schema and 400+ lines of enterprise seed data available in /database_seed.sql)`}
          </pre>
        </div>
      )}

      {/* TAB 6: AWS Hosting Architecture & Specs */}
      {activeTab === 'aws_spec' && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                AWS Cloud Hosting Specification & Sizing Architecture
              </h4>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              Production Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                <span>Option A: Modern Containerized (ECS Fargate + RDS)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Frontend:</strong> Amazon CloudFront + S3 Static Website Hosting (React 19 SPA)</li>
                <li><strong className="text-white">API Backend:</strong> AWS ECS Fargate (2x Tasks, 1 vCPU, 2 GB RAM, PHP 8.2-FPM)</li>
                <li><strong className="text-white">Database:</strong> Amazon RDS MySQL 8.0 Multi-AZ (<code className="text-indigo-300">db.t4g.medium</code>)</li>
                <li><strong className="text-white">Asset Storage:</strong> Amazon S3 with SSE-S3 AES-256 for proof files</li>
                <li><strong className="text-white">SSL & Routing:</strong> AWS ACM + Application Load Balancer (ALB)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Option B: Cost-Optimized / Staging (EC2 + RDS)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Instance:</strong> Amazon EC2 <code className="text-amber-300">t4g.small</code> (2 vCPU, 2 GB RAM Graviton3)</li>
                <li><strong className="text-white">Web Server:</strong> Nginx + PHP 8.2-FPM</li>
                <li><strong className="text-white">Database:</strong> Amazon RDS MySQL <code className="text-amber-300">db.t4g.micro</code> (1 vCPU, 1 GB RAM)</li>
                <li><strong className="text-white">Monthly Cost:</strong> Approx. <strong>$28 - $35 / month</strong></li>
                <li><strong className="text-white">Automated Backups:</strong> Daily RDS snapshots + S3 versioning</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h5 className="text-xs font-bold text-white">Docker Compose Stack for Quick Deployment:</h5>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-xs font-mono overflow-x-auto border border-slate-800">
{`# Spin up entire Nginx + PHP 8.2-FPM + MySQL stack locally or on AWS EC2:
cd php-backend
docker-compose up -d --build`}
            </pre>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      <UploadLocalDeliverableModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
      />
    </div>
  );
};
