import { describe, expect, it } from "vitest";
import {
  buildCrisisIntelligence,
  inferRoutingStatusFromOperationalStatus,
  triageRequest,
} from "@/lib/requestRouting";

describe("triageRequest", () => {
  it("escalates emergency language into the healthcare network", () => {
    const result = triageRequest({
      requestType: "general_inquiry",
      urgency: "medium",
      description: "Patient is bleeding heavily and cannot breathe well.",
    });

    expect(result.category).toBe("medical_emergency");
    expect(result.module).toBe("healthcare_network");
    expect(result.requiredResponder).toBe("healthcare_provider");
    expect(result.priority).toBe("critical");
  });

  it("marks medication shortages for NGO escalation", () => {
    const result = triageRequest({
      requestType: "medication",
      urgency: "high",
      medicationName: "Insulin",
      description: "Pharmacy says it is out of stock and I need an alternative.",
    });

    expect(result.module).toBe("medication_supply");
    expect(result.routingStatus).toBe("escalated");
    expect(result.escalationTarget).toBe("ngo_coordination");
    expect(result.tags).toContain("stock_escalation");
  });
});

describe("routing helpers", () => {
  it("maps operational statuses into routing statuses", () => {
    expect(inferRoutingStatusFromOperationalStatus("active")).toBe("routed");
    expect(inferRoutingStatusFromOperationalStatus("responding")).toBe(
      "accepted",
    );
    expect(inferRoutingStatusFromOperationalStatus("fulfilled")).toBe(
      "resolved",
    );
  });

  it("builds crisis intelligence aggregates", () => {
    const summary = buildCrisisIntelligence([
      {
        assistance_category: "medical_emergency",
        priority_level: "critical",
        routing_module: "healthcare_network",
        routing_status: "accepted",
      },
      {
        assistance_category: "medication_need",
        priority_level: "high",
        routing_module: "medication_supply",
        routing_status: "escalated",
      },
      {
        assistance_category: "humanitarian_aid",
        priority_level: "medium",
        routing_module: "ngo_coordination",
        routing_status: "resolved",
      },
    ]);

    expect(summary.totalCases).toBe(3);
    expect(summary.openCases).toBe(2);
    expect(summary.criticalCases).toBe(1);
    expect(summary.escalatedCases).toBe(1);
    expect(summary.byModule.medication_supply).toBe(1);
    expect(summary.byCategory.humanitarian_aid).toBe(1);
  });
});
