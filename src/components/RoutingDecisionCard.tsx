import {
  type RoutingDecision,
  assistanceCategoryLabels,
  getLocalizedLabel,
  priorityLevelLabels,
  responderTypeLabels,
  routingModuleLabels,
} from "@/lib/requestRouting";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { ArrowRight, ShieldCheck, Siren, Stethoscope } from "lucide-react";

interface RoutingDecisionCardProps {
  decision: RoutingDecision;
  title?: string;
  className?: string;
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-accent/15 text-accent",
  critical: "bg-destructive/15 text-destructive",
} as const;

const RoutingDecisionCard = ({
  decision,
  title,
  className,
}: RoutingDecisionCardProps) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/80 p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="font-heading text-sm font-semibold text-foreground">
            {title ?? (isAr ? "معاينة التوجيه" : "Routing Preview")}
          </h3>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            priorityColors[decision.priority],
          )}
        >
          {getLocalizedLabel(priorityLevelLabels, decision.priority, lang)}
        </span>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Siren className="h-3.5 w-3.5" />
            <span>{isAr ? "الفئة" : "Category"}</span>
          </div>
          <p className="font-medium text-foreground">
            {getLocalizedLabel(
              assistanceCategoryLabels,
              decision.category,
              lang,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
            <span>{isAr ? "سيتم التوجيه إلى" : "Routed to"}</span>
          </div>
          <p className="font-medium text-foreground">
            {getLocalizedLabel(routingModuleLabels, decision.module, lang)}
          </p>
        </div>

        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5" />
            <span>{isAr ? "المستجيب المطلوب" : "Required responder"}</span>
          </div>
          <p className="font-medium text-foreground">
            {getLocalizedLabel(
              responderTypeLabels,
              decision.requiredResponder,
              lang,
            )}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {decision.localizedReason[lang]}
      </p>

      {decision.escalationTarget && (
        <p className="mt-2 text-xs font-medium text-accent">
          {isAr ? "مسار التصعيد:" : "Escalation path:"}{" "}
          {getLocalizedLabel(routingModuleLabels, decision.escalationTarget, lang)}
        </p>
      )}
    </div>
  );
};

export default RoutingDecisionCard;
