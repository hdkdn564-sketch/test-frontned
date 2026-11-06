import type { Product } from '../components/products/types';
import { trackSnapProduct } from './snapPixel';
import { trackTikTokAddToCart } from './tiktokEvents';

// Called once, after the cart store has accepted an addition.
export function trackCartAddition(product: Product, quantity: number) {
  const price = product.salePrice ?? product.originalPrice ?? product.price ?? 0;
  const value = price * quantity;

  // Guard: skip tracking if essential data is missing or invalid.
  if (!product._id?.trim() || !Number.isFinite(value) || value < 0 ||
      !Number.isInteger(quantity) || quantity < 1) return;

  trackSnapProduct('ADD_CART', product, quantity);
  trackTikTokAddToCart(product, quantity);   // ✅ content_id مضمون
}
