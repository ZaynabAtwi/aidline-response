import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { secureAction } from "@/services/ngoService";
import {
  Shield, Lock, Building2, Pill, AlertTriangle, MessageSquare,
  Clock, RefreshCw, LogOut, Send
} from "lucide-react";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

// ── API helper — routes through service layer ──
const ngoApi = async (token: string, action: string, payload?: any) => secureAction(token, action, payload);

type Tab = "med_requests" | "sos" | "requests" | "notes";

interface MedReq   { id: string; medication_name: string; urgency: string; status: string; created_at: string; notes: string | null; }
interface SOSAlert { id: string; message: string | null; status: string; created_at: string; }
interface Note     { id: string; content: string; created_at: string; }
interface ServiceRequest { id: string; type: string; title: string; urgency: string; status: string; created_at: string; category?: string; priority_score?: number; }

const urgencyColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/15 text-amber-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/15 text-red-400",
};

const sosColor: Record<string, string> = {
  active: "bg-red-500/15 text-red-400",
  responding: "bg-amber-500/15 text-amber-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-muted text-muted-foreground",
};

const NgoSecure = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  // Auth state
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Inactivity timer
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAuthenticated(false);
      setToken("");
      setTokenInput("");
    }, INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [authenticated, resetTimer]);

  // No-index meta tag
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  // Tab state
  const [tab, setTab] = useState<Tab>("sos");

  // Data
  const [medRequests, setMedRequests] = useState<MedReq[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  // Notes
  const [noteInput, setNoteInput] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await ngoApi(tokenInput, "get_sos_alerts");
      setToken(tokenInput);
      setAuthenticated(true);
    } catch {
      setAuthError(isAr ? "رمز غير صالح أو منتهي الصلاحية" : "Invalid or expired token");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setToken("");
    setTokenInput("");
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [meds, sos, reqs, n] = await Promise.all([
        ngoApi(token, "get_medication_requests"),
        ngoApi(token, "get_sos_alerts"),
        ngoApi(token, "get_requests"),
        ngoApi(token, "get_notes"),
      ]);
      setMedRequests(meds || []);
      setSosAlerts(sos || []);
      setServiceRequests(reqs || []);
      setNotes(n || []);
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

  const updateSos = async (id: string, status: string) => {
    await ngoApi(token, "update_sos_status", { id, status });
    fetchData();
  };

  const updateMed = async (id: string, status: string) => {
    await ngoApi(token, "update_med_status", { id, status });
    fetchData();
  };

  const addNote = async () => {
    if (!noteInput.trim()) return;
    setAddingNote(true);
    const result = await ngoApi(token, "add_note", { content: noteInput.trim() });
    if (result) setNotes([result, ...notes]);
    setNoteInput("");
    setAddingNote(false);
  };

  // ─── LOGIN SCREEN ───
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(220,25%,6%)] px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(220,22%,12%)] ring-1 ring-[hsl(220,15%,20%)]">
              <Lock className="h-8 w-8 text-[hsl(185,70%,42%)]" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[hsl(210,20%,92%)]">
              {isAr ? "القناة الآمنة" : "Secure Channel"}
            </h1>
            <p className="text-center text-sm text-[hsl(215,15%,55%)]">
              {isAr ? "أدخل رمز الوصول المقدم من المسؤول" : "Enter the access token provided by your admin"}
            </p>
          </div>

          <div className="rounded-xl border border-[hsl(220,15%,20%)] bg-[hsl(220,22%,10%)] p-6">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder={isAr ? "رمز الوصول..." : "Access token..."}
              className="mb-4 w-full rounded-lg border border-[hsl(220,15%,20%)] bg-[hsl(220,25%,8%)] px-4 py-3 font-mono text-sm text-[hsl(210,20%,92%)] placeholder:text-[hsl(215,15%,35%)] focus:outline-none focus:ring-2 focus:ring-[hsl(185,70%,42%)]"
              autoFocus
            />
            {authError && (
              <p className="mb-3 text-sm text-[hsl(0,80%,55%)]">{authError}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={!tokenInput || authLoading}
              className="w-full rounded-lg bg-[hsl(185,70%,42%)] py-3 font-heading font-semibold text-[hsl(220,25%,8%)] transition-colors hover:bg-[hsl(185,70%,50%)] disabled:opacity-50"
            >
              {authLoading
                ? (isAr ? "جارٍ التحقق..." : "Verifying...")
                : (isAr ? "دخول" : "Enter")}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[hsl(215,15%,40%)]">
            <Shield className="h-3.5 w-3.5" />
            <span>{isAr ? "لا يتم تسجيل عنوان IP أو الموقع" : "No IP or location logging"}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── SECURE DASHBOARD ───
  const tabs: { id: Tab; label: string; icon: typeof Building2; count?: number }[] = [
    { id: "sos",          label: isAr ? "تنبيهات SOS"    : "SOS Alerts",         icon: AlertTriangle,  count: sosAlerts.filter(a => a.status === "active").length },
    { id: "med_requests", label: isAr ? "طلبات الأدوية"  : "Med Requests",        icon: Pill,           count: medRequests.filter(m => m.status === "pending").length },
    { id: "requests",     label: isAr ? "الطلبات الموجَّهة" : "Routed Requests",  icon: Building2,      count: serviceRequests.filter(r => r.status === "routed").length },
    { id: "notes",        label: isAr ? "ملاحظات التنسيق" : "Coordination Notes", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[hsl(220,25%,6%)]">
      {/* Top bar */}
      <div className="border-b border-[hsl(220,15%,15%)] bg-[hsl(220,22%,8%)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[hsl(185,70%,42%)]" />
            <span className="font-heading text-sm font-semibold text-[hsl(210,20%,92%)]">
              {isAr ? "القناة الآمنة للمنظمات" : "NGO Secure Channel"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} disabled={loading} className="rounded-lg p-2 text-[hsl(215,15%,55%)] transition-colors hover:bg-[hsl(220,22%,12%)] hover:text-[hsl(210,20%,85%)]">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg bg-[hsl(220,22%,12%)] px-3 py-1.5 text-xs font-medium text-[hsl(215,15%,55%)] transition-colors hover:text-[hsl(0,80%,55%)]">
              <LogOut className="h-3.5 w-3.5" />
              {isAr ? "خروج" : "Exit"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[hsl(220,15%,15%)] bg-[hsl(220,22%,8%)] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-[hsl(185,70%,42%)] text-[hsl(220,25%,8%)]"
                  : "text-[hsl(215,15%,55%)] hover:text-[hsl(210,20%,85%)]"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count && t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === t.id ? "bg-[hsl(220,25%,8%)]/20 text-[hsl(220,25%,8%)]" : "bg-[hsl(0,80%,55%)]/20 text-[hsl(0,80%,55%)]"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* SOS Alerts */}
        {tab === "sos" && (
          <div className="space-y-3">
            {sosAlerts.length === 0 && <EmptyBox text={isAr ? "لا توجد تنبيهات" : "No alerts"} />}
            {sosAlerts.map((a) => (
              <div key={a.id} className="rounded-xl border border-[hsl(220,15%,15%)] bg-[hsl(220,22%,10%)] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[hsl(210,20%,92%)]">{a.message || (isAr ? "تنبيه طوارئ" : "Emergency alert")}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[hsl(215,15%,45%)]">
                      <Clock className="h-3 w-3" />
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${sosColor[a.status] || ""}`}>
                    {a.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["active", "responding", "resolved", "cancelled"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateSos(a.id, s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                        a.status === s
                          ? "ring-2 ring-[hsl(185,70%,42%)] " + (sosColor[s] || "")
                          : "bg-[hsl(220,18%,16%)] text-[hsl(215,15%,55%)] hover:text-[hsl(210,20%,85%)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Med Requests */}
        {tab === "med_requests" && (
          <div className="space-y-3">
            {medRequests.length === 0 && <EmptyBox text={isAr ? "لا توجد طلبات" : "No requests"} />}
            {medRequests.map((r) => (
              <div key={r.id} className="rounded-xl border border-[hsl(220,15%,15%)] bg-[hsl(220,22%,10%)] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-[hsl(210,20%,92%)]">{r.medication_name}</h3>
                    <p className="mt-0.5 text-xs text-[hsl(215,15%,45%)]">{new Date(r.created_at).toLocaleString()}</p>
                    {r.notes && <p className="mt-1 text-xs text-[hsl(215,15%,55%)]">{r.notes}</p>}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${urgencyColor[r.urgency] || ""}`}>
                    {r.urgency}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["pending", "approved", "fulfilled", "cancelled"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateMed(r.id, s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                        r.status === s
                          ? "ring-2 ring-[hsl(185,70%,42%)] bg-[hsl(185,70%,42%)]/10 text-[hsl(185,70%,50%)]"
                          : "bg-[hsl(220,18%,16%)] text-[hsl(215,15%,55%)] hover:text-[hsl(210,20%,85%)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Routed Service Requests */}
        {tab === "requests" && (
          <div className="space-y-3">
            {serviceRequests.length === 0 && <EmptyBox text={isAr ? "لا توجد طلبات موجَّهة" : "No routed requests"} />}
            {serviceRequests.map((r) => (
              <div key={r.id} className="rounded-xl border border-[hsl(220,15%,15%)] bg-[hsl(220,22%,10%)] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-[hsl(210,20%,92%)]">{r.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[hsl(215,15%,45%)]">
                      <span className="capitalize">{r.type}</span>
                      {r.category && <span>· {r.category.replace(/_/g, " ")}</span>}
                      {r.priority_score !== undefined && <span>· Priority: {r.priority_score}</span>}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[hsl(215,15%,40%)]">
                      <Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${urgencyColor[r.urgency] || ""}`}>{r.urgency}</span>
                    <span className="text-xs text-[hsl(215,15%,50%)] capitalize">{r.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Coordination Notes */}
        {tab === "notes" && (
          <div>
            <div className="mb-4 flex gap-2">
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder={isAr ? "أضف ملاحظة تنسيق..." : "Add coordination note..."}
                className="flex-1 rounded-lg border border-[hsl(220,15%,20%)] bg-[hsl(220,25%,8%)] px-4 py-3 text-sm text-[hsl(210,20%,92%)] placeholder:text-[hsl(215,15%,35%)] focus:outline-none focus:ring-2 focus:ring-[hsl(185,70%,42%)]"
              />
              <button
                onClick={addNote}
                disabled={!noteInput.trim() || addingNote}
                className="rounded-lg bg-[hsl(185,70%,42%)] px-4 py-3 text-[hsl(220,25%,8%)] transition-colors hover:bg-[hsl(185,70%,50%)] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {notes.length === 0 && <EmptyBox text={isAr ? "لا توجد ملاحظات" : "No notes yet"} />}
              {notes.map((n) => (
                <div key={n.id} className="rounded-xl border border-[hsl(220,15%,15%)] bg-[hsl(220,22%,10%)] p-4">
                  <p className="text-sm text-[hsl(210,20%,92%)]">{n.content}</p>
                  <p className="mt-2 text-xs text-[hsl(215,15%,40%)]">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inactivity warning bar */}
      <div className="fixed bottom-0 start-0 end-0 border-t border-[hsl(220,15%,15%)] bg-[hsl(220,22%,8%)] px-4 py-2 text-center text-xs text-[hsl(215,15%,40%)]">
        <Shield className="mb-0.5 inline h-3 w-3" /> {isAr ? "خروج تلقائي بعد 10 دقائق من عدم النشاط" : "Auto-logout after 10 minutes of inactivity"}
      </div>
    </div>
  );
};

const EmptyBox = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-[hsl(220,15%,20%)] bg-[hsl(220,22%,8%)] py-12 text-center text-sm text-[hsl(215,15%,45%)]">
    {text}
  </div>
);

export default NgoSecure;
