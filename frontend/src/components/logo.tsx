import { cn } from "@/lib/utils";

export function Logo({
  showText = true,
  className,
  textClassName,
}: {
  showText?: boolean;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          {/* A map pin with a hollow center. */}
          <path
            d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2.6" fill="currentColor" />
        </svg>
      </div>
      {showText && (
        <span className={cn("text-[15px] font-semibold tracking-tight", textClassName)}>Localia</span>
      )}
    </div>
  );
}
