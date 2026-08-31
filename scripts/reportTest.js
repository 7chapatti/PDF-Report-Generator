const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const TEST_DB_PATH = path.join(__dirname, 'test-report.db');
if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);

const db = new DatabaseSync(TEST_DB_PATH);
db.exec(`CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer TEXT, product TEXT, amount REAL, created_at TEXT
)`);

const insert = db.prepare('INSERT INTO orders (customer, product, amount, created_at) VALUES (?, ?, ?, ?)');
insert.run('Alice', 'Widget', 100, '2026-08-20T00:00:00.000Z');
insert.run('Bob', 'Widget', 50, '2026-08-21T00:00:00.000Z');
insert.run('Carla', 'Gadget', 30, '2026-08-21T00:00:00.000Z');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test('COUNT(*) matches the number of inserted rows', () => {
  const row = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  assert.strictEqual(row.count, 3);
});

test('SUM(amount) totals revenue correctly', () => {
  const row = db.prepare('SELECT SUM(amount) as total FROM orders').get();
  assert.strictEqual(row.total, 180);
});

test('GROUP BY product ranks Widget above Gadget by revenue', () => {
  const rows = db
    .prepare('SELECT product, SUM(amount) as revenue FROM orders GROUP BY product ORDER BY revenue DESC')
    .all();
  assert.strictEqual(rows[0].product, 'Widget');
  assert.strictEqual(rows[0].revenue, 150);
  assert.strictEqual(rows[1].product, 'Gadget');
});

test('re-seeding logic (DELETE then INSERT) leaves exactly one clean copy', () => {
  db.exec('DELETE FROM orders');
  insert.run('Dev', 'Gizmo', 20, '2026-08-22T00:00:00.000Z');
  const row = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  assert.strictEqual(row.count, 1);
});

db.close();
fs.unlinkSync(TEST_DB_PATH);

console.log(`\n${passed}/4 tests passed`);
