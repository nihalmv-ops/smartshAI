import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ShieldCheck,
  Check,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminHeader } from '../components/layout/AdminHeader';

export const UserManagement = () => {
  const { user: currentAdmin } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const res = await adminService.getUsers();
      if (res && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'customer' : 'admin';
    if (!window.confirm(`Change ${targetUser.name}'s role to ${newRole.toUpperCase()}?`)) return;

    setActionLoading(true);
    try {
      await adminService.updateUserRole(targetUser._id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
      );
      showToast(`User role changed to ${newRole}`);
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${targetUser.name}" (${targetUser.email})?`)) return;

    setActionLoading(true);
    try {
      await adminService.deleteUser(targetUser._id);
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
      showToast(`User account deleted successfully`);
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminForm.name.trim() || !newAdminForm.email.trim() || !newAdminForm.password.trim()) {
      showToast('Name, email, and password are required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.createAdminUser(newAdminForm);
      showToast(`Administrator "${newAdminForm.name}" created successfully!`);
      setModalOpen(false);
      setNewAdminForm({ name: '', email: '', password: '', phone: '' });
      await fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create administrator', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = u.name || '';
    const email = u.email || '';
    const phone = u.phone || '';
    return (
      name.toLowerCase().includes(userSearch.toLowerCase()) ||
      email.toLowerCase().includes(userSearch.toLowerCase()) ||
      phone.includes(userSearch)
    );
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading user accounts...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="User &amp; Staff Access Management"
        subtitle={`Total registered platform accounts: ${users.length}`}
        onRefresh={fetchUsers}
        refreshing={refreshing}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl border flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-200" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <main className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Controls */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user by name, email or phone..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Administrator</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No users found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrentAdmin = u._id === currentAdmin?._id || u.email === currentAdmin?.email;

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                {u.name}
                                {isCurrentAdmin && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {u.role === 'admin' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Admin
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Customer
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600">
                          {u.phone || '-'}
                        </td>

                        <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={actionLoading || isCurrentAdmin}
                              className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                              title="Toggle Admin / Customer Role"
                            >
                              {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={actionLoading || isCurrentAdmin}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      </main>

      {/* Create New Administrator Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-4 sm:my-8 animate-fadeIn text-slate-900 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Administrator</h3>
                  <p className="text-xs text-slate-500">Create staff account with full control access</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3 sm:space-y-3.5 my-3 sm:my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrator Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  placeholder="e.g. Rachel Adams"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrator Email *</label>
                <input
                  type="email"
                  required
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  placeholder="rachel@smartmart.ai"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newAdminForm.phone}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Privileges Notice
                </span>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  This user will immediately be granted full administrative authority to view orders, update products, and access dashboard metrics.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Create Administrator</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

