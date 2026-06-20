"use client";

import {
  Brain,
  Scale,
  Building2,
  Wrench,
  Sprout,
  GraduationCap,
  HeartPulse,
  Cpu,
  Tag,
  type LucideIcon,
} from "lucide-react";

// Maps the lucide icon name stored on a category (and a few friendly aliases for
// the seed's 8 categories) to a concrete icon component. Falls back to a tag.
const ICONS: Record<string, LucideIcon> = {
  Brain,
  Scale,
  Building2,
  Wrench,
  Sprout,
  GraduationCap,
  HeartPulse,
  Cpu,
  // Aliases / friendly names that may come from the seed.
  psychology: Brain,
  legal: Scale,
  "real-estate": Building2,
  realestate: Building2,
  home: Wrench,
  "home-services": Wrench,
  agro: Sprout,
  agriculture: Sprout,
  education: GraduationCap,
  tutoring: GraduationCap,
  health: HeartPulse,
  nutrition: HeartPulse,
  technology: Cpu,
  tech: Cpu,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Tag;
  return <Icon className={className} />;
}
