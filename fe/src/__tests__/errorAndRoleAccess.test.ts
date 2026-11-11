import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { getApiErrorMessage, getErrorMessage } from "@/utils/getErrorMessage";
import { roleAccess } from "@/config/roleAccess";
import { UserRole } from "@/types/user.type";

function makeAxiosError(status: number, data?: { message?: string }): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      data,
      status,
      statusText: "Bad Request",
      headers,
      config: { headers },
    }
  );
}

describe("getErrorMessage & getApiErrorMessage", () => {
  it("getApiErrorMessage returns server message from AxiosError when present", () => {
    const err = makeAxiosError(400, { message: "Mật khẩu cũ không đúng" });
    expect(getApiErrorMessage(err, "Fallback")).toBe("Mật khẩu cũ không đúng");
  });

  it("getApiErrorMessage returns contextual fallback when AxiosError has no server message", () => {
    const err = makeAxiosError(500);
    expect(getApiErrorMessage(err, "Đổi mật khẩu thất bại")).toBe("Đổi mật khẩu thất bại");
  });

  it("getApiErrorMessage returns contextual fallback for non-Axios errors", () => {
    expect(getApiErrorMessage(new Error("network"), "Gửi OTP thất bại")).toBe("Gửi OTP thất bại");
    expect(getApiErrorMessage("unknown", "Gửi OTP thất bại")).toBe("Gửi OTP thất bại");
  });

  it("getErrorMessage extracts Axios message or Error message", () => {
    expect(getErrorMessage(makeAxiosError(400, { message: "Bad input" }))).toBe("Bad input");
    expect(getErrorMessage(makeAxiosError(500))).toBe("Request failed with status code 500");
    expect(getErrorMessage(new Error("Boom"))).toBe("Boom");
  });
});

describe("roleAccess.canPublishProduct", () => {
  it("allows SHOP_MANAGER, ADMIN, and SUPER_ADMIN", () => {
    expect(roleAccess.canPublishProduct(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canPublishProduct(UserRole.ADMIN)).toBe(true);
    expect(roleAccess.canPublishProduct(UserRole.SUPER_ADMIN)).toBe(true);
  });

  it("denies STAFF, CUSTOMER, and undefined role", () => {
    expect(roleAccess.canPublishProduct(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canPublishProduct(UserRole.CUSTOMER)).toBe(false);
    expect(roleAccess.canPublishProduct(undefined)).toBe(false);
  });
});
