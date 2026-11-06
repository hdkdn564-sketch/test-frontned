"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Building,
  FileCheck2,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { DocumentSettings, defaultDocumentSettings } from "./types";

export default function AdminFilesPage() {
  const [data, setData] = useState<DocumentSettings>(defaultDocumentSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const crFileInputRef = useRef<HTMLInputElement>(null);
  const bcFileInputRef = useRef<HTMLInputElement>(null);
  const vatImgInputRef = useRef<HTMLInputElement>(null);
  const vatPdfInputRef = useRef<HTMLInputElement>(null);

  // Fetch current company data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch("/api/admin/company", { credentials: "include" });
        if (!res.ok) throw new Error("فشل جلب البيانات");
        const json = await res.json();
        if (isMounted && json) {
          setData({
            crName: typeof json.crName === "string" ? json.crName : (json.crName ?? defaultDocumentSettings.crName),
            crNumber: typeof json.crNumber === "string" ? json.crNumber : (typeof json.number1 === "string" ? json.number1 : defaultDocumentSettings.crNumber),
            crImage: json.crImage || defaultDocumentSettings.crImage,
            crLink: typeof json.crLink === "string" ? json.crLink : (json.crLink ?? defaultDocumentSettings.crLink),

            bcTitle: typeof json.bcTitle === "string" ? json.bcTitle : (json.bcTitle ?? defaultDocumentSettings.bcTitle),
            bcSubtitle: typeof json.bcSubtitle === "string" ? json.bcSubtitle : (json.bcSubtitle ?? defaultDocumentSettings.bcSubtitle),
            bcNumber: typeof json.bcNumber === "string" ? json.bcNumber : (typeof json.number2 === "string" ? json.number2 : defaultDocumentSettings.bcNumber),
            bcImage: json.bcImage || defaultDocumentSettings.bcImage,
            bcLink: typeof json.bcLink === "string" ? json.bcLink : (json.bcLink ?? defaultDocumentSettings.bcLink),

            vatTitle: typeof json.vatTitle === "string" ? json.vatTitle : (json.vatTitle ?? defaultDocumentSettings.vatTitle),
            vatImage: json.vatImage || defaultDocumentSettings.vatImage,
            vatPdf: typeof json.vatPdf === "string" ? json.vatPdf : (json.vatPdf ?? defaultDocumentSettings.vatPdf),
          });
        }
      } catch (err) {
        console.error("Error loading files data:", err);
        toast.error("فشل تحميل بيانات الملفات الحالية");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field: keyof DocumentSettings, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Upload Image Handler
  const handleImageUpload = async (key: "crImage" | "bcImage" | "vatImage", file: File) => {
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!validMimes.includes(file.type)) {
      toast.error("يرجى اختيار صورة صالحة (PNG, JPG, WebP, SVG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
      return;
    }

    setUploadingField(key);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`/api/admin/company/footer-image/${key}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "فشل رفع الصورة");
      }
      setData((prev) => ({ ...prev, [key]: result.url }));
      toast.success("تم رفع الصورة وتحديثها بنجاح!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل رفع الصورة";
      toast.error(msg);
    } finally {
      setUploadingField(null);
    }
  };

  // Upload PDF Handler
  const handlePdfUpload = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("يُسمح فقط بملفات بصيغة PDF");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("حجم ملف PDF يجب ألا يتجاوز 20 ميجابايت");
      return;
    }

    setUploadingField("vatPdf");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/admin/company/footer-file/vatPdf`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "فشل رفع ملف PDF");
      }
      setData((prev) => ({ ...prev, vatPdf: result.url }));
      toast.success("تم رفع ملف الـ PDF بنجاح!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل رفع ملف الـ PDF";
      toast.error(msg);
    } finally {
      setUploadingField(null);
    }
  };

  // Reset to default handler
  const handleResetField = async (key: keyof DocumentSettings) => {
    const defaultVal = defaultDocumentSettings[key];
    setData((prev) => ({ ...prev, [key]: defaultVal }));

    // If media, also notify backend to clean Cloudinary if needed
    if (["crImage", "bcImage", "vatImage", "vatPdf"].includes(key)) {
      try {
        await fetch(`/api/admin/company/footer-media/${key}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (err) {
        console.error("Clean media error:", err);
      }
    }
    toast.success("تمت استعادة القيمة الافتراضية بنجاح");
  };

  // Save all text fields and links
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "حدث خطأ أثناء الحفظ");
      }
      toast.success("تم حفظ جميع البيانات والملفات بنجاح!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل حفظ البيانات";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="text-sm font-medium text-gray-500">جاري تحميل بيانات الملفات...</span>
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-6xl mx-auto space-y-8 pb-16 pt-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">الملفات وبيانات التوثيق</h1>
              <p className="text-sm text-gray-500 mt-1">
                إدارة ملفات الفوتر والشهادات الرسمية: السجل التجاري، مركز الأعمال، وملف ضريبة القيمة المضافة PDF.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{saving ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
        </button>
      </div>

      {/* Main Grid: 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. السجل التجاري */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-800 font-bold text-base">
                <Building className="w-5 h-5 text-purple-600" />
                <span>1. السجل التجاري</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 font-semibold rounded-full">
                الفوتر الرئيسي
              </span>
            </div>

            {/* الصورة */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">صورة / أيقونة السجل</label>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="relative w-14 h-14 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                  <Image
                    src={data.crImage || "/commerce.webp"}
                    alt="صورة السجل التجاري"
                    width={48}
                    height={48}
                    className="object-contain"
                    unoptimized
                  />
                  {uploadingField === "crImage" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    ref={crFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload("crImage", file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => crFileInputRef.current?.click()}
                    disabled={uploadingField === "crImage"}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير الصورة</span>
                  </button>
                  {data.crImage !== defaultDocumentSettings.crImage && (
                    <button
                      type="button"
                      onClick={() => handleResetField("crImage")}
                      className="flex items-center justify-center gap-1 text-[11px] text-gray-500 hover:text-red-600 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>استعادة الافتراضية</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* اسم السجل */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">مسمى السجل / العنوان</label>
              <input
                type="text"
                value={data.crName}
                onChange={(e) => handleChange("crName", e.target.value)}
                placeholder="السجل التجاري"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              />
            </div>

            {/* رقم السجل */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">رقم السجل التجاري</label>
              <input
                type="text"
                dir="ltr"
                value={data.crNumber}
                onChange={(e) => handleChange("crNumber", e.target.value)}
                placeholder="7055426618"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition font-mono text-left"
              />
            </div>

            {/* الرابط عند النقر */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                رابط السجل (اختياري عند النقر)
              </label>
              <input
                type="url"
                dir="ltr"
                value={data.crLink}
                onChange={(e) => handleChange("crLink", e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition font-mono text-left"
              />
            </div>
          </div>
        </div>

        {/* 2. مركز الأعمال / شهادة التوثيق */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-800 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>2. مركز الأعمال / شهادة التوثيق</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full">
                المركز السعودي
              </span>
            </div>

            {/* الصورة */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">شعار / أيقونة التوثيق</label>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="relative w-14 h-14 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                  <Image
                    src={data.bcImage || "/work.webp"}
                    alt="شعار مركز الأعمال"
                    width={48}
                    height={48}
                    className="object-contain"
                    unoptimized
                  />
                  {uploadingField === "bcImage" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    ref={bcFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload("bcImage", file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => bcFileInputRef.current?.click()}
                    disabled={uploadingField === "bcImage"}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير الشعار</span>
                  </button>
                  {data.bcImage !== defaultDocumentSettings.bcImage && (
                    <button
                      type="button"
                      onClick={() => handleResetField("bcImage")}
                      className="flex items-center justify-center gap-1 text-[11px] text-gray-500 hover:text-red-600 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>استعادة الافتراضية</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* العنوان الرئيسي */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">العنوان الأول</label>
                <input
                  type="text"
                  value={data.bcTitle}
                  onChange={(e) => handleChange("bcTitle", e.target.value)}
                  placeholder="شهادة التوثيق"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">اسم الجهة / الفرعي</label>
                <input
                  type="text"
                  value={data.bcSubtitle}
                  onChange={(e) => handleChange("bcSubtitle", e.target.value)}
                  placeholder="مركز الاعمال"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* رقم التوثيق */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">رقم التوثيق</label>
              <input
                type="text"
                dir="ltr"
                value={data.bcNumber}
                onChange={(e) => handleChange("bcNumber", e.target.value)}
                placeholder="0000336194"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition font-mono text-left"
              />
            </div>

            {/* رابط التوثيق */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">رابط التحقق / QR</label>
              <input
                type="url"
                dir="ltr"
                value={data.bcLink}
                onChange={(e) => handleChange("bcLink", e.target.value)}
                placeholder="https://qr.saudibusiness.gov.sa/..."
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition font-mono text-left"
              />
            </div>
          </div>
        </div>

        {/* 3. شهادة ضريبة القيمة المضافة / ملف الـ PDF */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-800 font-bold text-base">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <span>3. ملف PDF الفوتر (الضريبة)</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full">
                ملف PDF
              </span>
            </div>

            {/* شعار الضريبة */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">شعار شهادة القيمة المضافة</label>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="relative w-14 h-14 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                  <Image
                    src={data.vatImage || "/شعار ضريبة القيمة المضافة بدقة عالية svg - png (1).png"}
                    alt="شعار الضريبة"
                    width={48}
                    height={48}
                    className="object-contain"
                    unoptimized
                  />
                  {uploadingField === "vatImage" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    ref={vatImgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload("vatImage", file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => vatImgInputRef.current?.click()}
                    disabled={uploadingField === "vatImage"}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير الشعار</span>
                  </button>
                  {data.vatImage !== defaultDocumentSettings.vatImage && (
                    <button
                      type="button"
                      onClick={() => handleResetField("vatImage")}
                      className="flex items-center justify-center gap-1 text-[11px] text-gray-500 hover:text-red-600 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>استعادة الافتراضية</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* مسمى الشهادة */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">مسمى الملف / الشهادة</label>
              <input
                type="text"
                value={data.vatTitle}
                onChange={(e) => handleChange("vatTitle", e.target.value)}
                placeholder="شهادة ضريبة القيمة المضافة"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              />
            </div>

            {/* رفع ملف PDF مباشرة */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                رفع ملف الـ PDF (يُرفع على الاستضافة السحابية)
              </label>

              <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 text-center hover:border-purple-400 transition">
                <input
                  ref={vatPdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePdfUpload(file);
                  }}
                />

                <div className="p-2.5 bg-red-100 text-red-600 rounded-full">
                  <FileText className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-800">
                    {uploadingField === "vatPdf" ? "جاري رفع ملف الـ PDF..." : "انقر لاختيار ملف PDF جديد"}
                  </p>
                  <p className="text-[11px] text-gray-500">الحد الأقصى للحجم 20 ميجابايت بصيغة PDF</p>
                </div>

                <button
                  type="button"
                  onClick={() => vatPdfInputRef.current?.click()}
                  disabled={uploadingField === "vatPdf"}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {uploadingField === "vatPdf" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploadingField === "vatPdf" ? "جاري الرفع..." : "اختر ملف PDF من جهازك"}</span>
                </button>
              </div>
            </div>

            {/* الرابط أو المسار الحالي لملف الـ PDF */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                رابط أو مسار ملف الـ PDF الحالي
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={data.vatPdf}
                  onChange={(e) => handleChange("vatPdf", e.target.value)}
                  placeholder="/qema.pdf أو https://..."
                  className="flex-1 px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition font-mono text-left"
                />
                {data.vatPdf && (
                  <a
                    href={data.vatPdf}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-600 rounded-xl border border-gray-200 transition shrink-0"
                    title="فتح ومعاينة ملف الـ PDF"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {data.vatPdf !== defaultDocumentSettings.vatPdf && (
                <button
                  type="button"
                  onClick={() => handleResetField("vatPdf")}
                  className="flex items-center gap-1 mt-2 text-[11px] text-gray-500 hover:text-red-600 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>استعادة ملف PDF الافتراضي (/qema.pdf)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Eye className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-gray-900">معاينة حية لشكل العناصر في الفوتر</h2>
          <span className="text-xs text-gray-400 mr-auto">تتحدث تلقائياً مع أي تعديل</span>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 bg-[#F3F4F6]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* جهة اليمين: السجل ومركز الأعمال */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-400 block mb-2">جهة اليمين بالفوتر:</span>
              
              {/* السجل التجاري */}
              <div className="flex items-center gap-2.5 bg-white/70 p-3 rounded-lg border border-gray-200/60">
                <Image
                  src={data.crImage || "/commerce.webp"}
                  alt={data.crName || "السجل التجاري"}
                  width={52}
                  height={52}
                  className="object-contain shrink-0"
                  unoptimized
                />
                <div className="flex flex-col">
                  {data.crName ? (
                    <span className="text-xs font-semibold text-gray-700">{data.crName}</span>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">(فارغ)</span>
                  )}
                  {data.crNumber ? (
                    <span dir="ltr" className="text-xs text-gray-500 tabular-nums">{data.crNumber}</span>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">(لا يوجد رقم)</span>
                  )}
                </div>
              </div>

              {/* مركز الأعمال */}
              <div className="flex items-center gap-2.5 bg-white/70 p-3 rounded-lg border border-gray-200/60">
                {data.bcLink ? (
                  <a
                    href={data.bcLink}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={data.bcImage || "/work.webp"}
                      alt={data.bcTitle || "شهادة التوثيق"}
                      width={52}
                      height={52}
                      className="object-contain"
                      unoptimized
                    />
                  </a>
                ) : (
                  <div className="shrink-0">
                    <Image
                      src={data.bcImage || "/work.webp"}
                      alt={data.bcTitle || "شهادة التوثيق"}
                      width={52}
                      height={52}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  {data.bcTitle ? (
                    <span className="text-xs font-semibold text-gray-700">{data.bcTitle}</span>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">(فارغ)</span>
                  )}
                  {data.bcSubtitle ? (
                    <span className="text-xs text-gray-500">{data.bcSubtitle}</span>
                  ) : null}
                  {data.bcNumber ? (
                    <span dir="ltr" className="text-xs text-gray-500 tabular-nums">{data.bcNumber}</span>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">(لا يوجد رقم)</span>
                  )}
                </div>
              </div>
            </div>

            {/* جهة اليسار: ملف PDF */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-400 block mb-2">جهة اليسار بالفوتر:</span>
              <div className="bg-white/70 p-3 rounded-lg border border-gray-200/60 flex flex-col items-start gap-2">
                {data.vatPdf ? (
                  <a
                    href={data.vatPdf}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block hover:opacity-80 transition-opacity"
                    title={data.vatTitle || "شهادة ضريبة القيمة المضافة"}
                  >
                    <Image
                      src={data.vatImage || "/شعار ضريبة القيمة المضافة بدقة عالية svg - png (1).png"}
                      alt={data.vatTitle || "شهادة ضريبة القيمة المضافة"}
                      width={65}
                      height={65}
                      className="object-contain"
                      unoptimized
                    />
                  </a>
                ) : (
                  <div
                    className="inline-block hover:opacity-80 transition-opacity"
                    title={data.vatTitle || "شهادة ضريبة القيمة المضافة"}
                  >
                    <Image
                      src={data.vatImage || "/شعار ضريبة القيمة المضافة بدقة عالية svg - png (1).png"}
                      alt={data.vatTitle || "شهادة ضريبة القيمة المضافة"}
                      width={65}
                      height={65}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <span className="text-xs text-gray-600 font-medium">
                  {data.vatTitle || <span className="text-gray-400 italic">(بدون مسمى)</span>}
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-red-500" />
                  {data.vatPdf ? (
                    <>
                      النقر على الشعار يفتح ملف PDF: <span dir="ltr" className="font-mono text-gray-600">{data.vatPdf?.slice(0, 35)}...</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">(لا يوجد ملف PDF مرتبط)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{saving ? "جاري الحفظ والتطبيق..." : "حفظ جميع البيانات وتطبيقها على المتجر"}</span>
        </button>
      </div>
    </div>
  );
}
