// Skyline Mart Direct WhatsApp Order Messaging Service

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
    let cleaned = phone.toString().replace(/\D/g, '');
    // If standard 10 digit Indian number without country code, prepend 91
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return cleaned;
  },

  /**
   * Clean, formatted customer order receipt matching store owner specs
   */
  formatCustomerOrderMessage: (order) => {
    if (!order) return '';

    const orderId = (order._id || order.id || 'NEW').toString().slice(-8).toUpperCase();
    const customerName = order.shippingAddress?.fullName || order.user?.name || 'Customer';
    const customerPhone = order.shippingAddress?.phone || order.user?.phone || '';
    const address = order.shippingAddress?.address || 'Doorstep Delivery';
    const city = order.shippingAddress?.city ? `, ${order.shippingAddress.city}` : '';
    const postalCode = order.shippingAddress?.postalCode ? ` - ${order.shippingAddress.postalCode}` : '';
    const deliveryNotes = order.deliveryNotes || '';
    const payment = order.paymentMethod || 'Cash on Delivery';

    const items = order.orderItems || [];
    const itemsFormatted = items.length > 0
      ? items.map((item) => {
          const qty = item.qty || item.quantity || 1;
          const price = item.price ? `₹${item.price * qty}` : '₹0';
          return `Product: ${item.name}\nQuantity: ${qty}\nPrice: ${price}`;
        }).join('\n\n')
      : 'Product: Assorted Groceries\nQuantity: 1\nPrice: ₹' + (order.totalPrice || 0);

    const subtotal = order.itemsPrice !== undefined ? `₹${order.itemsPrice}` : `₹${order.totalPrice || 0}`;
    const delivery = order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee || 0}`;
    const discount = order.discount > 0 ? `₹${order.discount}` : '₹0';
    const total = `₹${order.totalPrice || 0}`;

    let msg = `Hello Skyline Mart 👋\nI would like to place an order.\n\nOrder Details:\n${itemsFormatted}\n\nSubtotal: ${subtotal}\nDelivery: ${delivery}\n`;
    if (order.discount > 0) {
      msg += `Discount: ${discount}\n`;
    }
    msg += `Total: ${total}\n\nCustomer Details:\nName: ${customerName}\nPhone: ${customerPhone}\nAddress: ${address}${city}${postalCode}\n`;
    if (deliveryNotes) {
      msg += `Optional Delivery Notes: ${deliveryNotes}\n`;
    }
    msg += `Payment Method: ${payment}\nOrder ID: #${orderId}\n\nPlease confirm my order. Thank you!`;

    return msg;
  },

  /**
   * Generates formatted WhatsApp order notification for the Store Admin
   */
  formatOrderMessage: (order) => {
    return whatsappService.formatCustomerOrderMessage(order);
  },

  /**
   * Creates direct WhatsApp link to send the customer's order to a specific target phone
   */
  getWhatsAppOrderUrl: (order, targetPhone = '') => {
    const phone =
      targetPhone ||
      order?.whatsappContact?.phoneNumber ||
      whatsappService.getAdminPhone();
    const message = whatsappService.formatCustomerOrderMessage(order);
    const cleaned = whatsappService.cleanPhone(phone);
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Creates direct WhatsApp link to send the customer's order to the default Admin
   */
  getAdminOrderUrl: (order) => {
    return whatsappService.getWhatsAppOrderUrl(order);
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

    const defaultMsg =
      customMessage ||
      `Hello *${customerName}*! 👋\nThis is from *Skyline Mart*.\nYour order *#${orderId}* (Total: ₹${(
        order?.totalPrice ||
        order?.totalAmount ||
        0
      ).toLocaleString()}) is currently *${
        order?.status || 'Processing'
      }*.\nWe are preparing your items for delivery. Please let us know if you have any questions!`;

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
