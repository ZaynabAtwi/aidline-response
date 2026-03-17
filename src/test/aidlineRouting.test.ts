import { describe, expect, it } from "vitest";
import { aggregateCrisisIntelligence, triageAidRequest } from "@/lib/aidlineRouting";

describe("AidLine triage and routing", () => {
  it("routes SOS requests to healthcare network with critical priority", () => {
    const result = triageAidRequest({
      action: "sos",
      description: "Severe pain and bleeding",
    });

    expect(result.category).toBe("medical_emergency");
    expect(result.priority).toBe("critical");
    expect(result.responderType).toBe("healthcare_provider");
    expect(result.route).toBe("healthcare_network");
  });

  it("routes medication requests to medication supply module", () => {
    const result = triageAidRequest({
      action: "medication",
      description: "Need insulin refill",
      urgency: "high",
      attachmentsCount: 1,
    });

    expect(result.category).toBe("medication_need");
    expect(result.priority).toBe("high");
    expect(result.responderType).toBe("pharmacy");
    expect(result.route).toBe("medication_supply");
  });

  it("aggregates operational intelligence without location data", () => {
    const summary = aggregateCrisisIntelligence([
      triageAidRequest({ action: "sos", description: "Emergency now" }),
      triageAidRequest({ action: "ngo", description: "Need humanitarian shelter support" }),
      triageAidRequest({ action: "message", description: "General question about services", urgency: "low" }),
    ]);

    expect(summary.totalRequests).toBe(3);
    expect(summary.byCategory.medical_emergency).toBe(1);
    expect(summary.byCategory.humanitarian_aid).toBe(1);
    expect(summary.byCategory.general_inquiry).toBe(1);
    expect(summary.routeLoad.healthcare_network).toBe(1);
    expect(summary.routeLoad.ngo_coordination).toBe(1);
    expect(summary.routeLoad.secure_messaging).toBe(1);
  });
});
