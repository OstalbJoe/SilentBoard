// SilentBoard – Copyright (C) 2026 ostalbweb.de
// SPDX-License-Identifier: GPL-3.0-or-later
// Zusätzliche Bedingungen nach GPL Abschnitt 7 (Name, Logo, Urheberhinweis): siehe README.md
// Erzeugt die PNG-App-Symbole aus logo/silentboard-icon.svg (nach Logo-Änderungen ausführen):
//   npm run symbole
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(new URL('../quellcode/package.json', import.meta.url));
const { Resvg } = require('@resvg/resvg-js');

const L = new URL('../logo/', import.meta.url).pathname;
const icon = fs.readFileSync(L + 'silentboard-icon.svg', 'utf8');
const inner = icon.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const render = (svg, size, out) => {
  fs.writeFileSync(L + out, new Resvg(svg, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: true } }).render().asPng());
  console.log('ok ', out);
};
render(icon, 192, 'icon-192.png');
render(icon, 512, 'icon-512.png');
// maskable / Apple: Symbol auf dunklem Grund mit Sicherheitsrand (Masken schneiden bis zu 20 % ab)
const padded = s => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#171717"/><svg x="${(128 - s) / 2}" y="${(128 - s) / 2}" width="${s}" height="${s}" viewBox="0 0 128 128">${inner}</svg></svg>`;
render(padded(92), 512, 'icon-maskable-512.png');
render(padded(108), 180, 'apple-touch-icon.png');
