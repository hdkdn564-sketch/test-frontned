"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { IoCartOutline, IoCheckmarkCircle, IoWifiOutline } from "react-icons/io5";
import type { Product } from "./types";
import { useCartStore } from "../../store/cartStore";
import { useCartPopupStore } from "../../store/cartPopupStore";
import { pushAddToCart } from "../../lib/gtmEvents";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const resolveImgUrl = (src: string) => {
  if (src.startsWith("http")) return encodeURI(decodeURI(src));
  const path = src.startsWith("/") ? src : "/" + src;
  return `${API}${encodeURI(decodeURI(path))}`;
};
const fmt = (n: number) => n.toLocaleString("en-US");

export default function ProductCard({
  product,
  priority = false,
  rank,
}: {
  product: Product;
  priority?: boolean;
  rank?: number;
}) {
  const { name, brand, inStock, network } = product;

  const image = product.images?.[0] || product.image;
  const resolvedImage = image ? resolveImgUrl(image) : undefined;
  const originalPrice = product.originalPrice || product.price || 0;
  const salePrice = product.salePrice && product.salePrice > 0 ? product.salePrice : undefined;
  const hasDiscount = salePrice != null && salePrice < originalPrice;
  const displayPrice = hasDiscount ? salePrice : originalPrice;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - salePrice!) / originalPrice) * 100)
    : 0;

  const addItem = useCartStore((s) => s.addItem);
  const showPopup = useCartPopupStore((s) => s.show);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inStock === false || loading) return;
    setLoading(true);
    addItem(product);
    setLoading(false);
    setAdded(true);
    showPopup({
      id: product._id,
      name: product.name,
      image: resolvedImage ?? null,
      price: displayPrice ?? 0,
      hasDiscount,
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full"
    >
      <Link
        href={`/product/${product._id}`}
        prefetch={false}
        dir="rtl"
        className="group flex flex-col h-full"
        style={{
          borderRadius: 20,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
          border: "1px solid #f3f4f6",
        }}
      >
        {/* ─── منطقة الصورة ─── */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #f8f9fb 0%, #f0f2f5 100%)",
          }}
        >
          {/* خط لوني في الأعلى بألوان اللوجو */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] z-10"
            style={{ background: "linear-gradient(90deg, #01226B, #005AAD, #02B9FA)" }}
          />

          {/* شارة الخصم */}
          {hasDiscount && discountPct > 0 && (
            <div
              className="absolute top-3 right-3 z-20 text-white text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: "#ef4444", letterSpacing: "0.03em" }}
            >
              {discountPct}% خصم
            </div>
          )}

          {/* رقم الترتيب */}
          {rank != null && (
            <div
              className="absolute top-3 left-3 z-20 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white"
              style={{ background: "#01226B" }}
            >
              {rank}
            </div>
          )}

          {/* نفذت الكمية */}
          {inStock === false && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[3px]">
              <span className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                نفذت الكمية
              </span>
            </div>
          )}

          {resolvedImage ? (
            <Image
              src={resolvedImage}
              alt={name}
              width={400}
              height={400}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              unoptimized={resolvedImage.includes("cloudinary.com")}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-5xl select-none bg-gray-50">📱</div>
          )}
        </div>

        {/* ─── معلومات المنتج ─── */}
        <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2.5">

          {/* brand + network */}
          {(brand || network) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {brand && (
                <span
                  className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{ background: "#eef4fb", color: "#01226B" }}
                >
                  {brand}
                </span>
              )}
              {network && (
                <span
                  className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ background: "#f5f5f5", color: "#6b7280" }}
                >
                  <IoWifiOutline size={9} />
                  {network}
                </span>
              )}
            </div>
          )}

          {/* اسم المنتج */}
          <p className="text-[12px] sm:text-[13px] font-semibold text-[#01226B] group-hover:text-[#005AAD] transition-colors leading-snug line-clamp-2 flex-1">
            {name}
          </p>

          {/* ─── السعر والزر ─── */}
          <div className="flex flex-col gap-2 mt-auto">

            {/* السعر */}
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-1">
                <span
                  className="text-[20px] sm:text-[24px] font-black leading-none"
                  style={{ color: "#01226B" }}
                >
                  {fmt(displayPrice!)}
                </span>
                <img
                  src="/money-icon.webp"
                  alt="ر.س"
                  className="w-5 sm:w-6 h-5 sm:h-6 object-contain"
                />
              </div>
              {hasDiscount && (
                <span className="text-[10px] sm:text-[11px] text-gray-400 line-through leading-none">
                  {fmt(originalPrice)}
                </span>
              )}
            </div>

            {/* زر السلة */}
            {inStock === false ? (
              <button
                disabled
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="w-full py-2.5 rounded-xl text-[11px] font-bold text-gray-400 bg-gray-100 cursor-not-allowed"
              >
                نفذت الكمية
              </button>
            ) : (
              <motion.button
                onClick={handleAddToCart}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                aria-label="أضف إلى السلة"
                className="w-full py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
                style={
                  added
                    ? { background: "#01226B", color: "#fff" }
                    : { background: "#eef4fb", color: "#01226B" }
                }
              >
                <AnimatePresence mode="wait" initial={false}>
                  {loading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                    />
                  ) : added ? (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-1.5"
                    >
                      <IoCheckmarkCircle size={14} />
                      تمت الإضافة
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-1.5"
                    >
                      <IoCartOutline size={14} />
                      أضف للسلة
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
