package www.service.interfaces;

import www.modules.orders.model.Order;

public interface MailService {
    void sendOtpMail(String to, String otp);
    void sendResetPasswordMail(String to, String otp);
    void sendOrderConfirmationMail(String to, String customerName, Order order);
    void sendOrderShippedMail(String to, String customerName, Order order);
    void sendReturnApprovedMail(String to, String customerName, String orderCode, Double refundAmount);
}
