import {
  initConnection,
  endConnection,
  fetchProducts,
  getProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  flushFailedPurchasesCachedAsPendingAndroid,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { GOOGLE_PLAY_PRODUCTS, GOOGLE_PLAY_PRODUCT_IDS } from '../constants/googlePlayProducts';

/**
 * Production-safe logger helper to mask sensitive purchase tokens in logs
 */
const maskToken = (token) => {
  if (!token || typeof token !== 'string') return 'N/A';
  if (token.length <= 10) return `${token.substring(0, 3)}***`;
  return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
};

class BillingService {
  constructor() {
    this.connected = false;
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
    this.cachedProducts = {};
    this.isProcessing = false;
  }

  /**
   * Initialize billing connection and flush any cached pending purchases
   */
  async init() {
    if (Platform.OS !== 'android') return false;
    if (this.connected) return true;

    try {
      const result = await initConnection();
      this.connected = true;
      console.log('[GooglePlay] Billing initialized successfully:', result);

      if (Platform.OS === 'android') {
        try {
          await flushFailedPurchasesCachedAsPendingAndroid();
          console.log('[GooglePlay] Flushed cached pending purchases');
        } catch (flushErr) {
          console.warn('[GooglePlay] Flush pending purchases notice:', flushErr?.message || flushErr);
        }
      }

      return true;
    } catch (err) {
      console.error('[GooglePlay] Connection init error:', err?.message || err);
      this.connected = false;
      return false;
    }
  }

  /**
   * Fetch product details from Google Play
   */
  async queryProducts() {
    if (Platform.OS !== 'android') return GOOGLE_PLAY_PRODUCTS;

    const isConnected = await this.init();
    if (!isConnected) {
      console.warn('[GooglePlay] Billing not connected. Falling back to default product catalog.');
      return GOOGLE_PLAY_PRODUCTS;
    }

    try {
      console.log('[GooglePlay] Querying products for SKUs:', GOOGLE_PLAY_PRODUCT_IDS);
      let playProducts = [];

      try {
        if (typeof fetchProducts === 'function') {
          playProducts = await fetchProducts({ skus: GOOGLE_PLAY_PRODUCT_IDS, type: 'in-app' });
        } else if (typeof getProducts === 'function') {
          playProducts = await getProducts({ skus: GOOGLE_PLAY_PRODUCT_IDS });
        }
      } catch (e) {
        console.warn('[GooglePlay] Error calling fetchProducts, retrying with getProducts:', e?.message || e);
        if (typeof getProducts === 'function') {
          playProducts = await getProducts({ skus: GOOGLE_PLAY_PRODUCT_IDS });
        }
      }

      console.log(`[GooglePlay] Received ${playProducts ? playProducts.length : 0} products from Play Store`);

      const catalogMap = { ...GOOGLE_PLAY_PRODUCTS };

      if (Array.isArray(playProducts)) {
        playProducts.forEach((item) => {
          const sku = item.productId || item.sku;
          if (sku && catalogMap[sku]) {
            catalogMap[sku] = {
              ...catalogMap[sku],
              localizedPrice: item.localizedPrice || item.price || catalogMap[sku].formattedPrice,
              currency: item.currency || 'INR',
              playDetails: item,
              available: true,
            };
            this.cachedProducts[sku] = item;
          }
        });
      }

      return catalogMap;
    } catch (err) {
      console.error('[GooglePlay] Query products error:', err?.message || err);
      return GOOGLE_PLAY_PRODUCTS;
    }
  }

  /**
   * Launch purchase flow for a product SKU
   */
  async buyProduct(productId, userId = null) {
    if (Platform.OS !== 'android') {
      throw new Error('Google Play Billing is only supported on Android devices.');
    }

    if (this.isProcessing) {
      throw new Error('A purchase is already in progress. Please wait.');
    }

    const isConnected = await this.init();
    if (!isConnected) {
      throw new Error('Google Play Billing service is currently unavailable.');
    }

    this.isProcessing = true;
    console.log(`[GP-BILLING] requestPurchase START for productId: ${productId}, userId: ${userId || 'anonymous'}`);

    try {
      const cachedDetails = this.cachedProducts[productId];
      const offerToken = cachedDetails?.oneTimePurchaseOfferDetails?.[0]?.offerToken || 
                         cachedDetails?.subscriptionOfferDetails?.[0]?.offerToken;

      const googlePayload = {
        skus: [productId],
        ...(userId ? { obfuscatedAccountId: String(userId) } : {}),
        ...(offerToken ? { offerToken } : {}),
      };

      const purchaseParams = {
        request: {
          google: googlePayload,
        },
        type: 'in-app',
      };

      const result = await requestPurchase(purchaseParams);
      console.log(`[GP-BILLING] requestPurchase RESULT:`, result ? 'SUCCESS' : 'PENDING_OR_SUBMITTED');
      return result;
    } catch (err) {
      this.isProcessing = false;
      console.error(`[GP-BILLING] requestPurchase FAILED for SKU ${productId}:`, err?.message || err);
      throw err;
    }
  }

  /**
   * Set up centralized purchase update and error listeners
   */
  setupListeners(onPurchaseSuccess, onPurchasePending, onPurchaseError) {
    this.removeListeners();

    this.purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
      this.isProcessing = false;

      if (!purchase) return;

      const sku = purchase.productId || purchase.skus?.[0] || 'unknown';
      const maskedToken = maskToken(purchase.purchaseToken);
      const state = purchase.purchaseStateAndroid !== undefined ? purchase.purchaseStateAndroid : purchase.transactionStateAndroid;

      console.log(`[GP-BILLING] purchaseUpdatedListener FIRED`);
      console.log(`[GP-BILLING] productId: ${sku}`);
      console.log(`[GP-BILLING] purchaseState: ${state}`);
      console.log(`[GP-BILLING] hasPurchaseToken: ${Boolean(purchase.purchaseToken)}`);
      console.log(`[GP-BILLING] hasReceipt: ${Boolean(purchase.transactionReceipt)}`);
      console.log(`[GP-BILLING] maskedPurchaseToken: ${maskedToken}`);

      // Strict purchase state handling: 0 = PURCHASED, 1 = CANCELED, 2 = PENDING
      if (state === 0) {
        if (onPurchaseSuccess) {
          await onPurchaseSuccess(purchase);
        }
      } else if (state === 2) {
        if (onPurchasePending) {
          onPurchasePending(purchase);
        }
      } else if (state === 1) {
        if (onPurchaseError) {
          onPurchaseError(new Error('Purchase was canceled by the user.'));
        }
      } else if (purchase.transactionReceipt || purchase.purchaseToken) {
        // Fallback for legacy receipts where purchaseStateAndroid may be undefined
        if (onPurchaseSuccess) {
          await onPurchaseSuccess(purchase);
        }
      }
    });

    this.purchaseErrorSubscription = purchaseErrorListener((error) => {
      this.isProcessing = false;
      console.error('[GP-BILLING] purchaseErrorListener FIRED:', error?.message || error);
      if (onPurchaseError) {
        onPurchaseError(error);
      }
    });
  }

  /**
   * Remove active billing listeners to avoid memory leaks or duplicate processing
   */
  removeListeners() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
  }

  /**
   * Check for unfinished/available purchases to restore/re-verify
   * CRITICAL AUDIT RULE: NEVER consume a purchase if verification fails or if state is PENDING.
   */
  async restorePurchases(verifyAndConsumeCallback) {
    if (Platform.OS !== 'android') return [];

    const isConnected = await this.init();
    if (!isConnected) return [];

    try {
      console.log('[GP-BILLING] restorePurchases START: Checking available purchases...');
      const availablePurchases = await getAvailablePurchases();

      if (Array.isArray(availablePurchases) && availablePurchases.length > 0) {
        console.log(`[GP-BILLING] restorePurchases: Found ${availablePurchases.length} unconsumed purchase(s)`);
        for (const purchase of availablePurchases) {
          const sku = purchase.productId || purchase.skus?.[0] || 'unknown';
          const masked = maskToken(purchase.purchaseToken);
          const state = purchase.purchaseStateAndroid !== undefined ? purchase.purchaseStateAndroid : purchase.transactionStateAndroid;

          console.log(`[GP-BILLING] Inspecting purchase SKU: ${sku}, Token: ${masked}, State: ${state}`);

          // 1. MUST NOT credit or consume PENDING purchases (state === 2)
          if (state === 2) {
            console.log(`[GP-BILLING] Skipping unconsumed purchase SKU: ${sku} because purchaseState is PENDING`);
            continue;
          }

          // 2. MUST NOT credit or consume CANCELED purchases (state === 1)
          if (state === 1) {
            console.log(`[GP-BILLING] Skipping unconsumed purchase SKU: ${sku} because purchaseState is CANCELED`);
            continue;
          }

          // 3. For PURCHASED items (state === 0), verify with backend before consuming
          try {
            let isVerifiedAndFulfilled = false;
            if (verifyAndConsumeCallback) {
              isVerifiedAndFulfilled = await verifyAndConsumeCallback(purchase);
            }

            // ONLY consume if backend verified & fulfilled entitlement (or confirmed ALREADY_PROCESSED)
            if (isVerifiedAndFulfilled) {
              console.log(`[GP-BILLING] Fulfillment confirmed for SKU: ${sku}. Consuming transaction on Google Play...`);
              await this.completePurchase(purchase);
            } else {
              console.warn(`[GP-BILLING] Verification/fulfillment not confirmed for SKU: ${sku}. Preserving purchase token for future retry.`);
            }
          } catch (err) {
            console.error(`[GP-BILLING] Restore purchase verification failed for SKU ${sku}, Token ${masked}:`, err?.message || err);
            // DO NOT consume on error! Preserve purchase token for retry.
          }
        }
      } else {
        console.log('[GP-BILLING] restorePurchases: No unconsumed purchases found');
      }
      return availablePurchases || [];
    } catch (err) {
      console.error('[GP-BILLING] restorePurchases FAILED:', err?.message || err);
      return [];
    }
  }

  /**
   * Acknowledge and consume a completed purchase on Google Play
   */
  async completePurchase(purchase) {
    if (!purchase) return false;

    const sku = purchase.productId || purchase.skus?.[0] || 'unknown';
    const masked = maskToken(purchase.purchaseToken);

    try {
      console.log(`[GP-BILLING] COMPLETE PURCHASE START for SKU: ${sku}, Token: ${masked}`);
      await finishTransaction({ purchase, isConsumable: true });
      console.log(`[GP-BILLING] COMPLETE PURCHASE SUCCESS for SKU: ${sku}`);
      return true;
    } catch (err) {
      console.error(`[GP-BILLING] COMPLETE PURCHASE FAILED for SKU ${sku}, Token ${masked}:`, err?.message || err);
      return false;
    }
  }

  /**
   * Close billing connection on app unmount
   */
  async finish() {
    this.removeListeners();
    if (this.connected) {
      try {
        await endConnection();
      } catch (e) {
        console.warn('[GooglePlay] Error closing connection:', e?.message || e);
      }
      this.connected = false;
    }
  }
}

export default new BillingService();
