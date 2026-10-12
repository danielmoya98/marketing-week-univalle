const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const filePath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'load' });
  const ribbon = page.locator('.mw-ribbon-bar').first();
  await ribbon.screenshot({ path: 'ribbon_screenshot.png' });
  console.log('Screenshot saved to ribbon_screenshot.png');
  await browser.close();
})();
