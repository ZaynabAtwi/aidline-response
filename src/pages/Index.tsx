import { Link } from "react-router-dom";
import { Stethoscope, Pill, Users, AlertTriangle, MessageCircle, BarChart3 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

const Index = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const actions = [
    {
      label: t("home.findClinics"),
      description: isAr ? "تصفح مقدمي الخدمات الصحية" : "Browse healthcare service providers",
      icon: Stethoscope,
      path: "/clinics",
      color: "bg-accent/15 text-accent glow-accent",
    },
    {
      label: t("home.medication"),
      description: isAr ? "سجّل احتياجاتك الدوائية وتتبعها" : "Register and track medication needs",
      icon: Pill,
      path: "/medication",
      color: "bg-primary/15 text-primary glow-primary",
    },
    {
      label: t("home.volunteer"),
      description: isAr ? "سجّل مهاراتك للمساعدة" : "Register your skills to help",
      icon: Users,
      path: "/volunteers",
      color: "bg-success/15 text-success glow-success",
    },
    {
      label: t("home.chat"),
      description: isAr ? "تواصل آمن مع فريق الدعم" : "Secure communication with support",
      icon: MessageCircle,
      path: "/chat",
      color: "bg-primary/15 text-primary glow-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="flex justify-end gap-2 px-4 pt-4 md:hidden">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <section className="flex flex-col items-center px-4 pt-8 text-center md:pt-12">
        <div className="mb-4 gap-4 flex items-start justify-start">
          <h1 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
            Aid<span className="text-gradient-primary">Line</span>
          </h1>
        </div>
        <p className="max-w-md text-lg text-muted-foreground">
          {isAr
            ? "منصة تنسيق الأزمات — طلبات موجّهة، تصنيف ذكي، تواصل آمن."
            : "Crisis coordination platform — structured requests, AI triage, secure communication."}
        </p>
      </section>

      <section className="flex justify-center px-4 py-8">
        <Link
          to="/sos"
          className="flex items-center gap-3 rounded-2xl bg-destructive px-10 py-5 font-heading text-xl font-bold text-destructive-foreground transition-transform hover:scale-105 glow-destructive"
        >
          <AlertTriangle className="h-7 w-7" />
          {t("home.sos")}
        </Link>
      </section>

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

      <section className="mx-auto mt-8 max-w-3xl px-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" />
            {isAr ? "كيف يعمل النظام" : "How the System Works"}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", label: isAr ? "إرسال الطلب" : "Submit Request", desc: isAr ? "أرسل طلب المساعدة" : "Send your aid request" },
              { step: "2", label: isAr ? "تصنيف ذكي" : "AI Classification", desc: isAr ? "تصنيف تلقائي للطلب" : "Auto-classify & prioritize" },
              { step: "3", label: isAr ? "توجيه الخدمة" : "Service Routing", desc: isAr ? "توجيه للمستجيب المناسب" : "Route to right responder" },
              { step: "4", label: isAr ? "تواصل آمن" : "Secure Comms", desc: isAr ? "تنسيق مباشر وآمن" : "Direct secure coordination" },
            ].map((item) => (
              <div key={item.step} className="rounded-lg bg-secondary/50 p-3 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-3xl px-4">
        <div className="grid grid-cols-3 gap-4 rounded-xl border border-border bg-card p-6">
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-primary">247</p>
            <p className="text-xs text-muted-foreground">{t("home.activeShelters")}</p>
          </div>
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-success">1,203</p>
            <p className="text-xs text-muted-foreground">{t("home.volunteersCount")}</p>
          </div>
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-accent">89</p>
            <p className="text-xs text-muted-foreground">{t("home.ngosActive")}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
