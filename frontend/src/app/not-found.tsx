import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/logo";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div>
        <p className="text-6xl font-bold text-primary">404</p>
        <p className="mt-2 text-muted-foreground">{t("notFound")}</p>
      </div>
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        {t("notFoundCta")}
      </Link>
    </div>
  );
}
