import { useState, useEffect } from 'react';
import { checkAdmin } from '../api';

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    const userId = user?.id;

    if (!userId) {
      console.log('useIsAdmin: no Telegram userId found');
      setLoading(false);
      return;
    }

    console.log('useIsAdmin: checking for userId', userId);
    checkAdmin(userId)
      .then(res => {
        console.log('useIsAdmin: API response', res.data);
        setIsAdmin(!!res.data?.is_admin);
      })
      .catch((err) => {
        console.error('useIsAdmin: API error', err);
        setIsAdmin(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return { isAdmin, loading };
}
