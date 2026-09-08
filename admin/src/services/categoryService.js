import api from './api';

export const defaultCategories = [
  {
    _id: 'cat_grocery_1',
    id: 'grocery',
    slug: 'grocery',
    name: 'Grocery',
    itemCount: '200+ items',
    description: 'Flour, rice, cooking oils, pulses and kitchen essentials',
    image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=600&q=80',
    bgGradient: 'from-amber-50 to-orange-50/60',
    borderColor: 'border-amber-100',
    icon: 'Package'
  },
  {
    _id: 'cat_dairy_2',
    id: 'dairy',
    slug: 'dairy',
    name: 'Dairy',
    itemCount: '100+ items',
    description: 'Fresh milk, butter, artisanal cheese, curd & yogurt',
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',
    bgGradient: 'from-sky-50 to-blue-50/60',
    borderColor: 'border-blue-100',
    icon: 'Milk'
  },
  {
    _id: 'cat_beverages_3',
    id: 'beverages',
    slug: 'beverages',
    name: 'Beverages',
    itemCount: '80+ items',
    description: 'Natural juices, refreshing sodas, gourmet tea & coffee',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    bgGradient: 'from-emerald-50 to-teal-50/60',
    borderColor: 'border-emerald-100',
    icon: 'Coffee'
  },
  {
    _id: 'cat_snacks_4',
    id: 'snacks',
    slug: 'snacks',
    name: 'Snacks',
    itemCount: '150+ items',
    description: 'Crispy potato chips, cookies, wafers, nuts & crackers',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
    bgGradient: 'from-yellow-50 to-amber-50/60',
    borderColor: 'border-yellow-100',
    icon: 'Cookie'
  },
  {
    _id: 'cat_fruits_5',
    id: 'fruits',
    slug: 'fruits',
    name: 'Fruits',
    itemCount: '120+ items',
    description: 'Farm fresh seasonal fruits, citrus, berries & bananas',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
    bgGradient: 'from-rose-50 to-orange-50/60',
    borderColor: 'border-rose-100',
    icon: 'Apple'
  },
  {
    _id: 'cat_vegetables_6',
    id: 'vegetables',
    slug: 'vegetables',
    name: 'Vegetables',
    itemCount: '100+ items',
    description: 'Crisp green vegetables, tomatoes, organic herbs & roots',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    bgGradient: 'from-green-50 to-emerald-50/60',
    borderColor: 'border-green-100',
    icon: 'Carrot'
  }
];

export const categoryService = {
  getAllCategories: async () => {
    try {
      const response = await api.get('/categories');
      if (response.data && response.data.categories && response.data.categories.length > 0) {
        return response.data.categories;
      }
      return defaultCategories;
    } catch (error) {
      console.warn('Using default categories fallback:', error.message);
      return defaultCategories;
    }
  },

  getCategoryById: async (id) => {
    const response = await api.get(/categories/);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(/categories/, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(/categories/);
    return response.data;
  },

  uploadCategoryImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default categoryService;
