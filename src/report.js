const { getDb } = require('./db');

function getReportData() {
  const db = getDb();

  const totals = db
    .prepare('SELECT COUNT(*) as total_orders, SUM(amount) as total_revenue FROM orders')
    .get();

  const topProducts = db
    .prepare(
      `SELECT product, SUM(amount) as revenue
       FROM orders
       GROUP BY product
       ORDER BY revenue DESC
       LIMIT 5`
    )
    .all();

  const ordersPerDay = db
    .prepare(
      `SELECT date(created_at) as day, COUNT(*) as count
       FROM orders
       WHERE date(created_at) >= date('now', '-7 days')
       GROUP BY day
       ORDER BY day`
    )
    .all();

  const allOrders = db
    .prepare('SELECT id, customer, product, amount, created_at FROM orders ORDER BY created_at DESC')
    .all();

  db.close();

  return {
    total_orders: totals.total_orders,
    total_revenue: totals.total_revenue || 0,
    top_products: topProducts,
    orders_per_day: ordersPerDay,
    all_orders: allOrders
  };
}

module.exports = { getReportData };
