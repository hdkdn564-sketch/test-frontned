"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "../components/products/ProductCard";
import type { Product } from "../components/products/types";
export default function SearchClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/products?q=${encodeURIComponent(q)}&cardOnly=true`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
      })
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-xl font-bold text-[#01226B] mb-6">
        نتائج البحث عن: <span className="text-[#005AAD]">{q}</span>
      </h1>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-[#005AAD] rounded-full animate-spin" />
        </div>
      )}

      {!loading && products.length === 0 && q && (
        <p className="text-center text-gray-500 py-20">لا توجد منتجات تطابق بحثك</p>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
