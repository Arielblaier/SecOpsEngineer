// Build and dev server for the demo. No bundler: the page is one HTML file,
// plain CSS and one classic (non-module) script, exactly like the original.
//
//   node scripts/build.mjs dev     local server with live reload (http://localhost:5173)
//   node scripts/build.mjs build   one self-contained file: dist/index.html
//
// Why the script files are joined instead of loaded one by one: the original
// was a single <script>. Every function and top-level const is shared across
// the whole file and inline handlers (onclick="navigateTo(...)") call them as
// globals. Joining src/js/*.js in name order keeps that behavior identical.
import { existsSync, mkdirSync, readFileSync, readdirSync, watch, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const cache = join(root, '.cache');
const read = p => readFileSync(p, 'utf8');
const sorted = (dir, ext) => readdirSync(join(src, dir)).filter(f => f.endsWith(ext)).sort();

/* ---------- pieces ---------- */
const customCss = () => sorted('styles', '.css').map(f => read(join(src, 'styles', f))).join('\n');
const appJs = () => sorted('js', '.js').map(f => read(join(src, 'js', f))).join('\n');

// Line-level source map so browser devtools show src/js/NN-name.js, not the joined file.
function appJsMap() {
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const vlq = n => { let v = n < 0 ? (-n << 1) | 1 : n << 1, out = ''; do { let d = v & 31; v >>>= 5; if (v) d |= 32; out += B64[d]; } while (v); return out; };
  const files = sorted('js', '.js');
  const lines = []; let prevSource = 0, prevLine = 0;
  files.forEach((f, i) => {
    const n = read(join(src, 'js', f)).split('\n').length;
    for (let l = 0; l < n; l++) { lines.push(vlq(0) + vlq(i - prevSource) + vlq(l - prevLine) + vlq(0)); prevSource = i; prevLine = l; }
  });
  return JSON.stringify({ version: 3, file: 'app.js', sources: files.map(f => '/src/js/' + f), sourcesContent: files.map(f => read(join(src, 'js', f))), names: [], mappings: lines.join(';') });
}

const tailwindArgs = out => [join(root, 'node_modules/tailwindcss/lib/cli.js'), '-c', join(root, 'tailwind.config.js'), '-i', join(src, 'tailwind.css'), '-o', out];
function tailwindOnce(minify) {
  mkdirSync(cache, { recursive: true });
  const out = join(cache, minify ? 'tailwind.min.css' : 'tailwind.css');
  const r = spawnSync(process.execPath, [...tailwindArgs(out), ...(minify ? ['--minify'] : [])], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
  if (r.status !== 0) throw new Error('Tailwind build failed. Did you run `npm install`?');
  return read(out);
}

const fontsCss = inline => {
  const css = read(join(src, 'fonts.css'));
  return inline ? css.replace(/url\(fonts\/([^)]+)\)/g, (_, f) => `url(data:font/woff2;base64,${readFileSync(join(src, 'fonts', f)).toString('base64')})`) : css;
};

/* ---------- the page ---------- */
// inline = true  -> everything embedded (the single-file build)
// inline = false -> links to the dev server's URLs
function page({ inline, tailwindCss }) {
  let html = read(join(src, 'index.html'));
  html = html.replace(/<!-- @include (\S+) -->/g, (_, f) => read(join(src, f)));
  const styles = inline
    ? `<style>\n${fontsCss(true)}</style>\n<style>${customCss()}</style>\n<style>${tailwindCss}</style>`
    : '<link rel="stylesheet" href="/fonts.css">\n<link rel="stylesheet" href="/app.css">\n<link rel="stylesheet" href="/tailwind.css">';
  const vendor = ['lucide.min.js', 'three.min.js'].map(f => inline ? `<script>${read(join(src, 'vendor', f))}</script>` : `<script src="/vendor/${f}"></script>`).join('\n');
  const app = inline ? `<script>${appJs()}</script>` : '<script src="/app.js"></script>';
  // Function replacements: the code contains "$" sequences that must not be read as replace patterns.
  return html.replace('<!-- @styles -->', () => styles).replace('<!-- @vendor -->', () => vendor).replace('<!-- @app -->', () => app);
}

/* ---------- build ---------- */
function build() {
  const html = page({ inline: true, tailwindCss: tailwindOnce(true) });
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist/index.html'), html);
  console.log(`dist/index.html  ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB  (self-contained, works offline, open it by double-click)`);
}

/* ---------- dev ---------- */
function dev() {
  const port = Number(process.env.PORT) || 5173;
  tailwindOnce(false);
  // Keeps .cache/tailwind.css fresh while you edit. stdin stays open so --watch does not exit.
  const tw = spawn(process.execPath, [...tailwindArgs(join(cache, 'tailwind.css')), '--watch'], { cwd: root, stdio: ['pipe', 'ignore', 'inherit'] });
  process.on('exit', () => tw.kill());
  process.on('SIGINT', () => process.exit(0));

  const clients = new Set(); let timer;
  const reload = () => { clearTimeout(timer); timer = setTimeout(() => clients.forEach(r => r.write('data: reload\n\n')), 120); };
  watch(src, { recursive: true }, reload);
  watch(cache, reload);

  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.map': 'application/json', '.woff2': 'font/woff2' };
  const liveReload = '<script>new EventSource("/__reload").onmessage = () => location.reload();</script>';
  createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const send = (body, type) => { res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };
    try {
      if (url === '/__reload') { res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' }); res.write('\n'); clients.add(res); req.on('close', () => clients.delete(res)); return; }
      if (url === '/' || url === '/index.html') return send(page({ inline: false }).replace('</body>', () => liveReload + '\n</body>'), types['.html']);
      if (url === '/app.css') return send(customCss(), types['.css']);
      if (url === '/tailwind.css') return send(read(join(cache, 'tailwind.css')), types['.css']);
      if (url === '/app.js') return send(appJs() + '\n//# sourceMappingURL=/app.js.map', types['.js']);
      if (url === '/app.js.map') return send(appJsMap(), types['.map']);
      const file = normalize(join(src, url));
      if (file.startsWith(src) && /^\/(fonts|vendor)\/|^\/fonts\.css$/.test(url) && existsSync(file)) return send(readFileSync(file), types[extname(file)] || 'application/octet-stream');
      res.writeHead(404); res.end('Not found');
    } catch (e) { res.writeHead(500); res.end(String(e && e.stack || e)); }
  }).listen(port, () => console.log(`Dev server: http://localhost:${port}  (edits in src/ reload the page)`));
}

const mode = process.argv[2];
if (mode === 'dev') dev(); else if (mode === 'build') build(); else { console.error('Usage: node scripts/build.mjs dev|build'); process.exit(1); }
