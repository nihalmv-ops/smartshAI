import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Camera,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService, defaultCategories } from '../services/categoryService';
import { adminService } from '../services/adminService';
import { AdminHeader } from '../components/layout/AdminHeader';

export const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toast, setToast] = useState(null);

  const initialFormState = {
    name: '',
    category: 'grocery',
    unit: '1 kg',
    isWeightBased: true,
    price: 50,
    costPrice: 38,
    originalPrice: 60,
    barcode: '',
    lowStockThreshold: 10,
    stockCount: 50,
    inStock: true,
    popular: true,
    featured: false,
    badge: 'Fresh',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh and high-grade grocery selection.'
  };
  const [productForm, setProductForm] = useState(initialFormState);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      setRefreshing(true);
      const [prodRes, catData] = await Promise.allSettled([
        productService.getAllProducts(),
        categoryService.getAllCategories()
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value?.products) {
        setProducts(prodRes.value.products);
      }
      if (catData.status === 'fulfilled' && catData.value && catData.value.length > 0) {
        setCategories(catData.value);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load products', 'error');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setEditingProductId(null);
    setProductForm(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProductId(p._id || p.id);
    const isWeight = p.isWeightBased !== undefined
      ? Boolean(p.isWeightBased)
      : ['kg', 'gram', 'g', 'gm', '1 kg', 'per kg'].includes((p.unit || '').toLowerCase().trim());
    setProductForm({
      name: p.name,
      category: p.category,
      unit: p.unit,
      isWeightBased: isWeight,
      price: p.price,
      costPrice: p.costPrice !== undefined ? p.costPrice : Math.round((p.price || 0) * 0.75),
      originalPrice: p.originalPrice || p.price,
      barcode: p.barcode || '',
      lowStockThreshold: p.lowStockThreshold || 10,
      stockCount: p.stockCount !== undefined ? p.stockCount : 50,
      inStock: p.inStock !== undefined ? p.inStock : true,
      popular: p.popular !== undefined ? Boolean(p.popular) : true,
      featured: p.featured !== undefined ? Boolean(p.featured) : false,
      badge: p.badge || '',
      image: p.image,
      description: p.description || ''
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await productService.uploadProductImage(file);
      if (res && res.imageUrl) {
        setProductForm((prev) => ({ ...prev, image: res.imageUrl }));
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

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.image.trim()) {
      showToast('Name and Image are required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      if (editingProductId) {
        await productService.updateProduct(editingProductId, productForm);
        showToast('Product updated successfully!');
      } else {
        await productService.createProduct(productForm);
        showToast('Product created successfully!');
      }
      setModalOpen(false);
      await fetchProducts();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      await productService.deleteProduct(id);
      showToast(`"${name}" deleted.`);
      await fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [inlineEdits, setInlineEdits] = useState({});
  const [savingInlineId, setSavingInlineId] = useState(null);

  const handleInlineFieldChange = (product, field, value) => {
    const pid = product._id || product.id;
    setInlineEdits((prev) => {
      const existing = prev[pid] || {
        unit: product.unit || '1 kg',
        price: product.price || 0
      };
      const updated = { ...existing, [field]: value };
      // If unit is switched between Kg and 500g / 250g / Gram, optionally scale price if user hasn't manually typed price yet
      if (field === 'unit') {
        const oldUnit = (existing.unit || '').toLowerCase().trim();
        const newUnit = (value || '').toLowerCase().trim();
        const basePrice = Number(existing.price || product.price || 0);
        if (['kg', '1 kg'].includes(oldUnit) && newUnit === '500g') {
          updated.price = Math.round(basePrice * 0.5 * 100) / 100;
        } else if (['kg', '1 kg'].includes(oldUnit) && newUnit === '250g') {
          updated.price = Math.round(basePrice * 0.25 * 100) / 100;
        } else if (oldUnit === '500g' && ['kg', '1 kg'].includes(newUnit)) {
          updated.price = Math.round(basePrice * 2 * 100) / 100;
        } else if (oldUnit === '250g' && ['kg', '1 kg'].includes(newUnit)) {
          updated.price = Math.round(basePrice * 4 * 100) / 100;
        }
      }
      return { ...prev, [pid]: updated };
    });
  };

  const handleSaveInlineUnitAndPrice = async (product) => {
    const pid = product._id || product.id;
    const edit = inlineEdits[pid];
    if (!edit) return;
    const newUnit = (edit.unit || product.unit || '1 kg').trim();
    const newPrice = Number(edit.price);
    if (isNaN(newPrice) || newPrice <= 0) {
      showToast('Please enter a valid positive price', 'error');
      return;
    }
    const isWeight = ['kg', '1 kg', 'gram', 'g', 'gm', '500g', '250g', '100g'].includes(
      newUnit.toLowerCase()
    );
    setSavingInlineId(pid);
    try {
      await productService.updateProduct(pid, {
        ...product,
        unit: newUnit,
        price: newPrice,
        isWeightBased: isWeight
      });
      setProducts((prev) =>
        prev.map((p) =>
          p._id === pid || p.id === pid
            ? { ...p, unit: newUnit, price: newPrice, isWeightBased: isWeight }
            : p
        )
      );
      setInlineEdits((prev) => {
        const copy = { ...prev };
        delete copy[pid];
        return copy;
      });
      showToast(`Updated "${product.name}" → ${newUnit} @ ₹${newPrice}`);
    } catch (err) {
      showToast(err.message || 'Failed to update unit & price', 'error');
    } finally {
      setSavingInlineId(null);
    }
  };

  const handleQuickStockAdjust = async (id, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await adminService.updateStock(id, {
        stockCount: newStock,
        inStock: newStock > 0
      });
      setProducts((prev) =>
        prev.map((p) =>
          p._id === id || p.id === id ? { ...p, stockCount: newStock, inStock: newStock > 0 } : p
        )
      );
      showToast(`Stock updated to ${newStock} units`);
    } catch (err) {
      showToast(err.message || 'Failed to update stock', 'error');
    }
  };

  const searchSuggestions = products
    .filter((p) => {
      const q = productSearch.trim().toLowerCase();
      if (!q) return false;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toString().toLowerCase().includes(q))
      );
    })
    .slice(0, 6);

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toString().toLowerCase().includes(q));
    const matchesCat = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading catalog products...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Product Inventory Management"
        subtitle={`Managing ${products.length} products in store catalog`}
        onRefresh={fetchProducts}
        refreshing={refreshing}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl border flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-200" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <main className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Actions Bar */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 180)}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                placeholder="Search products by name, category, or barcode..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Live Product Search Suggestion Dropdown */}
              {showSearchSuggestions && productSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                    <span>Product Suggestions ({searchSuggestions.length})</span>
                    <span>Click to Filter or Edit</span>
                  </div>
                  {searchSuggestions.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      No matching products found
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {searchSuggestions.map((item) => (
                        <div
                          key={item._id || item.id}
                          onMouseDown={() => {
                            setProductSearch(item.name);
                            setShowSearchSuggestions(false);
                          }}
                          className="p-2.5 hover:bg-slate-50 flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {item.unit} • <span className="font-bold text-emerald-700">₹{item.price}</span> • Stock: {item.stockCount ?? 50}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setShowSearchSuggestions(false);
                              handleOpenEdit(item);
                            }}
                            className="px-2 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[10px] shrink-0 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-semibold focus:outline-none capitalize"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug || c.id} value={c.slug || c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <Link
              to="/categories"
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-300/80 transition-colors cursor-pointer shrink-0"
            >
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Categories ({categories.length})</span>
            </Link>

            <button
              onClick={handleOpenCreate}
              className="w-full sm:w-auto px-5 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-brand-500/25 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Custom Unit &amp; Sell Price</th>
                  <th className="py-3 px-3">Purchase Cost</th>
                  <th className="py-3 px-3">Gross Profit</th>
                  <th className="py-3 px-4 text-center">Manage Stock</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No products found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const pid = p._id || p.id;
                    const stock = p.stockCount !== undefined ? p.stockCount : 50;
                    const isLowStock = stock <= 10;
                    const rowEdit = inlineEdits[pid];
                    const currentUnitVal = rowEdit !== undefined ? rowEdit.unit : (p.unit || '1 kg');
                    const currentPriceVal = rowEdit !== undefined ? rowEdit.price : (p.price || 0);
                    const hasInlineChanges =
                      rowEdit !== undefined &&
                      (rowEdit.unit !== p.unit || Number(rowEdit.price) !== Number(p.price));

                    const cost = p.costPrice !== undefined ? p.costPrice : Math.round((Number(currentPriceVal) || 0) * 0.75);
                    const grossProfit = Math.max(0, (Number(currentPriceVal) || 0) - cost);
                    const margin = Number(currentPriceVal) > 0 ? Math.round((grossProfit / Number(currentPriceVal)) * 100) : 0;

                    return (
                      <tr key={pid} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-500">{currentUnitVal}</span>
                                {(p.isWeightBased || ['kg', '1 kg', 'gram', 'g', 'gm', '500g', '250g'].includes((currentUnitVal || '').toLowerCase().trim())) && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5">
                                    ⚖️ Exact Weight
                                  </span>
                                )}
                                {p.barcode && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {p.barcode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="capitalize px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            {p.category}
                          </span>
                        </td>

                        {/* Simultaneous Custom Unit & Price Editor */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-brand-500 p-0.5">
                              <span className="pl-2 text-xs font-bold text-slate-400">₹</span>
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                value={currentPriceVal}
                                onChange={(e) => handleInlineFieldChange(p, 'price', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineUnitAndPrice(p);
                                }}
                                className="w-16 py-1 px-1 text-xs font-black text-slate-900 bg-transparent focus:outline-none font-mono"
                                title="Change product selling price"
                              />
                              <select
                                value={currentUnitVal}
                                onChange={(e) => handleInlineFieldChange(p, 'unit', e.target.value)}
                                className="py-1 px-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border-l border-slate-200 rounded-lg focus:outline-none cursor-pointer"
                                title="Change product unit simultaneously"
                              >
                                {!['Kg', '1 kg', '500g', '250g', 'Gram', 'Piece', 'Litre', 'Pack', 'Box'].includes(
                                  currentUnitVal
                                ) && <option value={currentUnitVal}>{currentUnitVal}</option>}
                                <option value="Kg">/ Kg</option>
                                <option value="500g">/ 500g</option>
                                <option value="250g">/ 250g</option>
                                <option value="Gram">/ Gram</option>
                                <option value="Piece">/ Piece</option>
                                <option value="Litre">/ Litre</option>
                                <option value="Pack">/ Pack</option>
                                <option value="Box">/ Box</option>
                              </select>
                            </div>
                            {hasInlineChanges && (
                              <button
                                type="button"
                                disabled={savingInlineId === pid}
                                onClick={() => handleSaveInlineUnitAndPrice(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs cursor-pointer shrink-0"
                                title="Save custom unit & price"
                              >
                                {savingInlineId === pid ? '...' : 'Save'}
                              </button>
                            )}
                          </div>
                          {p.originalPrice > currentPriceVal && (
                            <span className="line-through text-slate-400 text-[10px] block font-normal mt-0.5">
                              MRP ₹{p.originalPrice}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-emerald-800 text-sm">
                          ₹{cost}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-bold text-emerald-700 text-xs block">
                            +₹{Math.round(grossProfit * 100) / 100}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                            {margin}% margin
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() => handleQuickStockAdjust(pid, stock, -5)}
                              className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs cursor-pointer"
                              title="-5 stock"
                            >
                              -
                            </button>
                            <span
                              className={`w-12 text-center font-mono font-bold text-xs ${
                                isLowStock ? 'text-rose-600' : 'text-slate-800'
                              }`}
                            >
                              {stock}
                            </span>
                            <button
                              onClick={() => handleQuickStockAdjust(pid, stock, 5)}
                              className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs cursor-pointer"
                              title="+5 stock"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {p.inStock && stock > 0 ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              In Stock
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Out of Stock
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(pid, p.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Product Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-4 sm:my-8 animate-fadeIn max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="e.g. Farm Fresh Organic Apples"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c.slug || c.id} value={c.slug || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Unit / Measure *</label>
                    <div className="flex items-center gap-1">
                      {['Kg', 'Piece', 'Gram', 'Litre', 'Pack', 'Box'].map((u) => {
                        const isW = ['kg', 'gram'].includes(u.toLowerCase());
                        return (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setProductForm({ ...productForm, unit: u, isWeightBased: isW })}
                            className={`text-[9px] px-1 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                              productForm.unit?.toLowerCase() === u.toLowerCase()
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {u}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    list="unit-options"
                    value={productForm.unit}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isW = ['kg', 'gram', 'g', 'gm'].includes(val.toLowerCase().trim());
                      setProductForm({ ...productForm, unit: val, isWeightBased: isW ? true : productForm.isWeightBased });
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                    placeholder="e.g. Kg, Piece, Gram, Litre, Pack, Box"
                  />
                  <datalist id="unit-options">
                    <option value="Kg" />
                    <option value="Piece" />
                    <option value="Gram" />
                    <option value="Litre" />
                    <option value="Pack" />
                    <option value="Box" />
                  </datalist>
                </div>
              </div>

              {/* Exact Weight vs Count Pricing Selector */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Measurement &amp; Billing Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm((prev) => ({
                        ...prev,
                        isWeightBased: true,
                        unit: prev.unit?.toLowerCase() === 'piece' ? 'Kg' : prev.unit
                      }))
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      productForm.isWeightBased
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>⚖️ Weight Based (Kg / g)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm((prev) => ({
                        ...prev,
                        isWeightBased: false,
                        unit: prev.unit?.toLowerCase() === 'kg' ? 'Piece' : prev.unit
                      }))
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      !productForm.isWeightBased
                        ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>📦 Count Based (Pieces)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {productForm.isWeightBased
                    ? 'Customers & POS can enter exact arbitrary measured weights (e.g. 3.073 kg, 127 g). Inventory will be decremented by exact fractional kg.'
                    : 'Standard discrete product sold by integer count (e.g. 1 piece, 2 packs).'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold text-emerald-950 focus:outline-none"
                    placeholder="e.g. 38"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barcode / SKU</label>
                  <input
                    type="text"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none"
                    placeholder="e.g. 890103038"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stockCount}
                    onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tag / Badge</label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                    placeholder="e.g. Fresh, Popular"
                  />
                </div>
              </div>

              {/* Home Storefront Display Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.popular}
                    onChange={(e) => setProductForm({ ...productForm, popular: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-brand-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Popular Product</span>
                    <span className="text-[10px] text-slate-500">Show on Storefront Home Popular section</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-brand-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Featured Deal</span>
                    <span className="text-[10px] text-slate-500">Show in Super Deal of the Day banner</span>
                  </div>
                </label>
              </div>

              {/* Image Upload with live preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  <img
                    src={productForm.image}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors">
                      <Camera className="w-3.5 h-3.5 text-brand-600" />
                      <span>{uploadingImage ? 'Uploading image...' : 'Choose Device Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      placeholder="Or paste direct image URL"
                      className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  placeholder="Short item description..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || uploadingImage}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProductId ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;

