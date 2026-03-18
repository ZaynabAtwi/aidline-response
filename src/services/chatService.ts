import { apiRequest } from "./api";
import { createId, nowIso, readStore, writeStore } from "./mockDb";

const MOCK_CONVERSATIONS_KEY = "aidline_mock_chat_conversations";
const MOCK_MESSAGES_KEY = "aidline_mock_chat_messages";

export interface ChatConversation {
  id: string;
  user_id: string;
  status: "open" | "in_progress" | "closed";
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: "user" | "ngo";
  message: string;
  is_read: boolean;
  created_at: string;
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function normalizeConversation(raw: any): ChatConversation {
  return {
    id: String(raw?.id ?? createId("conv")),
    user_id: String(raw?.user_id ?? ""),
    status: (raw?.status || "open") as ChatConversation["status"],
    created_at: raw?.created_at ?? nowIso(),
    updated_at: raw?.updated_at ?? nowIso(),
  };
}

function normalizeMessage(raw: any): ChatMessage {
  return {
    id: String(raw?.id ?? createId("msg")),
    conversation_id: String(raw?.conversation_id ?? ""),
    sender: (raw?.sender || "user") as ChatMessage["sender"],
    message: String(raw?.message ?? ""),
    is_read: Boolean(raw?.is_read ?? false),
    created_at: raw?.created_at ?? nowIso(),
  };
}

function getMockConversations() {
  return readStore<ChatConversation[]>(MOCK_CONVERSATIONS_KEY, []);
}

function saveMockConversations(rows: ChatConversation[]) {
  writeStore(MOCK_CONVERSATIONS_KEY, rows);
}

function getMockMessages() {
  return readStore<ChatMessage[]>(MOCK_MESSAGES_KEY, []);
}

function saveMockMessages(rows: ChatMessage[]) {
  writeStore(MOCK_MESSAGES_KEY, rows);
}

export async function ensureConversation(userId: string): Promise<ChatConversation> {
  try {
    const payload = await apiRequest<any>("/chat/conversations", { method: "POST", body: { user_id: userId } });
    return normalizeConversation(payload?.data ?? payload);
  } catch {
    const conversations = getMockConversations();
    const existing = conversations.find((conv) => conv.user_id === userId);
    if (existing) return existing;
    const created: ChatConversation = {
      id: createId("conv"),
      user_id: userId,
      status: "open",
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    saveMockConversations([created, ...conversations]);
    return created;
  }
}

export async function getConversations(): Promise<ChatConversation[]> {
  try {
    const payload = await apiRequest<any>("/chat/conversations");
    const rows = extractList(payload);
    if (rows.length > 0) return rows.map(normalizeConversation);
  } catch {
    // fallback
  }
  return getMockConversations().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const payload = await apiRequest<any>(`/chat/conversations/${conversationId}/messages`);
    const rows = extractList(payload);
    if (rows.length > 0) return rows.map(normalizeMessage);
  } catch {
    // fallback
  }
  return getMockMessages()
    .filter((msg) => msg.conversation_id === conversationId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function sendMessage(
  conversationId: string,
  message: string,
  sender: ChatMessage["sender"] = "user"
): Promise<ChatMessage> {
  try {
    const payload = await apiRequest<any>(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { message, sender },
    });
    return normalizeMessage(payload?.data ?? payload);
  } catch {
    const rows = getMockMessages();
    const created: ChatMessage = {
      id: createId("msg"),
      conversation_id: conversationId,
      sender,
      message,
      is_read: sender !== "user",
      created_at: nowIso(),
    };
    saveMockMessages([...rows, created]);

    const conversations = getMockConversations();
    saveMockConversations(
      conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, updated_at: created.created_at } : conv
      )
    );
    return created;
  }
}

export async function updateConversationStatus(
  conversationId: string,
  status: ChatConversation["status"]
): Promise<void> {
  try {
    await apiRequest(`/chat/conversations/${conversationId}/status`, {
      method: "PATCH",
      body: { status },
    });
    return;
  } catch {
    const conversations = getMockConversations();
    saveMockConversations(
      conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, status, updated_at: nowIso() } : conv
      )
    );
  }
}
