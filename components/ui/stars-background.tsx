"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_STAR_COUNT = 200;
const STAR_DENSITY = 0.00015;

interface StarsBackgroundProps {
  starDensity?: number;
  className?: string;
}

export function StarsBackground({
  starDensity = STAR_DENSITY,
  className,
}: StarsBackgroundProps) {
  const stars = useMemo(() => {
    const count = Math.max(DEFAULT_STAR_COUNT, Math.min(400, Math.floor(2000000 * starDensity)));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: 1.5 + Math.random() * 1.5,
      delay: Math.random() * 2,
    }));
  }, [starDensity]);

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none opacity-40", className)}
      aria-hidden
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-star-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
