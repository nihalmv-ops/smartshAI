// SmartMart AI WhatsApp Order Messaging Service

const STORAGE_KEY = 'smartmart_admin_whatsapp_phone';
export const DEFAULT_ADMIN_PHONE = '919876543210';

export const whatsappService = {
  /**
   * Retrieves the configured store Admin WhatsApp phone number
   */
  getAdminPhone: () => {
    return (
      localStorage.getItem(STORAGE_KEY) ||
      import.meta.env.VITE_ADMIN_WHATSAPP_PHONE ||
      DEFAULT_ADMIN_PHONE
    );
  },

  /**
   * Updates the admin WhatsApp phone number in local storage
   */
  setAdminPhone: (phone) => {
    if (phone) {
      localStorage.setItem(STORAGE_KEY, whatsappService.cleanPhone(phone));
    }
  },

  /**
   * Cleans phone number by removing spaces, dashes, parentheses, etc.
   * Auto-prepends country code 91 if a 10-digit number is given.
   */
  cleanPhone: (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    // If standard 10 digit Indian number without country code, prepend 91
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return cleaned;
  },

  /**
   * Generates a beautifully formatted WhatsApp order notification for the Store Admin
   */
  formatOrderMessage: (order) => {
    if (!order) return '';

    const orderId = (order._id || order.id || 'NEW-ORDER').toString().slice(-8).toUpperCase();
    const customerName = order.shippingAddress?.fullName || order.user?.name || 'Valued Customer';
    const customerPhone = order.shippingAddress?.phone || order.user?.phone || 'Not provided';
    const address = order.shippingAddress?.address || 'Doorstep Delivery';
    const city = order.shippingAddress?.city ? `, ${order.shippingAddress.city}` : '';
    const postalCode = order.shippingAddress?.postalCode ? ` - ${order.shippingAddress.postalCode}` : '';
    const payment = order.paymentMethod || 'Cash on Delivery';
    const total = (order.totalPrice || order.totalAmount || 0).toLocaleString();
    const items = order.orderItems || [];

    // Format list of items
    const itemsText = items.length > 0
      ? items.map((item, idx) => {
          const qty = item.qty || item.quantity || 1;
          const price = item.price ? `(₹${item.price * qty})` : '';
          const unit = item.unit ? ` [${item.unit}]` : '';
          return `${idx + 1}. *${item.name}* x ${qty}${unit} ${price}`;
        }).join('\n')
      : '• Standard grocery items package';

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });

    return (
`🛒 *NEW ORDER RECEIVED - SMARTMART AI* 🛒
━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Order ID*: #${orderId}
📅 *Time*: ${orderDate}
👤 *Customer*: ${customerName}
📞 *Phone*: ${customerPhone}
📍 *Delivery Address*: ${address}${city}${postalCode}

📦 *ITEMS ORDERED*:
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL AMOUNT*: ₹${total}
💳 *Payment Mode*: ${payment}
🚚 *Fulfillment*: 15-Minute Express Delivery
━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Action Required*: Please review and confirm this order dispatch!`
    );
  },

  /**
   * Creates direct WhatsApp link to send the customer's order to the Admin
   */
  getAdminOrderUrl: (order) => {
    const adminPhone = whatsappService.getAdminPhone();
    const message = whatsappService.formatOrderMessage(order);
    const cleaned = whatsappService.cleanPhone(adminPhone);
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Creates direct WhatsApp link for Admin to contact the Customer with an order status update
   */
  getCustomerChatUrl: (order, customMessage = '') => {
    const customerPhone = order?.shippingAddress?.phone || order?.user?.phone;
    const cleanCustomer = whatsappService.cleanPhone(customerPhone);
    if (!cleanCustomer) return '';

    const orderId = (order._id || order.id || '').toString().slice(-8).toUpperCase();
    const customerName = order?.shippingAddress?.fullName || order?.user?.name || 'Customer';

    const defaultMsg = customMessage || (
`Hello *${customerName}*! 👋
This is from *SmartMart AI Supermarket*.
Your order *#${orderId}* (Total: ₹${(order?.totalPrice || order?.totalAmount || 0).toLocaleString()}) is currently *${order?.status || 'Processing'}*.
We are preparing your items for delivery. Please let us know if you have any questions!`
    );

    return `https://wa.me/${cleanCustomer}?text=${encodeURIComponent(defaultMsg)}`;
  },

  /**
   * Helper to open WhatsApp URL in a safe new window/tab
   */
  openWhatsApp: (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
