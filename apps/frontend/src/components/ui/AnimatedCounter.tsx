import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

export const AnimatedCounter = ({ value, duration = 3, suffix = '', decimals = 0 }: { value: number, duration?: number, suffix?: string, decimals?: number }) => {
  const valueRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(valueRef, { once: true, margin: "-10%" });

  useEffect(() => {
    if (inView && valueRef.current) {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        const currentVal = progress * value;
        if (valueRef.current) valueRef.current.textContent = currentVal.toFixed(decimals) + suffix;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          if (valueRef.current) valueRef.current.textContent = value.toFixed(decimals) + suffix;
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [inView, value, duration, suffix, decimals]);

  return <span ref={valueRef}>0{suffix}</span>;
};
