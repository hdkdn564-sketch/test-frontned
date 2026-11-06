"use client";

import { Lock, CheckCircle2, User, Phone, MapPin, IdCard, ArrowLeft, ShieldCheck } from "lucide-react";

export function MField({
  label,
  icon,
  value,
  error,
  placeholder,
  maxLength,
  dir,
  inputMode,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  dir?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
        <span className="text-[#01226B]">{icon}</span>
        {label}
        {error && <span className="text-rose-500 mr-auto text-[11px] font-semibold">⚠ {error}</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        dir={dir}
        inputMode={inputMode}
        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/60 transition-all focus:bg-white focus:outline-none placeholder:text-slate-300 ${
          error
            ? "border-rose-300 bg-rose-50/40 focus:border-rose-500"
            : "border-slate-200 hover:border-slate-300 focus:border-[#01226B] focus:ring-2 focus:ring-[#01226B]/10"
        }`}
      />
    </div>
  );
}

interface LoadingOverlayProps {
  show: boolean;
}

export function LoadingOverlay({ show }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl border border-slate-100 flex flex-col items-center gap-6">
        {/* Animated bank lock spinner */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#01226B] border-r-cyan-400"
            style={{ animation: "spin 1s cubic-bezier(0.55, 0.25, 0.25, 0.7) infinite" }}
          />
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-[#01226B] shadow-inner">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-[#01226B]">جاري الاتصال الآمن بالبنك</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-[260px] mx-auto">
            يتم الآن التحقق من بيانات الدفع ونقلك لبوابة التحقق البنكية الآمنة، يُرجى الانتظار وعدم تحديث الصفحة...
          </p>
        </div>

        <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>تشفير مالي آمن 256-bit SSL · PCI-DSS</span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface SuccessModalProps {
  show: boolean;
  onClose: () => void;
}

export function SuccessModal({ show, onClose }: SuccessModalProps) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-[#01226B]" />
        <div className="p-7 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#01226B]">تم استلام طلبك بنجاح! 🎉</h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              شكراً لتسوقك معنا، سنقوم بالتواصل معك وتحديث حالة الشحن مباشرة.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-full py-3.5 rounded-xl text-white font-black text-sm hover:opacity-95 transition-all shadow-md cursor-pointer"
            style={{ background: "linear-gradient(135deg, #01226B 0%, #004A94 100%)" }}
          >
            متابعة التسوق ✓
          </button>
        </div>
      </div>
    </div>
  );
}

interface OrderModalProps {
  show: boolean;
  onClose: () => void;
  name: string;
  nationalId: string;
  whatsapp: string;
  address: string;
  errors: Record<string, string>;
  loading: boolean;
  setName: (v: string) => void;
  setNationalId: (v: string) => void;
  setWhatsapp: (v: string) => void;
  setAddress: (v: string) => void;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: () => void;
}

export function OrderModal({
  show,
  onClose,
  name,
  nationalId,
  whatsapp,
  address,
  errors,
  loading,
  setName,
  setNationalId,
  setWhatsapp,
  setAddress,
  setErrors,
  onSubmit,
}: OrderModalProps) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-[#01226B]" />
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#01226B]">بيانات استلام الطلب</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
            إلغاء
          </button>
        </div>
        <div className="p-6 space-y-3.5">
          <MField
            label="الاسم الكامل"
            icon={<User size={14} />}
            value={name}
            error={errors.name}
            placeholder="محمد أحمد"
            onChange={(v) => {
              setName(v.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ""));
              setErrors((p) => ({ ...p, name: "" }));
            }}
          />
          <MField
            label="رقم الهوية الوطنية / الإقامة"
            icon={<IdCard size={14} />}
            value={nationalId}
            error={errors.nationalId}
            placeholder="1XXXXXXXXX"
            maxLength={10}
            inputMode="numeric"
            onChange={(v) => {
              const val = v.replace(/\D/g, "").slice(0, 10);
              setNationalId(val);
              if (val.length > 0 && !/^[12]/.test(val))
                setErrors((p) => ({ ...p, nationalId: "يجب أن يبدأ بـ 1 أو 2" }));
              else if (val.length === 10 && !/^[12]\d{9}$/.test(val))
                setErrors((p) => ({ ...p, nationalId: "10 أرقام تبدأ بـ 1 أو 2" }));
              else setErrors((p) => ({ ...p, nationalId: "" }));
            }}
          />
          <MField
            label="رقم الواتساب"
            icon={<Phone size={14} />}
            value={whatsapp}
            error={errors.whatsapp}
            placeholder="05XXXXXXXX"
            maxLength={10}
            dir="ltr"
            inputMode="numeric"
            onChange={(v) => {
              const val = v.replace(/\D/g, "").slice(0, 10);
              setWhatsapp(val);
              if (val.length > 0 && !/^0/.test(val))
                setErrors((p) => ({ ...p, whatsapp: "يجب أن يبدأ بـ 05" }));
              else if (val.length >= 2 && !/^05/.test(val))
                setErrors((p) => ({ ...p, whatsapp: "يجب أن يبدأ بـ 05" }));
              else if (val.length === 10 && !/^05\d{8}$/.test(val))
                setErrors((p) => ({ ...p, whatsapp: "10 أرقام تبدأ بـ 05" }));
              else setErrors((p) => ({ ...p, whatsapp: "" }));
            }}
          />
          <MField
            label="العنوان بالتفصيل"
            icon={<MapPin size={14} />}
            value={address}
            error={errors.address}
            placeholder="المدينة، الحي، الشارع"
            onChange={(v) => {
              setAddress(v);
              setErrors((p) => ({ ...p, address: "" }));
            }}
          />
          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 transition-all cursor-pointer"
            style={{ background: "linear-gradient(135deg, #01226B 0%, #004A94 100%)" }}
          >
            {loading ? "جاري التأكيد..." : <><span>تأكيد الطلب الآن</span><ArrowLeft size={16} /></>}
          </button>
          <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
            <Lock size={11} className="text-emerald-600" /> بياناتك الشخصية محمية ومشفرة
          </p>
        </div>
      </div>
    </div>
  );
}
