import Link from "next/link";
import { Tag } from "lucide-react";
import type { Product } from "./products/types";
import ProductCard from "./products/ProductCard";
import { sortProducts } from "../lib/sortProducts";

type BrandSetting = {
  brand: string;
  showInHome: boolean;
  order: number;
  bannerImages?: string[];
};

type BrandSection = {
  brand: string;
  products: Product[];
  bannerImages?: string[];
};

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// In-memory backup to prevent homepage products from vanishing if backend is sleeping or timing out
let cachedSectionsBackup: BrandSection[] = [];

async function getSections(): Promise<BrandSection[]> {
  try {
    // 1. Try single consolidated endpoint (1 backend request instead of 1 + N)
    const singleRes = await fetch(`${BACKEND}/api/products/home-sections`, {
      next: { revalidate: 86400, tags: ["home_sections", "products"] },
      signal: AbortSignal.timeout(15000),
    });
    if (singleRes.ok) {
      const data = await singleRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const processed = data.map((sec: BrandSection) => ({
          ...sec,
          products: sortProducts(sec.products || [], true).slice(0, 4),
        })).filter((sec: BrandSection) => sec.products.length > 0);

        if (processed.length > 0) {
          cachedSectionsBackup = processed;
          return processed;
        }
      }
    }
  } catch (err) {
    console.warn("home-sections consolidated fetch failed or timed out, trying fallback...", err);
  }

  try {
    // 2. Fallback to existing settings + multi-product fetch
    const settingsRes = await fetch(`${BACKEND}/api/admin/brands/home-settings`, {
      next: { revalidate: 86400, tags: ["brands-settings"] },
      signal: AbortSignal.timeout(15000),
    });
    if (!settingsRes.ok) {
      return cachedSectionsBackup.length > 0 ? cachedSectionsBackup : [];
    }

    const settings: BrandSetting[] = await settingsRes.json();
    const visible = settings.filter((s) => s.showInHome).sort((a, b) => a.order - b.order);
    if (visible.length === 0) {
      return cachedSectionsBackup.length > 0 ? cachedSectionsBackup : [];
    }

    const results = await Promise.all(
      visible.map(async (s) => {
        try {
          const res = await fetch(
            `${BACKEND}/api/products?brand=${encodeURIComponent(s.brand)}`,
            { next: { revalidate: 86400, tags: ["products"] }, signal: AbortSignal.timeout(15000) }
          );
          const data = res.ok ? await res.json() : [];
          const raw: Product[] = Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : [];
          const products = sortProducts(raw, true).slice(0, 4);
          return { brand: s.brand, products, bannerImages: s.bannerImages || [] };
        } catch {
          return { brand: s.brand, products: [], bannerImages: s.bannerImages || [] };
        }
      })
    );

    const valid = results.filter((s) => s.products.length > 0);
    if (valid.length > 0) {
      cachedSectionsBackup = valid;
      return valid;
    }
    return cachedSectionsBackup.length > 0 ? cachedSectionsBackup : [];
  } catch (err) {
    console.error("Failed to load home category sections:", err);
    return cachedSectionsBackup.length > 0 ? cachedSectionsBackup : [];
  }
}

export default async function HomeCategorySections() {
  const sections = await getSections();
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((sec) => (
        <section key={sec.brand} dir="rtl" className="w-full px-3 sm:px-6 lg:px-8 py-8 sm:py-14">
          <div className="max-w-6xl mx-auto">

            {sec.bannerImages && sec.bannerImages.length > 0 && (
              <div className="mb-6 sm:mb-10 rounded-2xl overflow-hidden flex flex-col gap-3">
                {sec.bannerImages.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt={sec.brand}
                    loading="lazy"
                    decoding="async"
                    className="w-full object-cover"
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-6 sm:mb-10">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#02D3FF] to-[#023A89]" />
                <div>
                  <h2 className="text-xl sm:text-3xl font-black text-[#01226B]">{sec.brand}</h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">أفضل المنتجات في هذه الفئة</p>
                </div>
              </div>
              <Link
                href={`/all-products?brand=${encodeURIComponent(sec.brand)}`}
                prefetch={false}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:shadow-sm"
                style={{ 
                  background: "linear-gradient(135deg, rgba(2,211,255,0.06), rgba(0,90,173,0.06))", 
                  border: "1px solid rgba(2,185,250,0.25)" 
                }}
              >
                <Tag className="w-3.5 h-3.5 text-[#005AAD]" />
                <span className="text-[#01226B] text-xs font-bold">عرض الكل</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {sec.products.map((p) => (
                <ProductCard key={p._id} product={p} priority={false} />
              ))}
            </div>

          </div>
        </section>
      ))}
    </>
  );
}

