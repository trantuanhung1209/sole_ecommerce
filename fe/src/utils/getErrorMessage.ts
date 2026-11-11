import axios from "axios";

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại sau";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại";
}

/** Extract server `message` from an Axios error, falling back to a contextual message. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message || fallback;
  }
  return fallback;
}
