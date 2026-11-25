import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

interface RawStoreWithKeys {
  keys?: (pattern?: string) => Promise<string[]>;
  del?: (key: string) => Promise<unknown>;
  delete?: (key: string) => Promise<unknown>;
}

interface KeyvLikeStore {
  iterator?: () => AsyncGenerator<[string, unknown], void, unknown>;
  delete?: (key: string) => Promise<unknown>;
  del?: (key: string) => Promise<unknown>;
  opts?: {
    namespace?: string;
    store?: RawStoreWithKeys | Map<string, unknown>;
  };
}

/**
 * Invalidates cached product responses created by `CacheInterceptor`.
 *
 * The interceptor uses the raw request URL as the cache key (e.g.
 * `/api/products?page=1` or `/api/products/<id>`), so every product-related key
 * has to be removed explicitly. `cacheManager.clear()` is deliberately avoided:
 * it would also wipe unrelated entries (and with Redis, the whole database).
 */
@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async invalidateProductCaches(productId?: string): Promise<void> {
    const keysToDelete = new Set<string>();

    if (productId) {
      keysToDelete.add(`/api/products/${productId}`);
      keysToDelete.add(`product_${productId}`);
    }
    keysToDelete.add('/api/products');
    keysToDelete.add('products_list');

    for (const key of keysToDelete) {
      await this.deleteKey(key);
    }

    for (const store of this.getStores()) {
      const matchingKeys = await this.collectProductKeys(store);
      for (const key of matchingKeys) {
        await this.deleteKey(key);
      }
    }
  }

  /**
   * The public category list is cached under an explicit CacheInterceptor key.
   * Without this, a stale (possibly empty) list keeps showing in seller forms.
   */
  async invalidateCategoryCaches(): Promise<void> {
    await this.deleteKey('public_categories');
  }

  private getStores(): KeyvLikeStore[] {
    const stores = (this.cacheManager as unknown as { stores?: KeyvLikeStore[] })
      .stores;
    return Array.isArray(stores) ? stores : [];
  }

  private async collectProductKeys(store: KeyvLikeStore): Promise<string[]> {
    // Memory / iterable Keyv adapters expose an async iterator that yields
    // unprefixed keys.
    if (typeof store.iterator === 'function') {
      const matchingKeys: string[] = [];
      for await (const entry of store.iterator()) {
        const key = Array.isArray(entry) ? entry[0] : entry;
        if (typeof key === 'string' && this.isProductCacheKey(key)) {
          matchingKeys.push(key);
        }
      }
      return matchingKeys;
    }

    // The Redis adapter has no iterator but exposes `keys(pattern)`, which
    // returns raw keys including the Keyv namespace prefix.
    const rawStore = store.opts?.store as RawStoreWithKeys | undefined;
    if (!rawStore || typeof rawStore.keys !== 'function') {
      return [];
    }

    const namespace = store.opts?.namespace ? `${store.opts.namespace}:` : '';
    const rawKeys = await rawStore.keys('*');
    const matchingKeys: string[] = [];

    for (const rawKey of rawKeys) {
      if (typeof rawKey !== 'string') {
        continue;
      }
      const key =
        namespace && rawKey.startsWith(namespace)
          ? rawKey.slice(namespace.length)
          : rawKey;
      if (this.isProductCacheKey(key)) {
        matchingKeys.push(key);
      }
    }

    return matchingKeys;
  }

  private isProductCacheKey(key: string): boolean {
    return (
      key === 'products_list' ||
      key.startsWith('product_') ||
      key.startsWith('/api/products') ||
      key.startsWith('products:')
    );
  }

  private async deleteKey(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      return;
    } catch {
      // cache-manager v7 wraps stores in Keyv, whose delete() calls
      // `store.delete()`. cache-manager-redis-yet only implements `del()`, so
      // deletion has to be performed on the raw adapter with the Keyv namespace.
    }

    for (const store of this.getStores()) {
      try {
        const rawStore = store.opts?.store as RawStoreWithKeys | undefined;
        if (rawStore && typeof rawStore.del === 'function') {
          const namespace = store.opts?.namespace
            ? `${store.opts.namespace}:`
            : '';
          await rawStore.del(`${namespace}${key}`);
        } else if (typeof store.delete === 'function') {
          await store.delete(key);
        } else if (typeof store.del === 'function') {
          await store.del(key);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to invalidate cache key "${key}" on store: ${message}`,
        );
      }
    }
  }
}
