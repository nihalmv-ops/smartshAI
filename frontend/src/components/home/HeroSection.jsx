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

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-6 sm:py-16 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">

        {/* =========================
            LEFT CONTENT
        ========================== */}
        <div className="relative z-20 max-w-xl">

          {/* Delivery Badge */}
          <div className="hero-delivery-badge mb-6 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Truck size={20} strokeWidth={2.3} />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">
                Fast Delivery
              </p>

              <p className="text-[11px] text-slate-500">
                On All Orders
              </p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="max-w-[650px] text-4xl font-extrabold leading-[1.08] tracking-tight text-[#09245f] sm:text-5xl md:text-6xl lg:text-[58px] xl:text-[64px]">

            Your Everyday

            <span className="block">
              Shopping{" "}
              <span className="relative inline-block text-blue-600">
                Made Simple

                {/* Underline */}
                <span className="hero-heading-line" />
              </span>
            </span>

          </h1>

          {/* Description */}
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-700 sm:text-lg">
            Fresh groceries, household essentials and more —
            delivered directly to your doorstep.
          </p>

          {/* Buttons */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">

            <Link
              to="/products"
              onClick={onStartShopping}
              className="hero-primary-button group inline-flex items-center justify-center gap-3 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
            >
              Start Shopping

              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <Link
              to="/products"
              onClick={onExplore}
              className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 bg-white px-7 py-3.5 text-sm font-bold text-blue-600 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50"
            >
              Explore Products
            </Link>

          </div>

          {/* Benefits */}
          <div className="mt-8 flex flex-wrap items-center gap-y-5">

            {/* Quality */}
            <div className="hero-benefit flex items-center gap-3 pr-6 sm:pr-8">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                <ShieldCheck size={23} />
              </div>

              <div>
                <p className="text-xs font-bold text-[#09245f]">
                  Quality
                </p>

                <p className="text-xs text-slate-600">
                  Products
                </p>
              </div>

            </div>

            {/* Divider */}
            <div className="hidden h-10 w-px bg-blue-200 sm:block" />

            {/* Delivery */}
            <div className="hero-benefit flex items-center gap-3 px-0 sm:px-6">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                <Truck size={23} />
              </div>

              <div>
                <p className="text-xs font-bold text-[#09245f]">
                  Fast
                </p>

                <p className="text-xs text-slate-600">
                  Delivery
                </p>
              </div>

            </div>

            {/* Divider */}
            <div className="hidden h-10 w-px bg-blue-200 sm:block" />

            {/* Support */}
            <div className="hero-benefit flex items-center gap-3 px-0 sm:pl-6">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                <Headphones size={23} />
              </div>

              <div>
                <p className="text-xs font-bold text-[#09245f]">
                  24/7
                </p>

                <p className="text-xs text-slate-600">
                  Support
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* =========================
            RIGHT HERO IMAGE
        ========================== */}
        <div className="hero-image-wrapper relative flex min-h-[350px] items-center justify-center sm:min-h-[450px] lg:min-h-[560px]">

          {/* Large Circle */}
          <div className="hero-main-circle absolute right-[2%] top-[10%] h-[300px] w-[300px] rounded-full bg-blue-100 sm:h-[400px] sm:w-[400px] lg:h-[510px] lg:w-[510px]" />

          {/* Inner Circle */}
          <div className="hero-inner-circle absolute right-[8%] top-[16%] h-[260px] w-[260px] rounded-full border-[18px] border-blue-50 sm:h-[350px] sm:w-[350px] lg:h-[440px] lg:w-[440px]" />

          {/* Grocery Image */}
          <img
            src={heroGrocery}
            alt="Fresh groceries in shopping basket"
            className="hero-grocery-image relative z-10 w-[310px] object-contain sm:w-[430px] md:w-[500px] lg:w-[590px] xl:w-[650px]"
          />

          {/* Fresh & Healthy Badge */}
          <div className="hero-fresh-badge absolute right-[1%] top-[10%] z-20 flex h-[105px] w-[105px] items-center justify-center rounded-full bg-blue-600 text-center text-white shadow-xl sm:right-[2%] sm:h-[125px] sm:w-[125px] lg:right-[3%] lg:top-[9%]">

            <div>
              <p className="text-lg font-extrabold leading-5 sm:text-xl">
                Fresh &amp;
              </p>

              <p className="text-lg font-extrabold leading-5 sm:text-xl">
                Healthy
              </p>
            </div>

          </div>

          {/* Decorative leaf */}
          <div className="hero-leaf hero-leaf-one">
            <span />
            <span />
          </div>

          {/* Decorative leaf */}
          <div className="hero-leaf hero-leaf-two">
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
