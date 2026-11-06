/**
 * productEvents.ts
 * Legacy wrapper — يحوّل الأحداث القديمة لـ tiktokEvents الموحّد
 * الـ Pixel ID الصحيح: DBLMNC3C77U8I4RJ3B6G (محدّث في tiktokEvents.ts)
 */
import type { Product } from '../components/products/types';
import { trackTikTokViewContent, trackTikTokAddToCart } from './tiktokEvents';

// re-export للاستخدام في cartEvents و useProductView
export function trackProductEvent(
  event: 'view_item' | 'add_to_cart',
  product: Product,
  quantity = 1
): boolean {
  if (event === 'view_item')   return trackTikTokViewContent(product, quantity);
  if (event === 'add_to_cart') return trackTikTokAddToCart(product, quantity);
  return false;
}
