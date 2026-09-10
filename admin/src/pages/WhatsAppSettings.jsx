import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Phone,
  ShieldCheck,
  Star,
  ExternalLink,
  Users,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { AdminHeader } from '../components/layout/AdminHeader';
import { whatsAppContactService } from '../services/whatsAppContactService';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';

export const WhatsAppSettings = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    purpose: '',
    isActive: true,
    isDefault: false,
    displayOrder: 0
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchContacts = async () => {
    try {
      setRefreshing(true);
      const res = await whatsAppContactService.getContacts();
      if (res && res.contacts) {
        setContacts(res.contacts);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch WhatsApp contacts', 'error');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const openCreateModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      phoneNumber: '',
      purpose: 'Order Processing & Support',
      isActive: true,
      isDefault: contacts.length === 0,
      displayOrder: contacts.length + 1
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      purpose: contact.purpose || '',
      isActive: contact.isActive,
      isDefault: contact.isDefault,
      displayOrder: contact.displayOrder || 0
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Contact name is required');
      return;
    }

    const cleanNumber = formData.phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      setFormError('Phone number must have at least 10 digits');
      return;
    }

    setSaving(true);
    try {
      if (editingContact) {
        await whatsAppContactService.updateContact(editingContact._id, formData);
        showToast('WhatsApp contact updated successfully');
      } else {
        await whatsAppContactService.createContact(formData);
        showToast('WhatsApp contact added successfully');
      }
      setIsModalOpen(false);
      await fetchContacts();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (contact) => {
    try {
      const updated = !contact.isActive;
      await whatsAppContactService.updateContact(contact._id, { isActive: updated });
      setContacts((prev) =>
        prev.map((c) => (c._id === contact._id ? { ...c, isActive: updated } : c))
      );
      showToast(`Contact marked as ${updated ? 'Active' : 'Inactive'}`);
    } catch (err) {
      showToast(err.message || 'Failed to update contact status', 'error');
    }
  };

  const handleSetDefault = async (contact) => {
    try {
      await whatsAppContactService.updateContact(contact._id, { isDefault: true });
      setContacts((prev) =>
        prev.map((c) => ({
          ...c,
          isDefault: c._id === contact._id
        }))
      );
      showToast(`"${contact.name}" is now the primary default contact`);
    } catch (err) {
      showToast(err.message || 'Failed to set default contact', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await whatsAppContactService.deleteContact(deleteId);
      showToast('WhatsApp contact deleted successfully');
      setDeleteId(null);
      await fetchContacts();
    } catch (err) {
      showToast(err.message || 'Failed to delete contact', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const defaultContact = contacts.find((c) => c.isDefault) || contacts[0];
  const activeCount = contacts.filter((c) => c.isActive).length;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading WhatsApp configuration...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="WhatsApp Store Contacts"
        subtitle="Manage store numbers, fulfillment routing, and customer communication channels"
        onRefresh={fetchContacts}
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

      <main className="p-3.5 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
        {/* Top Action & Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Contacts</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{contacts.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Configured shop routing channels</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Contacts</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Available for customer checkouts</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <WhatsAppIcon className="w-6 h-6 fill-emerald-600" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Contact</p>
              <h3 className="text-base font-black text-slate-900 mt-1 truncate max-w-[170px]">
                {defaultContact?.name || 'None Set'}
              </h3>
              <p className="text-[11px] text-emerald-600 font-mono mt-0.5">
                +{defaultContact?.phoneNumber || 'No phone'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Section Header & Add Contact CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-base font-black text-slate-900">Configured WhatsApp Phone Numbers</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customers can pick any active contact at checkout, or default routing is applied automatically.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add WhatsApp Contact</span>
          </button>
        </div>

        {/* Contacts Table / Grid */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Contact Name</th>
                  <th className="py-3 px-3">WhatsApp Number</th>
                  <th className="py-3 px-3">Purpose / Role</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Default Contact</th>
                  <th className="py-3 px-3 text-center">Test Chat</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No WhatsApp contacts configured. Click "Add WhatsApp Contact" to add one.
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                            <WhatsAppIcon className="w-4 h-4 fill-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{contact.name}</p>
                            <span className="text-[10px] text-slate-400 font-medium">Order: #{contact.displayOrder || 0}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          +{contact.phoneNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          {contact.purpose || 'General Orders'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(contact)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            contact.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${contact.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{contact.isActive ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {contact.isDefault ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                            <Star className="w-3 h-3 fill-amber-500" />
                            <span>Primary Default</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(contact)}
                            className="text-xs font-semibold text-slate-500 hover:text-brand-600 hover:underline cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <a
                          href={`https://wa.me/${contact.phoneNumber}?text=${encodeURIComponent(
                            `Hello ${contact.name}! This is a connectivity test from Skyline Mart Admin.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/10 text-emerald-800 hover:bg-[#25D366]/20 font-bold text-xs transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test</span>
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(contact)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title="Edit Contact"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(contact._id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Delete Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <WhatsAppIcon className="w-4 h-4 fill-emerald-600" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {editingContact ? 'Edit WhatsApp Contact' : 'Add WhatsApp Contact'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 my-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Main Shop, Store Manager, Order Support"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 919876543210 (with country code, no + or spaces)"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Indian numbers will automatically prepend '91' if 10 digits are entered.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Purpose / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g., Main Orders & Express Dispatch, Customer Support"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end pb-1 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active Status</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Primary Default</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-75"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingContact ? 'Save Changes' : 'Create Contact'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete WhatsApp Contact?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this contact? Customers will no longer be routed to this number.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSettings;
