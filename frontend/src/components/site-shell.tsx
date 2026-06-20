import { Navbar } from "./navbar";
import { Footer } from "./footer";

// Public/marketing chrome: sticky navbar + footer with the page content between.
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
