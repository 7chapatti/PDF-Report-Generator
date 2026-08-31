const { getDb } = require('./db');
const PRODUCTS = ['Orange', 'Banana', 'Apple', 'Kiwi', 'Melon', 'Pineapple'];
const CUSTOMERS = ['Alice', 'Bob', 'Carla', 'Dev', 'Elin', 'Farid', 'Grace', 'Hassan'];

function randomDateWithinDays(daysBack) {
  return new Date(Date.now() - Math.floor(Math.random() * daysBack * 86400000)).toISOString();
}

function seed(count = 200) {
  const db = getDb();
  db.exec('DELETE FROM orders');
  const insert = db.prepare('INSERT INTO orders (customer, product, amount, created_at) VALUES (?, ?, ?, ?)');
  for (let i = 0; i < count; i += 1) {
    insert.run(
      CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
      PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
      Math.round((5 + Math.random() * 195) * 100) / 100,
      randomDateWithinDays(30)
    );
  }
  const { count: rowCount } = db.prepare('SELECT COUNT(*) AS count FROM orders').get();
  db.close();
  console.log(`Seeded ${rowCount} orders`);
}

if (require.main === module) seed();
module.exports = { seed };
