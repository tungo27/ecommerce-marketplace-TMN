import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

function run(command, label) {
  try {
    execSync(command, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`.split('\n').slice(-25).join('\n');
    assert.fail(`${label} failed:\n${output}`);
  }
}

function source(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

describe('Workspace checks for previously failing commands', () => {
  it('backend unit tests pass', () => {
    run('npm test --prefix backend -- --runInBand', 'backend unit tests');
  });

  it('backend e2e test command passes', () => {
    run('npm run test:e2e --prefix backend', 'backend e2e tests');
  });

  it('all workspace builds pass', () => {
    run('npm run build --prefix backend', 'backend build');
    run('npm run build --prefix frontend-storefront', 'storefront build');
    run('npm run build --prefix frontend-backoffice', 'backoffice build');
  });

  it('all workspace lint commands pass', () => {
    run('npm run lint --prefix backend', 'backend lint');
    run('npm run lint --prefix frontend-storefront', 'storefront lint');
    run('npm run lint --prefix frontend-backoffice', 'backoffice lint');
  });

  it('storefront strict typecheck passes', () => {
    run('npx tsc --noEmit -p frontend-storefront\\tsconfig.json', 'storefront typecheck');
  });

  it('bug-fix implementation invariants are still present', () => {
    const shipping = source('backend/src/common/constants/pricing.constants.ts');
    assert.match(shipping, /SHIPPING_FEE\s*=\s*30000/);

    const orders = source('backend/src/modules/orders/orders.service.ts');
    assert.match(orders, /shippingFeeApplied/);

    const cache = source('backend/src/common/cache/cache-invalidation.service.ts');
    assert.match(cache, /\.del\(/);
    const cacheCode = cache
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(cacheCode, /cacheManager\.clear\(/);

    const reviews = source('backend/src/modules/reviews/reviews.service.ts');
    assert.match(reviews, /isHidden/);

    const storefrontCart = source('frontend-storefront/src/hooks/useCart.ts');
    assert.match(storefrontCart, /shippingFee/);
    assert.match(storefrontCart, /grandTotal/);

    const storefrontAuth = source('frontend-storefront/src/hooks/useAuth.ts');
    const storefrontApi = source('frontend-storefront/src/utils/api.ts');
    assert.match(storefrontAuth, /userCookie/);
    assert.match(storefrontApi, /userCookie/);

    const editProduct = source('frontend-backoffice/src/pages/seller/EditProduct.tsx');
    assert.match(editProduct, /existingImages/);

    const adminApi = source('frontend-backoffice/src/hooks/useAdminApi.ts');
    assert.match(adminApi, /getReports/);
    assert.match(adminApi, /reviewReport/);
  });
});
