import React from 'react';
import { Truck, ShieldCheck, RefreshCw, BadgePercent } from 'lucide-react';

export const BenefitsSection = () => {
  const benefits = [
    {
      icon: <Truck className="w-6 h-6 text-brand-500" />,
      bg: 'bg-blue-50',
      title: '15-Min Free Delivery',
      desc: 'Superfast delivery right to your kitchen on all orders over ₹199.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      bg: 'bg-emerald-50',
      title: '100% Quality Freshness',
      desc: 'Harvested and quality-tested daily directly from partnered farms.'
    },
    {
      icon: <BadgePercent className="w-6 h-6 text-amber-500" />,
      bg: 'bg-amber-50',
      title: 'Daily Super Savings',
      desc: 'Exclusive wholesale prices & seasonal bundle deals every single day.'
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-indigo-500" />,
      bg: 'bg-indigo-50',
      title: 'Instant No-Fuss Returns',
      desc: 'Not satisfied with freshness? Get an instant doorstep refund or exchange.'
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:shadow-soft transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl ${benefit.bg} flex items-center justify-center flex-shrink-0`}>
                {benefit.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">{benefit.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

