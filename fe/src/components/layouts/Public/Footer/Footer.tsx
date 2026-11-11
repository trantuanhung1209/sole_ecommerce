import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { SoleLogo } from "@/components/brand/SoleLogo";

type FooterLinkItem = {
  label: string;
  to: string;
};

const SHOP_LINKS: FooterLinkItem[] = [
  { label: "Tất cả sản phẩm", to: "/products" },
  { label: "Hàng mới về", to: "/new-arrivals" },
  { label: "Danh mục", to: "/categories" },
  { label: "Thương hiệu", to: "/brands" },
  { label: "Trợ lý AI", to: "/ai-chat" },
];

const SUPPORT_LINKS: FooterLinkItem[] = [
  { label: "Đơn hàng của tôi", to: "/orders" },
  { label: "Đổi trả & Hoàn tiền", to: "/returns" },
  { label: "Giỏ hàng", to: "/cart" },
  { label: "Đánh giá khách hàng", to: "/reviews" },
  { label: "Về SOLE", to: "/about" },
  { label: "Liên hệ", to: "/contact" },
];

const SERVICE_HIGHLIGHTS = [
  { icon: ShieldCheck, label: "Authentic 100%" },
  { icon: RefreshCcw, label: "Đổi size 7 ngày" },
  { icon: Truck, label: "Giao nhanh toàn quốc" },
];

const PAYMENT_METHODS = ["COD", "SePay QR", "Visa/Mastercard"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]";

export type NewsletterValidationResult =
  | { valid: true; normalizedEmail: string }
  | { valid: false; error: string };

/** Validates newsletter email input on the client before showing confirmation. */
// eslint-disable-next-line react-refresh/only-export-components
export function validateNewsletterEmail(rawEmail: string): NewsletterValidationResult {
  const normalizedEmail = rawEmail.trim();
  if (!normalizedEmail) {
    return { valid: false, error: "Vui lòng nhập địa chỉ email của bạn." };
  }
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return { valid: false, error: "Địa chỉ email chưa đúng định dạng." };
  }
  return { valid: true, normalizedEmail };
}

type ScrollableWindow = {
  scrollTo: (options: ScrollToOptions) => void;
  matchMedia?: (query: string) => { matches: boolean };
};

/** Scrolls to top smoothly unless the user prefers reduced motion. */
// eslint-disable-next-line react-refresh/only-export-components
export function scrollFooterToTop(
  targetWindow: ScrollableWindow | undefined = typeof window !== "undefined" ? window : undefined
): ScrollBehavior | null {
  if (!targetWindow) {
    return null;
  }
  const prefersReducedMotion = Boolean(
    targetWindow.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  );
  const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";
  targetWindow.scrollTo({ top: 0, behavior });
  return behavior;
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [feedback, setFeedback] = useState("");

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateNewsletterEmail(email);
    if (!result.valid) {
      setStatus("error");
      setFeedback(result.error);
      return;
    }

    setStatus("success");
    setFeedback(`Đã đăng ký nhận tin Drop mới cho ${result.normalizedEmail}.`);
    setEmail("");
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#111111] text-white">
      <div className="mx-auto max-w-[1240px] px-4 py-12 md:px-5 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Brand block */}
          <div className="space-y-6 lg:col-span-4">
            <div>
              <Link
                to="/"
                aria-label="SOLE — Về trang chủ"
                className={`inline-flex rounded-lg ${focusRingClass}`}
              >
                <SoleLogo inverted size="md" />
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#D1D5DB]">
                Sneaker chính hãng — Streetwear &amp; Running Culture
              </p>
            </div>

            <ul className="flex flex-wrap gap-2" aria-label="Cam kết dịch vụ SOLE">
              {SERVICE_HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#E5E7EB]"
                >
                  <Icon className="h-3.5 w-3.5 text-[#E53935]" aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2.5 text-sm text-[#9CA3AF]">
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#E53935]" aria-hidden="true" />
                <span>Hotline: </span>
                <a
                  href="tel:19006363"
                  className={`rounded font-semibold text-white transition-colors hover:text-[#E53935] ${focusRingClass}`}
                >
                  1900 6363
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#E53935]" aria-hidden="true" />
                <a
                  href="mailto:support@sole.vn"
                  className={`rounded transition-colors hover:text-white ${focusRingClass}`}
                >
                  support@sole.vn
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E53935]" aria-hidden="true" />
                <span>Showroom: 123 Nguyễn Huệ, Quận 1, TP.HCM</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Kênh cộng đồng:
              </span>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram của SOLE"
                className={`rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-[#D1D5DB] transition-colors hover:border-[#E53935] hover:text-white ${focusRingClass}`}
              >
                Instagram
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook của SOLE"
                className={`rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-[#D1D5DB] transition-colors hover:border-[#E53935] hover:text-white ${focusRingClass}`}
              >
                Facebook
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok của SOLE"
                className={`rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-[#D1D5DB] transition-colors hover:border-[#E53935] hover:text-white ${focusRingClass}`}
              >
                TikTok
              </a>
            </div>
          </div>

          {/* Navigation columns */}
          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-8 lg:col-span-4"
          >
            <div>
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E53935]" aria-hidden="true" />
                Mua sắm
              </h2>
              <ul className="mt-4 space-y-2.5">
                {SHOP_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`inline-block rounded text-sm text-[#D1D5DB] transition-colors hover:text-[#E53935] ${focusRingClass}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E53935]" aria-hidden="true" />
                Hỗ trợ &amp; Tài khoản
              </h2>
              <ul className="mt-4 space-y-2.5">
                {SUPPORT_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`inline-block rounded text-sm text-[#D1D5DB] transition-colors hover:text-[#E53935] ${focusRingClass}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Newsletter + Back to top */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#E53935]" aria-hidden="true" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-white">
                  Nhận tin Drop mới
                </h2>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-[#9CA3AF]">
                Đăng ký email để cập nhật lịch release sneaker giới hạn và đợt restock size mới.
              </p>

              <form onSubmit={handleNewsletterSubmit} noValidate className="mt-4 space-y-2.5">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email nhận tin Drop mới
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (status !== "idle") {
                        setStatus("idle");
                        setFeedback("");
                      }
                    }}
                    placeholder="you@example.com"
                    aria-invalid={status === "error"}
                    aria-describedby={feedback ? "footer-newsletter-feedback" : undefined}
                    className={`h-10 flex-1 rounded-lg border border-white/15 bg-[#1A1A1A] px-3.5 text-sm text-white placeholder:text-[#6B7280] transition-colors focus:border-[#E53935] ${focusRingClass}`}
                  />
                  <button
                    type="submit"
                    className={`inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#E53935] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#C62828] ${focusRingClass}`}
                  >
                    Đăng ký
                  </button>
                </div>

                {feedback ? (
                  <p
                    id="footer-newsletter-feedback"
                    role={status === "error" ? "alert" : "status"}
                    className={
                      status === "error"
                        ? "text-xs font-medium text-[#FF6B6B]"
                        : "flex items-center gap-1.5 text-xs font-medium text-emerald-400"
                    }
                  >
                    {status === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : null}
                    <span>{feedback}</span>
                  </p>
                ) : null}
              </form>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-[#9CA3AF]">8:00 – 22:00 (T2 – CN)</span>
                <button
                  type="button"
                  onClick={() => scrollFooterToTop()}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#E5E7EB] transition-colors hover:border-[#E53935] hover:text-white ${focusRingClass}`}
                >
                  <ArrowUp className="h-3.5 w-3.5 text-[#E53935]" aria-hidden="true" />
                  <span>Về đầu trang</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom legal & payment bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#9CA3AF]">
            <span>© {currentYear} SOLE Sneaker Store. All rights reserved.</span>
            <span aria-hidden="true" className="hidden text-white/20 sm:inline">
              •
            </span>
            <div className="flex items-center gap-4">
              <Link
                to="/about"
                className={`rounded transition-colors hover:text-white ${focusRingClass}`}
              >
                Về SOLE
              </Link>
              <Link
                to="/contact"
                className={`rounded transition-colors hover:text-white ${focusRingClass}`}
              >
                Liên hệ
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2" aria-label="Phương thức thanh toán">
            <span className="mr-1 text-xs text-[#9CA3AF]">Thanh toán:</span>
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded-md border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#E5E7EB]"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
