const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({
    width: 375,
    height: 667,
    isMobile: true
  });

  page.on('pageerror', error => {
    console.error('Page Crash Error:', error.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console Error:', msg.text());
    }
  });

  try {
    console.log('Navigating to http://127.0.0.1:3001/auth/login ...');
    await page.goto('http://127.0.0.1:3001/auth/login', { waitUntil: 'load' });
    console.log('Loaded tasks page.');
  } catch (err) {
    console.error('Navigation failed:', err);
  }

  await browser.close();
})();
