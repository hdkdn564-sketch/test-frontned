import { MetadataRoute } from "next";

export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block aggressive commercial scrapers that consume quota
      {
        userAgent: [
          "AhrefsBot",
          "SemrushBot",
          "MJ12bot",
          "DotBot",
          "PetalBot",
          "Bytespider",
          "DataForSeoBot",
          "Baiduspider",
          "YandexBot",
          "Sogou web spider",
          "ZoominfoBot",
          "Seekport",
        ],
        disallow: ["/"],
      },
      // Googlebot, Googlebot-Image, Storebot-Google, AdsBot: full access to products and images
      {
        userAgent: [
          "Googlebot",
          "Googlebot-Image",
          "Storebot-Google",
          "AdsBot-Google",
          "AdsBot-Google-Mobile",
        ],
        allow: ["/", "/_next/image"],
        disallow: ["/admin/", "/api/", "/checkout/", "/account/", "/auth/"],
      },
      // All other bots
      {
        userAgent: "*",
        allow: ["/", "/_next/image"],
        disallow: [
          "/admin/",
          "/api/",
          "/checkout/",
          "/checkout/verify/",
          "/account/",
          "/auth/",
          "/cart/",
          "/search/",
          "/maintenance/",
          "/_next/static/",
        ],
      },
    ],
    sitemap: "https://www.alshariyaa.com/sitemap.xml",
  };
}
