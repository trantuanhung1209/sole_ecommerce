package www.modules.payments;

import org.junit.jupiter.api.Test;
import www.modules.payments.service.SePayIpnParser;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SePayIpnParserTest {

    private final SePayIpnParser parser = new SePayIpnParser();

    @Test
    void parse_nestedSePayPayload() {
        Map<String, Object> payload = Map.of(
                "timestamp", 1757058220,
                "notification_type", "ORDER_PAID",
                "order", Map.of(
                        "order_invoice_number", "ORDER_SO-123_999",
                        "order_amount", "500000.00",
                        "order_status", "CAPTURED"),
                "transaction", Map.of(
                        "transaction_id", "68ba94ac80123",
                        "transaction_status", "APPROVED",
                        "transaction_amount", "500000"));

        SePayIpnParser.ParsedIpn ipn = parser.parse(payload);

        assertEquals("ORDER_SO-123_999", ipn.orderInvoiceNumber());
        assertEquals("68ba94ac80123", ipn.transactionId());
        assertEquals("ORDER_PAID", ipn.status());
        assertTrue(parser.isPaid(ipn.status()));
    }

    @Test
    void parse_flatLegacyPayload() {
        Map<String, Object> payload = Map.of(
                "order_invoice_number", "INV-1",
                "transaction_id", "tx-1",
                "status", "SUCCESS",
                "order_amount", 500000);

        SePayIpnParser.ParsedIpn ipn = parser.parse(payload);

        assertEquals("INV-1", ipn.orderInvoiceNumber());
        assertEquals("tx-1", ipn.transactionId());
        assertEquals("SUCCESS", ipn.status());
        assertTrue(parser.isPaid(ipn.status()));
    }
}
