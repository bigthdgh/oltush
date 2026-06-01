import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageLightbox({ photos, activeIndex, isOpen, onClose, onIndexChange }) {
  const current = photos[activeIndex];

  const goNext = useCallback(() => {
    onIndexChange((activeIndex + 1) % photos.length);
  }, [activeIndex, photos.length, onIndexChange]);

  const goPrev = useCallback(() => {
    onIndexChange((activeIndex - 1 + photos.length) % photos.length);
  }, [activeIndex, photos.length, onIndexChange]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, goNext, goPrev]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
          onClick={onClose}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-white/60 text-sm font-medium">
              {activeIndex + 1} / {photos.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center active:bg-black/60 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Image with drag */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={activeIndex}
                src={current.url}
                alt={current.caption || `Фото ${activeIndex + 1}`}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.35 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) goNext();
                  else if (info.offset.x > 80) goPrev();
                }}
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?w=800&q=80';
                }}
                className="max-w-full max-h-[80vh] object-contain select-none"
              />
            </AnimatePresence>

            {/* Side arrows (desktop / large tap targets) */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center active:bg-black/60 transition-colors"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center active:bg-black/60 transition-colors"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </>
            )}
          </div>

          {/* Bottom caption + dots */}
          <div className="px-4 pb-6 pt-2">
            {current.caption && (
              <p className="text-center text-white/80 text-sm font-medium mb-3">{current.caption}</p>
            )}
            <div className="flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onIndexChange(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
