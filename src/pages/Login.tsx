import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import logo from "@/assets/aidline-logo.svg";

const Login = () => {
  const { lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/onboarding", { replace: true });
    } catch (err: any) {
      setError(err?.message || (isAr ? "تعذر تسجيل الدخول" : "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="fixed top-4 end-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 md:p-8">
        <img src={logo} alt="AidLine" className="mb-4 h-12 w-auto" />
        <p className="mb-6 text-sm text-muted-foreground">
          {isAr
            ? "سجّل الدخول إلى المنصة باستخدام البريد الإلكتروني وكلمة المرور."
            : "Sign in using your email and password."}
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {isAr ? "البريد الإلكتروني" : "Email"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {isAr ? "كلمة المرور" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground"
              required
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? (isAr ? "جاري المعالجة..." : "Processing...") : (isAr ? "متابعة" : "Continue")}
        </button>
      </form>
    </div>
  );
};

export default Login;
