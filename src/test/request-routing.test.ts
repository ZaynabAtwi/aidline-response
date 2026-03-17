import { describe, expect, it } from "vitest";
import {
  classifyRequest,
  getRoutingModule,
  getRoutingSummary,
} from "@/lib/request-routing";

describe("request routing", () => {
  it("routes SOS requests to the healthcare network", () => {
    expect(classifyRequest({ entryPoint: "sos", description: "Severe chest pain" })).toBe(
      "medical_emergency",
    );
    expect(getRoutingModule("medical_emergency")).toBe("healthcare_network");
  });

  it("routes medication requests to the medication supply module", () => {
    expect(
      getRoutingSummary(
        classifyRequest({
          entryPoint: "medication",
          medicationName: "Insulin",
        }),
      ),
    ).toMatchObject({
      category: "medication_need",
      module: "medication_supply",
    });
  });

  it("detects humanitarian support messages without location data", () => {
    expect(
      classifyRequest({
        entryPoint: "support",
        description: "My family needs food and temporary shelter support",
      }),
    ).toBe("humanitarian_aid");
  });

  it("falls back to general inquiry when no triage keywords exist", () => {
    expect(
      classifyRequest({
        entryPoint: "support",
        description: "I need to understand the process",
      }),
    ).toBe("general_inquiry");
  });
});
