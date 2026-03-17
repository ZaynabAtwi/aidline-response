export type LanguageCode = "ar" | "en";

export type RequestType =
  | "sos"
  | "healthcare"
  | "medication"
  | "humanitarian"
  | "general_inquiry";

export type AssistanceCategory =
  | "medical_emergency"
  | "healthcare_service"
  | "medication_need"
  | "humanitarian_aid"
  | "general_inquiry";

export type PriorityLevel = "low" | "medium" | "high" | "critical";

export type RoutingModule =
  | "healthcare_network"
  | "medication_supply"
  | "ngo_coordination"
  | "secure_messaging";

export type ResponderType =
  | "healthcare_provider"
  | "pharmacy_partner"
  | "ngo_coordinator"
  | "support_agent";

export type RoutingStatus =
  | "queued"
  | "triaged"
  | "routed"
  | "accepted"
  | "resolved"
  | "escalated"
  | "cancelled";

type LocalizedLabelMap<T extends string> = Record<T, { ar: string; en: string }>;

export const assistanceCategoryLabels: LocalizedLabelMap<AssistanceCategory> = {
  medical_emergency: {
    ar: "طوارئ طبية",
    en: "Medical emergency",
  },
  healthcare_service: {
    ar: "خدمة صحية",
    en: "Healthcare service",
  },
  medication_need: {
    ar: "احتياج دوائي",
    en: "Medication need",
  },
  humanitarian_aid: {
    ar: "مساعدة إنسانية",
    en: "Humanitarian aid",
  },
  general_inquiry: {
    ar: "استفسار عام",
    en: "General inquiry",
  },
};

export const priorityLevelLabels: LocalizedLabelMap<PriorityLevel> = {
  low: { ar: "منخفض", en: "Low" },
  medium: { ar: "متوسط", en: "Medium" },
  high: { ar: "مرتفع", en: "High" },
  critical: { ar: "حرج", en: "Critical" },
};

export const routingModuleLabels: LocalizedLabelMap<RoutingModule> = {
  healthcare_network: {
    ar: "شبكة الرعاية الصحية",
    en: "Healthcare network",
  },
  medication_supply: {
    ar: "وحدة تنسيق الأدوية",
    en: "Medication supply",
  },
  ngo_coordination: {
    ar: "تنسيق المنظمات الإنسانية",
    en: "NGO coordination",
  },
  secure_messaging: {
    ar: "الدعم عبر الرسائل الآمنة",
    en: "Secure messaging",
  },
};

export const responderTypeLabels: LocalizedLabelMap<ResponderType> = {
  healthcare_provider: {
    ar: "مقدم رعاية صحية",
    en: "Healthcare provider",
  },
  pharmacy_partner: {
    ar: "صيدلية شريكة",
    en: "Pharmacy partner",
  },
  ngo_coordinator: {
    ar: "منسق منظمة إنسانية",
    en: "NGO coordinator",
  },
  support_agent: {
    ar: "فريق الدعم",
    en: "Support agent",
  },
};

export const routingStatusLabels: LocalizedLabelMap<RoutingStatus> = {
  queued: { ar: "في الانتظار", en: "Queued" },
  triaged: { ar: "قيد الفرز", en: "Triaged" },
  routed: { ar: "تم التوجيه", en: "Routed" },
  accepted: { ar: "تم القبول", en: "Accepted" },
  resolved: { ar: "تم الحل", en: "Resolved" },
  escalated: { ar: "تم التصعيد", en: "Escalated" },
  cancelled: { ar: "ملغى", en: "Cancelled" },
};

export interface TriageInput {
  requestType: RequestType;
  urgency: PriorityLevel;
  description?: string | null;
  medicationName?: string | null;
  attachmentsCount?: number;
}

export interface RoutingDecision {
  category: AssistanceCategory;
  priority: PriorityLevel;
  module: RoutingModule;
  requiredResponder: ResponderType;
  routingStatus: RoutingStatus;
  escalationTarget: RoutingModule | null;
  tags: string[];
  reason: string;
  localizedReason: { ar: string; en: string };
  summary: string;
}

export interface RoutedCaseSnapshot {
  assistance_category?: AssistanceCategory | null;
  priority_level?: PriorityLevel | null;
  routing_module?: RoutingModule | null;
  routing_status?: RoutingStatus | string | null;
}

export interface CrisisIntelligenceSummary {
  totalCases: number;
  openCases: number;
  criticalCases: number;
  escalatedCases: number;
  byModule: Record<RoutingModule, number>;
  byCategory: Record<AssistanceCategory, number>;
}

const priorityRank: Record<PriorityLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const emergencyKeywords = [
  "ambulance",
  "attack",
  "bleeding",
  "breathing",
  "burn",
  "collapse",
  "critical",
  "emergency",
  "heart",
  "stroke",
  "unconscious",
  "نزيف",
  "طارئ",
  "حريق",
  "حرج",
  "سكتة",
  "لا أستطيع التنفس",
];

const medicationEscalationKeywords = [
  "alternative",
  "no stock",
  "out of stock",
  "reserve",
  "shortage",
  "stock",
  "unavailable",
  "بديل",
  "غير متوفر",
  "مخزون",
  "نفاد",
];

const humanitarianKeywords = [
  "aid",
  "food",
  "humanitarian",
  "ngo",
  "protection",
  "support",
  "shelter",
  "إغاثة",
  "دعم",
  "غذاء",
  "مأوى",
  "منظمة",
];

const healthcareKeywords = [
  "appointment",
  "clinic",
  "consult",
  "doctor",
  "hospital",
  "medical",
  "teleconsultation",
  "إسعاف",
  "استشارة",
  "عيادة",
  "مستشفى",
  "طبيب",
];

const dedupe = (items: string[]) => [...new Set(items.filter(Boolean))];

const includesKeyword = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

const mergePriority = (base: PriorityLevel, incoming: PriorityLevel) =>
  priorityRank[incoming] > priorityRank[base] ? incoming : base;

const buildSummary = (
  category: AssistanceCategory,
  module: RoutingModule,
  requiredResponder: ResponderType,
  priority: PriorityLevel,
) =>
  `${assistanceCategoryLabels[category].en} routed to ${routingModuleLabels[module].en} for ${responderTypeLabels[requiredResponder].en.toLowerCase()} review (${priorityLevelLabels[priority].en.toLowerCase()} priority).`;

export const getLocalizedLabel = <T extends string>(
  labels: LocalizedLabelMap<T>,
  key: T,
  lang: LanguageCode,
) => labels[key][lang];

export const triageRequest = ({
  requestType,
  urgency,
  description,
  medicationName,
  attachmentsCount = 0,
}: TriageInput): RoutingDecision => {
  const normalizedText = `${medicationName ?? ""} ${description ?? ""}`.toLowerCase();
  const hasEmergencyKeywords = includesKeyword(normalizedText, emergencyKeywords);
  const hasMedicationEscalation = includesKeyword(
    normalizedText,
    medicationEscalationKeywords,
  );
  const hasHumanitarianKeywords = includesKeyword(normalizedText, humanitarianKeywords);
  const hasHealthcareKeywords = includesKeyword(normalizedText, healthcareKeywords);

  let category: AssistanceCategory = "general_inquiry";
  let priority = urgency;
  let module: RoutingModule = "secure_messaging";
  let requiredResponder: ResponderType = "support_agent";
  let routingStatus: RoutingStatus = "routed";
  let escalationTarget: RoutingModule | null = null;
  let reason =
    "The request is routed by declared service type and urgency rather than geographic proximity.";
  let localizedReason = {
    ar: "يتم توجيه الطلب حسب نوع الخدمة ومستوى الاستعجال المعلنَين بدلاً من القرب الجغرافي.",
    en: reason,
  };
  const tags = [requestType];

  switch (requestType) {
    case "sos":
      category = "medical_emergency";
      module = "healthcare_network";
      requiredResponder = "healthcare_provider";
      priority = mergePriority(priority, "critical");
      tags.push("emergency");
      reason =
        "SOS requests are always treated as emergencies and sent into the healthcare response queue first.";
      localizedReason = {
        ar: "تُعامل طلبات SOS دائماً كحالات طارئة وتُرسل أولاً إلى طابور الاستجابة الصحية.",
        en: reason,
      };
      break;
    case "healthcare":
      category = "healthcare_service";
      module = "healthcare_network";
      requiredResponder = "healthcare_provider";
      reason =
        "Healthcare requests are triaged for medical review and routed into the healthcare provider network.";
      localizedReason = {
        ar: "تُفرز الطلبات الصحية للمراجعة الطبية ثم تُوجَّه إلى شبكة مقدمي الرعاية الصحية.",
        en: reason,
      };
      break;
    case "medication":
      category = "medication_need";
      module = "medication_supply";
      requiredResponder = "pharmacy_partner";
      reason =
        "Medication requests are routed to pharmacy partners first and can be escalated to NGOs if supply fails.";
      localizedReason = {
        ar: "تُوجَّه طلبات الأدوية أولاً إلى الصيدليات الشريكة ويمكن تصعيدها إلى المنظمات إذا تعذر التوفير.",
        en: reason,
      };
      break;
    case "humanitarian":
      category = "humanitarian_aid";
      module = "ngo_coordination";
      requiredResponder = "ngo_coordinator";
      reason =
        "Humanitarian aid requests are coordinated through the NGO response queue instead of location-based matching.";
      localizedReason = {
        ar: "تُنسَّق طلبات المساعدة الإنسانية عبر طابور استجابة المنظمات بدلاً من المطابقة بالموقع.",
        en: reason,
      };
      break;
    case "general_inquiry":
      category = "general_inquiry";
      module = "secure_messaging";
      requiredResponder = "support_agent";
      reason =
        "General requests are directed into secure messaging so a coordinator can collect follow-up details.";
      localizedReason = {
        ar: "تُوجَّه الطلبات العامة إلى الرسائل الآمنة ليجمع المنسق تفاصيل المتابعة.",
        en: reason,
      };
      break;
  }

  if (hasEmergencyKeywords) {
    category = "medical_emergency";
    module = "healthcare_network";
    requiredResponder = "healthcare_provider";
    priority = mergePriority(priority, "critical");
    tags.push("keyword_emergency");
    reason =
      "Emergency language in the request triggered medical escalation to the healthcare network.";
    localizedReason = {
      ar: "أدّت لغة الطوارئ في الطلب إلى تصعيد طبي باتجاه شبكة الرعاية الصحية.",
      en: reason,
    };
  } else if (requestType === "general_inquiry" && hasHealthcareKeywords) {
    category = "healthcare_service";
    module = "healthcare_network";
    requiredResponder = "healthcare_provider";
    priority = mergePriority(priority, "high");
    tags.push("keyword_healthcare");
    reason =
      "Healthcare-specific language in the request moved the case into the healthcare routing queue.";
    localizedReason = {
      ar: "نقلت اللغة الصحية المتخصصة في الطلب الحالة إلى طابور التوجيه الصحي.",
      en: reason,
    };
  } else if (requestType === "general_inquiry" && medicationName) {
    category = "medication_need";
    module = "medication_supply";
    requiredResponder = "pharmacy_partner";
    tags.push("medication_context");
    reason =
      "Medication details were supplied, so the case was promoted to the medication coordination queue.";
    localizedReason = {
      ar: "تم توفير تفاصيل دوائية، لذلك رُفعت الحالة إلى طابور تنسيق الأدوية.",
      en: reason,
    };
  } else if (requestType === "general_inquiry" && hasHumanitarianKeywords) {
    category = "humanitarian_aid";
    module = "ngo_coordination";
    requiredResponder = "ngo_coordinator";
    tags.push("keyword_humanitarian");
    reason =
      "Humanitarian aid language routed the request directly to NGO coordination.";
    localizedReason = {
      ar: "وجّهت لغة المساعدة الإنسانية الطلب مباشرةً إلى تنسيق المنظمات.",
      en: reason,
    };
  }

  if (hasMedicationEscalation) {
    escalationTarget = "ngo_coordination";
    tags.push("stock_escalation");
  }

  if (attachmentsCount > 0) {
    tags.push("attachments");
  }

  if (priorityRank[priority] >= priorityRank.high) {
    tags.push("high_priority");
  }

  if (hasMedicationEscalation && requestType === "medication") {
    routingStatus = "escalated";
  }

  return {
    category,
    priority,
    module,
    requiredResponder,
    routingStatus,
    escalationTarget,
    tags: dedupe(tags),
    reason,
    localizedReason,
    summary: buildSummary(category, module, requiredResponder, priority),
  };
};

export const inferRoutingStatusFromOperationalStatus = (
  status: string,
): RoutingStatus => {
  switch (status) {
    case "active":
    case "pending":
      return "routed";
    case "responding":
    case "approved":
    case "in_progress":
    case "assigned":
      return "accepted";
    case "resolved":
    case "fulfilled":
    case "closed":
      return "resolved";
    case "cancelled":
    case "unavailable":
      return "cancelled";
    default:
      return "triaged";
  }
};

export const buildCrisisIntelligence = (
  cases: RoutedCaseSnapshot[],
): CrisisIntelligenceSummary => {
  const byModule: Record<RoutingModule, number> = {
    healthcare_network: 0,
    medication_supply: 0,
    ngo_coordination: 0,
    secure_messaging: 0,
  };

  const byCategory: Record<AssistanceCategory, number> = {
    medical_emergency: 0,
    healthcare_service: 0,
    medication_need: 0,
    humanitarian_aid: 0,
    general_inquiry: 0,
  };

  let openCases = 0;
  let criticalCases = 0;
  let escalatedCases = 0;

  cases.forEach((record) => {
    if (record.routing_module && record.routing_module in byModule) {
      byModule[record.routing_module] += 1;
    }

    if (record.assistance_category && record.assistance_category in byCategory) {
      byCategory[record.assistance_category] += 1;
    }

    if (record.priority_level === "critical") {
      criticalCases += 1;
    }

    if (
      record.routing_status &&
      !["resolved", "cancelled"].includes(record.routing_status)
    ) {
      openCases += 1;
    }

    if (record.routing_status === "escalated") {
      escalatedCases += 1;
    }
  });

  return {
    totalCases: cases.length,
    openCases,
    criticalCases,
    escalatedCases,
    byModule,
    byCategory,
  };
};
