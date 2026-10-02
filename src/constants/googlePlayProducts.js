/**
 * Centralized Google Play Product Catalog for Yaro (Client-side)
 *
 * Product IDs must match exact One-time Products created in Google Play Console.
 */

export const GOOGLE_PLAY_PRODUCTS = {
  diamonds_800: {
    productId: 'diamonds_800',
    diamonds: 800,
    priceInr: 59,
    formattedPrice: '₹59',
    isPopular: false,
  },
  diamonds_1350: {
    productId: 'diamonds_1350',
    diamonds: 1350,
    priceInr: 99,
    formattedPrice: '₹99',
    isPopular: true,
  },
  diamonds_2700: {
    productId: 'diamonds_2700',
    diamonds: 2700,
    priceInr: 199,
    formattedPrice: '₹199',
    isPopular: false,
  },
  diamonds_5400: {
    productId: 'diamonds_5400',
    diamonds: 5400,
    priceInr: 399,
    formattedPrice: '₹399',
    isPopular: false,
  },
  diamonds_8100: {
    productId: 'diamonds_8100',
    diamonds: 8100,
    priceInr: 599,
    formattedPrice: '₹599',
    isPopular: false,
  },
  diamonds_13500: {
    productId: 'diamonds_13500',
    diamonds: 13500,
    priceInr: 999,
    formattedPrice: '₹999',
    isPopular: false,
  },
  diamonds_27000: {
    productId: 'diamonds_27000',
    diamonds: 27000,
    priceInr: 1999,
    formattedPrice: '₹1,999',
    isPopular: false,
  },
  diamonds_67500: {
    productId: 'diamonds_67500',
    diamonds: 67500,
    priceInr: 4999,
    formattedPrice: '₹4,999',
    isPopular: false,
  },
  diamonds_135000: {
    productId: 'diamonds_135000',
    diamonds: 135000,
    priceInr: 9999,
    formattedPrice: '₹9,999',
    isPopular: false,
  },
};

export const GOOGLE_PLAY_PRODUCT_IDS = Object.keys(GOOGLE_PLAY_PRODUCTS);
