import { Link } from "react-router-dom";
import {
  AlertTriangle,
  MessageCircle,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import RequestRoutingPipeline from "@/components/RequestRoutingPipeline";

const Index = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const actions = [
    {
      label: t("home.findClinics"),
      description: t("home.findClinicsDesc"),
      icon: Stethoscope,
      path: "/clinics",
      color: "bg-accent/15 text-accent glow-accent",
    },
    {
      label: t("home.medication"),
      description: t("home.medicationDesc"),
      icon: Pill,
      path: "/medication",
      color: "bg-primary/15 text-primary glow-primary",
    },
    {
      label: t("home.volunteer"),
      description: t("home.volunteerDesc"),
      icon: Users,
      path: "/volunteers",
      color: "bg-success/15 text-success glow-success",
    },
    {
      label: t("home.chat"),
      description: t("home.chatDesc"),
      icon: MessageCircle,
      path: "/chat",
      color: "bg-primary/15 text-primary glow-primary",
    },
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
        <div className="mb-4 flex items-start justify-start gap-4">
          <h1 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
            Aid<span className="text-gradient-primary">Line</span>
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {t("home.tagline")}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <ShieldCheck className="h-4 w-4" />
          {isAr
            ? "لا يوجد GPS أو تتبع للموقع"
            : "No GPS or location tracking"}
        </div>
      </section>

      {/* SOS Button */}
      <section className="flex justify-center px-4 py-8">
        <Link
          to="/sos"
          className="glow-destructive flex items-center gap-3 rounded-2xl bg-destructive px-10 py-5 font-heading text-xl font-bold text-destructive-foreground transition-transform hover:scale-105"
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
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${action.color}`}
            >
              <action.icon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {action.label}
              </h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        ))}
      </section>

      <RequestRoutingPipeline />

      {/* Capabilities */}
      <section className="mx-auto mt-12 max-w-3xl px-4">
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-3">
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-primary">4</p>
            <p className="text-xs text-muted-foreground">
              {isAr ? "وحدات توجيه الخدمة" : "Service routing modules"}
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-success">1</p>
            <p className="text-xs text-muted-foreground">
              {isAr ? "قناة تنسيق آمنة" : "Secure coordination channel"}
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-accent">0</p>
            <p className="text-xs text-muted-foreground">
              {isAr ? "متطلبات موقع للمستخدم" : "User location requirements"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );

};

export default Index;