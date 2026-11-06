/**
 * Snapchat Pixel — ID: fa4cbf22-9c14-43d5-a2e6-0a1910358f11
 *
 * Base code is injected directly in layout.tsx <head>.
 * This module provides a typed wrapper for event tracking only.
 */

declare global {
  interface Window {
    snaptr?: (action: string, event?: string, params?: Record<string, unknown>) => void;
  }
}

export type SnapEvent =
  | 'PAGE_VIEW'
  | 'VIEW_CONTENT'
  | 'ADD_CART'
  | 'START_CHECKOUT'
  | 'PURCHASE'
  | 'SIGN_UP'
  | 'LOGIN'
  | 'SUBSCRIBE'
  | 'SEARCH'
  | 'ADD_BILLING';

export interface SnapEventParams {
  price?: number;
  currency?: string;
  transaction_id?: string;
  item_ids?: string[];
  item_category?: string;
  number_items?: number;
  payment_info_available?: 0 | 1;
  sign_up_method?: string;
  description?: string;
  search_string?: string;
  [key: string]: unknown;
}

/**
 * Fire a Snapchat Pixel event safely.
 * Returns true if snaptr was available, false otherwise.
 */
export function trackSnap(event: SnapEvent, params?: SnapEventParams): boolean {
  if (typeof window === 'undefined' || typeof window.snaptr !== 'function') return false;
  try {
    window.snaptr('track', event, params ?? {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Convenience wrapper for the PURCHASE event specifically,
 * matching the shape expected by checkout/verify.
 */
export function trackSnapPurchase(params: {
  price: number;
  currency: string;
  transaction_id: string;
  item_ids?: string[];
  number_items?: number;
}): boolean {
  return trackSnap('PURCHASE', params as SnapEventParams);
}

import type { Product } from '../components/products/types';

/**
 * Convenience wrapper for product-level events (VIEW_CONTENT, ADD_CART, PURCHASE).
 * Returns true if the event was dispatched.
 */
export function trackSnapProduct(
  event: 'VIEW_CONTENT' | 'ADD_CART' | 'PURCHASE',
  product: Product,
  quantity = 1,
  transactionId?: string,
): boolean {
  if (typeof window === 'undefined') return false;
  const price = product.salePrice ?? product.originalPrice ?? product.price ?? 0;
  const value = price * quantity;

  if (!product._id?.trim() || !Number.isFinite(value) || value < 0 ||
      !Number.isInteger(quantity) || quantity < 1) return false;

  const params: SnapEventParams = {
    price: value,
    currency: 'SAR',
    item_ids: [product._id],
    item_category: product.category ?? undefined,
    number_items: quantity,
    ...(transactionId ? { transaction_id: transactionId } : {}),
  };

  return trackSnap(event, params);
}

/**
 * Returns the snaptr function, initialising a no-op queue if the real script
 * has not loaded yet.  Useful for imperative calls inside event handlers.
 */
export function initializeSnapPixel(): NonNullable<Window['snaptr']> {
  if (typeof window === 'undefined') return () => {};
  if (typeof window.snaptr === 'function') return window.snaptr;

  // Polyfill queue so events are not lost when called before the script loads.
  const queue: unknown[][] = [];
  const fn = (...args: unknown[]) => { queue.push(args); };
  (fn as { queue?: unknown[][] }).queue = queue;
  window.snaptr = fn as Window['snaptr'];
  return window.snaptr!;
}
