"use client";

import React from "react";
import { cn } from "@/lib/utils";

const SHOOTING_STAR_COUNT = 4;
const MIN_DELAY_MS = 6000;
const MAX_DELAY_MS = 8000;

const ANIMATION_CLASSES = [
  "animate-shooting-star",
  "animate-shooting-star-45",
  "animate-shooting-star-120",
  "animate-shooting-star-225",
];

export function ShootingStars({ className }: { className?: string }) {
  return (
    <div
      className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}
      aria-hidden
    >
      {Array.from({ length: SHOOTING_STAR_COUNT }).map((_, i) => {
        const delayMs = MIN_DELAY_MS + (i * (MAX_DELAY_MS - MIN_DELAY_MS)) / SHOOTING_STAR_COUNT;
        return (
          <div
            key={i}
            className={cn("absolute w-24 h-[2px] rounded-full opacity-0", ANIMATION_CLASSES[i])}
            style={{
              left: "50%",
              top: "40%",
              marginLeft: "-48px",
              background: "linear-gradient(90deg, transparent, rgba(147,197,253,0.9), rgba(255,255,255,0.95))",
              boxShadow: "0 0 12px 2px rgba(147,197,253,0.5)",
              animationDelay: `${delayMs}ms`,
              animationDuration: "8s",
            }}
          />
        );
      })}
    </div>
  );
}
