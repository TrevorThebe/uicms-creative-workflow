import React from 'react';
import {
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Film,
  HardDrive,
  Image as ImageIcon,
  Tag,
  User,
  X,
} from 'lucide-react';
import { triggerLocalDownload, isImageFile, isPdfFile, isVideoFile } from '../../utils/localFileStore';

export interface PreviewableFile {
  id: string;
  filename: string;
  size: string;
  version?: string;
  category?: string;
  url: string;
  description?: string;
  uploadedByName?: string;
  uploadedAt?: string;
  projectId?: string;
  projectName?: string;
  status?: string;
  isLocked?: boolean;
}

interface DeliverablePreviewModalProps {
  file: PreviewableFile | null;
  onClose: () => void;
  onOpenProject?: (projectId: string, tab?: string) => void;
}

export const DeliverablePreviewModal: React.FC<DeliverablePreviewModalProps> = ({
  file,
  onClose,
  onOpenProject,
}) => {
  if (!file) return null;

  const isImg = isImageFile(file.filename);
  const isPdf = isPdfFile(file.filename);
  const isVideo = isVideoFile(file.filename);

  const handleDownload = () => {
    triggerLocalDownload(file.filename, file.url);
  };

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              {isImg ? (
                <ImageIcon className="w-5 h-5" />
              ) : isVideo ? (
                <Film className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate" title={file.filename}>
                {file.filename}
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>{file.size}</span>
                {file.version && (
                  <>
                    <span>•</span>
                    <span className="font-mono font-semibold text-indigo-400">{file.version}</span>
                  </>
                )}
                {file.category && (
                  <>
                    <span>•</span>
                    <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {file.category}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Preview & Details */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Main Visual Display */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center min-h-[260px] max-h-[460px] relative p-3">
            {isImg ? (
              <img
                src={file.url}
                alt={file.filename}
                className="max-h-[430px] max-w-full object-contain rounded-lg shadow-md"
                onError={(e) => {
                  // Fallback for broken external demo URL
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : isVideo ? (
              <video
                src={file.url}
                controls
                className="max-h-[420px] max-w-full rounded-lg"
              />
            ) : isPdf ? (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{file.filename}</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Portable Document Format deliverable proof package. Ready for local review and pre-flight inspection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Local PDF Deliverable</span>
                </button>
              </div>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <HardDrive className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{file.filename}</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Local deliverable archive / creative package. Download to open in native desktop application.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Local Asset</span>
                </button>
              </div>
            )}
          </div>

          {/* Description & Notes */}
          {file.description && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                Release Notes / Description
              </span>
              <p className="text-slate-300 leading-relaxed">{file.description}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-0.5">Uploaded By</span>
              <span className="font-semibold text-white truncate block">
                {file.uploadedByName || 'Team Member'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-0.5">Date Added</span>
              <span className="font-semibold text-white truncate block">
                {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Today'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-0.5">Project</span>
              {file.projectId ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenProject && file.projectId) {
                      onOpenProject(file.projectId, 'versions');
                      onClose();
                    }
                  }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 truncate text-left block w-full"
                >
                  {file.projectName || file.projectId}
                </button>
              ) : (
                <span className="font-semibold text-slate-300">Global Asset</span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-0.5">Storage Mode</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> Local Vault
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            IndexedDB Offline Vault • Local File Access
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
