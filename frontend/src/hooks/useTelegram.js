import { useEffect, useCallback, useRef } from 'react';

export function useTelegram() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const backHandlers = useRef(new Set());

  // Development fallback: allow user_id via URL param
  const getDevUser = () => {
    if (tg?.initDataUnsafe?.user) return tg.initDataUnsafe.user;
    const params = new URLSearchParams(window.location.search);
    const devUserId = params.get('dev_user_id');
    if (devUserId) {
      return { id: parseInt(devUserId, 10), first_name: 'Dev User' };
    }
    return null;
  };

  useEffect(() => {
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();

    // Theme matching
    if (tg.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Haptic on interactions
    const addHaptic = (e) => {
      const target = e.target.closest('button, a, [role="button"]');
      if (target && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
    };
    document.addEventListener('click', addHaptic);

    return () => {
      document.removeEventListener('click', addHaptic);
    };
  }, [tg]);

  const showBackButton = useCallback((onClick) => {
    if (!tg?.BackButton) return () => {};
    tg.BackButton.show();
    tg.BackButton.onClick(onClick);
    backHandlers.current.add(onClick);
    return () => {
      tg.BackButton.hide();
      tg.BackButton.offClick(onClick);
      backHandlers.current.delete(onClick);
    };
  }, [tg]);

  const showMainButton = useCallback((text, onClick, { isActive = true, color = '#1a4d2e', textColor = '#ffffff' } = {}) => {
    if (!tg?.MainButton) return () => {};
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(onClick);
    tg.MainButton.setParams({
      color,
      text_color: textColor,
      is_active: isActive,
      is_visible: true,
    });
    return () => {
      tg.MainButton.hide();
      tg.MainButton.offClick(onClick);
    };
  }, [tg]);

  const hideMainButton = useCallback(() => {
    if (!tg?.MainButton) return;
    tg.MainButton.hide();
  }, [tg]);

  const openLink = useCallback((url) => {
    if (tg?.openLink) {
      tg.openLink(url, { try_instant_view: false });
    } else if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, [tg]);

  const sendData = useCallback((data) => {
    if (tg?.sendData) {
      tg.sendData(JSON.stringify(data));
    }
  }, [tg]);

  const closeApp = useCallback(() => {
    if (tg?.close) {
      tg.close();
    }
  }, [tg]);

  return {
    tg,
    showBackButton,
    showMainButton,
    hideMainButton,
    openLink,
    sendData,
    closeApp,
    isInTelegram: !!tg,
    user: getDevUser(),
  };
}
