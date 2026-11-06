import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

const BACKEND =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://alshareehasim-backend.onrender.com";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://shareehapro.com";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    console.log("[TikTok Catalog] Fetching from:", `${BACKEND}/api/products?limit=1000`);
    
    const res = await fetch(`${BACKEND}/api/products?limit=1000`, {
      next: { revalidate: 3600 },
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.error("[TikTok Catalog] Backend fetch failed:", res.status, res.statusText);
      return new NextResponse(`Failed to fetch products from backend: ${res.status}`, { status: 502 });
    }

    const products = await res.json();
    console.log("[TikTok Catalog] Products fetched:", Array.isArray(products) ? products.length : "not an array");
    
    if (!Array.isArray(products)) {
      console.error("[TikTok Catalog] Invalid products data type:", typeof products);
      return new NextResponse("Invalid products data - expected array", { status: 502 });
    }

    const itemsXml = products
      .map((p, index) => {
        try {
          const id = String(p._id);
          const title = escapeXml(p.name || "منتج");
          const description = escapeXml(
            (p.description || p.brief || p.name || "").slice(0, 5000)
          );
          const link = `${SITE_URL}/product/${id}`;
          
          let imageUrl = p.images?.[0] || p.image || "";
          if (imageUrl && !imageUrl.startsWith("http")) {
            imageUrl = `${BACKEND}${imageUrl}`;
          }
          if (!imageUrl) {
            imageUrl = `${SITE_URL}/logo.webp`;
          }

          const priceNum = p.salePrice || p.originalPrice || p.price || 0;
          const priceStr = `${priceNum} SAR`;
          const availability = p.inStock !== false ? "in stock" : "out of stock";
          const brand = escapeXml(p.brand || "شريحة برو");

          return `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceStr}</g:price>
      ${p.salePrice && p.originalPrice && p.salePrice < p.originalPrice ? `<g:sale_price>${p.salePrice} SAR</g:sale_price>` : ""}
      <g:google_product_category>536</g:google_product_category>
    </item>`;
        } catch (itemError) {
          console.error(`[TikTok Catalog] Error processing product at index ${index}:`, itemError, p);
          return ""; // Skip this product
        }
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>شريحة برو - TikTok Product Catalog Feed</title>
    <link>${SITE_URL}</link>
    <description>تغذية منتجات متجر شريحة برو لكتالوج تيك توك وجوجل</description>
    ${itemsXml}
  </channel>
</rss>`;

    console.log("[TikTok Catalog] XML generated successfully, length:", xml.length);
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("[TikTok Catalog] Error:", error);
    console.error("[TikTok Catalog] Error stack:", error instanceof Error ? error.stack : "No stack");
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
