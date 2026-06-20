"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./auth-context";
import { LoadingBlock, EmptyState } from "./states";
import { Button } from "./ui/button";
import type { Role } from "@/lib/api";

// Client-side guard: waits for auth to resolve, redirects anonymous users to
// login, and shows a friendly block if the signed-in role isn't allowed.
export function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("guard");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <LoadingBlock />;

  if (user.role !== role) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={Lock}
          title={role === "ADMIN" ? t("title") : t("providerOnly")}
          subtitle={role === "ADMIN" ? t("subtitle") : t("providerOnlySubtitle")}
          action={
            <Link href="/">
              <Button variant="outline">{t("goHome")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
