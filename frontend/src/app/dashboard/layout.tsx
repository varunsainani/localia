"use client";

import { LayoutDashboard, UserCog, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { RoleGuard } from "@/components/role-guard";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("dashboard");
  const items: NavItem[] = [
    { href: "/dashboard", label: t("nav.overview"), icon: LayoutDashboard, exact: true },
    { href: "/dashboard/profile", label: t("nav.profile"), icon: UserCog },
    { href: "/dashboard/reviews", label: t("nav.reviews"), icon: Star },
  ];
  return (
    <RoleGuard role="PROVIDER">
      <DashboardShell title={t("title")} items={items}>
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
