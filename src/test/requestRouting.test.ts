import { describe, expect, it } from "vitest";
import { classifyAndRouteRequest, getRoutingModuleLabel } from "@/lib/requestRouting";

describe("classifyAndRouteRequest", () => {
  it("forces SOS requests to critical healthcare routing", () => {
    const decision = classifyAndRouteRequest({
      kind: "sos_emergency",
      urgency: "high",
      description: "I need immediate support",
    });

    expect(decision.priority).toBe("critical");
    expect(decision.category).toBe("medical_emergency");
    expect(decision.module).toBe("healthcare_network");
  });

  it("routes medication descriptions to medication supply", () => {
    const decision = classifyAndRouteRequest({
      kind: "secure_message",
      urgency: "medium",
      description: "Need insulin refill and pharmacy guidance",
    });

    expect(decision.category).toBe("medication_need");
    expect(decision.responderType).toBe("pharmacy");
    expect(decision.module).toBe("medication_supply");
  });

  it("routes humanitarian content to NGO coordination", () => {
    const decision = classifyAndRouteRequest({
      kind: "ngo_support",
      urgency: "high",
      description: "My family needs food and shelter support",
    });

    expect(decision.category).toBe("humanitarian_aid");
    expect(decision.module).toBe("ngo_coordination");
  });

  it("keeps general inquiry in secure communication module", () => {
    const decision = classifyAndRouteRequest({
      kind: "secure_message",
      urgency: "low",
      description: "Need an update about my existing request",
    });

    expect(decision.category).toBe("general_inquiry");
    expect(decision.module).toBe("secure_communication");
  });
});

describe("getRoutingModuleLabel", () => {
  it("returns user-facing module labels", () => {
    expect(getRoutingModuleLabel("healthcare_network")).toBe("Healthcare Network");
    expect(getRoutingModuleLabel("ngo_coordination")).toBe("NGO Coordination");
  });
});
