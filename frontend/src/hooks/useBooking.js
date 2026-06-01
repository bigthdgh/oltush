import { useState, useCallback } from 'react';
import { createBooking, createPayment } from '../api';

export function useBooking() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  const [bookingData, setBookingData] = useState({
    itemId: null,
    startDate: '',
    endDate: '',
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestsCount: 1,
    addons: [],
    notes: '',
    paymentType: 'full', // 'full' | 'deposit'
  });

  const updateField = useCallback((field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const toggleAddon = useCallback((addon) => {
    setBookingData(prev => {
      const exists = prev.addons.find(a => a.id === addon.id);
      if (exists) {
        return { ...prev, addons: prev.addons.filter(a => a.id !== addon.id) };
      }
      return { ...prev, addons: [...prev.addons, addon] };
    });
  }, []);

  const calculateNights = useCallback(() => {
    const { startDate, endDate } = bookingData;
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [bookingData.startDate, bookingData.endDate]);

  const calculateTotal = useCallback((basePrice = 0) => {
    const nights = calculateNights();
    let baseTotal = nights * basePrice;
    if (bookingData.paymentType === 'deposit') {
      baseTotal = basePrice; // оплата только за 1 сутки
    }
    const addonsTotal = bookingData.addons.reduce((sum, a) => sum + (a.price || 0), 0);
    return baseTotal + addonsTotal;
  }, [calculateNights, bookingData.addons, bookingData.paymentType]);

  const submitBooking = useCallback(async (itemId, basePrice) => {
    setLoading(true);
    setError(null);

    try {
      const res = await createBooking({
        item_id: Number(itemId),
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        guest_name: bookingData.guestName.trim(),
        guest_phone: bookingData.guestPhone.replace(/\D/g, ''),
        guest_email: bookingData.guestEmail.trim() || undefined,
        guests_count: bookingData.guestsCount,
        addons: bookingData.addons.map(a => a.id),
        notes: bookingData.notes,
        payment_type: bookingData.paymentType,
      });

      const bookingId = res.data.booking_id;

      try {
        const paymentRes = await createPayment(bookingId);
        setBookingResult({
          bookingId,
          checkoutUrl: paymentRes.data.checkout_url,
          status: 'pending_payment',
          total: calculateTotal(basePrice),
        });
      } catch (paymentErr) {
        if (paymentErr.response?.status === 503) {
          setBookingResult({
            bookingId,
            checkoutUrl: null,
            status: 'payment_unavailable',
            total: calculateTotal(basePrice),
          });
          setError('Оплата временно недоступна. Свяжитесь с администратором.');
        } else {
          throw paymentErr;
        }
      }

      setStep(4); // payment step
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка бронирования');
      return false;
    } finally {
      setLoading(false);
    }
  }, [bookingData, calculateTotal]);

  const resetBooking = useCallback(() => {
    setStep(0);
    setBookingResult(null);
    setError(null);
    setBookingData({
      itemId: null,
      startDate: '',
      endDate: '',
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      guestsCount: 1,
      addons: [],
      notes: '',
      paymentType: 'full',
    });
  }, []);

  return {
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
  };
}
