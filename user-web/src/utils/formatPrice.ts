/**
 * Formats a numeric price into the Indian locale currency string.
 * Use this everywhere instead of `₹${n.toLocaleString("en-IN")}` inline.
 *
 * @example formatPrice(28500) → "₹28,500"
 */
export const formatPrice = (price: number): string =>
  `₹${price.toLocaleString("en-IN")}`;
