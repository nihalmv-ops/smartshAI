/**
 * SmartMart AI - Backend Exact Weight & Volume Calculation Engine
 * Source of truth for all pricing, stock deductions, and decimal safety.
 */

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

/**
 * Calculates line price for weight-based products:
 * pricePerGram = pricePerKg / 1000
 * itemTotal = (pricePerGram * weightInGrams) * quantity
 * Example: Tomato ₹60/kg, 3073 g => ₹184.38
 * Example: Banana ₹60/kg, 127 g => ₹7.62
 * Example: Rice ₹80/kg, 347 g => ₹27.76
 * Example: Tomato ₹50/kg custom, 3073 g => ₹153.65
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
 * Converts internal grams to kilograms rounded to 3 decimal places
 * e.g. 3073 g => 3.073 kg
 * e.g. 127 g => 0.127 kg
 */
export const gramsToKg = (weightInGrams) => {
  const g = Number(weightInGrams) || 0;
  return Math.round((g / 1000) * 1000) / 1000;
};

/**
 * Converts kilograms to grams
 * e.g. 3.073 kg => 3073 g
 */
export const kgToGrams = (kg) => {
  const val = parseFloat(kg);
  if (isNaN(val) || val <= 0) return 0;
  return Math.round(val * 1000);
};

/**
 * Formats weight string for display / receipt
 * e.g. 3073 g => "3.073 kg"
 * e.g. 127 g => "127 g"
 */
export const formatWeight = (weightInGrams) => {
  const g = Number(weightInGrams) || 0;
  if (g <= 0) return '0 g';
  if (g >= 1000) {
    const kg = Math.round((g / 1000) * 1000) / 1000;
    return `${kg} kg`;
  }
  return `${Math.round(g * 1000) / 1000} g`;
};

export const formatWeightDisplay = formatWeight;

