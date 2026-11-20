// SilentBoard – Copyright (C) 2026 ostalbweb.de
// SPDX-License-Identifier: GPL-3.0-or-later
// Baut SilentBoard aus app.html + Bibliotheken:
//   ../SilentBoard.html     – eigenständige Datei (Doppelklick, USB-Stick)
//   ../web/silentboard/     – installierbare Web-App (PWA) zum Hochladen auf ostalbweb.de
import fs from 'fs';
import { execSync } from 'child_process';

const nm = 'node_modules/';
const REPO = 'https://github.com/OstalbJoe/SilentBoard';
const css = ['chessground.base.css', 'chessground.brown.css', 'chessground.cburnett.css']
  .map(f => fs.readFileSync(nm + 'chessground/assets/' + f, 'utf8')).join('\n');
const libs = fs.readFileSync('libs.js', 'utf8');
if (/<\/script/i.test(libs)) throw new Error('libs enthalten </script');
const sfJs = fs.readFileSync(nm + 'stockfish/bin/stockfish-19-lite-single.js').toString('base64');
const sfWasm = fs.readFileSync(nm + 'stockfish/bin/stockfish-19-lite-single.wasm').toString('base64');
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg64 = f => 'data:image/svg+xml;base64,' + fs.readFileSync(f).toString('base64');

function build({ pwa }) {
  let html = fs.readFileSync('app.html', 'utf8');
  const put = (k, v) => { if (!html.includes(k)) throw new Error('fehlt: ' + k); html = html.split(k).join(v); };
  put('/*@@CG_CSS@@*/', css);
  put('<!--@@LIBS@@-->', '<script>\n/* chessground 9.2.1 (GPL-3.0-or-later, lichess.org) + chess.js 1.4.0 (BSD-2-Clause, Jeff Hlywa) – Lizenzen: siehe Dialog „Lizenz & Info“ */\n' + libs + '\n</script>');
  put('@@ICON@@', svg64('../logo/silentboard-icon.svg'));
  put('@@LOGO@@', svg64('../logo/silentboard-logo.svg'));
  put('@@CHESSJS_LICENSE@@', esc(fs.readFileSync(nm + 'chess.js/LICENSE', 'utf8')));
  put('@@REPO@@', REPO);
  put('@@REPO_SHORT@@', REPO.replace('https://', ''));
  put('@@SOURCE_NOTE@@', pwa ? ' · auch als Download: <a href="quellcode.zip">quellcode.zip</a>' : '');
  put('<!--@@PWA_HEAD@@-->', pwa
    ? '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#262421">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">'
    : '');
  put('/*@@PWA_JS@@*/', pwa ? fs.readFileSync('pwa/pwa.js', 'utf8') : '');
  put('@@SF_JS@@', sfJs);
  put('@@SF_WASM@@', sfWasm);
  return html;
}

// 1) Eigenständige Datei
const solo = build({ pwa: false });
fs.writeFileSync('../SilentBoard.html', solo);
console.log('ok  SilentBoard.html', (solo.length / 1024 / 1024).toFixed(2), 'MB');

// 2) Web-App
const out = '../web/silentboard/';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out + 'icons', { recursive: true });
fs.writeFileSync(out + 'index.html', build({ pwa: true }));
fs.copyFileSync('pwa/manifest.webmanifest', out + 'manifest.webmanifest');
fs.copyFileSync('pwa/.htaccess', out + '.htaccess');
const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
fs.writeFileSync(out + 'sw.js', fs.readFileSync('pwa/sw.js', 'utf8').replace('@@VERSION@@', version));
for (const f of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) fs.copyFileSync('../logo/' + f, out + 'icons/' + f);
fs.copyFileSync('../logo/silentboard-icon.svg', out + 'icons/icon.svg');
// Quellcode zum Herunterladen (GPL: wer die App bekommt, muss an den Quellcode kommen)
execSync(`cd .. && zip -qr web/silentboard/quellcode.zip LICENSE README.md SECURITY.md package.json .gitignore logo quellcode werkzeuge -x "quellcode/node_modules/*" "quellcode/libs.js"`);
console.log('ok  web/silentboard/ (Version ' + version + ')');

fs.rmSync('libs.js', { force: true }); // Zwischendatei aufräumen
