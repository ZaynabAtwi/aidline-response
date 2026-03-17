import { useState, useEffect } from "react";
import { Building2, Pill, AlertTriangle, Users, ClipboardList, Save, X, Edit2, UserCheck, MessageCircle, Send, Workflow } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";

type Tab = "shelters" | "medication" | "sos" | "volunteers" | "requests" | "messages";

// ── Types ──
interface Shelter { id: string; name: string; address: string | null; capacity: number; available_spots: number; is_operational: boolean; ngo: string | null; }
interface MedRequest { id: string; medication_name: string; urgency: string; status: string; created_at: string; notes: string | null; user_id: string; }
interface SOSAlert { id: string; message: string | null; status: string; created_at: string; user_id: string; responded_by: string | null; }
interface Volunteer { id: string; user_id: string; skills: string[]; status: string; rating: number | null; bio: string | null; }

const Dashboard = () => {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("shelters");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) checkRole();
  }, [user]);

  const checkRole = async () => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "ngo_admin");
    setIsAdmin(data && data.length > 0);
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
    { id: "shelters", label: lang === "ar" ? "موارد الإيواء" : "Shelter Resources", icon: Building2 },
    { id: "requests", label: lang === "ar" ? "قائمة التوجيه" : "Routing Queue", icon: ClipboardList },
    { id: "medication", label: lang === "ar" ? "مخزون الأدوية" : "Medication Inventory", icon: Pill },
    { id: "sos", label: lang === "ar" ? "حالات الطوارئ" : "Emergency Cases", icon: AlertTriangle },
    { id: "volunteers", label: lang === "ar" ? "مجمع المستجيبين" : "Responder Pool", icon: Users },
    { id: "messages", label: lang === "ar" ? "الاتصال الآمن" : "Secure Communication", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h1 className="mb-6 font-heading text-3xl font-bold text-foreground">
          {lang === "ar" ? "لوحة تحكم المنظمة" : "NGO Admin Dashboard"}
        </h1>
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-card p-4 text-sm text-muted-foreground">
          <Workflow className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            {lang === "ar"
              ? "تعمل هذه اللوحة كطبقة توجيه ومتابعة: فرز الطلبات، إسناد المستجيب المناسب، ثم متابعة الحالة عبر القنوات الآمنة من دون أي اعتماد على الموقع."
              : "This dashboard acts as a routing and follow-up layer: triage requests, assign the right responder, and coordinate resolution through secure channels without relying on location data."}
          </p>
        </div>

        {/* Tab Navigation */}
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

        {/* Tab Content */}
        {tab === "shelters" && <ShelterManager lang={lang} />}
        {tab === "requests" && <MedRequestList lang={lang} />}
        {tab === "medication" && <MedicationInventory lang={lang} />}
        {tab === "sos" && <SOSAlertPanel lang={lang} />}
        {tab === "volunteers" && <VolunteerAssignment lang={lang} />}
        {tab === "messages" && <ChatMessagesPanel lang={lang} />}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════
// 1. SHELTER CAPACITY MANAGER
// ══════════════════════════════════════════
const ShelterManager = ({ lang }: { lang: string }) => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ capacity: 0, available_spots: 0, is_operational: true });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("shelters").select("*").order("name");
    if (data) setShelters(data);
    setLoading(false);
  };

  const startEdit = (s: Shelter) => {
    setEditing(s.id);
    setEditValues({ capacity: s.capacity, available_spots: s.available_spots, is_operational: s.is_operational });
  };

  const saveEdit = async (id: string) => {
    await supabase.from("shelters").update(editValues).eq("id", id);
    setEditing(null);
    fetch();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      {shelters.length === 0 && <EmptyState text={lang === "ar" ? "لا توجد ملاجئ" : "No shelters"} />}
      {shelters.map((s) => (
        <div key={s.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{s.name}</h3>
              {s.address && <p className="text-sm text-muted-foreground">{s.address}</p>}
              {s.ngo && <p className="text-xs text-muted-foreground">{lang === "ar" ? "المنظمة" : "NGO"}: {s.ngo}</p>}
            </div>
            {editing === s.id ? (
              <div className="flex gap-2">
                <button onClick={() => saveEdit(s.id)} className="rounded-lg bg-success p-2 text-success-foreground"><Save className="h-4 w-4" /></button>
                <button onClick={() => setEditing(null)} className="rounded-lg bg-secondary p-2 text-secondary-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <button onClick={() => startEdit(s)} className="rounded-lg bg-secondary p-2 text-secondary-foreground hover:bg-secondary/80"><Edit2 className="h-4 w-4" /></button>
            )}
          </div>

          {editing === s.id ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{lang === "ar" ? "السعة" : "Capacity"}</label>
                <input type="number" value={editValues.capacity} onChange={(e) => setEditValues({ ...editValues, capacity: +e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{lang === "ar" ? "الأماكن المتاحة" : "Available"}</label>
                <input type="number" value={editValues.available_spots} onChange={(e) => setEditValues({ ...editValues, available_spots: +e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={editValues.is_operational} onChange={(e) => setEditValues({ ...editValues, is_operational: e.target.checked })}
                    className="h-4 w-4 rounded border-input" />
                  {lang === "ar" ? "تعمل" : "Operational"}
                </label>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-4">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${s.is_operational ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {s.is_operational ? (lang === "ar" ? "تعمل" : "Operational") : (lang === "ar" ? "متوقفة" : "Closed")}
              </span>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{s.available_spots}</span>/{s.capacity} {lang === "ar" ? "متاح" : "available"}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${s.available_spots > 0 ? "bg-success" : "bg-accent"}`}
                  style={{ width: `${s.capacity > 0 ? ((s.capacity - s.available_spots) / s.capacity) * 100 : 0}%` }} />
              </div>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("medication_requests").select("*").order("created_at", { ascending: false });
    if (data) setRequests(data as MedRequest[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("medication_requests").update({ status: status as any }).eq("id", id);
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
// 3. MEDICATION INVENTORY (Pharmacies)
// ══════════════════════════════════════════
interface Pharmacy { id: string; name: string; address: string | null; phone: string | null; is_operational: boolean; available_medications: string[] | null; }

const MedicationInventory = ({ lang }: { lang: string }) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [medInput, setMedInput] = useState("");
  const [editMeds, setEditMeds] = useState<string[]>([]);

  useEffect(() => { fetchP(); }, []);

  const fetchP = async () => {
    const { data } = await supabase.from("pharmacies").select("*").order("name");
    if (data) setPharmacies(data);
    setLoading(false);
  };

  const startEdit = (p: Pharmacy) => {
    setEditing(p.id);
    setEditMeds(p.available_medications || []);
    setMedInput("");
  };

  const addMed = () => {
    if (medInput.trim() && !editMeds.includes(medInput.trim())) {
      setEditMeds([...editMeds, medInput.trim()]);
      setMedInput("");
    }
  };

  const removeMed = (m: string) => setEditMeds(editMeds.filter((x) => x !== m));

  const saveEdit = async (id: string) => {
    await supabase.from("pharmacies").update({ available_medications: editMeds }).eq("id", id);
    setEditing(null);
    fetchP();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      {pharmacies.length === 0 && <EmptyState text={lang === "ar" ? "لا توجد صيدليات" : "No pharmacies"} />}
      {pharmacies.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{p.name}</h3>
              {p.address && <p className="text-sm text-muted-foreground">{p.address}</p>}
            </div>
            {editing === p.id ? (
              <div className="flex gap-2">
                <button onClick={() => saveEdit(p.id)} className="rounded-lg bg-success p-2 text-success-foreground"><Save className="h-4 w-4" /></button>
                <button onClick={() => setEditing(null)} className="rounded-lg bg-secondary p-2 text-secondary-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <button onClick={() => startEdit(p)} className="rounded-lg bg-secondary p-2 text-secondary-foreground hover:bg-secondary/80"><Edit2 className="h-4 w-4" /></button>
            )}
          </div>

          {editing === p.id ? (
            <div className="mt-4">
              <div className="mb-3 flex gap-2">
                <input value={medInput} onChange={(e) => setMedInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMed())}
                  placeholder={lang === "ar" ? "أضف دواء..." : "Add medication..."}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
                <button onClick={addMed} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">+</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editMeds.map((m) => (
                  <span key={m} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {m}
                    <button onClick={() => removeMed(m)} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {(p.available_medications || []).map((m) => (
                <span key={m} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{m}</span>
              ))}
              {(!p.available_medications || p.available_medications.length === 0) && (
                <span className="text-xs text-muted-foreground">{lang === "ar" ? "لا توجد أدوية مسجلة" : "No medications listed"}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════
// 4. SOS ALERT PANEL
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
    const { data } = await supabase.from("sos_alerts").select("*").order("created_at", { ascending: false });
    if (data) setAlerts(data as SOSAlert[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "resolved") update.resolved_at = new Date().toISOString();
    await supabase.from("sos_alerts").update(update).eq("id", id);
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
// 5. VOLUNTEER ASSIGNMENT
// ══════════════════════════════════════════
const VolunteerAssignment = ({ lang }: { lang: string }) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchV(); }, []);

  const fetchV = async () => {
    const { data } = await supabase.from("volunteers").select("*").order("created_at", { ascending: false });
    if (data) setVolunteers(data as Volunteer[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("volunteers").update({ status: status as any }).eq("id", id);
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
                {v.skills.map((s) => (
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
// 6. CHAT MESSAGES PANEL (NGO)
// ══════════════════════════════════════════
interface ChatConversation {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const chatStatusColors: Record<string, string> = {
  open: "bg-success/15 text-success",
  in_progress: "bg-accent/15 text-accent",
  closed: "bg-muted text-muted-foreground",
};

const ChatMessagesPanel = ({ lang }: { lang: string }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("chat_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data as ChatConversation[]);
    setLoading(false);
  };

  const selectConversation = async (convId: string) => {
    setSelectedConv(convId);
    const { data } = await (supabase as any)
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);

    // Mark all user messages as read
    await (supabase as any)
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", convId)
      .eq("sender", "user")
      .eq("is_read", false);
  };

  const updateConvStatus = async (convId: string, status: string) => {
    await (supabase as any).from("chat_conversations").update({ status, updated_at: new Date().toISOString() }).eq("id", convId);
    fetchConversations();
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv || sending) return;
    setSending(true);
    await (supabase as any).from("chat_messages").insert({
      conversation_id: selectedConv,
      sender: "ngo",
      message: reply.trim(),
    });
    await (supabase as any).from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", selectedConv);
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
          <button
            onClick={() => { setSelectedConv(null); setMessages([]); }}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
          >
            ← {lang === "ar" ? "العودة" : "Back"}
          </button>
          <div className="flex gap-2">
            {(["open", "in_progress", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateConvStatus(selectedConv, s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                  conv?.status === s ? "bg-primary text-primary-foreground ring-2 ring-ring" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {lang === "ar" ? "المعرّف:" : "ID:"} {conv?.user_id.slice(0, 8)}...
        </p>

        {/* Messages */}
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
                  {msg.sender === "user" && <span className="ms-2">{msg.is_read ? (lang === "ar" ? "✓ مقروءة" : "✓ Read") : ""}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply */}
        <div className="flex gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value.slice(0, 500))}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            placeholder={lang === "ar" ? "اكتب الرد..." : "Type reply..."}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={sendReply}
            disabled={!reply.trim() || sending}
            className="flex items-center justify-center rounded-xl bg-primary px-4 text-primary-foreground disabled:opacity-50"
          >
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
        <button
          key={c.id}
          onClick={() => selectConversation(c.id)}
          className="w-full rounded-xl border border-border bg-card p-5 text-start transition-colors hover:bg-secondary/30"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-foreground">{c.user_id.slice(0, 8)}...</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${chatStatusColors[c.status] || chatStatusColors.open}`}>
              {c.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(c.updated_at).toLocaleString(lang === "ar" ? "ar" : "en")}
          </p>
        </button>
      ))}
    </div>
  );
};

// ── Shared Components ──
const LoadingState = () => <div className="py-12 text-center text-muted-foreground">Loading...</div>;
const EmptyState = ({ text }: { text: string }) => <div className="py-12 text-center text-muted-foreground">{text}</div>;

export default Dashboard;
