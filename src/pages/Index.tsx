import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, Pill, Users, AlertTriangle, MessageCircle, ArrowDown } from "lucide-react";
import logo from "@/assets/aidline-logo.svg";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { getAnalyticsSummary } from "@/services/analyticsService";

interface PlatformStats {
  total_providers: number;
  available_volunteers: number;
  total_requests: number;
}

const PIPELINE_STEPS = [
  { key: "submit",      en: "User Request",           ar: "طلب المستخدم" },
  { key: "classify",    en: "AI Classification",       ar: "التصنيف الذكي" },
  { key: "route",       en: "Service Routing",         ar: "توجيه الخدمة" },
  { key: "accept",      en: "Responder Acceptance",    ar: "قبول المستجيب" },
  { key: "communicate", en: "Secure Communication",    ar: "التواصل الآمن" },
  { key: "resolve",     en: "Case Resolution",         ar: "حل الطلب" },
];

const Index = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    getAnalyticsSummary()
      .then((res) => {
        setStats({
          total_providers: res.providers?.active_providers ?? 0,
          available_volunteers: res.volunteers?.available_volunteers ?? 0,
          total_requests: res.requests?.total_requests ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  const actions = [
    { label: t("home.findClinics"),  description: t("home.findClinicsDesc"),  icon: Stethoscope,     path: "/clinics",    color: "bg-accent/15 text-accent glow-accent" },
    { label: t("home.medication"),   description: t("home.medicationDesc"),   icon: Pill,            path: "/medication", color: "bg-primary/15 text-primary glow-primary" },
    { label: t("home.volunteer"),    description: t("home.volunteerDesc"),    icon: Users,           path: "/volunteers", color: "bg-success/15 text-success glow-success" },
    { label: t("home.chat"),         description: t("home.chatDesc"),         icon: MessageCircle,   path: "/chat",       color: "bg-primary/15 text-primary glow-primary" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      {/* Mobile language toggle */}
      <div className="flex justify-end gap-2 px-4 pt-4 md:hidden">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center px-4 pt-8 text-center md:pt-12">
        <img src={logo} alt="AidLine" className="mb-5 w-full max-w-xl" />
        <p className="max-w-md text-lg text-muted-foreground">{t("home.tagline")}</p>
      </section>

      {/* SOS Button */}
      <section className="flex justify-center px-4 py-8">
        <Link
          to="/sos"
          className="flex items-center gap-3 rounded-2xl bg-destructive px-10 py-5 font-heading text-xl font-bold text-destructive-foreground transition-transform hover:scale-105 glow-destructive"
        >
          <AlertTriangle className="h-7 w-7" />
          {t("home.sos")}
        </Link>
      </section>

      {/* Action Grid */}
      <section className="mx-auto grid max-w-3xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-card/80"
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${action.color}`}>
              <action.icon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{action.label}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Request Routing Pipeline */}
      <section className="mx-auto mt-12 max-w-3xl px-4">
        <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
          {isAr ? "كيف يعمل نظام التوجيه" : "How Request Routing Works"}
        </h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-0">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.key} className="flex flex-col items-center sm:flex-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <p className="mt-2 text-center text-xs font-medium text-foreground">
                  {isAr ? step.ar : step.en}
                </p>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="my-1 sm:hidden">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="hidden sm:block h-px w-full mt-4 border-t border-dashed border-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {isAr
              ? "لا يتم جمع أي بيانات موقع. جميع الطلبات توجَّه بناءً على التصنيف والتوفر."
              : "No location data is collected. All requests are routed based on classification and availability."}
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="mx-auto mt-6 max-w-3xl px-4">
        <div className="grid grid-cols-3 gap-4 rounded-xl border border-border bg-card p-6">
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-primary">
              {stats ? stats.total_providers : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{t("home.activeShelters")}</p>
          </div>
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-success">
              {stats ? stats.available_volunteers : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{t("home.volunteersCount")}</p>
          </div>
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-accent">
              {stats ? stats.total_requests : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{t("home.ngosActive")}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
