import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: ShieldCheck,
    title: "Chính hãng 100%",
    desc: "Mọi sản phẩm đều có nguồn gốc rõ ràng, hỗ trợ kiểm tra trước khi nhận.",
  },
  {
    icon: Truck,
    title: "Giao nhanh toàn quốc",
    desc: "Miễn phí vận chuyển đơn từ 2 triệu. Theo dõi đơn hàng realtime trên SOLE.",
  },
  {
    icon: Sparkles,
    title: "Trải nghiệm hiện đại",
    desc: "Chọn size/màu chuẩn, giỏ hàng thông minh, checkout SePay an toàn.",
  },
  {
    icon: Users,
    title: "Cộng đồng sneakerhead",
    desc: "Review thật từ khách đã mua, tư vấn AI 24/7 và CSKH tận tâm.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-5 md:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Về chúng tôi</p>
            <h1 className="mt-2 text-4xl font-bold md:text-5xl">SOLE — sneaker store cho người yêu giày</h1>
            <p className="mt-4 text-sm leading-relaxed text-[#6B7280] md:text-base">
              SOLE ra đời với sứ mệnh mang sneaker chính hãng đến gần hơn với cộng đồng yêu giày tại Việt Nam.
              Chúng tôi tập trung vào trải nghiệm mua sắm minh bạch: giá rõ ràng, variant chuẩn, tồn kho thật.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#6B7280] md:text-base">
              Từ running, lifestyle đến basketball và skate — mỗi đôi giày trên SOLE đều được chọn lọc kỹ lưỡng,
              kèm mô tả chi tiết và đánh giá từ khách hàng thực tế.
            </p>
            <Button asChild className="mt-8 h-12 rounded-lg bg-[#111111] px-6 text-white">
              <Link to="/products">
                Khám phá bộ sưu tập
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl bg-[#F1F1EF]">
            <img
              src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80"
              alt="SOLE sneaker collection"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FEE2E2]">
                <Icon className="h-5 w-5 text-[#E53935]" />
              </div>
              <h2 className="mt-4 font-bold">{title}</h2>
              <p className="mt-2 text-sm text-[#6B7280]">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-[#E5E7EB] bg-white p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-[#E5E7EB]">
            <div className="md:px-6 md:first:pl-0">
              <div className="text-3xl font-black">12+</div>
              <p className="mt-1 text-sm text-[#6B7280]">Mẫu sneaker hot</p>
            </div>
            <div className="md:px-6">
              <div className="text-3xl font-black">8</div>
              <p className="mt-1 text-sm text-[#6B7280]">Thương hiệu lớn</p>
            </div>
            <div className="md:px-6 md:last:pr-0">
              <div className="text-3xl font-black">200+</div>
              <p className="mt-1 text-sm text-[#6B7280]">Biến thể size/màu</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
