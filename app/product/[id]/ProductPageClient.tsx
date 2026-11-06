"use client";

import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useEffect } from "react";
import { pushViewItem, pushAddToCart } from "../../lib/gtmEvents";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IoArrowForward, IoShareSocial, IoHomeOutline, IoChevronBack, IoCartOutline } from "react-icons/io5";
import Link from "next/link";
import type { Product } from "../../components/products/types";
import { useCartStore } from "../../store/cartStore";
import ProductImages from "./components/ProductImages";
import ProductInfo from "./components/ProductInfo";
import ProductDetails from "./components/ProductDetails";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProductPageClient({ id, initialProduct }: { id: string; initialProduct: Product | null }) {
  const router = useRouter();
  const [addedToCart, setAddedToCart] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuthStore();

  const product = initialProduct;
  const finalPrice = product ? (product.salePrice ?? product.originalPrice ?? 0) : 0;

  // ── Track ViewContent / view_item ──
  useEffect(() => {
    if (!product) return;
    pushViewItem({
      currency: "SAR",
      value: finalPrice,
      items: [
        {
          item_id: String(product._id),
          item_name: product.name,
          price: finalPrice,
          quantity: 1,
          item_brand: product.brand,
          item_category: product.category,
        },
      ],
    });
  }, [product, finalPrice]);

  const addProductToCart = (product: Product, qty: number) => {
    addItem(product, qty);
    pushAddToCart({
      currency: "SAR",
      value: finalPrice * qty,
      items: [
        {
          item_id: String(product._id),
          item_name: product.name,
          price: finalPrice,
          quantity: qty,
          item_brand: product.brand,
          item_category: product.category,
        },
      ],
    });
  };

  if (!product)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-lg">المنتج غير موجود</p>
      </div>
    );

  const resolveImg = (src: string) => src.startsWith("http") ? src : `${API}${src}`;
  // API still used for image resolution only (not for fetching)
  const merged = [...(product.images || []), ...(product.image ? [product.image] : [])];
  const allImages = [...new Set(merged)].map(resolveImg);

  const handleShare = async () => {
    try { await navigator.share({ title: product.name, url: window.location.href }); } catch {}
  };


  return (
    <main className="min-h-screen bg-white pb-28 lg:pb-16" dir="rtl">

      {/* Top Bar */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl bg-white/95 shadow-sm"
        style={{ borderColor: "rgba(2,185,250,0.2)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all hover:shadow-md"
              style={{ borderColor: "#02B9FA", color: "#005AAD", background: "linear-gradient(135deg, rgba(2,211,255,0.08), rgba(0,90,173,0.08))" }}
            >
              <IoArrowForward size={17} />
            </button>
            <nav className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: "var(--color-3)" }}>
              <Link href="/" className="transition flex items-center gap-1 hover:opacity-70">
                <IoHomeOutline size={12} />
                الرئيسية
              </Link>
              <IoChevronBack size={10} />
              {product.category && (
                <>
                  <span>{product.category}</span>
                  <IoChevronBack size={10} />
                </>
              )}
              <span className="font-bold truncate max-w-[180px]" style={{ color: "#01226B" }}>{product.name}</span>
            </nav>
          </div>
          <button
            onClick={handleShare}
            className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all hover:shadow-md"
            style={{ borderColor: "#02B9FA", color: "#005AAD", background: "linear-gradient(135deg, rgba(2,211,255,0.08), rgba(0,90,173,0.08))" }}
          >
            <IoShareSocial size={15} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-8 lg:gap-12">
          <ProductImages images={allImages} name={product.name} discountPercent={product.discountPercent} />
          <ProductInfo
            product={product}
            addedToCart={addedToCart}
            onAddToCart={(qty: number) => {
              if (!product.inStock) return;
              addProductToCart(product, qty);
              setAddedToCart(true);
            }}
            onBuyNow={(qty: number) => {
              if (!product.inStock) return;
              addProductToCart(product, qty);
              router.push("/cart");
            }}
          />
        </div>
        <ProductDetails
          description={product.description}
          specs={product.specs}
          gallery={product.gallery}
          specifications={product.specifications}
          rating={product.rating}
          reviews={product.reviews}
        />
      </div>

      {/* Mobile Floating CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t bg-white/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(2,185,250,0.1)]"
        style={{ borderColor: "rgba(2,185,250,0.2)" }}
      >
        <div className="px-4 py-3" dir="rtl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs truncate flex-1 ml-3" style={{ color: "var(--color-3)" }}>{product.name}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black" style={{ color: "#01226B" }}>{finalPrice.toLocaleString("en-US")}</span>
              <span className="text-xs text-gray-400"><img src="/money-icon.webp" alt="ر.س" className="inline w-6 h-6 object-contain align-middle" /></span>
            </div>
          </div>
          {!product.inStock ? (
            <div className="w-full py-3.5 rounded-2xl bg-gray-100 border border-gray-200 text-gray-500 font-black text-center text-sm cursor-not-allowed select-none">
              نفذت الكمية - غير متوفر للشراء
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (addedToCart) router.push("/cart");
                else { addProductToCart(product, 1); setAddedToCart(true); }
              }}
              className="cart-btn w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-base font-black"
            >
              <IoCartOutline size={20} />
              {addedToCart ? "عرض السلة ✓" : "أضف للسلة"}
            </motion.button>
          )}
        </div>
      </div>
    </main>
  );
}
