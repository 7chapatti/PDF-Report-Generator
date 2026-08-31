const express = require('express');
const path = require('path');
const { getDb } = require('./db');
const { getReportData } = require('./report');
const { buildHtml, renderPdf } = require('./render');

const app = express();
app.use(express.json());
const reportsDir = path.join(__dirname, '..', 'reports');
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/reports', async (_req, res) => {
  const db = getDb();
  const id = db.prepare("INSERT INTO reports (path, created_at) VALUES (NULL, datetime('now'))").run().lastInsertRowid;
  const filePath = path.join(reportsDir, `${id}.pdf`);
  try {
    await renderPdf(buildHtml(getReportData()), filePath);
    db.prepare('UPDATE reports SET path = ? WHERE id = ?').run(filePath, id);
    return res.status(201).json({ id, file: `/reports/${id}/file` });
  } catch (error) {
    db.prepare('DELETE FROM reports WHERE id = ?').run(id);
    return res.status(500).json({ error: 'Report generation failed' });
  } finally { db.close(); }
});

app.get('/reports/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT id, path, created_at FROM reports WHERE id = ?').get(Number(req.params.id));
  db.close();
  if (!row) return res.status(404).json({ error: `Report ${req.params.id} not found` });
  return res.json({ id: row.id, created_at: row.created_at, file: `/reports/${row.id}/file` });
});

app.get('/reports/:id/file', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT path FROM reports WHERE id = ?').get(Number(req.params.id));
  db.close();
  if (!row?.path) return res.status(404).json({ error: `Report ${req.params.id} not found` });
  return res.sendFile(row.path);
});
module.exports = app;
