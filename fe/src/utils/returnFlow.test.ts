import { describe, expect, it } from "vitest";
import {
  RETURN_POLICY_SUMMARY,
  RETURN_TERMINAL_STATUSES,
  getNextReturnActions,
  getReturnStepIndex,
  isReturnTerminal,
} from "@/utils/returnFlow";

describe("getNextReturnActions", () => {
  it("maps staff actions by return status", () => {
    expect(getNextReturnActions("PENDING")).toEqual(["confirm", "reject"]);
    expect(getNextReturnActions("STAFF_CONFIRMED")).toEqual(["approve", "reject"]);
    expect(getNextReturnActions("APPROVED")).toEqual(["receive"]);
    expect(getNextReturnActions("RECEIVED")).toEqual(["requestRefund"]);
    expect(getNextReturnActions("REFUND_PENDING")).toEqual(["confirmRefund"]);
    expect(getNextReturnActions("REFUNDED")).toEqual([]);
  });
});

describe("return flow helpers", () => {
  it("treats rejected and refunded as terminal", () => {
    expect(isReturnTerminal("REJECTED")).toBe(true);
    expect(isReturnTerminal("REFUNDED")).toBe(true);
    expect(isReturnTerminal("APPROVED")).toBe(false);
    expect(RETURN_TERMINAL_STATUSES).toEqual(["REJECTED", "REFUNDED", "CLOSED"]);
  });

  it("returns step index for in-progress statuses", () => {
    expect(getReturnStepIndex("PENDING")).toBe(0);
    expect(getReturnStepIndex("REFUND_PENDING")).toBe(4);
    expect(getReturnStepIndex("REJECTED")).toBe(-1);
  });
});

describe("RETURN_POLICY_SUMMARY", () => {
  it("documents return window and refund conditions", () => {
    expect(RETURN_POLICY_SUMMARY.some((line) => line.includes("7 ngày"))).toBe(true);
    expect(RETURN_POLICY_SUMMARY.some((line) => line.includes("100% / 50% / 30%"))).toBe(true);
    expect(RETURN_POLICY_SUMMARY.some((line) => line.includes("chuyển tiền thực tế"))).toBe(true);
  });
});
