import { useState } from "react";
import { AlertTriangle, Send, Phone as PhoneIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import EmergencyNumbers from "@/components/EmergencyNumbers";
import RoutingDecisionCard from "@/components/RoutingDecisionCard";
import { type PriorityLevel, triageRequest } from "@/lib/requestRouting";

const SOS = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [urgency, setUrgency] = useState<PriorityLevel>("critical");
  const [sending, setSending] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const isAr = lang === "ar";
  const decision = triageRequest({
    requestType: "sos",
    description: message,
    urgency,
  });
  const urgencyLabels = {
    low: t("med.low"),
    medium: t("med.medium"),
    high: t("med.high"),
    critical: t("med.critical"),
  };

  const handleSOS = async () => {
    if (!user || sending) return;
    setSending(true);

    const insertData = {
      user_id: user.id,
      message: message || null,
      status: "active" as const,
      urgency,
      assistance_category: decision.category,
      priority_level: decision.priority,
      routing_module: decision.module,
      routing_status: decision.routingStatus,
      required_responder: decision.requiredResponder,
      classification_summary: decision.summary,
      triage_reason: decision.reason,
    };

    const { error } = await supabase.from("sos_alerts").insert(insertData);
    if (!error) setSent(true);
    setSending(false);
  };

  if (showNumbers) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pt-20">
        {/* Sticky back button */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md md:top-16">
          <div className="mx-auto flex max-w-2xl items-center px-4 py-3">
            <button
              onClick={() => setShowNumbers(false)}
              className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              <AlertTriangle className="h-4 w-4" />
              {isAr ? "العودة إلى SOS" : "Back to SOS"}
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 pt-6">
          <EmergencyNumbers />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 pb-24 md:pt-20">
      <div className="w-full max-w-md text-center">
        {!sent ? (
          <>
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/15 glow-destructive">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">{t("sos.title")}</h1>
            <p className="mb-8 text-muted-foreground">{t("sos.subtitle")}</p>

            <div className="mb-6">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("sos.placeholder")}
                className="w-full rounded-xl border border-input bg-card p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-start text-sm text-muted-foreground">
                {isAr ? "مستوى الاستعجال" : "Urgency level"}
              </label>
              <div className="flex flex-wrap gap-2">
                {(["low", "medium", "high", "critical"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
                      urgency === level
                        ? "bg-destructive text-destructive-foreground ring-2 ring-ring"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {urgencyLabels[level]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-start text-sm text-muted-foreground">
              {isAr
                ? "لا يجمع AidLine أي بيانات موقع. سيتم فرز الطلب وتوجيهه تلقائياً حسب نوع الحالة ومستوى الاستعجال."
                : "AidLine does not collect any location data. Your request will be triaged and routed automatically based on case type and urgency."}
            </div>

            <RoutingDecisionCard
              decision={decision}
              className="mb-6 text-start"
              title={isAr ? "وجهة طلب SOS" : "SOS routing preview"}
            />

            <button
              onClick={handleSOS}
              disabled={sending}
              className="w-full rounded-xl bg-destructive py-5 font-heading text-xl font-bold text-destructive-foreground transition-transform hover:scale-[1.02] glow-destructive disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-3">
                <Send className="h-6 w-6" />
                {t("sos.send")}
              </span>
            </button>

            {/* Emergency Numbers Button */}
            <button
              onClick={() => setShowNumbers(true)}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-destructive/40 bg-destructive/10 py-4 font-heading text-base font-semibold text-destructive transition-colors hover:bg-destructive/15"
            >
              <PhoneIcon className="h-5 w-5" />
              {isAr ? "أرقام الطوارئ والدعم" : "Emergency & Support Numbers"}
            </button>
          </>
        ) : (
          <div className="animate-in fade-in">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success/15 glow-success">
              <Send className="h-12 w-12 text-success" />
            </div>
            <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">{t("sos.sent")}</h1>
            <p className="mb-6 text-muted-foreground">{t("sos.sentMessage")}</p>
            <RoutingDecisionCard
              decision={decision}
              className="mb-6 text-start"
              title={isAr ? "مسار الطلب الحالي" : "Current routing path"}
            />
            <button
              onClick={() => setSent(false)}
              className="rounded-xl border border-border bg-card px-8 py-3 font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {t("sos.sendAnother")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOS;
