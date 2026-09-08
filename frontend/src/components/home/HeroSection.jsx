import React from "react";
import { ArrowRight, Headphones, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import heroGrocery from "../../assets/hero-grocery.png"

export const HeroSection = ({ onStartShopping, onExplore }) => {
  return (
    <section className="supermart-hero relative overflow-hidden">

      {/* Decorative Background */}
      <div className="hero-shape hero-shape-one" />
      <div className="hero-shape hero-shape-two" />
      <div className="hero-shape hero-shape-three" />

      {/* Decorative dots */}
      <div className="hero-dots hero-dots-one" />
      <div className="hero-dots hero-dots-two" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 sm:py-16 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16 py-10">

        {/* =========================
            LEFT CONTENT
        ========================== */}
        <div className="relative z-20 max-w-xl">

          {/* Delivery Badge */}
          <div className="hero-delivery-badge mb-4 sm:mb-6 inline-flex items-center gap-2.5 sm:gap-3 rounded-full bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-md">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Truck size={18} strokeWidth={2.3} />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">
                Fast 15-Min Delivery
              </p>

              <p className="text-[10px] sm:text-[11px] text-slate-500">
                On All Grocery Orders
              </p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="max-w-[650px] text-3xl font-black leading-[1.12] tracking-tight text-[#09245f] sm:text-5xl md:text-6xl lg:text-[58px] xl:text-[64px]">
            Your Everyday
            <span className="block">
              Shopping{" "}
              <span className="relative inline-block text-blue-600">
                Made Simple
                <span className="hero-heading-line" />
              </span>
            </span>
          </h1>

          {/* Description */}
          <p className="mt-4 sm:mt-6 max-w-lg text-sm sm:text-base md:text-lg leading-relaxed text-slate-600">
            Fresh farm groceries, daily dairy essentials and kitchen staples —
            delivered directly to your doorstep in minutes.
          </p>

          {/* Buttons */}
          <div className="mt-6 sm:mt-7 flex flex-col xs:flex-row gap-3">
            <Link
              to="/products"
              onClick={onStartShopping}
              className="hero-primary-button group inline-flex items-center justify-center gap-2.5 rounded-full bg-blue-600 px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl text-center"
            >
              <span>Start Shopping</span>
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <Link
              to="/products"
              onClick={onExplore}
              className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 bg-white px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-blue-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 text-center"
            >
              Explore Products
            </Link>
          </div>

          {/* Benefits */}
          <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-y-5">
            {/* Quality */}
            <div className="hero-benefit flex items-center gap-2 sm:gap-3 sm:pr-6">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm shrink-0">
                <ShieldCheck size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-[#09245f]">Quality</p>
                <p className="text-[10px] sm:text-xs text-slate-500">Products</p>
              </div>
            </div>

            <div className="hidden h-8 w-px bg-blue-200 sm:block" />

            {/* Delivery */}
            <div className="hero-benefit flex items-center gap-2 sm:gap-3 sm:px-6">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm shrink-0">
                <Truck size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-[#09245f]">Fast</p>
                <p className="text-[10px] sm:text-xs text-slate-500">Delivery</p>
              </div>
            </div>

            <div className="hidden h-8 w-px bg-blue-200 sm:block" />

            {/* Support */}
            <div className="hero-benefit flex items-center gap-2 sm:gap-3 sm:pl-6">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm shrink-0">
                <Headphones size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-[#09245f]">24/7</p>
                <p className="text-[10px] sm:text-xs text-slate-500">Support</p>
              </div>
            </div>
          </div>

        </div>

        {/* =========================
            RIGHT HERO IMAGE
        ========================== */}
        <div className="hero-image-wrapper relative flex min-h-[260px] items-center justify-center sm:min-h-[420px] lg:min-h-[540px] overflow-hidden sm:overflow-visible">

          {/* Large Circle */}
          <div className="hero-main-circle absolute right-[4%] sm:right-[2%] top-[8%] sm:top-[10%] h-[230px] w-[230px] sm:h-[400px] sm:w-[400px] lg:h-[510px] lg:w-[510px] rounded-full bg-blue-100" />

          {/* Inner Circle */}
          <div className="hero-inner-circle absolute right-[10%] sm:right-[8%] top-[14%] sm:top-[16%] h-[190px] w-[190px] sm:h-[350px] sm:w-[350px] lg:h-[440px] lg:w-[440px] rounded-full border-[10px] sm:border-[18px] border-blue-50" />

          {/* Grocery Image */}
          <img
            src={heroGrocery}
            alt="Fresh groceries in shopping basket"
            className="hero-grocery-image relative z-10 w-[240px] object-contain sm:w-[430px] md:w-[500px] lg:w-[590px] xl:w-[640px]"
          />

          {/* Fresh & Healthy Badge */}
          <div className="hero-fresh-badge absolute right-[2%] top-[6%] sm:top-[9%] z-20 flex h-[76px] w-[76px] sm:h-[120px] sm:w-[120px] items-center justify-center rounded-full bg-blue-600 text-center text-white shadow-xl">
            <div>
              <p className="text-xs sm:text-lg font-extrabold leading-tight">
                Fresh &amp;
              </p>
              <p className="text-xs sm:text-lg font-extrabold leading-tight">
                Healthy
              </p>
            </div>
          </div>

          {/* Decorative leaf */}
          <div className="hero-leaf hero-leaf-one hidden sm:block">
            <span />
            <span />
          </div>

          {/* Decorative leaf */}
          <div className="hero-leaf hero-leaf-two hidden sm:block">
            <span />
            <span />
          </div>

        </div>

      </div>
    </section>
  );
};

export const Hero = HeroSection;
export default HeroSection;
