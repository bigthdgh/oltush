import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isFuture, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  User, Calendar, Home, CreditCard, ChevronRight, Clock,
  CheckCircle, XCircle, RotateCcw, Loader2, QrCode, TreePine
} from 'lucide-react';
import { fetchMyBookings } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { GlassCard } from './GlassCard';
import BookingQRCode from './BookingQRCode';

const statusConfig = {
  confirmed: {
    label: 'Подтверждено',
    icon: CheckCircle,
    bg: 'rgba(90,124,82,0.15)',
    color: '#5a7c52',
    border: 'rgba(90,124,82,0.3)',
  },
  pending: {
    label: 'Ожидает',
    icon: Clock,
    bg: 'rgba(139,111,78,0.15)',
    color: '#8b6f4e',
    border: 'rgba(139,111,78,0.3)',
  },
  cancelled: {
    label: 'Отменено',
    icon: XCircle,
    bg: '#fee2e2',
    color: '#ef4444',
    border: '#fecaca',
  },
  completed: {
    label: 'Завершено',
    icon: CheckCircle,
    bg: 'rgba(90,124,82,0.1)',
    color: '#5a7c52',
    border: 'rgba(90,124,82,0.2)',
  },
};

function BookingCard({ booking, onPay, onCancel, onRepeat }) {
  const navigate = useNavigate();
  const status = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const isActive = isFuture(new Date(booking.start_date)) ||
    (new Date() >= new Date(booking.start_date) && new Date() <= new Date(booking.end_date));

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="relative overflow-hidden p-4"
        style={{
          borderRadius: '24px',
          background: '#f5f5f4',
          border: '1px solid #e7e5e4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Status badge */}
        <div
          className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
          style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}
        >
          {status.label}
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: 'rgba(90,124,82,0.1)', border: '1px solid rgba(90,124,82,0.2)' }}
          >
            {booking.item_photo ? (
              <img src={booking.item_photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <Home size={20} style={{ color: '#5a7c52' }} />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-20">
            <h4 className="font-black text-ink text-[14px] truncate">{booking.item_name || 'Объект'}</h4>
            <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>
              <Calendar size={11} className="inline mr-1" />
              {format(new Date(booking.start_date), 'd MMM', { locale: ru })} — {format(new Date(booking.end_date), 'd MMM', { locale: ru })}
            </p>
            <p className="text-xs font-black mt-1" style={{ color: '#8b6f4e' }}>{booking.total_price} BYN</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3 items-center">
          {booking.status === 'pending' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onPay?.(booking)}
              className="flex-1 py-2.5 rounded-full text-[13px] font-black flex items-center justify-center gap-1.5"
              style={{ background: '#3d5a36', color: '#ffffff', boxShadow: '0 4px 14px rgba(90,124,82,0.35)' }}
            >
              <CreditCard size={13} />
              Оплатить
            </motion.button>
          )}
          {isActive && booking.status !== 'cancelled' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onCancel?.(booking)}
              className="flex-1 py-2.5 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5"
              style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }}
            >
              <XCircle size={13} />
              Отменить
            </motion.button>
          )}
          {!isActive && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onRepeat?.(booking)}
              className="flex-1 py-2.5 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(90,124,82,0.1)', color: '#5a7c52', border: '1px solid rgba(90,124,82,0.2)' }}
            >
              <RotateCcw size={13} />
              Повторить
            </motion.button>
          )}
          {isActive && booking.status !== 'cancelled' && (
            <BookingQRCode bookingId={booking.id} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    if (user?.id) {
      fetchMyBookings(user.id)
        .then(res => setBookings(res.data || []))
        .catch(() => setBookings([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const now = new Date();
  const activeBookings = bookings.filter(b =>
    b.status !== 'cancelled' && new Date(b.end_date) >= now
  );
  const pastBookings = bookings.filter(b =>
    b.status === 'completed' || (b.status !== 'cancelled' && new Date(b.end_date) < now)
  );
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  const filtered = tab === 'active' ? activeBookings : tab === 'past' ? pastBookings : cancelledBookings;

  const displayName = user?.first_name || user?.username || 'Гость';
  const avatarUrl = user?.photo_url || null;

  const activeCount = useAnimatedCounter(activeBookings.length, 800);
  const pastCount = useAnimatedCounter(pastBookings.length, 800);
  const paidCount = useAnimatedCounter(bookings.filter(b => b.status === 'confirmed').length, 800);

  return (
    <div className="animate-fade-in pb-24">
      {/* User header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div
          className="mb-5 flex items-center gap-4 p-5"
          style={{
            borderRadius: '28px',
            background: '#f5f5f4',
            border: '1px solid #e7e5e4',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl} alt=""
                className="w-16 h-16 rounded-full object-cover"
                style={{ border: '2px solid rgba(90,124,82,0.4)', boxShadow: '0 0 16px rgba(90,124,82,0.25)' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: '#3d5a36', boxShadow: '0 6px 20px rgba(90,124,82,0.35)' }}
              >
                <User size={28} className="text-white" />
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#5a7c52', border: '2px solid #faf8f5' }}
            >
              <CheckCircle size={11} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-ink tracking-tight">{displayName}</h2>
            <p className="text-sm" style={{ color: 'rgba(90,124,82,0.7)' }}>
              {user?.username ? `@${user.username}` : 'Личный кабинет'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-5"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { count: activeCount, label: 'Активные', color: '#5a7c52', bg: 'rgba(90,124,82,0.1)' },
          { count: pastCount, label: 'Прошлые', color: '#8b6f4e', bg: 'rgba(139,111,78,0.1)' },
          { count: paidCount, label: 'Оплачено', color: '#5a7c52', bg: 'rgba(90,124,82,0.1)' },
        ].map((s, i) => (
          <motion.div
            key={i}
            variants={{ hidden: { opacity: 0, y: 12, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } } }}
          >
            <div
              className="text-center p-4"
              style={{
                borderRadius: '20px',
                background: s.bg,
                border: `1px solid ${s.color}33`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: '#a8a29e' }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div
        className="flex gap-1.5 mb-5 p-1.5"
        style={{
          borderRadius: '20px',
          background: '#f5f5f4',
          border: '1px solid #e7e5e4',
        }}
      >
        {[
          { key: 'active', label: 'Активные', count: activeBookings.length },
          { key: 'past', label: 'История', count: pastBookings.length },
          { key: 'cancelled', label: 'Отменён', count: cancelledBookings.length },
        ].map((t) => (
          <motion.button
            key={t.key}
            onClick={() => setTab(t.key)}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-2 text-[11px] font-black uppercase tracking-wider transition-all relative"
            style={{
              borderRadius: '14px',
              background: tab === t.key ? '#3d5a36' : 'transparent',
              color: tab === t.key ? '#ffffff' : '#a8a29e',
              boxShadow: tab === t.key ? '0 4px 14px rgba(90,124,82,0.3)' : 'none',
            }}
          >
            {t.label}{t.count > 0 ? ` (${t.count})` : ''}
          </motion.button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-28 rounded-3xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center py-12"
        >
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(90,124,82,0.1)', border: '1px solid rgba(90,124,82,0.2)' }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TreePine size={32} style={{ color: '#5a7c52' }} />
          </motion.div>
          <p className="font-black text-ink text-lg mb-1">Пока нет бронирований</p>
          <p className="text-sm mb-5" style={{ color: '#a8a29e' }}>Отдохните на природе в Олтуше</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            className="btn-primary !min-h-[48px] !text-[14px]"
          >
            Забронировать отдых
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onPay={(b) => navigate(`/booking/${b.item_id}?pay=${b.id}`)}
              onRepeat={(b) => navigate(`/item/${b.item_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
