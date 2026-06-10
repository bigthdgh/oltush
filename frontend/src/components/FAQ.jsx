import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Calendar, CreditCard, MapPin, Shield, Phone,
  ChevronDown, TreePine
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { EASE_OUT_QUINT } from '../animations';

const categories = [
  {
    id: 'prices',
    label: 'Цены',
    icon: CreditCard,
    items: [
      {
        q: 'Сколько стоит домик?',
        a: 'Домики (до 4 гостей):\n• Будни (Вс – Чт) — 250 BYN/сутки\n• Выходные (Пт – Сб) и праздники — 300 BYN/сутки',
      },
      {
        q: 'Сколько стоит баня и купель?',
        a: 'Баня на дровах (до 8 чел.):\n• 3 часа — 120 BYN\n• Продление — 40 BYN/час\n\nКупель на дровах (до 4 чел.):\n• 3 часа — 150 BYN\n• Продление — 50 BYN/час',
      },
      {
        q: 'Аренда беседки и пакет «Всё включено»',
        a: 'Большая беседка с гриль-зоной (до 40 чел.) — 300 BYN/день.\n\nПакет «Всё включено» (вся база целиком):\n• Будни — 2500 BYN/сутки\n• Выходные — 3000 BYN/сутки\nВходит: 7 домиков, баня, купель, беседка, территория, постельное бельё, дрова.',
      },
    ],
  },
  {
    id: 'booking',
    label: 'Бронирование',
    icon: Calendar,
    items: [
      {
        q: 'Как забронировать?',
        a: 'Выберите объект, укажите даты, заполните контактные данные и подтвердите бронирование. Подтверждение придёт в Telegram.',
      },
      {
        q: 'Время заезда и выезда',
        a: '• Заезд (Check-in) — с 15:00\n• Выезд (Check-out) — до 12:00\nРанний заезд или поздний выезд — по согласованию с администратором.',
      },
      {
        q: 'Какое минимальное количество ночей?',
        a: '• Будни — минимум 1 ночь\n• Выходные и праздники — минимум 2 ночи',
      },
      {
        q: 'Условия предоплаты и отмены',
        a: '• Предоплата — 50% при бронировании\n• Остаток — при заезде\n• Отмена за 14+ дней — возможен перенос\n• Отмена менее чем за 14 дней — предоплата не возвращается\n• Досрочный выезд — деньги за неиспользованные сутки не возвращаются',
      },
    ],
  },
  {
    id: 'territory',
    label: 'Территория',
    icon: MapPin,
    items: [
      {
        q: 'Что есть на территории базы?',
        a: '• 8 современных домиков с террасами\n• Русская баня на дровах\n• Купель на дровах под открытым небом\n• Крытая беседка до 40 человек с гриль-зоной\n• Песчаное Олтушское озеро в 7–10 минутах ходьбы\n• Бесплатный Wi-Fi на всей территории\n• Бесплатная охраняемая парковка',
      },
      {
        q: 'Что внутри домика?',
        a: '• 4 односпальные кровати\n• Постельное бельё, полотенца (по 3 на гостя)\n• ТВ, холодильник, электрический чайник\n• Полный комплект посуды и столовых приборов\n• Санузел с горячей водой\n• Напольный радиатор (отопление)\n• Одноразовые тапочки\n• Wi-Fi',
      },
      {
        q: 'Можно ли разводить костёр?',
        a: 'Огонь разрешён только в мангалах. Дрова можно приобрести на месте. Костры на земле и вблизи деревьев запрещены.',
      },
    ],
  },
  {
    id: 'rules',
    label: 'Правила',
    icon: Shield,
    items: [
      {
        q: 'Три жёстких запрета (расторжение без возврата)',
        a: '1. Курение внутри домиков, бани и беседки — любые сигареты, кальяны, вейпы, IQOS, glo. Курить можно только на улице в отведённых местах.\n2. Пиротехника (салюты, фейерверки, петарды, бенгальские огни, китайские фонарики) — только с письменного разрешения администрации.\n3. Домашние животные — запрещены на территории.',
      },
      {
        q: 'Режим тишины и общий порядок',
        a: '• Тихий час — с 23:00 до 08:00\n• Не ломать ветки, не портить зелёные насаждения\n• Мусор после отдыха собирать в пакеты и выносить в контейнеры\n• Администрация не отвечает за вещи, оставленные без присмотра',
      },
      {
        q: 'Правила бани и купели',
        a: '• В бане — не более 8 человек одновременно\n• Дети — только под контролем родителей\n• В парной — без стекла и пластика\n• Крепкий алкоголь в парной и купель запрещён\n• Не используйте едкую косметику, способную испортить дерево или воду\n• Осторожно — не касайтесь горячих элементов печи',
      },
      {
        q: 'Пожарная безопасность',
        a: '• Огонь — только в мангалах, никаких костров на земле\n• Разрешённые материалы: дрова, уголь, сертифицированные жидкости. Пластик и мусор жечь запрещено.\n• Не оставляйте мангал без присмотра — заливайте угли водой до полного затухания\n• Неисправные и самодельные обогреватели запрещены\n• При выходе из домика выключайте свет и электроприборы (кроме холодильника)',
      },
      {
        q: 'Поведение на озере и пляже',
        a: '• Дети купаются только под присмотром взрослых\n• Не прыгайте с мостиков, лодок, катамаранов и в неизвестных местах\n• Не заплывайте за буйки и не приближайтесь к движущимся плавсредствам\n• Купание в нетрезвом состоянии запрещено\n• Не засоряйте водоём и пляж',
      },
      {
        q: 'Материальная ответственность',
        a: 'Гость несёт 100% ответственность за сохранность построек, мебели, техники, посуды и прокатного инвентаря (сапы, лодки, жилеты, вёсла). При поломке, утере или порче — полная компенсация по стоимости администрации.\n\nПри аварийных ситуациях, задымлениях или конфликтах — немедленно вызывайте дежурного администратора.',
      },
    ],
  },
  {
    id: 'contacts',
    label: 'Контакты',
    icon: Phone,
    items: [
      {
        q: 'Адрес',
        a: 'ул. Советская, 124, агрогородок Олтуш, Малоритский район, Брестская область, Республика Беларусь',
      },
      {
        q: 'Телефон и мессенджеры',
        a: '• Телефон: +375-29-668-89-44\n• E-mail: bazaoltush@gmail.com\n• Telegram, WhatsApp, Viber — по номеру телефона',
      },
      {
        q: 'Социальные сети',
        a: 'TikTok, Instagram, ВКонтакте, YouTube — ищите «База отдыха Олтуш».',
      },
    ],
  },
];

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-warm-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className={`text-sm font-bold pr-3 transition-colors duration-300 ${isOpen ? 'text-moss-600' : 'text-warm-600 group-hover:text-moss-600'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`shrink-0 transition-colors duration-300 ${isOpen ? 'text-moss-600' : 'text-warm-400'}`}
        >
          <ChevronDown size={17} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
            className="overflow-hidden"
          >
            <p className="text-sm leading-relaxed pb-4 pr-6 whitespace-pre-wrap text-warm-500">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('booking');
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (catId, itemIdx) => {
    const key = `${catId}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCat = categories.find(c => c.id === activeCategory);
  const CatIcon = activeCat?.icon || HelpCircle;

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
      >
        <GlassCard className="mb-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center gradient-forest shadow-forest">
            <HelpCircle size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-ink tracking-tight">Помощь</h2>
            <p className="text-sm text-moss-500">Часто задаваемые вопросы</p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto hide-scrollbar pb-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setOpenItems({}); }}
              whileTap={{ scale: 0.93 }}
              className={`flex items-center gap-1.5 whitespace-nowrap transition-all px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isActive
                  ? 'bg-moss-700 text-white shadow-forest'
                  : 'bg-warm-200 text-warm-500 hover:bg-warm-300 hover:text-warm-600'
              }`}
            >
              <Icon size={13} />
              {cat.label}
            </motion.button>
          );
        })}
      </div>

      {/* Questions */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
      >
        <GlassCard>
          <div className="flex items-center gap-2 mb-2 pb-3 border-b border-warm-200">
            <CatIcon size={17} className="text-moss-600" />
            <h3 className="font-black text-ink text-[15px]">{activeCat?.label}</h3>
          </div>
          <AnimatePresence mode="popLayout">
            {activeCat?.items.map((item, idx) => (
              <motion.div
                key={`${activeCategory}-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.4, ease: EASE_OUT_QUINT }}
              >
                <AccordionItem
                  question={item.q}
                  answer={item.a}
                  isOpen={!!openItems[`${activeCategory}-${idx}`]}
                  onToggle={() => toggleItem(activeCategory, idx)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* Contact hint */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT_QUINT }}
        className="mt-6"
      >
        <div className="text-center py-6">
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-moss-100"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TreePine size={28} className="text-moss-600" />
          </motion.div>
          <p className="font-bold text-ink text-sm mb-1">Не нашли ответ?</p>
          <p className="text-xs text-warm-500 mb-3">Напишите нам — ответим в течение часа</p>
          <a
            href="https://t.me/bazaoltush"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 transition-colors shadow-md"
          >
            <Phone size={14} />
            Написать в Telegram
          </a>
        </div>
      </motion.div>
    </div>
  );
}
