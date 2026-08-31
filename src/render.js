const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function buildHtml(report) {
  const today = new Date().toISOString().slice(0, 10);

  const topProductRows = report.top_products
    .map((p) => `<tr><td>${escapeHtml(p.product)}</td><td>${money(p.revenue)}</td></tr>`)
    .join('\n');

  const allOrderRows = report.all_orders
    .map(
      (o) =>
        `<tr><td>${o.id}</td><td>${escapeHtml(o.customer)}</td><td>${escapeHtml(o.product)}</td>` +
        `<td>${money(o.amount)}</td><td>${o.created_at.slice(0, 10)}</td></tr>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin-top: 28px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
  th { background: #f2f2f2; }

  /* the page-break trap: without these two rules a table row gets sliced
     in half at a page boundary, and the header only shows on page 1 */
  thead { display: table-header-group; }
  tr { break-inside: avoid; }

  .totals { display: flex; gap: 32px; margin: 16px 0; }
  .totals div { font-size: 16px; }
</style>
</head>
<body>
  <h1>Sales Report — ${today}</h1>

  <div class="totals">
    <div><strong>Total orders:</strong> ${report.total_orders}</div>
    <div><strong>Total revenue:</strong> ${money(report.total_revenue)}</div>
  </div>

  <h2>Top 5 products by revenue</h2>
  <table>
    <thead><tr><th>Product</th><th>Revenue</th></tr></thead>
    <tbody>${topProductRows}</tbody>
  </table>

  <h2>All orders (${report.all_orders.length})</h2>
  <table>
    <thead><tr><th>ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Date</th></tr></thead>
    <tbody>${allOrderRows}</tbody>
  </table>
</body>
</html>`;
}

async function renderPdf(html, outputPath) {
  const { chromium } = require('playwright');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
  } finally {
    await browser.close();
  }
}

module.exports = { buildHtml, renderPdf, escapeHtml, money };
