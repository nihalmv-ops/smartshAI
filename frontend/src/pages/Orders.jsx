import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, ArrowRight, ShoppingBag, MapPin, Calendar } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';

export const Orders = ({ navigateTo }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await orderService.getMyOrders();
        if (res && res.orders) {
          setOrders(res.orders);
        }
      } catch (err) {
        setError(err.message || 'Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'Out for Delivery':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            <Truck className="w-3.5 h-3.5" />
            Out for Delivery
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
            <Clock className="w-3.5 h-3.5" />
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            <Package className="w-3.5 h-3.5" />
            Order Placed
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse space-y-4">
              <div className="h-5 w-1/3 bg-slate-200 rounded"></div>
              <div className="h-20 bg-slate-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-brand-500 stroke-[2.2]" />
            <span>Order History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and review your past groceries delivered directly to your door
          </p>
        </div>

        <button
          onClick={() => navigateTo('products')}
          className="px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <span>Order More</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-600 flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-soft max-w-md mx-auto my-12">
          <div className="w-20 h-20 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">No Orders Yet</h3>
          <p className="text-xs text-slate-500 mb-6">
            You haven't placed any grocery orders yet. Add items to your basket and complete checkout!
          </p>
          <button
            onClick={() => navigateTo('products')}
            className="px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 inline-flex items-center gap-2"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft transition-all hover:shadow-md"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order ID</span>
                      <span className="font-mono text-sm font-bold text-slate-800">#{order._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(order.status)}
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Total Amount</span>
                      <span className="text-lg font-black text-slate-900">₹{order.totalPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="py-4 space-y-3">
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-100 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.qty || item.quantity || 1} × ₹{item.price} {item.unit ? `(${item.unit})` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-800 whitespace-nowrap">
                        ₹{item.price * (item.qty || item.quantity || 1)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Info: Address & Payment */}
                <div className="pt-4 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      Delivered to: <strong>{order.shippingAddress?.fullName || user?.name}</strong>,{' '}
                      {order.shippingAddress?.address}, {order.shippingAddress?.city}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-600">
                    Payment Method: <span className="text-brand-600 font-bold">{order.paymentMethod}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;

