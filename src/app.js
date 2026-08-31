const express = require('express');
const path = require('path');

const { getDb } = require('./db');
const { getReportData } = require('./report');
const { buildHtml, renderPdf } = require('./render');

const app = express();
app.use(express.json());

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/reports', async (req, res) => {
  const force = req.body?.force === true;
  const db = getDb();

  if (!force) {
    const existing = db
      .prepare(
        `SELECT id FROM reports WHERE date(created_at) = date('now') ORDER BY id DESC LIMIT 1`
      )
      .get();

    if (existing) {
      db.close();
      return res.status(200).json({ id: existing.id, file: `/reports/${existing.id}/file` });
    }
  }

  const insertRow = db.prepare(`INSERT INTO reports (path, created_at) VALUES (NULL, datetime('now'))`);
  const info = insertRow.run();
  const id = info.lastInsertRowid;
  const filePath = path.join(REPORTS_DIR, `${id}.pdf`);

  try {
    const reportData = getReportData();
    const html = buildHtml(reportData);
    await renderPdf(html, filePath);
  } catch (err) {
    db.prepare('DELETE FROM reports WHERE id = ?').run(id);
    db.close();
    console.error('Report generation failed:', err.message);
    return res.status(500).json({ error: 'Report generation failed' });
  }

  db.prepare('UPDATE reports SET path = ? WHERE id = ?').run(filePath, id);
  db.close();

  res.status(201).json({ id, file: `/reports/${id}/file` });
});

app.get('/reports/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT id, path, created_at FROM reports WHERE id = ?').get(Number(req.params.id));
  db.close();

  if (!row) {
    return res.status(404).json({ error: `Report ${req.params.id} not found` });
  }
  res.json({ id: row.id, created_at: row.created_at, file: `/reports/${row.id}/file` });
});

app.get('/reports/:id/file', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT path FROM reports WHERE id = ?').get(Number(req.params.id));
  db.close();

  if (!row || !row.path) {
    return res.status(404).json({ error: `Report ${req.params.id} not found` });
  }
  res.sendFile(row.path);
});

module.exports = app;
