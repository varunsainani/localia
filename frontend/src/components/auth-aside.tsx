"use client";

import { Search, ShieldCheck, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "./logo";

export function AuthAside() {
  const t = useTranslations("auth.aside");
  const points = [
    { icon: Search, title: t("discoverTitle"), desc: t("discoverDesc") },
    { icon: ShieldCheck, title: t("trustTitle"), desc: t("trustDesc") },
    { icon: MessageCircle, title: t("contactTitle"), desc: t("contactDesc") },
  ];
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-emerald-950 p-12 text-white lg:flex">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />

      <div className="relative">
        <Logo textClassName="text-white" />
      </div>

      <div className="relative max-w-md space-y-8">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">{t("headline")}</h1>
        <ul className="space-y-5">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.title} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-white/55">{p.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="relative text-xs text-white/40">
        {t("copyright", { year: new Date().getFullYear() })}
      </p>
    </div>
  );
}
