import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Package,
  Milk,
  Coffee,
  Cookie,
  Apple,
  Carrot,
  ShoppingBag,
  Heart,
  Utensils,
  Camera
} from 'lucide-react';
import { AdminHeader } from '../components/layout/AdminHeader';
import { categoryService, defaultCategories } from '../services/categoryService';

// Curated high-resolution grocery category image presets
const IMAGE_PRESETS = [
  {
    name: 'Fresh Bakery & Breads',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    suggestedIcon: 'Cookie'
  },
  {
    name: 'Farm Fresh Vegetables',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    suggestedIcon: 'Carrot'
  },
  {
    name: 'Fresh Organic Fruits',
    url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    suggestedIcon: 'Apple'
  },
  {
    name: 'Dairy, Milk & Cheese',
    url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80',
    suggestedIcon: 'Milk'
  },
  {
    name: 'Gourmet Beverages & Juices',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    suggestedIcon: 'Coffee'
  },
  {
    name: 'Crispy Snacks & Crackers',
    url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80',
    suggestedIcon: 'Cookie'
  },
  {
    name: 'Pantry Grocery Essentials',
    url: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=800&q=80',
    suggestedIcon: 'Package'
  },
  {
    name: 'Breakfast Cereals & Oats',
    url: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=800&q=80',
    suggestedIcon: 'Utensils'
  },
  {
    name: 'Personal & Home Care',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    suggestedIcon: 'Heart'
  }
];

// Color theme styles
const COLOR_THEMES = [
  { label: 'Amber / Orange', bgGradient: 'from-amber-50 to-orange-50/60', borderColor: 'border-amber-100', dot: 'bg-amber-400' },
  { label: 'Sky / Blue', bgGradient: 'from-sky-50 to-blue-50/60', borderColor: 'border-blue-100', dot: 'bg-sky-400' },
  { label: 'Emerald / Teal', bgGradient: 'from-emerald-50 to-teal-50/60', borderColor: 'border-emerald-100', dot: 'bg-emerald-400' },
  { label: 'Yellow / Gold', bgGradient: 'from-yellow-50 to-amber-50/60', borderColor: 'border-yellow-100', dot: 'bg-yellow-400' },
  { label: 'Rose / Pink', bgGradient: 'from-rose-50 to-orange-50/60', borderColor: 'border-rose-100', dot: 'bg-rose-400' },
  { label: 'Green / Lime', bgGradient: 'from-green-50 to-emerald-50/60', borderColor: 'border-green-100', dot: 'bg-green-400' },
  { label: 'Purple / Violet', bgGradient: 'from-purple-50 to-indigo-50/60', borderColor: 'border-purple-100', dot: 'bg-purple-400' }
];

const ICONS = [
  { name: 'Package', component: Package },
  { name: 'Milk', component: Milk },
  { name: 'Coffee', component: Coffee },
  { name: 'Cookie', component: Cookie },
  { name: 'Apple', component: Apple },
  { name: 'Carrot', component: Carrot },
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'Heart', component: Heart },
  { name: 'Utensils', component: Utensils },
  { name: 'Sparkles', component: Sparkles }
];

const initialFormState = {
  name: '',
  slug: '',
  itemCount: '50+ items',
  description: '',
  image: '',
  bgGradient: 'from-emerald-50 to-teal-50/60',
  borderColor: 'border-emerald-100',
  icon: 'Package'
};

export const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Quick image edit on card
  const [quickImageTarget, setQuickImageTarget] = useState(null);
  const cardFileInputRef = useRef(null);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data || defaultCategories);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories(defaultCategories);
      showToast('Loaded local category fallbacks', 'info');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || category.id || '',
      itemCount: category.itemCount || '50+ items',
      description: category.description || '',
      image: category.image || '',
      bgGradient: category.bgGradient || 'from-emerald-50 to-teal-50/60',
      borderColor: category.borderColor || 'border-emerald-100',
      icon: category.icon || 'Package'
    });
    setModalOpen(true);
  };

  // Auto-generate slug from name during creation
  const handleNameChange = (e) => {
    const val = e.target.value;
    if (!editingCategory) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, name: val, slug: autoSlug }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  // Handle local image file upload in modal
  const handleImageFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await categoryService.uploadCategoryImage(file);
      if (res && res.imageUrl) {
        setFormData((prev) => ({ ...prev, image: res.imageUrl }));
        showToast('Image uploaded successfully!');
      } else {
        throw new Error(res?.message || 'Failed to upload image');
      }
    } catch (err) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Handle Quick Image Upload directly from category card
  const handleCardQuickImageClick = (cat) => {
    setQuickImageTarget(cat);
    if (cardFileInputRef.current) {
      cardFileInputRef.current.click();
    }
  };

  const handleCardQuickImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !quickImageTarget) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    const targetCat = quickImageTarget;
    setQuickImageTarget(null);
    showToast('Uploading new category image...', 'info');

    try {
      const uploadRes = await categoryService.uploadCategoryImage(file);
      if (!uploadRes?.imageUrl) {
        throw new Error('Could not upload image');
      }

      // Update category image on backend
      const targetId = targetCat._id || targetCat.slug || targetCat.id;
      await categoryService.updateCategory(targetId, { image: uploadRes.imageUrl });

      // Update state locally
      setCategories((prev) =>
        prev.map((c) =>
          (c._id === targetCat._id || c.slug === targetCat.slug || c.id === targetCat.id)
            ? { ...c, image: uploadRes.imageUrl }
            : c
        )
      );
      showToast(`Category image for '${targetCat.name}' updated!`);
    } catch (err) {
      showToast(err.message || 'Failed to update category image', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Submit create or edit form
  const handleSubmitCategory = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    if (!formData.image.trim()) {
      showToast('Category banner image is required. Upload an image or select a preset.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        const id = editingCategory._id || editingCategory.slug || editingCategory.id;
        const res = await categoryService.updateCategory(id, formData);
        showToast(`Category '${formData.name}' updated successfully!`);
        
        const updatedCat = res.category || { ...editingCategory, ...formData };
        setCategories((prev) =>
          prev.map((c) =>
            (c._id === id || c.slug === id || c.id === id) ? updatedCat : c
          )
        );
      } else {
        const res = await categoryService.createCategory(formData);
        showToast(`New category '${formData.name}' created successfully!`);
        const newCat = res.category || {
          ...formData,
          _id: `cat_${Date.now()}`,
          id: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-')
        };
        setCategories((prev) => [newCat, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const id = deleteTarget._id || deleteTarget.slug || deleteTarget.id;
      await categoryService.deleteCategory(id);
      setCategories((prev) =>
        prev.filter((c) => c._id !== id && c.slug !== id && c.id !== id)
      );
      showToast(`Category '${deleteTarget.name}' deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete category', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (cat.name && cat.name.toLowerCase().includes(q)) ||
      (cat.slug && cat.slug.toLowerCase().includes(q)) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {/* Hidden file input for one-click quick card image change */}
      <input
        type="file"
        ref={cardFileInputRef}
        onChange={handleCardQuickImageChange}
        accept="image/*"
        className="hidden"
      />

      <AdminHeader
        title="Category Management"
        subtitle="Create new categories, update banner images, and customize visual store styling"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-slideUp">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : toast.type === 'info'
                ? 'bg-sky-950/90 border-sky-500/40 text-sky-200'
                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-3.5 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories by name or slug..."
              className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Quick Metrics & Add Button */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>{categories.length} Categories</span>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-xs font-semibold">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No categories found</h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? 'Try adjusting your search query.' : 'Create your first store category.'}
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCategories.map((cat) => (
              <div
                key={cat._id || cat.slug || cat.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all shadow-xl group flex flex-col justify-between"
              >
                {/* Card Top: Banner Image with Hover Quick Change Button */}
                <div className={`relative h-44 w-full bg-gradient-to-b ${cat.bgGradient || 'from-slate-800 to-slate-900'} flex items-center justify-center p-4 overflow-hidden border-b border-slate-800`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  {/* Quick Change Image Button Overlay */}
                  <button
                    onClick={() => handleCardQuickImageClick(cat)}
                    title="Upload new image for this category"
                    className="absolute top-3 right-3 px-2.5 py-1.5 bg-slate-950/80 hover:bg-brand-600 backdrop-blur-md text-white text-[11px] font-bold rounded-xl border border-slate-700/80 flex items-center gap-1.5 shadow-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Image</span>
                  </button>

                  {/* Item count tag */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-950/85 backdrop-blur-xs text-white text-[10px] font-bold rounded-full border border-slate-700/60">
                    {cat.itemCount || '100+ items'}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-base font-black text-white group-hover:text-brand-400 transition-colors">
                        {cat.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] font-bold rounded-md border border-slate-700 shrink-0">
                        {cat.slug || cat.id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description || 'Essential grocery category items and selections.'}
                    </p>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="flex-1 py-2 px-3 bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-brand-400" />
                      <span>Edit Details & Image</span>
                    </button>

                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="p-2 bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 hover:border-rose-500/30 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE & EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingCategory ? 'Update category image, metadata and theme' : 'Add a new category to the store catalog'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitCategory} className="p-4 sm:p-6 space-y-5">
              {/* Category Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Bakery & Breads"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Category Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. bakery-breads"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-300 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Items Count & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Item Count Label
                  </label>
                  <input
                    type="text"
                    value={formData.itemCount}
                    onChange={(e) => setFormData({ ...formData, itemCount: e.target.value })}
                    placeholder="e.g. 100+ items or New Collection"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Icon Type
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    {ICONS.map((i) => (
                      <option key={i.name} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe this category (e.g. Freshly baked breads, pastries and cookies)..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* PRIMARY SECTION: CATEGORY IMAGE MANAGEMENT */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-brand-400" />
                    <span>Category Banner Image *</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Upload file or choose preset
                  </span>
                </div>

                {/* Live Image Preview */}
                <div className="flex items-center gap-4">
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-b ${formData.bgGradient} border ${formData.borderColor} p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-inner`}>
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    )}
                  </div>

                  {/* Upload from Local Device Button */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md transition-colors">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload from Device</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Upload JPG, PNG, WEBP from your computer (auto-saved to server).
                    </p>
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Or Paste Image URL directly:
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                {/* 1-Click High-Res Presets */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick 1-Click Grocery Presets:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {IMAGE_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            image: preset.url,
                            icon: preset.suggestedIcon || prev.icon
                          }));
                          showToast(`Selected preset: ${preset.name}`, 'info');
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          formData.image === preset.url
                            ? 'bg-brand-500/20 border-brand-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-[10px] font-semibold truncate leading-tight">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visual Color Theme Swatches */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Card Theme Gradient
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_THEMES.map((theme) => {
                    const isSelected = formData.bgGradient === theme.bgGradient;
                    return (
                      <button
                        type="button"
                        key={theme.label}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            bgGradient: theme.bgGradient,
                            borderColor: theme.borderColor
                          })
                        }
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-brand-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${theme.dot} shrink-0`} />
                        <span className="text-[11px] font-semibold truncate">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Delete Category?</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">'{deleteTarget.name}'</strong>?
                This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
