import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Flame, Droplets, Users, ChevronRight, Sparkles, TreePine,
  Sun, Snowflake, MapPin, Filter, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { fetchItems } from '../api';
import { GlassCard } from './GlassCard';
import BaseMap from './BaseMap';
import { getItemCoverPhoto } from '../utils/photos';

const typeConfig = {
  house: {
    icon: Home,
    bg: '#e3ebe0',
    color: '#3d5a36',
    label: 'Домик',
    unit: 'ночь',
    badgeBg: '#e3ebe0',
    badgeColor: '#3d5a36',
  },
  sauna: {
    icon: Flame,
    bg: '#f0e6d6',
    color: '#5c4a32',
    label: 'Баня',
    unit: 'сеанс',
    badgeBg: '#f0e6d6',
    badgeColor: '#5c4a32',
  },
  tub: {
    icon: Droplets,
    bg: '#e0f2fe',
    color: '#0369a1',
    label: 'Купель',
    unit: 'сеанс',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const SeasonIcon = () => {
  const month = new Date().getMonth();
  const isWinter = month >= 10 || month <= 1;
  return isWinter ? <Snowflake size={10} className="text-white" /> : <Sun size={10} className="text-white" />;
};

function ItemCard({ item }) {
  const config = typeConfig[item.type] || typeConfig.house;
  const Icon = config.icon;
  const coverPhoto = getItemCoverPhoto(item);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3, transition: { duration: 0.35 } }}
      whileTap={{ scale: 0.97 }}
    >
      <Link
        to={`/item/${item.id}`}
        className="group relative overflow-hidden block bg-white"
        style={{
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Cover photo */}
        <div className="relative w-full aspect-[3/4] overflow-hidden" style={{ borderRadius: '16px 16px 0 0' }}>
          <motion.img
            src={coverPhoto}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?w=800&q=80';
            }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)' }} />
          {/* Type icon badge */}
          <div
            className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center z-10"
            style={{ background: config.bg, color: config.color }}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
          <div className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center z-10 bg-white/90 text-ink">
            <SeasonIcon />
          </div>
        </div>

        <div className="p-3.5 relative z-10">
          <span
            className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ background: config.badgeBg, color: config.badgeColor }}
          >
            {config.label}
          </span>
          <h3 className="font-semibold text-ink text-[15px] leading-tight tracking-tight mb-1">{item.name}</h3>
          <p className="text-warm-500 text-xs leading-relaxed line-clamp-2 mb-3">{item.description || 'Уютное место для отдыха на природе'}</p>

          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: config.badgeBg }}
            >
              <span className="font-semibold text-sm" style={{ color: config.color }}>{item.price_per_night}</span>
              <span className="text-warm-400 text-[10px] font-medium">BYN/{config.unit}</span>
            </div>
            <div className="flex items-center gap-1 text-warm-500 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-warm-100">
              <Users size={11} />
              <span>до {item.max_guests}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SectionTitle({ title, subtitle, delay = 0 }) {
  return (
    <motion.div
      className="mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <span className="section-accent" />
        <h2 className="text-[17px] font-semibold text-ink tracking-tight">{title}</h2>
      </div>
      {subtitle && <p className="text-xs font-medium ml-5 text-warm-400">{subtitle}</p>}
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 rounded-3xl skeleton" />
      ))}
    </div>
  );
}

/* ── Seasonal Offer Card ── */
function SeasonOffer({ items }) {
  const month = new Date().getMonth();
  let title, subtitle, icon, gradient, typeFilter, cta;

  if (month >= 5 && month <= 8) {
    // Summer
    title = 'Летний отдых';
    subtitle = 'Купель, рыбалка, пикники на природе';
    icon = Sun;
    gradient = 'from-sky-500 via-sky-400 to-emerald-400';
    typeFilter = 'tub';
    cta = 'Забронировать купель';
  } else if (month >= 9 && month <= 10) {
    // Autumn
    title = 'Осенний уют';
    subtitle = 'Баня с веником, тёплый чай и лес';
    icon = TreePine;
    gradient = 'from-amber-600 via-orange-500 to-amber-400';
    typeFilter = 'sauna';
    cta = 'В баню!';
  } else if (month >= 2 && month <= 4) {
    // Spring
    title = 'Весеннее пробуждение';
    subtitle = 'Шашлыки, первый купель, свежий воздух';
    icon = Sparkles;
    gradient = 'from-emerald-500 via-teal-400 to-cyan-400';
    typeFilter = 'house';
    cta = 'Выбрать домик';
  } else {
    // Winter
    title = 'Зимняя сказка';
    subtitle = 'Баня с купелью, горячий чай, снег';
    icon = Snowflake;
    gradient = 'from-sky-600 via-indigo-400 to-cyan-300';
    typeFilter = 'sauna';
    cta = 'В баню!';
  }

  const target = items.find(i => i.type === typeFilter) || items[0];
  if (!target) return null;

  const Icon = icon;

  const seasonBg = {
    'from-sky-500 via-sky-400 to-emerald-400': '#e0f2fe',
    'from-amber-600 via-orange-500 to-amber-400': '#f0e6d6',
    'from-emerald-500 via-teal-400 to-cyan-400': '#e3ebe0',
    'from-sky-600 via-indigo-400 to-cyan-300': '#e0f2fe',
  }[gradient] || '#e3ebe0';

  const seasonText = {
    'from-sky-500 via-sky-400 to-emerald-400': '#0369a1',
    'from-amber-600 via-orange-500 to-amber-400': '#5c4a32',
    'from-emerald-500 via-teal-400 to-cyan-400': '#3d5a36',
    'from-sky-600 via-indigo-400 to-cyan-300': '#0369a1',
  }[gradient] || '#3d5a36';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
      className="mb-6"
    >
      <Link to={`/item/${target.id}`}>
        <motion.div
          className="relative overflow-hidden p-5"
          whileTap={{ scale: 0.98 }}
          style={{
            borderRadius: '20px',
            background: seasonBg,
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="relative flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white/60">
              <Icon size={24} style={{ color: seasonText }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold tracking-tight" style={{ color: seasonText }}>{title}</h3>
              <p className="text-sm mt-0.5 leading-relaxed text-warm-600">{subtitle}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/60" style={{ color: seasonText }}>
                <Sparkles size={11} />
                {cta}
                <ChevronRight size={11} />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ── Type Filter Bar ── */
const FILTER_OPTIONS = [
  { key: 'all', label: 'Все', icon: SlidersHorizontal },
  { key: 'house', label: 'Домики', icon: Home },
  { key: 'sauna', label: 'Баня', icon: Flame },
  { key: 'tub', label: 'Купель', icon: Droplets },
];

function FilterBar({ active, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
      className="flex gap-2 mb-5 overflow-x-auto hide-scrollbar pb-1"
    >
      {FILTER_OPTIONS.map((f) => {
        const Icon = f.icon;
        const isActive = active === f.key;
        return (
          <motion.button
            key={f.key}
            onClick={() => onChange(f.key)}
            whileTap={{ scale: 0.93 }}
            className="flex items-center gap-1.5 whitespace-nowrap transition-all"
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              background: isActive ? '#3d5a36' : '#ffffff',
              color: isActive ? '#ffffff' : '#57534e',
              border: isActive ? 'none' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <Icon size={13} />
            {f.label}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

/* ── Pull-to-refresh wrapper (simplified) ── */
function usePullToRefresh(onRefresh) {
  const [pulling, setPulling] = useState(false);
  const startY = useRef(0);
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const onTouchStart = (e) => { startY.current = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      const y = e.touches[0].clientY;
      if (el.scrollTop === 0 && y - startY.current > 80) {
        setPulling(true);
      }
    };
    const onTouchEnd = () => {
      if (pulling) {
        setPulling(false);
        onRefresh();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [pulling, onRefresh]);

  return { elRef, pulling };
}

function HeroSection({ housesCount, othersCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mb-6 overflow-hidden relative p-5 bg-white rounded-2xl border border-black/[0.06] shadow-sm">
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-moss-700">
              <TreePine size={24} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-ink leading-tight tracking-tight">Добро пожаловать в Олтуш</h2>
            </div>
          </div>
          <p className="text-[14px] leading-relaxed mb-4 text-warm-600">
            8 современных домиков, баня и купель на дровах, крытая беседка на 40 человек — всё среди сосен в 7–10 минутах от песчаного Олтушского озера.
          </p>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-moss-100 text-moss-700">
              <Home size={13} />
              <span>{housesCount} домиков</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-wood-100 text-wood-700">
              <Flame size={13} />
              <span>{othersCount} услуги</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MapView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await fetchItems();
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const doRefresh = () => {
    setRefreshing(true);
    load();
  };

  const { elRef, pulling } = usePullToRefresh(doRefresh);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);
  const houses = filtered.filter(i => i.type === 'house');
  const others = filtered.filter(i => i.type !== 'house');

  if (loading) return <LoadingSkeleton />;

  return (
    <div ref={elRef} className="animate-fade-in pb-24">
      {/* Pull-to-refresh visual */}
      <AnimatePresence>
        {pulling && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 48 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-2 text-sm font-medium overflow-hidden" style={{ color: 'rgba(90,124,82,0.8)' }}
          >
            <RefreshCw size={18} className="animate-spin" />
            Отпустите для обновления...
          </motion.div>
        )}
      </AnimatePresence>

      <HeroSection
        housesCount={items.filter(i => i.type === 'house').length}
        othersCount={items.filter(i => i.type !== 'house').length}
      />

      {/* Refresh indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-2 py-2 text-sm font-medium" style={{ color: 'rgba(90,124,82,0.8)' }}
          >
            <RefreshCw size={16} className="animate-spin" />
            Обновление...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seasonal offer */}
      <SeasonOffer items={items} />

      {/* Filters */}
      <FilterBar active={filter} onChange={setFilter} />

      {/* Houses */}
      {houses.length > 0 && (
        <>
          <SectionTitle title="Домики" subtitle="Уютные деревянные домики для комфортного отдыха" delay={0.1} />
          <motion.div
            className="grid grid-cols-2 gap-3 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            layout
          >
            {houses.map((house) => (
              <ItemCard key={house.id} item={house} />
            ))}
          </motion.div>
        </>
      )}

      {/* Others */}
      {others.length > 0 && (
        <>
          <SectionTitle title="Дополнительно" subtitle="Баня, купель и другие услуги" delay={0.2} />
          <motion.div
            className="space-y-3 mb-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            layout
          >
            {others.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </motion.div>
        </>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-warm-400">
          <Filter size={32} className="mx-auto mb-3" />
          <p className="font-medium">Нет объектов выбранного типа</p>
        </div>
      )}

      {/* Territory Map */}
      <BaseMap items={items} />
    </div>
  );
}
