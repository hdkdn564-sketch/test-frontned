import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';

// Block known aggressive scrapers that consume Edge bandwidth and CPU
const BLOCKED_BOT_REGEX = /bytespider|petalbot|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|dataforseobot|baiduspider|yandexbot|sogou|zoominfo|seekport/i;

// CSP الثابت يُبنى مرة واحدة عند startup
const STATIC_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://maps.googleapis.com https://js.sentry-cdn.com https://www.google-analytics.com https://www.googletagmanager.com https://www.googleadservices.com https://*.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://analytics.tiktok.com https://sc-static.net https://tr.snapchat.com https://*.snapchat.com https://*.saudibusiness.gov.sa${isDev ? ' https://va.vercel-scripts.com' : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.saudibusiness.gov.sa",
  "img-src 'self' blob: data: https: http://localhost:5000",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' http://localhost:5000 https://*.vercel.app https://*.railway.app https://*.render.com https://*.onrender.com https://lamsa-simicard-backend.vercel.app https://www.alsharihaa.com https://alsharihaa.com https://alshareehasim.com https://sentry.io https://www.google-analytics.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://www.google.com https://www.google.com.sa https://ad.doubleclick.net https://maps.googleapis.com https://nominatim.openstreetmap.org https://analytics.tiktok.com https://*.tiktok.com https://tr.snapchat.com https://*.snapchat.com https://sc-static.net https://*.saudibusiness.gov.sa" + (isDev ? " https://va.vercel-scripts.com" : ""),
  "frame-src 'self' https://www.googletagmanager.com https://www.google.com https://docs.google.com https://tr.snapchat.com https://*.snapchat.com",
  "object-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

// Security headers ثابتة — تُحسب مرة واحدة
const SECURITY_HEADERS: [string, string][] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['X-XSS-Protection', '1; mode=block'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)'],
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block aggressive commercial crawlers instantly at the Edge
  const userAgent = request.headers.get('user-agent') || '';
  if (BLOCKED_BOT_REGEX.test(userAgent)) {
    return new NextResponse(null, { status: 403 });
  }

  // صد محاولات فحص البوتات والمسارات الضارة فوراً عند الـ Edge بدون تشغيل Serverless Function
  const lowerPath = pathname.toLowerCase();
  if (
    lowerPath.endsWith('.php') ||
    lowerPath.endsWith('.asp') ||
    lowerPath.endsWith('.aspx') ||
    lowerPath.endsWith('.jsp') ||
    lowerPath.startsWith('/wp-') ||
    lowerPath.startsWith('/xmlrpc') ||
    lowerPath.startsWith('/phpmyadmin') ||
    lowerPath.startsWith('/.env') ||
    lowerPath.startsWith('/.git') ||
    lowerPath.startsWith('/cgi-bin')
  ) {
    return new NextResponse(null, { status: 404 });
  }

  // Maintenance mode redirect (تجاهل API و maintenance نفسها)
  if (
    process.env.MAINTENANCE_MODE === 'true' &&
    !pathname.startsWith('/maintenance') &&
    !pathname.startsWith('/api/')
  ) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  const response = NextResponse.next();

  // تطبيق CSP الثابت
  response.headers.set('Content-Security-Policy', STATIC_CSP);

  // باقي الـ security headers
  for (const [key, value] of SECURITY_HEADERS) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|api/|favicon.ico|apple-icon.png|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff2?|ttf|otf|eot|pdf|lottie)).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
