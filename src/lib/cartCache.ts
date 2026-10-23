/**
 * Cart cache: browser localStorage, user + locale scoped.
 */

const CART_CACHE_KEY_PREFIX = "camion_cart_cache_";
const CART_CACHE_VERSION = "1.0";
const CACHE_DURATION = 5 * 60 * 1000;

function getCacheKey(userId: string, locale: string): string {
  return `${CART_CACHE_KEY_PREFIX}${userId}_${locale}`;
}

type StoredEnvelope = {
  version: string;
  timestamp: number;
  data: unknown;
};

export function getCachedCart(userId: string, locale: string): unknown | null {
  if (!userId || !locale) {
    return null;
  }

  try {
    const cacheKey = getCacheKey(userId, locale);
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      return null;
    }

    const parsed = JSON.parse(cachedData) as StoredEnvelope;

    if (parsed.version !== CART_CACHE_VERSION) {
      clearCachedCart(userId, locale);
      return null;
    }

    const now = Date.now();
    if (now - parsed.timestamp > CACHE_DURATION) {
      clearCachedCart(userId, locale);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error("Error reading cart cache:", error);
    if (userId && locale) {
      clearCachedCart(userId, locale);
    }
    return null;
  }
}

export function setCachedCart(
  userId: string,
  locale: string,
  cartData: unknown,
): void {
  if (!userId || !locale) {
    return;
  }

  try {
    const cacheKey = getCacheKey(userId, locale);
    const cacheData: StoredEnvelope = {
      version: CART_CACHE_VERSION,
      timestamp: Date.now(),
      data: cartData,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error: unknown) {
    console.error("Error setting cart cache:", error);
    if (
      error instanceof Error &&
      error.name === "QuotaExceededError"
    ) {
      console.warn("LocalStorage quota exceeded, clearing old cache entries");
      clearAllCartCaches();
    }
  }
}

export function clearCachedCart(userId: string, locale: string): void {
  if (!userId || !locale) {
    return;
  }

  try {
    const cacheKey = getCacheKey(userId, locale);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error("Error clearing cart cache:", error);
  }
}

export function clearAllCartCaches(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CART_CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing all cart caches:", error);
  }
}

export function invalidateUserCartCache(userId: string): void {
  if (!userId) {
    return;
  }

  try {
    const keys = Object.keys(localStorage);
    const userCachePrefix = `${CART_CACHE_KEY_PREFIX}${userId}_`;
    keys.forEach((key) => {
      if (key.startsWith(userCachePrefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error invalidating user cart cache:", error);
  }
}

export function isCacheValid(userId: string, locale: string): boolean {
  return getCachedCart(userId, locale) !== null;
}
