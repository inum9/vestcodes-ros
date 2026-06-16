import { createHmac } from 'crypto';

const API = 'http://localhost:3000/api';
const SECRET = process.env.JWT_SECRET || 'replace_with_a_strong_secret';

function tableToken(tableId, restaurantId = 1) {
  return createHmac('sha256', SECRET).update(`${tableId}:${restaurantId}`).digest('hex').slice(0, 24);
}

async function json(method, path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

async function login(email, password) {
  const data = await json('POST', '/auth/login', { email, password });
  return data.accessToken;
}

const tableId = Number(process.env.FLOW_TABLE || 2);
const token = tableToken(tableId);

console.log(`Flow test — table ${tableId}\n`);

const order = await json('POST', '/orders', {
  tableId,
  tableToken: token,
  items: [{ menuItemId: 1, quantity: 1 }],
});
console.log('✓ Customer order', order.id, '→', order.status);

const floorToken = await login('floor@demo.com', 'floor123');
const approved = await json('PATCH', `/orders/${order.id}/approve`, null, floorToken);
console.log('✓ Floor approve →', approved.status);

const kitchenToken = await login('kitchen@demo.com', 'kitchen123');
const kitchenList = await json('GET', '/orders?status=approved', null, kitchenToken);
console.log('✓ Kitchen GET approved →', kitchenList.length, 'order(s)');

const prep = await json('PATCH', `/orders/${order.id}/advance`, null, kitchenToken);
console.log('✓ Kitchen advance →', prep.status);

const ready = await json('PATCH', `/orders/${order.id}/advance`, null, kitchenToken);
console.log('✓ Kitchen advance →', ready.status);

const served = await json('PATCH', `/orders/${order.id}/serve`, null, floorToken);
console.log('✓ Floor serve →', served.status);

console.log('\n✅ API end-to-end flow PASSED\n');
