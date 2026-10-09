import React, { useState } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, X, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface VerificationCodeModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onSuccess: (code: string) => void;
  onRequestAnotherCode: () => void;
  onBack?: () => void;
}

export const VerificationCodeModal: React.FC<VerificationCodeModalProps> = ({
  isOpen,
  email,
  onClose,
  onSuccess,
  onRequestAnotherCode,
  onBack,
}) => {
  const { verifyResetCode, forgotPassword } = useApp();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>('Verification code sent');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim();
    if (!cleanCode) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      setErrorMessage('Verification code must be exactly 6 numeric digits (e.g. 824615).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyResetCode(email, cleanCode);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Invalid or expired verification code.');
      } else {
        // Explicitly display the required confirmation
        setSuccessMessage('Verification successful');
        setTimeout(() => {
          onSuccess(cleanCode);
        }, 800);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Verification service error.');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage(null);
    try {
      const res = await forgotPassword(email);
      setIsResending(false);
      if (res.success) {
        setSuccessMessage('Verification code sent');
      } else {
        setErrorMessage(res.error || 'Failed to dispatch new code.');
      }
    } catch {
      setIsResending(false);
      setErrorMessage('Failed to dispatch code. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Enter Verification Code</h2>
              <p className="text-[11px] text-slate-400">Step 2 of 3: Verify Code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
            <span className="text-emerald-400 flex items-center gap-1">✓ Email Sent</span>
            <span className="text-indigo-400">2. Verify Code</span>
            <span>3. New Password</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-2/3 transition-all duration-300 rounded-full" />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Target Notification */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">Dispatched to:</span>
            <span className="font-mono text-white font-semibold truncate max-w-[220px]">{email}</span>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1 font-semibold">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                6-Digit Verification Code <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(val);
                  }}
                  placeholder="824615"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono text-lg tracking-[0.3em] placeholder:tracking-normal placeholder:font-sans placeholder:text-xs outline-none transition-all placeholder:text-slate-600 text-center"
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Expires in 15 minutes
                </span>
                <span>Max 5 attempts allowed</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'Verifying Code...' : 'Verify Code'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Resend Action */}
          <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/80">
            <span className="text-slate-400">Didn't receive the email?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>{isResending ? 'Resending...' : 'Request another code'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
