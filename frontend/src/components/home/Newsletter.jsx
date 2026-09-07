import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Gift } from 'lucide-react';

export const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setEmail('');
      }, 4000);
    }
  };

  return (
    <section className="py-14 bg-gradient-to-br from-brand-50 via-sky-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-100 shadow-card flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="space-y-2 text-center md:text-left max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mb-1">
              <Gift className="w-3.5 h-3.5 text-brand-600" />
              <span>Special Offer For You</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Get ₹100 OFF On Your First Order
            </h3>
            <p className="text-sm text-slate-600">
              Subscribe to our newsletter for exclusive weekly discounts, recipes, and seasonal fruit arrivals.
            </p>
          </div>

          <div className="w-full md:w-auto flex-1 max-w-md">
            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Coupon code <strong>FRESH20</strong> sent to your inbox!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-bold shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all whitespace-nowrap"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
            <p className="text-[11px] text-slate-400 text-center md:text-left mt-2">
              Instant delivery guarantee. Unsubscribe anytime with 1 click.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

