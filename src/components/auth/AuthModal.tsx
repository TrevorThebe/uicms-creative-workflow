import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { DepartmentId } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    loginUser,
    registerUser,
    forgotPassword,
    resetPassword,
    inactivityNotice,
    setInactivityNotice,
  } = useApp();

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regDepartment, setRegDepartment] = useState<DepartmentId>('marketing');
  const [regRoleTitle, setRegRoleTitle] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Forgot Password / Recovery State
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);


  // Feedback messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSwitchMode = (mode: 'login' | 'register' | 'forgot_password') => {
    resetMessages();
    setAuthModalMode(mode);
    setForgotStep(1);
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    const res = await loginUser(loginEmail, loginPassword);
    setIsLoading(false);
    if (!res.success) setErrorMessage(res.error || 'Failed to authenticate.');
    else setIsAuthModalOpen(false);
  };

  // 2. Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!regName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }
    if (!regPassword || regPassword.length < 12) {
      setErrorMessage('Password must be at least 12 characters in length.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-type to confirm.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please accept the system security and governance policy to proceed.');
      return;
    }

    setIsLoading(true);
    const res = await registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: 'designer',
      roleTitle: regRoleTitle,
      departmentId: regDepartment,
    });
    setIsLoading(false);
    if (!res.success) setErrorMessage(res.error || 'Failed to register account.');
    else setSuccessMessage('Account created with team-member access.');
  };

  // 3. Handle Account Recovery & Temporary Password Dispatch
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    const res = await forgotPassword(forgotEmail);
    setIsLoading(false);
    if (!res.success) setErrorMessage(res.error || 'Password reset service is unavailable.');
    else {
      setForgotStep(2);
      setSuccessMessage(res.message || 'If the account exists, a reset code has been emailed.');
    }
  };

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!inputToken.trim()) return setErrorMessage('Enter the reset code from your email.');

    setForgotStep(3);
    setSuccessMessage('Token verified. Please enter your new password.');
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!newPassword || newPassword.length < 12) {
      setErrorMessage('Password must be at least 12 characters in length.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match. Please re-enter to confirm.');
      return;
    }

    setIsLoading(true);
    const res = await resetPassword(forgotEmail, inputToken, newPassword);
    setIsLoading(false);
    if (!res.success) setErrorMessage(res.error || 'Failed to update password.');
    else {
      setSuccessMessage('Password reset successfully. Sign in with your new password.');
      setForgotStep(1);
      setInputToken('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => handleSwitchMode('login'), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
              {authModalMode === 'login' && <Lock className="w-5 h-5" />}
              {authModalMode === 'register' && <UserPlus className="w-5 h-5" />}
              {authModalMode === 'forgot_password' && <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {authModalMode === 'login' && 'Sign In to Creative Operations Portal'}
                {authModalMode === 'register' && 'Create New User Account'}
                {authModalMode === 'forgot_password' && 'Account Recovery & Password Reset'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {authModalMode === 'login' && 'Enter your credentials to access your projects, QA queues, and deliverables.'}
                {authModalMode === 'register' && 'Create a team-member account. An administrator can assign additional access.'}
                {authModalMode === 'forgot_password' && 'Reset your password using a one-time code sent to your registered email.'}
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2">
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              authModalMode === 'login'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              authModalMode === 'register'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Account
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('forgot_password')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              authModalMode === 'forgot_password'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Forgot Password
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Inactivity Auto-Logout Timeout Notice */}
          {inactivityNotice && (
            <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-start gap-3 text-amber-200 text-xs animate-in fade-in shadow-lg">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-amber-300 block text-xs">
                  Session Timed Out (5-Min Inactivity)
                </span>
                <span className="text-amber-200/90 leading-relaxed">{inactivityNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setInactivityNotice(null)}
                className="text-amber-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {/* ======================= MODE 1: LOGIN ======================= */}
          {authModalMode === 'login' && (
            <div className="space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@uicms.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('forgot_password')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-slate-400">Remember session</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot_password')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ======================= MODE 2: REGISTER ======================= */}
          {authModalMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Work Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="jane.doe@uicms.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
                <select
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value as DepartmentId)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition-all"
                >
                  <option value="marketing">Marketing & Production</option>
                  <option value="incentive_travel">Incentive Travel Collateral</option>
                  <option value="online_ram">Online (RAM) & Rewards</option>
                  <option value="development">Development & Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Custom Job Title / Role Designation (Optional)
                </label>
                <input
                  type="text"
                  value={regRoleTitle}
                  onChange={(e) => setRegRoleTitle(e.target.value)}
                  placeholder="e.g., Senior 3D Motion Graphics Specialist"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                />
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password (min. 12 characters) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 w-4 h-4 mt-0.5"
                />
                <span className="text-[11px] text-slate-400 leading-relaxed">
                  I agree to adhere to corporate Brand Identity rules, client confidentiality governance, and ISO/QA sign-off guidelines.
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Creating Account...' : 'Complete Registration & Sign In'}</span>
              </button>
            </form>
          )}

          {/* ======================= MODE 3: PASSWORD RESET ======================= */}
          {authModalMode === 'forgot_password' && (
            <div className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    forgotStep === 1 ? 'bg-indigo-600 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    1
                  </span>
                  <span>Account Email</span>
                </div>
                <div className="h-[1px] w-8 bg-slate-800" />
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    forgotStep === 2 ? 'bg-indigo-600 text-white' : forgotStep > 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    2
                  </span>
                  <span>Reset Code</span>
                </div>
                <div className="h-[1px] w-8 bg-slate-800" />
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    forgotStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    3
                  </span>
                  <span>Set New Password</span>
                </div>
              </div>

              {/* Step 1: Request a one-time reset code */}
              {forgotStep === 1 && (
                <div className="space-y-4">
                  <form onSubmit={handleForgotRequest} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Account Work Email <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. eleanor.vance@uicms.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Enter your registered workspace account email.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-slate-300 text-xs flex items-start gap-2">
                      <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span>
                        If the account exists, a one-time reset code will be sent to its registered email address.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isLoading ? 'Sending...' : 'Send Reset Code'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: Enter the reset code sent by email */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyToken} className="space-y-4">
                  <p className="text-xs text-slate-300">Enter the one-time code sent to the registered email address for {forgotEmail}.</p>
                  <input
                    type="text"
                    required
                    autoComplete="one-time-code"
                    value={inputToken}
                    onChange={(event) => setInputToken(event.target.value)}
                    placeholder="Reset code"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 font-mono text-sm text-white outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-between gap-3">
                    <button type="button" onClick={() => setForgotStep(1)} className="rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">Request another code</button>
                    <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500">Continue</button>
                  </div>
                </form>
              )}

              {/* Step 3: Set Custom New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      New Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotStep(2)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isLoading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
