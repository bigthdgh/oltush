export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1];
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT_QUART = [0.76, 0, 0.24, 1];

export const springSoft = {
  type: 'spring',
  stiffness: 120,
  damping: 18,
  mass: 0.8,
};

export const springMedium = {
  type: 'spring',
  stiffness: 180,
  damping: 22,
  mass: 0.9,
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE_OUT_QUINT },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.45, ease: EASE_OUT_QUINT },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: EASE_OUT_QUINT },
};

export const slideInRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: EASE_OUT_QUINT },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: EASE_OUT_QUINT },
};

export const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
  transition: { duration: 0.45, ease: EASE_OUT_QUINT },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT_QUINT },
  },
};

export const hoverLift = {
  whileHover: { y: -4, scale: 1.02, transition: springSoft },
  whileTap: { scale: 0.97, transition: { duration: 0.15 } },
};

export const navSpring = {
  type: 'spring',
  stiffness: 280,
  damping: 28,
  mass: 0.6,
};

export const imageHover = {
  whileHover: { scale: 1.06, transition: { duration: 0.5, ease: EASE_OUT_QUINT } },
};
