/**
 * Centralized Google Play Product Catalog for Yaro (Client-side)
 *
 * Product IDs must match exact One-time Products created in Google Play Console.
 */

export const GOOGLE_PLAY_PRODUCTS = {
  diamonds_7: {
    productId: 'diamonds_7',
    diamonds: 7,
    priceInr: 10,
    formattedPrice: '₹10',
    isPopular: false,
  },
  diamonds_35: {
    productId: 'diamonds_35',
    diamonds: 35,
    priceInr: 49,
    formattedPrice: '₹49',
    isPopular: false,
  },
  diamonds_71: {
    productId: 'diamonds_71',
    diamonds: 71,
    priceInr: 99,
    formattedPrice: '₹99',
    isPopular: true,
  },
  diamonds_143: {
    productId: 'diamonds_143',
    diamonds: 143,
    priceInr: 199,
    formattedPrice: '₹199',
    isPopular: false,
  },
  diamonds_215: {
    productId: 'diamonds_215',
    diamonds: 215,
    priceInr: 299,
    formattedPrice: '₹299',
    isPopular: false,
  },
  diamonds_359: {
    productId: 'diamonds_359',
    diamonds: 359,
    priceInr: 499,
    formattedPrice: '₹499',
    isPopular: false,
  },
  diamonds_719: {
    productId: 'diamonds_719',
    diamonds: 719,
    priceInr: 999,
    formattedPrice: '₹999',
    isPopular: false,
  },
  diamonds_1439: {
    productId: 'diamonds_1439',
    diamonds: 1439,
    priceInr: 1999,
    formattedPrice: '₹1,999',
    isPopular: false,
  },
  diamonds_3599: {
    productId: 'diamonds_3599',
    diamonds: 3599,
    priceInr: 4999,
    formattedPrice: '₹4,999',
    isPopular: false,
  },
};

export const GOOGLE_PLAY_PRODUCT_IDS = Object.keys(GOOGLE_PLAY_PRODUCTS);
