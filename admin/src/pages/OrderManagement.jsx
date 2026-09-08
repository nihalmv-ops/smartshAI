import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Truck,
  CheckCircle2,
  MessageSquare,
  X,
  Loader2,
  Phone,
  AlertCircle
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
  const [statusFilter, setStatusFilter] = useState('all');
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
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredOrders = orders.filter((o) => {
    const custName = o.shippingAddress?.fullName || o.user?.name || '';
    const custEmail = o.user?.email || '';
    const custPhone = o.shippingAddress?.phone || o.user?.phone || '';
    const id = o._id || '';

    const matchesSearch =
      id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      custName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      custEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      custPhone.includes(orderSearch);

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
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

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Filters */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search order ID, customer or phone..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-3 text-center">Customer WhatsApp</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No customer orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const custName = ord.shippingAddress?.fullName || ord.user?.name || 'Customer';
                    const custPhone = ord.shippingAddress?.phone || ord.user?.phone || '';
                    const hasPhone = Boolean(whatsappService.cleanPhone(custPhone));

                    return (
                      <tr key={ord._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                          #{ord._id.slice(-6).toUpperCase()}
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
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${getStatusBadgeClass(
                              ord.status
                            )}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {hasPhone ? (
                            <button
                              onClick={() => whatsappService.openWhatsApp(whatsappService.getCustomerChatUrl(ord))}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              title={`Open WhatsApp chat with ${custName}`}
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                              <span>Deal on WhatsApp</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 animate-fadeIn text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Order Details #{selectedOrder._id.slice(-6).toUpperCase()}
                </h3>
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
              {/* Customer Information Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Customer Information</h4>
                  {whatsappService.cleanPhone(selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone) && (
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
                  ✉️ {selectedOrder.user?.email || 'No email'}
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
              {whatsappService.cleanPhone(selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone) && (
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
                        const custName = selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name || 'Customer';
                        const ordShort = selectedOrder._id.slice(-6).toUpperCase();
                        const msg = `Hello *${custName}*! 🚴 Your SmartMart AI order *#${ordShort}* is packed and OUT FOR DELIVERY! Our express rider will reach your address in 10-15 minutes.`;
                        whatsappService.openWhatsApp(whatsappService.getCustomerChatUrl(selectedOrder, msg));
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-bold text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Out for Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const custName = selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name || 'Customer';
                        const ordShort = selectedOrder._id.slice(-6).toUpperCase();
                        const msg = `Hello *${custName}*! 🎉 Your SmartMart AI order *#${ordShort}* has been successfully DELIVERED. Thank you for shopping with us!`;
                        whatsappService.openWhatsApp(whatsappService.getCustomerChatUrl(selectedOrder, msg));
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-bold text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Delivered Alert</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const custName = selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name || 'Customer';
                        const ordShort = selectedOrder._id.slice(-6).toUpperCase();
                        const msg = `Hi *${custName}*, our delivery agent is near your address for order *#${ordShort}*. Could you please share a nearby landmark or Google location pin? Thank you!`;
                        whatsappService.openWhatsApp(whatsappService.getCustomerChatUrl(selectedOrder, msg));
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-bold text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Ask Landmark</span>
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
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-500">Qty: {qty} {item.unit ? `(${item.unit})` : ''}</p>
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
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-brand-600">
                  ₹{(selectedOrder.totalPrice || selectedOrder.totalAmount || 0).toLocaleString()}
                </span>
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

