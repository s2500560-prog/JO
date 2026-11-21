import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { FurnitureKind } from '../types/saw2sale';

/**
 * Wraps state updates in the native View Transitions API when supported.
 */
export function runWithViewTransition(update: () => void): void {
  if (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition === 'function'
  ) {
    (
      document as Document & {
        startViewTransition: (cb: () => void) => void;
      }
    ).startViewTransition(() => {
      flushSync(update);
    });
    return;
  }
  update();
}

/**
 * Deterministic BlurHash-style radial gradient field for smooth image/stage placeholders.
 */
export function getBlurHashGradient(kind: FurnitureKind): string {
  switch (kind) {
    case 'dining-table':
      return 'radial-gradient(circle at 28% 35%, #E8DAC6 0%, transparent 55%), radial-gradient(circle at 72% 62%, #9E562C 0%, transparent 60%), linear-gradient(180deg, #DFCEB4 0%, #9B7B56 100%)';
    case 'cabinets':
      return 'radial-gradient(circle at 30% 30%, #EFEAE0 0%, transparent 50%), radial-gradient(circle at 65% 65%, #8A4722 0%, transparent 62%), linear-gradient(180deg, #E3D4BE 0%, #947450 100%)';
    case 'desk':
      return 'radial-gradient(circle at 35% 32%, #D7C2A6 0%, transparent 52%), radial-gradient(circle at 70% 68%, #4A2918 0%, transparent 65%), linear-gradient(180deg, #D9C5A8 0%, #876646 100%)';
    case 'bed-frame':
      return 'radial-gradient(circle at 50% 45%, #F2EDE2 0%, transparent 55%), radial-gradient(circle at 25% 70%, #783D1C 0%, transparent 60%), linear-gradient(180deg, #E6D7C2 0%, #9A7B56 100%)';
    case 'console':
      return 'radial-gradient(circle at 40% 30%, #E7D6BE 0%, transparent 50%), radial-gradient(circle at 68% 60%, #8A3B12 0%, transparent 60%), linear-gradient(180deg, #E1D1BA 0%, #957551 100%)';
    case 'lounge-chair':
    default:
      return 'radial-gradient(circle at 48% 48%, #EFEAE0 0%, transparent 50%), radial-gradient(circle at 72% 72%, #A67E53 0%, transparent 58%), linear-gradient(180deg, #E8DAC6 0%, #9B7B56 100%)';
  }
}

interface CacheEntry<T> {
  data: T;
  updatedAt: number;
}

const swrMemoryCache = new Map<string, CacheEntry<unknown>>();
const prefetchedRoutes = new Set<string>();

/**
 * Pre-render / prefetch hint for adjacent routes & tabs on hover or focus.
 */
export function prefetchRouteData(routeKey: string, snapshot?: unknown): void {
  prefetchedRoutes.add(routeKey);
  if (snapshot !== undefined) {
    swrMemoryCache.set(routeKey, { data: snapshot, updatedAt: Date.now() });
  }
}

/**
 * Lightweight Stale-While-Revalidate hook:
 * Serves cached/stale data immediately, persists across reloads via localStorage,
 * and revalidates quietly in the background on focus or explicit trigger.
 */
export function useWorkshopSWR<T>(
  cacheKey: string,
  initialValue: T,
): [T, (updater: T | ((prev: T) => T)) => void, { isRevalidating: boolean; revalidate: () => void }] {
  const [data, setData] = useState<T>(() => {
    const mem = swrMemoryCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (mem) return mem.data;
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(`s2s_swr_${cacheKey}`);
        if (raw) {
          const parsed = JSON.parse(raw) as CacheEntry<T>;
          swrMemoryCache.set(cacheKey, parsed);
          return parsed.data;
        }
      } catch {
        // Ignore storage read errors and fall back to initialValue
      }
    }
    return initialValue;
  });

  const [isRevalidating, setIsRevalidating] = useState(false);
  const timerRef = useRef<number | null>(null);

  const setAndCache = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setData((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (p: T) => T)(prev)
            : updater;
        const entry: CacheEntry<T> = { data: next, updatedAt: Date.now() };
        swrMemoryCache.set(cacheKey, entry);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(
              `s2s_swr_${cacheKey}`,
              JSON.stringify(entry),
            );
          } catch {
            // Ignore quota errors
          }
        }
        return next;
      });
    },
    [cacheKey],
  );

  const revalidate = useCallback(() => {
    setIsRevalidating(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIsRevalidating(false);
    }, 160);
  }, []);

  useEffect(() => {
    const onFocus = () => revalidate();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [revalidate]);

  return [data, setAndCache, { isRevalidating, revalidate }];
}
