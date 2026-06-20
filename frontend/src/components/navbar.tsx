"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Shield, Search, Heart } from "lucide-react";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "./auth-context";
import { initials, cn } from "@/lib/utils";

export function Navbar() {
  const t = useTranslations("nav");
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const links = [
    { href: "/search", label: t("search") },
    { href: "/categories", label: t("categories") },
  ];

  async function handleSignOut() {
    setMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <LanguageToggle />
          <ThemeToggle />

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-1.5 pr-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                  {initials(user.name)}
                </span>
                <span className="hidden max-w-[8rem] truncate lg:inline">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg">
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {user.role === "CLIENT" && (
                    <Link
                      href="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Heart className="h-4 w-4" />
                      {t("favorites")}
                    </Link>
                  )}
                  {user.role === "PROVIDER" && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {t("dashboard")}
                    </Link>
                  )}
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Shield className="h-4 w-4" />
                      {t("admin")}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={t("menu")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            <Link
              href="/search"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Search className="h-4 w-4" /> {t("search")}
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t("categories")}
            </Link>
            {user?.role === "CLIENT" && (
              <Link
                href="/favorites"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Heart className="h-4 w-4" /> {t("favorites")}
              </Link>
            )}
            {user?.role === "PROVIDER" && (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <LayoutDashboard className="h-4 w-4" /> {t("dashboard")}
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Shield className="h-4 w-4" /> {t("admin")}
              </Link>
            )}
            <div className="flex items-center gap-2 px-1 py-2">
              <LanguageToggle />
            </div>
            <div className="border-t border-border pt-3">
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" /> {t("logout")}
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex flex-1 items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium",
                    )}
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    {t("register")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
