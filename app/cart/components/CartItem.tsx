import Image from "next/image";
import { Plus, Minus, X } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("en-US");

interface CartItemProps {
  product: {
    _id: string;
    name: string;
    price: number;
    salePrice?: number;
    originalPrice?: number;
    images?: string[];
    image?: string;
  };
  qty: number;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const resolveImg = (src: string) => src.startsWith("http") ? src : `${API}${src}`;

export default function CartItem({ product, qty, onUpdateQty, onRemove }: CartItemProps) {
  const price = product.salePrice ?? product.originalPrice ?? product.price;
  const rawImg = product.images?.[0] || product.image;
  const img = rawImg ? resolveImg(rawImg) : undefined;
  const hasDiscount = product.salePrice && product.originalPrice && product.salePrice < product.originalPrice;
  const discountPercent = hasDiscount ? Math.round((1 - product.salePrice! / product.originalPrice!) * 100) : 0;

  return (
    <div className="group rounded-2xl border border-slate-200/90 hover:border-[#02B9FA]/40 transition-all duration-200 p-3 sm:p-4 bg-white shadow-sm hover:shadow-md">
      <div className="flex gap-3 sm:gap-4">
        {/* Image */}
        <div className="relative w-[72px] h-[72px] sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50/60">
          {img ? (
            <Image src={img} alt={product.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">📱</div>
          )}
          {hasDiscount && (
            <span className="absolute top-1 right-1 text-[8px] font-black text-white px-1.5 py-0.5 rounded shadow-sm" style={{ background: "#005AAD" }}>
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold leading-relaxed line-clamp-2 transition-colors group-hover:text-[#005AAD]" style={{ color: "#01226B" }}>
              {product.name}
            </h3>
            <button
              onClick={() => onRemove(product._id)}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shrink-0"
              title="حذف المنتج"
            >
              <X size={12} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 sm:mt-3">
            <div>
              <span className="text-sm sm:text-lg font-black" style={{ color: "#01226B" }}>{fmt(price * qty)}</span>
              <span className="text-[9px] mr-0.5 text-slate-400"><img src="/money-icon.webp" alt="ر.س" className="inline w-6 h-6 object-contain align-middle" /></span>
              {hasDiscount && (
                <span className="text-[10px] line-through mr-1.5 text-slate-400 font-medium">{fmt(product.originalPrice! * qty)}</span>
              )}
            </div>

            {/* Qty Controls */}
            <div className="flex items-center rounded-xl overflow-hidden border border-[#02B9FA]/30 bg-slate-50/40">
              <button
                onClick={() => onUpdateQty(product._id, qty - 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#005AAD] hover:bg-[#02B9FA]/10 active:scale-95 transition"
                title="تقليل الكمية"
              >
                <Minus size={12} />
              </button>
              <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-black bg-white" style={{ color: "#01226B" }}>{qty}</span>
              <button
                onClick={() => onUpdateQty(product._id, qty + 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white active:scale-95 transition font-black hover:opacity-90"
                style={{ background: "#01226B" }}
                title="زيادة الكمية"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
