import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../../context/AuthProvider';
import { getSocket } from '../../../sockets';
import { apiUtil } from '../../../utils/apiUtil';

export function useGiftBalance() {
  const { user } = useContext(AuthContext);
  const initialDiamonds = Number(user?.diamonds ?? 0);

  const [diamondBalance, setDiamondBalance] = useState(initialDiamonds);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiUtil.get('/user/profile');
      const profile = res.data?.data || res.data;
      if (profile) {
        const diamonds = Number(profile.diamonds !== undefined ? profile.diamonds : (profile.coins ?? 0));
        setDiamondBalance(diamonds);
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
      if (data && (data.diamonds !== undefined || data.totalBalance !== undefined)) {
        const newBal = Number(data.diamonds !== undefined ? data.diamonds : data.totalBalance);
        setDiamondBalance(newBal);
      }
    };

    socket.on('balanceUpdated', handleBalanceUpdated);
    return () => {
      socket.off('balanceUpdated', handleBalanceUpdated);
    };
  }, []);

  const deductLocalBalance = useCallback((amount) => {
    setDiamondBalance((prev) => Math.max(0, prev - amount));
  }, []);

  return {
    diamondBalance,
    setDiamondBalance,
    fetchBalance,
    deductLocalBalance,
    loading,
  };
}

