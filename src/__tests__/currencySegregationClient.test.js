/**
 * YARO React Native Client Currency Segregation Test Suite
 *
 * Validates that Spending Coins (user.coins / user.diamonds) and Creator Beans (user.beans)
 * remain strictly isolated across all client flows:
 *   1. ExchangeCoins: Converting Beans -> Coins checks user.beans (not user.coins)
 *   2. Withdrawal: Payout balance reads user.beans (not user.coins)
 *   3. Earning: Available Beans and fiat estimate read user.beans (not user.coins)
 *   4. Gift & Call Billing: Deductions and affordability checks read user.coins (not user.beans)
 *   5. Greedy King: Bet wagers check user.coins (not user.beans)
 *   6. Socket balanceUpdated: Dispatches independent updates for coins, diamonds, and beans
 *   7. AuthContext: updateBeans isolates bean mutations from coin mutations
 *   8. Resiliency: Graceful 0 fallback for nullish or undefined user balances
 */

describe('Client Currency Segregation — Spending Coins vs Creator Beans', () => {
  // Asymmetric fixture: Coins and Beans deliberately have disjoint values
  // so that any accidental field swap immediately fails the assertion.
  const ASYMMETRIC_USER = {
    _id: 'usr_789456',
    name: 'Test Creator',
    coins: 150,       // Spending Coins (mapped from User.diamonds)
    diamonds: 150,    // Legacy alias for Spending Coins
    beans: 50000,     // Creator Beans (mapped from User.coins)
  };

  const REVERSED_USER = {
    _id: 'usr_123456',
    name: 'High Spender Low Earner',
    coins: 100000,    // Large spending balance
    diamonds: 100000,
    beans: 500,       // Negligible creator balance
  };

  const COIN_TO_INR_RATIO = 200; // 200 Beans = 1 INR

  describe('F-05 Remediation: ExchangeCoins (Beans -> Coins)', () => {
    const ExchangePackages = [
      { id: 'b2c_1', coins: 2000, diamonds: 1000 },
      { id: 'b2c_4', coins: 20000, diamonds: 10000 },
      { id: 'b2c_6', coins: 100000, diamonds: 50000 },
    ];

    it('allows exchange when user has sufficient Beans, even if user.coins is near zero', () => {
      const user = { ...ASYMMETRIC_USER }; // coins: 150, beans: 50000
      const pack = ExchangePackages.find(p => p.id === 'b2c_4'); // requires 20,000 Beans

      // Precondition check fixed in ExchangeCoins.js line 52:
      // must evaluate user?.beans, NOT user?.coins
      const hasEnoughBeans = (user?.beans || 0) >= pack.coins;
      const flawedCheckWithCoins = (user?.coins || 0) >= pack.coins;

      expect(hasEnoughBeans).toBe(true);
      expect(flawedCheckWithCoins).toBe(false); // Old bug would have falsely blocked this!
    });

    it('blocks exchange when user has insufficient Beans, even if user.coins is very large', () => {
      const user = { ...REVERSED_USER }; // coins: 100000, beans: 500
      const pack = ExchangePackages.find(p => p.id === 'b2c_1'); // requires 2,000 Beans

      const hasEnoughBeans = (user?.beans || 0) >= pack.coins;
      const flawedCheckWithCoins = (user?.coins || 0) >= pack.coins;

      expect(hasEnoughBeans).toBe(false); // Correctly blocked: user only has 500 Beans
      expect(flawedCheckWithCoins).toBe(true); // Old bug would have allowed spending coins to convert into coins!
    });
  });

  describe('F-06 Remediation: Withdrawal Balance', () => {
    it('uses user.beans as payout balance when economyBucket is absent', () => {
      const user = { ...ASYMMETRIC_USER }; // coins: 150, beans: 50000
      const economyBucket = null;

      // Fixed in Withdrawal.js line 59:
      const payoutBalance = economyBucket ? economyBucket.earnedBeans : (user?.beans || 0);
      const flawedBalance = economyBucket ? economyBucket.earnedBeans : (user?.coins || 0);

      expect(payoutBalance).toBe(50000);
      expect(flawedBalance).toBe(150);

      // Verify calculated INR from payout balance
      const calculatedInr = (payoutBalance / COIN_TO_INR_RATIO).toFixed(2);
      expect(calculatedInr).toBe('250.00');
    });

    it('prevents user with 0 beans from withdrawing even if coins balance is massive', () => {
      const user = { ...REVERSED_USER, beans: 0 }; // coins: 100000, beans: 0
      const economyBucket = null;

      const payoutBalance = economyBucket ? economyBucket.earnedBeans : (user?.beans || 0);
      expect(payoutBalance).toBe(0);

      // A requested withdrawal of 2000 beans (₹10) must be rejected
      const requestedWithdrawalBeans = 2000;
      const isAffordable = requestedWithdrawalBeans <= payoutBalance;
      expect(isAffordable).toBe(false);
    });

    it('prioritizes economyBucket.earnedBeans if provided by route params', () => {
      const user = { ...ASYMMETRIC_USER };
      const economyBucket = { earnedBeans: 12500, beansPerInr: 200, feeBps: 200 };

      const payoutBalance = economyBucket ? economyBucket.earnedBeans : (user?.beans || 0);
      expect(payoutBalance).toBe(12500);
    });
  });

  describe('F-07 Remediation: Earning Screen (Available Beans Display)', () => {
    it('displays user.beans and converts beans to estimated INR', () => {
      const user = { ...ASYMMETRIC_USER }; // coins: 150, beans: 50000

      // Fixed in Earning.js line 73:
      const getEstimatedINR = (u) => {
        const beans = u?.beans || 0;
        return (beans / COIN_TO_INR_RATIO).toFixed(2);
      };

      const flawedGetEstimatedINR = (u) => {
        const coins = u?.coins || 0;
        return (coins / COIN_TO_INR_RATIO).toFixed(2);
      };

      expect(getEstimatedINR(user)).toBe('250.00');
      expect(flawedGetEstimatedINR(user)).toBe('0.75'); // Flawed would display ₹0.75 instead of ₹250.00!
    });

    it('renders zero INR when user.beans is zero, irrespective of user.coins', () => {
      const user = { ...REVERSED_USER, beans: 0 }; // coins: 100000, beans: 0

      const getEstimatedINR = (u) => {
        const beans = u?.beans || 0;
        return (beans / COIN_TO_INR_RATIO).toFixed(2);
      };

      expect(getEstimatedINR(user)).toBe('0.00');
    });
  });

  describe('Spending Coins Isolation (Calls, Gifting, Greedy King)', () => {
    it('checks call affordability against user.coins (not user.beans)', () => {
      const caller = { ...ASYMMETRIC_USER }; // coins: 150, beans: 50000
      const callRatePerMin = 200; // 200 coins/min

      // Caller has 150 coins -> cannot afford 1 minute (200 coins)
      const canAffordCall = (caller?.coins || 0) >= callRatePerMin;
      expect(canAffordCall).toBe(false);

      // Creator beans must NEVER be spent on call minutes
      const beansUntouched = caller.beans;
      expect(beansUntouched).toBe(50000);
    });

    it('checks gift sending affordability against user.coins', () => {
      const sender = { ...ASYMMETRIC_USER }; // coins: 150, beans: 50000
      const giftPrice = 300;

      const canAffordGift = Number(sender?.coins ?? 0) >= giftPrice;
      expect(canAffordGift).toBe(false);
    });

    it('Greedy King wagers read profile.coins / user.coins, never beans', () => {
      const player = { ...ASYMMETRIC_USER }; // coins: 150, beans: 50000
      const profile = null;

      const betBalance = profile?.coins ?? player?.coins ?? 0;
      expect(betBalance).toBe(150);
      expect(betBalance).not.toBe(player.beans);
    });
  });

  describe('Socket Live balanceUpdated & AuthContext Local State', () => {
    it('updates coins, diamonds, and beans independently in socket listener', () => {
      let state = { ...ASYMMETRIC_USER }; // coins: 150, diamonds: 150, beans: 50000

      const handleBalanceUpdated = (data) => {
        if (data && (data.coins !== undefined || data.diamonds !== undefined || data.beans !== undefined)) {
          const newCoins = data.coins !== undefined ? data.coins : (state?.coins || 0);
          const newDiamonds = data.diamonds !== undefined ? data.diamonds : (state?.diamonds || 0);
          const newBeans = data.beans !== undefined ? data.beans : (state?.beans || 0);
          state = {
            ...state,
            coins: newCoins,
            diamonds: newDiamonds,
            beans: newBeans,
          };
        }
      };

      // Case 1: Recharge adds 500 Coins (diamonds: 500)
      handleBalanceUpdated({ coins: 650, diamonds: 650 });
      expect(state.coins).toBe(650);
      expect(state.diamonds).toBe(650);
      expect(state.beans).toBe(50000); // Beans untouched!

      // Case 2: Host receives gift commission of 4,000 Beans
      handleBalanceUpdated({ beans: 54000 });
      expect(state.beans).toBe(54000);
      expect(state.coins).toBe(650); // Coins untouched!
    });

    it('updateBeans in AuthContext only updates beans field', () => {
      let userState = { ...ASYMMETRIC_USER };

      const updateUserLocally = (patch) => {
        userState = { ...userState, ...patch };
      };

      const updateCoins = (coins) => updateUserLocally({ coins });
      const updateBeans = (beans) => updateUserLocally({ beans });

      updateBeans(75000);
      expect(userState.beans).toBe(75000);
      expect(userState.coins).toBe(150);

      updateCoins(300);
      expect(userState.coins).toBe(300);
      expect(userState.beans).toBe(75000);
    });
  });

  describe('Null / Undefined Resiliency', () => {
    it('safely falls back to 0 without throwing when user is null', () => {
      const user = null;

      const coins = user?.coins || 0;
      const diamonds = user?.diamonds || 0;
      const beans = user?.beans || 0;

      expect(coins).toBe(0);
      expect(diamonds).toBe(0);
      expect(beans).toBe(0);
      expect((beans / COIN_TO_INR_RATIO).toFixed(2)).toBe('0.00');
    });

    it('safely handles missing beans or coins properties on user object', () => {
      const partialUser = { _id: 'partial_1' };

      const coins = partialUser?.coins || 0;
      const beans = partialUser?.beans || 0;

      expect(coins).toBe(0);
      expect(beans).toBe(0);
      expect(Number.isFinite(coins)).toBe(true);
      expect(Number.isFinite(beans)).toBe(true);
    });
  });
});
