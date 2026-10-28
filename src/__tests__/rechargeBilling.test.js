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
test('requested nine entitlements including small packages', () => {
  expect(Object.values(GOOGLE_PLAY_PRODUCTS).map(p => [p.priceInr, p.diamonds])).toEqual([[10,7],[50,36],[100,72],[200,144],[500,360],[1000,720],[2000,1440],[5000,3600],[10000,7200]]);
});
test('uses modern Play ID and localized provider price', async () => {
  iap.fetchProducts.mockResolvedValue([{id:'diamonds_72',displayPrice:'?100.00',currency:'INR'}]);
  const catalog = await BillingService.queryProducts();
  expect(catalog.diamonds_72.available).toBe(true);
  expect(catalog.diamonds_72.localizedPrice).toBe('?100.00');
  expect(catalog.diamonds_144.available).toBe(false);
});
test('provider missing price cannot enable purchase', async () => {
  iap.fetchProducts.mockResolvedValue([{id:'diamonds_72'}]);
  expect((await BillingService.queryProducts()).diamonds_72.available).toBe(false);
  await expect(BillingService.buyProduct('diamonds_72', 123)).rejects.toThrow('unavailable');
  expect(iap.requestPurchase).not.toHaveBeenCalled();
});
test('billing failure leaves all packages unavailable', async () => {
  iap.initConnection.mockRejectedValueOnce(new Error('offline'));
  const catalog=await BillingService.queryProducts();
  expect(Object.values(catalog).every(p => !p.available)).toBe(true);
});
test('pending and canceled purchases are never consumed during recovery', async () => {
  iap.getAvailablePurchases.mockResolvedValue([{productId:'diamonds_72',purchaseStateAndroid:2},{productId:'diamonds_72',purchaseStateAndroid:1}]);
  const verify=jest.fn(); await BillingService.restorePurchases(verify);
  expect(verify).not.toHaveBeenCalled(); expect(iap.finishTransaction).not.toHaveBeenCalled();
});
test('failed backend verification preserves purchase for retry', async () => {
  iap.getAvailablePurchases.mockResolvedValue([{productId:'diamonds_72',purchaseStateAndroid:0}]);
  await BillingService.restorePurchases(async () => false);
  expect(iap.finishTransaction).not.toHaveBeenCalled();
});
