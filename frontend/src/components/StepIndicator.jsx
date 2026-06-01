import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function StepIndicator({ currentStep, totalSteps, labels = [] }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={i} className="flex items-center gap-1.5">
            <div className="relative flex items-center justify-center">
              {/* Base dot */}
              <div
                className={`step-dot rounded-full transition-colors duration-300 ${
                  isCompleted ? 'bg-forest-500' : isActive ? 'bg-forest-200' : 'bg-forest-200/50'
                }`}
                style={{ width: isActive ? 24 : 8, height: isActive ? 24 : 8 }}
              />
              {/* Active indicator with layoutId */}
              {isActive && (
                <motion.div
                  layoutId="active-step"
                  className="absolute inset-0 rounded-full gradient-forest flex items-center justify-center shadow-md shadow-forest-700/20"
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                  <span className="text-white text-[10px] font-bold">{i + 1}</span>
                </motion.div>
              )}
              {/* Completed check */}
              {isCompleted && !isActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
            {labels[i] && isActive && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="text-xs font-semibold text-forest-700 uppercase tracking-wider ml-0.5"
              >
                {labels[i]}
              </motion.span>
            )}
            {i < totalSteps - 1 && (
              <div
                className={`w-4 h-[2px] rounded-full transition-colors duration-300 ${
                  isCompleted ? 'bg-forest-400' : 'bg-forest-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
