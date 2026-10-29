// Запуск:  TARIZI_TEST=1 python3 build.py && node --test tests/
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { serve, open, car, shift, chromium, ROOT } = require('./helpers');

let srv, url, browser;
before(async () => { ({ srv, url } = await serve()); browser = await chromium.launch(); });
after(async () => { await browser.close(); srv.close(); });

const T = (page, fn, arg) => page.evaluate(fn, arg);

test('расчёты: нетто, итоги, разбор чисел и времени', async () => {
  const { ctx, page } = await open(browser, url);
  await page.waitForSelector('.appbar');
  const r = await T(page, () => {
    const t = window.__t;
    const c = { tare: 17250, trips: [{ gross: 41250 }, { gross: 40980 }] };
    return {
      car: t.carStats(c), num: [t.parseNum('41 250'), t.parseNum('41250,5'), t.parseNum('abc')],
      time: [t.normTime('726'), t.normTime('1433'), t.normTime('14'), t.normTime('2561'), t.normTime('')],
    };
  });
  assert.deepEqual(r.car, { n: 2, gross: 82230, net: 47730 });
  assert.deepEqual([r.num[0], r.num[1], Number.isNaN(r.num[2])], [41250, 41250.5, true]);
  assert.deepEqual(r.time, ['07:26', '14:33', '14:00', '', '']);
  await ctx.close();
});

test('контроль веса: заметное отклонение от обычного ловится', async () => {
  const { ctx, page } = await open(browser, url);
  await page.waitForSelector('.appbar');
  const r = await T(page, () => {
    const t = window.__t, c = t.S.shifts.s1.cars[0];
    return [t.grossAnomaly(c, 41000), t.grossAnomaly(c, 20000) > 0, t.grossAnomaly(c, 4125) > 0];
  });
  assert.deepEqual(r, [0, true, true]);
  await ctx.close();
});

test('переводы: у каждой надписи есть казахский вариант', async () => {
  const src = fs.readFileSync(path.join(ROOT, 'dist', 'artifact.html'), 'utf8');
  const js = src.slice(src.indexOf('<script>\n(function'));
  const KK = JSON.parse(/const KK=(\{.*?\});\n/s.exec(js)[1]);
  const used = new Set();
  for (const m of js.matchAll(/tx\("((?:[^"\\]|\\.)*)"/g)) used.add(JSON.parse('"' + m[1] + '"'));
  for (const m of js.matchAll(/tx\('((?:[^'\\]|\\.)*)'/g)) used.add(m[1].replace(/\\'/g, "'"));
  const missing = [...used].filter(u => !(u in KK));
  assert.deepEqual(missing, []);
  for (const [k, v] of Object.entries(KK)) {
    const ph = s => (s.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(ph(v), ph(k), 'не совпадают подстановки: ' + k);
  }
});

test('Excel: корректный архив, листы и числа', async () => {
  const { ctx, page } = await open(browser, url);
  await page.waitForSelector('.appbar');
  const b64 = await T(page, async () => {
    const t = window.__t, blob = t.docToXlsx(t.shiftDoc(t.S.shifts.s1));
    const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (const x of buf) s += String.fromCharCode(x); return btoa(s);
  });
  const buf = Buffer.from(b64, 'base64');
  assert.equal(buf.readUInt32LE(0), 0x04034b50);
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16); const names = [];
  const zlib = require('zlib');
  for (let i = 0; i < count; i++) {
    const crc = buf.readUInt32LE(off + 16), size = buf.readUInt32LE(off + 24), nl = buf.readUInt16LE(off + 28), lho = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nl); names.push(name);
    const dstart = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const data = buf.subarray(dstart, dstart + size);
    if (zlib.crc32) assert.equal(zlib.crc32(data), crc, 'CRC ' + name);
    if (name.endsWith('.xml') || name.endsWith('.rels')) {
      const ok = await page.evaluate(x => !new DOMParser().parseFromString(x, 'application/xml').querySelector('parsererror'), data.toString('utf8'));
      assert.ok(ok, 'XML не читается: ' + name);
    }
    off += 46 + nl + buf.readUInt16LE(off + 30) + buf.readUInt16LE(off + 32);
  }
  assert.ok(names.includes('xl/workbook.xml') && names.includes('xl/styles.xml'));
  assert.ok(names.filter(n => n.startsWith('xl/worksheets/')).length >= 3);
  await ctx.close();
});

test('резервная копия: разбор и отказ на чужом файле', async () => {
  const { ctx, page } = await open(browser, url);
  await page.waitForSelector('.appbar');
  const r = await T(page, () => {
    const t = window.__t;
    const good = JSON.stringify({ shifts: Object.values(t.S.shifts), glossary: t.S.glossary });
    return [t.parseBackup(good).shifts.length, t.parseBackup('{"hello":1}'), t.parseBackup('не json')];
  });
  assert.deepEqual(r, [1, null, null]);
  await ctx.close();
});

test('отчёт по водителю: только его рейсы и верные итоги', async () => {
  const { ctx, page } = await open(browser, url);
  await page.waitForSelector('.appbar');
  const d = await T(page, () => { const t = window.__t; return t.entityDoc(Object.values(t.S.shifts), 'driver', 'Әлиев Д.'); });
  assert.equal(d.tables[0].rows.length, 1);
  assert.equal(String(d.tables[0].foot[7]).replace(/\s/g, ''), '47730');
  await ctx.close();
});

test('хранилище: перенос старых данных, перезагрузка, повреждение и автокопия', async () => {
  const { ctx, page, errors } = await open(browser, url);
  await page.waitForSelector('.scard');
  await page.waitForTimeout(500);
  await page.reload(); await page.waitForSelector('.scard');            // данные пережили перезагрузку
  await page.evaluate(() => { localStorage.removeItem('avtovesy.shifts.v1'); localStorage.removeItem('avtovesy.glossary.v1'); });
  await page.reload(); await page.waitForSelector('.scard');            // читаем из IndexedDB, а не из зеркала
  await page.evaluate(() => new Promise(res => { const rq = indexedDB.open('tarazi'); rq.onsuccess = () => { const t = rq.result.transaction('kv', 'readwrite'); t.objectStore('kv').put('МУСОР', 'data'); t.oncomplete = () => res(); }; }));
  await page.reload(); await page.waitForSelector('.scard');            // повреждение -> автокопия
  assert.match(await page.textContent('#toast'), /автокөшірме/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('смена и язык: выбор при первом запуске и в настройках', async () => {
  const { ctx, page } = await open(browser, url, { lang: null, shifts: null });
  await page.waitForSelector('.langsel');
  await page.click('[data-lang=ru]'); await page.waitForSelector('.appbar');
  assert.match(await page.textContent('body'), /Смен пока нет|Новая смена|Дневная|дневная/);
  await page.click('[data-act=settings]'); await page.click('[data-lang=kk]');
  assert.match(await page.textContent('h1'), /Баптаулар/);
  await ctx.close();
});

test('телефон 360 px: нет горизонтальной прокрутки на основных экранах', async () => {
  const { ctx, page } = await open(browser, url, { width: 360, height: 640 });
  await page.waitForSelector('.appbar');
  for (const h of ['#shift-s1', '#car-s1-c1', '#stats', '#settings', '#glossary', '']) {
    await page.evaluate(x => { location.hash = x; }, h);
    await page.waitForTimeout(150);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.equal(w, 360, 'переполнение на экране ' + (h || 'главный'));
  }
  await page.evaluate(() => { location.hash = '#shift-s1'; });
  await page.click('[data-act=car-new]');
  const box = await page.evaluate(() => { const d = document.querySelector('.dialog'); const r = d.getBoundingClientRect(); return [r.top >= 0, r.bottom <= innerHeight + 1]; });
  assert.deepEqual(box, [true, true], 'окно не помещается на экране');
  await ctx.close();
});

test('экспорт: пять форматов и закреплённые кнопки', async () => {
  const { ctx, page } = await open(browser, url, { hash: '#shift-s1' });
  await page.waitForSelector('.appbar');
  await page.click('[data-act=shift-report]');
  assert.deepEqual(await page.$$eval('.xbtn b', e => e.map(x => x.textContent)), ['PDF', 'PNG', 'Excel', 'CSV', 'TXT']);
  await ctx.close();
});

test('сетка машин: переключатель и сохранение выбора', async () => {
  const { ctx, page } = await open(browser, url, { hash: '#shift-s1' });
  await page.waitForSelector('.appbar');
  await page.click('[data-view=grid]');
  assert.equal(await page.$$eval('.cgrid', e => e.length), 1);
  await page.reload(); await page.waitForSelector('.cgrid');
  await ctx.close();
});

test('уведомление об обновлении версии', async () => {
  const { ctx, page } = await open(browser, url);
  await page.waitForSelector('.appbar');
  await page.evaluate(() => window.__updateReady());
  assert.ok(await page.$('[data-act=reload-app]'));
  await ctx.close();
});
