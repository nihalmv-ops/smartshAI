import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { CategorySection } from '../components/home/CategorySection';
import { PopularProducts } from '../components/home/PopularProducts';
import { FeaturedDeals } from '../components/home/FeaturedDeals';
import { BenefitsSection } from '../components/home/BenefitsSection';
import { Newsletter } from '../components/home/Newsletter';

export const Home = ({ navigateTo, onSelectProduct }) => {
  return (
    <div className="min-h-screen">
      {/* Hero Section matching mockup */}
      <HeroSection
        onStartShopping={() => navigateTo('products')}
        onExplore={() => navigateTo('categories')}
      />

      {/* Shop By Category */}
      <CategorySection
        onSelectCategory={(catId) => navigateTo('products', { category: catId })}
        onViewAll={() => navigateTo('categories')}
      />

      {/* Popular Products with Category Filter Pills */}
      <PopularProducts
        onSelectProduct={onSelectProduct}
      />

      {/* Featured Deals of the Day */}
      <FeaturedDeals
        onSelectProduct={onSelectProduct}
        onViewAll={() => navigateTo('products')}
      />

      {/* Benefits / Trust Section */}
      <BenefitsSection />

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
};

