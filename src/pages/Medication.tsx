import { useState, useEffect, useCallback } from "react";
import { Pill, Clock, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getRoutingSummary } from "@/lib/request-routing";


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
  pending: Clock,
  approved: Clock,
  fulfilled: CheckCircle,
  cancelled: AlertTriangle,
};

interface MedRequest {
  id: string;
  medication_name: string;
  urgency: string;
  status: string;
  created_at: string;
  notes: string | null;
}

type UrgencyLevel = Database["public"]["Enums"]["urgency_level"];

const Medication = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedMed, setSelectedMed] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("medium");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState<MedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const routing = getRoutingSummary("medication_need");

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("medication_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setRequests(data as MedRequest[]);
  }, [user]);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user, fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || !user) return;
    setLoading(true);
    const { error } = await supabase.from("medication_requests").insert({
      user_id: user.id,
      medication_name: selectedMed,
      urgency,
      notes: notes || null,
    });
    if (!error) {
      setSubmitted(true);
      setSelectedMed("");
      setNotes("");
      fetchRequests();
      setTimeout(() => setSubmitted(false), 3000);
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
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-card p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">{routing.categoryLabel}</p>
            <p>Requests are routed through the {routing.moduleLabel} and can be escalated to NGO support if stock is unavailable.</p>
          </div>
        </div>

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

            <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">{t("med.yourRequests")}</h2>
            <div className="space-y-3">
              {requests.map((r) => {
                const StatusIcon = statusIcons[r.status] || Clock;
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                    <div>
                      <p className="font-medium text-foreground">{r.medication_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${urgencyColors[r.urgency]}`}>
                        {urgencyLabels[r.urgency as keyof typeof urgencyLabels] || r.urgency}
                      </span>
                      <StatusIcon className={`h-5 w-5 ${r.status === "fulfilled" ? "text-success" : "text-accent"}`} />
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
