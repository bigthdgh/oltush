import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Ban, CheckCircle2 } from 'lucide-react';

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function isDateInRange(date, start, end) {
  if (!start || !end) return false;
  const d = startOfDay(date);
  const s = startOfDay(new Date(start));
  const e = startOfDay(new Date(end));
  return d > s && d < e;
}

function isDateEqual(date, str) {
  if (!str) return false;
  return isSameDay(date, new Date(str));
}

export default function CalendarPicker({
  busyDates = [],
  selectedMonth: propMonth,
  onMonthChange,
  startDate,
  endDate,
  onSelectRange,
  minNights = 1,
}) {
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date());

  const monthDate = propMonth ? new Date(propMonth + '-01') : viewMonth;

  const handlePrevMonth = () => {
    const prev = addMonths(monthDate, -1);
    if (propMonth && onMonthChange) {
      onMonthChange(format(prev, 'yyyy-MM'));
    } else {
      setViewMonth(prev);
    }
  };

  const handleNextMonth = () => {
    const next = addMonths(monthDate, 1);
    if (propMonth && onMonthChange) {
      onMonthChange(format(next, 'yyyy-MM'));
    } else {
      setViewMonth(next);
    }
  };

  const days = useMemo(() => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  const monthStart = startOfMonth(monthDate);
  const startWeekday = (monthStart.getDay() + 6) % 7;

  const handleDayClick = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (isBusy(day)) return;
    if (isBefore(day, today)) return;

    if (!startDate || (startDate && endDate)) {
      onSelectRange(dateStr, '');
    } else if (startDate && !endDate) {
      if (dateStr < startDate) {
        onSelectRange(dateStr, '');
      } else {
        // Check if range contains busy dates
        const start = new Date(startDate);
        const end = new Date(dateStr);
        let hasBusy = false;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (isBusy(d)) { hasBusy = true; break; }
        }
        if (!hasBusy) {
          const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
          if (nights === 0 || nights >= minNights) {
            onSelectRange(startDate, dateStr);
          } else {
            onSelectRange(dateStr, '');
          }
        }
      }
    }
  };

  const isBusy = (day) => {
    const str = format(day, 'yyyy-MM-dd');
    return busyDates.includes(str);
  };

  const getDayClass = (day) => {
    const busy = isBusy(day);
    const past = isBefore(day, today);
    const selectedStart = isDateEqual(day, startDate);
    const selectedEnd = isDateEqual(day, endDate);
    const inRange = isDateInRange(day, startDate, endDate);

    // Base cell style
    let base = 'aspect-[4/3] rounded-2xl flex items-center justify-center text-[11px] font-medium transition-all duration-200 relative overflow-hidden';

    if (past) {
      return `${base} text-forest-300 cursor-not-allowed opacity-50`;
    }
    if (busy) {
      return `${base} bg-red-50/60 text-red-400 cursor-not-allowed border border-red-100/60`;
    }
    if (selectedStart || selectedEnd) {
      return `${base} bg-gradient-to-br from-forest-600 to-forest-700 text-white shadow-md shadow-forest-600/25 font-bold scale-105 z-10`;
    }
    if (inRange) {
      return `${base} bg-forest-100/70 text-forest-800 font-semibold`;
    }
    if (isToday(day)) {
      return `${base} text-forest-700 font-bold ring-1.5 ring-forest-400 ring-offset-1 bg-white`;
    }
    return `${base} text-forest-700 hover:bg-moss-100 hover:scale-105 hover:shadow-sm cursor-pointer active:scale-95 bg-moss-50 border border-moss-200`;
  };

  const monthLabel = format(monthDate, 'LLLL yyyy', { locale: ru });

  return (
    <div className="w-full overflow-hidden">
      {/* Glass card wrapper */}
      <div className="surface rounded-3xl p-4 border border-moss-100/60 shadow-sm">
        {/* Month header */}
        <div className="flex items-center justify-between mb-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl bg-forest-100/60 flex items-center justify-center text-forest-600 hover:bg-forest-200/60 transition-colors"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-forest-500" />
            <span className="font-bold text-forest-900 text-sm capitalize">{monthLabel}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl bg-forest-100/60 flex items-center justify-center text-forest-600 hover:bg-forest-200/60 transition-colors"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((wd) => (
            <div key={wd} className="text-center text-[9px] font-bold uppercase tracking-widest text-forest-400 py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-[3px]">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          <AnimatePresence>
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const cls = getDayClass(day);
              const busy = isBusy(day);
              const past = isBefore(day, today);

              return (
                <motion.button
                  key={dateStr}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  whileTap={!busy && !past ? { scale: 0.95 } : {}}
                  onClick={() => handleDayClick(day)}
                  disabled={busy || past}
                  className={cls}
                >
                  {busy && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Ban size={10} className="text-red-500" />
                    </div>
                  )}
                  <span className="relative z-10">{format(day, 'd')}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Animated Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-3 mt-3"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-moss-100/60"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-3 h-3 rounded-full bg-moss-600 shadow-sm"
          />
          <CheckCircle2 size={12} className="text-moss-500" />
          <span className="text-[10px] font-semibold text-moss-600">Выбрано</span>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-red-100/60"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-3 h-3 rounded-full bg-red-400 shadow-sm"
          />
          <Ban size={12} className="text-red-400" />
          <span className="text-[10px] font-semibold text-red-500">Занято</span>
        </motion.div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-moss-100/60">
          <div className="w-3 h-3 rounded-full bg-moss-200" />
          <span className="text-[10px] font-semibold text-moss-500">Свободно</span>
        </div>
      </motion.div>

      {/* Selected range display */}
      <AnimatePresence>
        {(startDate || endDate) && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="p-3 rounded-2xl bg-moss-50 border border-moss-100/60 flex items-center justify-between">
              <p className="text-sm text-forest-700 font-medium">
                <span className="font-bold">{startDate ? format(new Date(startDate), 'd MMM', { locale: ru }) : '—'}</span>
                {' — '}
                <span className="font-bold">{endDate ? format(new Date(endDate), 'd MMM', { locale: ru }) : '—'}</span>
              </p>
              {startDate && endDate && (
                <span className="text-xs font-bold text-wood-600 bg-white/70 px-2.5 py-1 rounded-xl">
                  {Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} ночей
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
