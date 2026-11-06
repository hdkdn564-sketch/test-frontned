"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Lock, CreditCard, Clock, ShieldCheck, HelpCircle, Check, Sparkles } from "lucide-react";

interface CheckoutPaymentProps {
  shippingConfirmed: boolean;
  selectedPayment: "mada" | "mastercard" | "applepay" | null;
  setSelectedPayment: (v: "mada" | "mastercard" | "applepay" | null) => void;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvv: string;
  setCardCvv: (v: string) => void;
  cardHolder: string;
  setCardHolder: (v: string) => void;
  cardNumberError: string;
  setCardNumberError: (v: string) => void;
  cardExpiryError: string;
  setCardExpiryError: (v: string) => void;
  loading: boolean;
  blocked: boolean;
  fmtTime: string;
  amount?: number;
  onCardSubmit: () => void;
}

// Luhn check helper
function checkLuhn(rawNumber: string): boolean {
  if (rawNumber.length !== 16) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = rawNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(rawNumber[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export default function CheckoutPayment({
  shippingConfirmed,
  selectedPayment,
  setSelectedPayment,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  cardHolder,
  setCardHolder,
  cardNumberError,
  setCardNumberError,
  cardExpiryError,
  setCardExpiryError,
  loading,
  blocked,
  fmtTime,
  amount,
  onCardSubmit,
}: CheckoutPaymentProps) {
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const cardExpiryRef = useRef<HTMLInputElement>(null);
  const cardCvvRef = useRef<HTMLInputElement>(null);
  const [showCvvHint, setShowCvvHint] = useState(false);

  // الافتراضي مدى عند تفعيل مرحلة الدفع
  useEffect(() => {
    if (shippingConfirmed && !selectedPayment) {
      setSelectedPayment("mada");
    }
  }, [shippingConfirmed, selectedPayment, setSelectedPayment]);

  const rawCard = cardNumber.replace(/\s/g, "");

  // Auto-detect brand based on card number or method
  const detectedBrand = useMemo(() => {
    if (rawCard.startsWith("4")) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(rawCard)) return "mastercard";
    if (selectedPayment === "mada") return "mada";
    if (selectedPayment === "mastercard") return "mastercard";
    return "mada";
  }, [rawCard, selectedPayment]);

  // Formatted display number for virtual card
  const displayCardNumber = useMemo(() => {
    const padded = (rawCard + "••••••••••••••••").slice(0, 16);
    return padded.match(/.{1,4}/g)?.join(" ") ?? padded;
  }, [rawCard]);

  // If shipping is not yet confirmed, render elegant locked state
  if (!shippingConfirmed) {
    return (
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs opacity-60">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-black text-sm shrink-0">
            3
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">الخطوة 3</span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                بانتظار العنوان
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-700 mt-1">طريقة الدفع الآمنة</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              أكمل تحديد عنوان الشحن أولاً لتفعيل خيارات الدفع الإلكتروني.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isFormValid =
    rawCard.length === 16 &&
    checkLuhn(rawCard) &&
    cardExpiry.length >= 5 &&
    !cardExpiryError &&
    cardCvv.length >= 3 &&
    cardHolder.trim().length >= 3 &&
    !loading &&
    !blocked;

  return (
    <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
      {/* Step Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#01226B] text-white flex items-center justify-center font-black text-sm shrink-0">
            3
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">الخطوة 3</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> مشفّر 256-bit
              </span>
            </div>
            <h3 className="text-base font-extrabold text-[#01226B] mt-1">طريقة الدفع الآمنة</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              اختر وسيلة الدفع المفضلة لديك، جميع المعاملات تتم بأعلى معايير الأمان المالي.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Selector Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* MADA */}
        <button
          type="button"
          onClick={() => setSelectedPayment("mada")}
          className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
            selectedPayment === "mada"
              ? "border-[#01226B] bg-slate-50/80 shadow-sm"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          {selectedPayment === "mada" && (
            <span className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#01226B] text-white flex items-center justify-center text-[10px]">
              <Check className="w-2.5 h-2.5" />
            </span>
          )}
          <div className="w-14 sm:w-16 h-7 relative shrink-0">
            <Image src="/mada.svg" alt="مدى" fill className="object-contain" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-[#01226B]">مدى mada</span>
        </button>

        {/* VISA / MASTERCARD */}
        <button
          type="button"
          onClick={() => setSelectedPayment("mastercard")}
          className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
            selectedPayment === "mastercard"
              ? "border-[#01226B] bg-slate-50/80 shadow-sm"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          {selectedPayment === "mastercard" && (
            <span className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#01226B] text-white flex items-center justify-center text-[10px]">
              <Check className="w-2.5 h-2.5" />
            </span>
          )}
          <div className="flex items-center gap-1.5 h-7">
            <div className="w-8 sm:w-9 h-6 relative shrink-0">
              <Image src="/visa.webp" alt="Visa" fill className="object-contain" />
            </div>
            <div className="w-8 sm:w-9 h-6 relative shrink-0">
              <Image src="/master.svg" alt="Mastercard" fill className="object-contain" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-800">بطاقة ائتمانية</span>
        </button>

        {/* APPLE PAY */}
        <button
          type="button"
          onClick={() => setSelectedPayment("applepay")}
          className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
            selectedPayment === "applepay"
              ? "border-[#01226B] bg-slate-50/80 shadow-sm"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          {selectedPayment === "applepay" && (
            <span className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#01226B] text-white flex items-center justify-center text-[10px]">
              <Check className="w-2.5 h-2.5" />
            </span>
          )}
          <div className="w-12 sm:w-14 h-7 relative shrink-0">
            <Image src="/Apple-Pay-01.png" alt="Apple Pay" fill className="object-contain" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-800">Apple Pay</span>
        </button>
      </div>

      {/* APPLE PAY NOTICE */}
      {selectedPayment === "applepay" && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0 p-1">
            <Image src="/Apple-Pay-01.png" alt="Apple Pay" width={32} height={20} className="object-contain" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-950">خدمة Apple Pay قيد الصيانة المؤقتة</p>
            <p className="text-amber-800/80 mt-1 leading-relaxed">
              لإتمام طلبك فوراً وبأعلى سرعة وأمان، يرجى اختيار بطاقة <strong>مدى</strong> أو <strong>البطاقة الائتمانية</strong> أعلاه.
            </p>
            <button
              type="button"
              onClick={() => setSelectedPayment("mada")}
              className="mt-2.5 text-xs font-bold text-[#01226B] underline underline-offset-4 hover:text-blue-700"
            >
              التبديل إلى بطاقة مدى ومتابعة الدفع ←
            </button>
          </div>
        </div>
      )}

      {/* CARD PAYMENT FORM & REALISTIC CARD PREVIEW */}
      {selectedPayment && selectedPayment !== "applepay" && (
        <div className="space-y-6 pt-1">
          {/* Virtual Card Preview */}
          <div className="relative w-full max-w-sm mx-auto h-48 rounded-2xl p-5 text-white shadow-xl overflow-hidden transition-all duration-300 select-none bg-gradient-to-tr from-[#011c58] via-[#01226B] to-[#043d9c] border border-white/20">
            {/* Background texture & overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

            <div className="relative h-full flex flex-col justify-between">
              {/* Top Row: Chip & Contactless */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* EMV Chip */}
                  <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-400/60 shadow-inner flex items-center justify-center p-0.5">
                    <div className="w-full h-full border border-amber-700/20 rounded-[3px] grid grid-cols-2 gap-0.5 opacity-70">
                      <div className="border-r border-b border-amber-800/20" />
                      <div className="border-b border-amber-800/20" />
                      <div className="border-r border-amber-800/20" />
                      <div />
                    </div>
                  </div>
                  {/* Contactless waves */}
                  <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                    <path d="M12 19a8.5 8.5 0 0 1 0-14" />
                    <path d="M15.5 21.5a12 12 0 0 1 0-19" />
                  </svg>
                </div>

                {/* Brand Logo in Virtual Card */}
                <div className="h-6 w-16 relative flex items-center justify-end">
                  {detectedBrand === "mada" ? (
                    <Image src="/mada.svg" alt="mada" fill className="object-contain brightness-0 invert" />
                  ) : detectedBrand === "visa" ? (
                    <Image src="/visa.webp" alt="visa" fill className="object-contain brightness-0 invert" />
                  ) : (
                    <Image src="/master.svg" alt="mastercard" fill className="object-contain" />
                  )}
                </div>
              </div>

              {/* Middle Row: Card Number */}
              <div className="py-1">
                <p className="font-mono text-lg sm:text-xl font-bold tracking-widest text-white/95" dir="ltr">
                  {displayCardNumber}
                </p>
              </div>

              {/* Bottom Row: Holder & Expiry */}
              <div className="flex items-end justify-between text-xs">
                <div className="max-w-[70%]">
                  <p className="text-[9px] uppercase tracking-wider text-white/60 font-medium">اسم حامل البطاقة</p>
                  <p className="font-mono font-bold text-white tracking-wider truncate uppercase text-xs mt-0.5" dir="ltr">
                    {cardHolder || "CARDHOLDER NAME"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-white/60 font-medium">صالحة حتى</p>
                  <p className="font-mono font-bold text-white tracking-wider text-xs mt-0.5" dir="ltr">
                    {cardExpiry || "MM/YY"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Form Inputs */}
          <div className="space-y-4">
            {/* Card Number Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  رقم البطاقة
                  <span className="text-rose-500">*</span>
                </label>
                {cardNumberError && (
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-md px-2 py-0.5">
                    {cardNumberError}
                  </span>
                )}
              </div>
              <div
                className={`relative flex items-center border rounded-xl bg-slate-50/60 transition-all focus-within:bg-white focus-within:border-[#01226B] focus-within:ring-2 focus-within:ring-[#01226B]/10 ${
                  cardNumberError ? "border-rose-300 bg-rose-50/40" : "border-slate-200 hover:border-slate-300"
                }`}
                dir="ltr"
              >
                <div className="pl-3.5 flex items-center shrink-0 pointer-events-none">
                  {detectedBrand === "mada" ? (
                    <div className="w-8 h-5 relative">
                      <Image src="/mada.svg" alt="mada" fill className="object-contain" />
                    </div>
                  ) : detectedBrand === "visa" ? (
                    <div className="w-8 h-5 relative">
                      <Image src="/visa.webp" alt="visa" fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-8 h-5 relative">
                      <Image src="/master.svg" alt="mastercard" fill className="object-contain" />
                    </div>
                  )}
                </div>
                <input
                  ref={cardNumberRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
                    v = v.match(/.{1,4}/g)?.join(" ") ?? v;
                    setCardNumber(v);
                    const raw = v.replace(/\s/g, "");
                    if (raw.length === 16) {
                      const valid = checkLuhn(raw);
                      setCardNumberError(valid ? "" : "رقم البطاقة غير صحيح");
                      if (valid) {
                        cardExpiryRef.current?.focus();
                      }
                    } else {
                      setCardNumberError("");
                    }
                  }}
                  className="w-full px-3 py-3 text-sm sm:text-base font-mono font-semibold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300 tracking-wider"
                />
                <div className="pr-3.5 flex items-center text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Expiry & CVV Row */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Expiry Date */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-700">
                    تاريخ الانتهاء <span className="text-rose-500">*</span>
                  </label>
                  {cardExpiryError && (
                    <span className="text-[10px] font-semibold text-rose-600 truncate max-w-[100px]">
                      {cardExpiryError}
                    </span>
                  )}
                </div>
                <div
                  className={`border rounded-xl bg-slate-50/60 transition-all focus-within:bg-white focus-within:border-[#01226B] focus-within:ring-2 focus-within:ring-[#01226B]/10 ${
                    cardExpiryError ? "border-rose-300 bg-rose-50/40" : "border-slate-200 hover:border-slate-300"
                  }`}
                  dir="ltr"
                >
                  <input
                    ref={cardExpiryRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="MM / YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                      const f = d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
                      setCardExpiry(f);
                      if (d.length === 4) {
                        const mm = Number(d.slice(0, 2));
                        const yy = Number(d.slice(2));
                        const now = new Date();
                        const currentYear = now.getFullYear() % 100;
                        const currentMonth = now.getMonth() + 1;
                        if (mm < 1 || mm > 12) {
                          setCardExpiryError("الشهر بين 01 و 12");
                        } else if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
                          setCardExpiryError("البطاقة منتهية");
                        } else {
                          setCardExpiryError("");
                          cardCvvRef.current?.focus();
                        }
                      } else {
                        setCardExpiryError("");
                      }
                    }}
                    className="w-full px-3 py-3 text-sm sm:text-base font-mono font-semibold text-center text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300 tracking-wider"
                  />
                </div>
              </div>

              {/* CVV */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1">
                    رمز الأمان (CVV) <span className="text-rose-500">*</span>
                    <button
                      type="button"
                      onClick={() => setShowCvvHint((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 transition"
                      title="ما هو رمز الأمان؟"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </label>
                  {showCvvHint && (
                    <span className="text-[10px] text-blue-600 font-medium">3 أرقام خلف البطاقة</span>
                  )}
                </div>
                <div
                  className="border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50/60 transition-all focus-within:bg-white focus-within:border-[#01226B] focus-within:ring-2 focus-within:ring-[#01226B]/10"
                  dir="ltr"
                >
                  <input
                    ref={cardCvvRef}
                    type="password"
                    inputMode="numeric"
                    placeholder="123"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    className="w-full px-3 py-3 text-sm sm:text-base font-mono font-semibold text-center text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300 tracking-widest"
                  />
                </div>
              </div>
            </div>

            {/* Card Holder Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700">
                اسم حامل البطاقة (كما هو مدوّن بالإنجليزية) <span className="text-rose-500">*</span>
              </label>
              <div
                className="border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50/60 transition-all focus-within:bg-white focus-within:border-[#01226B] focus-within:ring-2 focus-within:ring-[#01226B]/10"
                dir="ltr"
              >
                <input
                  type="text"
                  placeholder="MOHAMMED AL-AHMED"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.replace(/[^a-zA-Z\s]/g, "").toUpperCase())}
                  className="w-full px-3.5 py-3 text-sm sm:text-base font-mono font-semibold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300 tracking-wider uppercase"
                />
              </div>
            </div>
          </div>

          {/* Rate Limit Blocked Notice */}
          {blocked && (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
              <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-900">تم تجاوز الحد الأقصى للمحاولات</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  يمكنك إجراء محاولة جديدة بعد مرور <span className="font-mono font-black">{fmtTime}</span>
                </p>
              </div>
            </div>
          )}

          {/* Pay CTA Button */}
          <button
            type="button"
            onClick={onCardSubmit}
            disabled={!isFormValid}
            className="w-full py-4 rounded-xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{
              background: blocked
                ? "#94a3b8"
                : "linear-gradient(135deg, #01226B 0%, #004A94 100%)",
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الاتصال الآمن بالبنك...
              </span>
            ) : blocked ? (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> انتظر {fmtTime} للمتابعة
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                تأكيد وإتمام الدفع بأمان
                {amount ? ` • ${amount.toLocaleString("en-US")} ر.س` : ""}
              </span>
            )}
          </button>

          {/* Security & Regulatory Guarantees */}
          <div className="pt-2 flex flex-col items-center gap-2 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-3 text-slate-400 text-xs">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> تشفير آمن 256-bit SSL
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3 text-slate-500" /> معتمد PCI DSS
              </span>
              <span>•</span>
              <span className="text-[11px] font-medium text-slate-500">
                مطابق لمعايير البنك المركزي السعودي
              </span>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1 opacity-70 grayscale hover:grayscale-0 transition-all">
              <div className="w-8 h-4 relative">
                <Image src="/mada.svg" alt="mada" fill className="object-contain" />
              </div>
              <div className="w-8 h-4 relative">
                <Image src="/visa.webp" alt="visa" fill className="object-contain" />
              </div>
              <div className="w-8 h-4 relative">
                <Image src="/master.svg" alt="mastercard" fill className="object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
