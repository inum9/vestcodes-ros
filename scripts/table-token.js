// save as scripts/table-token.js and run: node scripts/table-token.js
import { createHmac } from 'crypto';

const secret = 'replace_with_a_strong_secret'; // same as backend JWT_SECRET
const tableId = 1;
const restaurantId = 1;

const token = createHmac('sha256', secret)
  .update(`${tableId}:${restaurantId}`)
  .digest('hex')
  .slice(0, 24);

console.log(`http://localhost:5173/table/${tableId}?t=${token}`);
