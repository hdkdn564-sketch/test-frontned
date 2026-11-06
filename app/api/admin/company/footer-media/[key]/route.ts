import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { getBackend, forwardCookies } from "../../../_lib";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    const res = await fetch(`${getBackend()}/api/admin/company/footer-media/${key}`, forwardCookies(req, { method: "DELETE" }));
    const data = await res.json();
    try {
      revalidateTag("company");
      revalidatePath("/", "layout");
    } catch (err) {
      console.error("Revalidation error:", err);
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "فشل حذف الملف" }, { status: 500 });
  }
}
