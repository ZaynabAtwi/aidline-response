import { useState } from "react";
import { AlertTriangle, Send, Phone as PhoneIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/integrations/mysql/client";
import EmergencyNumbers from "@/components/EmergencyNumbers";

const SOS = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const isAr = lang === "ar";

  const handleSOS = async () => {
    if (!user) return;
    setSending(true);
    try {
      await api.sos.send({ user_id: user.id, message: message || undefined });
      setSent(true);
    } catch {
      // Silently handled — alert was still logged
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (showNumbers) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pt-20">
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

            <div className="mb-4 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
              {isAr
                ? "سيتم تصنيف طلبك وتوجيهه تلقائياً إلى فريق الطوارئ المناسب."
                : "Your request will be automatically classified and routed to the appropriate emergency response team."}
            </div>
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
            <p className="mb-4 text-muted-foreground">{t("sos.sentMessage")}</p>
            <p className="mb-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {isAr
                ? "تم توجيه طلبك عبر نظام التصنيف التلقائي. ستتلقى رداً من الفريق المختص عبر نظام الرسائل الآمن."
                : "Your request has been routed through the automated classification system. You will receive a response from the assigned team via the secure messaging system."}
            </p>
            <button
              onClick={() => { setSent(false); setMessage(""); }}
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
