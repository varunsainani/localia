"use client";

import { LayoutDashboard, ClipboardCheck, Users, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import { RoleGuard } from "@/components/role-guard";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  const items: NavItem[] = [
    { href: "/admin", label: t("nav.overview"), icon: LayoutDashboard, exact: true },
    { href: "/admin/review", label: t("nav.queue"), icon: ClipboardCheck },
    { href: "/admin/providers", label: t("nav.providers"), icon: Users },
    { href: "/admin/categories", label: t("nav.categories"), icon: Tags },
  ];
  return (
    <RoleGuard role="ADMIN">
      <DashboardShell title={t("title")} items={items}>
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
