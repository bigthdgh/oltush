import React from 'react';
import { motion } from 'framer-motion';
import { Check, Flame, Droplets, UtensilsCrossed, Wifi, Car } from 'lucide-react';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

const DEFAULT_ADDONS = [
  { id: 'sauna', name: 'Баня с веником', description: '2 часа с дровами и простынями', price: 60, icon: Flame },
  { id: 'tub', name: 'Купель с подогревом', description: '1 час, температура на выбор', price: 40, icon: Droplets },
  { id: 'bbq', name: 'Мангал + дрова', description: 'Решётка, шампуры, уголь', price: 25, icon: UtensilsCrossed },
  { id: 'wifi', name: 'Wi-Fi Premium', description: 'Высокоскоростной интернет', price: 10, icon: Wifi },
  { id: 'transfer', name: 'Трансфер', description: 'Встреча в Бресте, до 4 чел.', price: 50, icon: Car },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export default function AddonsStep({ addons, selected, onToggle, baseTotal }) {
  const addonsTotal = selected.reduce((sum, a) => sum + a.price, 0);
  const total = baseTotal + addonsTotal;
  const animatedTotal = useAnimatedCounter(total);
  const animatedAddons = useAnimatedCounter(addonsTotal);

  const items = addons.length ? addons : DEFAULT_ADDONS;

  return (
    <div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3 mb-6"
      >
        {items.map((addon) => {
          const isSelected = selected.find(a => a.id === addon.id);
          const Icon = addon.icon || Check;

          return (
            <motion.button
              key={addon.id}
              variants={itemVariants}
              whileTap={{ scale: 0.97 }}
              onClick={() => onToggle(addon)}
              className={`w-full text-left p-4 rounded-2xl border-1.5 transition-all duration-200 flex items-center gap-3 ${
                isSelected
                  ? 'bg-forest-50/90 border-forest-300 shadow-sm shadow-forest-200/80 ring-1 ring-forest-200'
                  : 'bg-white/70 border-forest-100/60 hover:bg-white/90 hover:border-forest-200 hover:shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? 'gradient-forest' : 'bg-forest-100'
              }`}>
                {isSelected ? (
                  <Check size={18} className="text-white" />
                ) : (
                  <Icon size={18} className="text-forest-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-forest-900 text-sm">{addon.name}</p>
                <p className="text-xs text-forest-500 mt-0.5">{addon.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] uppercase tracking-wide text-forest-400 mb-0.5">+
                  <span className="font-semibold text-forest-700">{addon.price} BYN</span>
                </p>
                {isSelected && (
                  <p className="text-[10px] text-forest-500 font-medium">добавлено</p>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Totals */}
      <div className="glass rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-forest-500">Проживание</span>
          <span className="font-semibold text-forest-900">{baseTotal} BYN</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-forest-500">Доп. услуги</span>
          <span className="font-semibold text-forest-900">{animatedAddons} BYN</span>
        </div>
        <div className="h-px bg-forest-100 my-1" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-forest-900">Итого</span>
          <motion.span
            key={total}
            className="text-2xl font-extrabold text-wood-600"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {animatedTotal} BYN
          </motion.span>
        </div>
      </div>
    </div>
  );
}
