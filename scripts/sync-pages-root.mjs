// Kopiert dist/ ins Repository-Root. GitHub Pages liefert main/(root) aus
// und diese Einstellung bleibt. Quelle bleibt unter site/, Archiv unter legacy/.
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const domain = 'tee.yoursidequest.org';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readCname(path) {
  if (!existsSync(path)) fail(`${path} fehlt.`);
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n').trim();
}

if (!existsSync(join(distDir, 'index.html'))) {
  fail('dist/index.html fehlt. Zuerst npm run build ausführen.');
}

const cname = readCname(join(distDir, 'CNAME'));
if (cname !== domain) {
  fail(`CNAME muss genau ${domain} sein, ist: ${JSON.stringify(cname)}`);
}
if (!existsSync(join(distDir, '.nojekyll'))) fail('dist/.nojekyll fehlt.');

const blocked = new Set([
  'legacy',
  'site',
  'src',
  'node_modules',
  'scripts',
  '.github',
  'package.json',
  'package-lock.json',
]);
for (const name of readdirSync(distDir)) {
  if (blocked.has(name)) fail(`dist enthält ${name} und würde die Quelle überschreiben.`);
}

for (const page of ['index.html', 'impressum.html', 'datenschutz.html']) {
  const html = readFileSync(join(distDir, page), 'utf8');
  if (html.includes('/src/main.ts') || html.includes('/src/style.css')) {
    fail(`${page} verweist noch auf Quelldateien.`);
  }
  if (html.includes('/tea-sommelier-poc/')) {
    fail(`${page} nutzt den Projektpfad statt der Domain-Wurzel.`);
  }
  if (html.includes('./assets/') || html.includes('href="./') || html.includes('src="./')) {
    fail(`${page} enthält relative Asset-Pfade. Erwartet ist base '/'.`);
  }
}

const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
if (!/src="\/assets\/[^"]+"/.test(indexHtml)) {
  fail('Das gebaute Skript muss unter /assets/ liegen.');
}
if (!/href="\/assets\/[^"]+"/.test(indexHtml)) {
  fail('Das gebaute Stylesheet muss unter /assets/ liegen.');
}
if (!indexHtml.includes('href="/favicon.svg"')) {
  fail('Das Favicon muss unter /favicon.svg liegen.');
}

rmSync(join(repoRoot, 'assets'), { recursive: true, force: true });
for (const name of readdirSync(distDir)) {
  cpSync(join(distDir, name), join(repoRoot, name), { recursive: true, force: true });
}

if (readCname(join(repoRoot, 'CNAME')) !== domain) fail('CNAME im Root ist falsch.');
if (!existsSync(join(repoRoot, '.nojekyll'))) fail('.nojekyll im Root fehlt.');
if (!existsSync(join(repoRoot, 'legacy', 'clickdummy', 'index.html'))) fail('/legacy fehlt.');
if (!existsSync(join(repoRoot, 'legacy', 'webhook-formular.html'))) fail('/legacy/webhook-formular.html fehlt.');
if (!existsSync(join(repoRoot, 'site', 'index.html'))) fail('Quelle site/index.html fehlt.');
if (!existsSync(join(repoRoot, 'site', 'src', 'main.ts'))) fail('Quelle site/src/main.ts fehlt.');

console.log('Gebaute Seite liegt im Repository-Root. CNAME, .nojekyll und /legacy sind vorhanden.');
