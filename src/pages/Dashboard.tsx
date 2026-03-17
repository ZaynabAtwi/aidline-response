import { useState, useEffect } from "react";
import {
  Building2, Pill, AlertTriangle, Users, ClipboardList, Save, X, Edit2,
  UserCheck, MessageCircle, Send, Eye, BarChart3, TrendingUp, Activity, Clock
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/integrations/mysql/client";
import { Link, Navigate } from "react-router-dom";
import type {
  ServiceRequest, HealthcareProvider, Volunteer, Shelter,
  Conversation, Message as ChatMessage, AnalyticsDashboard
} from "@/integrations/mysql/types";

type Tab = "analytics" | "requests" | "shelters" | "volunteers" | "messages";

const Dashboard = () => {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading, roles } = useAuth();
  const [tab, setTab] = useState<Tab>("analytics");
  const isAr = lang === "ar";

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/onboarding" />;

  const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: "analytics", label: isAr ? "لوحة التحليلات" : "Analytics", icon: BarChart3 },
    { id: "requests", label: isAr ? "الطلبات" : "Requests", icon: ClipboardList },
    { id: "shelters", label: isAr ? "الملاجئ" : "Shelters", icon: Building2 },
    { id: "volunteers", label: isAr ? "المتطوعون" : "Volunteers", icon: Users },
    { id: "messages", label: isAr ? "الرسائل" : "Messages", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h1 className="mb-6 font-heading text-3xl font-bold text-foreground">
          {isAr ? "لوحة تحكم المنظمة" : "NGO Admin Dashboard"}
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

        {tab === "analytics" && <CrisisAnalyticsPanel lang={lang} />}
        {tab === "requests" && <RequestManagementPanel lang={lang} />}
        {tab === "shelters" && <ShelterManager lang={lang} />}
        {tab === "volunteers" && <VolunteerAssignment lang={lang} />}
        {tab === "messages" && <ChatMessagesPanel lang={lang} />}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════
// 1. CRISIS ANALYTICS & INTELLIGENCE
// ══════════════════════════════════════════
const CrisisAnalyticsPanel = ({ lang }: { lang: string }) => {
  const isAr = lang === "ar";
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await api.analytics.dashboard();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setLoading(false);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label={isAr ? "إجمالي الطلبات" : "Total Requests"}
          value={analytics?.overview.totalRequests || 0}
          color="text-primary"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label={isAr ? "تنبيهات SOS نشطة" : "Active SOS"}
          value={analytics?.overview.activeSOS || 0}
          color="text-destructive"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label={isAr ? "وقت الاستجابة (دقائق)" : "Avg Response (min)"}
          value={analytics?.overview.avgResponseMinutes || 0}
          color="text-accent"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={isAr ? "معدل الحل" : "Resolution Rate"}
          value={`${analytics?.overview.resolutionRate || 0}%`}
          color="text-success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            {isAr ? "الطلبات حسب النوع" : "Requests by Type"}
          </h3>
          <div className="space-y-2">
            {(analytics?.requestsByType || []).map((item) => (
              <div key={item.request_type} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <span className="text-sm capitalize text-foreground">{item.request_type.replace(/_/g, ' ')}</span>
                <span className="text-sm font-semibold text-primary">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-accent" />
            {isAr ? "الطلبات حسب الاستعجال" : "Requests by Urgency"}
          </h3>
          <div className="space-y-2">
            {(analytics?.requestsByUrgency || []).map((item) => {
              const colors: Record<string, string> = {
                low: 'bg-muted', medium: 'bg-accent/20', high: 'bg-accent/40', critical: 'bg-destructive/20'
              };
              return (
                <div key={item.urgency_level} className={`flex items-center justify-between rounded-lg px-3 py-2 ${colors[item.urgency_level] || 'bg-secondary/50'}`}>
                  <span className="text-sm capitalize text-foreground">{item.urgency_level}</span>
                  <span className="text-sm font-semibold text-foreground">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
          <Users className="h-4 w-4 text-success" />
          {isAr ? "مقدمو الخدمات النشطون" : "Active Service Providers"}
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{analytics?.activeProviders?.healthcare || 0}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "مقدمو رعاية صحية" : "Healthcare"}</p>
          </div>
          <div className="rounded-lg bg-accent/10 p-3 text-center">
            <p className="text-2xl font-bold text-accent">{analytics?.activeProviders?.pharmacies || 0}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "صيدليات" : "Pharmacies"}</p>
          </div>
          <div className="rounded-lg bg-success/10 p-3 text-center">
            <p className="text-2xl font-bold text-success">{analytics?.activeProviders?.ngos || 0}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "منظمات" : "NGOs"}</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{analytics?.activeProviders?.volunteers || 0}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "متطوعون" : "Volunteers"}</p>
          </div>
        </div>
      </div>

      {analytics?.medicationDemand && analytics.medicationDemand.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
            <Pill className="h-4 w-4 text-primary" />
            {isAr ? "أكثر الأدوية طلباً" : "Top Medication Demand"}
          </h3>
          <div className="space-y-2">
            {analytics.medicationDemand.map((item) => (
              <div key={item.medication} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <span className="text-sm text-foreground">{item.medication}</span>
                <span className="text-sm font-semibold text-primary">{item.demand_count} {isAr ? "طلب" : "requests"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className={`mb-2 ${color}`}>{icon}</div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

// ══════════════════════════════════════════
// 2. REQUEST MANAGEMENT (Unified Pipeline View)
// ══════════════════════════════════════════
const urgencyColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground", medium: "bg-accent/15 text-accent",
  high: "bg-accent/25 text-accent", critical: "bg-destructive/15 text-destructive",
};

const statusColors: Record<string, string> = {
  submitted: "bg-muted text-muted-foreground",
  classifying: "bg-accent/15 text-accent",
  classified: "bg-accent/20 text-accent",
  routing: "bg-primary/15 text-primary",
  routed: "bg-primary/20 text-primary",
  accepted: "bg-success/15 text-success",
  in_progress: "bg-success/20 text-success",
  resolved: "bg-success/30 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

const RequestManagementPanel = ({ lang }: { lang: string }) => {
  const isAr = lang === "ar";
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const data = await api.requests.listAll({});
      if (data.requests) setRequests(data.requests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.requests.updateStatus(id, status);
      fetchAll();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      {requests.length === 0 && <EmptyState text={isAr ? "لا توجد طلبات" : "No requests"} />}
      {requests.map((r) => (
        <div key={r.id} className={`rounded-xl border bg-card p-5 ${
          r.urgency_level === 'critical' ? 'border-destructive/50' : 'border-border'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">{r.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString()} · {r.request_type.replace(/_/g, ' ')}
              </p>
              {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${urgencyColors[r.urgency_level]}`}>
                {r.urgency_level}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[r.status] || ''}`}>
                {r.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['accepted', 'in_progress', 'resolved', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(r.id, s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                  r.status === s ? "bg-primary text-primary-foreground ring-2 ring-ring" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════
// 3. SHELTER MANAGER
// ══════════════════════════════════════════
const ShelterManager = ({ lang }: { lang: string }) => {
  const isAr = lang === "ar";
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ capacity: 0, available_spots: 0, is_operational: true });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const data = await api.providers.shelters.list();
      if (data.shelters) setShelters(data.shelters);
    } catch (error) {
      console.error('Failed to fetch shelters:', error);
    }
    setLoading(false);
  };

  const startEdit = (s: Shelter) => {
    setEditing(s.id);
    setEditValues({ capacity: s.capacity, available_spots: s.available_spots, is_operational: s.is_operational });
  };

  const saveEdit = async (id: string) => {
    try {
      await api.providers.shelters.update(id, editValues);
      setEditing(null);
      fetch();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      {shelters.length === 0 && <EmptyState text={isAr ? "لا توجد ملاجئ" : "No shelters"} />}
      {shelters.map((s) => (
        <div key={s.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{s.name}</h3>
              {s.address && <p className="text-sm text-muted-foreground">{s.address}</p>}
              {s.ngo_affiliation && <p className="text-xs text-muted-foreground">{isAr ? "المنظمة" : "NGO"}: {s.ngo_affiliation}</p>}
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
                <label className="mb-1 block text-xs text-muted-foreground">{isAr ? "السعة" : "Capacity"}</label>
                <input type="number" value={editValues.capacity} onChange={(e) => setEditValues({ ...editValues, capacity: +e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{isAr ? "الأماكن المتاحة" : "Available"}</label>
                <input type="number" value={editValues.available_spots} onChange={(e) => setEditValues({ ...editValues, available_spots: +e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={editValues.is_operational} onChange={(e) => setEditValues({ ...editValues, is_operational: e.target.checked })}
                    className="h-4 w-4 rounded border-input" />
                  {isAr ? "تعمل" : "Operational"}
                </label>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-4">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${s.is_operational ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {s.is_operational ? (isAr ? "تعمل" : "Operational") : (isAr ? "متوقفة" : "Closed")}
              </span>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{s.available_spots}</span>/{s.capacity} {isAr ? "متاح" : "available"}
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
// 4. VOLUNTEER ASSIGNMENT
// ══════════════════════════════════════════
const VolunteerAssignment = ({ lang }: { lang: string }) => {
  const isAr = lang === "ar";
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchV(); }, []);

  const fetchV = async () => {
    try {
      const data = await api.providers.volunteers.list();
      if (data.volunteers) {
        setVolunteers(data.volunteers.map((v: any) => ({
          ...v,
          skills: typeof v.skills === 'string' ? JSON.parse(v.skills) : v.skills || [],
        })));
      }
    } catch (error) {
      console.error('Failed to fetch volunteers:', error);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.providers.volunteers.updateStatus(id, status);
      fetchV();
    } catch (error) {
      console.error('Failed to update volunteer:', error);
    }
  };

  if (loading) return <LoadingState />;

  const statusColorMap: Record<string, string> = {
    available: "text-success", assigned: "text-accent", unavailable: "text-destructive",
  };

  return (
    <div className="space-y-3">
      {volunteers.length === 0 && <EmptyState text={isAr ? "لا يوجد متطوعون" : "No volunteers"} />}
      {volunteers.map((v) => {
        const skills = Array.isArray(v.skills) ? v.skills : [];
        return (
          <div key={v.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {v.bio ? v.bio.slice(0, 40) : (isAr ? "متطوع" : "Volunteer")}
                </h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {skills.map((s: string) => (
                    <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{s}</span>
                  ))}
                </div>
              </div>
              <span className={`text-sm font-medium capitalize ${statusColorMap[v.status]}`}>{v.status}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => updateStatus(v.id, "available")}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${v.status === "available" ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <UserCheck className="h-3.5 w-3.5" /> {isAr ? "متاح" : "Available"}
              </button>
              <button onClick={() => updateStatus(v.id, "assigned")}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${v.status === "assigned" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <Users className="h-3.5 w-3.5" /> {isAr ? "مكلّف" : "Assigned"}
              </button>
              <button onClick={() => updateStatus(v.id, "unavailable")}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${v.status === "unavailable" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <X className="h-3.5 w-3.5" /> {isAr ? "غير متاح" : "Unavailable"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ══════════════════════════════════════════
// 5. CHAT MESSAGES PANEL (NGO)
// ══════════════════════════════════════════
const chatStatusColors: Record<string, string> = {
  open: "bg-success/15 text-success",
  active: "bg-accent/15 text-accent",
  resolved: "bg-primary/15 text-primary",
  closed: "bg-muted text-muted-foreground",
};

const ChatMessagesPanel = ({ lang }: { lang: string }) => {
  const isAr = lang === "ar";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await api.messaging.listAllConversations();
      if (data.conversations) setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
    setLoading(false);
  };

  const selectConversation = async (convId: string) => {
    setSelectedConv(convId);
    try {
      const data = await api.messaging.getMessages(convId);
      if (data.messages) setMessages(data.messages);
      await api.messaging.markRead(convId, 'user');
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const updateConvStatus = async (convId: string, status: string) => {
    try {
      await api.messaging.updateConversationStatus(convId, status);
      fetchConversations();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      await api.messaging.sendMessage(selectedConv, {
        content: reply.trim(),
        sender_type: 'responder',
      });
      setReply("");
      await selectConversation(selectedConv);
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
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
            ← {isAr ? "العودة" : "Back"}
          </button>
          <div className="flex gap-2">
            {(["open", "active", "resolved", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateConvStatus(selectedConv, s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                  conv?.status === s ? "bg-primary text-primary-foreground ring-2 ring-ring" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {isAr ? "المعرّف:" : "ID:"} {conv?.user_id.slice(0, 8)}...
        </p>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4" style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {messages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{isAr ? "لا رسائل" : "No messages"}</p>
          ) : messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_type === "responder" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.sender_type === "responder" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-secondary-foreground"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`mt-1 text-[11px] ${msg.sender_type === "responder" ? "opacity-70 text-end" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString(isAr ? "ar" : "en", { hour: "2-digit", minute: "2-digit" })}
                  {msg.sender_type === "user" && <span className="ms-2">{msg.is_read ? (isAr ? "✓ مقروءة" : "✓ Read") : ""}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value.slice(0, 2000))}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            placeholder={isAr ? "اكتب الرد..." : "Type reply..."}
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
      {conversations.length === 0 && <EmptyState text={isAr ? "لا توجد رسائل واردة" : "No incoming messages"} />}
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => selectConversation(c.id)}
          className="w-full rounded-xl border border-border bg-card p-5 text-start transition-colors hover:bg-secondary/30"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-foreground">{c.user_id.slice(0, 8)}...</span>
            <div className="flex items-center gap-2">
              {c.unread_count && c.unread_count > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                  {c.unread_count}
                </span>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${chatStatusColors[c.status] || chatStatusColors.open}`}>
                {c.status}
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(c.updated_at).toLocaleString(isAr ? "ar" : "en")}
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
