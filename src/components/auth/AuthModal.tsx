import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { DepartmentId, UserRole } from '../../types';
import { AvatarUploader } from '../common/AvatarUploader';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
];

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    loginUser,
    registerUser,
    forgotPassword,
    resetPassword,
    users,
    setCurrentUser,
  } = useApp();

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('Password123!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('designer');
  const [regDepartment, setRegDepartment] = useState<DepartmentId>('marketing');
  const [regRoleTitle, setRegRoleTitle] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
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
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginUser(loginEmail, loginPassword);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to authenticate.');
      } else {
        setIsAuthModalOpen(false);
      }
    }, 200);
  };

  // Quick Demo Login
  const handleQuickDemoLogin = (email: string) => {
    resetMessages();
    setLoginEmail(email);
    setLoginPassword('Password123!');
    const res = loginUser(email, 'Password123!');
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication error.');
    } else {
      setIsAuthModalOpen(false);
    }
  };

  // 2. Handle Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
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
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
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
    setTimeout(() => {
      const res = registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        roleTitle: regRoleTitle,
        departmentId: regDepartment,
        avatar: selectedAvatar,
      });

      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to register account.');
      } else {
        setSuccessMessage('Account registered successfully! Logging you into the workspace...');
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 600);
      }
    }, 300);
  };

  // 3. Handle Forgot Password Steps
  const handleForgotRequest = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = forgotPassword(forgotEmail);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Account not found.');
      } else {
        setGeneratedToken(res.resetToken || 'SEC-849201');
        setInputToken(res.resetToken || 'SEC-849201'); // Pre-fill for easy demonstration
        setForgotStep(2);
        setSuccessMessage(`Recovery token generated and sent to ${forgotEmail}.`);
      }
    }, 250);
  };

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!inputToken.trim() || inputToken.trim() !== generatedToken.trim()) {
      setErrorMessage('Invalid or expired recovery token. Please check the code provided.');
      return;
    }

    setForgotStep(3);
    setSuccessMessage('Token verified. Please enter your new password.');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match. Please re-enter to confirm.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = resetPassword(forgotEmail, inputToken, newPassword);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update password.');
      } else {
        setSuccessMessage('Password reset successfully! You may now sign in with your new password.');
        setTimeout(() => {
          setLoginEmail(forgotEmail);
          setLoginPassword(newPassword);
          handleSwitchMode('login');
        }, 1200);
      }
    }, 300);
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
                {authModalMode === 'register' && 'Register as a team member, department lead, QA specialist, or client partner.'}
                {authModalMode === 'forgot_password' && 'Recover access to your account using secure token verification.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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

                  <span className="text-[11px] text-slate-500">Default demo pass: <code className="text-indigo-300">Password123!</code></span>
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

              {/* Quick Demo Switcher */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Quick Demo One-Click Login
                  </span>
                  <span className="text-[10px] text-slate-500">Instant Role Simulation</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('eleanor.vance@uicms.com')}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate">Super Admin</div>
                      <div className="text-[9px] text-slate-400 truncate">Eleanor Vance</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('marcus.sterling@uicms.com')}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate">Dept Manager</div>
                      <div className="text-[9px] text-slate-400 truncate">Marcus Sterling</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('liam.gallagher@uicms.com')}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate">Art Director</div>
                      <div className="text-[9px] text-slate-400 truncate">Liam Gallagher</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('hannah.wright@uicms.com')}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate">QA Lead</div>
                      <div className="text-[9px] text-slate-400 truncate">Hannah Wright</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('chloe.bennett@uicms.com')}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate">Account Director</div>
                      <div className="text-[9px] text-slate-400 truncate">Chloe Bennett</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('bradley.cooper@discovery.co.za')}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate">Client Approver</div>
                      <div className="text-[9px] text-slate-400 truncate">Bradley Cooper</div>
                    </div>
                  </button>
                </div>
              </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Primary Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition-all"
                  >
                    <option value="designer">Designer / Art Director</option>
                    <option value="qa_user">QA Inspector / Pre-flight Lead</option>
                    <option value="account_manager">Account Manager / Director</option>
                    <option value="department_manager">Department Manager</option>
                    <option value="client">Client Partner / Brand Approver</option>
                    <option value="super_admin">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Department
                  </label>
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

              {/* Avatar Selector */}
              <AvatarUploader
                currentAvatar={selectedAvatar}
                onAvatarChange={setSelectedAvatar}
                userName={regName || 'New User'}
                label="Profile Avatar (Upload Photo or Choose Preset)"
                helperText="Upload your custom profile photo (PNG, JPG, WebP) or select from team presets."
                size="md"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password (min. 6 characters) <span className="text-rose-400">*</span>
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

          {/* ======================= MODE 3: FORGOT PASSWORD ======================= */}
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
                  <span>Request Code</span>
                </div>
                <div className="h-[1px] w-8 bg-slate-800" />
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    forgotStep === 2 ? 'bg-indigo-600 text-white' : forgotStep > 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    2
                  </span>
                  <span>Verify Token</span>
                </div>
                <div className="h-[1px] w-8 bg-slate-800" />
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    forgotStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    3
                  </span>
                  <span>New Password</span>
                </div>
              </div>

              {/* Step 1: Request code */}
              {forgotStep === 1 && (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Enter Account Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your.email@uicms.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    A secure 6-digit recovery PIN will be generated for your verified registered identity.
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isLoading ? 'Generating Token...' : 'Send Recovery Token'}</span>
                  </button>
                </form>
              )}

              {/* Step 2: Verify Token */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyToken} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1">
                    <span className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider block">
                      Simulated Security Dispatch
                    </span>
                    <p className="text-xs text-slate-300">
                      Recovery code dispatched to <span className="font-semibold text-white">{forgotEmail}</span>:
                    </p>
                    <div className="mt-2 p-2 rounded bg-slate-950 border border-indigo-500/40 text-center font-mono text-sm font-bold text-indigo-400 tracking-widest">
                      {generatedToken}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Enter Recovery Token
                    </label>
                    <input
                      type="text"
                      required
                      value={inputToken}
                      onChange={(e) => setInputToken(e.target.value)}
                      placeholder="SEC-XXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs font-mono outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Verify & Continue</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Set New Password */}
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isLoading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
