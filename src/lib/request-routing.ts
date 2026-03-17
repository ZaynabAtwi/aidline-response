export type RequestEntryPoint = "sos" | "medication" | "support" | "shelter";

export type RequestCategory =
  | "medical_emergency"
  | "medication_need"
  | "humanitarian_aid"
  | "general_inquiry";

export type RoutingModule =
  | "healthcare_network"
  | "medication_supply"
  | "ngo_coordination"
  | "secure_communication";

interface RouteContext {
  entryPoint: RequestEntryPoint;
  description?: string | null;
  medicationName?: string | null;
}

const MEDICAL_KEYWORDS = [
  "doctor",
  "bleeding",
  "injury",
  "emergency",
  "ambulance",
  "hospital",
  "pain",
  "urgent",
  "critical",
  "medical",
];

const MEDICATION_KEYWORDS = [
  "medication",
  "medicine",
  "prescription",
  "pharmacy",
  "tablet",
  "dose",
  "insulin",
  "antibiotic",
];

const HUMANITARIAN_KEYWORDS = [
  "shelter",
  "food",
  "aid",
  "ngo",
  "support",
  "blanket",
  "water",
  "humanitarian",
];

const matchesKeyword = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

export const classifyRequest = ({
  entryPoint,
  description,
  medicationName,
}: RouteContext): RequestCategory => {
  if (entryPoint === "medication" || medicationName?.trim()) {
    return "medication_need";
  }

  if (entryPoint === "shelter") {
    return "humanitarian_aid";
  }

  if (entryPoint === "sos") {
    return "medical_emergency";
  }

  const normalized = `${description ?? ""} ${medicationName ?? ""}`.trim().toLowerCase();
  if (!normalized) {
    return "general_inquiry";
  }

  if (matchesKeyword(normalized, MEDICATION_KEYWORDS)) {
    return "medication_need";
  }

  if (matchesKeyword(normalized, MEDICAL_KEYWORDS)) {
    return "medical_emergency";
  }

  if (matchesKeyword(normalized, HUMANITARIAN_KEYWORDS)) {
    return "humanitarian_aid";
  }

  return "general_inquiry";
};

export const getRoutingModule = (category: RequestCategory): RoutingModule => {
  switch (category) {
    case "medical_emergency":
      return "healthcare_network";
    case "medication_need":
      return "medication_supply";
    case "humanitarian_aid":
      return "ngo_coordination";
    case "general_inquiry":
    default:
      return "secure_communication";
  }
};

export const getCategoryLabel = (category: RequestCategory) => {
  switch (category) {
    case "medical_emergency":
      return "Medical emergency";
    case "medication_need":
      return "Medication need";
    case "humanitarian_aid":
      return "Humanitarian aid";
    case "general_inquiry":
    default:
      return "General inquiry";
  }
};

export const getRoutingModuleLabel = (module: RoutingModule) => {
  switch (module) {
    case "healthcare_network":
      return "Healthcare Network Module";
    case "medication_supply":
      return "Medication Supply Module";
    case "ngo_coordination":
      return "NGO Coordination Module";
    case "secure_communication":
    default:
      return "Secure Communication Layer";
  }
};

export const getRoutingSummary = (category: RequestCategory) => {
  const module = getRoutingModule(category);
  return {
    category,
    module,
    categoryLabel: getCategoryLabel(category),
    moduleLabel: getRoutingModuleLabel(module),
  };
};
