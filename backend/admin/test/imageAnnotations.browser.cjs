// Exercises the real viewer and annotation components in a headless browser.
// All image/API responses are local fixtures; no production data is accessed.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { webpack } = require('next/dist/compiled/webpack/webpack');

async function run() {
  const root = path.resolve(__dirname, '..');
  const customer = process.argv.includes('--customer');
  const sourceRoot = customer ? path.resolve(root, '../../frontend/src') : path.join(root, 'src');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'shop-co-image-annotations-'));
  const userId = '111111111111111111111111';
  const otherId = '222222222222222222222222';
  const fileId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  let layers = [{ fileId, editorId: otherId, editorName: 'Syada', revision: 1, items: [{ id: 'other-pin', kind: 'pin', color: '#22c55e', width: 3, x: .25, y: .25, text: 'Customer remark' }] }];
  let requests = [];
  let conflict = false;
  const server = http.createServer(async (req, res) => {
    if (req.url === '/fixture-api') {
      if (req.method === 'PUT') {
        const chunks = []; for await (const chunk of req) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString()); requests.push(body);
        if (conflict) { conflict = false; res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Your annotations changed in another tab. Reload the layer before saving again.' })); return; }
        const saved = { fileId, editorId: userId, editorName: 'HARITH', revision: body.revision + 1, items: body.items };
        layers = [saved, ...layers.filter(layer => layer.editorId !== userId)];
        res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(saved)); return;
      }
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(layers)); return;
    }
    if (req.url === '/fixture-conflict') { conflict = true; res.end('ok'); return; }
    if (req.url === '/bundle.js' || req.url === '/style.css') {
      res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css');
      res.end(fs.readFileSync(path.join(temporary, req.url.slice(1)))); return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end('<html class="dark"><head><link rel="stylesheet" href="/style.css"><style>:root{--background:0 0% 4%;--foreground:0 0% 95%;--muted-foreground:0 0% 65%;--border:0 0% 20%;--primary:0 80% 50%;--primary-foreground:0 0% 100%;--ring:0 80% 50%;--input:0 0% 20%;--accent:0 0% 15%;--accent-foreground:0 0% 95%}body{background:#090909;font-family:Arial}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
  });
  server.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const address = `http://127.0.0.1:${server.address().port}`;
  fs.writeFileSync(path.join(temporary, 'api.ts'), `export async function fileAnnotationsApi(_token, method, _path, body) { const response = await fetch('/fixture-api', { method: method === 'POST' ? 'GET' : method, headers: { 'Content-Type': 'application/json' }, body: body && method !== 'POST' ? JSON.stringify(body) : undefined }); const data = await response.json(); if (!response.ok) throw new Error(data.message); return data; }`);
  fs.writeFileSync(path.join(temporary, 'session.ts'), `export function useSession() { return { data: { user: { id: '${userId}', name: 'HARITH', token: 'fixture' } } }; }`);
  fs.writeFileSync(path.join(temporary, 'tags.ts'), 'export function useUpdateFileTag() { return { mutate: () => {}, isPending: false }; }');
  fs.writeFileSync(path.join(temporary, 'loader.cjs'), `const ts = require(${JSON.stringify(require.resolve('typescript'))}); module.exports = function(source) { return ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText; };`);
  const viewerImport = customer ? "import { ImageAnnotationModal } from '@/components/global/ImageAnnotationModal';" : "import { FilePreviewModal } from '@/components/global/FilePreviewModal';";
  const viewer = customer ? `<ImageAnnotationModal onClose={() => setOpen(false)} file={open ? { _id: '${fileId}', originalName: 'Annotation test image.png' } : null} />` : `<FilePreviewModal isOpen={open} onClose={() => setOpen(false)} file={{ _id: '${fileId}', name: 'Annotation test image.png', url: '${address}/image.png', mimetype: 'image/png' }} />`;
  fs.writeFileSync(path.join(temporary, 'entry.tsx'), `import React from 'react'; import { createRoot } from 'react-dom/client'; import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; import { Toaster } from 'sonner'; ${viewerImport} import { AnnotationEditorBadge } from '@/components/global/ImageAnnotations'; function App() { const [open, setOpen] = React.useState(true); return <QueryClientProvider client={React.useMemo(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }), [])}>${viewer}<div id="badge"><AnnotationEditorBadge editors={[{ editorId: '${userId}', editorName: 'HARITH' }, { editorId: '${otherId}', editorName: 'Syada' }]} /></div><Toaster /></QueryClientProvider> }; createRoot(document.getElementById('root')!).render(<App />);`);
  fs.writeFileSync(path.join(temporary, 'style-input.css'), '@tailwind base; @tailwind components; @tailwind utilities;');
  fs.writeFileSync(path.join(temporary, 'tailwind.cjs'), `module.exports = { content: [${JSON.stringify(path.join(sourceRoot, 'components/global/{FilePreviewModal,ImageAnnotations,ImageAnnotationModal}.tsx').replaceAll('\\', '/'))}, ${JSON.stringify(path.join(sourceRoot, 'components/ui/*.tsx').replaceAll('\\', '/'))}, ${JSON.stringify(path.join(temporary, 'entry.tsx').replaceAll('\\', '/'))}], theme: { extend: { colors: { background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))', 'muted-foreground': 'hsl(var(--muted-foreground))', border: 'hsl(var(--border))', primary: 'hsl(var(--primary))', 'primary-foreground': 'hsl(var(--primary-foreground))', accent: 'hsl(var(--accent))', 'accent-foreground': 'hsl(var(--accent-foreground))' } } }, plugins: [require(${JSON.stringify(path.join(root, 'node_modules/tailwindcss-animate'))})] };`);
  let browser;
  try {
    console.log('Building the local annotation viewer fixture…');
    execFileSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-i', path.join(temporary, 'style-input.css'), '-o', path.join(temporary, 'style.css'), '-c', path.join(temporary, 'tailwind.cjs')], { cwd: root, stdio: 'pipe' });
    await new Promise((resolve, reject) => webpack({
      mode: 'development', context: root, entry: path.join(temporary, 'entry.tsx'), output: { path: temporary, filename: 'bundle.js' }, devtool: false,
      resolve: { extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'node_modules'), 'node_modules'], alias: { '@/utils/fileAnnotationsApi': path.join(temporary, 'api.ts'), '@/hooks/useAdminDashboard': path.join(temporary, 'tags.ts'), 'next-auth/react': path.join(temporary, 'session.ts'), '@': sourceRoot } },
      module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: path.join(temporary, 'loader.cjs') }] },
      plugins: [new webpack.DefinePlugin({ 'process.env.NEXT_PUBLIC_BACKEND_URL': JSON.stringify(address) })],
    }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
    const { default: puppeteer } = await import('puppeteer');
    console.log('Opening the annotation viewer in headless Chrome…');
    const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await puppeteer.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}), args: ['--no-sandbox', '--disable-gpu'] });
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 960 });
    const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.message); });
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/api/files/proxy-download') || request.url().endsWith(`/api/files/${fileId}/preview`)) request.respond({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#ede4d8"/><rect x="60" y="60" width="680" height="480" rx="16" fill="#c1d4cc"/><path d="M400 60V540M60 300H740" stroke="#527168" stroke-width="2"/><text x="400" y="285" text-anchor="middle" font-size="28" fill="#294039">IMAGE ANNOTATION TEST</text><text x="400" y="330" text-anchor="middle" font-size="16" fill="#294039">Original image stays unchanged</text></svg>' });
      else request.continue();
    });
    await page.goto(address); await page.waitForSelector('select[aria-label="View editor annotations"]');
    console.log('Testing annotation tools and persistence…');
    assert.equal(!!await page.$('button[title="Open in new tab"]'), !customer);
    await page.waitForFunction(() => document.querySelector('img')?.getBoundingClientRect().width > 0);
    await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))));
    const clickText = text => page.evaluate(text => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text)?.click(), text);
    const pathCount = () => page.$$eval('svg[aria-label="Image sketch overlay"] path', paths => paths.length);
    await clickText('Edit Mode'); await page.waitForSelector('button[aria-label="Sketch"]');
    const imageRect = () => page.$eval('img', image => { const r = image.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    const draw = async () => { const r = await imageRect(); await page.mouse.move(r.x + r.width * .4, r.y + r.height * .4); await page.mouse.down(); await page.mouse.move(r.x + r.width * .6, r.y + r.height * .5, { steps: 12 }); await page.mouse.up(); };
    await draw(); assert.equal(await pathCount(), 1);
    await page.click('button[aria-label="Undo annotation"]'); assert.equal(await pathCount(), 0);
    await page.click('button[aria-label="Redo annotation"]'); assert.equal(await pathCount(), 1);
    await page.click('button[aria-label="Erase"]');
    const hit = await page.$eval('svg[aria-label="Image sketch overlay"] path', path => {
      const point = path.getPointAtLength(path.getTotalLength() / 2);
      const screen = new DOMPoint(point.x, point.y).matrixTransform(path.getScreenCTM()); return { x: screen.x, y: screen.y };
    });
    // Start outside the line and drag near it: erasing must not require an exact SVG hit.
    await page.mouse.move(hit.x, hit.y + 35); await page.mouse.down();
    await page.mouse.move(hit.x, hit.y + 8, { steps: 10 }); await page.mouse.up();
    assert.equal(await pathCount(), 0);
    await page.click('button[aria-label="Undo annotation"]'); assert.equal(await pathCount(), 1);
    await page.click('button[aria-label="Pin"]'); let r = await imageRect(); await page.mouse.click(r.x + r.width * .7, r.y + r.height * .25);
    await page.waitForSelector('#annotation-note'); await page.type('#annotation-note', 'Please straighten this edge'); await clickText('Done');
    await page.click('button[aria-label="Note"]'); r = await imageRect(); await page.mouse.click(r.x + r.width * .1, r.y + r.height * .7);
    await page.waitForSelector('#annotation-note'); await page.type('#annotation-note', 'Use this framing'); await clickText('Done');
    await page.screenshot({ path: path.join(temporary, 'edit-mode.png') });
    await clickText('Save'); await page.waitForFunction(() => !document.querySelector('button[aria-label="Sketch"]'));
    assert.equal(requests.length, 1); assert.equal(requests[0].items.length, 3);
    assert.equal(requests[0].items.find(item => item.kind === 'pin').text, 'Please straighten this edge');
    assert.ok(requests[0].items[0].points.every(point => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1));
    await page.select('select[aria-label="View editor annotations"]', otherId); assert.equal(await pathCount(), 0);
    await page.select('select[aria-label="View editor annotations"]', userId); assert.equal(await pathCount(), 1);
    await page.setViewport({ width: 980, height: 720 });
    await page.waitForFunction(() => { const image = document.querySelector('img')?.getBoundingClientRect(); const overlay = document.querySelector('svg[aria-label="Image sketch overlay"]')?.getBoundingClientRect(); return image && overlay && Math.abs(image.width - overlay.width) < 1 && Math.abs(image.height - overlay.height) < 1; });
    await page.reload(); await page.waitForSelector('select[aria-label="View editor annotations"]');
    await page.select('select[aria-label="View editor annotations"]', userId); assert.equal(await pathCount(), 1);
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(temporary, 'mobile-before-check.png') });
    await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="dialog"]')?.getBoundingClientRect();
      const image = document.querySelector('img')?.getBoundingClientRect();
      const buttons = [...document.querySelectorAll('[role="dialog"] button')];
      return dialog && image && dialog.left >= -1 && dialog.right <= innerWidth + 1 && dialog.top >= -1 && dialog.bottom <= innerHeight + 1 && image.left >= dialog.left - 1 && image.right <= dialog.right + 1 && buttons.every(button => { const rect = button.getBoundingClientRect(); return rect.width === 0 || (rect.left >= dialog.left - 1 && rect.right <= dialog.right + 1); });
    });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    fs.writeFileSync(path.join(temporary, 'mobile-dom.html'), await page.content());
    await page.screenshot({ path: path.join(temporary, 'mobile-viewer.png') });
    await page.setViewport({ width: 980, height: 720 });
    await clickText('Edit Mode'); await draw();
    let confirmations = 0;
    page.on('dialog', dialog => { confirmations++; if (confirmations === 1) dialog.dismiss(); else dialog.accept(); });
    await clickText('Exit Edit Mode'); assert.ok(await page.$('button[aria-label="Sketch"]'));
    await clickText('Exit Edit Mode'); await page.waitForFunction(() => !document.querySelector('button[aria-label="Sketch"]'));
    assert.equal(requests.length, 1);
    await clickText('Edit Mode'); await draw(); await page.evaluate(() => fetch('/fixture-conflict')); await clickText('Save');
    await page.waitForFunction(() => document.body.textContent.includes('changed in another tab'));
    assert.ok(await page.$('button[aria-label="Sketch"]'));
    assert.equal(layers.find(layer => layer.editorId === userId).items.length, 3);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, viewer: customer ? 'customer' : 'admin', checks: ['sketch', 'pin notes', 'image notes', 'erase', 'undo/redo', 'save/reopen', 'editor switching', 'resize alignment', 'mobile layout', 'cancel/discard guard', 'save conflict'], screenshots: [path.join(temporary, 'edit-mode.png'), path.join(temporary, 'mobile-viewer.png')], temporary }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
