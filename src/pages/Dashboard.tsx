import { useState, useEffect } from "react";
import {
  Building2, Pill, AlertTriangle, Users, ClipboardList,
  Save, X, Edit2, UserCheck, MessageCircle, Send, BarChart2,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { listProviders } from "@/services/providersService";
import {
  listMedicationRequests,
  updateMedicationRequestStatus,
} from "@/services/medicationService";
import { listSosAlerts, updateSosStatus } from "@/services/sosService";
import { listVolunteers, updateVolunteerStatus } from "@/services/volunteersService";
import {
  getConversations as getChatConversations,
  getMessages as getChatMessages,
  sendMessage as sendChatMessage,
  updateConversationStatus as updateChatConversationStatus,
} from "@/services/chatService";
import { getAnalyticsSummary, getMedicationShortages } from "@/services/analyticsService";
import { Link, Navigate } from "react-router-dom";

type Tab = "providers" | "medication" | "sos" | "volunteers" | "messages" | "analytics";

interface MedRequest  { id: string; medication_name: string; urgency: string; status: string; created_at: string; notes: string | null; user_id: string; }
interface SOSAlert    { id: string; message: string | null; status: string; created_at: string; user_id: string; responded_by: string | null; }
interface Volunteer   { id: string; user_id: string; skills: string[]; status: string; rating: number | null; bio: string | null; }
interface Provider    { id: string; name: string; type: string; contact_email: string | null; contact_phone: string | null; is_active: boolean; services: string[] | null; operating_hours: string | null; }

const Dashboard = () => {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading, checkRole } = useAuth();
  const [tab, setTab] = useState<Tab>("providers");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) checkRoleState();
  }, [user]);

  const checkRoleState = async () => {
    const hasAdminRole = await checkRole("ngo_admin");
    setIsAdmin(hasAdminRole);
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/onboarding" />;
  if (isAdmin === null) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">{t("common.loading")}</div>;
  if (!isAdmin) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
      <h1 className="font-heading text-2xl font-bold text-foreground">{lang === "ar" ? "الوصول مرفوض" : "Access Denied"}</h1>
      <p className="mt-2 text-muted-foreground">{lang === "ar" ? "هذه الصفحة مخصصة لمديري المنظمات فقط." : "This page is for NGO admins only."}</p>
      <Link to="/" className="mt-6 rounded-lg bg-primary px-6 py-3 font-heading text-sm font-semibold text-primary-foreground">{t("nav.home")}</Link>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: "providers",  label: lang === "ar" ? "مزودو الخدمة" : "Providers",    icon: Building2 },
    { id: "medication", label: lang === "ar" ? "طلبات الدواء" : "Med Requests",  icon: Pill },
    { id: "sos",        label: lang === "ar" ? "تنبيهات SOS" : "SOS Alerts",     icon: AlertTriangle },
    { id: "volunteers", label: lang === "ar" ? "المتطوعون" : "Volunteers",        icon: Users },
    { id: "messages",   label: lang === "ar" ? "الرسائل" : "Messages",            icon: MessageCircle },
    { id: "analytics",  label: lang === "ar" ? "التحليلات" : "Analytics",         icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h1 className="mb-6 font-heading text-3xl font-bold text-foreground">
          {lang === "ar" ? "لوحة تحكم المنظمة" : "NGO Admin Dashboard"}
        </h1>

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "providers"  && <ProviderPanel lang={lang} />}
        {tab === "medication" && <MedRequestList lang={lang} />}
        {tab === "sos"        && <SOSAlertPanel lang={lang} />}
        {tab === "volunteers" && <VolunteerAssignment lang={lang} />}
        {tab === "messages"   && <ChatMessagesPanel lang={lang} />}
        {tab === "analytics"  && <AnalyticsPanel lang={lang} />}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════
// 1. PROVIDER PANEL (replaces Shelter Manager)
// ══════════════════════════════════════════
const ProviderPanel = ({ lang }: { lang: string }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const rows = await listProviders();
      setProviders(rows.map((p: any) => ({
        ...p,
        services: typeof p.services === "string" ? JSON.parse(p.services) : p.services,
      })));
    } catch {
      setProviders([]);
    }
    setLoading(false);
  };

  if (loading) return <LoadingState />;

  const typeColors: Record<string, string> = {
    healthcare: "bg-accent/15 text-accent",
    pharmacy:   "bg-primary/15 text-primary",
    ngo:        "bg-success/15 text-success",
    government: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-3">
      {providers.length === 0 && <EmptyState text={lang === "ar" ? "لا يوجد مزودو خدمة" : "No service providers"} />}
      {providers.map((p) => (
        <div key={p.id} className={`rounded-xl border bg-card p-5 ${p.is_active ? "border-border" : "border-destructive/30 opacity-60"}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-lg font-semibold text-foreground">{p.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[p.type] || typeColors.government}`}>
                  {p.type}
                </span>
              </div>
              {p.contact_phone && <p className="text-sm text-muted-foreground">{p.contact_phone}</p>}
              {p.operating_hours && <p className="text-xs text-muted-foreground">{lang === "ar" ? "ساعات العمل:" : "Hours:"} {p.operating_hours}</p>}
            </div>
            <span className={`text-xs font-medium ${p.is_active ? "text-success" : "text-destructive"}`}>
              {p.is_active ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "غير نشط" : "Inactive")}
            </span>
          </div>
          {p.services && p.services.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.services.map((s) => (
                <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{s}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════
// 2. MEDICATION REQUEST LIST
// ══════════════════════════════════════════
const urgencyColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground", medium: "bg-accent/15 text-accent",
  high: "bg-accent/25 text-accent", critical: "bg-destructive/15 text-destructive",
};

const MedRequestList = ({ lang }: { lang: string }) => {
  const [requests, setRequests] = useState<MedRequest[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const rows = await listMedicationRequests();
      setRequests(rows as MedRequest[]);
    } catch {
      setRequests([]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateMedicationRequestStatus(id, status as any);
    } catch {
      // keep current state if update fails
    }
    fetchAll();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      {requests.length === 0 && <EmptyState text={lang === "ar" ? "لا توجد طلبات" : "No requests"} />}
      {requests.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">{r.medication_name}</h3>
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              {r.notes && <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${urgencyColors[r.urgency]}`}>{r.urgency}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["pending", "approved", "fulfilled", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(r.id, s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                  r.status === s ? "bg-primary text-primary-foreground ring-2 ring-ring" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════
// 3. SOS ALERT PANEL
// ══════════════════════════════════════════
const sosStatusColors: Record<string, string> = {
  active: "bg-destructive/15 text-destructive", responding: "bg-accent/15 text-accent",
  resolved: "bg-success/15 text-success", cancelled: "bg-muted text-muted-foreground",
};

const SOSAlertPanel = ({ lang }: { lang: string }) => {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      const rows = await listSosAlerts();
      setAlerts(rows as SOSAlert[]);
    } catch {
      setAlerts([]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateSosStatus(id, status as any);
    } catch {
      // keep UI responsive; errors are non-blocking for now
    }
    fetchAlerts();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      {alerts.length === 0 && <EmptyState text={lang === "ar" ? "لا توجد تنبيهات" : "No alerts"} />}
      {alerts.map((a) => (
        <div key={a.id} className={`rounded-xl border bg-card p-5 ${a.status === "active" ? "border-destructive/50" : "border-border"}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${a.status === "active" ? "text-destructive" : "text-muted-foreground"}`} />
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${sosStatusColors[a.status]}`}>{a.status}</span>
              </div>
              <p className="mt-2 text-sm text-foreground">{a.message || (lang === "ar" ? "لا توجد رسالة" : "No message")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["active", "responding", "resolved", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(a.id, s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                  a.status === s ? "bg-primary text-primary-foreground ring-2 ring-ring" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════
// 4. VOLUNTEER ASSIGNMENT
// ══════════════════════════════════════════
const VolunteerAssignment = ({ lang }: { lang: string }) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchV(); }, []);

  const fetchV = async () => {
    try {
      const rows = await listVolunteers();
      setVolunteers(rows.map((v: any) => ({
        ...v,
        skills: typeof v.skills === "string" ? JSON.parse(v.skills) : v.skills,
      })));
    } catch {
      setVolunteers([]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateVolunteerStatus(id, status as any);
    } catch {
      // keep page functional if API update fails
    }
    fetchV();
  };

  if (loading) return <LoadingState />;

  const statusColors: Record<string, string> = {
    available: "text-success", assigned: "text-accent", unavailable: "text-destructive",
  };

  return (
    <div className="space-y-3">
      {volunteers.length === 0 && <EmptyState text={lang === "ar" ? "لا يوجد متطوعون" : "No volunteers"} />}
      {volunteers.map((v) => (
        <div key={v.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                {v.bio ? v.bio.slice(0, 40) : (lang === "ar" ? "متطوع" : "Volunteer")}
              </h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {(Array.isArray(v.skills) ? v.skills : []).map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{s}</span>
                ))}
              </div>
            </div>
            <span className={`text-sm font-medium capitalize ${statusColors[v.status]}`}>{v.status}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => updateStatus(v.id, "available")}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${v.status === "available" ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <UserCheck className="h-3.5 w-3.5" /> {lang === "ar" ? "متاح" : "Available"}
            </button>
            <button onClick={() => updateStatus(v.id, "assigned")}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${v.status === "assigned" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <Users className="h-3.5 w-3.5" /> {lang === "ar" ? "مكلّف" : "Assigned"}
            </button>
            <button onClick={() => updateStatus(v.id, "unavailable")}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${v.status === "unavailable" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <X className="h-3.5 w-3.5" /> {lang === "ar" ? "غير متاح" : "Unavailable"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════
// 5. CHAT MESSAGES PANEL
// ══════════════════════════════════════════
interface ChatConversation { id: string; user_id: string; status: string; created_at: string; updated_at: string; }
interface ChatMessage      { id: string; sender: string; message: string; is_read: boolean; created_at: string; }

const chatStatusColors: Record<string, string> = {
  open: "bg-success/15 text-success", in_progress: "bg-accent/15 text-accent", closed: "bg-muted text-muted-foreground",
};

const ChatMessagesPanel = ({ lang }: { lang: string }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv]   = useState<string | null>(null);
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [reply, setReply]                 = useState("");
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const rows = await getChatConversations();
      setConversations(rows as ChatConversation[]);
    } catch {
      setConversations([]);
    }
    setLoading(false);
  };

  const selectConversation = async (convId: string) => {
    setSelectedConv(convId);
    try {
      const rows = await getChatMessages(convId);
      setMessages(rows as ChatMessage[]);
    } catch {
      setMessages([]);
    }
  };

  const updateConvStatus = async (convId: string, status: string) => {
    try {
      await updateChatConversationStatus(convId, status as any);
    } catch {
      // non-blocking
    }
    fetchConversations();
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      await sendChatMessage(selectedConv, reply.trim(), "ngo");
    } catch {
      // non-blocking fallback handled in service
    }
    setReply("");
    await selectConversation(selectedConv);
    setSending(false);
  };

  if (loading) return <LoadingState />;

  if (selectedConv) {
    const conv = conversations.find((c) => c.id === selectedConv);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => { setSelectedConv(null); setMessages([]); }}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
            ← {lang === "ar" ? "العودة" : "Back"}
          </button>
          <div className="flex gap-2">
            {(["open", "in_progress", "closed"] as const).map((s) => (
              <button key={s} onClick={() => updateConvStatus(selectedConv, s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                  conv?.status === s ? "bg-primary text-primary-foreground ring-2 ring-ring" : "bg-secondary text-secondary-foreground"
                }`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs font-mono text-muted-foreground">
          {lang === "ar" ? "المعرّف:" : "ID:"} {conv?.user_id.slice(0, 8)}...
        </p>
        <div className="space-y-3 rounded-xl border border-border bg-card p-4" style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {messages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{lang === "ar" ? "لا رسائل" : "No messages"}</p>
          ) : messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "ngo" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.sender === "ngo" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-secondary-foreground"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                <p className={`mt-1 text-[11px] ${msg.sender === "ngo" ? "opacity-70 text-end" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString(lang === "ar" ? "ar" : "en", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea value={reply} onChange={(e) => setReply(e.target.value.slice(0, 500))}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            placeholder={lang === "ar" ? "اكتب الرد..." : "Type reply..."} rows={2}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={sendReply} disabled={!reply.trim() || sending}
            className="flex items-center justify-center rounded-xl bg-primary px-4 text-primary-foreground disabled:opacity-50">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.length === 0 && <EmptyState text={lang === "ar" ? "لا توجد رسائل واردة" : "No incoming messages"} />}
      {conversations.map((c) => (
        <button key={c.id} onClick={() => selectConversation(c.id)}
          className="w-full rounded-xl border border-border bg-card p-5 text-start transition-colors hover:bg-secondary/30">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-foreground">{c.user_id.slice(0, 8)}...</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${chatStatusColors[c.status] || chatStatusColors.open}`}>
              {c.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleString(lang === "ar" ? "ar" : "en")}</p>
        </button>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════
// 6. ANALYTICS PANEL
// ══════════════════════════════════════════
const AnalyticsPanel = ({ lang }: { lang: string }) => {
  const [summary, setSummary] = useState<any>(null);
  const [shortages, setShortages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalyticsSummary().catch(() => null), getMedicationShortages().catch(() => null)]).then(
      ([sum, sh]) => {
        if (sum) setSummary(sum);
        if (sh) setShortages(sh);
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <LoadingState />;
  if (!summary) return <EmptyState text={lang === "ar" ? "لا تتوفر بيانات تحليلية" : "No analytics data available"} />;

  const { requests, providers, volunteers } = summary;

  return (
    <div className="space-y-6">
      {/* Request Stats */}
      <div>
        <h3 className="mb-3 font-heading text-base font-semibold text-foreground">
          {lang === "ar" ? "إحصاءات الطلبات" : "Request Statistics"}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: lang === "ar" ? "إجمالي الطلبات" : "Total Requests", value: requests?.total_requests ?? 0, color: "text-primary" },
            { label: lang === "ar" ? "تم حلها" : "Resolved", value: requests?.resolved_requests ?? 0, color: "text-success" },
            { label: lang === "ar" ? "نشطة" : "Active", value: requests?.active_requests ?? 0, color: "text-accent" },
            { label: lang === "ar" ? "حرجة" : "Critical", value: requests?.critical_requests ?? 0, color: "text-destructive" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className={`font-heading text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Request Type Breakdown */}
      <div>
        <h3 className="mb-3 font-heading text-base font-semibold text-foreground">
          {lang === "ar" ? "تصنيف الطلبات" : "Request Type Breakdown"}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "SOS",         value: requests?.sos_count          ?? 0, color: "text-destructive" },
            { label: lang === "ar" ? "طبي" : "Medical", value: requests?.medical_count ?? 0, color: "text-accent" },
            { label: lang === "ar" ? "دواء" : "Medication", value: requests?.medication_count ?? 0, color: "text-primary" },
            { label: lang === "ar" ? "إنساني" : "Humanitarian", value: requests?.humanitarian_count ?? 0, color: "text-success" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className={`font-heading text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Stats */}
      <div>
        <h3 className="mb-3 font-heading text-base font-semibold text-foreground">
          {lang === "ar" ? "إحصاءات المنصة" : "Platform Statistics"}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: lang === "ar" ? "مزودو الخدمة" : "Providers", value: providers?.active_providers ?? 0, color: "text-accent" },
            { label: lang === "ar" ? "المتطوعون المتاحون" : "Available Volunteers", value: volunteers?.available_volunteers ?? 0, color: "text-success" },
            { label: lang === "ar" ? "المتطوعون المكلّفون" : "Assigned Volunteers", value: volunteers?.assigned_volunteers ?? 0, color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className={`font-heading text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Medication Shortages */}
      {shortages.length > 0 && (
        <div>
          <h3 className="mb-3 font-heading text-base font-semibold text-foreground">
            {lang === "ar" ? "نقص الأدوية" : "Medication Shortage Monitor"}
          </h3>
          <div className="space-y-2">
            {shortages.slice(0, 5).map((s: any) => (
              <div key={s.medication_name} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <span className="font-medium text-foreground">{s.medication_name}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="text-destructive font-medium">{s.pending_requests} {lang === "ar" ? "طلب معلّق" : "pending"}</span>
                  {s.critical_requests > 0 && (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-destructive">{s.critical_requests} {lang === "ar" ? "حرج" : "critical"}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Shared Components ──
const LoadingState = () => <div className="py-12 text-center text-muted-foreground">Loading...</div>;
const EmptyState = ({ text }: { text: string }) => <div className="py-12 text-center text-muted-foreground">{text}</div>;

export default Dashboard;
