export type RequestEntryAction = "sos" | "healthcare" | "medication" | "ngo" | "message";
export type RequestCategory =
  | "medical_emergency"
  | "medication_need"
  | "humanitarian_aid"
  | "general_inquiry";
export type PriorityLevel = "critical" | "high" | "medium" | "low";
export type ResponderType = "healthcare_provider" | "pharmacy" | "ngo" | "support_agent";
export type ServiceRoute =
  | "healthcare_network"
  | "medication_supply"
  | "ngo_coordination"
  | "secure_messaging";

export interface AidRequestInput {
  action: RequestEntryAction;
  description: string;
  urgency?: PriorityLevel;
  attachmentsCount?: number;
}

export interface TriageResult {
  category: RequestCategory;
  priority: PriorityLevel;
  responderType: ResponderType;
  route: ServiceRoute;
  reasons: string[];
}

const EMERGENCY_TERMS = ["emergency", "urgent", "bleeding", "unconscious", "critical", "طارئ", "نزيف"];
const MEDICATION_TERMS = ["medication", "medicine", "insulin", "drug", "pharmacy", "دواء", "صيدلية"];
const HUMANITARIAN_TERMS = ["shelter", "food", "aid", "ngo", "humanitarian", "مأوى", "غذاء", "مساعدة"];

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function mapCategoryToResponder(category: RequestCategory): ResponderType {
  switch (category) {
    case "medical_emergency":
      return "healthcare_provider";
    case "medication_need":
      return "pharmacy";
    case "humanitarian_aid":
      return "ngo";
    default:
      return "support_agent";
  }
}

function mapCategoryToRoute(category: RequestCategory): ServiceRoute {
  switch (category) {
    case "medical_emergency":
      return "healthcare_network";
    case "medication_need":
      return "medication_supply";
    case "humanitarian_aid":
      return "ngo_coordination";
    default:
      return "secure_messaging";
  }
}

export function triageAidRequest(input: AidRequestInput): TriageResult {
  const description = input.description.toLowerCase();
  const reasons: string[] = [];
  let category: RequestCategory = "general_inquiry";

  if (input.action === "sos" || includesAny(description, EMERGENCY_TERMS)) {
    category = "medical_emergency";
    reasons.push("Emergency signal detected");
  } else if (input.action === "medication" || includesAny(description, MEDICATION_TERMS)) {
    category = "medication_need";
    reasons.push("Medication-related request detected");
  } else if (input.action === "ngo" || includesAny(description, HUMANITARIAN_TERMS)) {
    category = "humanitarian_aid";
    reasons.push("Humanitarian support request detected");
  } else if (input.action === "healthcare") {
    category = "medical_emergency";
    reasons.push("Healthcare service request detected");
  } else {
    reasons.push("Defaulted to general inquiry flow");
  }

  let priority: PriorityLevel = input.urgency ?? "medium";
  if (!input.urgency) {
    if (category === "medical_emergency") {
      priority = "critical";
    } else if (includesAny(description, ["now", "asap", "immediately", "اليوم", "فور"])) {
      priority = "high";
    } else {
      priority = "medium";
    }
  }

  if ((input.attachmentsCount ?? 0) > 0) {
    reasons.push("Attachments provided for context");
  }

  const responderType = mapCategoryToResponder(category);
  const route = mapCategoryToRoute(category);
  return { category, priority, responderType, route, reasons };
}

export interface CrisisIntelligenceSummary {
  totalRequests: number;
  byCategory: Record<RequestCategory, number>;
  byPriority: Record<PriorityLevel, number>;
  routeLoad: Record<ServiceRoute, number>;
}

export function aggregateCrisisIntelligence(results: TriageResult[]): CrisisIntelligenceSummary {
  const byCategory: Record<RequestCategory, number> = {
    medical_emergency: 0,
    medication_need: 0,
    humanitarian_aid: 0,
    general_inquiry: 0,
  };
  const byPriority: Record<PriorityLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  const routeLoad: Record<ServiceRoute, number> = {
    healthcare_network: 0,
    medication_supply: 0,
    ngo_coordination: 0,
    secure_messaging: 0,
  };

  for (const result of results) {
    byCategory[result.category] += 1;
    byPriority[result.priority] += 1;
    routeLoad[result.route] += 1;
  }

  return {
    totalRequests: results.length,
    byCategory,
    byPriority,
    routeLoad,
  };
}
