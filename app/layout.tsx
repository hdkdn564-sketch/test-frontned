import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import Footer from "./components/Footer";
import { getCompany } from "./lib/getCompany";
import { Analytics } from "@vercel/analytics/next";

// Single source of truth for the production domain
const SITE_URL = "https://www.shareehapro.com";

export const viewport: Viewport = {
  themeColor: "#01226B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await getCompany();

  const siteName = c.nameAr || "شريحة الأعمال";
  const titleDefault = `${siteName} | أفضل متجر لبيع شرائح الاتصال في السعودية`;
  const description =
    c.details ||
    "شريحة الأعمال - تسوق أفضل شرائح الاتصال وباقات الإنترنت من فيرجن وSTC وزين وموبايلي بأسعار مميزة. توصيل سريع لجميع مناطق المملكة العربية السعودية.";
  const ogImage = `${SITE_URL}/web-app-manifest-512x512.png`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: titleDefault,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [
      "شريحة الأعمال",
      "alshariyaa",
      "بيع شرائح الاتصال",
      "شرائح اتصال",
      "باقات إنترنت",
      "شريحة SIM",
      "شريحة بيانات",
      "فيرجن موبايل",
      "Virgin Mobile",
      "STC",
      "زين",
      "موبايلي",
      "إنترنت مفتوح",
      "باقة شهرية",
      "باقة سنوية",
      "5G",
      "4G",
      "شريحة إنترنت",
      "باقة بيانات",
      "سوشيال مفتوح",
      "السعودية",
      "الرياض",
      "جدة",
      "مكة",
      "المدينة",
      "الدمام",
      "الخبر",
      "أرخص باقات الإنترنت",
      "عروض شرائح الاتصال",
    ],
    authors: [{ name: siteName, url: SITE_URL }],
    creator: siteName,
    publisher: siteName,
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon1.png", type: "image/png", sizes: "96x96" },
        { url: "/web-app-manifest-192x192.png", type: "image/png", sizes: "192x192" },
        { url: "/web-app-manifest-512x512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [
        { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: ["/favicon.ico"],
    },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      url: SITE_URL,
      siteName,
      title: titleDefault,
      description,
      images: [
        {
          url: `${SITE_URL}/web-app-manifest-512x512.png`,
          secureUrl: `${SITE_URL}/web-app-manifest-512x512.png`,
          width: 512,
          height: 512,
          alt: siteName,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: titleDefault,
      description,
      images: [`${SITE_URL}/web-app-manifest-512x512.png`],
      creator: "@alshariyaa",
      site: "@alshariyaa",
    },
    alternates: {
      canonical: SITE_URL,
      languages: { "ar-SA": SITE_URL },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    },
    category: "electronics",
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const c = await getCompany();

  // GA4 Measurement ID — set NEXT_PUBLIC_GA_MEASUREMENT_ID in .env.local
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K45NPPPP');`}
        </Script>

        {/* Google Fonts: Cairo */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />

        {/* Preconnect to Image CDN */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Google Ads Conversion Tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18484617025"
          strategy="afterInteractive"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18484617025');
          `}
        </Script>

        {/* Google Analytics 4 — only loaded when Measurement ID is configured */}
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics-4" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {/* Snap Pixel Base Code — ID: fa4cbf22-9c14-43d5-a2e6-0a1910358f11 */}
        <Script id="snap-pixel-base" strategy="afterInteractive">
          {`(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
{a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
r.src=n;var u=t.getElementsByTagName(s)[0];
u.parentNode.insertBefore(r,u);})(window,document,
'https://sc-static.net/scevent.min.js');
snaptr('init','fa4cbf22-9c14-43d5-a2e6-0a1910358f11',{});`}
        </Script>

        {/* Favicons & App Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon1.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/web-app-manifest-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      </head>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K45NPPPP"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <ClientLayout footer={<Footer />} whatsapp={c.whatsapp}>
          {children}
        </ClientLayout>
        {/* Saudi Business Verify Seal */}
        <div
          className="sbc-verify-seal"
          data-token="eFdHY0YrK3Y3RlNuTGtMQWN3V21Jdz09"
          data-position="bottom-left"
        />
        <Script
          src="https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js"
          strategy="lazyOnload"
        />
        <Analytics />
      </body>
    </html>
  );
}

