'use client';

import React, { useEffect, useRef, useState } from 'react';

export type BackgroundVariant = 
  | 'portal' 
  | 'owner' 
  | 'tenant' 
  | 'warden' 
  | 'dashboard' 
  | 'rooms' 
  | 'tenants' 
  | 'payments' 
  | 'attendance' 
  | 'complaints' 
  | 'reports' 
  | 'settings';

interface LiveBackgroundProps {
  variant?: BackgroundVariant;
  className?: string;
}

export default function LiveBackground({ variant = 'dashboard', className = '' }: LiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Sync theme mode & prefers-reduced-motion
  useEffect(() => {
    const checkDark = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    checkDark();

    const observer = new MutationObserver(() => checkDark());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth >= 768) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // 60 FPS HTML5 Canvas Background Loop (GPU accelerated 2D context)
  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const isMobile = width < 768;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let step = 0;

    // Node & Particle setup for network/data variants
    const particleCount = isMobile ? 12 : 28;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
    }));

    const render = () => {
      step += 0.005;
      ctx.clearRect(0, 0, width, height);

      // --- VARIANT 1: PORTAL (Silk Mesh Ribbons) ---
      if (variant === 'portal') {
        const ribbons = [
          {
            yOffset: height * 0.4,
            amplitude: 90,
            frequency: 0.002,
            color1: isDarkMode ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.15)',
            color2: isDarkMode ? 'rgba(56, 199, 217, 0.3)' : 'rgba(56, 199, 217, 0.15)',
            speed: step * 0.8,
          },
          {
            yOffset: height * 0.6,
            amplitude: 110,
            frequency: 0.0015,
            color1: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.12)',
            color2: isDarkMode ? 'rgba(217, 70, 239, 0.25)' : 'rgba(217, 70, 239, 0.12)',
            speed: step * 1.1,
          },
        ];

        ribbons.forEach((r) => {
          ctx.beginPath();
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, r.color1);
          grad.addColorStop(1, r.color2);
          ctx.fillStyle = grad;

          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 20) {
            const y =
              r.yOffset +
              Math.sin(x * r.frequency + r.speed) * r.amplitude +
              Math.cos(x * 0.001 + r.speed * 0.5) * (r.amplitude * 0.5);
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        });
      }

      // --- VARIANT 2: OWNER / DASHBOARD / ROOMS (Grid & Architectural Light Paths) ---
      else if (variant === 'owner' || variant === 'dashboard' || variant === 'rooms') {
        const gridSpacing = isMobile ? 80 : 100;
        ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
        ctx.lineWidth = 1;

        // Faint Architectural Grid
        for (let x = 0; x < width; x += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Traveling Light Beam Lines
        const beamY = (Math.sin(step) * 0.5 + 0.5) * height;
        const beamX = (Math.cos(step * 0.7) * 0.5 + 0.5) * width;
        
        ctx.beginPath();
        const beamGrad = ctx.createRadialGradient(beamX, beamY, 10, beamX, beamY, 250);
        beamGrad.addColorStop(0, isDarkMode ? 'rgba(56, 199, 217, 0.15)' : 'rgba(37, 99, 235, 0.1)');
        beamGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // --- VARIANT 3: TENANTS / COMPLAINTS (Connected Node Network) ---
      else if (variant === 'tenants' || variant === 'complaints' || variant === 'warden') {
        // Move particles
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = isDarkMode ? 'rgba(56, 199, 217, 0.4)' : 'rgba(37, 99, 235, 0.3)';
          ctx.fill();
        });

        // Draw connections between nearby nodes
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              const opacity = (1 - dist / 150) * 0.15;
              ctx.strokeStyle = isDarkMode 
                ? `rgba(56, 199, 217, ${opacity})` 
                : `rgba(37, 99, 235, ${opacity})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      // --- VARIANT 4: PAYMENTS / ATTENDANCE / REPORTS (Data Flow Waves & Curves) ---
      else if (variant === 'payments' || variant === 'attendance' || variant === 'reports') {
        ctx.beginPath();
        const waveY = height * 0.5;
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 199, 217, 0.15)' : 'rgba(37, 99, 235, 0.1)';
        ctx.lineWidth = 1.5;

        for (let x = 0; x <= width; x += 30) {
          const y = waveY + Math.sin(x * 0.003 + step * 1.5) * 60 + Math.cos(x * 0.0015 + step) * 40;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Pulsing data points on curve
        const pulseX = (step * 200) % width;
        const pulseY = waveY + Math.sin(pulseX * 0.003 + step * 1.5) * 60 + Math.cos(pulseX * 0.0015 + step) * 40;
        
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 4, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode ? '#38C7D9' : '#2563EB';
        ctx.shadowBlur = 10;
        ctx.shadowColor = isDarkMode ? '#38C7D9' : '#2563EB';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // --- VARIANT 5: SETTINGS / DEFAULT (Minimal Ambient Pulse) ---
      else {
        const pulseX = width * 0.5 + Math.sin(step * 0.5) * 100;
        const pulseY = height * 0.5 + Math.cos(step * 0.5) * 100;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(pulseX, pulseY, 20, pulseX, pulseY, 350);
        grad.addColorStop(0, isDarkMode ? 'rgba(37, 99, 235, 0.12)' : 'rgba(37, 99, 235, 0.06)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant, isDarkMode, reducedMotion]);

  // Parallax offset values
  const parallaxX = (mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * 0.01;
  const parallaxY = (mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * 0.01;

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-700 ${className}`}>
      
      {/* LAYER 1: DEEP BASE COLOR */}
      <div className={`absolute inset-0 transition-colors duration-700 ${
        isDarkMode ? 'bg-[#020306]' : 'bg-[#F1F5F9]'
      }`} />

      {/* LAYER 2: SLOW-MOVING AMBIENT LIGHT GRADIENT SPOTS */}
      <div 
        style={{
          transform: `translate3d(${parallaxX * 2}px, ${parallaxY * 2}px, 0)`,
          transition: 'transform 0.2s ease-out'
        }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className={`absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-700 animate-[pulse_8s_infinite] ${
          isDarkMode ? 'bg-[#2563EB]/15' : 'bg-[#2563EB]/10'
        }`} />
        <div className={`absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-[140px] transition-all duration-700 animate-[pulse_10s_infinite] ${
          isDarkMode ? 'bg-[#38C7D9]/15' : 'bg-[#0284C7]/08'
        }`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px] transition-all duration-700 ${
          isDarkMode ? 'bg-[#8B5CF6]/10' : 'bg-[#8B5CF6]/05'
        }`} />
      </div>

      {/* LAYER 3 & 4: 60 FPS CANVAS RENDERING LOOP */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-80 backdrop-blur-3xl"
      />

      {/* LAYER 5: READABILITY OVERLAY BEHIND CONTENT */}
      <div className={`absolute inset-0 pointer-events-none backdrop-blur-[1px] ${
        isDarkMode ? 'bg-gradient-to-b from-[#020306]/40 via-transparent to-[#020306]/60' : 'bg-gradient-to-b from-white/40 via-transparent to-white/60'
      }`} />

    </div>
  );
}
