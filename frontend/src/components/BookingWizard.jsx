import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { springSoft, EASE_OUT_QUINT } from '../animations';
import {
  ArrowLeft, Calendar, User, Phone, Mail, Users, FileText,
  CreditCard, Check, Copy, Share2, Home, MapPin, Clock,
  ExternalLink, RotateCcw, ChevronRight, Loader2, Flame, MessageCircle
} from 'lucide-react';
import { fetchItem, fetchBusyDates } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { useBooking } from '../hooks/useBooking';
import CalendarPicker from './CalendarPicker';
import AddonsStep from './AddonsStep';
import { GlassCard } from './GlassCard';
import { StepIndicator } from './StepIndicator';

const STEP_LABELS = ['Даты', 'Гость', 'Услуги', 'Сводка', 'Оплата', 'Готово'];

function formatPhoneInput(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('375')) {
    if (digits.length <= 3) return '+375';
    if (digits.length <= 5) return `+375 ${digits.slice(3)}`;
    if (digits.length <= 8) return `+375 ${digits.slice(3, 5)} ${digits.slice(5)}`;
    return `+375 ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }
  if (digits.startsWith('7')) {
    if (digits.length <= 1) return '+7';
    if (digits.length <= 4) return `+7 ${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 ${digits.slice(1, 4)} ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.startsWith('380')) {
    if (digits.length <= 3) return '+380';
    if (digits.length <= 5) return `+380 ${digits.slice(3)}`;
    if (digits.length <= 8) return `+380 ${digits.slice(3, 5)} ${digits.slice(5)}`;
    return `+380 ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }
  if (digits.startsWith('48')) {
    if (digits.length <= 2) return '+48';
    if (digits.length <= 5) return `+48 ${digits.slice(2)}`;
    if (digits.length <= 8) return `+48 ${digits.slice(2, 5)} ${digits.slice(5)}`;
    return `+48 ${digits.slice(2, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }
  if (digits.startsWith('370')) {
    if (digits.length <= 3) return '+370';
    if (digits.length <= 5) return `+370 ${digits.slice(3)}`;
    if (digits.length <= 8) return `+370 ${digits.slice(3, 5)} ${digits.slice(5)}`;
    return `+370 ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }
  if (digits.startsWith('371')) {
    if (digits.length <= 3) return '+371';
    if (digits.length <= 5) return `+371 ${digits.slice(3)}`;
    if (digits.length <= 8) return `+371 ${digits.slice(3, 5)} ${digits.slice(5)}`;
    return `+371 ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }
  return raw;
}

function validatePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  const by = /^375(29|33|44|25|17)\d{7}$/;
  const ru = /^79\d{9}$/;
  const ua = /^380\d{9}$/;
  const pl = /^48\d{9}$/;
  const lt = /^370\d{8}$/;
  const lv = /^371\d{8}$/;
  return by.test(digits) || ru.test(digits) || ua.test(digits) || pl.test(digits) || lt.test(digits) || lv.test(digits);
}

const slideVariants = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.45, ease: EASE_OUT_QUINT } },
  exit: { x: -16, opacity: 0, transition: { duration: 0.35, ease: EASE_OUT_QUINT } },
};

const springTransition = springSoft;

function AnimatedCheck() {
  return (
    <motion.div
      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-moss-700"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...springSoft, delay: 0.2 }}
      >
        <Check size={40} className="text-white" strokeWidth={3} />
      </motion.div>
    </motion.div>
  );
}

export default function BookingWizard() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { tg, showBackButton, showMainButton, hideMainButton, openLink, user } = useTelegram();

  const [item, setItem] = useState(null);
  const [busyDates, setBusyDates] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [itemLoading, setItemLoading] = useState(true);
  const [phoneError, setPhoneError] = useState('');

  const {
    step,
    setStep,
    loading,
    error,
    setError,
    bookingResult,
    bookingData,
    updateField,
    toggleAddon,
    calculateNights,
    calculateTotal,
    submitBooking,
    resetBooking,
  } = useBooking();

  // Load item data
  useEffect(() => {
    const load = async () => {
      setItemLoading(true);
      try {
        const [itemRes, busyRes] = await Promise.all([
          fetchItem(itemId),
          fetchBusyDates(itemId, selectedMonth),
        ]);
        setItem(itemRes.data);
        setBusyDates(busyRes.data.dates || []);
      } catch (err) {
        console.error('Failed to load item:', err);
      } finally {
        setItemLoading(false);
      }
    };
    load();
  }, [itemId, selectedMonth]);

  // Telegram back button
  useEffect(() => {
    if (!tg) return;
    const cleanup = showBackButton(() => {
      if (step > 0 && step < 5) {
        setStep(step - 1);
      } else {
        navigate(`/item/${itemId}`);
      }
    });
    return cleanup;
  }, [tg, step, itemId, navigate, showBackButton, setStep]);

  // Auto-fill guest name from Telegram
  useEffect(() => {
    if (step === 1 && !bookingData.guestName && user) {
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
      if (name) updateField('guestName', name);
    }
  }, [step, bookingData.guestName, user, updateField]);

  // Haptic feedback on success
  useEffect(() => {
    if (step === 5 && tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
  }, [step, tg]);

  // Navigation helpers
  const goNext = useCallback(() => {
    if (step === 0) {
      if (!bookingData.startDate || !bookingData.endDate) {
        setError('Выберите даты заезда и выезда');
        return;
      }
    }
    if (step === 1) {
      if (!bookingData.guestName.trim() || !bookingData.guestPhone.trim()) {
        setError('Заполните имя и телефон');
        return;
      }
      if (!validatePhone(bookingData.guestPhone)) {
        setError('Введите корректный номер телефона');
        setPhoneError('Неверный формат номера');
        return;
      }
      setPhoneError('');
    }
    setError(null);
    setStep(step + 1);
  }, [step, bookingData, setStep, setError]);

  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step, setStep]);

  const handleSubmit = useCallback(async () => {
    const ok = await submitBooking(itemId, item?.price_per_night || 0);
    if (ok) hideMainButton();
  }, [submitBooking, itemId, item, hideMainButton]);

  const handleOpenPayment = useCallback(() => {
    if (bookingResult?.checkoutUrl) {
      openLink(bookingResult.checkoutUrl);
    }
  }, [bookingResult, openLink]);

  const handleCopyLink = useCallback(async () => {
    if (bookingResult?.checkoutUrl) {
      try {
        await navigator.clipboard.writeText(bookingResult.checkoutUrl);
      } catch {
        // ignore
      }
    }
  }, [bookingResult]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `Бронирование в Олтуше`,
      text: `Забронировал ${item?.name} с ${format(new Date(bookingData.startDate), 'd MMM')} по ${format(new Date(bookingData.endDate), 'd MMM')}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* ignore */ }
    }
  }, [item, bookingData]);

  const nights = calculateNights();
  const baseTotal = nights * (item?.price_per_night || 0);
  const total = calculateTotal(item?.price_per_night || 0);

  if (itemLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin mb-4" style={{ color: '#5a7c52' }} />
        <p className="font-medium" style={{ color: '#78716c' }}>Загрузка...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <Home size={48} className="mx-auto mb-4" style={{ color: 'rgba(90,124,82,0.3)' }} />
        <p className="font-medium" style={{ color: '#78716c' }}>Объект не найден</p>
      </div>
    );
  }

  const canGoNext =
    (step === 0 && bookingData.startDate && bookingData.endDate) ||
    (step === 1 && bookingData.guestName.trim() && validatePhone(bookingData.guestPhone)) ||
    step === 2 ||
    step === 3 ||
    false;

  const displayError = typeof error === 'string'
    ? (error.includes('409')
        ? 'Эти даты только что заняли. Пожалуйста, обновите страницу и выберите другой период.'
        : (error.includes('500') || error.includes('503') || error.toLowerCase().includes('network'))
          ? 'Что-то пошло не так. Попробуйте немного позже или свяжитесь с администратором.'
          : error)
    : error;

  return (
    <div className="overflow-y-auto h-[calc(100vh-200px)]" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => step > 0 && step < 5 ? goBack() : navigate(`/item/${itemId}`)}
          className="w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(90,124,82,0.1)', border: '1px solid rgba(90,124,82,0.2)' }}
        >
          <ArrowLeft size={17} style={{ color: '#5a7c52' }} />
        </motion.button>
        <div>
          <h2 className="text-xl font-black text-ink leading-tight tracking-tight">Бронирование</h2>
          <p className="text-xs font-semibold" style={{ color: 'rgba(90,124,82,0.65)' }}>{item.name}</p>
        </div>
      </div>

      <StepIndicator currentStep={step} totalSteps={6} labels={STEP_LABELS} />

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"
            style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#ef4444' }}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-black" style={{ background: '#fecaca', color: '#ef4444' }}>!</div>
            <span>{displayError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={springTransition}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80 && step < 4) goNext();
            else if (info.offset.x > 80 && step > 0) goBack();
          }}
        >
          {step === 0 && (
            <GlassCard strong>
              <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
                <Calendar size={18} style={{ color: '#5a7c52' }} />
                Выберите даты
              </h3>
              <p className="text-xs mb-4" style={{ color: '#a8a29e' }}>Укажите удобные даты заезда и выезда</p>
              <CalendarPicker
                busyDates={busyDates}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                startDate={bookingData.startDate}
                endDate={bookingData.endDate}
                onSelectRange={(s, e) => {
                  updateField('startDate', s);
                  updateField('endDate', e);
                  if (s && e) setTimeout(() => setStep(1), 400);
                }}
                minNights={1}
              />
            </GlassCard>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <GlassCard strong>
                <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
                  <User size={18} style={{ color: '#5a7c52' }} />
                  Данные гостя
                </h3>
                <p className="text-xs mb-4" style={{ color: '#a8a29e' }}>Укажите контактные данные, чтобы мы смогли связаться с вами</p>
                <div className="space-y-3">
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(90,124,82,0.5)' }} />
                    <input
                      type="text"
                      placeholder="Имя и фамилия"
                      value={bookingData.guestName}
                      onChange={(e) => updateField('guestName', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(90,124,82,0.5)' }} />
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="+375 (__) ___-__-__"
                      value={bookingData.guestPhone}
                      onChange={(e) => {
                        const formatted = formatPhoneInput(e.target.value);
                        updateField('guestPhone', formatted);
                        if (phoneError) setPhoneError('');
                      }}
                      className={`input-field ${phoneError ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                    />
                    {phoneError && (
                      <p className="text-[11px] mt-1 pl-1" style={{ color: '#ef4444' }}>{phoneError}</p>
                    )}
                  </div>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(90,124,82,0.5)' }} />
                    <input
                      type="email"
                      placeholder="Email (необязательно)"
                      value={bookingData.guestEmail}
                      onChange={(e) => updateField('guestEmail', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="relative">
                    <Users size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(90,124,82,0.5)' }} />
                    <div className="input-field !pl-11 flex items-center justify-between select-none">
                      <span className="text-sm" style={{ color: '#a8a29e' }}>Гостей</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateField('guestsCount', Math.max(1, bookingData.guestsCount - 1))}
                          disabled={bookingData.guestsCount <= 1}
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg"
                          style={{ background: 'rgba(90,124,82,0.15)', color: '#5a7c52' }}
                        >-</button>
                        <span className="text-sm font-bold text-ink w-6 text-center">{bookingData.guestsCount}</span>
                        <button
                          type="button"
                          onClick={() => updateField('guestsCount', Math.min(item.max_guests, bookingData.guestsCount + 1))}
                          disabled={bookingData.guestsCount >= item.max_guests}
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg"
                          style={{ background: 'rgba(90,124,82,0.15)', color: '#5a7c52' }}
                        >+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="relative">
                  <FileText size={18} className="absolute left-3.5 top-3.5" style={{ color: 'rgba(90,124,82,0.5)' }} />
                  <textarea
                    placeholder="Пожелания или комментарий (необязательно)"
                    value={bookingData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={3}
                    className="input-field !py-3 !pl-11 resize-none"
                  />
                </div>
              </GlassCard>
            </div>
          )}

          {step === 2 && (
            <GlassCard strong>
              <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
                <Flame size={18} style={{ color: '#5a7c52' }} />
                Дополнительные услуги
              </h3>
              <p className="text-xs mb-4" style={{ color: '#a8a29e' }}>Выберите, что добавить к бронированию — баню, купель, мангал</p>
              <AddonsStep
                addons={[]}
                selected={bookingData.addons}
                onToggle={toggleAddon}
                baseTotal={baseTotal}
              />
            </GlassCard>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <GlassCard strong>
                <h3 className="font-bold text-ink mb-1">Сводка бронирования</h3>
                <p className="text-xs mb-3" style={{ color: '#a8a29e' }}>Проверьте данные бронирования перед оплатой</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: '#f5f5f4' }}>
                    <Home size={18} className="mt-0.5 shrink-0" style={{ color: '#5a7c52' }} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a8a29e' }}>Объект</p>
                      <p className="font-bold text-ink">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: '#f5f5f4' }}>
                    <Calendar size={18} className="mt-0.5 shrink-0" style={{ color: '#5a7c52' }} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a8a29e' }}>Даты</p>
                      <p className="font-bold text-ink">
                        {format(new Date(bookingData.startDate), 'd MMMM yyyy', { locale: ru })} — {format(new Date(bookingData.endDate), 'd MMMM yyyy', { locale: ru })}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>{nights} ночей</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: '#f5f5f4' }}>
                    <User size={18} className="mt-0.5 shrink-0" style={{ color: '#5a7c52' }} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a8a29e' }}>Гость</p>
                      <p className="font-bold text-ink">{bookingData.guestName}</p>
                      <p className="text-xs" style={{ color: '#a8a29e' }}>{bookingData.guestPhone}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Payment Type Selector */}
              <GlassCard>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a8a29e' }}>Тип оплаты</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateField('paymentType', 'full')}
                    className={`p-3 rounded-2xl border-1.5 text-left transition-all ${
                      bookingData.paymentType === 'full'
                        ? 'bg-forest-50 border-forest-300 ring-1 ring-forest-200'
                        : 'bg-white/70 border-forest-100/60 hover:bg-white/90'
                    }`}
                  >
                    <p className="font-bold text-sm text-ink">100% предоплата</p>
                    <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>Полная сумма сейчас</p>
                  </button>
                  <button
                    onClick={() => updateField('paymentType', 'deposit')}
                    className={`p-3 rounded-2xl border-1.5 text-left transition-all ${
                      bookingData.paymentType === 'deposit'
                        ? 'bg-forest-50 border-forest-300 ring-1 ring-forest-200'
                        : 'bg-white/70 border-forest-100/60 hover:bg-white/90'
                    }`}
                  >
                    <p className="font-bold text-sm text-ink">Только 1 сутки</p>
                    <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>Остаток на месте</p>
                  </button>
                </div>
                {bookingData.paymentType === 'deposit' && (
                  <p className="text-xs mt-2 p-2 rounded-xl" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                    При заезде потребуется доплатить оставшуюся сумму ({baseTotal - item.price_per_night} BYN)
                  </p>
                )}
              </GlassCard>

              <GlassCard>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#a8a29e' }}>{item.price_per_night} BYN × {nights} ночей</span>
                    <span className="font-bold text-ink">{baseTotal} BYN</span>
                  </div>
                  {bookingData.addons.map(a => (
                    <div key={a.id} className="flex justify-between">
                      <span style={{ color: '#a8a29e' }}>{a.name}</span>
                      <span className="font-bold text-ink">{a.price} BYN</span>
                    </div>
                  ))}
                  {bookingData.paymentType === 'deposit' && (
                    <div className="flex justify-between text-amber-600">
                      <span>Предоплата (1 сутки)</span>
                      <span className="font-bold">-{baseTotal - item.price_per_night} BYN</span>
                    </div>
                  )}
                  <div className="h-px my-2" style={{ background: '#e7e5e4' }} />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-ink">Итого к оплате</span>
                    <span className="text-2xl font-black" style={{ color: '#5c4a32' }}>{total} BYN</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <GlassCard strong>
                <h3 className="font-bold text-ink mb-1">Оплата</h3>
                <p className="text-xs mb-3" style={{ color: '#a8a29e' }}>Оплата проходит через защищённый сервис BePaid</p>
                {bookingData.paymentType === 'deposit' && (
                  <div className="mb-3 p-3 rounded-2xl text-sm" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
                    <p className="font-bold">Предоплата за 1 сутки</p>
                    <p className="text-xs mt-0.5">Остаток ({baseTotal - item.price_per_night} BYN) оплачивается при заезде</p>
                  </div>
                )}
                <div className="p-4 rounded-2xl gradient-forest text-white text-center mb-4">
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wider">
                    {bookingData.paymentType === 'deposit' ? 'Предоплата' : 'Сумма к оплате'}
                  </p>
                  <p className="text-3xl font-extrabold mt-1">{total} BYN</p>
                </div>
                {bookingResult?.status === 'payment_unavailable' ? (
                  <div className="p-4 rounded-2xl text-sm font-bold text-center" style={{ background: '#f0e6d6', border: '1px solid #e0ccaf', color: '#5c4a32' }}>
                    Оплата временно недоступна. Свяжитесь с администратором.
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleOpenPayment}
                    className="btn-primary"
                  >
                    <CreditCard size={18} />
                    Оплатить картой
                    <ExternalLink size={14} />
                  </motion.button>
                )}
                {/* Payment methods */}
                <div className="mt-3 flex items-center justify-center gap-3">
                  <span className="text-[11px] font-black italic tracking-wider" style={{ color: '#a8a29e' }}>VISA</span>
                  <span style={{ color: '#a8a29e' }}>·</span>
                  <span className="text-[11px] font-bold tracking-wider" style={{ color: '#a8a29e' }}>Mastercard</span>
                </div>
              </GlassCard>

              {bookingResult?.checkoutUrl && (
                <GlassCard>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      readOnly
                      value={bookingResult.checkoutUrl}
                      className="flex-1 input-field !text-xs !py-2.5"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyLink}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(90,124,82,0.15)', border: '1px solid rgba(90,124,82,0.2)' }}
                    >
                      <Copy size={18} style={{ color: '#5a7c52' }} />
                    </motion.button>
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {step === 5 && (
            <motion.div
              className="relative text-center py-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
              }}
            >
              <AnimatedCheck />
              <motion.h3
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="text-2xl font-black text-ink mb-2"
              >
                Бронирование подтверждено!
              </motion.h3>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="mb-3"
                style={{ color: '#78716c' }}
              >
                Номер брони: <span className="font-mono font-black" style={{ color: '#5c4a32' }}>#{bookingResult?.bookingId}</span>
              </motion.p>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="mb-6"
              >
                <div
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold"
                  style={{
                    background: 'rgba(90,124,82,0.1)',
                    border: '1px solid rgba(90,124,82,0.25)',
                    color: '#5a7c52',
                  }}
                >
                  <MessageCircle size={16} />
                  Бронь создана, мы отправили вам сообщение в Telegram
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="space-y-3 mb-6"
              >
                <div
                  className="text-left p-4"
                  style={{
                    borderRadius: '20px',
                    background: '#f5f5f4',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Home size={17} style={{ color: '#5a7c52' }} />
                    <span className="font-bold text-ink">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar size={17} style={{ color: '#5a7c52' }} />
                    <span style={{ color: '#57534e' }}>
                      {format(new Date(bookingData.startDate), 'd MMM', { locale: ru })} — {format(new Date(bookingData.endDate), 'd MMM', { locale: ru })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Clock size={17} style={{ color: '#5a7c52' }} />
                    <span style={{ color: '#57534e' }}>{nights} ночей</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={17} style={{ color: '#5a7c52' }} />
                    <span style={{ color: '#57534e' }}>База Олтуш</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleShare}
                    className="btn-secondary flex-1"
                  >
                    <Share2 size={16} />
                    Поделиться
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/')}
                    className="btn-primary flex-1"
                  >
                    <Home size={16} />
                    На главную
                  </motion.button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    resetBooking();
                    navigate(`/item/${itemId}`);
                  }}
                  className="btn-secondary"
                >
                  <RotateCcw size={16} />
                  Новое бронирование
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom action bar */}
      {step < 5 && (
        <div className="fixed left-0 right-0 z-40" style={{ bottom: 'calc(92px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-[560px] mx-auto px-4">
            <div
              className="px-4 py-3 flex items-center gap-3"
              style={{
                borderRadius: '24px',
                background: 'rgba(250,248,245,0.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#a8a29e' }}>
                  {step === 0 ? 'Выберите даты' : step === 4 ? 'Итого к оплате' : 'Продолжить бронирование'}
                </p>
                {step > 0 && (
                  <div
                    className="inline-flex items-baseline gap-1 px-3 py-1 rounded-full"
                    style={{ background: '#f0e6d6', border: '1px solid rgba(251,191,36,0.25)' }}
                  >
                    <span className="text-[11px] font-semibold" style={{ color: '#8b6f4e' }}>
                      {step === 4 ? 'Сумма' : 'За'}
                    </span>
                    <span className="text-sm font-black whitespace-nowrap" style={{ color: '#5c4a32' }}>
                      {step === 4 ? `${total} BYN` : `${nights} ночей`}
                    </span>
                  </div>
                )}
              </div>
              {step === 3 ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary !w-auto !px-4 !py-2.5 !min-h-[44px] !text-sm shrink-0"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Оформить
                    </>
                  )}
                </motion.button>
              ) : step === 4 ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={goNext}
                  className="btn-primary !w-auto !px-4 !py-2.5 !min-h-[44px] !text-sm shrink-0"
                >
                  <Check size={18} />
                  Готово
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={goNext}
                  className="btn-primary !w-auto !px-4 !py-2.5 !min-h-[44px] !text-sm shrink-0"
                >
                  Далее
                  <ChevronRight size={16} />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
