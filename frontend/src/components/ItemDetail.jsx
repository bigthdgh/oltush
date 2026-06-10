import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { springSoft, EASE_OUT_QUINT } from '../animations';
import { fetchItem } from '../api';
import {
  ArrowLeft, Users, Home, Flame, Droplets, BedDouble, Bath,
  Wifi, Car, Waves, Calendar, ChevronRight, MapPin, Star
} from 'lucide-react';
import ImageLightbox from './ImageLightbox';
import { getItemPhotos } from '../utils/photos';

const typeConfig = {
  house: {
    icon: Home, label: 'Домик',
    bg: '#e3ebe0',
    color: '#3d5a36',
    badgeBg: '#e3ebe0',
    badgeColor: '#3d5a36',
  },
  sauna: {
    icon: Flame, label: 'Баня',
    bg: '#f0e6d6',
    color: '#5c4a32',
    badgeBg: '#f0e6d6',
    badgeColor: '#5c4a32',
  },
  tub: {
    icon: Droplets, label: 'Купель',
    bg: '#e0f2fe',
    color: '#0369a1',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
  },
};

const amenityIcons = {
  wifi: Wifi,
  parking: Car,
  pool: Waves,
  bathroom: Bath,
  bedroom: BedDouble,
};

function PhotoGallery({ photos, onPhotoClick }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.offsetWidth;
    const idx = Math.round(scrollLeft / width);
    setActiveIndex(idx);
  };

  const defaultPhotos = photos?.length ? photos : [
    { url: 'https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?w=800&q=80', caption: 'Вид на лес' },
    { url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80', caption: 'Уютный интерьер' },
    { url: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=800&q=80', caption: 'Природа' },
  ];

  return (
    <div className="relative mb-5">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="gallery-scroll flex gap-3 overflow-x-auto hide-scrollbar rounded-2xl"
      >
        {defaultPhotos.map((photo, i) => (
          <button
            key={i}
            onClick={() => onPhotoClick?.(i)}
            className="w-full aspect-[4/3] relative rounded-2xl overflow-hidden bg-forest-100 flex-shrink-0 block p-0 border-0"
          >
            <img
              src={photo.url}
              alt={photo.caption || `Фото ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
                e.target.style.display = 'none';
                e.target.parentElement.classList.add('bg-forest-100', 'flex', 'items-center', 'justify-center');
                const fallback = document.createElement('div');
                fallback.className = 'flex flex-col items-center justify-center text-forest-400';
                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-xs mt-1 font-medium">Олтуш</span>';
                e.target.parentElement.appendChild(fallback);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-2.5">
        {defaultPhotos.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? '24px' : '6px',
              background: i === activeIndex ? '#3d5a36' : 'rgba(0,0,0,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniMapCard() {
  return (
    <a
      href="https://maps.app.goo.gl/5GgZMr1Kn5S1DESS8"
      target="_blank"
      rel="noreferrer"
      className="flex w-12 h-12 rounded-2xl items-center justify-center relative overflow-hidden bg-moss-100 text-moss-700 border border-moss-200"
    >
      <MapPin size={16} className="relative z-10" />
    </a>
  );
}

function FeatureItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-black/[0.06]">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-moss-100 text-moss-700">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-warm-400">{label}</p>
        <p className="text-sm font-semibold text-ink mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchItem(id)
      .then(res => setItem(res.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 120);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-2xl skeleton" />
        <div className="h-24 rounded-2xl skeleton" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-2xl skeleton" />
          <div className="h-20 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <Home size={48} className="text-moss-300 mx-auto mb-4" />
        <p className="text-moss-600 font-medium">Объект не найден</p>
      </div>
    );
  }

  const config = typeConfig[item.type] || typeConfig.house;
  const TypeIcon = config.icon;

  // Realistic defaults based on item type (fields can be added to DB later)
  const typeAmenities = {
    house: [
      { icon: Users, label: 'Гости', value: `до ${item.max_guests}` },
      { icon: BedDouble, label: 'Спальных мест', value: '4' },
      { icon: Bath, label: 'Удобства', value: 'Санузел в доме' },
      { icon: Wifi, label: 'Wi-Fi', value: 'Бесплатно' },
    ],
    sauna: [
      { icon: Users, label: 'Вместимость', value: `до ${item.max_guests}` },
      { icon: Flame, label: 'Тип', value: 'На дровах' },
      { icon: Bath, label: 'Душ', value: 'Есть' },
      { icon: Waves, label: 'Купель', value: 'Рядом' },
    ],
    tub: [
      { icon: Users, label: 'Вместимость', value: `до ${item.max_guests}` },
      { icon: Droplets, label: 'Тип', value: 'На дровах' },
      { icon: Flame, label: 'Подогрев', value: 'Да' },
      { icon: Bath, label: 'Душ', value: 'Рядом' },
    ],
  };
  const amenities = typeAmenities[item.type] || typeAmenities.house;

  return (
    <div className="animate-fade-in overflow-y-auto" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
      {/* Floating header on scroll */}
      <motion.div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        initial={false}
      >
        <div className="max-w-[560px] mx-auto">
          <div
            className="px-4 py-3 flex items-center gap-3 bg-cream/90 border-b border-black/[0.06]"
            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          >
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-2xl flex items-center justify-center bg-moss-100 text-moss-700"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-ink text-sm truncate">{item.name}</h3>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Back button */}
      <motion.button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 font-medium mb-4 text-warm-500 hover:text-ink"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_QUINT }}
        whileTap={{ scale: 0.96, transition: { duration: 0.12 } }}
      >
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-moss-100 text-moss-700">
          <ArrowLeft size={17} />
        </div>
        <span className="text-sm font-semibold">Назад к объектам</span>
      </motion.button>

      {/* Photo Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT_QUINT }}
      >
        <PhotoGallery
          photos={getItemPhotos(item)}
          onPhotoClick={(idx) => {
            setLightboxIndex(idx);
            setLightboxOpen(true);
          }}
        />
        <ImageLightbox
          photos={getItemPhotos(item)}
          activeIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setLightboxIndex}
        />
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: EASE_OUT_QUINT }}
      >
        <div className="mb-5 p-5 bg-white rounded-2xl border border-black/[0.06] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <span
                className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide mb-2"
                style={{ background: config.badgeBg, color: config.badgeColor }}
              >
                {config.label}
              </span>
              <h2 className="text-2xl font-serif font-bold text-ink leading-tight tracking-tight">{item.name}</h2>
              <p className="text-[14px] mt-1.5 leading-relaxed text-warm-500">{item.description}</p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0 ml-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: config.bg, color: config.color }}
              >
                <TypeIcon size={22} strokeWidth={2} />
              </div>
              <MiniMapCard />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm mb-4 text-warm-400">
            <MapPin size={13} className="text-moss-600" />
            <a
              href="https://maps.app.goo.gl/5GgZMr1Kn5S1DESS8"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80 transition-opacity text-moss-600"
            >
              База отдыха Олтуш, Брестская область
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-wood-100 text-wood-700">
              {item.price_per_night} BYN / ночь
            </span>
            <span className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 bg-warm-100 text-warm-600">
              <Users size={13} />
              до {item.max_guests} гостей
            </span>
          </div>
        </div>
      </motion.div>

      {/* Amenities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={springSoft}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <span className="section-accent" />
          <h3 className="text-[17px] font-semibold text-ink">Удобства</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {amenities.map((a, i) => (
            <FeatureItem key={i} icon={a.icon} label={a.label} value={a.value} />
          ))}
        </div>
      </motion.div>

      {/* Description */}
      {item.full_description && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={springSoft}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <span className="section-accent" />
            <h3 className="text-[17px] font-semibold text-ink">Описание</h3>
          </div>
          <div className="mb-6 p-4 bg-white rounded-2xl border border-black/[0.06]">
            <p className="text-sm leading-relaxed whitespace-pre-line text-warm-600">{item.full_description}</p>
          </div>
        </motion.div>
      )}

      {/* Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={springSoft}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <span className="section-accent" />
          <h3 className="text-[17px] font-semibold text-ink">Правила</h3>
        </div>
        <div className="mb-6 p-4 bg-white rounded-2xl border border-black/[0.06]">
          <ul className="space-y-2.5 text-sm">
            {[
              { text: 'Заезд с 15:00, выезд до 12:00. Ранний заезд / поздний выезд — по согласованию.', danger: false },
              { text: 'Курение ВНУТРИ домиков, бани и беседки запрещено. Только на улице в отведённых местах.', danger: true },
              { text: 'Домашние животные — запрещены.', danger: true },
              { text: 'Пиротехника — только с письменного разрешения администрации.', danger: true },
              { text: 'Тихий час — с 23:00 до 08:00.', danger: false },
              { text: 'Огонь — только в мангалах. Костры на земле запрещены.', danger: false },
              { text: 'Предоплата 50% при бронировании. Отмена менее 14 дней — предоплата не возвращается.', danger: false },
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: rule.danger ? '#ef4444' : '#5a7c52' }}
                />
                <span className={rule.danger ? 'text-red-500' : 'text-warm-500'}>{rule.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-center mb-24 text-warm-300">
          Полные правила — в разделе Помощь → Правила
        </p>
      </motion.div>

      {/* Fixed CTA */}
      <div className="fixed left-0 right-0 z-40" style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-[560px] mx-auto px-4">
          <div className="px-4 py-3 flex items-center gap-3 bg-white rounded-2xl border border-black/[0.06] shadow-sm"
            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1 text-warm-400">Цена за ночь</p>
              <div className="inline-flex items-baseline gap-1 px-3 py-1 rounded-lg bg-wood-100 border border-wood-200">
                <span className="text-[11px] font-medium text-wood-500">от</span>
                <span className="text-sm font-semibold whitespace-nowrap text-wood-700">{item.price_per_night} BYN</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
              onClick={() => navigate(`/booking/${item.id}`)}
              className="btn-primary !w-auto !px-5 !py-3 !min-h-[46px] !text-sm shrink-0"
            >
              <Calendar size={16} />
              Забронировать
              <ChevronRight size={14} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
