const assert = require('assert');
const { buildHtml } = require('../src/render');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const sampleReport = {
  total_orders: 2,
  total_revenue: 150,
  top_products: [{ product: 'Widget', revenue: 150 }],
  orders_per_day: [],
  all_orders: [
    { id: 1, customer: 'Alice', product: 'Widget', amount: 100, created_at: '2026-08-20T00:00:00.000Z' },
    { id: 2, customer: '<script>bad()</script>', product: 'Widget', amount: 50, created_at: '2026-08-21T00:00:00.000Z' }
  ]
};

test('buildHtml includes the page-break fix (thead repeats, rows never split)', () => {
  const html = buildHtml(sampleReport);
  assert.ok(html.includes('break-inside: avoid'));
  assert.ok(html.includes('display: table-header-group'));
});

test('buildHtml escapes untrusted customer text instead of injecting it raw', () => {
  const html = buildHtml(sampleReport);
  assert.ok(!html.includes('<script>bad()</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('buildHtml formats money to 2 decimal places', () => {
  const html = buildHtml(sampleReport);
  assert.ok(html.includes('$150.00'));
});

test('buildHtml includes every order row', () => {
  const html = buildHtml(sampleReport);
  assert.ok(html.includes('All orders (2)'));
});

console.log(`\n${passed}/4 tests passed`);

