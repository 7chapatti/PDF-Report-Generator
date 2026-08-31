const path = require('path');
const { getReportData } = require('../src/report');
const { buildHtml, renderPdf } = require('../src/render');
renderPdf(buildHtml(getReportData()), path.join(__dirname, '..', 'reports', 'test.pdf'))
  .then(() => console.log('Wrote reports/test.pdf'));
