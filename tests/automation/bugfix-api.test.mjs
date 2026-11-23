import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import {
  api,
  cleanup,
  createContext,
  login,
  pngBuffer,
  register,
  sql,
} from './helpers.mjs';

describe('Validated bug regressions (API)', () => {
  const ctx = createContext();
  const state = {};

  before(async () => {
    const seller = await register(ctx, 'auto_seller', 'Automation Seller', 'SELLER');
    assert.ok(seller.status < 400, `seller setup failed: ${seller.status}`);
    state.sellerToken = await login(seller.email);

    const admin = await register(ctx, 'auto_admin', 'Automation Admin', 'CUSTOMER');
    assert.ok(admin.status < 400, `admin setup failed: ${admin.status}`);
    sql(`update "User" set role = 'ADMIN' where id = '${admin.data.id}';`);
    state.adminToken = await login(admin.email);

    const customer = await register(ctx, 'auto_customer', '  Automation Customer  ', 'CUSTOMER');
    assert.ok(customer.status < 400, `customer setup failed: ${customer.status}`);
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

    const form = new FormData();
    form.append('name', `Automation Product ${ctx.stamp}`);
    form.append('description', 'Created by the automated regression suite.');
    form.append('price', '123456');
    form.append('categoryId', state.categoryId);
    form.append('stock', '10');
    form.append('images', new Blob([pngBuffer()], { type: 'image/png' }), 'pixel.png');

    state.createdProduct = await api('/seller/products', {
      method: 'POST',
      token: state.sellerToken,
      body: form,
    });
    if (state.createdProduct.status < 400) {
      state.productId = state.createdProduct.data.id;
      ctx.productIds.push(state.productId);
      sql(`update "Product" set status = 'Published' where id = '${state.productId}';`);
    } else {
      state.productId = sql(
        `select p.id from "Product" p left join "Review" r on r."productId" = p.id
         where p.status = 'Published' and p.stock >= 5
         group by p.id having count(r.id) = 0 order by p.id limit 1;`,
      );
    }
    assert.ok(state.productId, 'no product available for cart/review checks');
  });

  after(() => {
    cleanup(ctx);
  });

  it('BUG-REG-001 trims registration email/name', () => {
    const stored = sql(
      `select email || '|' || name from "User" where id = '${state.customer.data.id}';`,
    );
    assert.equal(stored, `${state.customerEmail}|Automation Customer`);
  });

  it('BUG-REG-002 rejects names longer than 100 characters', async () => {
    const result = await register(ctx, 'auto_longname', 'a'.repeat(101));
    assert.equal(result.status, 400);
  });

  it('BUG-LOGIN-001 rejects disabled accounts', async () => {
    const disabled = await register(ctx, 'auto_disabled', 'Disabled User');
    assert.ok(disabled.status < 400);
    sql(`update "User" set "isActive" = false where id = '${disabled.data.id}';`);
    const result = await api('/auth/login', {
      method: 'POST',
      body: { email: disabled.email, password: 'Password123!' },
    });
    assert.equal(result.status, 401);
  });

  it('BUG-PROD-001 creates a product with categoryId and multipart image', () => {
    const result = state.createdProduct;
    assert.ok(result.status < 400, JSON.stringify(result.data));
    if (state.createdProduct.data.id === state.productId) {
      assert.equal(result.data.categoryId, state.categoryId);
      assert.ok(Array.isArray(result.data.images) && result.data.images.length > 0);
    }
  });

  it('BUG-PROD-002 updates a product with existing + new images', async () => {
    const firstImage = state.createdProduct.data.images?.[0];
    if (!firstImage || !state.secondCategoryId) {
      assert.ok(state.createdProduct.data.id !== state.productId, 'product setup did not provide a second category');
      return;
    }

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
    assert.ok(result.status < 400, JSON.stringify(result.data));
    assert.equal(result.data.name, `Automation Product ${ctx.stamp} Updated`);
    assert.equal(result.data.categoryId, state.secondCategoryId);
    assert.equal(result.data.images.length, 2);

    // Updating a product resets it to a draft; republish it so the storefront
    // cart/review/report flows below can use the same generated product.
    sql(`update "Product" set status = 'Published' where id = '${state.productId}';`);
  });

  it('BUG_02 empty cart reports zero shipping and zero grand total', async () => {
    const result = await api('/cart', { token: state.customerToken });
    assert.equal(result.status, 200);
    assert.equal(result.data.shippingFee, 0);
    assert.equal(result.data.grandTotal, 0);
  });

  it('BUG_02 cart reports a single 30000 shipping fee', async () => {
    const result = await api('/cart/update', {
      method: 'POST',
      token: state.customerToken,
      body: { productId: state.productId, quantity: 1 },
    });
    assert.ok(result.status < 400, JSON.stringify(result.data));
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
    assert.ok(result.status < 400, JSON.stringify(result.data));
    const orders = result.data?.data;
    assert.ok(Array.isArray(orders) && orders.length > 0);
    const sum = orders.reduce((total, order) => total + Number(order.totalAmount), 0);
    assert.ok(Math.abs(sum - state.cartGrandTotal) < 0.01, `orders=${sum} cart=${state.cartGrandTotal}`);
    state.orderId = orders[0].id;
    ctx.orderIds.push(state.orderId);
    sql(`update "Order" set status = 'DELIVERED' where id = '${state.orderId}';`);
  });

  it('BUG-REV-001/003 creating a review recomputes rating and invalidates cache', async () => {
    assert.ok(state.orderId, 'checkout did not produce an order');
    await api(`/products/${state.productId}`);
    const warmed = await api(`/products/${state.productId}`);
    assert.equal(warmed.headers.get('x-cache'), 'HIT');

    const review = await api(`/products/${state.productId}/reviews`, {
      method: 'POST',
      token: state.customerToken,
      body: { orderId: state.orderId, rating: 5, comment: 'Automation review one' },
    });
    assert.ok(review.status < 400, JSON.stringify(review.data));
    ctx.reviewIds.push(review.data.id);
    state.reviewOneId = review.data.id;

    const product = await api(`/products/${state.productId}`);
    assert.equal(Number(product.data.averageRating), 5);
    assert.equal(product.headers.get('x-cache'), 'MISS');
  });

  it('BUG-REV-002/003 hiding a review excludes it and invalidates cache', async () => {
    assert.ok(state.reviewOneId, 'first review was not created');
    const cart = await api('/cart/update', {
      method: 'POST',
      token: state.customerToken,
      body: { productId: state.productId, quantity: 1 },
    });
    assert.ok(cart.status < 400, JSON.stringify(cart.data));
    const checkout = await api('/orders/checkout', {
      method: 'POST',
      token: state.customerToken,
      body: {
        shippingAddress: '456 Automation Street, District 2',
        phoneNumber: '0900000000',
        paymentMethod: 'BANK_TRANSFER',
      },
    });
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
    assert.ok(secondReview.status < 400, JSON.stringify(secondReview.data));
    ctx.reviewIds.push(secondReview.data.id);

    const both = await api(`/products/${state.productId}`);
    assert.ok(Math.abs(Number(both.data.averageRating) - 3) < 0.001);

    await api(`/products/${state.productId}`);
    const hide = await api(`/admin/reviews/${state.reviewOneId}/toggle-hide`, {
      method: 'PATCH',
      token: state.adminToken,
    });
    assert.ok(hide.status < 400, JSON.stringify(hide.data));

    const afterHide = await api(`/products/${state.productId}`);
    assert.ok(Math.abs(Number(afterHide.data.averageRating) - 1) < 0.001);
    assert.equal(afterHide.headers.get('x-cache'), 'MISS');

    const publicReviews = await api(`/products/${state.productId}/reviews`);
    assert.ok(
      Array.isArray(publicReviews.data) &&
        publicReviews.data.every((review) => review.id !== state.reviewOneId),
    );

    const unhide = await api(`/admin/reviews/${state.reviewOneId}/toggle-hide`, {
      method: 'PATCH',
      token: state.adminToken,
    });
    assert.ok(unhide.status < 400);
    const afterUnhide = await api(`/products/${state.productId}`);
    assert.ok(Math.abs(Number(afterUnhide.data.averageRating) - 3) < 0.001);
    assert.equal(afterUnhide.headers.get('x-cache'), 'MISS');
  });

  it('remaining backoffice report endpoints match the backend contract', async () => {
    const report = await api('/reports', {
      method: 'POST',
      token: state.customerToken,
      body: {
        productId: state.productId,
        reason: 'Automation reason',
        description: 'Automation report description',
      },
    });
    assert.ok(report.status < 400, JSON.stringify(report.data));
    ctx.reportIds.push(report.data.id);

    const list = await api('/reports', { token: state.adminToken });
    assert.ok(Array.isArray(list.data), JSON.stringify(list.data));
    assert.ok(list.data.some((entry) => entry.id === report.data.id));

    const reviewed = await api(`/reports/${report.data.id}/review`, {
      method: 'PATCH',
      token: state.adminToken,
      body: { status: 'REJECTED', adminNote: 'Automation verification' },
    });
    assert.ok(reviewed.status < 400, JSON.stringify(reviewed.data));
    assert.equal(reviewed.data.status, 'REJECTED');
  });
});
