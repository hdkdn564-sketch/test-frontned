import RoutersClient from "./RoutersClient";
import type { Product } from "../components/products/types";
import { sortProducts } from "../lib/sortProducts";
import type { Metadata } from "next";

const SITE_URL = "https://www.alshariyaa.com";
const SITE_NAME = "شريحة الأعمال";

export const metadata: Metadata = {
  title: `الراوترات وأجهزة الإنترنت | ${SITE_NAME}`,
  description:
    "تسوق أفضل الراوترات وأجهزة الإنترنت بأسرع سرعات وأقوى تغطية لمنزلك ومكتبك من شريحة الأعمال.",
  alternates: {
    canonical: `${SITE_URL}/routers`,
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/routers`,
    title: `الراوترات وأجهزة الإنترنت | ${SITE_NAME}`,
    description:
      "تسوق أفضل الراوترات وأجهزة الإنترنت بأسرع سرعات وأقوى تغطية لمنزلك ومكتبك.",
    siteName: SITE_NAME,
    locale: "ar_SA",
  },
};

export const revalidate = 86400;

const BACKEND =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

async function getRouters(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/products?category=routers&cardOnly=true`,
      {
        next: { revalidate: 86400, tags: ["routers", "products"] },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const raw = Array.isArray(data)
      ? data
      : Array.isArray(data?.products)
      ? data.products
      : [];
    return sortProducts(raw);
  } catch {
    return [];
  }
}

export default async function RoutersPage() {
  const products = await getRouters();
  return <RoutersClient initialProducts={products} />;
}

