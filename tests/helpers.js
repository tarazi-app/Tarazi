// Общие помощники для тестов: статический сервер для www/ и запуск браузера.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

function serve() {
  const srv = http.createServer((q, r) => {
    let f = path.join(WWW, decodeURIComponent(q.url.split('?')[0]));
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  });
  return new Promise(res => srv.listen(0, () => res({ srv, url: 'http://localhost:' + srv.address().port + '/' })));
}

const car = (i, over) => Object.assign({
  id: 'c' + i, plate: '191ABC0' + i, driver: 'Нұрмағамбетов Б.', arrival: '08:1' + i, tare: 17250,
  route: 'Қарағанды → Теміртау', material: 'Қиыршық тас', color: 'blue',
  trips: [{ id: 't1', time: '09:10', gross: 41250 }, { id: 't2', time: '10:45', gross: 40980 }],
}, over || {});

const shift = (over) => Object.assign({
  id: 's1', date: '2026-10-28', type: 'day', shift: 'x', operator: 'Ержан Сәкенұлы',
  status: 'active', createdAt: 1, cars: [car(1), car(2, { driver: 'Әлиев Д.' })],
}, over || {});

// Новый контекст браузера со стартовыми данными в старом (legacy) хранилище и выбранным языком.
async function open(browser, url, { lang = 'kk', shifts = { s1: shift() }, width = 390, height = 844, hash = '' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/fonts.g*/**', r => r.abort());
  await page.addInitScript(([lang, shifts]) => {
    if (localStorage.getItem('__seeded')) return;
    localStorage.setItem('__seeded', '1');
    if (lang) localStorage.setItem('tarazi.lang', lang);
    if (shifts) localStorage.setItem('avtovesy.shifts.v1', JSON.stringify(shifts));
  }, [lang, shifts]);
  await page.goto(url + hash);
  return { ctx, page, errors };
}

module.exports = { serve, open, car, shift, chromium, WWW, ROOT };
