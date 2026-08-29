import type { UserRole } from "@/types/user.type";
import { getDefaultPortalPath } from "@/config/roleAccess";

export function resolvePostLoginPath(role: UserRole, returnUrl?: string | null): string {
  if (returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//")) {
    return returnUrl;
  }
  return getDefaultPortalPath(role);
}
