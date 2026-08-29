package www.service.implement;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import www.config.ResendProperties;
import www.modules.orders.model.Order;
import www.service.interfaces.MailService;

import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImpl implements MailService {

    private final Resend resend;
    private final ResendProperties resendProperties;
    private final TemplateEngine templateEngine;

    private static final NumberFormat CURRENCY_FORMATTER = NumberFormat.getInstance(new Locale("vi", "VN"));

    private void sendHtmlEmail(String to, String subject, String templateName, Context context) {
        try {
            String htmlContent = templateEngine.process("email/" + templateName, context);
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(resendProperties.getFromEmail())
                    .to(to)
                    .subject(subject)
                    .html(htmlContent)
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            log.info("Email sent via Resend: {} -> {} (id={})", templateName, to, response.getId());
        } catch (ResendException e) {
            log.error("Email failed via Resend: {} -> {}", templateName, to, e);
            throw new RuntimeException("Gửi email thất bại", e);
        }
    }

    @Override
    public void sendOtpMail(String to, String otp) {
        Context context = new Context();
        context.setVariable("otp", otp);
        sendHtmlEmail(to, "Xác thực tài khoản - OTP Code", "otp-verification", context);
    }

    @Override
    public void sendResetPasswordMail(String to, String otp) {
        Context context = new Context();
        context.setVariable("otp", otp);
        sendHtmlEmail(to, "Đặt lại mật khẩu - OTP Code", "reset-password", context);
    }

    @Override
    public void sendOrderConfirmationMail(String to, String customerName, Order order) {
        Context context = new Context();
        context.setVariable("customerName", customerName);
        context.setVariable("orderCode", order.getOrderCode());
        context.setVariable("grandTotal", CURRENCY_FORMATTER.format(order.getGrandTotal()) + " VNĐ");
        context.setVariable("itemCount", order.getItems().size());
        sendHtmlEmail(to, "Xác nhận đơn hàng - " + order.getOrderCode(), "order-confirmation", context);
    }

    @Override
    public void sendOrderShippedMail(String to, String customerName, Order order) {
        Context context = new Context();
        context.setVariable("customerName", customerName);
        context.setVariable("orderCode", order.getOrderCode());
        sendHtmlEmail(to, "Đơn hàng đã được giao vận chuyển - " + order.getOrderCode(), "order-shipped", context);
    }

    @Override
    public void sendReturnApprovedMail(String to, String customerName, String orderCode, Double refundAmount) {
        Context context = new Context();
        context.setVariable("customerName", customerName);
        context.setVariable("orderCode", orderCode);
        context.setVariable("refundAmount", CURRENCY_FORMATTER.format(refundAmount) + " VNĐ");
        sendHtmlEmail(to, "Yêu cầu trả hàng đã được duyệt - " + orderCode, "return-approved", context);
    }
}
