import React from 'react';
import { motion } from 'framer-motion';

export function GlassCard({ children, className = '', strong = false, hover = false, onClick, as = 'div' }) {
  const baseClasses = `
    bg-white border border-black/[0.06] rounded-2xl p-5
    ${strong ? 'shadow-sm' : ''}
    ${hover ? 'card-lift cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  if (as === 'motion') {
    return (
      <motion.div className={baseClasses} onClick={onClick} whileTap={onClick ? { scale: 0.98 } : undefined}>
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
}
