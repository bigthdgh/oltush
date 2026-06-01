import { useState, useEffect, useRef } from 'react';

export function useAnimatedCounter(target, duration = 600) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevTarget.current;
    const end = target;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = start + (end - start) * eased;
      setValue(Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevTarget.current = end;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}
