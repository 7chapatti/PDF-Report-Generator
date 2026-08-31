const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function money(value) { return `$${Number(value).toFixed(2)}`; }

function buildHtml(report) {
  const topRows = report.top_products.map((row) => `<tr><td>${escapeHtml(row.product)}</td><td>${money(row.revenue)}</td></tr>`).join('');
  const dayRows = report.orders_per_day.map((row) => `<tr><td>${row.day}</td><td>${row.count}</td></tr>`).join('');
  const orderRows = report.all_orders.map((row) =>
    `<tr><td>${row.id}</td><td>${escapeHtml(row.customer)}</td><td>${escapeHtml(row.product)}</td><td>${money(row.amount)}</td><td>${row.created_at.slice(0, 10)}</td></tr>`
  ).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 24px; }
    th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
    th { background: #f2f2f2; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
  </style></head><body>
    <h1>Sales Report - ${new Date().toISOString().slice(0, 10)}</h1>
    <p><strong>Total orders:</strong> ${report.total_orders}</p><p><strong>Total revenue:</strong> ${money(report.total_revenue)}</p>
    <h2>Top 5 products by revenue</h2><table><thead><tr><th>Product</th><th>Revenue</th></tr></thead><tbody>${topRows}</tbody></table>
    <h2>Orders per day (last 7 days)</h2><table><thead><tr><th>Date</th><th>Orders</th></tr></thead><tbody>${dayRows}</tbody></table>
    <h2>All orders (${report.all_orders.length})</h2><table><thead><tr><th>ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Date</th></tr></thead><tbody>${orderRows}</tbody></table>
  </body></html>`;
}

async function renderPdf(html, outputPath) {
  const { chromium } = require('playwright');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
  } finally { await browser.close(); }
}
module.exports = { buildHtml, renderPdf, escapeHtml, money };
