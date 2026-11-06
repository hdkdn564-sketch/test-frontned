"use client";

import { useRef, useEffect, useSyncExternalStore, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Home, Truck, Lock, MessageCircle, BadgeCheck, ShieldCheck, Zap, Package, User, Phone, MapPin, IdCard, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import type { CustomerInfo } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import CartItem from "./components/CartItem";
import AnimatedBackground from "../components/AnimatedBackground";

const fmt = (n: number) => n.toLocaleString("en-US");

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQty, totalPrice, totalItems, setCustomer, clear } = useCartStore();
  const { user, initialized } = useAuthStore();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const scrolled = useRef(false);

  const [showModal, setShowModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (!scrolled.current) { scrolled.current = true; window.scrollTo(0, 0); } }, []);

  const total = mounted ? totalPrice() : 0;
  const count = mounted ? totalItems() : 0;

  const handleOrder = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "الاسم مطلوب";
    if (!nationalId.trim()) e.nationalId = "رقم الهوية مطلوب";
    else if (!/^[12]\d{9}$/.test(nationalId.trim())) e.nationalId = "هوية سعودية: 10 أرقام تبدأ بـ 1 أو 2";
    if (!whatsapp.trim()) e.whatsapp = "رقم الواتساب مطلوب";
    else if (!/^05\d{8}$/.test(whatsapp.trim())) e.whatsapp = "يبدأ بـ 05 ويتكون من 10 أرقام";
    if (!address.trim()) e.address = "العنوان مطلوب";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "cash_on_delivery",
          items: items.map(i => ({ productId: i.product._id, name: i.product.name, price: i.product.salePrice ?? i.product.originalPrice, quantity: i.qty })),
          total,
          customer: name,
          whatsapp,
          nationalId,
          address,
        }),
      });
    } catch { /* silent */ }
    setLoading(false);
    setCustomer({ name, nationalId, whatsapp, address, installmentType: "full", months: 0, downPayment: 0 });
    setShowModal(false);
    setShowPopup(true);
  };

  if (!mounted) return null;

  if (items.length === 0)
    return (
      <>
        <AnimatedBackground />
        <main className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 px-4 text-center" dir="rtl">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#02B9FA]/10 border border-[#02B9FA]/20 mb-1">
            <ShoppingBag className="w-10 h-10 text-[#005AAD]" strokeWidth={1.75} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-[#01226B]">السلة فارغة</h2>
            <p className="text-slate-500 text-sm">لم تضف أي منتجات بعد</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 rounded-xl text-white text-sm font-bold transition-all shadow-md shadow-[#01226B]/15 hover:shadow-lg active:scale-95"
            style={{ background: "linear-gradient(to left, #01226B, #005AAD)" }}
          >
            تصفح المنتجات
          </button>
        </main>
      </>
    );

  return (
    <div className="min-h-[100dvh] bg-white" dir="rtl">
      <AnimatedBackground />

      {/* Redirect Loading Overlay */}
      {redirecting && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-7 px-4 bg-white">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#005AAD]" style={{ animation: "spin 0.85s linear infinite" }} />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-[#01226B] font-black text-sm sm:text-base">جاري الانتقال للطلب</p>
            <p className="text-slate-400 text-xs sm:text-sm">يرجى الانتظار...</p>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1"><Lock size={9} /> اتصال مشفّر وآمن · PCI DSS</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Success Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(1, 34, 107, 0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => { setShowPopup(false); clear(); }}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #02B9FA, #02D3FF, #005AAD)" }} />
            <div className="p-6 sm:p-8 text-center" dir="rtl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-[#02B9FA]/15 to-[#005AAD]/15 border border-[#02B9FA]/20">
                <BadgeCheck className="w-8 h-8 text-[#005AAD]" />
              </div>
              <h2 className="text-xl font-black text-[#01226B] mb-1">تم استلام طلبك! 🎉</h2>
              <p className="text-[#005AAD] font-bold text-sm mb-4">سيتم التواصل معك قريباً</p>
              <div className="rounded-2xl border border-slate-200/80 p-4 mb-4 text-right space-y-2 bg-slate-50/50">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">الاسم</span>
                  <span className="font-bold text-[#01226B]">{name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">واتساب</span>
                  <span className="font-bold text-[#01226B]" dir="ltr">{whatsapp}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">العنوان</span>
                  <span className="font-bold text-[#01226B] text-left max-w-[60%]">{address}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="text-slate-500 text-xs">الإجمالي</span>
                  <span className="text-lg font-black text-[#01226B]">{fmt(total)} <span className="text-xs font-medium text-slate-400"><img src="/money-icon.webp" alt="ر.س" className="inline w-7 h-7 object-contain align-middle" /></span></span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl border border-[#02B9FA]/25 px-4 py-3 mb-4 bg-[#02B9FA]/5">
                <Truck className="w-4 h-4 text-[#005AAD]" />
                <span className="text-sm font-bold text-[#01226B]">الدفع عند الاستلام</span>
              </div>
              <p className="text-slate-400 text-xs mb-5">سيتصل بك فريقنا على رقم واتساب المسجل لتأكيد الطلب وتحديد موعد التوصيل</p>
              <button
                onClick={() => { setShowPopup(false); clear(); }}
                className="w-full py-3.5 rounded-xl text-white font-black text-sm transition-all hover:opacity-95 shadow-md shadow-[#01226B]/15"
                style={{ background: "linear-gradient(to left, #01226B, #005AAD)" }}
              >
                حسناً، شكراً! ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(1, 34, 107, 0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #02B9FA, #02D3FF, #005AAD)" }} />
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#02B9FA] to-[#005AAD] shadow-sm">
                <CheckCircle2 size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#01226B]">معلوماتك الشخصية</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">الاسم والهوية والتواصل والعنوان</p>
              </div>
            </div>
            <div className="p-5 space-y-4" dir="rtl">
              <div className="grid grid-cols-1 gap-4">
                <Field fieldName="name" label="الاسم الكامل" icon={<User size={14} />} value={name} error={errors.name} placeholder="محمد أحمد العلي"
                  onChange={(v) => { setName(v.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, "")); setErrors(p => ({ ...p, name: "" })); }} />
                <Field fieldName="nationalId" label="رقم الهوية / الإقامة" icon={<IdCard size={14} />} value={nationalId} error={errors.nationalId} placeholder="1XXXXXXXXX" maxLength={10} inputMode="numeric"
                  onChange={(v) => { setNationalId(v.replace(/\D/g, "").slice(0, 10)); setErrors(p => ({ ...p, nationalId: "" })); }} />
                <Field fieldName="whatsapp" label="رقم الواتساب" icon={<Phone size={14} />} value={whatsapp} error={errors.whatsapp} placeholder="05XXXXXXXX" maxLength={10} dir="ltr" inputMode="numeric"
                  onChange={(v) => { setWhatsapp(v.replace(/\D/g, "").slice(0, 10)); setErrors(p => ({ ...p, whatsapp: "" })); }} />
                <Field fieldName="address" label="عنوان التوصيل" icon={<MapPin size={14} />} value={address} error={errors.address} placeholder="المدينة - الحي - الشارع"
                  onChange={(v) => { setAddress(v); setErrors(p => ({ ...p, address: "" })); }} />
              </div>
              <button
                onClick={handleOrder}
                disabled={loading}
                className="w-full py-4 rounded-xl text-white font-black text-sm transition-all hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-[#01226B]/15"
                style={{ background: "linear-gradient(to left, #01226B, #005AAD)" }}
              >
                {loading ? "جاري المعالجة..." : "تأكيد الدفع عند الاستلام"}
                {!loading && <ArrowLeft size={16} />}
              </button>
              <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Lock size={10} /> بياناتك محمية ومشفرة بالكامل
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-slate-100 bg-white/95">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 transition text-sm font-bold text-[#01226B]/80 hover:text-[#005AAD]">
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">رجوع</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-[#01226B]" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm" style={{ background: "#01226B" }}>
                {count}
              </span>
            </div>
            <span className="text-base font-black text-[#01226B]">السلة</span>
          </div>

          <Link href="/" prefetch={false} className="w-9 h-9 rounded-xl border border-slate-200 hover:border-[#02B9FA]/40 bg-slate-50/70 hover:bg-[#02B9FA]/10 flex items-center justify-center transition text-[#01226B] hover:text-[#005AAD]" title="الرئيسية">
            <Home className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 bg-white">

        {/* Summary Bar */}
        <div className="rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 relative overflow-hidden border border-[#02B9FA]/20 bg-gradient-to-l from-[#02B9FA]/[0.06] via-white to-white shadow-sm">
          <div className="relative flex flex-row items-center justify-between gap-2">
            <div>
              <p className="text-xs mb-1 text-slate-500 font-medium">إجمالي الطلب</p>
              <p className="text-3xl sm:text-4xl font-black text-[#01226B]">
                {fmt(total)} <span className="text-sm font-medium text-slate-400"><img src="/money-icon.webp" alt="ر.س" className="inline w-7 h-7 object-contain align-middle" /></span>
              </p>
            </div>
            <div className="flex gap-3 sm:gap-6">
              <MiniStat icon={<ShieldCheck size={14} />} label="ضمان" value="سنتين" />
              <MiniStat icon={<Zap size={14} />} label="توصيل" value="مجاني" />
              <MiniStat icon={<Package size={14} />} label="منتجات" value={`${count}`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* RIGHT: Products */}
          <div className="lg:col-span-8 space-y-6">

            {/* Products */}
            <section>
              <SectionHeader title="المنتجات" badge={`${count} منتج`} />
              <div className="space-y-3 mt-4">
                {items.map(({ product, qty }) => (
                  <CartItem key={product._id} product={product} qty={qty} onUpdateQty={updateQty} onRemove={removeItem} />
                ))}
              </div>
            </section>

            {/* Mobile Summary */}
            <section className="lg:hidden">
              <SectionHeader title="ملخص الطلب" />
              <div className="mt-3">
                <OrderSummaryMobile items={items} total={total} />
              </div>
            </section>

            {initialized && !user && (
              <div className="border border-[#02B9FA]/25 bg-gradient-to-r from-[#02B9FA]/5 to-transparent rounded-2xl p-4" dir="rtl">
                <div className="flex gap-3 items-start">
                  <span className="mt-0.5 shrink-0 text-[#005AAD]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </span>
                  <div className="space-y-2.5 flex-1">
                    <p className="text-xs leading-relaxed text-[#01226B]/80 font-medium">
                      لتتمكن من متابعة طلبك وتفاصيله بسهولة بعد إتمام الدفع، ننصحك بتسجيل الدخول أو إنشاء حساب — وهو اختياري تمامًا.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href="/auth?redirect=/cart"
                        prefetch={false}
                        className="text-xs font-bold text-white px-3.5 py-1.5 rounded-lg transition-all hover:opacity-90 shadow-sm"
                        style={{ background: "#01226B" }}
                      >
                        تسجيل الدخول
                      </Link>
                      <Link
                        href="/auth?tab=register&redirect=/cart"
                        prefetch={false}
                        className="text-xs font-bold border border-[#02B9FA] text-[#005AAD] hover:bg-[#02B9FA]/10 px-3.5 py-1.5 rounded-lg transition-colors"
                      >
                        إنشاء حساب
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={() => {
                setRedirecting(true);
                setTimeout(() => router.push("/checkout"), 3000);
              }}
              disabled={redirecting}
              className="w-full py-4 rounded-xl text-white font-black text-base transition-all hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-90 shadow-md shadow-[#01226B]/15 hover:shadow-lg"
              style={{ background: "linear-gradient(to left, #01226B, #005AAD)" }}
            >
              {redirecting ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  جاري التحميل...
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  إتمام الطلب
                </>
              )}
            </button>
          </div>

          {/* LEFT: Sticky Summary (desktop) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h3 className="text-sm font-black text-[#01226B]">ملخص الطلب</h3>
                </div>
                <div className="p-5 space-y-3">
                  {items.map(({ product, qty }) => {
                    const price = product.salePrice ?? product.originalPrice ?? product.price;
                    return (
                      <div key={product._id} className="flex justify-between items-start gap-2">
                        <p className="text-xs leading-relaxed line-clamp-1 flex-1 text-[#01226B]/80">
                          {product.name} <span className="text-[#005AAD] font-bold">×{qty}</span>
                        </p>
                        <span className="text-xs font-bold whitespace-nowrap text-[#01226B]">
                          {fmt(price * qty)} <img src="/money-icon.webp" alt="ر.س" className="inline w-6 h-6 object-contain align-middle" />
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500"><Truck size={12} className="text-[#005AAD]" /> التوصيل</span>
                    <span className="font-bold text-[#005AAD]">مجاني ✓</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <span className="text-sm font-bold text-[#01226B]/70">الإجمالي</span>
                    <span className="text-2xl font-black text-[#01226B]">
                      {fmt(total)} <span className="text-xs font-medium text-slate-400"><img src="/money-icon.webp" alt="ر.س" className="inline w-7 h-7 object-contain align-middle" /></span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust */}
              <div className="rounded-2xl border border-slate-200/80 p-4 grid grid-cols-2 gap-2 bg-white shadow-sm">
                <TrustBadge icon={<Lock size={13} />} text="دفع آمن" />
                <TrustBadge icon={<Truck size={13} />} text="شحن سريع" />
                <TrustBadge icon={<BadgeCheck size={13} />} text="ضمان رسمي" />
                <TrustBadge icon={<MessageCircle size={13} />} text="دعم واتساب" />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#02B9FA] to-[#01226B]" />
      <h2 className="text-sm sm:text-base font-black text-[#01226B]">{title}</h2>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#02B9FA]/30 text-[#005AAD] bg-[#02B9FA]/10">
          {badge}
        </span>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[#02B9FA]/25 bg-[#02B9FA]/10 text-[#005AAD] flex items-center justify-center mx-auto mb-0.5">
        {icon}
      </div>
      <p className="text-[8px] sm:text-[9px] text-slate-500">{label}</p>
      <p className="text-[10px] sm:text-[11px] font-bold text-[#01226B]">{value}</p>
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:border-[#02B9FA]/30 px-3 py-2.5 transition-colors">
      <span className="text-[#005AAD]">{icon}</span>
      <span className="text-[11px] font-bold text-[#01226B]">{text}</span>
    </div>
  );
}

function OrderSummaryMobile({ items, total }: { items: { product: { _id: string; name: string; salePrice?: number; originalPrice?: number; price: number }; qty: number }[]; total: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 p-4 space-y-2.5 bg-white shadow-sm">
      {items.map(({ product, qty }) => {
        const price = product.salePrice ?? product.originalPrice ?? product.price;
        return (
          <div key={product._id} className="flex justify-between items-center">
            <p className="text-xs text-[#01226B]/80 line-clamp-1 flex-1 ml-3">
              {product.name} <span className="text-[#005AAD] font-bold">×{qty}</span>
            </p>
            <span className="text-xs font-bold text-[#01226B] whitespace-nowrap">
              {fmt(price * qty)} <img src="/money-icon.webp" alt="ر.س" className="inline w-6 h-6 object-contain align-middle" />
            </span>
          </div>
        );
      })}
      <div className="border-t border-dashed border-slate-200 pt-2.5 flex justify-between text-xs">
        <span className="text-slate-500 flex items-center gap-1"><Truck size={11} className="text-[#005AAD]" /> التوصيل</span>
        <span className="font-bold text-[#005AAD]">مجاني ✓</span>
      </div>
      <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
        <span className="text-sm font-bold text-[#01226B]/70">الإجمالي</span>
        <span className="text-xl font-black text-[#01226B]">
          {fmt(total)} <span className="text-xs text-slate-400"><img src="/money-icon.webp" alt="ر.س" className="inline w-7 h-7 object-contain align-middle" /></span>
        </span>
      </div>
    </div>
  );
}

function Field({ label, icon, value, error, placeholder, maxLength, dir, inputMode, onChange, fieldName }: {
  label: string; icon: React.ReactNode; value: string; error?: string;
  placeholder?: string; maxLength?: number; dir?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (v: string) => void; fieldName?: string;
}) {
  return (
    <div data-field={fieldName}>
      <label className="flex items-center gap-1.5 text-xs font-bold text-[#01226B]/80 mb-1.5">
        <span className="text-[#005AAD]">{icon}</span>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        dir={dir}
        inputMode={inputMode}
        className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-[#01226B] border transition-all focus:outline-none placeholder:text-slate-300 ${
          error
            ? "border-red-400/70 bg-red-50/50 focus:border-red-500"
            : "border-slate-200 bg-white focus:border-[#02B9FA] focus:ring-2 focus:ring-[#02B9FA]/20"
        }`}
      />
      {error && <p className="text-red-500 text-[10px] font-bold mt-1">⚠ {error}</p>}
    </div>
  );
}
