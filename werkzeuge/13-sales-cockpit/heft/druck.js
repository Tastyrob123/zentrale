// Druckt Hefte als PDF (A4 quer). Aufruf: node druck.js <heft.html> <ziel.pdf> [<heft.html> <ziel.pdf> …]
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
(async () => {
  const a = process.argv.slice(2), b = await chromium.launch();
  for (let i = 0; i < a.length; i += 2) {
    const p = await b.newPage();
    await p.goto('file://' + path.resolve(a[i]).split('/').map(encodeURIComponent).join('/'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: a[i + 1], preferCSSPageSize: true, printBackground: true });
    await p.close(); console.log(a[i + 1]);
  }
  await b.close();
})();
