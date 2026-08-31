const { getDb } = require('./db');

const PRODUCTS = ['Widget', 'Gadget', 'Gizmo', 'Doohickey', 'Thingamajig', 'Contraption'];
const CUSTOMERS = ['Alice', 'Bob', 'Carla', 'Dev', 'Elin', 'Farid', 'Grace', 'Hassan'];

function randomDateWithinDays(daysBack) {
  const now = Date.now();
  const offsetMs = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offsetMs).toISOString();
}

function seed(count = 200) {
  const db = getDb();
  db.exec('DELETE FROM orders');

  const insert = db.prepare(
    'INSERT INTO orders (customer, product, amount, created_at) VALUES (?, ?, ?, ?)'
  );

  for (let i = 0; i < count; i++) {
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const amount = Math.round((5 + Math.random() * 195) * 100) / 100;
    insert.run(customer, product, amount, randomDateWithinDays(30));
  }

  const { count: rowCount } = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  console.log(`Seeded ${rowCount} orders`);
  db.close();
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
