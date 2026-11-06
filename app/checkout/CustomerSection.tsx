"use client";

import { useState, useRef, useEffect } from "react";
import PhoneInput, { isValidPhoneNumber, getCountries, getCountryCallingCode } from "react-phone-number-input";
import type { Value as PhoneValue, Country } from "react-phone-number-input";
import ar from "react-phone-number-input/locale/ar.json";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { User, Phone, Mail, CheckCircle2, Pencil, AlertCircle, ArrowLeft } from "lucide-react";

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface CustomerSectionProps {
  data: CustomerData;
  errors: Record<string, string>;
  confirmed: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  onChange: (field: keyof CustomerData, value: string) => void;
  onConfirm: () => void;
  onEdit: () => void;
}

function Field({
  label,
  value,
  error,
  placeholder,
  dir,
  inputMode,
  icon,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  dir?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: React.ReactNode;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
          {icon && <span className="text-slate-400">{icon}</span>}
          {label}
        </label>
        {error && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-md px-2 py-0.5 animate-fadeIn">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          inputMode={inputMode}
          className={`w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl border bg-slate-50/60 transition-all focus:bg-white focus:outline-none placeholder:text-slate-400 ${
            error
              ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
              : "border-slate-200 hover:border-slate-300 focus:border-[#01226B] focus:ring-2 focus:ring-[#01226B]/10"
          }`}
        />
      </div>
    </div>
  );
}

const PRIORITY: Country[] = ["SA", "AE", "KW", "BH", "IQ", "QA", "OM", "YE", "EG"];

function getSortedCountries(): Country[] {
  const all = getCountries();
  const rest = all.filter((c) => !PRIORITY.includes(c));
  return [...PRIORITY.filter((c) => all.includes(c)), ...rest];
}

function CustomCountrySelect({
  value,
  onChange,
}: {
  value: Country;
  onChange: (c: Country) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ?? ("SA" as Country);
  const Flag = flags[selected];
  const sorted = getSortedCountries();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0 flex items-stretch">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 h-full bg-slate-100/70 border-r border-slate-200 hover:bg-slate-200/70 transition-colors"
      >
        {Flag && (
          <span className="w-5 h-3.5 rounded-sm overflow-hidden shrink-0 inline-flex shadow-xs">
            <Flag title={selected} />
          </span>
        )}
        <svg
          className="w-3 h-3 text-slate-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="country-dropdown absolute z-50 top-full mt-1.5 left-0 w-64 bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-y-auto"
          dir="rtl"
        >
          {sorted.map((c, i) => {
            const FlagIcon = flags[c];
            const isPriority = PRIORITY.includes(c);
            const isLastPriority = i === PRIORITY.length - 1;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-right ${
                  c === selected ? "bg-[#01226B]/5 font-bold" : "hover:bg-slate-50"
                } ${isLastPriority ? "border-b border-slate-100" : ""}`}
              >
                {FlagIcon && (
                  <span className="w-5 h-3.5 rounded-sm overflow-hidden shrink-0 inline-flex shadow-xs">
                    <FlagIcon title={c} />
                  </span>
                )}
                <span className="flex-1 text-slate-800 text-xs truncate">
                  {isPriority ? ar[c] ?? c : c}
                </span>
                <span className="text-[11px] text-slate-400 font-mono shrink-0" dir="ltr">
                  +{getCountryCallingCode(c)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CustomerSection({
  data,
  errors,
  confirmed,
  isAuthenticated,
  authLoading,
  onChange,
  onConfirm,
  onEdit,
}: CustomerSectionProps) {
  const [phoneErr, setPhoneErr] = useState("");
  const displayPhoneErr = phoneErr || errors.phone || "";

  // ── Skeleton أثناء تحميل auth state ──────────────────────────────────────
  if (authLoading) {
    return (
      <div className="p-5 sm:p-6 space-y-3 animate-pulse bg-white rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-200" />
          <div className="h-4 w-36 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-full bg-slate-100 rounded-xl" />
        <div className="h-10 w-full bg-slate-100 rounded-xl" />
      </div>
    );
  }

  // ── الحالة المؤكدة (عرض ملخص أنيق) ──────────────────────────────────────────
  if (confirmed) {
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "ضيف";
    return (
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">الخطوة 1</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                  تم التأكيد ✓
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#01226B] mt-1">
                {isAuthenticated ? `حيّاك الله، ${fullName}` : fullName}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5 font-medium">
                <span className="flex items-center gap-1 font-mono" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {data.phone}
                </span>
                {data.email && (
                  <span className="flex items-center gap-1" dir="ltr">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {data.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            type="button"
            className="flex items-center gap-1 text-xs font-bold text-[#01226B] hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            تعديل
          </button>
        </div>
      </div>
    );
  }

  // ── فورم التعديل / الإدخال ────────────────────────────────────────────────
  const missingPhone = isAuthenticated && !data.phone;

  return (
    <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
      {/* Step Header */}
      <div className="flex items-start gap-3.5 pb-2 border-b border-slate-100">
        <div className="w-8 h-8 rounded-full bg-[#01226B] text-white flex items-center justify-center font-black text-sm shrink-0">
          1
        </div>
        <div>
          <h3 className="text-base font-extrabold text-[#01226B]">
            {isAuthenticated
              ? data.firstName
                ? `حيّاك الله، ${data.firstName}`
                : "بيانات العميل"
              : "بيانات العميل والتواصل"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAuthenticated
              ? "يمكنك تعديل بيانات التواصل لهذا الطلب أدناه."
              : "أدخل اسمك ورقم جوالك لتأكيد الشحن وتحديثات التوصيل."}
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {/* للمستخدم المسجل بدون هاتف ناقص */}
        {isAuthenticated && !missingPhone ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field
                label="الاسم الأول"
                value={data.firstName}
                error={errors.firstName}
                placeholder="أدخل اسمك الأول"
                icon={<User className="w-3.5 h-3.5" />}
                onChange={(v) =>
                  onChange("firstName", v.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ""))
                }
              />
              <Field
                label="الاسم الأخير"
                value={data.lastName}
                error={errors.lastName}
                placeholder="أدخل اسم العائلة"
                icon={<User className="w-3.5 h-3.5" />}
                onChange={(v) =>
                  onChange("lastName", v.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ""))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  رقم الجوال
                </label>
                {displayPhoneErr && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-md px-2 py-0.5 animate-fadeIn">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {displayPhoneErr}
                  </span>
                )}
              </div>
              <div
                className={`custom-phone-input rounded-xl overflow-hidden ${
                  displayPhoneErr ? "phone-error" : ""
                }`}
              >
                <PhoneInput
                  defaultCountry="SA"
                  international
                  countryCallingCodeEditable={false}
                  labels={ar}
                  value={data.phone as PhoneValue}
                  onChange={(v) => {
                    const val = v ?? "";
                    onChange("phone", val);
                    if (!val) setPhoneErr("رقم الجوال مطلوب");
                    else if (!isValidPhoneNumber(val)) setPhoneErr("رقم غير صحيح");
                    else setPhoneErr("");
                  }}
                  onBlur={() => {
                    if (!data.phone) setPhoneErr("رقم الجوال مطلوب");
                    else if (!isValidPhoneNumber(data.phone)) setPhoneErr("رقم غير صحيح");
                  }}
                  countrySelectComponent={CustomCountrySelect}
                  numberInputProps={{ placeholder: "5XXXXXXXX", inputMode: "numeric" }}
                />
              </div>
            </div>

            <Field
              label="البريد الإلكتروني (اختياري)"
              value={data.email}
              placeholder="name@example.com"
              dir="ltr"
              inputMode="email"
              icon={<Mail className="w-3.5 h-3.5" />}
              onChange={(v) => onChange("email", v)}
            />
          </>
        ) : isAuthenticated && missingPhone ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                رقم الجوال
              </label>
              {displayPhoneErr && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-md px-2 py-0.5 animate-fadeIn">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {displayPhoneErr}
                </span>
              )}
            </div>
            <div
              className={`custom-phone-input rounded-xl overflow-hidden ${
                displayPhoneErr ? "phone-error" : ""
              }`}
            >
              <PhoneInput
                defaultCountry="SA"
                international
                countryCallingCodeEditable={false}
                labels={ar}
                value={data.phone as PhoneValue}
                onChange={(v) => {
                  const val = v ?? "";
                  onChange("phone", val);
                  if (!val) setPhoneErr("رقم الجوال مطلوب");
                  else if (!isValidPhoneNumber(val)) setPhoneErr("رقم غير صحيح");
                  else setPhoneErr("");
                }}
                onBlur={() => {
                  if (!data.phone) setPhoneErr("رقم الجوال مطلوب");
                  else if (!isValidPhoneNumber(data.phone)) setPhoneErr("رقم غير صحيح");
                }}
                countrySelectComponent={CustomCountrySelect}
                numberInputProps={{ placeholder: "5XXXXXXXX", inputMode: "numeric" }}
              />
            </div>
          </div>
        ) : (
          /* ضيف — كل الحقول */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field
                label="الاسم الأول"
                value={data.firstName}
                error={errors.firstName}
                placeholder="أدخل اسمك الأول"
                icon={<User className="w-3.5 h-3.5" />}
                onChange={(v) =>
                  onChange("firstName", v.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ""))
                }
              />
              <Field
                label="الاسم الأخير"
                value={data.lastName}
                error={errors.lastName}
                placeholder="أدخل اسم العائلة"
                icon={<User className="w-3.5 h-3.5" />}
                onChange={(v) =>
                  onChange("lastName", v.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ""))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  رقم الجوال (واتساب)
                </label>
                {displayPhoneErr && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-md px-2 py-0.5 animate-fadeIn">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {displayPhoneErr}
                  </span>
                )}
              </div>
              <div
                className={`custom-phone-input rounded-xl overflow-hidden ${
                  displayPhoneErr ? "phone-error" : ""
                }`}
              >
                <PhoneInput
                  defaultCountry="SA"
                  international
                  countryCallingCodeEditable={false}
                  labels={ar}
                  value={data.phone as PhoneValue}
                  onChange={(v) => {
                    const val = v ?? "";
                    onChange("phone", val);
                    if (!val) setPhoneErr("رقم الجوال مطلوب");
                    else if (!isValidPhoneNumber(val)) setPhoneErr("رقم غير صحيح");
                    else setPhoneErr("");
                  }}
                  onBlur={() => {
                    if (!data.phone) setPhoneErr("رقم الجوال مطلوب");
                    else if (!isValidPhoneNumber(data.phone)) setPhoneErr("رقم غير صحيح");
                  }}
                  countrySelectComponent={CustomCountrySelect}
                  numberInputProps={{ placeholder: "5XXXXXXXX", inputMode: "numeric" }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                سيصلك رمز التحقق وتحديثات حالة الشحنة على هذا الرقم.
              </p>
            </div>

            <Field
              label="البريد الإلكتروني (اختياري)"
              value={data.email}
              placeholder="name@example.com"
              dir="ltr"
              inputMode="email"
              icon={<Mail className="w-3.5 h-3.5" />}
              onChange={(v) => onChange("email", v)}
            />
          </>
        )}

        <button
          onClick={onConfirm}
          type="button"
          className="w-full mt-2 py-3.5 rounded-xl text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
          style={{ background: "linear-gradient(135deg, #01226B 0%, #004A94 100%)" }}
        >
          <span>تأكيد بيانات العميل والمتابعة</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function validateCustomer(data: CustomerData): Record<string, string> {
  const e: Record<string, string> = {};
  if (!data.firstName.trim()) e.firstName = "الاسم الأول مطلوب";
  if (!data.lastName.trim()) e.lastName = "الاسم الأخير مطلوب";
  if (!data.phone) e.phone = "رقم الجوال مطلوب";
  else {
    try {
      if (!isValidPhoneNumber(data.phone)) e.phone = "رقم الجوال غير صحيح";
    } catch {
      e.phone = "رقم الجوال غير صحيح";
    }
  }
  return e;
}
