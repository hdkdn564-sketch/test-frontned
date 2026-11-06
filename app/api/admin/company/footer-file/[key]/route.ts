import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { getBackend, forwardCookies } from "../../../_lib";

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    const body = await req.formData();
    const res = await fetch(`${getBackend()}/api/admin/company/footer-file/${key}`, forwardCookies(req, { method: "POST", body }));
    const data = await res.json();
    try {
      revalidateTag("company");
      revalidatePath("/", "layout");
    } catch (err) {
      console.error("Revalidation error:", err);
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 });
  }
}
