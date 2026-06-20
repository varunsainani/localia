"use client";

import { MessageCircle } from "lucide-react";
import { whatsappLink, phoneDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

// Renders a green WhatsApp deep-link button. Hidden if there's no number.
export function WhatsAppButton({
  whatsapp,
  message,
  label,
  className,
  full = false,
}: {
  whatsapp: string | null | undefined;
  message?: string;
  label: string;
  className?: string;
  full?: boolean;
}) {
  const digits = phoneDigits(whatsapp);
  if (!digits) return null;

  return (
    <a
      href={whatsappLink(whatsapp, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 text-sm font-semibold text-[#04340f] shadow-sm transition-colors hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        full && "w-full",
        className,
      )}
    >
      <MessageCircle className="h-[18px] w-[18px]" />
      {label}
    </a>
  );
}
