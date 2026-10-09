import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientRecord } from '../../types';
import {
  AlertCircle,
  Building2,
  Check,
  Globe,
  Mail,
  Palette,
  Phone,
  Plus,
  Sparkles,
  Type,
  User,
  X,
} from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (clientId: string) => void;
}

const PRESET_PALETTES = [
  ['#4F46E5', '#06B6D4', '#F8FAFC', '#0F172A'],
  ['#004080', '#FF6600', '#F4F7FB', '#1E293B'],
  ['#C3002F', '#000000', '#8A8D8F', '#FFFFFF'],
  ['#0033A0', '#0091FF', '#F0F4FF', '#0A192F'],
  ['#002B49', '#C5A059', '#E6EFF5', '#111827'],
  ['#000000', '#2D6A4F', '#F8F9FA', '#1F2937'],
];

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const { addClient } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Primary Contact
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPosition, setContactPosition] = useState('');

  // CI Specifications
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [ciDocumentUrl, setCiDocumentUrl] = useState('');
  const [fontRequirements, setFontRequirements] = useState('Inter, Helvetica Neue, sans-serif');
  const [colors, setColors] = useState<string[]>(['#4F46E5', '#06B6D4', '#F8FAFC', '#0F172A']);
  const [newColor, setNewColor] = useState('#6366F1');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCode('');
      setWebsite('');
      setLogoUrl('');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactPosition('');
      setBrandGuidelines('');
      setCiDocumentUrl('');
      setFontRequirements('Inter, Helvetica Neue, sans-serif');
      setColors(['#4F46E5', '#06B6D4', '#F8FAFC', '#0F172A']);
      setNewColor('#6366F1');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code.length <= 4) {
      const generatedCode = val
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase();
      if (generatedCode) setCode(generatedCode);
    }
  };

  const handleAddColor = () => {
    if (newColor && !colors.includes(newColor)) {
      setColors([...colors, newColor]);
    }
  };

  const handleRemoveColor = (idx: number) => {
    setColors(colors.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please provide a Client or Account Name.');
      return;
    }

    const trimmedCode = (code.trim() || trimmedName.slice(0, 4)).toUpperCase();
    const generatedId = `cl-${trimmedCode.toLowerCase()}-${Date.now().toString(36)}`;

    setIsSubmitting(true);

    const newClientRecord: ClientRecord = {
      id: generatedId,
      name: trimmedName,
      code: trimmedCode,
      logoUrl: logoUrl.trim() || '',
      brandGuidelines: brandGuidelines.trim() || 'Strict compliance with corporate brand guidelines.',
      ciDocumentUrl: ciDocumentUrl.trim() || undefined,
      primaryContact: {
        name: contactName.trim() || 'Account Representative',
        email: contactEmail.trim() || '',
        phone: contactPhone.trim() || '',
        position: contactPosition.trim() || 'Client Lead',
      },
      primaryEmail: contactEmail.trim() || '',
      brandColors: colors,
      fontFamily: fontRequirements.trim(),
      guidelinesNotes: brandGuidelines.trim(),
      website: website.trim() || '',
      notes: brandGuidelines.trim(),
      defaultCiColors: colors,
      fontRequirements: fontRequirements.trim(),
      activeProjectsCount: 0,
    };

    try {
      addClient(newClientRecord);
      setIsSubmitting(false);
      if (onClientCreated) {
        onClientCreated(newClientRecord.id);
      }
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to save client record.');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Register New Client / Corporate Account
              </h2>
              <p className="text-xs text-slate-400">
                Create enterprise account profile, contact lead, and Corporate Identity (CI) specifications
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Basic Company Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Company & Account Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Client / Account Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Acme Corporation (Global)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ACME"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Website (Optional)
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.acmecorp.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://.../logo.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Primary Contact Lead */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Primary Approver & Key Contact</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Full Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={contactPosition}
                  onChange={(e) => setContactPosition(e.target.value)}
                  placeholder="e.g. VP Brand Strategy & Communications"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Work Email (for Approvals & Alerts)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="sarah.jenkins@acmecorp.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Direct Phone / Mobile
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+27 (0)11 500 1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Brand Identity & CI Specifications */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Corporate Identity (CI) & Brand Guidelines</span>
            </h3>

            {/* Approved Colors */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Approved Brand Hex Color Palette
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {colors.map((color, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded border border-white/20 shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-[11px] text-white">{color}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(i)}
                      className="text-slate-500 hover:text-rose-400 ml-1 font-bold text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="#4F46E5"
                  className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Color</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 ml-auto text-[10px] text-slate-400">
                  <span>Quick Presets:</span>
                  {PRESET_PALETTES.map((pal, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setColors(pal)}
                      className="flex -space-x-1 p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Apply preset palette"
                    >
                      {pal.slice(0, 3).map((col, ci) => (
                        <div
                          key={ci}
                          className="w-2.5 h-2.5 rounded-full border border-slate-900"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Approved Typography Stack / Font Families
              </label>
              <div className="relative">
                <Type className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={fontRequirements}
                  onChange={(e) => setFontRequirements(e.target.value)}
                  placeholder="e.g. Proxima Nova Bold, Trajan Pro Regular, Inter"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Guidelines & Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Brand Identity Guidelines & Production Restrictions
              </label>
              <textarea
                rows={3}
                value={brandGuidelines}
                onChange={(e) => setBrandGuidelines(e.target.value)}
                placeholder="e.g. Minimum 20mm clear space around emblem. No alteration to secondary gold accent #C5A059. Requires executive proof approval 7 days prior to release."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creating Account...' : 'Register Client Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
