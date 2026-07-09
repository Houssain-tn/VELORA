import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const ParticleNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    
    const particles: {x: number, y: number, vx: number, vy: number}[] = [];
    for(let i=0; i<80; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }

    let mouse = { x: -1000, y: -1000 };
    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);

    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if(p.x < 0 || p.x > w) p.vx *= -1;
        if(p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        particles.forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 - dist/1000})`;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });

        const dxm = p.x - mouse.x;
        const dym = p.y - mouse.y;
        const distm = Math.sqrt(dxm*dxm + dym*dym);
        if (distm < 150) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(59, 130, 246, ${1 - distm/150})`;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
          
          p.x += dxm * 0.01;
          p.y += dym * 0.01;
        }
      });
      animationId = window.requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" />;
};

export const MeshBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-[#010309]" />
    {/* Grid Lines */}
    <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(to right, #3b82f6 1px, transparent 1px)', backgroundSize: '100px 100%' }} />
    <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(to bottom, #3b82f6 1px, transparent 1px)', backgroundSize: '100% 100px' }} />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#010309]/80 to-[#010309]" />

    {/* Particle Network Canvas */}
    <ParticleNetwork />

    {/* Dynamic Fluid Orbs */}
    <motion.div animate={{ x: [-50, 50, -50], y: [-20, 20, -20] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-blue-600/15 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
    <motion.div animate={{ x: [50, -50, 50], y: [20, -20, 20] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 mix-blend-screen" />
  </div>
);
