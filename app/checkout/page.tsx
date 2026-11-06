"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  Tag,
  ShoppingBag,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import AddressSection, { SelectedAddress, ShippingOption } from "../components/address/AddressSection";
import { useCartStore } from "../store/cartStore";
import { useCompanyStore } from "../store/companyStore";
import type { CustomerInfo } from "../store/cartStore";
import { useRateLimit } from "./useRateLimit";
import { LoadingOverlay, SuccessModal, OrderModal } from "./CheckoutModals";
import CheckoutPayment from "./CheckoutPayment";
import CustomerSection, { validateCustomer } from "./CustomerSection";
import type { CustomerData } from "./CustomerSection";
import { useAuthStore } from "../store/authStore";
import { pushBeginCheckout, pushPurchase } from "../lib/gtmEvents";

const fmt = (n: number) => n.toLocaleString("en-US");
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const resolveImg = (src: string) => (src?.startsWith("http") ? src : `${API}${src}`);

export default function CheckoutPage() {
  const router = useRouter();
  const { items: allItems, setCustomer, clear } = useCartStore();

  // لو جاي من البوب أب "إتمام الطلب"، نعمل order للمنتج ده بس
  const [singleProductId, setSingleProductId] = useState<string | null>(null);
  useEffect(() => {
    const id = sessionStorage.getItem("checkout_single_product_id");
    if (id) {
      setSingleProductId(id);
      sessionStorage.removeItem("checkout_single_product_id");
    }
  }, []);

  const items = singleProductId
    ? allItems.filter((i) => i.product._id === singleProductId)
    : allItems;

  const totalPrice = () =>
    items.reduce(
      (sum, i) =>
        sum +
        (i.product.salePrice ??
          i.product.originalPrice ??
          (i.product as { price?: number }).price ??
          0) *
          i.qty,
      0
    );

  const { fetchCompany } = useCompanyStore();
  const [mounted, setMounted] = useState(false);
  const { blocked, fmtTime, recordAttempt } = useRateLimit();

  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingConfirmed, setShippingConfirmed] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<"mada" | "mastercard" | "applepay" | null>(
    null
  );
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumberError, setCardNumberError] = useState("");
  const [cardExpiryError, setCardExpiryError] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomerData] = useState<CustomerData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerConfirmed, setCustomerConfirmed] = useState(false);

  const { user, loading: authLoading, initialized } = useAuthStore();
  const isAuthenticated = !!user;
  const authFilledRef = useRef(false);

  // ملء بيانات المستخدم من الحساب مرة واحدة فقط بعد تهيئة auth
  useEffect(() => {
    if (!initialized || authFilledRef.current) return;
    authFilledRef.current = true;
    if (user) {
      setCustomerData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      // تأكيد تلقائي إذا كانت البيانات كاملة
      if (user.firstName && user.lastName && user.phone) {
        setCustomerConfirmed(true);
      }
    } else {
      // ضيف: استعادة من localStorage
      const saved = localStorage.getItem("checkout_customer");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCustomerData({
            firstName: parsed.firstName || "",
            lastName: parsed.lastName || "",
            email: parsed.email || "",
            phone: parsed.phone || "",
          });
          setAddress(parsed.address || "");
          setCustomerConfirmed(parsed.confirmed || false);
        } catch {
          /* silent */
        }
      }
    }
    const savedShipping = localStorage.getItem("checkout_shipping");
    if (savedShipping) {
      try {
        setSelectedShipping(JSON.parse(savedShipping));
        setShippingConfirmed(true);
      } catch {
        /* silent */
      }
    }
  }, [initialized, user]);

  useEffect(() => {
    setMounted(true);
    fetchCompany();
  }, [fetchCompany]);

  const total = mounted ? totalPrice() : 0;
  const finalTotal = Math.max(0, total - discount);

  // InitiateCheckout — مرة واحدة بعد التحميل
  useEffect(() => {
    if (!mounted || items.length === 0) return;

    pushBeginCheckout({
      currency: "SAR",
      value: Math.max(0, totalPrice() - discount),
      items: items.map((i) => ({
        item_id: String(i.product._id),
        item_name: i.product.name,
        price: i.product.salePrice ?? i.product.originalPrice ?? i.product.price,
        quantity: i.qty,
        item_brand: i.product.brand,
        item_category: i.product.category,
      })),
    });
  }, [mounted, discount, items]);

  if (!mounted) return null;
  if (items.length === 0) {
    router.replace("/cart");
    return null;
  }

  const fullName = `${customer.firstName} ${customer.lastName}`.trim();

  const confirmCustomer = () => {
    const e = validateCustomer(customer);
    setErrors(e);
    if (!Object.keys(e).length) {
      setCustomerConfirmed(true);
      localStorage.setItem(
        "checkout_customer",
        JSON.stringify({ ...customer, address, confirmed: true })
      );
    }
  };

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "SAHLNAHA10") {
      const d = Math.round(total * 0.1);
      setDiscount(d);
      setCouponMsg(`✓ تم تطبيق الخصم 10% — وفّرت ${fmt(d)} ر.س`);
    } else if (!coupon.trim()) {
      setDiscount(0);
      setCouponMsg("يرجى إدخال كود الخصم");
    } else {
      setDiscount(0);
      setCouponMsg("كود الخصم المدخل غير صالح");
    }
  };

  const handleOrder = async () => {
    if (blocked) return;
    const e = validateCustomer(customer);
    if (!address.trim()) e.address = "مطلوب";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "cash_on_delivery",
          items: items.map((i) => ({
            productId: i.product._id,
            name: i.product.name,
            price: i.product.salePrice ?? i.product.originalPrice,
            quantity: i.qty,
            image: i.product.images?.[0] || (i.product as { image?: string }).image || null,
          })),
          total: finalTotal,
          customer: fullName,
          whatsapp: customer.phone,
          address,
        }),
      });
      await res.json();
      if (res.status === 429) {
        recordAttempt();
        return;
      }
      recordAttempt();
    } catch {
      /* silent */
    }
    setLoading(false);
    setCustomer({
      name: fullName,
      nationalId: "",
      whatsapp: customer.phone,
      address,
      installmentType: "full",
      months: 0,
      downPayment: 0,
    } as CustomerInfo);
    pushPurchase({
      transaction_id: `cod_${Date.now()}`,
      currency: "SAR",
      value: finalTotal,
      items: items.map((i) => ({
        item_id: String(i.product._id),
        item_name: i.product.name,
        price: i.product.salePrice ?? i.product.originalPrice ?? i.product.price,
        quantity: i.qty,
        item_brand: i.product.brand,
        item_category: i.product.category,
      })),
    });
    clear();
    setShowModal(false);
    setShowSuccess(true);
  };

  const handleCardSubmit = async () => {
    if (blocked) return;
    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length < 16) {
      setCardNumberError("رقم البطاقة يجب أن يكون 16 رقماً");
      return;
    }
    if (cardCvv.length < 3) return;
    if (!cardExpiry || cardExpiry.length < 5 || !cardHolder.trim()) return;
    if (!customer.firstName.trim() || !customer.phone) {
      setErrors({
        firstName: !customer.firstName.trim() ? "مطلوب" : "",
        phone: !customer.phone ? "مطلوب" : "",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: cardNumber.replace(/\s/g, ""),
          expiry: cardExpiry,
          cvv: cardCvv,
          cardHolder,
          items: items.map((i) => ({
            productId: i.product._id,
            name: i.product.name,
            price: i.product.salePrice ?? i.product.originalPrice,
            quantity: i.qty,
            image: i.product.images?.[0] || (i.product as { image?: string }).image || null,
          })),
          total: finalTotal,
          customer: fullName,
          whatsapp: customer.phone,
          nationalId: "",
          address,
          installmentType: "full",
          months: 0,
          downPayment: 0,
          customerEmail: customer.email || "",
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        recordAttempt();
        setErrors({ firstName: "لقد تجاوزت الحد المسموح به من الطلبات" });
        return;
      }
      recordAttempt();
      sessionStorage.setItem(
        "verify_data",
        JSON.stringify({
          orderId: data.orderId,
          _id: data._id,
          amount: finalTotal,
          last4: cardNumber.replace(/\s/g, "").slice(-4),
          date: new Date().toISOString(),
          phone: customer.phone,
          customerName: fullName,
          items: items.map((i) => ({
            productId: i.product._id,
            name: i.product.name,
            price: i.product.salePrice ?? i.product.originalPrice,
            quantity: i.qty,
          })),
          orderSnapshot: data.orderSnapshot || null,
        })
      );
      await new Promise((r) => setTimeout(r, 2600));
      router.push("/checkout/verify");
    } catch {
      setErrors({ firstName: "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 text-slate-900" dir="rtl">
      <LoadingOverlay show={loading} />
      <SuccessModal
        show={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          clear();
          router.replace("/");
        }}
      />
      <OrderModal
        show={showModal}
        onClose={() => setShowModal(false)}
        name={fullName}
        nationalId=""
        whatsapp={customer.phone}
        address={address}
        errors={errors}
        loading={loading}
        setName={(v) => setCustomerData((p) => ({ ...p, firstName: v }))}
        setNationalId={() => {}}
        setWhatsapp={(v) => setCustomerData((p) => ({ ...p, phone: v }))}
        setAddress={setAddress}
        setErrors={setErrors}
        onSubmit={handleOrder}
      />

      {/* DEDICATED AUTHENTIC CHECKOUT TOP BAR */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Store Branding */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-xl overflow-hidden border border-slate-100 p-1 bg-white shadow-xs group-hover:scale-105 transition-transform">
              <Image src="/logo.webp" alt="logo" fill className="object-contain" priority />
            </div>
            <div>
              <p className="text-sm sm:text-base font-extrabold text-[#01226B] leading-tight">
                شريحة الأعمال
              </p>
              <p className="text-[11px] text-slate-400 font-medium">إتمام الشراء الآمن</p>
            </div>
          </Link>

          {/* Center Stepper Indicator (Hidden on extra small screens) */}
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5 text-[#01226B]">
              <span className="w-5 h-5 rounded-full bg-[#01226B] text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>البيانات</span>
            </div>
            <span className="w-6 h-[1px] bg-slate-200" />
            <div
              className={`flex items-center gap-1.5 ${
                customerConfirmed ? "text-[#01226B]" : "text-slate-400"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  customerConfirmed ? "bg-[#01226B] text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                2
              </span>
              <span>الشحن</span>
            </div>
            <span className="w-6 h-[1px] bg-slate-200" />
            <div
              className={`flex items-center gap-1.5 ${
                shippingConfirmed ? "text-[#01226B]" : "text-slate-400"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  shippingConfirmed ? "bg-[#01226B] text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                3
              </span>
              <span>الدفع</span>
            </div>
          </div>

          {/* Return link & Trust lock */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              دفع آمن ومشفّر 100%
            </span>
            <Link
              href="/cart"
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#01226B] transition-colors py-1 px-2 rounded-lg hover:bg-slate-100"
            >
              <span>العودة للسلة</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CHECKOUT BODY */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* RIGHT COLUMN: 3 CHECKOUT STEPS (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* STEP 1: CUSTOMER INFORMATION */}
            <CustomerSection
              data={customer}
              errors={errors}
              confirmed={customerConfirmed}
              isAuthenticated={isAuthenticated}
              authLoading={!initialized && authLoading && !user}
              onChange={(field, value) => {
                setCustomerData((p) => ({ ...p, [field]: value }));
                setErrors((p) => ({ ...p, [field]: "" }));
              }}
              onConfirm={confirmCustomer}
              onEdit={() => setCustomerConfirmed(false)}
            />

            {/* STEP 2: ADDRESS & SHIPPING */}
            <div
              className={`p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4 transition-all ${
                !customerConfirmed ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                      customerConfirmed
                        ? shippingConfirmed
                          ? "bg-emerald-600 text-white"
                          : "bg-[#01226B] text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {shippingConfirmed ? <CheckCircle2 className="w-5 h-5" /> : "2"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        الخطوة 2
                      </span>
                      {shippingConfirmed && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          تم التحديد ✓
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-[#01226B] mt-1">
                      عنوان التوصيل وشركة الشحن
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      حدد موقعك بدقة على الخريطة أو أدخل العنوان يدوياً، مع اختيار شركة الشحن السريع.
                    </p>
                  </div>
                </div>
              </div>

              <AddressSection
                locked={!customerConfirmed}
                onChange={(addr) => {
                  setSelectedAddress(addr);
                  setAddress(addr.address ?? "");
                }}
                onShippingSelect={(opt) => {
                  setSelectedShipping(opt);
                  setShippingConfirmed(!!opt);
                }}
              />
            </div>

            {/* STEP 3: PAYMENT METHOD */}
            <CheckoutPayment
              shippingConfirmed={shippingConfirmed}
              selectedPayment={selectedPayment}
              setSelectedPayment={(m) => setSelectedPayment(m)}
              cardNumber={cardNumber}
              setCardNumber={setCardNumber}
              cardExpiry={cardExpiry}
              setCardExpiry={setCardExpiry}
              cardCvv={cardCvv}
              setCardCvv={setCardCvv}
              cardHolder={cardHolder}
              setCardHolder={setCardHolder}
              cardNumberError={cardNumberError}
              setCardNumberError={setCardNumberError}
              cardExpiryError={cardExpiryError}
              setCardExpiryError={setCardExpiryError}
              loading={loading}
              blocked={blocked}
              fmtTime={fmtTime}
              amount={finalTotal}
              onCardSubmit={handleCardSubmit}
            />
          </div>

          {/* LEFT COLUMN: ORDER SUMMARY SIDEBAR (5 cols, sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
              {/* Summary Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#01226B]" />
                  <h3 className="text-base font-black text-[#01226B]">ملخص الطلب</h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {items.reduce((s, i) => s + i.qty, 0)} منتج
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {items.map(({ product, qty }) => {
                  const rawImg =
                    product.images?.[0] || (product as { image?: string }).image;
                  const img = rawImg ? resolveImg(rawImg) : null;
                  const itemPrice =
                    (product.salePrice ??
                      product.originalPrice ??
                      (product as { price?: number }).price ??
                      0) * qty;

                  return (
                    <div
                      key={product._id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/70 border border-slate-100"
                    >
                      <div className="relative w-14 h-14 rounded-lg bg-white border border-slate-200/60 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        {img ? (
                          <Image
                            src={img}
                            alt={product.name}
                            fill
                            className="object-contain p-0.5"
                          />
                        ) : (
                          <span className="text-lg">📦</span>
                        )}
                        {qty > 1 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#01226B] text-white text-[9px] font-black flex items-center justify-center">
                            {qty}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[#01226B] truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          الكمية: <span className="font-semibold text-slate-700">{qty}</span>
                        </p>
                      </div>
                      <div className="text-left shrink-0 font-bold text-xs sm:text-sm text-[#01226B]">
                        {fmt(itemPrice)}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">ر.س</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-2">
                {!couponOpen ? (
                  <button
                    type="button"
                    onClick={() => setCouponOpen(true)}
                    className="flex items-center gap-2 text-xs font-bold text-[#01226B] hover:text-blue-700 transition"
                  >
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    <span>هل لديك كود خصم أو كوبون؟</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-500" /> كود الخصم
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponOpen(false);
                          setCouponMsg("");
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-600"
                      >
                        إلغاء
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={coupon}
                        onChange={(e) => {
                          setCoupon(e.target.value);
                          setCouponMsg("");
                        }}
                        placeholder="أدخل رمز الكوبون (مثال: SAHLNAHA10)"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#01226B] bg-slate-50/60 uppercase"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-[#01226B] hover:bg-blue-900 text-white text-xs font-extrabold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        تطبيق
                      </button>
                    </div>
                    {couponMsg && (
                      <p
                        className={`text-xs font-bold mt-1 ${
                          couponMsg.startsWith("✓") ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {couponMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>مجموع المنتجات</span>
                  <span className="font-bold text-slate-800">
                    {fmt(total)} <span className="text-[11px] font-normal text-slate-400">ر.س</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" /> الشحن والتوصيل
                  </span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/40 text-xs">
                    مجاني 100%
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/50">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> الخصم المطبق
                    </span>
                    <span>- {fmt(discount)} ر.س</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ضريبة القيمة المضافة (15%)</span>
                  <span>مشمولة في السعر</span>
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-[#01226B]">المبلغ الإجمالي المستحق</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">شامل التوصيل والضريبة</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-black text-[#01226B] flex items-center justify-end gap-1">
                      {fmt(finalTotal)}
                      <img
                        src="/money-icon.webp"
                        alt="ر.س"
                        className="inline w-6 h-6 object-contain align-middle"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust and Guarantee Box */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">ضمان ذهبي وأصالة 100%</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    جميع الشرائح معتمدة ورسمية ومسجلة في هيئة الاتصالات.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <RotateCcw className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">خدمة عملاء وتفعيل فوري</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    فريق دعم متواجد على مدار الساعة لمساعدتك على واتساب.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
