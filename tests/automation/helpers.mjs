import { execFileSync } from 'node:child_process';

export const API_BASE = process.env.AUTOMATION_API_URL || 'http://localhost:4000/api';
export const PASSWORD = 'Password123!';

export function createContext() {
  const stamp = Date.now();
  return {
    stamp,
    userIds: [],
    productIds: [],
    orderIds: [],
    reviewIds: [],
    reportIds: [],
    tokens: {},
  };
}

export async function api(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: payload,
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, data, headers: response.headers };
}

export function sql(query) {
  return execFileSync(
    'docker',
    [
      'exec',
      '-i',
      'marketplace-postgres',
      'psql',
      '-U',
      'postgres',
      '-d',
      'ecommerce_TMN_db',
      '-t',
      '-A',
      '-F',
      '|',
    ],
    { input: query, encoding: 'utf8' },
  ).trim();
}

export async function register(ctx, prefix, name, role = 'CUSTOMER') {
  const email = `${prefix}_${ctx.stamp}@example.com`;
  const result = await api('/auth/register', {
    method: 'POST',
    body: { email, name: name ?? 'Automation User', password: PASSWORD, role },
  });
  if (result.status < 400 && result.data?.id) {
    ctx.userIds.push(result.data.id);
  }
  return { ...result, email };
}

export async function login(email) {
  const result = await api('/auth/login', {
    method: 'POST',
    body: { email, password: PASSWORD },
  });
  if (result.status >= 400) {
    throw new Error(`Login failed for ${email}: ${result.status} ${JSON.stringify(result.data)}`);
  }
  return result.data.accessToken;
}

export function pngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
}

export function inClause(ids) {
  return ids.map((id) => `'${id}'`).join(',');
}

export function cleanup(ctx) {
  const trySql = (query, label) => {
    try {
      sql(query);
    } catch (error) {
      console.warn(`Cleanup ${label} failed: ${error.message}`);
    }
  };

  if (ctx.reportIds.length > 0) {
    const ids = inClause(ctx.reportIds);
    trySql(`delete from "AuditLog" where "targetId" in (${ids});`, 'report audit logs');
    trySql(`delete from "ProductReport" where id in (${ids});`, 'reports');
  }
  if (ctx.reviewIds.length > 0) {
    const ids = inClause(ctx.reviewIds);
    trySql(`delete from "ReviewReply" where "reviewId" in (${ids});`, 'review replies');
    trySql(`delete from "Review" where id in (${ids});`, 'reviews');
  }
  if (ctx.orderIds.length > 0) {
    const ids = inClause(ctx.orderIds);
    trySql(
      `delete from "OrderChatMessage" where "chatId" in (select id from "OrderChat" where "orderId" in (${ids}));`,
      'order chat messages',
    );
    trySql(`delete from "OrderChat" where "orderId" in (${ids});`, 'order chats');
    trySql(`delete from "OrderItem" where "orderId" in (${ids});`, 'order items');
    trySql(`delete from "Transaction" where "orderId" in (${ids});`, 'transactions');
    trySql(`delete from "AuditLog" where "targetId" in (${ids});`, 'order audit logs');
    trySql(`delete from "Order" where id in (${ids});`, 'orders');
  }
  if (ctx.productIds.length > 0) {
    const ids = inClause(ctx.productIds);
    trySql(`delete from "Waitlist" where "productId" in (${ids});`, 'waitlist');
    trySql(`delete from "ProductReport" where "productId" in (${ids});`, 'product reports');
    trySql(`delete from "FlashSale" where "productId" in (${ids});`, 'flash sales');
    trySql(`delete from "AuditLog" where "targetId" in (${ids});`, 'product audit logs');
    trySql(`delete from "Product" where id in (${ids});`, 'products');
  }
  if (ctx.userIds.length > 0) {
    const ids = inClause(ctx.userIds);
    trySql(`delete from "AuditLog" where "adminId" in (${ids});`, 'admin audit logs');
    trySql(`delete from "User" where id in (${ids});`, 'users');
  }
}
