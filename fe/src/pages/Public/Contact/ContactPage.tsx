import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const contacts = [
  {
    icon: Mail,
    label: "Email",
    value: "support@sole.vn",
    href: "mailto:support@sole.vn",
  },
  {
    icon: Phone,
    label: "Hotline",
    value: "1900 6363",
    href: "tel:19006363",
  },
  {
    icon: MapPin,
    label: "Showroom",
    value: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  },
  {
    icon: Clock,
    label: "Giờ làm việc",
    value: "8:00 – 22:00 (T2 – CN)",
  },
];

const faqs = [
  {
    q: "Làm sao chọn đúng size?",
    a: "Xem bảng size trên trang chi tiết sản phẩm hoặc hỏi Trợ lý AI để được gợi ý theo mẫu giày bạn thường đi.",
  },
  {
    q: "Chính sách đổi trả?",
    a: "Hỗ trợ đổi size trong 7 ngày nếu sản phẩm còn nguyên tem, chưa qua sử dụng.",
  },
  {
    q: "Thanh toán có an toàn không?",
    a: "Checkout qua SePay sandbox/production với mã hóa chuẩn. Bạn cũng có thể theo dõi trạng thái đơn realtime.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-5 md:py-12">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Hỗ trợ</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Liên hệ SOLE</h1>
          <p className="mt-3 text-sm text-[#6B7280] md:text-base">
            Cần tư vấn size, kiểm tra đơn hàng hoặc hỗ trợ đổi trả? Chúng tôi luôn sẵn sàng.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {contacts.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEE2E2]">
                  <Icon className="h-5 w-5 text-[#E53935]" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#6B7280]">{label}</p>
                {href ? (
                  <a href={href} className="mt-1 block font-bold hover:text-[#E53935]">
                    {value}
                  </a>
                ) : (
                  <p className="mt-1 font-bold">{value}</p>
                )}
              </div>
            ))}

            <div className="sm:col-span-2 rounded-2xl bg-[#111111] p-6 text-white">
              <MessageCircle className="h-8 w-8 text-[#E53935]" />
              <h2 className="mt-4 text-xl font-bold">Chat với Trợ lý AI</h2>
              <p className="mt-2 text-sm text-[#D1D5DB]">
                Hỏi về sản phẩm, chính sách giao hàng hoặc gợi ý phối đồ — phản hồi tức thì 24/7.
              </p>
              <Button asChild className="mt-5 bg-[#E53935] text-white hover:bg-[#C62828]">
                <Link to="/ai-chat">Mở Trợ lý AI</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 md:p-8">
            <h2 className="text-xl font-bold">Câu hỏi thường gặp</h2>
            <div className="mt-6 space-y-5">
              {faqs.map((item) => (
                <div key={item.q} className="border-b border-[#F1F1EF] pb-5 last:border-0 last:pb-0">
                  <h3 className="font-bold">{item.q}</h3>
                  <p className="mt-2 text-sm text-[#6B7280]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
