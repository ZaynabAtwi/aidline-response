import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from "./api";
import { createId, nowIso, readStore, writeStore } from "./mockDb";

const AUTH_USER_KEY = "aidline_auth_user";
const ONBOARDING_KEY = "aidline_onboarded";
const ONBOARDING_DATA_PREFIX = "aidline_onboarding_";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  generated_identity_id?: string | null;
  preferred_language?: string | null;
  created_at: string;
}

export interface AuthSession {
  user: AuthUser;
  onboardingCompleted: boolean;
}

export interface OnboardingPayload {
  user_id: string;
  is_displaced?: boolean;
  lost_house?: boolean;
  occupation?: "student" | "freelancer" | "employee" | "unemployed" | "looking_for_a_job";
  major?: string;
  employee_lost_job_due_to_war?: boolean;
  needs_shelter: boolean;
  needs_medication: boolean;
  health_issues?: boolean;
  health_issue_details?: string;
  has_elderly_at_home?: boolean;
  wants_to_volunteer?: boolean;
  is_volunteering?: boolean;
  district?: string;
  urgency: string;
}

function normalizeUser(raw: any): AuthUser {
  return {
    id: String(raw?.id ?? createId("user")),
    email: String(raw?.email ?? ""),
    full_name: raw?.full_name ?? null,
    generated_identity_id: raw?.generated_identity_id ?? null,
    preferred_language: raw?.preferred_language ?? "en",
    created_at: raw?.created_at ?? nowIso(),
  };
}

function saveUser(user: AuthUser) {
  writeStore(AUTH_USER_KEY, user);
}

function getSavedUser() {
  return readStore<AuthUser | null>(AUTH_USER_KEY, null);
}

function clearSavedUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}

function setOnboardingCompleted(done: boolean) {
  localStorage.setItem(ONBOARDING_KEY, done ? "true" : "false");
}

function getOnboardingCompleted() {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

function createMockSession(email: string): AuthSession {
  const user = normalizeUser({
    id: createId("user"),
    email,
    full_name: email.split("@")[0] || "AidLine User",
    created_at: nowIso(),
  });
  setAuthToken(`mock_${btoa(`${email}:${Date.now()}`).replace(/=/g, "")}`);
  saveUser(user);
  return { user, onboardingCompleted: getOnboardingCompleted() };
}

export async function login(email: string, password: string): Promise<AuthSession> {
  if (!email.trim() || !password.trim()) {
    throw new Error("Email and password are required");
  }

  try {
    const res = await apiRequest<any>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const data = res?.data ?? res;
    const token = data?.token ?? res?.token;
    const rawUser = data?.user ?? res?.user;
    const onboardingCompleted = Boolean(data?.onboarding_completed ?? res?.onboarding_completed ?? false);

    if (!token || !rawUser) {
      throw new Error("Invalid auth response");
    }

    const user = normalizeUser(rawUser);
    setAuthToken(token);
    saveUser(user);
    setOnboardingCompleted(onboardingCompleted);
    return { user, onboardingCompleted };
  } catch {
    // Temporary fallback so frontend remains runnable without backend auth endpoint.
    return createMockSession(email);
  }
}

export async function restoreSession(): Promise<AuthSession | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await apiRequest<any>("/auth/me");
    const data = res?.data ?? res;
    const rawUser = data?.user ?? res?.user ?? data;
    if (!rawUser?.id) throw new Error("Missing user in session payload");
    const onboardingCompleted = Boolean(data?.onboarding_completed ?? res?.onboarding_completed ?? getOnboardingCompleted());
    const user = normalizeUser(rawUser);
    saveUser(user);
    setOnboardingCompleted(onboardingCompleted);
    return { user, onboardingCompleted };
  } catch {
    const savedUser = getSavedUser();
    if (!savedUser) return null;
    return { user: savedUser, onboardingCompleted: getOnboardingCompleted() };
  }
}

export async function logout() {
  clearAuthToken();
  clearSavedUser();
  localStorage.removeItem(ONBOARDING_KEY);
}

export async function saveOnboarding(payload: OnboardingPayload) {
  try {
    await apiRequest("/auth/onboarding", {
      method: "POST",
      body: payload,
    });
  } catch {
    writeStore(`${ONBOARDING_DATA_PREFIX}${payload.user_id}`, payload);
  }
  setOnboardingCompleted(true);
}

export async function checkRole(userId: string, role: string): Promise<boolean> {
  try {
    const res = await apiRequest<any>(`/auth/role/${userId}/${role}`);
    const data = res?.data ?? res;
    return Boolean(data?.hasRole ?? data?.has_role ?? false);
  } catch {
    // Mock fallback: no elevated role by default.
    return false;
  }
}
