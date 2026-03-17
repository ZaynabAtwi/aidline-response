import { useLanguage } from "@/i18n/LanguageContext";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardList,
  DatabaseZap,
  MessageCircleMore,
  Route,
  ShieldCheck,
} from "lucide-react";

const RequestRoutingPipeline = () => {
  const { t } = useLanguage();

  const steps = [
    {
      bodyKey: "home.pipeline.request.body" as const,
      icon: ClipboardList,
      titleKey: "home.pipeline.request.title" as const,
    },
    {
      bodyKey: "home.pipeline.triage.body" as const,
      icon: BrainCircuit,
      titleKey: "home.pipeline.triage.title" as const,
    },
    {
      bodyKey: "home.pipeline.routing.body" as const,
      icon: Route,
      titleKey: "home.pipeline.routing.title" as const,
    },
    {
      bodyKey: "home.pipeline.communication.body" as const,
      icon: MessageCircleMore,
      titleKey: "home.pipeline.communication.title" as const,
    },
    {
      bodyKey: "home.pipeline.resolution.body" as const,
      icon: ShieldCheck,
      titleKey: "home.pipeline.resolution.title" as const,
    },
    {
      bodyKey: "home.pipeline.intelligence.body" as const,
      icon: DatabaseZap,
      titleKey: "home.pipeline.intelligence.title" as const,
    },
  ] as const;

  return (
    <section className="mx-auto mt-12 max-w-5xl px-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {t("home.pipelineTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("home.pipelineSubtitle")}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-6">
          {steps.map((step, index) => (
            <div key={step.titleKey} className="relative rounded-xl bg-background p-4">
              <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {t(step.titleKey)}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t(step.bodyKey)}
              </p>

              {index < steps.length - 1 && (
                <ArrowRight className="absolute end-3 top-4 hidden h-4 w-4 text-muted-foreground/70 md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RequestRoutingPipeline;
