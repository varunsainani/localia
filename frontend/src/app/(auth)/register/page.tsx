"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Search, Briefcase } from "lucide-react";
import { AuthAside } from "@/components/auth-aside";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-context";
import { register } from "@/lib/api";
import { homeForRole } from "@/lib/post-auth";
import { cn } from "@/lib/utils";

type Role = "CLIENT" | "PROVIDER";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const ta = useTranslations("auth");
  const router = useRouter();
  const { refresh } = useAuth();
  const [role, setRole] = useState<Role>("CLIENT");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await register({ ...form, role });
      await refresh();
      router.replace(homeForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorFallback"));
      setLoading(false);
    }
  }

  const roles: { value: Role; icon: typeof Search; title: string; hint: string }[] = [
    { value: "CLIENT", icon: Search, title: t("roleClient"), hint: t("roleClientHint") },
    { value: "PROVIDER", icon: Briefcase, title: t("roleProvider"), hint: t("roleProviderHint") },
  ];

  return (
    <div className="flex min-h-screen">
      <AuthAside />
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

          {/* Role toggle */}
          <div className="mt-6 space-y-2">
            <span className="text-sm font-medium">{t("roleLabel")}</span>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-primary bg-accent ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{r.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("name")}</span>
              <Input required value={form.name} onChange={set("name")} placeholder={t("namePlaceholder")} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("email")}</span>
              <Input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder={ta("emailPlaceholder")}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("password")}</span>
              <Input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={set("password")}
                placeholder={t("passwordPlaceholder")}
              />
            </label>

            {error && (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t("submitLoading") : t("submit")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("signinPrompt")}{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t("signinLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
