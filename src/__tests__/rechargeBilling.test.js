jest.mock('react-native-iap', () => ({
  initConnection: jest.fn(async () => true), endConnection: jest.fn(), fetchProducts: jest.fn(),
  requestPurchase: jest.fn(), purchaseUpdatedListener: jest.fn(), purchaseErrorListener: jest.fn(),
  finishTransaction: jest.fn(), getAvailablePurchases: jest.fn(async () => []),
  flushFailedPurchasesCachedAsPendingAndroid: jest.fn(),
}));
import { Platform } from 'react-native';
import * as iap from 'react-native-iap';
import BillingService from '../services/BillingService';
import { GOOGLE_PLAY_PRODUCTS } from '../constants/googlePlayProducts';
beforeEach(() => { Platform.OS = 'android'; BillingService.connected = false; BillingService.isProcessing = false; BillingService.cachedProducts = {}; jest.clearAllMocks(); });
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
test('uses modern Play ID and localized provider price', async () => {
  iap.fetchProducts.mockResolvedValue([{id:'coins_7200',displayPrice:'₹100.00',currency:'INR'}]);
  const catalog = await BillingService.queryProducts();
  expect(catalog.coins_7200.available).toBe(true);
  expect(catalog.coins_7200.localizedPrice).toBe('₹100.00');
  expect(catalog.coins_14400.available).toBe(false);
});
test('provider missing price cannot enable purchase', async () => {
  iap.fetchProducts.mockResolvedValue([{id:'coins_7200'}]);
  expect((await BillingService.queryProducts()).coins_7200.available).toBe(false);
  await expect(BillingService.buyProduct('coins_7200', 123)).rejects.toThrow('unavailable');
  expect(iap.requestPurchase).not.toHaveBeenCalled();
});
test('billing failure leaves all packages unavailable', async () => {
  iap.initConnection.mockRejectedValueOnce(new Error('offline'));
  const catalog=await BillingService.queryProducts();
  expect(Object.values(catalog).every(p => !p.available)).toBe(true);
});
test('pending and canceled purchases are never consumed during recovery', async () => {
  iap.getAvailablePurchases.mockResolvedValue([{productId:'coins_7200',purchaseStateAndroid:2},{productId:'coins_7200',purchaseStateAndroid:1}]);
  const verify=jest.fn(); await BillingService.restorePurchases(verify);
  expect(verify).not.toHaveBeenCalled(); expect(iap.finishTransaction).not.toHaveBeenCalled();
});
test('failed backend verification preserves purchase for retry', async () => {
  iap.getAvailablePurchases.mockResolvedValue([{productId:'coins_7200',purchaseStateAndroid:0}]);
  await BillingService.restorePurchases(async () => false);
  expect(iap.finishTransaction).not.toHaveBeenCalled();
});
