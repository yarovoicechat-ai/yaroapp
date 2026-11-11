jest.mock('react-native-iap', () => ({
  initConnection: jest.fn(async () => true), endConnection: jest.fn(), fetchProducts: jest.fn(),
  requestPurchase: jest.fn(), purchaseUpdatedListener: jest.fn(), purchaseErrorListener: jest.fn(),
  finishTransaction: jest.fn(), getAvailablePurchases: jest.fn(async () => []),
  flushFailedPurchasesCachedAsPendingAndroid: jest.fn(),
}));
import { Platform } from 'react-native';
import * as iap from 'react-native-iap';
import BillingService, { parseBillingError, GoogleBillingResponseCode } from '../services/BillingService';
import { GOOGLE_PLAY_PRODUCTS, GOOGLE_PLAY_PRODUCT_IDS } from '../constants/googlePlayProducts';

beforeEach(() => {
  Platform.OS = 'android';
  BillingService.connected = false;
  BillingService.isProcessing = false;
  BillingService.cachedProducts = {};
  jest.clearAllMocks();
});

test('requested ten coin recharge entitlements', () => {
  expect(Object.values(GOOGLE_PLAY_PRODUCTS).map(p => [p.priceInr, p.coins])).toEqual([
    [10, 720],
    [50, 3600],
    [100, 7200],
    [200, 14400],
    [500, 36000],
    [1000, 72000],
    [2000, 144000],
    [5000, 360000],
    [10000, 720000],
    [20000, 1440000],
  ]);
});

test('official product list contains exactly the ten Google Play Console IDs', () => {
  expect(GOOGLE_PLAY_PRODUCT_IDS).toEqual([
    'coins_720',
    'coins_3600',
    'coins_7200',
    'coins_14400',
    'coins_36000',
    'coins_72000',
    'coins_144000',
    'coins_360000',
    'coins_720000',
    'coins_1440000',
  ]);
  expect(GOOGLE_PLAY_PRODUCT_IDS.length).toBe(10);
});

test('720,000 Coins pack is strictly coins_720000 and never coins_720', () => {
  expect(GOOGLE_PLAY_PRODUCTS.coins_720.coins).toBe(720);
  expect(GOOGLE_PLAY_PRODUCTS.coins_720.priceInr).toBe(10);
  expect(GOOGLE_PLAY_PRODUCTS.coins_720000.coins).toBe(720000);
  expect(GOOGLE_PLAY_PRODUCTS.coins_720000.priceInr).toBe(10000);
  expect(GOOGLE_PLAY_PRODUCTS.coins_720.productId).not.toBe(GOOGLE_PLAY_PRODUCTS.coins_720000.productId);
});

test('coins_36000 with 0 active purchase options remains unavailable', async () => {
  // Google Play returns products for other SKUs but omits or returns coins_36000 without offer details
  iap.fetchProducts.mockResolvedValue([
    { id: 'coins_7200', displayPrice: '₹100.00', currency: 'INR' },
  ]);
  const catalog = await BillingService.queryProducts();
  expect(catalog.coins_36000.available).toBe(false);
  expect(catalog.coins_36000.localizedPrice).toBeUndefined();

  // Attempting to buy coins_36000 must throw item-unavailable error
  await expect(BillingService.buyProduct('coins_36000', 123)).rejects.toThrow('unavailable');
  expect(iap.requestPurchase).not.toHaveBeenCalled();
});

test('newly activated coins_36000 with Google Play purchase option is available and purchasable', async () => {
  iap.fetchProducts.mockResolvedValue([
    {
      id: 'coins_36000',
      displayPrice: '₹500.00',
      currency: 'INR',
      oneTimePurchaseOfferDetailsAndroid: [{ offerToken: 'offer_36000' }],
    },
  ]);
  const catalog = await BillingService.queryProducts();
  expect(catalog.coins_36000.available).toBe(true);
  expect(catalog.coins_36000.localizedPrice).toBe('₹500.00');

  await BillingService.buyProduct('coins_36000', 'user_777');
  expect(iap.requestPurchase).toHaveBeenCalledWith({
    type: 'in-app',
    request: {
      google: {
        skus: ['coins_36000'],
        obfuscatedAccountId: 'user_777',
        offerToken: 'offer_36000',
      },
    },
  });
});

test('uses modern Play ID and localized provider price', async () => {
  iap.fetchProducts.mockResolvedValue([{ id: 'coins_7200', displayPrice: '₹100.00', currency: 'INR' }]);
  const catalog = await BillingService.queryProducts();
  expect(catalog.coins_7200.available).toBe(true);
  expect(catalog.coins_7200.localizedPrice).toBe('₹100.00');
  expect(catalog.coins_14400.available).toBe(false);
});

test('provider missing price cannot enable purchase', async () => {
  iap.fetchProducts.mockResolvedValue([{ id: 'coins_7200' }]);
  expect((await BillingService.queryProducts()).coins_7200.available).toBe(false);
  await expect(BillingService.buyProduct('coins_7200', 123)).rejects.toThrow('unavailable');
  expect(iap.requestPurchase).not.toHaveBeenCalled();
});

test('billing failure leaves all packages unavailable', async () => {
  iap.initConnection.mockRejectedValueOnce(new Error('offline'));
  const catalog = await BillingService.queryProducts();
  expect(Object.values(catalog).every(p => !p.available)).toBe(true);
});

test('pending and canceled purchases are never consumed during recovery', async () => {
  iap.getAvailablePurchases.mockResolvedValue([
    { productId: 'coins_7200', purchaseStateAndroid: 2 },
    { productId: 'coins_7200', purchaseStateAndroid: 1 },
  ]);
  const verify = jest.fn();
  await BillingService.restorePurchases(verify);
  expect(verify).not.toHaveBeenCalled();
  expect(iap.finishTransaction).not.toHaveBeenCalled();
});

test('failed backend verification preserves purchase for retry', async () => {
  iap.getAvailablePurchases.mockResolvedValue([{ productId: 'coins_7200', purchaseStateAndroid: 0 }]);
  await BillingService.restorePurchases(async () => false);
  expect(iap.finishTransaction).not.toHaveBeenCalled();
});

test('modern pending purchases with tokens never reach verification or consumption', async () => {
  iap.getAvailablePurchases.mockResolvedValue([{ productId: 'coins_7200', purchaseState: 'pending', purchaseToken: 'pending-token' }]);
  const verify = jest.fn();
  await BillingService.restorePurchases(verify);
  expect(verify).not.toHaveBeenCalled();
  expect(iap.finishTransaction).not.toHaveBeenCalled();
});

test('modern purchased items are verified before consumption', async () => {
  iap.getAvailablePurchases.mockResolvedValue([{ productId: 'coins_7200', purchaseState: 'purchased', purchaseToken: 'paid-token' }]);
  const verify = jest.fn(async () => true);
  await BillingService.restorePurchases(verify);
  expect(verify).toHaveBeenCalledTimes(1);
  expect(iap.finishTransaction).toHaveBeenCalledTimes(1);
});

test('available one-time product uses the provider SKU and offer token', async () => {
  iap.fetchProducts.mockResolvedValue([{ id: 'coins_7200', displayPrice: '₹100', oneTimePurchaseOfferDetailsAndroid: [{ offerToken: 'offer' }] }]);
  await BillingService.buyProduct('coins_7200', 123);
  expect(iap.requestPurchase).toHaveBeenCalledWith({
    type: 'in-app',
    request: {
      google: {
        skus: ['coins_7200'],
        obfuscatedAccountId: '123',
        offerToken: 'offer',
      },
    },
  });
});

describe('Google Play Error Code Parsing and Normalization', () => {
  test('handles USER_CANCELED (code 1)', () => {
    const parsed = parseBillingError({ responseCode: GoogleBillingResponseCode.USER_CANCELED, code: 'E_USER_CANCELLED' });
    expect(parsed.isUserCancel).toBe(true);
    expect(parsed.responseCode).toBe(1);
  });

  test('handles ITEM_UNAVAILABLE (code 4)', () => {
    const parsed = parseBillingError({ responseCode: GoogleBillingResponseCode.ITEM_UNAVAILABLE, message: 'Item unavailable' }, 'coins_36000');
    expect(parsed.isItemUnavailable).toBe(true);
    expect(parsed.userMessage).toContain('coins_36000');
    expect(parsed.userMessage).toContain('unavailable');
  });

  test('handles BILLING_UNAVAILABLE (code 3)', () => {
    const parsed = parseBillingError({ responseCode: GoogleBillingResponseCode.BILLING_UNAVAILABLE, code: 'E_BILLING_UNAVAILABLE' });
    expect(parsed.isBillingUnavailable).toBe(true);
    expect(parsed.userMessage).toContain('unavailable on this device');
  });

  test('handles SERVICE_DISCONNECTED (code -1)', () => {
    const parsed = parseBillingError({ responseCode: GoogleBillingResponseCode.SERVICE_DISCONNECTED, code: 'E_SERVICE_DISCONNECTED' });
    expect(parsed.isServiceDisconnected).toBe(true);
    expect(parsed.userMessage).toContain('disconnected');
  });

  test('handles SERVICE_UNAVAILABLE (code 2)', () => {
    const parsed = parseBillingError({ responseCode: GoogleBillingResponseCode.SERVICE_UNAVAILABLE, code: 'E_SERVICE_UNAVAILABLE' });
    expect(parsed.isServiceUnavailable).toBe(true);
    expect(parsed.userMessage).toContain('temporarily unavailable');
  });

  test('handles DEVELOPER_ERROR (code 5)', () => {
    const parsed = parseBillingError({ responseCode: GoogleBillingResponseCode.DEVELOPER_ERROR, code: 'E_DEVELOPER_ERROR' }, 'coins_720');
    expect(parsed.isDeveloperError).toBe(true);
    expect(parsed.userMessage).toContain('configuration error');
  });

  test('handles NETWORK_ERROR (code 12)', () => {
    const parsed = parseBillingError({ responseCode: GoogleBillingResponseCode.NETWORK_ERROR, code: 'E_NETWORK_ERROR' });
    expect(parsed.isNetworkError).toBe(true);
    expect(parsed.userMessage).toContain('Network connection error');
  });

  test('handles ITEM_ALREADY_OWNED (code 7)', () => {
    const parsed = parseBillingError({ responseCode: GoogleBillingResponseCode.ITEM_ALREADY_OWNED, code: 'E_ALREADY_OWNED' });
    expect(parsed.isAlreadyOwned).toBe(true);
    expect(parsed.userMessage).toContain('unconsumed purchase');
  });
});
