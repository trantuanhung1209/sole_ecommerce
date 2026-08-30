package www.modules.payments.service;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class SePayIpnParser {

    public ParsedIpn parse(Map<String, Object> payload) {
        Map<String, Object> order = asMap(payload.get("order"));
        Map<String, Object> transaction = asMap(payload.get("transaction"));

        String invoice = firstNonBlank(
                stringVal(order, "order_invoice_number"),
                stringVal(payload, "order_invoice_number", "orderInvoiceNumber"));

        String transactionId = firstNonBlank(
                stringVal(transaction, "transaction_id"),
                stringVal(payload, "transaction_id", "transactionId"));

        String status = firstNonBlank(
                stringVal(payload, "notification_type"),
                stringVal(transaction, "transaction_status"),
                stringVal(order, "order_status"),
                stringVal(payload, "status", "transaction_status"));

        return new ParsedIpn(invoice, transactionId, status, payload);
    }

    public boolean isPaid(String status) {
        if (status == null || status.isBlank()) {
            return false;
        }
        return switch (status.trim().toUpperCase()) {
            case "ORDER_PAID", "SUCCESS", "COMPLETED", "APPROVED", "CAPTURED" -> true;
            default -> false;
        };
    }

    public record ParsedIpn(
            String orderInvoiceNumber,
            String transactionId,
            String status,
            Map<String, Object> rawPayload) {}

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String stringVal(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object val = payload.get(key);
            if (val != null) {
                return String.valueOf(val);
            }
        }
        return null;
    }
}
