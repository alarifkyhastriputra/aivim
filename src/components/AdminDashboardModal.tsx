import React, { useState, useEffect } from 'react';
import { UserProfile, UserStatus, UserRole, SystemSettings, GeneratedWebsite } from '../types';
import { 
  getAllUsers, 
  updateUserStatus, 
  createMemberByAdmin, 
  deleteUserByAdmin, 
  getSystemSettings, 
  updateSystemSettings, 
  ADMIN_EMAIL 
} from '../lib/firebase';
import { 
  Users, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Plus, 
  Search, 
  X, 
  Coins, 
  Globe, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  websites: GeneratedWebsite[];
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  websites
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'add_user' | 'settings' | 'all_sites'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    requireApprovalForNewUsers: true,
    defaultCreditsPerUser: 25,
    aiModel: 'gemini-3.8-flash'
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [toast, setToast] = useState<string | null>(null);

  // New User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [newStatus, setNewStatus] = useState<UserStatus>('active');
  const [newCredits, setNewCredits] = useState(50);

  // Edit Credits State
  const [editingCreditsUid, setEditingCreditsUid] = useState<string | null>(null);
  const [creditsInput, setCreditsInput] = useState<number>(25);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    const [allUsers, sysSettings] = await Promise.all([
      getAllUsers(),
      getSystemSettings()
    ]);
    setUsers(allUsers);
    setSettings(sysSettings);
    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleStatusChange = async (uid: string, status: UserStatus) => {
    await updateUserStatus(uid, status);
    setUsers(users.map(u => u.uid === uid ? { ...u, status } : u));
    showNotification(`User status updated to ${status}`);
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    await updateUserStatus(uid, users.find(u => u.uid === uid)?.status || 'active', role);
    setUsers(users.map(u => u.uid === uid ? { ...u, role } : u));
    showNotification(`User role updated to ${role}`);
  };

  const handleSaveCredits = async (uid: string) => {
    await updateUserStatus(uid, users.find(u => u.uid === uid)?.status || 'active', undefined, creditsInput);
    setUsers(users.map(u => u.uid === uid ? { ...u, credits: creditsInput } : u));
    setEditingCreditsUid(null);
    showNotification(`User credits updated to ${creditsInput}`);
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      showNotification('Cannot delete Super Admin account!');
      return;
    }
    if (confirm(`Are you sure you want to delete user ${email}?`)) {
      await deleteUserByAdmin(uid);
      setUsers(users.filter(u => u.uid !== uid));
      showNotification(`User ${email} deleted.`);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      const created = await createMemberByAdmin(newEmail, newName, newRole, newStatus, newCredits);
      setUsers([...users, created]);
      showNotification(`Member ${newEmail} created successfully!`);
      setNewEmail('');
      setNewName('');
      setActiveTab('users');
    } catch (err: any) {
      showNotification('Failed to create member: ' + err.message);
    }
  };

  const handleToggleRequireApproval = async () => {
    const updatedVal = !settings.requireApprovalForNewUsers;
    await updateSystemSettings({ requireApprovalForNewUsers: updatedVal });
    setSettings({ ...settings, requireApprovalForNewUsers: updatedVal });
    showNotification(`System setting updated: Approval for new signups is now ${updatedVal ? 'ENABLED' : 'DISABLED'}`);
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Toast Alert */}
        {toast && (
          <div className="absolute top-4 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-4 h-4" />
            <span>{toast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#0B0F19]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">vimos.ai Admin GUI</h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[11px] font-mono font-semibold">
                  {ADMIN_EMAIL}
                </span>
              </div>
              <p className="text-xs text-slate-400">Member access management & platform administration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#182238]/50 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Total Members
            </div>
            <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Pending Approval
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active Members
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#1e293b]/70 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Websites Created
            </div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{websites.length}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-2 bg-[#0B0F19]">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'users'
                ? 'bg-[#111827] text-white border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Members</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('add_user')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'add_user'
                ? 'bg-[#111827] text-white border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'settings'
                ? 'bg-[#111827] text-white border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>System Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('all_sites')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'all_sites'
                ? 'bg-[#111827] text-white border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Generated Sites ({websites.length})</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: USERS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search member name or email..."
                    className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-xl py-2 pl-9 pr-4 text-xs placeholder:text-slate-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-400">Filter:</span>
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="bg-[#1e293b] border border-slate-700 text-slate-200 text-xs rounded-xl py-2 px-3 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Approval</option>
                    <option value="active">Active Members</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#182238]/30">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#1e293b] text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">User Member</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">AI Credits</th>
                      <th className="p-3">Joined Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No members found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSuperAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

                        return (
                          <tr key={u.uid} className="hover:bg-slate-800/40 transition">
                            <td className="p-3">
                              <div className="font-semibold text-white flex items-center gap-2">
                                <span>{u.displayName || u.email.split('@')[0]}</span>
                                {isSuperAdmin && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                                    SUPER ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                            </td>

                            <td className="p-3">
                              <select
                                value={u.role}
                                disabled={isSuperAdmin}
                                onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                                className="bg-[#1e293b] border border-slate-700 text-slate-200 text-xs rounded-lg py-1 px-2 outline-none disabled:opacity-60"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>

                            <td className="p-3">
                              {u.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px]">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                              {u.status === 'active' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px]">
                                  <CheckCircle className="w-3 h-3" />
                                  Active
                                </span>
                              )}
                              {u.status === 'suspended' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px]">
                                  <XCircle className="w-3 h-3" />
                                  Suspended
                                </span>
                              )}
                            </td>

                            <td className="p-3">
                              {editingCreditsUid === u.uid ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={creditsInput}
                                    onChange={(e) => setCreditsInput(Number(e.target.value))}
                                    className="w-16 bg-[#1e293b] border border-slate-700 text-white rounded px-1.5 py-0.5 text-xs"
                                  />
                                  <button
                                    onClick={() => handleSaveCredits(u.uid)}
                                    className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingCreditsUid(u.uid);
                                    setCreditsInput(u.credits);
                                  }}
                                  className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-400"
                                >
                                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{u.credits}</span>
                                </button>
                              )}
                            </td>

                            <td className="p-3 text-slate-500 text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {u.status === 'pending' && (
                                  <button
                                    onClick={() => handleStatusChange(u.uid, 'active')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                )}

                                {u.status === 'active' && !isSuperAdmin && (
                                  <button
                                    onClick={() => handleStatusChange(u.uid, 'suspended')}
                                    className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 rounded-lg text-xs transition"
                                  >
                                    Suspend
                                  </button>
                                )}

                                {u.status === 'suspended' && (
                                  <button
                                    onClick={() => handleStatusChange(u.uid, 'active')}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs transition"
                                  >
                                    Reactivate
                                  </button>
                                )}

                                {!isSuperAdmin && (
                                  <button
                                    onClick={() => handleDeleteUser(u.uid, u.email)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
          )}

          {/* TAB 2: ADD MEMBER DIRECTLY */}
          {activeTab === 'add_user' && (
            <div className="max-w-xl mx-auto bg-[#1e293b]/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <span>Create Member Account via Admin GUI</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Directly register a new member account without waiting for self-registration.
              </p>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="member@company.com"
                    className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-4 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Alex Smith"
                    className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-4 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                    <select
                      value={newRole}
                      onChange={(e: any) => setNewRole(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-3 text-xs outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Initial Status</label>
                    <select
                      value={newStatus}
                      onChange={(e: any) => setNewStatus(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-3 text-xs outline-none"
                    >
                      <option value="active">Active (Instant Access)</option>
                      <option value="pending">Pending Approval</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial AI Credits</label>
                  <input
                    type="number"
                    value={newCredits}
                    onChange={(e) => setNewCredits(Number(e.target.value))}
                    className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-4 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create & Activate Member</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="p-6 bg-[#1e293b]/50 border border-slate-800 rounded-2xl space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>Registration & Approval Rules</span>
                </h3>

                <div className="flex items-center justify-between p-4 bg-[#111827] rounded-xl border border-slate-700/60">
                  <div>
                    <div className="text-xs font-semibold text-white">Require Admin Approval for New Signups</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      When enabled, new users who register will be set to <span className="text-amber-400">Pending</span> until approved by Admin ({ADMIN_EMAIL}).
                    </div>
                  </div>

                  <button
                    onClick={handleToggleRequireApproval}
                    className={`w-12 h-6 rounded-full transition relative p-0.5 ${
                      settings.requireApprovalForNewUsers ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition transform ${
                        settings.requireApprovalForNewUsers ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 bg-[#111827] rounded-xl border border-slate-700/60 space-y-2">
                  <div className="text-xs font-semibold text-white">Default Generation Model</div>
                  <div className="text-[11px] font-mono text-indigo-400">gemini-3.8-flash (Standard & Fast)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GENERATED WEBSITES */}
          {activeTab === 'all_sites' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">All Generated Websites Across Platform</h3>
              {websites.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-[#1e293b]/30 rounded-2xl border border-slate-800">
                  No websites generated yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {websites.map((site) => (
                    <div key={site.id} className="p-4 rounded-2xl bg-[#1e293b]/60 border border-slate-700/70 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{site.title}</div>
                          <div className="text-[11px] text-indigo-400 font-mono">{site.authorEmail}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {site.style}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 italic">"{site.prompt}"</p>
                      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                        <span>Created: {new Date(site.createdAt).toLocaleDateString()}</span>
                        <span>HTML Size: {(site.html.length / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
