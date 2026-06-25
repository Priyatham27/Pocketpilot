'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number; // width and height in px
  strokeWidth?: number;
  gradientStart?: string; // hex or tailwind gradient color stop
  gradientEnd?: string;
  trackColor?: string; // class name or hex for background path
  showValue?: boolean;
  valueClass?: string;
  label?: string;
}

export function CircularProgress({
  value,
  size = 70,
  strokeWidth = 6,
  gradientStart = '#6366f1', // Indigo
  gradientEnd = '#a855f7', // Purple
  trackColor = 'rgba(226, 232, 240, 0.2)', // Slate 200 with opacity for dark mode compatibility
  showValue = true,
  valueClass = 'text-xs font-bold',
  label
}: CircularProgressProps) {
  const cleanValue = Math.min(100, Math.max(0, value));
  
  // Circle calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanValue / 100) * circumference;

  // Generate unique IDs for gradients to prevent overlap in page renders
  const gradientId = React.useMemo(() => `circ-grad-${Math.random().toString(36).substring(2, 9)}`, []);

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
        </defs>
        
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="transition-colors duration-200"
        />
        
        {/* Animated Foreground Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </svg>
      
      {/* Center Text */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={valueClass}>
            {cleanValue.toFixed(0)}%
          </span>
          {label && (
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider scale-90">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
