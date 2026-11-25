import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import {
  API_BASE,
  PASSWORD,
  api,
  cleanup,
  createContext,
  login,
  pngBuffer,
  register,
  sql,
} from './helpers.mjs';

/** Assert a response status with a useful failure message. */
function expectStatus(result, expected, label) {
  assert.equal(
    result.status,
    expected,
    `${label}: expected ${expected}, got ${result.status} ${JSON.stringify(result.data)}`,
  );
}

function newProductForm(name, categoryId, { withTextImagesField = false } = {}) {
  const form = new FormData();
  form.append('name', name);
  form.append('description', 'Created by the automated regression suite.');
  form.append('price', '123456');
  form.append('categoryId', categoryId);
  form.append('stock', '10');
  form.append('images', new Blob([pngBuffer()], { type: 'image/png' }), 'pixel.png');
  if (withTextImagesField) {
    // Regression: some clients also send `images` in the body. The DTO must
    // whitelist it instead of failing with "Property images should not exist".
    form.append('images', '{}');
  }
  return form;
}

describe('Validated bug regressions (API)', () => {
  const ctx = createContext();
  const state = {};

  before(async () => {
    const seller = await register(ctx, 'auto_seller', 'Automation Seller', 'SELLER');
    expectStatus(seller, 201, 'seller setup');
    state.sellerToken = await login(seller.email);

    const admin = await register(ctx, 'auto_admin', 'Automation Admin', 'CUSTOMER');
    expectStatus(admin, 201, 'admin setup');
    state.admin = admin;
    sql(`update "User" set role = 'ADMIN' where id = '${admin.data.id}';`);
    state.adminToken = await login(admin.email);

    const customer = await register(ctx, 'auto_customer', '  Automation Customer  ', 'CUSTOMER');
    expectStatus(customer, 201, 'customer setup');
    state.customerEmail = customer.email;
    state.customer = customer;
    state.customerToken = await login(customer.email);

    state.categoryId = sql(
      `select id from "Category" where "isActive" = true order by name limit 1;`,
    );
    assert.ok(state.categoryId, 'no active category available for product setup');
    state.secondCategoryId = sql(
      `select id from "Category" where "isActive" = true and id <> '${state.categoryId}' order by name limit 1;`,
    );
    assert.ok(state.secondCategoryId, 'need at least two active categories');

    state.createdProduct = await api('/seller/products', {
      method: 'POST',
      token: state.sellerToken,
      body: newProductForm(`Automation Product ${ctx.stamp}`, state.categoryId),
    });
    expectStatus(state.createdProduct, 201, 'product setup');
    state.productId = state.createdProduct.data.id;
    ctx.productIds.push(state.productId);
    sql(`update "Product" set status = 'Published' where id = '${state.productId}';`);
  });

  after(() => {
    cleanup(ctx);
  });

  // -------------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------------

  it('BUG-REG-001 rejects a name made only of whitespace', async () => {
    const result = await register(ctx, 'auto_blank', '     ');
    assert.equal(result.status, 400, JSON.stringify(result.data));
    assert.ok(
      JSON.stringify(result.data).includes('name'),
      `expected a field error for name, got ${JSON.stringify(result.data)}`,
    );
  });

  it('BUG-REG-001 trims registration name before persisting', () => {
    const stored = sql(
      `select email || '|' || name from "User" where id = '${state.customer.data.id}';`,
    );
    assert.equal(stored, `${state.customerEmail}|Automation Customer`);
  });

  it('BUG-REG-002 rejects names longer than 100 characters', async () => {
    const result = await register(ctx, 'auto_longname', 'a'.repeat(101));
    assert.equal(result.status, 400, JSON.stringify(result.data));
  });

  // -------------------------------------------------------------------------
  // Login / banned accounts
  // -------------------------------------------------------------------------

  it('BUG-LOGIN-001 checks the password before the disabled status', async () => {
    // Reuse the generated admin account: /auth/register is throttled to 5/min.
    const disabled = state.admin;
    sql(`update "User" set "isActive" = false where id = '${disabled.data.id}';`);
    try {
      const wrongPassword = await api('/auth/login', {
        method: 'POST',
        body: { email: disabled.email, password: 'WrongPassword123' },
      });
      assert.equal(wrongPassword.status, 401, JSON.stringify(wrongPassword.data));
      assert.equal(
        wrongPassword.data.message,
        'Invalid credentials',
        'disabled status must not be revealed before verifying the password',
      );

      const rightPassword = await api('/auth/login', {
        method: 'POST',
        body: { email: disabled.email, password: PASSWORD },
      });
      assert.equal(rightPassword.status, 401, JSON.stringify(rightPassword.data));
      assert.match(rightPassword.data.message, /disabled/i);
    } finally {
      sql(`update "User" set "isActive" = true where id = '${disabled.data.id}';`);
    }
  });

  it('banned accounts cannot keep using an already issued JWT', async () => {
    const token = state.customerToken;
    sql(`update "User" set "isActive" = false where id = '${state.customer.data.id}';`);
    try {
      const result = await api('/cart', { token });
      assert.equal(result.status, 401, JSON.stringify(result.data));
      assert.match(result.data.message, /disabled|no longer exists/i);
    } finally {
      sql(`update "User" set "isActive" = true where id = '${state.customer.data.id}';`);
    }
  });

  // -------------------------------------------------------------------------
  // Product creation / update
  // -------------------------------------------------------------------------

  it('BUG-PROD-001 creates a product with categoryId and a multipart image', () => {
    const result = state.createdProduct;
    assert.equal(result.data.categoryId, state.categoryId);
    assert.ok(
      Array.isArray(result.data.images) && result.data.images.length > 0,
      'uploaded image was not persisted',
    );
  });

  it('BUG-PROD-001 accepts an extra images field in the multipart body', async () => {
    const result = await api('/seller/products', {
      method: 'POST',
      token: state.sellerToken,
      body: newProductForm(
        `Automation Product Extra Images ${ctx.stamp}`,
        state.categoryId,
        { withTextImagesField: true },
      ),
    });
    expectStatus(result, 201, 'extra images field');
    ctx.productIds.push(result.data.id);
    assert.equal(result.data.categoryId, state.categoryId);
  });

  it('BUG-PROD-001 rejects a stale category id with a clear message', async () => {
    const result = await api('/seller/products', {
      method: 'POST',
      token: state.sellerToken,
      body: newProductForm('Stale Category Product', '00000000-0000-0000-0000-000000000000'),
    });
    assert.equal(result.status, 400, JSON.stringify(result.data));
    assert.match(result.data.message, /category/i);
  });

  it('BUG-PROD-002 updates a product with existing + new images', async () => {
    const firstImage = state.createdProduct.data.images?.[0];
    assert.ok(firstImage, 'setup product has no image');

    const form = new FormData();
    form.append('name', `Automation Product ${ctx.stamp} Updated`);
    form.append('description', 'Updated by the automated regression suite.');
    form.append('price', '150000');
    form.append('categoryId', state.secondCategoryId);
    form.append('stock', '9');
    form.append('existingImages', firstImage);
    form.append('images', new Blob([pngBuffer()], { type: 'image/png' }), 'pixel2.png');

    const result = await api(`/seller/products/${state.productId}`, {
      method: 'PUT',
      token: state.sellerToken,
      body: form,
    });
    expectStatus(result, 200, 'product update');
    assert.equal(result.data.name, `Automation Product ${ctx.stamp} Updated`);
    assert.equal(result.data.categoryId, state.secondCategoryId);
    assert.equal(result.data.images.length, 2);

    // Updates reset the product to draft; republish it for cart/review checks.
    sql(`update "Product" set status = 'Published' where id = '${state.productId}';`);
  });

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------

  it('admin can create a category without supplying a slug', async () => {
    const result = await api('/categories', {
      method: 'POST',
      token: state.adminToken,
      body: { name: `Automation Category ${ctx.stamp}`, description: 'generated by tests' },
    });
    expectStatus(result, 201, 'category creation');
    ctx.categoryIds.push(result.data.id);
    assert.ok(result.data.slug, 'slug was not generated');

    const list = await api('/categories');
    expectStatus(list, 200, 'public categories');
    assert.ok(
      list.data.some((category) => category.id === result.data.id),
      'new category is missing from the public list (stale cache)',
    );
  });

  // -------------------------------------------------------------------------
  // BUG_02 — shipping fee / grand total
  // -------------------------------------------------------------------------

  it('BUG_02 empty cart reports zero shipping and zero grand total', async () => {
    const result = await api('/cart', { token: state.customerToken });
    expectStatus(result, 200, 'empty cart');
    assert.equal(result.data.shippingFee, 0);
    assert.equal(result.data.grandTotal, 0);
  });

  it('BUG_02 cart reports one 30000 shipping fee', async () => {
    const result = await api('/cart/update', {
      method: 'POST',
      token: state.customerToken,
      body: { productId: state.productId, quantity: 1 },
    });
    expectStatus(result, 200, 'cart update');
    assert.equal(result.data.shippingFee, 30000);
    assert.ok(
      Math.abs(result.data.grandTotal - (result.data.totalCartPrice + 30000)) < 0.01,
      `subtotal=${result.data.totalCartPrice} grand=${result.data.grandTotal}`,
    );
    state.cartGrandTotal = result.data.grandTotal;
  });

  it('BUG_02 checkout persists shipping once across seller orders', async () => {
    const result = await api('/orders/checkout', {
      method: 'POST',
      token: state.customerToken,
      body: {
        shippingAddress: '123 Automation Street, District 1',
        phoneNumber: '0900000000',
        paymentMethod: 'COD',
      },
    });
    expectStatus(result, 201, 'checkout');
    const orders = result.data?.data;
    assert.ok(Array.isArray(orders) && orders.length > 0, JSON.stringify(result.data));
    // Track every created order before making assertions so cleanup can remove
    // them even when a later check fails.
    for (const order of orders) ctx.orderIds.push(order.id);
    state.orderId = orders[0].id;
    state.orderTotal = Number(orders[0].totalAmount);
    const sum = orders.reduce((total, order) => total + Number(order.totalAmount), 0);
    assert.ok(
      Math.abs(sum - state.cartGrandTotal) < 0.01,
      `orders=${sum} cart=${state.cartGrandTotal}`,
    );
    sql(`update "Order" set status = 'DELIVERED' where id = '${state.orderId}';`);
  });

  it('BUG_02 order history shows the persisted grand total', async () => {
    const result = await api('/orders/my-orders', { token: state.customerToken });
    expectStatus(result, 200, 'order history');
    const rows = result.data?.data?.items ?? result.data?.items ?? result.data?.data ?? [];
    assert.ok(Array.isArray(rows), JSON.stringify(result.data));
    const order = rows.find((entry) => entry.orderId === state.orderId);
    assert.ok(order, `order ${state.orderId} missing from history`);
    assert.equal(Number(order.totalPrice), state.orderTotal);
  });

  // -------------------------------------------------------------------------
  // BUG-REV-001/002/003 — hidden reviews, rating, cache invalidation
  // -------------------------------------------------------------------------

  it('BUG-REV-001/003 creating a review recomputes rating and invalidates cache', async () => {
    assert.ok(state.orderId, 'checkout did not produce an order');
    const warmup = await api(`/products/${state.productId}`);
    expectStatus(warmup, 200, 'warm product cache');
    const warmed = await api(`/products/${state.productId}`);
    assert.equal(warmed.headers.get('x-cache'), 'HIT');

    const review = await api(`/products/${state.productId}/reviews`, {
      method: 'POST',
      token: state.customerToken,
      body: { orderId: state.orderId, rating: 5, comment: 'Automation review one' },
    });
    expectStatus(review, 201, 'first review');
    ctx.reviewIds.push(review.data.id);
    state.reviewOneId = review.data.id;

    const product = await api(`/products/${state.productId}`);
    assert.equal(Number(product.data.averageRating), 5);
    assert.equal(product.headers.get('x-cache'), 'MISS');
  });

  it('BUG-REV-002/003 hiding a review excludes it and invalidates cache', async () => {
    const cart = await api('/cart/update', {
      method: 'POST',
      token: state.customerToken,
      body: { productId: state.productId, quantity: 1 },
    });
    expectStatus(cart, 200, 'second cart update');
    const checkout = await api('/orders/checkout', {
      method: 'POST',
      token: state.customerToken,
      body: {
        shippingAddress: '456 Automation Street, District 2',
        phoneNumber: '0900000000',
        paymentMethod: 'BANK_TRANSFER',
      },
    });
    expectStatus(checkout, 201, 'second checkout');
    const orders = checkout.data?.data;
    assert.ok(Array.isArray(orders) && orders.length > 0, JSON.stringify(checkout.data));
    const secondOrderId = orders[0].id;
    ctx.orderIds.push(secondOrderId);
    sql(`update "Order" set status = 'DELIVERED' where id = '${secondOrderId}';`);

    const secondReview = await api(`/products/${state.productId}/reviews`, {
      method: 'POST',
      token: state.customerToken,
      body: { orderId: secondOrderId, rating: 1, comment: 'Automation review two' },
    });
    expectStatus(secondReview, 201, 'second review');
    ctx.reviewIds.push(secondReview.data.id);

    const both = await api(`/products/${state.productId}`);
    assert.ok(Math.abs(Number(both.data.averageRating) - 3) < 0.001);

    await api(`/products/${state.productId}`);
    const hide = await api(`/admin/reviews/${state.reviewOneId}/toggle-hide`, {
      method: 'PATCH',
      token: state.adminToken,
    });
    expectStatus(hide, 200, 'hide review');

    const afterHide = await api(`/products/${state.productId}`);
    assert.ok(Math.abs(Number(afterHide.data.averageRating) - 1) < 0.001);
    assert.equal(afterHide.headers.get('x-cache'), 'MISS');

    const publicReviews = await api(`/products/${state.productId}/reviews`);
    expectStatus(publicReviews, 200, 'public reviews');
    assert.ok(
      Array.isArray(publicReviews.data) &&
        publicReviews.data.every((review) => review.id !== state.reviewOneId),
      'hidden review still returned by the public endpoint',
    );

    const unhide = await api(`/admin/reviews/${state.reviewOneId}/toggle-hide`, {
      method: 'PATCH',
      token: state.adminToken,
    });
    expectStatus(unhide, 200, 'unhide review');
    const afterUnhide = await api(`/products/${state.productId}`);
    assert.ok(Math.abs(Number(afterUnhide.data.averageRating) - 3) < 0.001);
    assert.equal(afterUnhide.headers.get('x-cache'), 'MISS');
  });

  // -------------------------------------------------------------------------
  // Remaining contract checks
  // -------------------------------------------------------------------------

  it('report endpoints still match the backend contract', async () => {
    const report = await api('/reports', {
      method: 'POST',
      token: state.customerToken,
      body: {
        productId: state.productId,
        reason: 'Automation reason',
        description: 'Automation report description',
      },
    });
    expectStatus(report, 201, 'create report');
    ctx.reportIds.push(report.data.id);

    const list = await api('/reports', { token: state.adminToken });
    expectStatus(list, 200, 'list reports');
    assert.ok(Array.isArray(list.data), JSON.stringify(list.data));
    assert.ok(list.data.some((entry) => entry.id === report.data.id));

    const reviewed = await api(`/reports/${report.data.id}/review`, {
      method: 'PATCH',
      token: state.adminToken,
      body: { status: 'REJECTED', adminNote: 'Automation verification' },
    });
    expectStatus(reviewed, 200, 'review report');
    assert.equal(reviewed.data.status, 'REJECTED');
  });

  it('automation API base URL is configured', () => {
    assert.match(API_BASE, /^https?:\/\//);
  });
});
