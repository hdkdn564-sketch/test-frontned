import Image from "next/image";
import { FaWhatsapp, FaMobileAlt, FaEnvelope } from "react-icons/fa";
import { getCompany } from "../lib/getCompany";

export default async function Footer() {
  const c = await getCompany();

  return (
    <footer dir="rtl" className="mt-16 border-t border-gray-200" style={{ background: "#F3F4F6" }}>

      <div className="max-w-6xl mx-auto px-5 pt-12 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Image src="/logo.webp" alt="logo" width={72} height={72} className="object-contain" />
            <p className="text-sm leading-7 text-gray-600 whitespace-pre-line">
              {c.details || "شريحة الأعمال - شرائح اتصال وإنترنت بأسعار منافسة، مع خدمة سريعة وآمنة ودعم عملاء مميز. ثقتكم غايتنا وخدمتكم أولويتنا"}
            </p>

            {/* السجل التجاري */}
            {c.crLink ? (
              <a href={c.crLink} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 mt-1 hover:opacity-85 transition-opacity">
                <Image
                  src={c.crImage || "/commerce.webp"}
                  alt={c.crName || "السجل التجاري"}
                  width={52}
                  height={52}
                  className="object-contain shrink-0"
                  unoptimized={Boolean(c.crImage && c.crImage.startsWith("http"))}
                />
                <div className="flex flex-col">
                  {c.crName ? <span className="text-xs font-semibold text-gray-700">{c.crName}</span> : null}
                  {c.crNumber ? <span dir="ltr" className="text-xs text-gray-500 tabular-nums">{c.crNumber}</span> : null}
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-2.5 mt-1">
                <Image
                  src={c.crImage || "/commerce.webp"}
                  alt={c.crName || "السجل التجاري"}
                  width={52}
                  height={52}
                  className="object-contain shrink-0"
                  unoptimized={Boolean(c.crImage && c.crImage.startsWith("http"))}
                />
                <div className="flex flex-col">
                  {c.crName ? <span className="text-xs font-semibold text-gray-700">{c.crName}</span> : null}
                  {c.crNumber ? <span dir="ltr" className="text-xs text-gray-500 tabular-nums">{c.crNumber}</span> : null}
                </div>
              </div>
            )}

            {/* شهادة التوثيق / مركز الأعمال */}
            <div className="flex items-center gap-2.5">
              {c.bcLink ? (
                <a
                  href={c.bcLink}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 hover:opacity-85 transition-opacity"
                >
                  <Image
                    src={c.bcImage || "/work.webp"}
                    alt={c.bcTitle || "شهادة التوثيق"}
                    width={52}
                    height={52}
                    className="object-contain"
                    unoptimized={Boolean(c.bcImage && c.bcImage.startsWith("http"))}
                  />
                </a>
              ) : (
                <div className="shrink-0">
                  <Image
                    src={c.bcImage || "/work.webp"}
                    alt={c.bcTitle || "شهادة التوثيق"}
                    width={52}
                    height={52}
                    className="object-contain"
                    unoptimized={Boolean(c.bcImage && c.bcImage.startsWith("http"))}
                  />
                </div>
              )}
              <div className="flex flex-col">
                {c.bcTitle ? <span className="text-xs font-semibold text-gray-700">{c.bcTitle}</span> : null}
                {c.bcSubtitle ? <span className="text-xs text-gray-500">{c.bcSubtitle}</span> : null}
                {c.bcNumber ? <span dir="ltr" className="text-xs text-gray-500 tabular-nums">{c.bcNumber}</span> : null}
              </div>
            </div>
          </div>

          {/* Contact details */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#01226B]">تواصل معنا</h3>

            <ul className="flex flex-col gap-3">

              {c.whatsapp && (
                <li>
                  <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#005AAD] transition-colors">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 shrink-0">
                      <FaWhatsapp size={14} className="text-[#01226B]" />
                    </span>
                    <span dir="ltr">{c.whatsapp}</span>
                  </a>
                </li>
              )}
              {c.phone && (
                <li>
                  <a href={`tel:${c.phone}`}
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#005AAD] transition-colors">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 shrink-0">
                      <FaMobileAlt size={14} className="text-[#01226B]" />
                    </span>
                    <span dir="ltr">{c.phone}</span>
                  </a>
                </li>
              )}
              {c.email && (
                <li>
                  <a href={`mailto:${c.email}`}
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#005AAD] transition-colors">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 shrink-0">
                      <FaEnvelope size={14} className="text-[#01226B]" />
                    </span>
                    <span dir="ltr">{c.email}</span>
                  </a>
                </li>
              )}
            </ul>

            {/* شعار ضريبة القيمة المضافة / ملف PDF */}
            {c.vatPdf ? (
              <a
                href={c.vatPdf}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 w-fit hover:opacity-85 transition-opacity"
                title={c.vatTitle || "شهادة ضريبة القيمة المضافة"}
              >
                <Image
                  src={c.vatImage || "/شعار ضريبة القيمة المضافة بدقة عالية svg - png (1).png"}
                  alt={c.vatTitle || "شهادة ضريبة القيمة المضافة"}
                  width={65}
                  height={65}
                  className="object-contain"
                  unoptimized={Boolean(c.vatImage && c.vatImage.startsWith("http"))}
                />
              </a>
            ) : (
              <div
                className="inline-block mt-2 w-fit"
                title={c.vatTitle || "شهادة ضريبة القيمة المضافة"}
              >
                <Image
                  src={c.vatImage || "/شعار ضريبة القيمة المضافة بدقة عالية svg - png (1).png"}
                  alt={c.vatTitle || "شهادة ضريبة القيمة المضافة"}
                  width={65}
                  height={65}
                  className="object-contain"
                  unoptimized={Boolean(c.vatImage && c.vatImage.startsWith("http"))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-200 mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">
              صنع بإتقان على <span className="font-semibold text-gray-500">| 2026 منصة سلة</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/mada.svg" alt="mada" width={36} height={24} className="object-contain" style={{ height: "24px", width: "36px" }} />
            <Image src="/visa.webp" alt="visa" width={36} height={24} className="object-contain" style={{ height: "24px", width: "36px" }} />
            <Image src="/Apple-Pay-01.png" alt="apple pay" width={56} height={36} className="object-contain" style={{ height: "36px", width: "auto" }} />
            <Image src="/work.webp" alt="salla" width={36} height={24} className="object-contain" style={{ height: "24px", width: "auto" }} />
            <Image src="/commerce.webp" alt="salla" width={36} height={24} className="object-contain" style={{ height: "24px", width: "auto" }} />
          </div>
        </div>
      </div>
    </footer>
  );
}

