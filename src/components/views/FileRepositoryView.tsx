import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectFile } from '../../types';
import {
  Download,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Folders,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';

interface FileRepositoryViewProps {
  onOpenProject: (id: string, initialTab?: string) => void;
}

export const FileRepositoryView: React.FC<FileRepositoryViewProps> = ({
  onOpenProject,
}) => {
  const { files, projects, currentUser, uploadFile, deleteFile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // File Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('2.4 MB');
  const [uploadFileType, setUploadFileType] = useState('application/pdf');
  const [uploadFileCategory, setUploadFileCategory] = useState<ProjectFile['category']>('proofs');
  const [uploadTargetProjectId, setUploadTargetProjectId] = useState(projects[0]?.id || 'PRJ-MKT-2026-001');
  const [uploadFileVersion, setUploadFileVersion] = useState('V1.0');
  const [uploadFileDescription, setUploadFileDescription] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');

  const filteredFiles = files.filter((f) => {
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    if (selectedProjectId !== 'all' && f.projectId !== selectedProjectId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const prj = projects.find((p) => p.id === f.projectId);
      return (
        f.filename.toLowerCase().includes(q) ||
        f.projectId.toLowerCase().includes(q) ||
        (prj?.projectName.toLowerCase().includes(q) ?? false) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    uploadFile({
      projectId: uploadTargetProjectId,
      filename: uploadFileName.trim(),
      size: uploadFileSize || '1.5 MB',
      type: uploadFileType || 'application/pdf',
      version: uploadFileVersion || 'V1.0',
      uploadedBy: currentUser.id,
      category: uploadFileCategory,
      url: uploadFileUrl.trim() || `https://files.uicms.com/uploads/${encodeURIComponent(uploadFileName.trim())}`,
      description: uploadFileDescription.trim() || 'Uploaded to local enterprise repository.',
    });

    setShowUploadModal(false);
    setUploadFileName('');
    setUploadFileDescription('');
    setUploadFileUrl('');
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Enterprise File & Asset Repository
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              {files.length} Total Files
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Section 29: Centralized repository for project briefs, brand CI vector art, high-res proofs, and final print packages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Local File / Proof</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative min-w-[240px] flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name, project ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} - {p.projectName}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Categories</option>
          <option value="brief">Briefs</option>
          <option value="ci_brand">Brand / CI Guidelines</option>
          <option value="content">Content Manuscripts</option>
          <option value="proofs">Deliverable Proofs</option>
          <option value="release">Final Release Packages</option>
        </select>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">No files found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No files match your current filters. Click "Upload Local File" to add artwork, proofs, or briefs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => {
            const prj = projects.find((p) => p.id === file.projectId);
            return (
              <div
                key={file.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate" title={file.filename}>
                          {file.filename}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {file.size} • {file.version}
                        </span>
                      </div>
                    </div>

                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 flex-shrink-0">
                      {file.category}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Attached Project:</span>
                    <span
                      onClick={() => prj && onOpenProject(prj.id, 'versions')}
                      className="font-semibold text-white hover:text-indigo-300 transition-colors cursor-pointer truncate block"
                    >
                      {prj?.projectName || file.projectId} ({file.projectId})
                    </span>
                  </div>

                  {file.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                      "{file.description}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-400">
                    By {file.uploadedByName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove file "${file.filename}" from repository?`)) {
                          deleteFile(file.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Upload className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Upload Local Deliverable / Asset</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Filename <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="e.g. Discovery_Vitality_Banner_Final_Print.pdf"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Associate Project</label>
                  <select
                    value={uploadTargetProjectId}
                    onChange={(e) => setUploadTargetProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.projectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Category</label>
                  <select
                    value={uploadFileCategory}
                    onChange={(e) => setUploadFileCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="proofs">Deliverable Proof</option>
                    <option value="brief">Brief Attachment</option>
                    <option value="ci_brand">CI Brand Guidelines</option>
                    <option value="approved_files">Approved Master File</option>
                    <option value="release">Release Package</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Version</label>
                  <input
                    type="text"
                    value={uploadFileVersion}
                    onChange={(e) => setUploadFileVersion(e.target.value)}
                    placeholder="V1.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Size</label>
                  <input
                    type="text"
                    value={uploadFileSize}
                    onChange={(e) => setUploadFileSize(e.target.value)}
                    placeholder="12.4 MB"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">MIME Type</label>
                  <input
                    type="text"
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value)}
                    placeholder="application/pdf"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">File URL / Storage Path (Optional)</label>
                <input
                  type="text"
                  value={uploadFileUrl}
                  onChange={(e) => setUploadFileUrl(e.target.value)}
                  placeholder="https://... or /uploads/artwork.pdf"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Description / Proof Notes</label>
                <textarea
                  rows={2}
                  value={uploadFileDescription}
                  onChange={(e) => setUploadFileDescription(e.target.value)}
                  placeholder="e.g. High resolution 300 DPI printer proof with 3mm bleed..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Add File to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

