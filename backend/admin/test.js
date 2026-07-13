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
    console.log('Navigating to http://localhost:3001/admin/tasks ...');
    await page.goto('http://localhost:3001/admin/tasks', { waitUntil: 'networkidle0' });
    console.log('Loaded tasks page.');
  } catch (err) {
    console.error('Navigation failed:', err);
  }

  await browser.close();
})();
