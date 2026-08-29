export interface CheckoutPricingInput {
  subtotal: number;
  discountTotal?: number;
  shippingFee: number;
  taxTotal?: number;
}

export function calculateGrandTotal(input: CheckoutPricingInput): number {
  const discount = input.discountTotal ?? 0;
  const tax = input.taxTotal ?? 0;
  return Math.max(0, input.subtotal - discount + input.shippingFee + tax);
}

export function calculateShippingFee(subtotal: number, freeThreshold = 2_000_000, flatFee = 30_000): number {
  if (subtotal <= 0) return 0;
  if (subtotal >= freeThreshold) return 0;
  return flatFee;
}

export function calculateVat(taxableSubtotal: number, vatRate: number): number {
  if (vatRate <= 0 || taxableSubtotal <= 0) return 0;
  return taxableSubtotal * vatRate;
}
