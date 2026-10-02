import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProjectFile } from '../../types';
import {
  fileToDataUrl,
  formatBytes,
  isImageFile,
  isPdfFile,
} from '../../utils/localFileStore';

interface UploadLocalDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultCategory?: ProjectFile['category'];
  onFileUploaded?: (newFile: ProjectFile) => void;
}

export const UploadLocalDeliverableModal: React.FC<UploadLocalDeliverableModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
  defaultCategory = 'proofs',
  onFileUploaded,
}) => {
  const { projects, currentUser, uploadFile } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [isReading, setIsReading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Metadata form
  const [targetProjectId, setTargetProjectId] = useState<string>(
    defaultProjectId || projects[0]?.id || ''
  );
  const [filename, setFilename] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [category, setCategory] = useState<ProjectFile['category']>(defaultCategory);
  const [version, setVersion] = useState<string>('V1.0');
  const [description, setDescription] = useState<string>('');
  const [externalUrl, setExternalUrl] = useState<string>('');

  // Mode: local file vs remote url
  const [uploadMode, setUploadMode] = useState<'local' | 'url'>('local');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);
    setFilename(file.name);
    setFileSize(formatBytes(file.size));
    setMimeType(file.type || 'application/octet-stream');

    setIsReading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setFileDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to read file:', err);
      setErrorMessage('Could not read the selected local file. Please try another file.');
    } finally {
      setIsReading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (uploadMode === 'local' && !selectedFile && !fileDataUrl) {
      setErrorMessage('Please select or drop a local file from your computer.');
      return;
    }

    if (!filename.trim()) {
      setErrorMessage('Please specify a filename.');
      return;
    }
    if (!targetProjectId || !projects.some((project) => project.id === targetProjectId)) {
      setErrorMessage('Select an existing project before uploading.');
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = '';
      
      if (uploadMode === 'local' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('type', 'file');

        const uploadResponse = await fetch('/php-backend/api/upload.php', {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (uploadResult.status === 'success' && uploadResult.url) {
          finalUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.message || 'Failed to upload file to backend server');
        }
      } else {
        const parsedUrl = new URL(externalUrl.trim());
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          throw new Error('Use an HTTP or HTTPS asset URL.');
        }
        finalUrl = parsedUrl.toString();
      }

      // Upload file to app state
      const createdFile = uploadFile({
        projectId: targetProjectId,
        filename: filename.trim(),
        size: fileSize || '1.2 MB',
        type: mimeType || 'application/pdf',
        version: version.trim() || 'V1.0',
        uploadedBy: currentUser.id,
        category,
        url: finalUrl,
        description:
          description.trim() ||
          (uploadMode === 'local'
            ? 'Uploaded from local computer to enterprise vault.'
            : 'Linked external asset resource.'),
      });

      // Persist the canonical asset on the backend storage folders.
      // Browser IndexedDB is no longer used for uploaded file persistence.
      setSuccessMessage(`File "${filename.trim()}" successfully uploaded to enterprise vault!`);
      if (onFileUploaded && createdFile) {
        onFileUploaded(createdFile);
      }

      setTimeout(() => {
        setIsUploading(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsUploading(false);
      console.error('File upload error:', err);
      setErrorMessage(err?.message || 'An error occurred while uploading the file.');
    }
  };

  const isImg = isImageFile(filename, mimeType);
  const isPdf = isPdfFile(filename, mimeType);

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 text-indigo-400">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Upload Local Deliverable / Asset</h3>
              <p className="text-[11px] text-slate-400">
                Directly attach files from your computer to the enterprise repository.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success / Error Banners */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Source Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80 text-xs flex-shrink-0">
          <button
            type="button"
            onClick={() => setUploadMode('local')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              uploadMode === 'local'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Select Local Computer File</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              uploadMode === 'url'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>External URL / Cloud Link</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          {uploadMode === 'local' ? (
            <div>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileInputChange}
              />

              {!selectedFile ? (
                /* Drag & Drop Area */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                      : 'border-slate-800 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-950'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">
                      Drag & Drop your Deliverable / Asset here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      or <span className="text-indigo-400 font-semibold underline">browse from your computer</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {['PDF Proofs', 'PNG / JPG', 'SVG Vector', 'ZIP Archives', 'MP4 Video', 'Figma / AI'].map(
                      (badge) => (
                        <span
                          key={badge}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono"
                        >
                          {badge}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ) : (
                /* File Selected Card */
                <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {isImg && fileDataUrl ? (
                      <img
                        src={fileDataUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                        {isPdf ? <FileText className="w-6 h-6 text-rose-400" /> : <HardDrive className="w-6 h-6" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate text-xs">
                        {selectedFile.name}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="font-mono text-indigo-300">{fileSize}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">Ready to upload</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileDataUrl('');
                        setFilename('');
                        setFileSize('');
                      }}
                      className="p-1 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                Asset URL / Cloud Storage Path <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://cloud.storage.com/proofs/artwork.pdf"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Filename Field */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1">
              Deliverable / Asset Filename <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. Discovery_Vitality_Banner_Final_Print.pdf"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Associate Project & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-200 mb-1">Associate Project</label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
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
              <label className="block font-semibold text-slate-200 mb-1">Deliverable Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="proofs">Deliverable Proof (Artwork / Design)</option>
                <option value="brief">Brief Attachment</option>
                <option value="ci_brand">CI Brand Guidelines & Vector Art</option>
                <option value="approved_files">Approved Master File</option>
                <option value="release">Release Package</option>
              </select>
            </div>
          </div>

          {/* Version, Size & MIME */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-200 mb-1">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="V1.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-200 mb-1">File Size</label>
              <input
                type="text"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="2.4 MB"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-200 mb-1">Format / MIME</label>
              <input
                type="text"
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
                placeholder="application/pdf"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1">
              Description / Deliverable Proof Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 300 DPI high-resolution CMYK master with 3mm bleed, Pantone spot colors..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReading || isUploading}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{isReading ? 'Reading File...' : isUploading ? 'Uploading to Server...' : 'Upload & Add to Vault'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
