// Entitlements only; display prices must come from Google Play.
// Rate: ₹100 = 7,200 Coins (₹1 = 72 Coins)
export const GOOGLE_PLAY_PRODUCTS = {
  coins_720: { productId: "coins_720", coins: 720, diamonds: 720, priceInr: 10, isPopular: false, available: false },
  coins_3600: { productId: "coins_3600", coins: 3600, diamonds: 3600, priceInr: 50, isPopular: false, available: false },
  coins_7200: { productId: "coins_7200", coins: 7200, diamonds: 7200, priceInr: 100, isPopular: true, available: false },
  coins_14400: { productId: "coins_14400", coins: 14400, diamonds: 14400, priceInr: 200, isPopular: false, available: false },
  coins_36000: { productId: "coins_36000", coins: 36000, diamonds: 36000, priceInr: 500, isPopular: false, available: false },
  coins_72000: { productId: "coins_72000", coins: 72000, diamonds: 72000, priceInr: 1000, isPopular: false, available: false },
  coins_144000: { productId: "coins_144000", coins: 144000, diamonds: 144000, priceInr: 2000, isPopular: false, available: false },
  coins_360000: { productId: "coins_360000", coins: 360000, diamonds: 360000, priceInr: 5000, isPopular: false, available: false },
  coins_720000: { productId: "coins_720000", coins: 720000, diamonds: 720000, priceInr: 10000, isPopular: false, available: false },
  coins_1440000: { productId: "coins_1440000", coins: 1440000, diamonds: 1440000, priceInr: 20000, isPopular: false, available: false },
};

export const SKU_LEGACY_ALIASES = {
  diamonds_7: "coins_720",
  diamonds_36: "coins_3600",
  diamonds_72: "coins_7200",
  diamonds_144: "coins_14400",
  diamonds_360: "coins_36000",
  diamonds_720: "coins_72000",
  diamonds_1440: "coins_144000",
  diamonds_3600: "coins_360000",
  diamonds_7200: "coins_720000",
  diamonds_14400: "coins_1440000",
};

export const GOOGLE_PLAY_PRODUCT_IDS = [
  ...Object.keys(GOOGLE_PLAY_PRODUCTS),
  ...Object.keys(SKU_LEGACY_ALIASES),
];
