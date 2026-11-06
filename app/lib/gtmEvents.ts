/**
 * Tracking & Analytics Helper (GTM / TikTok Pixel / GA4 / Snap Pixel)
 * مستخرج ومطابق للمشروع الأصلي sharehaa-net-clone مع تحديث TikTok Pixel ID
 *
 * الأحداث المدعومة:
 *  - ViewContent / view_item            (عرض تفاصيل المنتج ومطابقة الكتالوج)
 *  - AddToCart / add_to_cart            (إضافة منتج للسلة)
 *  - InitiateCheckout / begin_checkout  (بدء الدفع)
 *  - CompletePayment / purchase         (إتمام الشراء)
 */

/** تأكد من وجود dataLayer */
function dl(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/** معرف بكسل TikTok */
export const TTQ_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "DBLMNC3C77U8I4RJ3B6G";

/**
 * استدعاء TikTok Pixel مع retry تلقائي
 * يستدعي ttq.track المباشر حتى ترصده إضافة TikTok Pixel Helper في المتصفح وتظهر الأحداث كاملة بدون تكرار.
 */
function ttqTrack(
  event: string,
  params: Record<string, unknown>,
  retries = 10
): void {
  if (typeof window === "undefined") return;

  const ttq = window.ttq;

  if (ttq) {
    try {
      const eventId = params.event_id ? String(params.event_id) : undefined;
      const options = eventId ? { event_id: eventId } : undefined;

      // 1. استدعاء ttq.track المباشر
      if (typeof ttq.track === "function") {
        ttq.track(event, params, options);
        return;
      }

      // 2. كحل بديل في حال استخدام instance
      if (typeof ttq.instance === "function" && TTQ_PIXEL_ID) {
        const inst = ttq.instance(TTQ_PIXEL_ID);
        if (inst && typeof inst.track === "function") {
          inst.track(event, params, options);
          return;
        }
      }
    } catch (e) {
      console.warn(`[TikTok Pixel] ${event} error:`, e);
      return;
    }
  }

  // ttq لم يُحمل بعد — انتظر 200ms وأعد المحاولة
  if (retries > 0) {
    setTimeout(() => ttqTrack(event, params, retries - 1), 200);
  }
}

/** معرف فريد لكل حدث لمنع التكرار (deduplication) */
function makeEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface GtmItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_brand?: string;
  item_category?: string;
  discount?: number;
}

export interface ViewItemPayload {
  currency: string;
  value: number;
  items: GtmItem[];
}

export interface AddToCartPayload {
  currency: string;
  value: number;
  items: GtmItem[];
}

export interface BeginCheckoutPayload {
  currency: string;
  value: number;
  items: GtmItem[];
}

export interface PurchasePayload {
  transaction_id: string;
  currency: string;
  value: number;
  items: GtmItem[];
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function toTikTokContents(items: GtmItem[]) {
  return items
    .filter((it) => it.item_id)
    .map((it) => ({
      content_id: String(it.item_id),
      content_name: it.item_name || "",
      content_category: it.item_category || "",
      content_type: "product",
      quantity: it.quantity || 1,
      price: it.price || 0,
    }));
}

// ─────────────────────────────────────────────────────────
// Event helpers
// ─────────────────────────────────────────────────────────

/**
 * ViewContent / view_item
 * يُطلق عند فتح صفحة المنتج
 */
export function pushViewItem(payload: ViewItemPayload): void {
  const primaryItem = payload.items[0];
  const contentId = primaryItem ? String(primaryItem.item_id) : "";
  const contentName = primaryItem ? primaryItem.item_name : "";
  const contents = toTikTokContents(payload.items);
  const eventId = makeEventId("vc");

  // ── GA4 via GTM dataLayer ─────────────────────────────
  dl().push({ ecommerce: null });
  dl().push({
    event: "view_item",
    ecommerce: {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
    },
  });

  // ── GTM Custom Event لـ ViewContent ───────────────────
  dl().push({
    event: "ViewContent",
    content_id: contentId,
    content_name: contentName,
    content_type: "product",
    value: payload.value,
    currency: payload.currency,
    contents,
  });

  // ── TikTok Direct ttq.track ──────────────────────────
  ttqTrack("ViewContent", {
    event_id: eventId,
    content_id: contentId,
    content_type: "product",
    content_name: contentName,
    quantity: 1,
    price: payload.value,
    value: payload.value,
    currency: payload.currency,
    contents,
  });

  // ── Snap Pixel ────────────────────────────────────────
  if (typeof window !== "undefined" && typeof window.snaptr === "function") {
    try {
      window.snaptr("track", "VIEW_CONTENT", {
        item_ids: [contentId],
        price: payload.value,
        currency: payload.currency,
      });
    } catch {}
  }
}

/**
 * AddToCart / add_to_cart
 * يُطلق عند إضافة منتج للسلة
 */
export function pushAddToCart(payload: AddToCartPayload): void {
  const primaryItem = payload.items[0];
  const contentId = primaryItem ? String(primaryItem.item_id) : "";
  const contentName = primaryItem ? primaryItem.item_name : "";
  const contents = toTikTokContents(payload.items);
  const eventId = makeEventId("atc");

  // ── GA4 via GTM dataLayer ─────────────────────────────
  dl().push({ ecommerce: null });
  dl().push({
    event: "add_to_cart",
    ecommerce: {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
    },
  });

  // ── GTM Custom Event لـ AddToCart ─────────────────────
  dl().push({
    event: "AddToCart",
    content_id: contentId,
    content_name: contentName,
    content_type: "product",
    value: payload.value,
    currency: payload.currency,
    contents,
  });

  // ── TikTok Direct ttq.track ──────────────────────────
  ttqTrack("AddToCart", {
    event_id: eventId,
    contents,
    content_id: contentId,
    content_name: contentName,
    content_type: "product",
    value: payload.value,
    currency: payload.currency,
  });

  // ── Snap Pixel ────────────────────────────────────────
  if (typeof window !== "undefined" && typeof window.snaptr === "function") {
    try {
      window.snaptr("track", "ADD_CART", {
        item_ids: payload.items.map((i) => String(i.item_id)),
        price: payload.value,
        currency: payload.currency,
        number_items: payload.items.reduce((s, it) => s + (it.quantity || 1), 0),
      });
    } catch {}
  }
}

/**
 * InitiateCheckout / begin_checkout
 * يُطلق عند دخول صفحة إتمام الطلب
 */
export function pushBeginCheckout(payload: BeginCheckoutPayload): void {
  const contents = toTikTokContents(payload.items);
  const primaryItem = payload.items[0];
  const contentId = primaryItem ? String(primaryItem.item_id) : "";
  const eventId = makeEventId("ic");

  // ── GA4 via GTM dataLayer ─────────────────────────────
  dl().push({ ecommerce: null });
  dl().push({
    event: "begin_checkout",
    ecommerce: {
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
    },
  });

  // ── GTM Custom Event لـ InitiateCheckout ──────────────
  dl().push({
    event: "InitiateCheckout",
    content_id: contentId,
    content_type: "product",
    value: payload.value,
    currency: payload.currency,
    contents,
  });

  // ── TikTok Direct ttq.track ──────────────────────────
  ttqTrack("InitiateCheckout", {
    event_id: eventId,
    contents,
    content_id: contentId,
    content_type: "product",
    value: payload.value,
    currency: payload.currency,
  });

  // ── Snap Pixel ────────────────────────────────────────
  if (typeof window !== "undefined" && typeof window.snaptr === "function") {
    try {
      window.snaptr("track", "START_CHECKOUT", {
        item_ids: payload.items.map((i) => String(i.item_id)),
        price: payload.value,
        currency: payload.currency,
        number_items: payload.items.reduce((s, it) => s + (it.quantity || 1), 0),
      });
    } catch {}
  }
}

/**
 * CompletePayment / purchase
 * يُطلق بعد تأكيد الشراء أو إتمام الطلب بنجاح
 */
export function pushPurchase(payload: PurchasePayload): void {
  const contents = toTikTokContents(payload.items);
  const primaryItem = payload.items[0];
  const contentId = primaryItem ? String(primaryItem.item_id) : "";

  // ── GA4 via GTM dataLayer ─────────────────────────────
  dl().push({ ecommerce: null });
  dl().push({
    event: "purchase",
    ecommerce: {
      transaction_id: payload.transaction_id,
      currency: payload.currency,
      value: payload.value,
      items: payload.items,
    },
  });

  // ── GTM Custom Event لـ CompletePayment ───────────────
  dl().push({
    event: "CompletePayment",
    transaction_id: payload.transaction_id,
    content_id: contentId,
    content_type: "product",
    value: payload.value,
    currency: payload.currency,
    contents,
  });

  // ── TikTok Direct ttq.track ──────────────────────────
  ttqTrack("CompletePayment", {
    event_id: payload.transaction_id, // استخدام orderId كـ event_id لمنع التكرار
    contents,
    content_id: contentId,
    content_type: "product",
    value: payload.value,
    currency: payload.currency,
  });

  // ── Snap Pixel ────────────────────────────────────────
  if (typeof window !== "undefined" && typeof window.snaptr === "function") {
    try {
      window.snaptr("track", "PURCHASE", {
        transaction_id: payload.transaction_id,
        item_ids: payload.items.map((i) => String(i.item_id)),
        price: payload.value,
        currency: payload.currency,
        number_items: payload.items.reduce((s, it) => s + (it.quantity || 1), 0),
      });
    } catch {}
  }
}
