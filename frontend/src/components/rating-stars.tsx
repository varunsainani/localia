"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Read-only star display. Renders a 5-star row with a fractional fill for the
// active rating.
export function RatingStars({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const stars = [0, 1, 2, 3, 4];
  return (
    <span className={cn("inline-flex items-center", className)} aria-hidden>
      {stars.map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-muted-foreground/35" style={{ width: size, height: size }} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star
                className="text-warning"
                style={{ width: size, height: size }}
                fill="currentColor"
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

// Interactive star picker for writing a review.
export function RatingInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="inline-flex items-center gap-1">
      {stars.map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`${i}`}
          className="rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(i <= value ? "text-warning" : "text-muted-foreground/35")}
            fill={i <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}
