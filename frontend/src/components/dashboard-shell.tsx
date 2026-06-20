"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, type LucideIcon } from "lucide-react";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "./auth-context";
import { initials, cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

// Shared chrome for the provider + admin areas: a top bar with brand, role nav,
// language/theme toggles, account + sign-out.
export function DashboardShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const tn = useTranslations("nav");
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">/ {title}</span>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-block"
            >
              {tn("home")}
            </Link>
            <LanguageToggle />
            <ThemeToggle />
            <div className="flex items-center gap-2 border-l border-border pl-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                {user ? initials(user.name) : "·"}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label={tn("logout")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="mx-auto max-w-6xl px-2 sm:px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
