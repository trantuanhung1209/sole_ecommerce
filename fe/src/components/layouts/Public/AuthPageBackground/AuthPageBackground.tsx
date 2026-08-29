import { ShieldCheck, Sparkles, Truck } from "lucide-react";
import { SoleLogo } from "@/components/brand/SoleLogo";

const heroSneaker =
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80";

const highlights = [
  { icon: Truck, text: "Giao nhanh 2–4 ngày" },
  { icon: ShieldCheck, text: "Hàng chính hãng 100%" },
  { icon: Sparkles, text: "Trải nghiệm mua sắm premium" },
];

export function AuthPageBackground() {
  return (
    <>
      {/* Mobile / tablet backdrop */}
      <div className="absolute inset-0 bg-[#F7F7F5] lg:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(229,57,53,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(17,17,17,0.08),transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(17,17,17,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      {/* Desktop brand panel */}
      <div className="relative hidden h-full min-h-0 overflow-hidden bg-[#111111] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(229,57,53,0.35),transparent_42%),radial-gradient(circle_at_85%_75%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="absolute -right-24 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[#E53935]/20 blur-3xl" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center gap-6 p-8 xl:gap-8 xl:p-10">
          <SoleLogo size="lg" inverted />

          <div className="max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E53935]">
              Premium sneaker store
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-white xl:text-4xl">
              Đăng nhập và khám phá bộ sưu tập mới nhất
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70 xl:text-base">
              Chọn size, màu, SKU chính xác. Tồn kho thật, checkout an toàn, theo dõi đơn hàng dễ dàng.
            </p>
          </div>

          <ul className="space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-[#E53935]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 shrink-0 p-8 xl:p-10">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
            <img
              src={heroSneaker}
              alt=""
              className="h-36 w-full rounded-xl object-cover opacity-90 xl:h-44"
            />
          </div>
        </div>
      </div>
    </>
  );
}
