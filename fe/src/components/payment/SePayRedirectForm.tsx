import type { PaymentCheckoutResponse } from "@/types/ecommerce.type";

/** POST hidden form to SePay checkout — required by gateway (not GET redirect). */
export function submitSePayCheckout(payment: PaymentCheckoutResponse) {
  if (!payment.paymentUrl || !payment.formData) {
    throw new Error("Missing SePay payment URL or form data");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = payment.paymentUrl;
  form.style.display = "none";

  Object.entries(payment.formData).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
