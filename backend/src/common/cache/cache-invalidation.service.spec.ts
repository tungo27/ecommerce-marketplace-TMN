import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheInvalidationService } from './cache-invalidation.service';

describe('CacheInvalidationService', () => {
  const buildService = async (cacheManager: unknown) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    return module.get(CacheInvalidationService);
  };

  it('deletes product URL keys from an iterable (memory) store', async () => {
    const deleted: string[] = [];
    const cacheManager = {
      del: jest.fn(async (key: string) => {
        deleted.push(key);
        return true;
      }),
      stores: [
        {
          iterator: async function* () {
            yield ['/api/products?page=1', {}];
            yield ['/api/products/abc', {}];
            yield ['/api/cart/user-1', {}];
          },
        },
      ],
    };

    const service = await buildService(cacheManager);
    await service.invalidateProductCaches('abc');

    expect(deleted).toEqual(
      expect.arrayContaining([
        '/api/products',
        'products_list',
        '/api/products/abc',
        'product_abc',
        '/api/products?page=1',
      ]),
    );
    expect(deleted).not.toContain('/api/cart/user-1');
  });

  it('falls back to the raw Redis adapter when Keyv delete is unsupported', async () => {
    const rawDel = jest.fn(async () => undefined);
    const cacheManager = {
      del: jest.fn(async () => {
        throw new TypeError('store.delete is not a function');
      }),
      stores: [
        {
          opts: {
            namespace: 'keyv',
            store: {
              keys: jest.fn(async () => [
                'keyv:/api/products?page=2',
                'keyv:/api/products/def',
                'keyv:/api/cart/user-2',
              ]),
              del: rawDel,
            },
          },
        },
      ],
    };

    const service = await buildService(cacheManager);
    await service.invalidateProductCaches('abc');

    expect(rawDel).toHaveBeenCalledWith('keyv:/api/products');
    expect(rawDel).toHaveBeenCalledWith('keyv:products_list');
    expect(rawDel).toHaveBeenCalledWith('keyv:/api/products/abc');
    expect(rawDel).toHaveBeenCalledWith('keyv:product_abc');
    expect(rawDel).toHaveBeenCalledWith('keyv:/api/products?page=2');
    expect(rawDel).toHaveBeenCalledWith('keyv:/api/products/def');
    expect(rawDel).not.toHaveBeenCalledWith('keyv:/api/cart/user-2');
  });
});
