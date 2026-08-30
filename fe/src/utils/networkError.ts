import { AxiosError } from "axios";

export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.code === "ERR_NETWORK" || !error.response;
  }
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true;
  }
  return false;
}
