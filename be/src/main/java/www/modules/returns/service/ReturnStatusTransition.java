package www.modules.returns.service;

import www.exception.BadRequestException;
import www.modules.common.EcommerceEnums.ReturnStatus;

import java.util.Map;
import java.util.Set;

final class ReturnStatusTransition {
    private static final Map<ReturnStatus, Set<ReturnStatus>> ALLOWED = Map.of(
            ReturnStatus.PENDING, Set.of(ReturnStatus.STAFF_CONFIRMED, ReturnStatus.REJECTED),
            ReturnStatus.STAFF_CONFIRMED, Set.of(ReturnStatus.APPROVED, ReturnStatus.REJECTED),
            ReturnStatus.APPROVED, Set.of(ReturnStatus.RECEIVED),
            ReturnStatus.RECEIVED, Set.of(ReturnStatus.REFUND_PENDING),
            ReturnStatus.REFUND_PENDING, Set.of(ReturnStatus.REFUNDED));

    private ReturnStatusTransition() {}

    static void validate(ReturnStatus from, ReturnStatus to) {
        if (from == to) {
            return;
        }
        if (isTerminal(from)) {
            throw new BadRequestException("Yêu cầu trả hàng đã kết thúc, không thể chuyển trạng thái");
        }
        Set<ReturnStatus> next = ALLOWED.get(from);
        if (next == null || !next.contains(to)) {
            throw new BadRequestException(
                    "Không thể chuyển từ " + from + " sang " + to + ". Vui lòng thực hiện đúng quy trình.");
        }
    }

    static boolean isTerminal(ReturnStatus status) {
        return status == ReturnStatus.REJECTED
                || status == ReturnStatus.REFUNDED
                || status == ReturnStatus.CLOSED;
    }

    static boolean isOpen(ReturnStatus status) {
        return !isTerminal(status);
    }
}
