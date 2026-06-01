import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X } from 'lucide-react';

export default function BookingQRCode({ bookingId }) {
  const [open, setOpen] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `${window.location.origin}/booking/${bookingId}`
  )}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center hover:bg-forest-200 transition-colors"
        title="QR-код брони"
      >
        <QrCode size={16} className="text-forest-700" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-forest-900">QR-код брони</h4>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center hover:bg-forest-200 transition-colors"
                >
                  <X size={16} className="text-forest-700" />
                </button>
              </div>
              <img
                src={qrUrl}
                alt="QR код брони"
                className="w-48 h-48 mx-auto rounded-2xl border-2 border-forest-100"
              />
              <p className="text-xs text-forest-500 mt-3 font-medium">
                Покажите этот код администратору при заезде
              </p>
              <p className="text-xs text-forest-400 mt-1">
                Бронь #{bookingId}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
