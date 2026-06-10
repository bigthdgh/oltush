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
      setLoading(false);
      return;
    }

    checkAdmin(userId)
      .then(res => {
        setIsAdmin(!!res.data?.is_admin);
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return { isAdmin, loading };
}
