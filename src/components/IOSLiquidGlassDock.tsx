'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform, PanInfo } from 'framer-motion';

interface DockItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface IOSLiquidGlassDockProps {
  items: DockItem[];
  layoutId: string;
}

export default function IOSLiquidGlassDock({ items, layoutId }: IOSLiquidGlassDockProps) {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Active index based on current URL path
  const activeRouteIndex = items.findIndex(item => item.href === pathname);
  const initialIndex = activeRouteIndex >= 0 ? activeRouteIndex : 0;

  // Real-time Motion Value for continuous touch tracking
  const touchIndex = useMotionValue(initialIndex);
  
  // Responsive, fluid liquid spring physics
  const springIndex = useSpring(touchIndex, {
    stiffness: 650,
    damping: 35,
    mass: 0.5
  });

  const [isSliding, setIsSliding] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialIndex);

  // Sync touchIndex with URL route when user is not actively sliding
  useEffect(() => {
    if (!isSliding) {
      touchIndex.set(initialIndex);
      setCurrentSlideIndex(initialIndex);
    }
  }, [initialIndex, isSliding, touchIndex]);

  // Convert tab index float (0.0 to N-1) into CSS percentage left offset
  const itemWidthPercent = 100 / items.length;
  const bubbleLeftPercent = useTransform(springIndex, val => `${val * itemWidthPercent}%`);

  const updateTouchIndexFromPoint = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rect.width, relativeX));
    const rawIndex = (clampedX / rect.width) * items.length - 0.5;
    const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
    
    touchIndex.set(clampedIndex);
    setCurrentSlideIndex(Math.round(clampedIndex));
  };

  const handlePanStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSliding(true);
    updateTouchIndexFromPoint(info.point.x);
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    updateTouchIndexFromPoint(info.point.x);
  };

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSliding(false);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = info.point.x - rect.left;
    const clampedX = Math.max(0, Math.min(rect.width, relativeX));
    const rawIndex = (clampedX / rect.width) * items.length - 0.5;
    const nearestIndex = Math.max(0, Math.min(items.length - 1, Math.round(rawIndex)));

    touchIndex.set(nearestIndex);
    setCurrentSlideIndex(nearestIndex);

    // Navigate to selected target route
    if (items[nearestIndex] && items[nearestIndex].href !== pathname) {
      router.push(items[nearestIndex].href);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-[9999] md:hidden pointer-events-auto">
      <motion.div
        ref={containerRef}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        whileTap={{ scale: 0.98 }}
        className="relative liquid-glass-dock rounded-[2.5rem] p-1.5 flex items-center justify-between select-none touch-none cursor-grab active:cursor-grabbing overflow-hidden"
      >
        {/* iOS Specular Top Reflection Rim */}
        <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none rounded-full" />
        
        {/* Direct Touch-Sliding Liquid Glass Bubble Pill */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 bg-blue-600/20 dark:bg-blue-500/30 border border-blue-500/40 dark:border-blue-400/50 rounded-[2rem] shadow-md z-0 pointer-events-none"
          style={{
            left: bubbleLeftPercent,
            width: `${itemWidthPercent}%`,
            scaleX: isSliding ? 1.12 : 1,
            transformOrigin: 'center center'
          }}
          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        >
          {/* Inner Liquid Ambient Glow */}
          <div className="absolute inset-0 bg-blue-400/10 rounded-[2rem] blur-xs pointer-events-none" />
        </motion.div>

        {/* Dock Item Links */}
        {items.map((item, idx) => {
          const isActive = isSliding ? currentSlideIndex === idx : pathname === item.href;

          return (
            <Link
              key={idx}
              href={item.href}
              onClick={(e) => {
                if (isSliding) e.preventDefault();
              }}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-[2rem] z-10 transition-all outline-none"
            >
              {/* Icon with Dynamic Touch Lift */}
              <motion.div
                animate={{
                  scale: isActive ? 1.2 : 1,
                  y: isActive ? -3 : 0
                }}
                transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                className={`relative z-10 ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400 font-black' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border border-white dark:border-slate-900" />
                ) : null}
              </motion.div>

              {/* Label */}
              <span 
                className={`relative z-10 text-[9.5px] font-black mt-0.5 tracking-tight transition-colors ${
                  isActive 
                    ? 'text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
