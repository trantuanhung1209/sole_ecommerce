export type ReturnFlowStep = {
  status: string;
  label: string;
  customerHint: string;
  staffHint: string;
};

export const RETURN_FLOW_STEPS: ReturnFlowStep[] = [
  {
    status: "PENDING",
    label: "Khách gửi yêu cầu",
    customerHint: "Yêu cầu của bạn đang chờ cửa hàng xem xét.",
    staffHint: "Kiểm tra lý do, ảnh minh chứng và thông tin đơn hàng.",
  },
  {
    status: "STAFF_CONFIRMED",
    label: "NV xác nhận",
    customerHint: "Nhân viên đã xác nhận hồ sơ. Chờ quản lý duyệt.",
    staffHint: "Chuyển quản lý duyệt hoặc từ chối nếu không đủ điều kiện.",
  },
  {
    status: "APPROVED",
    label: "Được duyệt",
    customerHint: "Vui lòng gửi hàng về trong 7 ngày. Giữ biên lai/ảnh đóng gói.",
    staffHint: "Chờ khách gửi hàng. Chỉ hoàn tiền sau khi đã nhận hàng trả.",
  },
  {
    status: "RECEIVED",
    label: "Đã nhận hàng",
    customerHint: "Cửa hàng đã nhận hàng trả. Hoàn tiền sẽ được xử lý theo tình trạng hàng.",
    staffHint: "Trần hoàn theo tình trạng (100%/50%/30%). Chỉ restock nếu hàng tốt. Manager tạo yêu cầu hoàn.",
  },
  {
    status: "REFUND_PENDING",
    label: "Chờ chuyển tiền",
    customerHint: "Yêu cầu hoàn tiền đã được chấp nhận. Cửa hàng đang chuyển khoản.",
    staffHint: "Chuyển tiền thực tế cho khách, rồi xác nhận kèm mã giao dịch.",
  },
  {
    status: "REFUNDED",
    label: "Đã hoàn tiền",
    customerHint: "Khoản hoàn tiền đã được thực hiện. Kiểm tra tài khoản trong 1–7 ngày làm việc.",
    staffHint: "Case đã đóng. Có thể audit qua mã giao dịch hoàn.",
  },
];

export const RETURN_TERMINAL_STATUSES = ["REJECTED", "REFUNDED", "CLOSED"] as const;

export function getReturnStepIndex(status: string): number {
  if (status === "REJECTED" || status === "CLOSED") {
    return -1;
  }
  const index = RETURN_FLOW_STEPS.findIndex((step) => step.status === status);
  return index >= 0 ? index : 0;
}

export function getReturnFlowStep(status: string): ReturnFlowStep | null {
  if (status === "REJECTED") {
    return {
      status: "REJECTED",
      label: "Đã từ chối",
      customerHint: "Yêu cầu không được chấp nhận. Xem lý do từ chối bên dưới.",
      staffHint: "Đã thông báo khách và khôi phục trạng thái đơn.",
    };
  }
  return RETURN_FLOW_STEPS.find((step) => step.status === status) ?? null;
}

export type ReturnActionType =
  | "confirm"
  | "reject"
  | "approve"
  | "receive"
  | "requestRefund"
  | "confirmRefund";

export function getNextReturnActions(status: string): ReturnActionType[] {
  switch (status) {
    case "PENDING":
      return ["confirm", "reject"];
    case "STAFF_CONFIRMED":
      return ["approve", "reject"];
    case "APPROVED":
      return ["receive"];
    case "RECEIVED":
      return ["requestRefund"];
    case "REFUND_PENDING":
      return ["confirmRefund"];
    default:
      return [];
  }
}

export function isReturnTerminal(status: string): boolean {
  return RETURN_TERMINAL_STATUSES.includes(status as (typeof RETURN_TERMINAL_STATUSES)[number]);
}

export const RETURN_POLICY_SUMMARY = [
  "Chỉ áp dụng trong 7 ngày kể từ khi giao hàng.",
  "Mỗi sản phẩm chỉ được yêu cầu trả một lần.",
  "Sau khi duyệt, gửi hàng về trong 7 ngày — quá hạn có thể bị từ chối.",
  "Số tiền hoàn phụ thuộc tình trạng hàng khi shop kiểm tra (100% / 50% / 30%).",
  "Hoàn tiền chỉ xác nhận sau khi cửa hàng chuyển tiền thực tế cho bạn.",
];

export const REFUND_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Chuyển khoản",
  SEPAY: "SePay",
  CASH: "Tiền mặt",
  OTHER: "Khác",
};

export const RETURN_ITEM_CONDITION_LABELS: Record<string, string> = {
  GOOD: "Hàng tốt",
  DAMAGED: "Hàng hỏng",
  INCOMPLETE: "Thiếu phụ kiện",
};

export const RETURN_ITEM_CONDITION_REFUND_HINT: Record<string, string> = {
  GOOD: "Hoàn tối đa 100% · Restock",
  DAMAGED: "Hoàn tối đa 50% · Không restock",
  INCOMPLETE: "Hoàn tối đa 30% · Không restock",
};
