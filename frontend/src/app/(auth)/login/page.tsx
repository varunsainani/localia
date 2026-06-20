"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { User, Briefcase, ShieldCheck } from "lucide-react";
import { AuthAside } from "@/components/auth-aside";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-context";
import { login, DEMO } from "@/lib/api";
import { homeForRole } from "@/lib/post-auth";

type DemoRole = "client" | "provider" | "admin";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const ta = useTranslations("auth");
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<DemoRole | null>(null);

  async function finish(role?: string) {
    await refresh();
    router.replace(homeForRole((role as never) ?? "CLIENT"));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await login(email, password);
      await finish(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorFallback"));
      setLoading(false);
    }
  }

  async function enterDemo(role: DemoRole) {
    const creds = DEMO[role];
    if (!creds.email || !creds.password) return;
    setError("");
    setDemoLoading(role);
    try {
      const { user } = await login(creds.email, creds.password);
      await finish(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorFallback"));
      setDemoLoading(null);
    }
  }

  const demos: { role: DemoRole; icon: typeof User; label: string }[] = [
    { role: "client", icon: User, label: t("demoClient") },
    { role: "provider", icon: Briefcase, label: t("demoProvider") },
    { role: "admin", icon: ShieldCheck, label: t("demoAdmin") },
  ];
  const anyDemo = demos.some((d) => DEMO[d.role].email && DEMO[d.role].password);

  return (
    <div className="flex min-h-screen">
      <AuthAside />
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

          {anyDemo && (
            <>
              <div className="mt-6 rounded-xl border border-border bg-subtle p-4">
                <p className="text-sm font-medium">{t("demoTitle")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("demoSubtitle")}</p>
                <div className="mt-3 space-y-2">
                  {demos.map((d) => {
                    const creds = DEMO[d.role];
                    if (!creds.email || !creds.password) return null;
                    const Icon = d.icon;
                    return (
                      <Button
                        key={d.role}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => enterDemo(d.role)}
                        disabled={demoLoading !== null || loading}
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        {demoLoading === d.role ? t("demoLoading") : d.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("divider")}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className={anyDemo ? "space-y-4" : "mt-6 space-y-4"}>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("email")}</span>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ta("emailPlaceholder")}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("password")}</span>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}

            <Button type="submit" disabled={loading || demoLoading !== null} className="w-full">
              {loading ? t("submitLoading") : t("submit")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("signupPrompt")}{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {t("signupLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
