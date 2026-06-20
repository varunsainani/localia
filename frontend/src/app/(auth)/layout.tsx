import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

// Public auth pages (login, register) share a language + theme switcher pinned
// top-right. Accept-Language still sets the initial locale; this lets visitors
// override it before signing in, and the choice carries into the app.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
