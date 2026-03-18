import { Link, useLocation } from "react-router-dom";
import { Home, Stethoscope, Pill, Users, RefreshCw, MessageCircle } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { user, signOut } = useAuth();

  const navItems = [
    { path: "/", label: t("nav.home"), icon: Home },
    { path: "/clinics", label: t("nav.clinics"), icon: Stethoscope },
    { path: "/medication", label: t("nav.medication"), icon: Pill },
    { path: "/chat", label: t("nav.chat"), icon: MessageCircle },
  ];

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-2 py-2 md:px-6">
        <Link to="/" className="hidden items-center gap-2 md:flex">
          <span className="font-heading text-lg font-bold text-foreground">AidLine</span>
        </Link>
        <div className="flex w-full items-center justify-around gap-1 md:w-auto md:gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors md:flex-row md:gap-2 md:px-4 md:py-2 md:text-sm ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageToggle />
          {user && (
            <span
              className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-mono text-muted-foreground"
              title={user.generated_identity_id || user.id}
            >
              {(user.generated_identity_id || user.id).slice(0, 12)}
            </span>
          )}
          <button
            onClick={signOut}
            title={lang === "ar" ? "إعادة تعيين الهوية" : "Reset Identity"}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
