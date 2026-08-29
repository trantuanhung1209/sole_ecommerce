package www.service.implement;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import www.model.entity.User;
import www.modules.orders.model.Order;
import www.modules.returns.model.ReturnRequest;
import www.repository.UserRepository;
import www.service.interfaces.MailService;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderMailNotifier {

    private final MailService mailService;
    private final UserRepository userRepository;

    public void sendOrderConfirmation(Order order) {
        resolveCustomer(order).ifPresent(customer -> {
            try {
                mailService.sendOrderConfirmationMail(customer.email(), customer.name(), order);
            } catch (Exception e) {
                log.error("Order confirmation email failed: orderId={}", order.getOrderId(), e);
            }
        });
    }

    public void sendOrderShipped(Order order) {
        resolveCustomer(order).ifPresent(customer -> {
            try {
                mailService.sendOrderShippedMail(customer.email(), customer.name(), order);
            } catch (Exception e) {
                log.error("Order shipped email failed: orderId={}", order.getOrderId(), e);
            }
        });
    }

    public void sendOrderDelivered(Order order) {
        resolveCustomer(order).ifPresent(customer -> {
            try {
                mailService.sendOrderDeliveredMail(customer.email(), customer.name(), order);
            } catch (Exception e) {
                log.error("Order delivered email failed: orderId={}", order.getOrderId(), e);
            }
        });
    }

    public void sendReturnRejected(Order order, ReturnRequest returnRequest) {
        if (order == null) {
            return;
        }
        resolveCustomer(order).ifPresent(customer -> {
            try {
                mailService.sendReturnRejectedMail(
                        customer.email(),
                        customer.name(),
                        order.getOrderCode(),
                        returnRequest.getRejectedReason());
            } catch (Exception e) {
                log.error("Return rejected email failed: returnId={}", returnRequest.getReturnId(), e);
            }
        });
    }

    public void sendReturnApproved(Order order, ReturnRequest returnRequest) {
        resolveCustomer(order).ifPresent(customer -> {
            try {
                Double refundAmount = returnRequest.getRefundAmount() != null
                        ? returnRequest.getRefundAmount()
                        : 0.0;
                mailService.sendReturnApprovedMail(
                        customer.email(),
                        customer.name(),
                        order.getOrderCode(),
                        refundAmount
                );
            } catch (Exception e) {
                log.error("Return approved email failed: returnId={}", returnRequest.getReturnId(), e);
            }
        });
    }

    public void sendPaymentFailed(Order order) {
        resolveCustomer(order).ifPresent(customer -> {
            try {
                mailService.sendPaymentFailedMail(customer.email(), customer.name(), order.getOrderCode());
            } catch (Exception e) {
                log.error("Payment failed email failed: orderId={}", order.getOrderId(), e);
            }
        });
    }

    public void sendPaymentExpired(Order order) {
        resolveCustomer(order).ifPresent(customer -> {
            try {
                mailService.sendPaymentExpiredMail(customer.email(), customer.name(), order.getOrderCode());
            } catch (Exception e) {
                log.error("Payment expired email failed: orderId={}", order.getOrderId(), e);
            }
        });
    }

    private Optional<CustomerContact> resolveCustomer(Order order) {
        if (order.getUserId() == null) {
            log.warn("Skip order email: missing userId on order {}", order.getOrderId());
            return Optional.empty();
        }
        return userRepository.findById(order.getUserId())
                .filter(user -> user.getEmail() != null && !user.getEmail().isBlank())
                .map(user -> new CustomerContact(
                        user.getEmail(),
                        displayName(user)
                ));
    }

    private String displayName(User user) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getEmail();
    }

    private record CustomerContact(String email, String name) {
    }
}
