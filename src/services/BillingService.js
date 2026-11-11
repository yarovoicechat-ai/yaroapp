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
import { GOOGLE_PLAY_PRODUCTS, GOOGLE_PLAY_PRODUCT_IDS, SKU_LEGACY_ALIASES } from '../constants/googlePlayProducts';

export const getPurchaseStatus = purchase => {
  if (purchase?.purchaseState) return purchase.purchaseState;
  const legacy = purchase?.purchaseStateAndroid ?? purchase?.transactionStateAndroid;
  return legacy === 0 ? 'purchased' : legacy === 2 ? 'pending' : legacy === 1 ? 'canceled' : 'unknown';
};

/**
 * Production-safe logger helper to mask sensitive purchase tokens in logs
 */
const maskToken = (token) => {
  if (!token || typeof token !== 'string') return 'N/A';
  if (token.length <= 10) return `${token.substring(0, 3)}***`;
  return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
};

/**
 * Standard Google Play Billing Response Codes (AIDL / Play Billing Library)
 */
export const GoogleBillingResponseCode = {
  SERVICE_TIMEOUT: -3,
  FEATURE_NOT_SUPPORTED: -2,
  SERVICE_DISCONNECTED: -1,
  OK: 0,
  USER_CANCELED: 1,
  SERVICE_UNAVAILABLE: 2,
  BILLING_UNAVAILABLE: 3,
  ITEM_UNAVAILABLE: 4,
  DEVELOPER_ERROR: 5,
  ERROR: 6,
  ITEM_ALREADY_OWNED: 7,
  ITEM_NOT_OWNED: 8,
  NETWORK_ERROR: 12,
};

/**
 * Parse and normalize any Google Play Billing error into a structured object
 */
export const parseBillingError = (error, productId = null) => {
  let code = error?.code || '';
  let debugMessage = error?.debugMessage || error?.message || '';
  let responseCode = error?.responseCode !== undefined ? error.responseCode : null;

  // Attempt to parse stringified JSON errors (common in native module bridges)
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      if (parsed) {
        code = parsed.code || code;
        debugMessage = parsed.message || parsed.debugMessage || debugMessage;
        if (parsed.responseCode !== undefined) responseCode = parsed.responseCode;
      }
    } catch (_) {}
  } else if (typeof debugMessage === 'string' && debugMessage.startsWith('{')) {
    try {
      const parsed = JSON.parse(debugMessage);
      if (parsed) {
        code = parsed.code || code;
        debugMessage = parsed.message || parsed.debugMessage || debugMessage;
        if (parsed.responseCode !== undefined) responseCode = parsed.responseCode;
      }
    } catch (_) {}
  }

  const codeUpper = String(code).toUpperCase();
  const msgLower = String(debugMessage).toLowerCase();

  // Detect User Canceled
  const isUserCancel =
    responseCode === GoogleBillingResponseCode.USER_CANCELED ||
    codeUpper === 'E_USER_CANCELLED' ||
    codeUpper === 'USER-CANCELLED' ||
    codeUpper === 'USER_CANCELED' ||
    msgLower.includes('cancel');

  // Detect Item Unavailable / Missing Active Option (e.g. coins_36000)
  const isItemUnavailable =
    responseCode === GoogleBillingResponseCode.ITEM_UNAVAILABLE ||
    codeUpper === 'E_ITEM_UNAVAILABLE' ||
    codeUpper === 'ITEM-UNAVAILABLE' ||
    codeUpper === 'ITEM_UNAVAILABLE' ||
    msgLower.includes('item_unavailable') ||
    msgLower.includes('item unavailable') ||
    msgLower.includes('failed to query product') ||
    msgLower.includes('unavailable on google play') ||
    msgLower.includes('no active purchase option');

  // Detect Billing Unavailable
  const isBillingUnavailable =
    responseCode === GoogleBillingResponseCode.BILLING_UNAVAILABLE ||
    codeUpper === 'E_BILLING_UNAVAILABLE' ||
    codeUpper === 'BILLING-UNAVAILABLE' ||
    codeUpper === 'BILLING_UNAVAILABLE' ||
    msgLower.includes('billing_unavailable') ||
    msgLower.includes('billing unavailable');

  // Detect Service Disconnected
  const isServiceDisconnected =
    responseCode === GoogleBillingResponseCode.SERVICE_DISCONNECTED ||
    codeUpper === 'E_SERVICE_DISCONNECTED' ||
    codeUpper === 'SERVICE-DISCONNECTED' ||
    codeUpper === 'SERVICE_DISCONNECTED' ||
    msgLower.includes('service_disconnected') ||
    msgLower.includes('service disconnected');

  // Detect Service Unavailable
  const isServiceUnavailable =
    responseCode === GoogleBillingResponseCode.SERVICE_UNAVAILABLE ||
    codeUpper === 'E_SERVICE_UNAVAILABLE' ||
    codeUpper === 'SERVICE-UNAVAILABLE' ||
    codeUpper === 'SERVICE_UNAVAILABLE' ||
    msgLower.includes('service_unavailable') ||
    msgLower.includes('service unavailable');

  // Detect Developer / App Signing Error
  const isDeveloperError =
    responseCode === GoogleBillingResponseCode.DEVELOPER_ERROR ||
    codeUpper === 'E_DEVELOPER_ERROR' ||
    codeUpper === 'DEVELOPER-ERROR' ||
    codeUpper === 'DEVELOPER_ERROR' ||
    msgLower.includes('developer_error') ||
    msgLower.includes('signed correctly') ||
    msgLower.includes('not configured for billing') ||
    msgLower.includes('application is not signed');

  // Detect Network Error
  const isNetworkError =
    responseCode === GoogleBillingResponseCode.NETWORK_ERROR ||
    codeUpper === 'E_NETWORK_ERROR' ||
    codeUpper === 'NETWORK-ERROR' ||
    codeUpper === 'NETWORK_ERROR' ||
    msgLower.includes('network') ||
    msgLower.includes('offline') ||
    msgLower.includes('timed out') ||
    msgLower.includes('connection');

  // Detect Item Already Owned (Unconsumed previous purchase)
  const isAlreadyOwned =
    responseCode === GoogleBillingResponseCode.ITEM_ALREADY_OWNED ||
    codeUpper === 'E_ALREADY_OWNED' ||
    codeUpper === 'ALREADY-OWNED' ||
    codeUpper === 'ALREADY_OWNED' ||
    msgLower.includes('already own') ||
    msgLower.includes('already_owned');

  // Friendly human-readable explanation based on exact Google Play response code
  let userMessage = 'Payment could not be completed. Please try again.';
  if (isUserCancel) {
    userMessage = 'Purchase was canceled.';
  } else if (isAlreadyOwned) {
    userMessage = 'You already have an unconsumed purchase for this pack. Syncing and crediting your Coins now...';
  } else if (isItemUnavailable) {
    const targetSku = productId || 'this pack';
    userMessage = `Product ${targetSku} is currently unavailable for purchase on Google Play (no active purchase option configured in Play Console). Please choose another pack.`;
  } else if (isBillingUnavailable) {
    userMessage = 'Google Play Billing is unavailable on this device or account. Please check your Google Play account settings.';
  } else if (isServiceDisconnected) {
    userMessage = 'Google Play service was disconnected. Please check your connection and try again.';
  } else if (isServiceUnavailable) {
    userMessage = 'Google Play service is temporarily unavailable. Please try again in a few moments.';
  } else if (isDeveloperError) {
    userMessage = `Google Play configuration error for ${productId || 'this product'}. Please verify you installed the official app from Google Play.`;
  } else if (isNetworkError) {
    userMessage = 'Network connection error while contacting Google Play. Please check your internet connection and try again.';
  } else if (debugMessage) {
    userMessage = debugMessage;
  }

  console.log(`[GP-BILLING] Parsed error: code=${code}, responseCode=${responseCode}, productId=${productId || 'N/A'}, isUserCancel=${isUserCancel}, isUnavailable=${isItemUnavailable}, isDeveloper=${isDeveloperError}, isNetwork=${isNetworkError}, isAlreadyOwned=${isAlreadyOwned}`);

  return {
    code,
    responseCode,
    debugMessage,
    userMessage,
    productId,
    isUserCancel,
    isItemUnavailable,
    isBillingUnavailable,
    isServiceDisconnected,
    isServiceUnavailable,
    isDeveloperError,
    isNetworkError,
    isAlreadyOwned,
  };
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
      if (result === false) return false;
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
   * Fetch product details from Google Play for the 10 official Product IDs
   */
  async queryProducts() {
    if (Platform.OS !== 'android') return GOOGLE_PLAY_PRODUCTS;
    this.cachedProducts = {};

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

      this.cachedProducts = {};
      const catalogMap = { ...GOOGLE_PLAY_PRODUCTS };

      if (Array.isArray(playProducts)) {
        playProducts.forEach((item) => {
          const sku = item.id || item.productId || item.sku;
          const targetKey = SKU_LEGACY_ALIASES?.[sku] || sku;

          if (targetKey && catalogMap[targetKey]) {
            const localizedPrice = item.displayPrice || item.localizedPrice;
            const hasValidOffer = Boolean(
              localizedPrice &&
              (item.oneTimePurchaseOfferDetailsAndroid?.length > 0 ||
               item.oneTimePurchaseOfferDetails?.length > 0 ||
               localizedPrice)
            );

            catalogMap[targetKey] = {
              ...catalogMap[targetKey],
              skuToBuy: sku,
              localizedPrice: localizedPrice || undefined,
              currency: item.currency || 'INR',
              playDetails: item,
              available: Boolean(hasValidOffer),
            };

            this.cachedProducts[targetKey] = {
              ...item,
              available: Boolean(hasValidOffer),
              displayPrice: localizedPrice,
              localizedPrice: localizedPrice,
            };
            this.cachedProducts[sku] = this.cachedProducts[targetKey];

            console.log(`[GooglePlay] Product ${sku} mapped: available=${Boolean(hasValidOffer)}, price=${localizedPrice || 'NONE'}`);
          }
        });
      }

      // Check coins_36000 and any other products without active offers
      GOOGLE_PLAY_PRODUCT_IDS.forEach((id) => {
        if (!catalogMap[id]?.available) {
          console.log(`[GooglePlay] Product ${id} has no active purchase options or price from Google Play (available=false)`);
        }
      });

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
      const err = new Error('Google Play Billing service is currently unavailable or disconnected.');
      err.code = 'E_SERVICE_DISCONNECTED';
      err.responseCode = GoogleBillingResponseCode.SERVICE_DISCONNECTED;
      throw err;
    }

    this.isProcessing = true;
    console.log(`[GP-BILLING] requestPurchase START for productId: ${productId}, userId: ${userId || 'anonymous'}`);

    try {
      let cachedDetails = this.cachedProducts[productId];
      if (!cachedDetails || !(cachedDetails.displayPrice || cachedDetails.localizedPrice)) {
        try {
          await this.queryProducts();
          cachedDetails = this.cachedProducts[productId];
        } catch (_) {}
      }

      const hasPrice = Boolean(cachedDetails && (cachedDetails.displayPrice || cachedDetails.localizedPrice));
      if (!cachedDetails || !hasPrice) {
        console.error(`[GP-BILLING] Product ${productId} is unavailable: No ProductDetails returned by Google Play.`);
        const error = new Error(`Product ${productId} is unavailable on Google Play for this account (no active purchase option configured in Play Console).`);
        error.code = 'item-unavailable';
        error.responseCode = GoogleBillingResponseCode.ITEM_UNAVAILABLE;
        error.productId = productId;
        throw error;
      }

      // Verify that the product returned by Google Play matches the requested pack
      const skuToSend = cachedDetails?.id || cachedDetails?.productId || productId;
      if (skuToSend !== productId && SKU_LEGACY_ALIASES?.[skuToSend] !== productId) {
        console.error(`[GP-BILLING] Product SKU mismatch! Requested: ${productId}, Play Details SKU: ${skuToSend}`);
        const error = new Error(`Product mapping mismatch for ${productId}. Purchase aborted.`);
        error.code = 'developer-error';
        error.responseCode = GoogleBillingResponseCode.DEVELOPER_ERROR;
        error.productId = productId;
        throw error;
      }

      const offerToken = cachedDetails?.oneTimePurchaseOfferDetailsAndroid?.[0]?.offerToken || 
                         cachedDetails?.oneTimePurchaseOfferDetails?.[0]?.offerToken;

      const googlePayload = {
        skus: [skuToSend],
        ...(userId ? { obfuscatedAccountId: String(userId) } : {}),
        ...(offerToken ? { offerToken } : {}),
      };

      const purchaseParams = {
        request: {
          google: googlePayload,
        },
        type: 'in-app',
      };

      console.log(`[GP-BILLING] Invoking requestPurchase with params:`, JSON.stringify(purchaseParams));
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
      const state = getPurchaseStatus(purchase);

      console.log(`[GP-BILLING] purchaseUpdatedListener FIRED`);
      console.log(`[GP-BILLING] productId: ${sku}`);
      console.log(`[GP-BILLING] purchaseState: ${state}`);
      console.log(`[GP-BILLING] hasPurchaseToken: ${Boolean(purchase.purchaseToken)}`);
      console.log(`[GP-BILLING] hasReceipt: ${Boolean(purchase.transactionReceipt)}`);
      console.log(`[GP-BILLING] maskedPurchaseToken: ${maskedToken}`);

      if (state === 'purchased') {
        if (onPurchaseSuccess) {
          await onPurchaseSuccess(purchase);
        }
      } else if (state === 'pending') {
        if (onPurchasePending) {
          onPurchasePending(purchase);
        }
      } else if (state === 'canceled') {
        if (onPurchaseError) {
          const cancelErr = new Error('Purchase was canceled by the user.');
          cancelErr.code = 'E_USER_CANCELLED';
          cancelErr.responseCode = GoogleBillingResponseCode.USER_CANCELED;
          cancelErr.productId = sku;
          onPurchaseError(cancelErr);
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
          const state = getPurchaseStatus(purchase);

          console.log(`[GP-BILLING] Inspecting purchase SKU: ${sku}, Token: ${masked}, State: ${state}`);

          // 1. MUST NOT credit or consume PENDING purchases (state === 2)
          if (state === 'pending') {
            console.log(`[GP-BILLING] Skipping unconsumed purchase SKU: ${sku} because purchaseState is PENDING`);
            continue;
          }

          // 2. MUST NOT credit or consume CANCELED purchases (state === 1)
          if (state !== 'purchased') {
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
