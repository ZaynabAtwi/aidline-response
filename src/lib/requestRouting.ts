export type RequestKind =
  | "sos_emergency"
  | "healthcare_service"
  | "medication_availability"
  | "ngo_support"
  | "secure_message";

export type RequestCategory =
  | "medical_emergency"
  | "medication_need"
  | "humanitarian_aid"
  | "general_inquiry";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type RoutingModule =
  | "healthcare_network"
  | "medication_supply"
  | "ngo_coordination"
  | "secure_communication";

export type ResponderType =
  | "emergency_medical_team"
  | "healthcare_provider"
  | "pharmacy"
  | "ngo_case_worker"
  | "support_agent";

export interface AidRequestInput {
  kind: RequestKind;
  description?: string;
  urgency: UrgencyLevel;
}

export interface RoutingDecision {
  category: RequestCategory;
  priority: UrgencyLevel;
  responderType: ResponderType;
  module: RoutingModule;
}

const MODULE_LABELS: Record<RoutingModule, string> = {
  healthcare_network: "Healthcare Network",
  medication_supply: "Medication Supply",
  ngo_coordination: "NGO Coordination",
  secure_communication: "Secure Communication",
};

const KEYWORD_RULES: Array<{
  regex: RegExp;
  category: RequestCategory;
  responderType: ResponderType;
}> = [
  {
    regex: /\b(bleeding|unconscious|urgent|heart|stroke|ambulance|emergency)\b/i,
    category: "medical_emergency",
    responderType: "emergency_medical_team",
  },
  {
    regex: /\b(medication|medicine|insulin|pharmacy|dose|prescription)\b/i,
    category: "medication_need",
    responderType: "pharmacy",
  },
  {
    regex: /\b(shelter|food|blanket|humanitarian|aid|protection|family)\b/i,
    category: "humanitarian_aid",
    responderType: "ngo_case_worker",
  },
];

const DEFAULT_BY_KIND: Record<
  RequestKind,
  { category: RequestCategory; responderType: ResponderType }
> = {
  sos_emergency: {
    category: "medical_emergency",
    responderType: "emergency_medical_team",
  },
  healthcare_service: {
    category: "medical_emergency",
    responderType: "healthcare_provider",
  },
  medication_availability: {
    category: "medication_need",
    responderType: "pharmacy",
  },
  ngo_support: {
    category: "humanitarian_aid",
    responderType: "ngo_case_worker",
  },
  secure_message: {
    category: "general_inquiry",
    responderType: "support_agent",
  },
};

const CATEGORY_TO_MODULE: Record<RequestCategory, RoutingModule> = {
  medical_emergency: "healthcare_network",
  medication_need: "medication_supply",
  humanitarian_aid: "ngo_coordination",
  general_inquiry: "secure_communication",
};

export const classifyAndRouteRequest = (input: AidRequestInput): RoutingDecision => {
  const fallback = DEFAULT_BY_KIND[input.kind];
  const text = input.description?.trim() ?? "";

  const keywordMatch = KEYWORD_RULES.find((rule) => rule.regex.test(text));
  const category = keywordMatch?.category ?? fallback.category;
  const responderType = keywordMatch?.responderType ?? fallback.responderType;
  const module = CATEGORY_TO_MODULE[category];

  const priority =
    input.kind === "sos_emergency" && input.urgency !== "critical"
      ? "critical"
      : input.urgency;

  return { category, priority, responderType, module };
};

export const getRoutingModuleLabel = (module: RoutingModule) => MODULE_LABELS[module];
