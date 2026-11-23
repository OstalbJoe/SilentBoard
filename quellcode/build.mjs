// SilentBoard – Copyright (C) 2026 ostalbweb.de
// SPDX-License-Identifier: GPL-3.0-or-later
// Zusätzliche Bedingungen nach GPL Abschnitt 7 (Name, Logo, Urheberhinweis): siehe README.md
// Baut das SilentBoard-Programm:
//   ../dist/app.html        – Trainer-Ansicht (wird ins Programm eingebaut)
//   ../dist/spieler.html    – Seite für die Handys der Spieler (wird ins Programm eingebaut)
//   ../dist/SilentBoard-linux, ../dist/SilentBoard-windows.exe – die fertigen Programmdateien
// Mit "--nur-seiten" werden nur die beiden Seiten gebaut (zum Testen mit "bun programm.mjs").
import fs from 'fs';
import { execFileSync } from 'child_process';

const nm = 'node_modules/';
const REPO = 'https://github.com/OstalbJoe/SilentBoard';
const OUT = '../dist/';
const css = ['chessground.base.css', 'chessground.brown.css', 'chessground.cburnett.css']
  .map(f => fs.readFileSync(nm + 'chessground/assets/' + f, 'utf8')).join('\n');
const libs = fs.readFileSync('libs.js', 'utf8');
if (/<\/script/i.test(libs)) throw new Error('libs enthalten </script');
const libTag = '<script>\n/* chessground 9.2.1 (GPL-3.0-or-later, lichess.org) + chess.js 1.4.0 (BSD-2-Clause, Jeff Hlywa) + qrcode-generator 2.0.4 (MIT, Kazuhiko Arase) – Lizenzen: siehe Dialog „Lizenz & Info“ */\n' + libs + '\n</script>';
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg64 = f => 'data:image/svg+xml;base64,' + fs.readFileSync(f).toString('base64');

function fill(file, values) {
  let html = fs.readFileSync(file, 'utf8');
  for (const [k, v] of Object.entries(values)) {
    if (!html.includes(k)) throw new Error(`${file}: Platzhalter fehlt: ${k}`);
    html = html.split(k).join(v);
  }
  return html;
}

fs.mkdirSync(OUT, { recursive: true });
const app = fill('app.html', {
  '/*@@CG_CSS@@*/': css,
  '<!--@@LIBS@@-->': libTag,
  '@@ICON@@': svg64('../logo/silentboard-icon.svg'),
  '@@LOGO@@': svg64('../logo/silentboard-logo.svg'),
  '@@LOGO_DARK@@': svg64('../logo/silentboard-logo-dunkel.svg'),
  '@@CHESSJS_LICENSE@@': esc(fs.readFileSync(nm + 'chess.js/LICENSE', 'utf8')),
  '@@REPO@@': REPO,
  '@@REPO_SHORT@@': REPO.replace('https://', ''),
  '@@SOURCE_NOTE@@': '',
  '@@SF_JS@@': fs.readFileSync(nm + 'stockfish/bin/stockfish-19-lite-single.js').toString('base64'),
  '@@SF_WASM@@': fs.readFileSync(nm + 'stockfish/bin/stockfish-19-lite-single.wasm').toString('base64'),
});
fs.writeFileSync(OUT + 'app.html', app);
const spieler = fill('spieler.html', {
  '/*@@CG_CSS@@*/': css,
  '<!--@@LIBS@@-->': libTag,
  '@@ICON@@': svg64('../logo/silentboard-icon.svg'),
});
fs.writeFileSync(OUT + 'spieler.html', spieler);
console.log('ok  Seiten:', (app.length / 1048576).toFixed(2), 'MB +', (spieler.length / 1048576).toFixed(2), 'MB');
fs.rmSync('libs.js', { force: true }); // Zwischendatei aufräumen

if (!process.argv.includes('--nur-seiten')) {
  const bun = nm + '.bin/bun';
  for (const [target, file] of [['bun-linux-x64', 'SilentBoard-linux'], ['bun-windows-x64', 'SilentBoard-windows.exe']]) {
    execFileSync(bun, ['build', 'programm.mjs', '--compile', '--minify', `--target=${target}`, `--outfile=${OUT}${file}`], { stdio: ['ignore', 'ignore', 'inherit'] });
    console.log('ok ', file, (fs.statSync(OUT + file).size / 1048576).toFixed(0), 'MB');
  }
}
