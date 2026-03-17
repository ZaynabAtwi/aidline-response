import { useState, useEffect } from "react";
import { Pill, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/integrations/mysql/client";
import type { ServiceRequest, PipelineResult } from "@/integrations/mysql/types";

const medications = [
  "Insulin (Rapid-acting)", "Insulin (Long-acting)", "Metformin", "Amlodipine",
  "Lisinopril", "Atorvastatin", "Salbutamol Inhaler", "Levothyroxine",
  "Warfarin", "Omeprazole", "Amoxicillin", "Paracetamol",
];

const urgencyColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent/15 text-accent",
  high: "bg-accent/25 text-accent",
  critical: "bg-destructive/15 text-destructive",
};

const statusIcons: Record<string, typeof CheckCircle> = {
  submitted: Clock,
  classifying: Clock,
  classified: Clock,
  routing: Clock,
  routed: Clock,
  accepted: CheckCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  cancelled: AlertTriangle,
};

const Medication = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedMed, setSelectedMed] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<PipelineResult | null>(null);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      const data = await api.requests.list({ type: 'medication_need' });
      if (data.requests) setRequests(data.requests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || !user) return;
    setLoading(true);

    try {
      const result = await api.requests.create({
        request_type: 'medication_need',
        title: selectedMed,
        description: notes || `Medication request: ${selectedMed}`,
        urgency_level: urgency,
      });

      setLastResult(result);
      setSubmitted(true);
      setSelectedMed("");
      setNotes("");
      fetchRequests();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Failed to submit request:', error);
    }

    setLoading(false);
  };

  const urgencyLabels = { low: t("med.low"), medium: t("med.medium"), high: t("med.high"), critical: t("med.critical") };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="mb-6 flex items-center gap-3">
          <Pill className="h-8 w-8 text-primary" />
          <h1 className="font-heading text-3xl font-bold text-foreground">{t("med.title")}</h1>
        </div>
        <p className="mb-8 text-muted-foreground">{t("med.subtitle")}</p>

        {user && (
          <>
            <form onSubmit={handleSubmit} className="mb-10 rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">{t("med.newRequest")}</h2>
              <div className="mb-4">
                <label className="mb-2 block text-sm text-muted-foreground">{t("med.medication")}</label>
                <select
                  value={selectedMed}
                  onChange={(e) => setSelectedMed(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("med.selectMed")}</option>
                  {medications.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm text-muted-foreground">{t("med.urgency")}</label>
                <div className="flex flex-wrap gap-2">
                  {(["low", "medium", "high", "critical"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setUrgency(level)}
                      className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
                        urgency === level ? urgencyColors[level] + " ring-2 ring-ring" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {urgencyLabels[level]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm text-muted-foreground">{t("med.notes")}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={!selectedMed || loading}
                className="w-full rounded-lg bg-primary py-3 font-heading font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitted ? t("med.submitted") : t("med.submit")}
              </button>
            </form>

            {lastResult?.pipeline && submitted && (
              <div className="mb-6 rounded-xl border border-success/30 bg-success/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                  <CheckCircle className="h-4 w-4" />
                  {lastResult.pipeline.message}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Submitted</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>AI Classified</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Routed to {lastResult.routes?.length || 0} provider(s)</span>
                </div>
              </div>
            )}

            <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">{t("med.yourRequests")}</h2>
            <div className="space-y-3">
              {requests.map((r) => {
                const StatusIcon = statusIcons[r.status] || Clock;
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                    <div>
                      <p className="font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                      <p className="mt-1 text-xs text-muted-foreground capitalize">{r.status.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${urgencyColors[r.urgency_level]}`}>
                        {urgencyLabels[r.urgency_level as keyof typeof urgencyLabels] || r.urgency_level}
                      </span>
                      <StatusIcon className={`h-5 w-5 ${r.status === "resolved" ? "text-success" : "text-accent"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {!user && (
          <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
        )}
      </div>
    </div>
  );
};

export default Medication;
