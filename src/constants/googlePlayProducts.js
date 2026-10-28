// Entitlements only; display prices must come from Google Play.
export const GOOGLE_PLAY_PRODUCTS = {
  diamonds_7: { productId: "diamonds_7", diamonds: 7, priceInr: 10, available: false },
  diamonds_36: { productId: "diamonds_36", diamonds: 36, priceInr: 50, available: false },
  "diamonds_72": {
    "productId": "diamonds_72",
    "diamonds": 72,
    "priceInr": 100,
    "isPopular": false,
    "available": false
  },
  "diamonds_144": {
    "productId": "diamonds_144",
    "diamonds": 144,
    "priceInr": 200,
    "isPopular": false,
    "available": false
  },
  "diamonds_360": {
    "productId": "diamonds_360",
    "diamonds": 360,
    "priceInr": 500,
    "isPopular": true,
    "available": false
  },
  "diamonds_720": {
    "productId": "diamonds_720",
    "diamonds": 720,
    "priceInr": 1000,
    "isPopular": false,
    "available": false
  },
  "diamonds_1440": {
    "productId": "diamonds_1440",
    "diamonds": 1440,
    "priceInr": 2000,
    "isPopular": false,
    "available": false
  },
  "diamonds_3600": {
    "productId": "diamonds_3600",
    "diamonds": 3600,
    "priceInr": 5000,
    "isPopular": false,
    "available": false
  },
  "diamonds_7200": {
    "productId": "diamonds_7200",
    "diamonds": 7200,
    "priceInr": 10000,
    "isPopular": false,
    "available": false
  }
};
export const GOOGLE_PLAY_PRODUCT_IDS = Object.keys(GOOGLE_PLAY_PRODUCTS);
