import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export const SpotlightCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-900/80 to-[#010309] border border-white/5 shadow-2xl ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-30 mix-blend-overlay"
        style={{ opacity, background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.2), transparent 40%)` }}
      />
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-0"
        style={{ opacity, background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(59,130,246,0.15), transparent 40%)` }}
      />
      {children}
    </motion.div>
  );
};


