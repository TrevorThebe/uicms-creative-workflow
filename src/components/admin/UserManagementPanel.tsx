import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Edit2,
  Filter,
  KeyRound,
  Lock,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { DepartmentId, User, UserRole } from '../../types';
import { AvatarUploader } from '../common/AvatarUploader';

export const UserManagementPanel: React.FC = () => {
  const {
    currentUser,
    users,
    suspendUser,
    reactivateUser,
    deleteUser,
    updateUserProfile,
    updateUserPassword,
    setIsAuthModalOpen,
    setAuthModalMode,
    forgotPassword,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPersonalEmail, setEditPersonalEmail] = useState('');
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState<DepartmentId>('marketing');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('designer');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Suspension Modal State
  const [suspendingUser, setSuspendingUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState('Security audit review or contract expiration');

  // Deletion Modal State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  // Password Recovery Dispatch State
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManager = currentUser.role === 'department_manager' || isSuperAdmin;

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPersonalEmail(u.personalEmail || '');
    setEditRoleTitle(u.roleTitle);
    setEditDepartment(u.departmentId);
    setEditAvatar(u.avatar);
    setEditRole(u.role);
    setEditPassword('');
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    if (!editName.trim()) {
      setEditError('User name cannot be blank.');
      return;
    }

    if (!editEmail.trim() || !editEmail.includes('@')) {
      setEditError('Please enter a valid work email address.');
      return;
    }

    if (editPassword.trim()) {
      if (editPassword.trim().length < 6) {
        setEditError('New password must be at least 6 characters in length.');
        return;
      }
      const passRes = updateUserPassword(editingUser.id, '', editPassword.trim());
      if (!passRes.success) {
        setEditError(passRes.error || 'Failed to update user password.');
        return;
      }
    }

    const res = updateUserProfile(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      personalEmail: editPersonalEmail.trim() || undefined,
      roleTitle: editRoleTitle.trim(),
      departmentId: editDepartment,
      avatar: editAvatar,
      role: editRole,
    });

    if (res.success) {
      setActionSuccess(`Profile & role allocated for ${editName} (${editRole.replace('_', ' ')}).`);
      setEditingUser(null);
      setTimeout(() => setActionSuccess(null), 3500);
    } else {
      setEditError(res.error || 'Failed to update user profile.');
    }
  };

  const handleQuickRoleAllocate = (user: User, newRole: UserRole) => {
    if (user.role === newRole) return;
    const res = updateUserProfile(user.id, { role: newRole });
    if (res.success) {
      setActionSuccess(`Role for ${user.name} allocated to ${newRole.replace('_', ' ').toUpperCase()}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      alert(res.error || 'Failed to reallocate role.');
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesDept = departmentFilter === 'all' || u.departmentId === departmentFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.active && !u.isSuspended) ||
      (statusFilter === 'suspended' && (u.isSuspended || !u.active));

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  const handleConfirmSuspend = () => {
    if (!suspendingUser) return;
    const res = suspendUser(suspendingUser.id, suspendReason);
    if (res.success) {
      setActionSuccess(`User ${suspendingUser.name} has been suspended.`);
      setSuspendingUser(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      alert(res.error || 'Failed to suspend user.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const res = deleteUser(deletingUser.id, reassignTargetId || undefined);
    if (res.success) {
      setActionSuccess(`User ${deletingUser.name} was permanently removed.`);
      setDeletingUser(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      alert(res.error || 'Failed to delete user.');
    }
  };

  const handleSendRecoveryPin = (u: User) => {
    const res = forgotPassword(u.email);
    if (res.success) {
      setActionSuccess(`Temporary password (${res.tempPassword}) dispatched to personal email (${res.sentToEmail}) for ${u.name}.`);
      setTimeout(() => setActionSuccess(null), 5000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">User Administration & Access Governance</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage corporate credentials, onboard new personnel, suspend access, and govern permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAuthModalMode('register');
            setIsAuthModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register / Add New User</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or title..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="department_manager">Department Manager</option>
            <option value="account_manager">Account Manager</option>
            <option value="designer">Designer / Art Director</option>
            <option value="qa_user">QA Specialist</option>
            <option value="client">Client Approver</option>
          </select>
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
          >
            <option value="all">All Departments</option>
            <option value="marketing">Marketing & Production</option>
            <option value="incentive_travel">Incentive Travel</option>
            <option value="online_ram">Online (RAM)</option>
            <option value="development">Development</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User / Professional</th>
                <th className="py-3 px-4">Email & Department</th>
                <th className="py-3 px-4">Role & Governance</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No matching users found for this filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserSuspended = u.isSuspended || !u.active;
                  const isCurrent = u.id === currentUser.id;

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        isUserSuspended ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-normal">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.roleTitle}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email & Department */}
                      <td className="py-3 px-4">
                        <div className="text-slate-300">{u.email}</div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {u.departmentId.replace('_', ' ')}
                        </div>
                      </td>

                      {/* Role Allocation Badge & Selector */}
                      <td className="py-3 px-4">
                        {isSuperAdmin ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleQuickRoleAllocate(u, e.target.value as UserRole)}
                            title="Reallocate role permissions"
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer transition-all ${
                              u.role === 'super_admin'
                                ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 focus:border-purple-400'
                                : u.role === 'department_manager'
                                ? 'bg-blue-950/80 text-blue-300 border-blue-500/50 focus:border-blue-400'
                                : u.role === 'qa_user'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 focus:border-emerald-400'
                                : u.role === 'designer'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 focus:border-amber-400'
                                : u.role === 'client'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 focus:border-rose-400'
                                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 focus:border-cyan-400'
                            }`}
                          >
                            <option value="super_admin" className="bg-slate-900 text-purple-300">SUPER ADMIN</option>
                            <option value="department_manager" className="bg-slate-900 text-blue-300">DEPT MANAGER</option>
                            <option value="account_manager" className="bg-slate-900 text-cyan-300">ACCOUNT MGR</option>
                            <option value="designer" className="bg-slate-900 text-amber-300">DESIGNER / PRODUCER</option>
                            <option value="qa_user" className="bg-slate-900 text-emerald-300">QA LEAD</option>
                            <option value="client" className="bg-slate-900 text-rose-300">CLIENT APPROVER</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'super_admin'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : u.role === 'department_manager'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : u.role === 'qa_user'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : u.role === 'designer'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : u.role === 'client'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {u.role.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isUserSuspended ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                              <Ban className="w-2.5 h-2.5" />
                              Suspended
                            </span>
                            {u.suspendedReason && (
                              <div className="text-[9px] text-rose-400/80 mt-0.5 max-w-xs truncate" title={u.suspendedReason}>
                                {u.suspendedReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit User Profile & Avatar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User Profile & Avatar"
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Send Recovery Code */}
                          <button
                            type="button"
                            onClick={() => handleSendRecoveryPin(u)}
                            title="Generate Password Recovery PIN"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Reactivate */}
                          {isUserSuspended ? (
                            <button
                              type="button"
                              onClick={() => reactivateUser(u.id)}
                              title="Reactivate Account"
                              className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-300 border border-emerald-500/30 font-semibold text-[10px] transition-all flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reactivate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isCurrent && isSuperAdmin}
                              onClick={() => setSuspendingUser(u)}
                              title={isCurrent && isSuperAdmin ? 'Cannot suspend self' : 'Suspend Account'}
                              className="px-2 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600 hover:text-white text-amber-300 border border-amber-500/30 font-semibold text-[10px] disabled:opacity-40 transition-all flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Suspend</span>
                            </button>
                          )}

                          {/* Delete Account (Super Admin or Manager) */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              title="Permanently Delete Account"
                              className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: SUSPEND ACCOUNT ================= */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Suspend User Access</h3>
                <p className="text-xs text-slate-400">
                  {suspendingUser.name} ({suspendingUser.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Suspending this account will immediately revoke portal access and terminate any active sessions for this user.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Reason for Suspension (Recorded in Audit Log)
              </label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g., Security audit review, leave of absence, or policy breach."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE ACCOUNT ================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Permanently Delete Account</h3>
                <p className="text-xs text-slate-400">
                  {deletingUser.name} ({deletingUser.email})
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
              This action cannot be undone. All personal account records and login credentials will be erased.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Reassign Active Projects & Assigned Tasks To:
              </label>
              <select
                value={reassignTargetId}
                onChange={(e) => setReassignTargetId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none"
              >
                <option value="">-- No reassignment (Unassigned) --</option>
                {users
                  .filter((u) => u.id !== deletingUser.id && u.active && !u.isSuspended)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleTitle})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER PROFILE & AVATAR ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit User Profile & Avatar</h3>
                  <p className="text-xs text-slate-400">{editingUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <AvatarUploader
                currentAvatar={editAvatar}
                onAvatarChange={setEditAvatar}
                userName={editName}
                label="Profile Photo"
                helperText="Upload a photo (PNG, JPG, WebP) or enter an image URL."
                size="md"
                showPresets={false}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Email (Login Identity) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Personal Email (Temporary Password Delivery)
                </label>
                <input
                  type="email"
                  value={editPersonalEmail}
                  onChange={(e) => setEditPersonalEmail(e.target.value)}
                  placeholder="e.g. personal.address@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Recovery PINs and temporary login passwords are sent to this personal address.
                </p>
              </div>

              {/* System Governance Role Allocation */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Allocated System Role & Governance Level</span>
                  </label>
                  {isSuperAdmin && (
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                      Superuser Authority
                    </span>
                  )}
                </div>

                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  disabled={!isSuperAdmin && !isManager}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="super_admin">⚡ Super Admin (Full Governance, Audits & System Config)</option>
                  <option value="department_manager">👔 Department Manager (Oversight, Allocations & Approvals)</option>
                  <option value="account_manager">📁 Account Manager (Client Relations & Brief Intake)</option>
                  <option value="designer">🎨 Designer / Creative Producer (Deliverables & Workloads)</option>
                  <option value="qa_user">🔍 QA Specialist (14-Point Pre-flight Audit & Certification)</option>
                  <option value="client">🏢 Client Approver (Brand Digital Approvals & Sign-offs)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Allocating a role updates permissions across all modules, project stage gates, and audit trails.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Job Title / Role Designation
                  </label>
                  <input
                    type="text"
                    value={editRoleTitle}
                    onChange={(e) => setEditRoleTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value as DepartmentId)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="marketing">Marketing & Production</option>
                    <option value="incentive_travel">Incentive Travel Collateral</option>
                    <option value="online_ram">Online (RAM) & Rewards</option>
                    <option value="development">Development & Engineering</option>
                  </select>
                </div>
              </div>

              {/* Password Reset Section */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Reset User Password (Optional)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password (min 6 chars)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
