import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Save,
  Shield,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { DepartmentId } from '../../types';
import { AvatarUploader } from '../common/AvatarUploader';

export const UserProfileModal: React.FC = () => {
  const {
    currentUser,
    isProfileModalOpen,
    setIsProfileModalOpen,
    updateUserProfile,
    updateUserPassword,
    resetUserEmail,
    deleteUser,
    logoutUser,
    users,
  } = useApp();

  // Profile Edit State
  const [name, setName] = useState(currentUser.name);
  const [roleTitle, setRoleTitle] = useState(currentUser.roleTitle);
  const [departmentId, setDepartmentId] = useState<DepartmentId>(currentUser.departmentId);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Email Reset State
  const [workEmail, setWorkEmail] = useState(currentUser.email);
  const [personalEmail, setPersonalEmail] = useState(currentUser.personalEmail || '');
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isResettingEmail, setIsResettingEmail] = useState(false);

  // Sync state when currentUser changes or modal opens
  useEffect(() => {
    if (isProfileModalOpen) {
      setName(currentUser.name);
      setRoleTitle(currentUser.roleTitle);
      setDepartmentId(currentUser.departmentId);
      setAvatar(currentUser.avatar);
      setWorkEmail(currentUser.email);
      setPersonalEmail(currentUser.personalEmail || '');
      setProfileSuccess(null);
      setProfileError(null);
      setEmailSuccess(null);
      setEmailError(null);
      setPasswordSuccess(null);
      setPasswordError(null);
    }
  }, [isProfileModalOpen, currentUser]);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [reassignUserId, setReassignUserId] = useState<string>('');

  if (!isProfileModalOpen) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim()) {
      setProfileError('Full Name cannot be blank.');
      return;
    }

    const res = await updateUserProfile(currentUser.id, {
      name: name.trim(),
      roleTitle: roleTitle.trim(),
      departmentId,
      avatar,
    });

    if (!res.success) {
      setProfileError(res.error || 'Failed to update profile.');
    } else {
      setProfileSuccess('Profile and avatar updated successfully!');
      setTimeout(() => setProfileSuccess(null), 3500);
    }
  };

  const handleEmailReset = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const cleanWork = workEmail.trim().toLowerCase();
    const cleanPersonal = personalEmail.trim().toLowerCase();

    if (!cleanWork || !cleanWork.includes('@') || !cleanWork.includes('.')) {
      setEmailError('Please enter a valid work email address format.');
      return;
    }

    if (cleanPersonal && (!cleanPersonal.includes('@') || !cleanPersonal.includes('.'))) {
      setEmailError('Please enter a valid personal email address format.');
      return;
    }

    setIsResettingEmail(true);
    setTimeout(() => {
      const res = resetUserEmail(currentUser.id, cleanWork, cleanPersonal || undefined);
      setIsResettingEmail(false);
      if (!res.success) {
        setEmailError(res.error || 'Failed to reset email address.');
      } else {
        setEmailSuccess('Email address updated. Future password reset codes will be sent to this address.');
        setTimeout(() => setEmailSuccess(null), 4000);
      }
    }, 250);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.length < 12) {
      setPasswordError('New password must be at least 12 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const res = await updateUserPassword(currentUser.id, oldPassword, newPassword);
    if (!res.success) {
      setPasswordError(res.error || 'Failed to update password.');
    } else {
      setPasswordSuccess('Password successfully updated!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3500);
    }
  };

  const handleDeleteSelfAccount = () => {
    if (deleteConfirmText !== currentUser.email) {
      setProfileError(`Please type your exact email (${currentUser.email}) to confirm deletion.`);
      return;
    }

    const res = deleteUser(currentUser.id, reassignUserId || undefined);
    if (res.success) {
      setIsProfileModalOpen(false);
    } else {
      setProfileError(res.error || 'Failed to delete account.');
    }
  };

  const otherUsers = users.filter((u) => u.id !== currentUser.id && u.active && !u.isSuspended);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsProfileModalOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div className="flex items-center gap-3.5">
            <img
              src={avatar || currentUser.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{currentUser.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {currentUser.isSuspended ? 'Suspended' : 'Active Account'}
                </span>
              </div>
              <p className="text-xs text-indigo-400 font-medium">{currentUser.roleTitle}</p>
              <p className="text-[11px] text-slate-400">{currentUser.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs no-scrollbar">
          {/* Section 1: Avatar & Personal Information */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Profile Avatar & Details
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">ID: {currentUser.id}</span>
            </div>

            {profileError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              {/* Avatar Uploader Component */}
              <AvatarUploader
                currentAvatar={avatar}
                onAvatarChange={(newAvatar) => setAvatar(newAvatar)}
                userName={name || currentUser.name}
                label="Account Profile Photo"
                helperText="Upload your custom photo (PNG, JPG, WebP) or enter an image URL."
                size="lg"
                showPresets={false}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Job Title / Role Designation
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g., Senior Motion Designer"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value as DepartmentId)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                  >
                    <option value="marketing">Marketing & Production</option>
                    <option value="incentive_travel">Incentive Travel Collateral</option>
                    <option value="online_ram">Online (RAM) & Rewards</option>
                    <option value="development">Development & Engineering</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Profile & Photo</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Email & Account Recovery Settings (Reset Email in App) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Email Addresses & Account Recovery
                </h3>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                Reset Email in App
              </span>
            </div>

            {emailError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
                {emailError}
              </div>
            )}
            {emailSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{emailSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEmailReset} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Work Email (Account Login) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder="e.g. your.name@uicms.com"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Primary login identity for this account.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Personal Email (Temporary Password Delivery)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      placeholder="e.g. personal.name@gmail.com"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Temporary passwords and recovery codes are sent to this address.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Update or reset your work & personal email addresses anytime.
                </span>
                <button
                  type="submit"
                  disabled={isResettingEmail}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isResettingEmail ? 'Updating Email...' : 'Reset & Save Email'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Security & Password */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Update Password
              </h3>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save New Password</span>
              </button>
            </form>
          </div>

          {/* Section 3: Account Actions & Danger Zone */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                Account Deletion & Removal
              </h3>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Permanently delete your account from the system. If you own active projects or open deliverables, you can assign them to a team member below.
            </p>

            {!isDeletingAccount ? (
              <button
                type="button"
                onClick={() => setIsDeletingAccount(true)}
                className="px-3.5 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/30 font-semibold transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete My Account</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/40 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Reassign Active Projects & Tasks To (Optional):
                  </label>
                  <select
                    value={reassignUserId}
                    onChange={(e) => setReassignUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs outline-none"
                  >
                    <option value="">-- Leave Unassigned / Department Pool --</option>
                    {otherUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                    Type your email <span className="font-mono text-white font-bold">{currentUser.email}</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={currentUser.email}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-rose-500/40 text-white text-xs outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={deleteConfirmText !== currentUser.email}
                    onClick={handleDeleteSelfAccount}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDeletingAccount(false);
                      setDeleteConfirmText('');
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
