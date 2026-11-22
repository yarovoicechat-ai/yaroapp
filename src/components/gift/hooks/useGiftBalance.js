import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../../context/AuthProvider';
import { getSocket } from '../../../sockets';
import { apiUtil } from '../../../utils/apiUtil';

export function useGiftBalance() {
  const { user } = useContext(AuthContext);
  const initialCoins = Number(user?.coins ?? 0);

  const [coinBalance, setCoinBalance] = useState(initialCoins);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiUtil.get('/user/profile');
      const profile = res.data?.data || res.data;
      if (profile) {
        const coins = Number(profile.coins ?? profile.diamonds ?? 0);
        setCoinBalance(coins);
      }
    } catch (err) {
      console.log('[useGiftBalance] Error fetching balance:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleBalanceUpdated = (data) => {
      if (data && (data.coins !== undefined || data.diamonds !== undefined || data.totalBalance !== undefined)) {
        const newBal = Number(data.coins ?? data.diamonds ?? data.totalBalance ?? 0);
        setCoinBalance(newBal);
      }
    };

    socket.on('balanceUpdated', handleBalanceUpdated);
    return () => {
      socket.off('balanceUpdated', handleBalanceUpdated);
    };
  }, []);

  const deductLocalBalance = useCallback((amount) => {
    setCoinBalance((prev) => Math.max(0, prev - amount));
  }, []);

  return {
    coinBalance,
    diamondBalance: coinBalance, // Alias for backward compatibility
    setCoinBalance,
    setDiamondBalance: setCoinBalance,
    fetchBalance,
    deductLocalBalance,
    loading,
  };
}
