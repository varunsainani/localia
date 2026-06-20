"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "./logo";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-subtle">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("tagline")}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("explore")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/search" className="hover:text-foreground">
                  {t("browse")}
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-foreground">
                  {t("categories")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("company")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/register" className="hover:text-foreground">
                  {t("becomePro")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>{t("rights", { year })}</p>
          <p>{t("builtWith")}</p>
        </div>
      </div>
    </footer>
  );
}
