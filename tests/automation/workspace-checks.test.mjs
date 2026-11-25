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

/** Source code with comments removed, for checks that must ignore documentation. */
function code(relativePath) {
  return source(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
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
    // BUG_02 — shipping fee and grand total.
    assert.match(
      code('backend/src/common/constants/pricing.constants.ts'),
      /SHIPPING_FEE\s*=\s*30000/,
    );
    const orders = code('backend/src/modules/orders/orders.service.ts');
    assert.match(orders, /shippingFeeApplied/);
    assert.match(orders, /totalAmount:\s*orderTotal/);
    assert.match(code('frontend-storefront/src/hooks/useCart.ts'), /DEFAULT_SHIPPING_FEE\s*=\s*30000/);
    assert.match(code('frontend-storefront/src/app/cart/page.tsx'), /shippingFee/);
    assert.match(code('frontend-storefront/src/app/cart/page.tsx'), /grandTotal/);
    assert.match(code('frontend-storefront/src/app/(protected)/checkout/page.tsx'), /grandTotal/);

    // BUG-REV-001/002/003 — hidden reviews, rating, cache invalidation.
    assert.match(code('backend/src/modules/reviews/reviews.service.ts'), /isHidden:\s*false/);
    assert.match(code('backend/src/modules/admin/admin.service.ts'), /recalculateProductRating/);
    const cache = code('backend/src/common/cache/cache-invalidation.service.ts');
    assert.match(cache, /\.del\(/);
    assert.doesNotMatch(cache, /cacheManager\.clear\(/);
    assert.match(cache, /invalidateCategoryCaches/);

    // BUG-REG-001/002 — trim and max length.
    const registerDto = code('backend/src/auth/dto/register.dto.ts');
    assert.match(registerDto, /@Transform/);
    assert.match(registerDto, /@MaxLength\(100/);

    // BUG-LOGIN-001 — status check must come after password comparison.
    const authService = code('backend/src/auth/auth.service.ts');
    assert.ok(
      authService.indexOf('bcrypt.compare') < authService.indexOf('if (!user.isActive)'),
      'isActive check must run after password verification',
    );

    // Banned accounts must be rejected on every authenticated request.
    const jwtStrategy = code('backend/src/auth/strategies/jwt.strategy.ts');
    assert.match(jwtStrategy, /prisma\.user\.findUnique/);
    assert.match(jwtStrategy, /!user\.isActive/);

    // BUG-LOGIN-002 — cookies cleared on logout and on 401.
    for (const file of [
      'frontend-storefront/src/hooks/useAuth.ts',
      'frontend-storefront/src/utils/api.ts',
    ]) {
      const authCode = code(file);
      assert.match(authCode, /userCookie/);
      assert.match(authCode, /expires=Thu,\s*01 Jan 1970/);
    }
    assert.match(code('frontend-storefront/src/components/Header.tsx'), /logout\(\)/);

    // BUG-PROD-001/002 — categoryId, multipart, stale category validation.
    assert.match(code('backend/src/modules/products/dtos/create-product.dto.ts'), /categoryId!/);
    assert.match(code('backend/src/modules/products/dtos/create-product.dto.ts'), /@Allow\(\)/);
    assert.match(
      code('backend/src/modules/products/products.service.ts'),
      /Selected category is no longer available/,
    );
    const productsController = code('backend/src/modules/products/products.controller.ts');
    assert.equal(
      (productsController.match(/FilesInterceptor\('images', 5\)/g) ?? []).length,
      2,
      'both POST and PUT must parse multipart images',
    );
    const createProduct = code('frontend-backoffice/src/pages/seller/CreateProduct.tsx');
    assert.match(createProduct, /append\('categoryId'/);
    assert.match(createProduct, /useCategories/);
    assert.doesNotMatch(createProduct, /multipart\/form-data/);
    const editProduct = code('frontend-backoffice/src/pages/seller/EditProduct.tsx');
    assert.match(editProduct, /append\('categoryId'/);
    assert.match(editProduct, /existingImages/);
    assert.match(code('frontend-backoffice/src/hooks/useCategories.ts'), /extractCategories/);

    // A JSON default header used to turn FormData into JSON and drop files.
    assert.doesNotMatch(
      code('frontend-backoffice/src/utils/api.ts'),
      /'Content-Type':\s*'application\/json'/,
    );

    // Validation errors should expose field details, not just "Validation failed".
    assert.match(code('backend/src/common/filters/global-exception.filter.ts'), /details \|\| 'Validation failed'/);

    // Admin category creation without a slug.
    assert.match(code('backend/src/modules/categories/dtos/create-category.dto.ts'), /slug\?: string/);
    assert.match(code('backend/src/modules/categories/categories.service.ts'), /invalidatePublicCategories/);

    const adminApi = code('frontend-backoffice/src/hooks/useAdminApi.ts');
    assert.match(adminApi, /getReports/);
    assert.match(adminApi, /reviewReport/);
  });
});
