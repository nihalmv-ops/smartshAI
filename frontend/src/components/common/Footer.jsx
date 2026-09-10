import React, { useState } from 'react';
import { ShoppingCart, ArrowRight, CheckCircle2, Facebook, Instagram, Twitter, Youtube, Send } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const Footer = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3500);
    }
  };

  return (
    <footer className="bg-[#0B1426] text-slate-300 pt-12 sm:pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              onClick={() => navigateTo('home')}
              className="flex items-center gap-3 cursor-pointer group inline-flex"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-extrabold text-white tracking-tight">Skyline <span className="text-brand-400">Mart</span></span>
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Fresh • Fast • Reliable</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Your modern supermarket for handpicked fresh farm produce, dairy, bakery, beverages and daily essentials delivered right to your doorstep with guaranteed freshness.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Follow Us:</span>
              <div className="flex items-center gap-2">
                <a href="#facebook" className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#instagram" className="w-8 h-8 rounded-full bg-pink-600/20 text-pink-400 hover:bg-pink-600 hover:text-white flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#twitter" className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#youtube" className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => navigateTo('home')} className="hover:text-brand-400 transition-colors">Home</button>
              </li>
              <li>
                <button onClick={() => navigateTo('products')} className="hover:text-brand-400 transition-colors">Products</button>
              </li>
              <li>
                <button onClick={() => navigateTo('categories')} className="hover:text-brand-400 transition-colors">Categories</button>
              </li>
              <li>
                <button onClick={() => navigateTo('wishlist')} className="hover:text-brand-400 transition-colors">Wishlist</button>
              </li>
              <li>
                <button onClick={() => navigateTo('cart')} className="hover:text-brand-400 transition-colors">My Cart</button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Customer Service</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#orders" className="hover:text-brand-400 transition-colors">My Orders</a></li>
              <li><a href="#track" className="hover:text-brand-400 transition-colors">Track Order</a></li>
              <li><a href="#returns" className="hover:text-brand-400 transition-colors">Easy Returns</a></li>
              <li><a href="#help" className="hover:text-brand-400 transition-colors">Help Center</a></li>
              <li><a href="#faqs" className="hover:text-brand-400 transition-colors">FAQs & Support</a></li>
            </ul>
          </div>

          {/* Newsletter Section matching mockup */}
          <div className="space-y-4">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Newsletter</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get the latest exclusive weekly offers, freshly arrived produce alerts and smart discounts.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you! You are subscribed.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full pl-3.5 pr-12 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg flex items-center justify-center transition-colors shadow"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
            <p className="text-[11px] text-slate-500">We respect your privacy. No spam ever.</p>
          </div>

        </div>

        {/* Bottom Bar matching mockup */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>© 2026 Skyline Mart. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <a href="#terms" className="hover:text-slate-400 transition-colors">Terms & Conditions</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#security" className="hover:text-slate-400 transition-colors">Security</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

