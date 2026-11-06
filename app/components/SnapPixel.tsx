'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackSnap } from '../lib/snapPixel';

/**
 * Fires snaptr PAGE_VIEW on every client-side navigation.
 * The base code is already in <head> via layout.tsx.
 */
export default function SnapPixel() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && previousPath.current !== pathname) {
      trackSnap('PAGE_VIEW');
      previousPath.current = pathname;
    }
  }, [pathname]);

  return null;
}
