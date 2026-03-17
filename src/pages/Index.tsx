import { Link } from "react-router-dom";
import { Stethoscope, Pill, Users, AlertTriangle, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import RequestRoutingOverview from "@/components/RequestRoutingOverview";

const Index = () => {
  const { t } = useLanguage();

  const actions = [
  { label: t("home.findClinics"), description: t("home.findClinicsDesc"), icon: Stethoscope, path: "/clinics", color: "bg-accent/15 text-accent glow-accent" },
  { label: t("home.medication"), description: t("home.medicationDesc"), icon: Pill, path: "/medication", color: "bg-primary/15 text-primary glow-primary" },
  { label: t("home.volunteer"), description: t("home.volunteerDesc"), icon: Users, path: "/volunteers", color: "bg-success/15 text-success glow-success" },
  { label: t("home.chat"), description: t("home.chatDesc"), icon: MessageCircle, path: "/chat", color: "bg-primary/15 text-primary glow-primary" }];


  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      {/* Mobile language toggle */}
      <div className="flex justify-end gap-2 px-4 pt-4 md:hidden">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center px-4 pt-8 text-center md:pt-12">
        <div className="mb-4 gap-4 flex items-start justify-start">
          
          <h1 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
            Aid<span className="text-gradient-primary">Line</span>
          </h1>
        </div>
        <p className="max-w-md text-lg text-muted-foreground">{t("home.tagline")}</p>
      </section>

      {/* SOS Button */}
      <section className="flex justify-center px-4 py-8">
        <Link
          to="/sos"
          className="flex items-center gap-3 rounded-2xl bg-destructive px-10 py-5 font-heading text-xl font-bold text-destructive-foreground transition-transform hover:scale-105 glow-destructive">
          
          <AlertTriangle className="h-7 w-7" />
          {t("home.sos")}
        </Link>
      </section>

      {/* Action Grid */}
      <section className="mx-auto grid max-w-3xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) =>
        <Link
          key={action.path}
          to={action.path}
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-card/80">
          
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${action.color}`}>
              <action.icon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{action.label}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        )}
      </section>

      <RequestRoutingOverview />

      {/* Stats Bar */}
      <section className="mx-auto mt-12 max-w-3xl px-4">
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
    </div>);

};

export default Index;