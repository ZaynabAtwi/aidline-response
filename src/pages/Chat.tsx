import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, AlertTriangle, RefreshCw, Check, Eye } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { chatApi } from "@/lib/api/client";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  sender: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const MAX_LENGTH = 500;
const RATE_LIMIT_MS = 20000;

const Chat = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [useBackend, setUseBackend] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadConversation();
  }, [user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const res = await chatApi.createConversation();
      if (res.success && res.data?.id) {
        setConversationId(res.data.id);
        setUseBackend(true);
        await fetchMessages(res.data.id, true);
        setLoading(false);
        return;
      }
    } catch {
      setUseBackend(false);
    }

    // Fallback: Supabase
    const { data: convos } = await (supabase as any)
      .from("chat_conversations")
      .select("id")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1);

    let convId = convos?.[0]?.id;
    if (!convId) {
      const { data: newConv } = await (supabase as any)
        .from("chat_conversations")
        .insert({ user_id: user!.id })
        .select("id")
        .single();
      convId = newConv?.id;
    }
    if (convId) {
      setConversationId(convId);
      await fetchMessages(convId, false);
    }
    setLoading(false);
  };

  const fetchMessages = async (convId: string, backend: boolean) => {
    if (backend) {
      try {
        const res = await chatApi.getMessages(convId);
        if (res.success) { setMessages(res.data); return; }
      } catch {
        // fall through
      }
    }
    const { data } = await (supabase as any)
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  const handleSend = async () => {
    if (!input.trim() || !conversationId || sending) return;
    if (input.length > MAX_LENGTH) return;

    const now = Date.now();
    if (now - lastSentAt < RATE_LIMIT_MS) {
      setCooldown(Math.ceil((RATE_LIMIT_MS - (now - lastSentAt)) / 1000));
      return;
    }

    setSending(true);
    if (useBackend) {
      try {
        const res = await chatApi.sendMessage(conversationId, input.trim());
        if (res.success) {
          setInput("");
          setLastSentAt(Date.now());
          await fetchMessages(conversationId, true);
          setSending(false);
          return;
        }
      } catch {
        // fall through to Supabase
      }
    }
    const { error } = await (supabase as any).from("chat_messages").insert({
      conversation_id: conversationId,
      sender: "user",
      message: input.trim(),
    });
    if (!error) {
      setInput("");
      setLastSentAt(Date.now());
      await fetchMessages(conversationId, false);
    }
    setSending(false);
  };

  const handleRefresh = () => {
    if (conversationId) fetchMessages(conversationId, useBackend);
  };

  const getStatusIcon = (msg: Message) => {
    if (msg.sender === "ngo") return null;
    if (msg.is_read) return <Eye className="h-3.5 w-3.5 text-primary" />;
    return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getStatusText = (msg: Message) => {
    if (msg.sender === "ngo") return null;
    if (msg.is_read) return isAr ? "مقروءة" : "Viewed";
    return isAr ? "مُرسلة" : "Sent";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pb-24 md:pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24 md:pt-20">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-7 w-7 text-primary" />
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {isAr ? "الدردشة والدعم" : "Chat & Support"}
            </h1>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <RefreshCw className="h-4 w-4" />
            {isAr ? "تحديث" : "Refresh"}
          </button>
        </div>

        {/* Emergency Notice */}
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              {isAr ? "إذا كانت الحالة طارئة اتصل بأرقام الطوارئ فوراً." : "If this is an emergency, call emergency numbers immediately."}
            </p>
            <Link to="/sos" className="mt-1 inline-block text-sm font-medium text-destructive underline">
              {isAr ? "أرقام الطوارئ →" : "Emergency Numbers →"}
            </Link>
          </div>
        </div>

        {/* Secure channel notice */}
        <div className="mb-4 rounded-lg border border-border bg-secondary/30 px-4 py-2 text-xs text-muted-foreground">
          {isAr
            ? "🔒 جلسة محمية — لا يتم مشاركة بيانات هويتك مع جهات خارجية."
            : "🔒 Secure session — your identity is not shared with external parties."}
        </div>

        {/* Messages Area */}
        <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-4" style={{ minHeight: "300px", maxHeight: "60vh" }}>
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12 text-center text-muted-foreground">
              <p>{isAr ? "لا توجد رسائل بعد. أرسل رسالتك الأولى!" : "No messages yet. Send your first message!"}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.sender === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                  <div className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${
                    msg.sender === "user" ? "opacity-70 justify-end" : "text-muted-foreground"
                  }`}>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString(isAr ? "ar" : "en", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {getStatusIcon(msg) && (
                      <>
                        <span>·</span>
                        {getStatusIcon(msg)}
                        <span>{getStatusText(msg)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="mt-4 space-y-2">
          {cooldown > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {isAr ? `انتظر ${cooldown} ثانية قبل الإرسال` : `Wait ${cooldown}s before sending`}
            </p>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={isAr ? "اكتب رسالتك..." : "Type your message..."}
                rows={2}
                className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className={`absolute bottom-2 end-3 text-[11px] ${input.length > MAX_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                {input.length}/{MAX_LENGTH}
              </span>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || cooldown > 0}
              className="flex h-auto min-w-[52px] items-center justify-center rounded-xl bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
