/**
 * SmartMart AI - Universal Supermarket Exact Weight & Volume Utilities
 * Supports decimal scale measurements (e.g. 3.073 kg, 127 g, 347 g, 2.275 kg)
 * Base internal unit: Grams (g) for weight, Millilitres (ml) for liquid volume.
 */

// Normalized check if product is sold by weight
export const isWeightProduct = (productOrUnit) => {
  if (!productOrUnit) return false;
  if (typeof productOrUnit === 'object') {
    if (productOrUnit.isWeightBased === true) return true;
    const name = String(productOrUnit.name || '').toLowerCase();
    if (['tomato', 'banana', 'rice', 'potato', 'onion'].some(w => name.includes(w))) {
      return true;
    }
    return isWeightProduct(productOrUnit.unit);
  }
  const u = String(productOrUnit).trim().toLowerCase();
  return (
    u === 'kg' ||
    u === 'kilogram' ||
    u === 'kilograms' ||
    u === 'gram' ||
    u === 'grams' ||
    u === 'g' ||
    u === 'gm' ||
    u === '1 kg' ||
    u === 'per kg' ||
    u.includes('/kg') ||
    u.includes('per kg') ||
    u.endsWith('kg') ||
    u.endsWith('gm') ||
    u.endsWith('g')
  );
};

// Normalized check if product is sold by volume (litre / ml)
export const isVolumeProduct = (productOrUnit) => {
  if (!productOrUnit) return false;
  if (typeof productOrUnit === 'object') {
    return isVolumeProduct(productOrUnit.unit);
  }
  const u = String(productOrUnit).trim().toLowerCase();
  return (
    u === 'litre' ||
    u === 'liter' ||
    u === 'litres' ||
    u === 'liters' ||
    u === 'l' ||
    u === 'ml' ||
    u.includes('/litre') ||
    u.includes('/l') ||
    u.includes('per litre')
  );
};

// Format weight from canonical internal grams to customer display string
export const formatWeight = (weightInGrams, forceUnit = null) => {
  const g = Number(weightInGrams) || 0;
  if (g <= 0) return '0 g';

  if (forceUnit === 'kg') {
    const kg = Math.round((g / 1000) * 1000) / 1000;
    return `${kg} kg`;
  }
  if (forceUnit === 'g') {
    return `${Math.round(g)} g`;
  }

  // Automatic smart unit selection
  if (g >= 1000) {
    const kg = Math.round((g / 1000) * 1000) / 1000;
    return `${kg} kg`;
  }
  return `${Math.round(g * 1000) / 1000} g`;
};

// Format liquid volume from canonical millilitres
export const formatVolume = (volumeInMl) => {
  const ml = Number(volumeInMl) || 0;
  if (ml <= 0) return '0 ml';
  if (ml >= 1000) {
    const l = Math.round((ml / 1000) * 1000) / 1000;
    return `${l} L`;
  }
  return `${ml} ml`;
};

// Convert kilograms to grams
export const kgToGrams = (kg) => {
  const val = parseFloat(kg);
  if (isNaN(val) || val <= 0) return 0;
  return Math.round(val * 1000);
};

// Convert grams to kilograms
export const gramsToKg = (grams) => {
  const val = parseFloat(grams);
  if (isNaN(val) || val <= 0) return 0;
  return Math.round((val / 1000) * 1000) / 1000;
};

/**
 * Calculates line price for weight-based items:
 * pricePerGram = pricePerKg / 1000
 * lineTotal = (pricePerGram * weightInGrams) * quantity
 * Example: ₹60/kg * 3073 g * 1 = ₹184.38
 * Example: ₹60/kg * 127 g * 1 = ₹7.62
 * Example: ₹80/kg * 347 g * 1 = ₹27.76
 */
export const calculateWeightPrice = (pricePerKg, weightInGrams, quantity = 1) => {
  const price = Number(pricePerKg) || 0;
  const grams = Number(weightInGrams) || 0;
  const qty = Math.max(1, Number(quantity) || 1);

  if (price <= 0 || grams <= 0) return 0;
  const pricePerGram = price / 1000;
  return Math.round(pricePerGram * grams * qty * 100) / 100;
};

/**
 * Universal item line total calculator:
 * Works for both weight-based and piece-based products
 */
export const getItemLineTotal = (item) => {
  if (!item) return 0;
  const qty = Math.max(1, Number(item.qty || item.quantity || 1));
  const effectivePrice = Number(item.sellingPrice ?? item.billPrice ?? item.price ?? 0);

  if (isWeightProduct(item) && Number(item.weightInGrams) > 0) {
    return calculateWeightPrice(effectivePrice, item.weightInGrams, qty);
  }
  return Math.round(effectivePrice * qty * 100) / 100;
};

/**
 * Universal item description formatter:
 * Example weight: "Tomato — 3.073 kg × 1" or "Banana — 127 g × 2"
 * Example piece: "Fresh Eggs × 6"
 */
export const formatItemQuantityAndWeight = (item) => {
  if (!item) return '';
  const qty = item.qty || item.quantity || 1;
  const isWeight = isWeightProduct(item);

  if (isWeight && Number(item.weightInGrams) > 0) {
    const formattedW = formatWeight(item.weightInGrams);
    if (qty > 1) {
      const totalW = formatWeight(item.weightInGrams * qty);
      return `${formattedW} × ${qty} (Total: ${totalW})`;
    }
    return `${formattedW} × ${qty}`;
  }

  return `${qty} ${item.unit || 'piece'}${qty > 1 && !item.unit?.endsWith('s') ? 's' : ''}`;
};

