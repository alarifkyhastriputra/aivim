import React, { useState, useEffect } from 'react';
import { UserProfile, UserStatus, UserRole, SystemSettings, GeneratedWebsite } from '../types';
import { 
  getAllUsers, 
  updateUserStatus, 
  updateUserPasswordByAdmin,
  createMemberByAdmin, 
  deleteUserByAdmin, 
  getSystemSettings, 
  updateSystemSettings, 
  isAdminEmail 
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
  Key,
  Eye,
  EyeOff,
  Copy,
  Wand2,
  RefreshCw,
  Sparkles,
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
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // New User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [newStatus, setNewStatus] = useState<UserStatus>('active');
  const [newCredits, setNewCredits] = useState(50);
  const [createdSuccessCard, setCreatedSuccessCard] = useState<{ email: string; pass: string; name: string } | null>(null);

  // Edit Credits & Password State
  const [editingCreditsUid, setEditingCreditsUid] = useState<string | null>(null);
  const [creditsInput, setCreditsInput] = useState<number>(25);
  
  const [changingPassUid, setChangingPassUid] = useState<string | null>(null);
  const [newPassInput, setNewPassInput] = useState('');

  // Visible passwords map for table view
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

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

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const togglePasswordVisibility = (uid: string) => {
    setVisiblePasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pass = 'Vimos#';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '!';
    setNewPassword(pass);
    showNotification(`Password otomatis dibuat: ${pass}`, 'info');
  };

  const handleCopyCredentials = (email: string, pass: string) => {
    const text = `Halo! Berikut akun akses vimos.ai Anda:\n• Email: ${email}\n• Password: ${pass}\n• Link Login: ${window.location.origin}\n\nSilakan login dan mulai membuat website!`;
    navigator.clipboard.writeText(text);
    showNotification('Data login berhasil disalin ke clipboard!');
  };

  const handleStatusChange = async (uid: string, status: UserStatus) => {
    await updateUserStatus(uid, status);
    setUsers(users.map(u => u.uid === uid ? { ...u, status } : u));
    showNotification(`Status pengguna diubah menjadi ${status}`);
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    await updateUserStatus(uid, users.find(u => u.uid === uid)?.status || 'active', role);
    setUsers(users.map(u => u.uid === uid ? { ...u, role } : u));
    showNotification(`Role pengguna diubah menjadi ${role}`);
  };

  const handleSaveCredits = async (uid: string) => {
    await updateUserStatus(uid, users.find(u => u.uid === uid)?.status || 'active', undefined, creditsInput);
    setUsers(users.map(u => u.uid === uid ? { ...u, credits: creditsInput } : u));
    setEditingCreditsUid(null);
    showNotification(`Kredit AI diperbarui menjadi ${creditsInput}`);
  };

  const handleSavePassword = async (uid: string) => {
    if (!newPassInput.trim()) {
      showNotification('Password tidak boleh kosong!', 'error');
      return;
    }
    await updateUserPasswordByAdmin(uid, newPassInput.trim());
    setUsers(users.map(u => u.uid === uid ? { ...u, password: newPassInput.trim() } : u));
    setChangingPassUid(null);
    setNewPassInput('');
    showNotification('Password pengguna berhasil diperbarui!');
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (isAdminEmail(email)) {
      showNotification('Tidak dapat menghapus akun Super Admin!', 'error');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${email}?`)) {
      await deleteUserByAdmin(uid);
      setUsers(users.filter(u => u.uid !== uid));
      showNotification(`Akun ${email} telah dihapus.`);
    }
  };

  const handleAddMember = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanPass = newPassword.trim();

    if (!cleanEmail) {
      showNotification('⚠️ Harap masukkan alamat email pengguna!', 'error');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showNotification('⚠️ Format email tidak valid (contoh: user@gmail.com)!', 'error');
      return;
    }
    if (!cleanPass) {
      showNotification('⚠️ Harap masukkan atau buat password akun!', 'error');
      return;
    }

    setIsSubmittingUser(true);
    try {
      const created = await createMemberByAdmin(
        cleanEmail, 
        cleanPass, 
        newName.trim(), 
        newRole, 
        newStatus, 
        newCredits
      );

      setUsers(prev => {
        const idx = prev.findIndex(u => u.email.toLowerCase() === created.email.toLowerCase());
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = created;
          return next;
        }
        return [created, ...prev];
      });

      setCreatedSuccessCard({
        email: cleanEmail,
        pass: cleanPass,
        name: newName.trim() || cleanEmail.split('@')[0]
      });

      showNotification(`✅ Akun ${cleanEmail} dengan password berhasil dibuat!`);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
    } catch (err: any) {
      showNotification('Gagal membuat akun: ' + err.message, 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleToggleRequireApproval = async () => {
    const updatedVal = !settings.requireApprovalForNewUsers;
    await updateSystemSettings({ requireApprovalForNewUsers: updatedVal });
    setSettings({ ...settings, requireApprovalForNewUsers: updatedVal });
    showNotification(`Persetujuan pendaftaran: ${updatedVal ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Toast Alert */}
        {toast && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border text-xs font-bold transition ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-400'
              : toast.type === 'info'
              ? 'bg-indigo-600 text-white border-indigo-400'
              : 'bg-emerald-600 text-white border-emerald-400'
          }`}>
            {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-white" /> : <CheckCircle className="w-4 h-4 text-white" />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0B0F19]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Admin Dashboard & User Management</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">Buat akun, atur password pengguna, dan kelola sistem</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-[#0B0F19] border-b border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kelola Pengguna ({users.length})</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px]">
                {pendingCount} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('add_user');
              setCreatedSuccessCard(null);
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTab === 'add_user'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-xl'
                : 'border-transparent text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>+ Buat Akun & Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all_sites')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTab === 'all_sites'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Semua Website ({websites.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Sistem</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0E131F]">
          {/* TAB 1: USERS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#182238] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Total Pengguna</span>
                    <div className="text-2xl font-bold text-white mt-0.5">{users.length}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#182238] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Akun Aktif</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-0.5">{activeCount}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#182238] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Menunggu Persetujuan</span>
                    <div className="text-2xl font-bold text-amber-400 mt-0.5">{pendingCount}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari email / nama..."
                    className="w-full bg-[#1e293b] border border-slate-700 text-slate-200 text-xs rounded-xl py-2 pl-9 pr-4 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="bg-[#1e293b] border border-slate-700 text-slate-200 text-xs rounded-xl py-2 px-3 outline-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Ditangguhkan</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('add_user');
                      setCreatedSuccessCard(null);
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Buat Akun & Password Baru</span>
                  </button>
                </div>
              </div>

              {/* Members Table with Password Management */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#182238]/30">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#1e293b] text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Nama & Email</th>
                      <th className="p-3">Password Akun</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Kredit AI</th>
                      <th className="p-3 text-right">Aksi & Salin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          Tidak ada pengguna yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSuperAdmin = isAdminEmail(u.email);
                        const isPassVisible = visiblePasswords[u.uid];

                        return (
                          <tr key={u.uid} className="hover:bg-slate-800/40 transition">
                            {/* User details */}
                            <td className="p-3">
                              <div className="font-semibold text-white flex items-center gap-2">
                                <span>{u.displayName || u.email.split('@')[0]}</span>
                                {isSuperAdmin && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold">
                                    SUPER ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                            </td>

                            {/* Password Column */}
                            <td className="p-3">
                              {changingPassUid === u.uid ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={newPassInput}
                                    onChange={(e) => setNewPassInput(e.target.value)}
                                    placeholder="Password baru..."
                                    className="w-28 bg-[#111827] border border-indigo-500 text-white rounded px-2 py-1 text-xs font-mono outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSavePassword(u.uid)}
                                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 cursor-pointer"
                                    title="Simpan Password"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setChangingPassUid(null)}
                                    className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 cursor-pointer"
                                    title="Batal"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                                    {isPassVisible ? (u.password || '(Belum diset)') : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(u.uid)}
                                    className="text-slate-400 hover:text-white cursor-pointer"
                                    title={isPassVisible ? "Sembunyikan" : "Lihat Password"}
                                  >
                                    {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChangingPassUid(u.uid);
                                      setNewPassInput(u.password || '');
                                    }}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                                    title="Ubah Password"
                                  >
                                    Ganti
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Role Column */}
                            <td className="p-3">
                              <select
                                value={u.role}
                                disabled={isSuperAdmin}
                                onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                                className="bg-[#1e293b] border border-slate-700 text-slate-200 text-xs rounded-lg py-1 px-2 outline-none disabled:opacity-60 cursor-pointer"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>

                            {/* Status Column */}
                            <td className="p-3">
                              {u.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                              {u.status === 'active' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                                  <CheckCircle className="w-3 h-3" />
                                  Aktif
                                </span>
                              )}
                              {u.status === 'suspended' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-semibold">
                                  <XCircle className="w-3 h-3" />
                                  Ditangguhkan
                                </span>
                              )}
                            </td>

                            {/* Credits Column */}
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
                                    type="button"
                                    onClick={() => handleSaveCredits(u.uid)}
                                    className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCreditsUid(u.uid);
                                    setCreditsInput(u.credits);
                                  }}
                                  className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-400 font-mono cursor-pointer"
                                >
                                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{u.credits}</span>
                                </button>
                              )}
                            </td>

                            {/* Actions & Copy */}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Copy Account info */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyCredentials(u.email, u.password || '(Belum diset)')}
                                  className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                  title="Salin Email & Password Akun"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Salin</span>
                                </button>

                                {u.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(u.uid, 'active')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Setujui</span>
                                  </button>
                                )}

                                {u.status === 'active' && !isSuperAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(u.uid, 'suspended')}
                                    className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 rounded-lg text-xs transition cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                )}

                                {u.status === 'suspended' && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(u.uid, 'active')}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs transition cursor-pointer"
                                  >
                                    Aktifkan
                                  </button>
                                )}

                                {!isSuperAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u.uid, u.email)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                    title="Hapus Akun"
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
          )}

          {/* TAB 2: BUAT AKUN & PASSWORD DIRECTLY */}
          {activeTab === 'add_user' && (
            <div className="max-w-xl mx-auto space-y-4">
              {/* Success Result Card */}
              {createdSuccessCard && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/50 shadow-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle className="w-5 h-5" />
                      <span>Akun Berhasil Dibuat & Siap Digunakan!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreatedSuccessCard(null)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300">
                    Kirimkan data akun login ini kepada pengguna / klien:
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono text-slate-200">
                    <div><span className="text-slate-500">Nama:</span> <strong className="text-white">{createdSuccessCard.name}</strong></div>
                    <div><span className="text-slate-500">Email:</span> <strong className="text-emerald-400">{createdSuccessCard.email}</strong></div>
                    <div><span className="text-slate-500">Password:</span> <strong className="text-amber-300">{createdSuccessCard.pass}</strong></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(createdSuccessCard.email, createdSuccessCard.pass)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Salin Format Lengkap (Untuk WhatsApp / Email)</span>
                  </button>
                </div>
              )}

              <div className="bg-[#1e293b]/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    <span>Buat Akun Member & Password Baru</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Admin mendaftarkan akun baru secara langsung dan menentukan password aksesnya.
                  </p>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Alamat Email Pengguna *
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="contoh: member@gmail.com / client@toko.com"
                      className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-4 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Password + Generator */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password Akun *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomPassword}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Acak Password Otomatis</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ketik password atau klik acak otomatis..."
                        className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 pl-4 pr-10 text-xs font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        title={showNewPassword ? "Sembunyikan" : "Lihat"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nama Lengkap / Nama Toko
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="contoh: Budi Santoso / Toko Busana"
                      className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-4 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role Pengguna</label>
                      <select
                        value={newRole}
                        onChange={(e: any) => setNewRole(e.target.value)}
                        className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-3 text-xs outline-none cursor-pointer"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Awal</label>
                      <select
                        value={newStatus}
                        onChange={(e: any) => setNewStatus(e.target.value)}
                        className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-3 text-xs outline-none cursor-pointer"
                      >
                        <option value="active">Langsung Aktif (Active)</option>
                        <option value="pending">Pending Approval</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kredit AI Awal</label>
                    <input
                      type="number"
                      value={newCredits}
                      onChange={(e) => setNewCredits(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl py-2.5 px-4 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    onClick={(e) => handleAddMember(e)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-indigo-600 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmittingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Akun...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>✨ Buat Akun & Simpan Password</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: SEMUA WEBSITE SISTEM */}
          {activeTab === 'all_sites' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white mb-2">Semua Website yang Dihasilkan Pengguna ({websites.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {websites.map(site => (
                  <div key={site.id} className="p-4 rounded-xl bg-[#182238] border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white text-xs">{site.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">{site.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{site.prompt}</p>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800">
                      <span>Author: {site.authorEmail}</span>
                      <span>{new Date(site.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PENGATURAN SISTEM */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-4 bg-[#1e293b]/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Pengaturan Global Sistem</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">Wajibkan Verifikasi Admin untuk Pendaftaran Baru</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pengguna baru harus disetujui admin sebelum dapat membuat website</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleRequireApproval}
                    className={`w-12 h-6 rounded-full transition relative p-0.5 cursor-pointer ${
                      settings.requireApprovalForNewUsers ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                      settings.requireApprovalForNewUsers ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white">Kredit AI Default untuk Pengguna Baru</h4>
                  <input
                    type="number"
                    value={settings.defaultCreditsPerUser}
                    onChange={(e) => setSettings({ ...settings, defaultCreditsPerUser: Number(e.target.value) })}
                    className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-xl py-2 px-3 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => updateSystemSettings({ defaultCreditsPerUser: settings.defaultCreditsPerUser })}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
