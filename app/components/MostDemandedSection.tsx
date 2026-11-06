import { TrendingUp } from "lucide-react";
import type { Product } from "./products/types";
import ProductCard from "./products/ProductCard";

// الـ IDs المطلوبة — تُرسل كـ query واحدة بدل 4 requests منفصلة
const IDS = [
  "6a943492832465e62427be05",
  "6a9437e6cd7da0bf04e86916",
  "6a9430ba2f39401999e29c50",
  "6a94389df64d29e186524b77",
];

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let cachedMostDemandedBackup: Product[] = [];

// Fix 7: request واحدة بدل 4 — /api/products/by-ids?ids=id1,id2,id3,id4
async function getMostDemanded(): Promise<Product[]> {
  try {
    const idsParam = IDS.join(",");
    const res = await fetch(`${BACKEND}/api/products/by-ids?ids=${idsParam}`, {
      next: { revalidate: 86400, tags: ["products"] },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return cachedMostDemandedBackup.length > 0 ? cachedMostDemandedBackup : [];
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      cachedMostDemandedBackup = data;
      return data;
    }
    return cachedMostDemandedBackup.length > 0 ? cachedMostDemandedBackup : [];
  } catch {
    return cachedMostDemandedBackup.length > 0 ? cachedMostDemandedBackup : [];
  }
}

export default async function MostDemandedSection() {
  const products = await getMostDemanded();
  if (products.length === 0) return null;

  return (
    <section dir="rtl" className="w-full px-2 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#02B9FA] to-[#005AAD]" />
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-[#01226B]">الأكثر طلباً</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">منتجات يختارها عملاؤنا باستمرار</p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ 
              background: "linear-gradient(135deg, rgba(2,185,250,0.08), rgba(0,90,173,0.08))", 
              border: "1px solid rgba(2,185,250,0.3)" 
            }}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#005AAD]" />
            <span className="text-[#01226B] text-xs font-bold">الأعلى مبيعاً</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5">
          {products.map((p, i) => (
            <ProductCard key={p._id} product={p} priority={i < 2} />
          ))}
        </div>

      </div>
    </section>
  );
}
