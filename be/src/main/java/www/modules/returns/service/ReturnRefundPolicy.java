package www.modules.returns.service;

import www.modules.common.EcommerceEnums.ReturnItemCondition;

public final class ReturnRefundPolicy {
    public static final int RETURN_WINDOW_DAYS = 7;
    public static final int SHIP_BACK_DEADLINE_DAYS = 7;
    public static final int STALE_REFUND_PENDING_DAYS = 3;
    public static final double DAMAGED_REFUND_RATIO = 0.5;
    public static final double INCOMPLETE_REFUND_RATIO = 0.3;

    private ReturnRefundPolicy() {}

    static double computeMaxRefundAmount(double lineTotal, ReturnItemCondition condition) {
        if (lineTotal <= 0) {
            return 0;
        }
        return switch (condition) {
            case GOOD -> lineTotal;
            case DAMAGED -> Math.floor(lineTotal * DAMAGED_REFUND_RATIO);
            case INCOMPLETE -> Math.floor(lineTotal * INCOMPLETE_REFUND_RATIO);
        };
    }

    static boolean shouldRestock(ReturnItemCondition condition) {
        return condition == ReturnItemCondition.GOOD;
    }
}
