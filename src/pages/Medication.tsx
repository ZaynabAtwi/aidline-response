import { useState, useEffect } from "react";
import { Pill, Clock, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import {
  listMedicationRequests,
  submitMedicationRequest,
  getMedicationAvailability,
} from "@/services/medicationService";

const medications = [
  "Insulin (Rapid-acting)", "Insulin (Long-acting)", "Metformin", "Amlodipine",
  "Lisinopril", "Atorvastatin", "Salbutamol Inhaler", "Levothyroxine",
  "Warfarin", "Omeprazole", "Amoxicillin", "Paracetamol",
];

const urgencyColors: Record<string, string> = {
  low:      "bg-muted text-muted-foreground",
  medium:   "bg-accent/15 text-accent",
  high:     "bg-accent/25 text-accent",
  critical: "bg-destructive/15 text-destructive",
};

const statusIcons: Record<string, typeof CheckCircle> = {
  pending:   Clock,
  approved:  Clock,
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

interface AvailabilityResult {
  medication_name: string;
  is_available: boolean;
  quantity: number;
  provider_name: string;
  contact_phone: string | null;
  operating_hours: string | null;
}

const Medication = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const [selectedMed, setSelectedMed] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState<MedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResult[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  useEffect(() => {
    if (selectedMed) checkAvailability(selectedMed);
    else setAvailability([]);
  }, [selectedMed]);

  const fetchRequests = async () => {
    if (!user) return;
    const rows = await listMedicationRequests(user.id);
    setRequests(rows as MedRequest[]);
  };

  const checkAvailability = async (medName: string) => {
    setCheckingAvailability(true);
    try {
      const rows = await getMedicationAvailability(medName);
      setAvailability(rows);
    } catch {
      setAvailability([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || !user) return;
    setLoading(true);
    try {
      await submitMedicationRequest({
        user_id: user.id,
        medication_name: selectedMed,
        urgency,
        notes: notes || undefined,
      });
      setSubmitted(true);
      setSelectedMed("");
      setNotes("");
      fetchRequests();
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      // Keep page usable even if backend call fails.
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

              {/* Availability checker */}
              {selectedMed && (
                <div className="mb-4 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Search className="h-4 w-4" />
                    {isAr ? "التوفر في الصيدليات" : "Pharmacy Availability"}
                  </div>
                  {checkingAvailability ? (
                    <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
                  ) : availability.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "لم يتم العثور على بيانات توفر بعد." : "No availability data found yet."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availability.map((a, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs">
                          <span className="font-medium text-foreground">{a.provider_name}</span>
                          <span className={a.is_available ? "text-success font-medium" : "text-destructive"}>
                            {a.is_available
                              ? (isAr ? "✓ متوفر" : "✓ Available")
                              : (isAr ? "✗ غير متوفر" : "✗ Unavailable")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

              <div className="mb-4 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
                {isAr
                  ? "سيتم توجيه طلبك تلقائياً إلى صيدلية متاحة عبر نظام التوجيه الذكي."
                  : "Your request will be automatically routed to an available pharmacy through the intelligent routing system."}
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
