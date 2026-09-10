import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Truck,
  CheckCircle2,
  MessageSquare,
  X,
  Loader2,
  AlertCircle,
  Clock,
  PackageCheck,
  Ban,
  FileText,
  UserCheck
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { whatsappService } from '../services/whatsappService';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { AdminHeader } from '../components/layout/AdminHeader';

export const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'whatsapp', 'WhatsApp Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const res = await orderService.getAllOrders();
      if (res && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
      showToast(`Order status updated to "${newStatus}"`);
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'WhatsApp Pending':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'Confirmed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Preparing':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Ready':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Out for Delivery':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Pending':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const ALL_STATUSES = [
    'WhatsApp Pending',
    'Pending',
    'Confirmed',
    'Preparing',
    'Ready',
    'Processing',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

  // Counts for quick filter tabs
  const whatsappCount = orders.filter(
    (o) => o.orderChannel === 'whatsapp' || o.status === 'WhatsApp Pending'
  ).length;
  const pendingWhatsAppCount = orders.filter((o) => o.status === 'WhatsApp Pending').length;

  const filteredOrders = orders.filter((o) => {
    const custName = o.shippingAddress?.fullName || o.user?.name || '';
    const custEmail = o.user?.email || '';
    const custPhone = o.shippingAddress?.phone || o.user?.phone || '';
    const assignedContact = o.whatsappContact?.name || '';
    const id = o._id || '';

    const matchesSearch =
      id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      custName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      custEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      custPhone.includes(orderSearch) ||
      assignedContact.toLowerCase().includes(orderSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'whatsapp') {
      return o.orderChannel === 'whatsapp' || o.status === 'WhatsApp Pending';
    }
    return o.status === activeTab;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading customer orders...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Orders &amp; WhatsApp Direct Dealing"
        subtitle={`Real-time fulfillment queue (${orders.length} total orders)`}
        onRefresh={fetchOrders}
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
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            All Orders ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp Orders ({whatsappCount})</span>
            {pendingWhatsAppCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('WhatsApp Pending')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'WhatsApp Pending'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            WhatsApp Pending ({orders.filter((o) => o.status === 'WhatsApp Pending').length})
          </button>

          <button
            onClick={() => setActiveTab('Confirmed')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'Confirmed'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Confirmed ({orders.filter((o) => o.status === 'Confirmed').length})
          </button>

          <button
            onClick={() => setActiveTab('Preparing')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'Preparing'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Preparing ({orders.filter((o) => o.status === 'Preparing').length})
          </button>

          <button
            onClick={() => setActiveTab('Out for Delivery')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'Out for Delivery'
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Out for Delivery ({orders.filter((o) => o.status === 'Out for Delivery').length})
          </button>

          <button
            onClick={() => setActiveTab('Delivered')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'Delivered'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Delivered ({orders.filter((o) => o.status === 'Delivered').length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search order ID, customer, phone, or contact..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing <strong className="text-slate-900">{filteredOrders.length}</strong> of {orders.length} orders
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID &amp; Channel</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Assigned Contact</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-3 text-center">Customer Chat</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No customer orders found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const custName = ord.shippingAddress?.fullName || ord.user?.name || 'Customer';
                    const custPhone = ord.shippingAddress?.phone || ord.user?.phone || '';
                    const hasPhone = Boolean(whatsappService.cleanPhone(custPhone));
                    const isWhatsAppOrder =
                      ord.orderChannel === 'whatsapp' || ord.status === 'WhatsApp Pending';

                    return (
                      <tr key={ord._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {isWhatsAppOrder && (
                              <span
                                title="WhatsApp Direct Order"
                                className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs"
                              >
                                <WhatsAppIcon className="w-3 h-3 fill-white" />
                              </span>
                            )}
                            <span className="font-mono font-bold text-brand-600">
                              #{ord._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                          {ord.deliveryNotes && (
                            <span
                              title={`Notes: ${ord.deliveryNotes}`}
                              className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[110px]">{ord.deliveryNotes}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-900">{custName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {custPhone || ord.user?.email || '-'}
                          </p>
                        </td>

                        <td className="py-3.5 px-3">
                          {ord.whatsappContact?.name ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>{ord.whatsappContact.name}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Direct Store</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600">
                          {ord.orderItems?.length || 1} items
                        </td>

                        <td className="py-3.5 px-3 font-bold text-slate-900 text-sm">
                          ₹{(ord.totalPrice || ord.totalAmount || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={ord.status}
                            disabled={updatingOrderId === ord._id}
                            onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${getStatusBadgeClass(
                              ord.status
                            )}`}
                          >
                            {ALL_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {hasPhone ? (
                            <button
                              onClick={() =>
                                whatsappService.openWhatsApp(
                                  whatsappService.getCustomerChatUrl(ord)
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              title={`Open WhatsApp chat with ${custName}`}
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                              <span>WhatsApp</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No phone</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
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

      {/* Order Details & WhatsApp Action Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-4 sm:my-8 animate-fadeIn text-slate-900 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Order Details #{selectedOrder._id.slice(-6).toUpperCase()}
                  </h3>
                  {selectedOrder.orderChannel === 'whatsapp' && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1">
                      <WhatsAppIcon className="w-3 h-3 fill-emerald-700" />
                      <span>WhatsApp Order</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Status Update Quick Bar */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Current Status:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getStatusBadgeClass(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Workflow Transitions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedOrder.status === 'WhatsApp Pending' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Confirmed')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Order</span>
                    </button>
                  )}

                  {['WhatsApp Pending', 'Pending', 'Confirmed'].includes(selectedOrder.status) && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Preparing')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Start Preparing</span>
                    </button>
                  )}

                  {['Preparing', 'Confirmed'].includes(selectedOrder.status) && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Ready')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Mark Ready</span>
                    </button>
                  )}

                  {['Ready', 'Preparing', 'Processing'].includes(selectedOrder.status) && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Out for Delivery')}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Out for Delivery</span>
                    </button>
                  )}

                  {['Out for Delivery', 'Ready'].includes(selectedOrder.status) && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Delivered')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Cancelled')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <Ban className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned WhatsApp Contact */}
              {selectedOrder.whatsappContact?.name && (
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs">
                  <span className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]">
                    Assigned Store Contact
                  </span>
                  <p className="font-black text-emerald-900 mt-0.5">
                    {selectedOrder.whatsappContact.name} ({selectedOrder.whatsappContact.phoneNumber})
                  </p>
                </div>
              )}

              {/* Delivery Notes */}
              {selectedOrder.deliveryNotes && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                    Customer Delivery Notes
                  </span>
                  <p className="font-medium text-amber-950 mt-0.5 italic">
                    "{selectedOrder.deliveryNotes}"
                  </p>
                </div>
              )}

              {/* Customer Information Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Customer Information</h4>
                  {whatsappService.cleanPhone(
                    selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        whatsappService.openWhatsApp(
                          whatsappService.getCustomerChatUrl(selectedOrder)
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3 h-3 fill-[#25D366]" />
                      <span>Chat on WhatsApp</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-900 font-bold">
                  {selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name || 'Customer'}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  📞 {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || 'No phone provided'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ✉️ {selectedOrder.user?.email || 'Guest Customer'}
                </p>
                {selectedOrder.shippingAddress && (
                  <p className="text-xs text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/60">
                    📍 {selectedOrder.shippingAddress.address},{' '}
                    {selectedOrder.shippingAddress.city} -{' '}
                    {selectedOrder.shippingAddress.postalCode}
                  </p>
                )}
              </div>

              {/* Direct WhatsApp Action Shortcuts */}
              {whatsappService.cleanPhone(
                selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone
              ) && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                    </div>
                    <span className="text-xs font-bold text-emerald-950">
                      1-Click WhatsApp Customer Messages
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const custName =
                          selectedOrder.shippingAddress?.fullName ||
                          selectedOrder.user?.name ||
                          'Customer';
                        const ordShort = selectedOrder._id.slice(-6).toUpperCase();
                        const msg = `Hello *${custName}*! 👋 Your Skyline Mart order *#${ordShort}* has been CONFIRMED by the store manager and is now being packed!`;
                        whatsappService.openWhatsApp(
                          whatsappService.getCustomerChatUrl(selectedOrder, msg)
                        );
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-bold text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Order Confirmed</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const custName =
                          selectedOrder.shippingAddress?.fullName ||
                          selectedOrder.user?.name ||
                          'Customer';
                        const ordShort = selectedOrder._id.slice(-6).toUpperCase();
                        const msg = `Hello *${custName}*! 🚴 Your Skyline Mart order *#${ordShort}* is packed and OUT FOR DELIVERY! Our express rider will reach your address in 10-15 minutes.`;
                        whatsappService.openWhatsApp(
                          whatsappService.getCustomerChatUrl(selectedOrder, msg)
                        );
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-bold text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Out for Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const custName =
                          selectedOrder.shippingAddress?.fullName ||
                          selectedOrder.user?.name ||
                          'Customer';
                        const ordShort = selectedOrder._id.slice(-6).toUpperCase();
                        const msg = `Hello *${custName}*! 🎉 Your Skyline Mart order *#${ordShort}* has been successfully DELIVERED. Thank you for shopping with us!`;
                        whatsappService.openWhatsApp(
                          whatsappService.getCustomerChatUrl(selectedOrder, msg)
                        );
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-bold text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Delivered Alert</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Items Ordered List */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.orderItems?.map((item, idx) => {
                    const qty = item.qty || item.quantity || 1;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 text-xs bg-slate-50/50"
                      >
                        <div className="flex items-center gap-2.5">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-500">
                              Qty: {qty} {item.unit ? `(${item.unit})` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">
                          ₹{(item.price * qty).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹{(selectedOrder.itemsPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee:</span>
                  <span>₹{(selectedOrder.deliveryFee || 0).toLocaleString()}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{selectedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="text-brand-600">
                    ₹{(selectedOrder.totalPrice || selectedOrder.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
