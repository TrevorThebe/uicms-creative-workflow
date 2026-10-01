import React, { useState, useRef } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

export const DEFAULT_AVATAR_PRESETS = [
  {
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    label: 'Professional Lead (Eleanor)',
    gender: 'female',
  },
  {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    label: 'Creative Director (Sarah)',
    gender: 'female',
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    label: 'Senior Designer (Liam)',
    gender: 'male',
  },
  {
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    label: 'QA Inspector (Priya)',
    gender: 'female',
  },
  {
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    label: 'Dept Head (Marcus)',
    gender: 'male',
  },
  {
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    label: 'Account Exec (Chloe)',
    gender: 'female',
  },
  {
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    label: 'Brand Approver (Alex)',
    gender: 'male',
  },
  {
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
    label: 'UI/UX Specialist (Zoe)',
    gender: 'female',
  },
  {
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    label: 'Motion Graphics (Devon)',
    gender: 'male',
  },
  {
    url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80',
    label: 'Production Coordinator (Elena)',
    gender: 'female',
  },
];

interface AvatarUploaderProps {
  currentAvatar: string;
  onAvatarChange: (newAvatarUrl: string) => void;
  userName?: string;
  label?: string;
  helperText?: string;
  size?: 'md' | 'lg';
  showPresets?: boolean;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatar,
  onAvatarChange,
  userName = 'User',
  label = 'Profile Photo / Avatar',
  helperText = 'Upload a custom photo (PNG, JPG, WebP) or enter an image URL.',
  size = 'lg',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current avatar is a custom data URL or custom URL
  const isCustomUploaded = currentAvatar?.startsWith('data:image/');

  const handleFileProcess = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, GIF, WebP, SVG).');
      return;
    }

    // Validate size (max 8MB before compression)
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size exceeds 8MB limit. Please choose a smaller photo.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsProcessing(false);
        setUploadError('Failed to read image data.');
        return;
      }

      // If svg file, keep directly if under 100KB, else convert
      if (file.type === 'image/svg+xml' && file.size < 100 * 1024) {
        onAvatarChange(result);
        setUploadSuccess(`"${file.name}" uploaded successfully!`);
        setIsProcessing(false);
        setTimeout(() => setUploadSuccess(null), 3000);
        return;
      }

      // Resize and compress via HTML Canvas to maintain tiny memory and localStorage footprint (<30KB)
      const img = new Image();
      img.onload = () => {
        try {
          const maxDimension = 240; // High quality avatar size
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to efficient JPEG data URL
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            onAvatarChange(compressed);
            setUploadSuccess(`"${file.name}" optimized and uploaded!`);
          } else {
            onAvatarChange(result);
            setUploadSuccess(`"${file.name}" uploaded successfully!`);
          }
        } catch {
          onAvatarChange(result);
          setUploadSuccess(`"${file.name}" uploaded successfully!`);
        }
        setIsProcessing(false);
        setTimeout(() => setUploadSuccess(null), 3000);
      };

      img.onerror = () => {
        onAvatarChange(result);
        setUploadSuccess(`"${file.name}" uploaded successfully!`);
        setIsProcessing(false);
        setTimeout(() => setUploadSuccess(null), 3000);
      };

      img.src = result;
    };

    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try again.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input value so re-uploading same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    onAvatarChange(customUrl.trim());
    setUploadSuccess('Custom image URL applied!');
    setShowUrlInput(false);
    setCustomUrl('');
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  const handleResetToDefault = () => {
    onAvatarChange(DEFAULT_AVATAR_PRESETS[0].url);
    setUploadSuccess('Reset to default system avatar.');
    setTimeout(() => setUploadSuccess(null), 2500);
  };

  const avatarDimensions = size === 'lg' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-14 h-14';

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-200">
            {label}
          </label>
          <span className="text-[10px] text-slate-400">
            {isCustomUploaded ? 'Custom Photo' : currentAvatar?.startsWith('http') ? 'Linked Image' : 'Profile Photo'}
          </span>
        </div>
      )}

      {/* Main Avatar Preview & Upload Trigger Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-3.5 rounded-2xl border transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/50'
            : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Avatar Thumbnail with Camera Action Badge */}
          <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
            <img
              src={currentAvatar || DEFAULT_AVATAR_PRESETS[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={userName}
              className={`${avatarDimensions} rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-lg group-hover:opacity-80 transition-all`}
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Change</span>
            </div>
            {isCustomUploaded && (
              <span
                title="Custom uploaded photo"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-slate-900"
              >
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Action Buttons & Drop Instructions */}
          <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Processing...' : 'Upload Photo'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Image URL</span>
              </button>

              {isCustomUploaded && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Clear photo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              {isDragging ? (
                <span className="text-indigo-400 font-semibold">Drop your image file here to set as photo!</span>
              ) : (
                helperText
              )}
            </p>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Custom URL Input Accordion */}
        {showUrlInput && (
          <form onSubmit={handleApplyCustomUrl} className="mt-3 pt-3 border-t border-slate-800/80 flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/my-photo.jpg"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Apply URL
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Upload Alerts */}
        {uploadError && (
          <div className="mt-2.5 p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
            <X className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
            <span>{uploadSuccess}</span>
          </div>
        )}
      </div>
    </div>
  );
};
