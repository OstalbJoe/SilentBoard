// SilentBoard – Copyright (C) 2026 ostalbweb.de
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Das SilentBoard-Programm (wird mit Bun zu einer einzigen Programmdatei gebaut).
//
// Beim Start lauscht es nur auf diesem Rechner (127.0.0.1) und öffnet SilentBoard im Browser.
// Von außen ist nichts erreichbar. Erst wenn der Trainer im Quiz „Spielrunde öffnen“ klickt,
// startet ein zweiter, im WLAN erreichbarer Teil, über den sich die Handys verbinden.
// „Spielrunde schließen“ beendet ihn wieder.

import os from 'os';
import { Chess } from 'chess.js';
import APP_HTML from '../dist/app.html' with { type: 'text' };
import SPIELER_HTML from '../dist/spieler.html' with { type: 'text' };

const LOCAL_PORT = +process.env.SB_PORT || 8642;   // SB_PORT nur zum Testen neben einem laufenden SilentBoard
const MAX_PLAYERS = 60;
const NAME_MAX = 20;

/* ------------------------------------------------------------------ */
/* Zustand des Quiz                                                    */
/* ------------------------------------------------------------------ */
const Q = {
  pool: null,            // laufender WLAN-Server oder null
  poolPort: 0,
  code: '',              // Raum-Code (4 Ziffern)
  players: new Map(),    // id -> { id, token, name, total, last, ws, connected }
  byToken: new Map(),    // token -> id
  question: null,        // { id, fen, side, deadline, status: 'open'|'closed'|'done', answers: Map(id -> answer), results }
  history: [],           // abgeschlossene Fragen (für Tabelle und spätere Auswertung)
  trainers: new Set(),   // verbundene Trainer-Fenster
  finished: false,       // Quiz beendet: Endergebnis wird gezeigt
  cancelled: false,      // letzte Frage wurde abgebrochen (Hinweis für die Handys)
  seq: 0,
};
let closeTimer = null;

const rid = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join('');

function cleanName(s) {
  return String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}
function uniqueName(name, exceptId) {
  const taken = new Set([...Q.players.values()].filter(p => p.id !== exceptId).map(p => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let i = 2; ; i++) if (!taken.has(`${name} ${i}`.toLowerCase())) return `${name} ${i}`;
}

// WLAN-Adressen dieses Rechners (virtuelle Netze von Docker & Co. ausgelassen)
function lanAddresses() {
  const out = [];
  for (const [ifname, list] of Object.entries(os.networkInterfaces())) {
    if (/^(docker|br-|veth|virbr|vmnet|vboxnet|lo)/i.test(ifname)) continue;
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push({ ifname, ip: a.address });
  }
  const rank = ip => (ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : ip.startsWith('172.') ? 2 : 3);
  return out.sort((a, b) => rank(a.ip) - rank(b.ip));
}

function standings() {
  const list = [...Q.players.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'de'));
  let rank = 0, prev = null;
  return list.map((p, i) => {
    if (p.total !== prev) { rank = i + 1; prev = p.total; }
    return { id: p.id, name: p.name, total: p.total, last: p.last, rank, connected: p.connected };
  });
}

/* ------------------------------------------------------------------ */
/* Nachrichten an Trainer und Spieler                                  */
/* ------------------------------------------------------------------ */
function trainerState() {
  const q = Q.question;
  return {
    t: 'state',
    now: Date.now(),
    pool: Q.pool ? { open: true, code: Q.code, port: Q.poolPort, addresses: lanAddresses() } : { open: false },
    players: standings(),
    question: q && {
      id: q.id, fen: q.fen, side: q.side, deadline: q.deadline, status: q.status, gameUci: q.gameUci,
      paused: !!q.paused, remaining: q.remaining,
      answers: Object.fromEntries([...q.answers].map(([id, a]) => [id, a])),
      results: q.results || null,
    },
    rounds: Q.history.length,
    finished: Q.finished,
  };
}
function toTrainers() {
  const msg = JSON.stringify(trainerState());
  for (const ws of Q.trainers) ws.send(msg);
}
function playerState(p) {
  const q = Q.question;
  const st = standings().find(s => s.id === p.id);
  const base = { t: 'state', now: Date.now(), name: p.name, total: p.total };
  if (Q.finished) return { ...base, phase: 'final', rank: st ? st.rank : null, of: Q.players.size, rounds: Q.history.length };
  if (!q) return { ...base, phase: 'wait', cancelled: Q.cancelled };
  const a = q.answers.get(p.id) || null;
  if (q.status === 'open' && q.paused) return { ...base, phase: 'paused', answer: a };
  if (q.status === 'open') return { ...base, phase: 'question', question: { id: q.id, fen: q.fen, side: q.side, deadline: q.deadline }, answer: a };
  if (q.status === 'closed') return { ...base, phase: 'closed', answer: a };
  const r = q.results && q.results.players[p.id];
  return { ...base, phase: 'result', answer: a, result: r || { points: 0, cat: a ? 'none' : 'missing' }, best: q.results && q.results.bestSan, game: q.results && q.results.gameSan };
}
function toPlayer(p) { if (p.ws) p.ws.send(JSON.stringify(playerState(p))); }
function toAllPlayers() { for (const p of Q.players.values()) toPlayer(p); }
function broadcast() { toTrainers(); toAllPlayers(); }

/* ------------------------------------------------------------------ */
/* Spielrunde (WLAN-Server) öffnen und schließen                       */
/* ------------------------------------------------------------------ */
function openPool() {
  if (Q.pool) return;
  Q.code = String(1000 + Math.floor(Math.random() * 9000));
  for (let port = LOCAL_PORT + 1; port < LOCAL_PORT + 40; port++) {
    try {
      Q.pool = Bun.serve({
        hostname: '0.0.0.0',
        port,
        fetch(req, server) {
          const url = new URL(req.url);
          if (url.pathname === '/ws') {
            if (server.upgrade(req, { data: { role: 'player', playerId: null } })) return;
            return new Response('Upgrade erwartet', { status: 400 });
          }
          if (url.pathname === '/' || url.pathname === '/index.html') {
            return new Response(SPIELER_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
          }
          return new Response('Nicht gefunden', { status: 404 });
        },
        websocket: {
          maxPayloadLength: 4096,
          idleTimeout: 120,
          open() {},
          message: onPlayerMessage,
          close(ws) {
            const p = Q.players.get(ws.data.playerId);
            if (p && p.ws === ws) { p.ws = null; p.connected = false; toTrainers(); }
          },
        },
      });
      Q.poolPort = port;
      break;
    } catch { /* Port belegt – nächsten versuchen */ }
  }
  if (!Q.pool) throw new Error('Kein freier Port für die Spielrunde gefunden.');
  log(`Spielrunde geöffnet – Raum ${Q.code}, erreichbar unter: ${lanAddresses().map(a => `http://${a.ip}:${Q.poolPort}`).join(', ') || '(kein WLAN gefunden)'}`);
}
function closePool() {
  if (!Q.pool) return;
  for (const p of Q.players.values()) { try { p.ws && p.ws.close(1000, 'Spielrunde beendet'); } catch { /* schon zu */ } }
  Q.pool.stop(true);
  Q.pool = null;
  Q.players.clear(); Q.byToken.clear();
  Q.question = null; Q.history = []; Q.finished = false;
  clearTimeout(closeTimer);
  log('Spielrunde geschlossen.');
}

/* ------------------------------------------------------------------ */
/* Spieler                                                             */
/* ------------------------------------------------------------------ */
function onPlayerMessage(ws, raw) {
  let m;
  try { m = JSON.parse(raw); } catch { return; }
  if (!m || typeof m !== 'object') return;
  if (m.t === 'join') {
    if (String(m.code || '') !== Q.code) { ws.send(JSON.stringify({ t: 'error', error: 'code' })); return; }
    let p = typeof m.token === 'string' && Q.byToken.has(m.token) ? Q.players.get(Q.byToken.get(m.token)) : null;
    if (!p) {
      const name = cleanName(m.name);
      if (!name) { ws.send(JSON.stringify({ t: 'error', error: 'name' })); return; }
      if (Q.players.size >= MAX_PLAYERS) { ws.send(JSON.stringify({ t: 'error', error: 'full' })); return; }
      p = { id: 'p' + (++Q.seq), token: rid(16), name: uniqueName(name), total: 0, last: null, ws: null, connected: false };
      Q.players.set(p.id, p); Q.byToken.set(p.token, p.id);
    }
    if (p.ws && p.ws !== ws) { try { p.ws.close(4000, 'Auf anderem Gerät angemeldet'); } catch { /* egal */ } }
    p.ws = ws; p.connected = true; ws.data.playerId = p.id;
    ws.send(JSON.stringify({ t: 'joined', id: p.id, token: p.token, name: p.name }));
    toPlayer(p); toTrainers();
    return;
  }
  const p = Q.players.get(ws.data.playerId);
  if (!p) return;
  if (m.t === 'answer') {
    const q = Q.question;
    if (!q || q.status !== 'open' || q.paused || m.qid !== q.id) return;
    if (q.deadline && Date.now() > q.deadline + 1500) return;
    if (m.dontKnow) q.answers.set(p.id, { dontKnow: true, ts: Date.now() });
    else {
      const c = new Chess(q.fen);
      const uci = String(m.uci || '');
      let mv = null;
      try { mv = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }); } catch { mv = null; }
      if (!mv) return;
      q.answers.set(p.id, { uci: mv.from + mv.to + (mv.promotion || ''), san: mv.san, ts: Date.now() });
    }
    toPlayer(p); toTrainers();
  }
}

/* ------------------------------------------------------------------ */
/* Trainer                                                             */
/* ------------------------------------------------------------------ */
function closeQuestion() {
  const q = Q.question;
  if (!q || q.status !== 'open') return;
  q.status = 'closed'; q.paused = false;
  clearTimeout(closeTimer);
  broadcast();
}
function onTrainerMessage(ws, raw) {
  let m;
  try { m = JSON.parse(raw); } catch { return; }
  if (process.env.SB_DEBUG) log(`Trainer: ${String(raw).slice(0, 90)}`);
  try {
    switch (m.t) {
      case 'hello': ws.send(JSON.stringify(trainerState())); return;
      case 'quit': {
        const bye = JSON.stringify({ t: 'bye' });
        for (const t of Q.trainers) t.send(bye);
        quit('Knopf „SilentBoard beenden“');
        return;
      }
      case 'pool-open': openPool(); break;
      case 'pool-close': closePool(); checkAutoExit(); break;
      case 'ask': {
        if (!Q.pool) return;
        let c;
        try { c = new Chess(String(m.fen)); } catch { return; }
        if (c.isGameOver()) return;
        Q.finished = false; Q.cancelled = false;
        const secs = Math.max(0, Math.min(600, +m.seconds || 0));
        Q.question = {
          id: 'q' + (++Q.seq), fen: c.fen(), side: c.turn() === 'w' ? 'white' : 'black',
          deadline: secs ? Date.now() + secs * 1000 : null, status: 'open', answers: new Map(),
          gameUci: typeof m.gameUci === 'string' ? m.gameUci : null, results: null,
        };
        clearTimeout(closeTimer);
        if (secs) closeTimer = setTimeout(closeQuestion, secs * 1000 + 1200);
        break;
      }
      case 'extend': {
        const q = Q.question;
        if (!q || q.status !== 'open') return;
        const add = Math.max(5, Math.min(300, +m.seconds || 30)) * 1000;
        if (q.paused) { if (q.remaining != null) q.remaining += add; break; }
        q.deadline = Math.max(q.deadline || Date.now(), Date.now()) + add;
        clearTimeout(closeTimer);
        closeTimer = setTimeout(closeQuestion, q.deadline - Date.now() + 1200);
        break;
      }
      case 'pause': {
        // Uhr anhalten (z. B. damit jemand, der rausgeflogen ist, den QR-Code neu scannen kann)
        const q = Q.question;
        if (!q || q.status !== 'open' || q.paused) return;
        q.paused = true;
        q.remaining = q.deadline ? Math.max(0, q.deadline - Date.now()) : null;
        q.deadline = null;
        clearTimeout(closeTimer);
        break;
      }
      case 'resume': {
        const q = Q.question;
        if (!q || q.status !== 'open' || !q.paused) return;
        q.paused = false;
        if (q.remaining != null) {
          q.deadline = Date.now() + Math.max(q.remaining, 5000);
          closeTimer = setTimeout(closeQuestion, q.deadline - Date.now() + 1200);
        }
        q.remaining = null;
        break;
      }
      case 'close': closeQuestion(); return;
      case 'results': {
        const q = Q.question;
        if (!q || q.status !== 'closed' || m.qid !== q.id) return;
        const r = m.results || {};
        const players = {};
        for (const p of Q.players.values()) {
          const x = r.players && r.players[p.id];
          const pts = x ? Math.max(0, Math.min(2, Math.round(+x.points || 0))) : 0;
          players[p.id] = { points: pts, cat: String((x && x.cat) || (q.answers.has(p.id) ? 'none' : 'missing')).slice(0, 20), isGame: !!(x && x.isGame), loss: x && x.loss != null ? +x.loss : null };
          p.total += pts; p.last = pts;
        }
        q.results = { players, bestSan: String(r.bestSan || '').slice(0, 12), gameSan: String(r.gameSan || '').slice(0, 12), moves: Array.isArray(r.moves) ? r.moves.slice(0, 60) : [] };
        q.status = 'done';
        Q.history.push({ id: q.id, fen: q.fen, results: q.results, answers: Object.fromEntries(q.answers) });
        break;
      }
      case 'next': Q.question = null; Q.cancelled = false; clearTimeout(closeTimer); break;
      case 'cancel': {
        // Frage abbrechen, ohne zu werten: abgegebene Züge werden verworfen
        const q = Q.question;
        if (!q || q.status === 'done') return;
        Q.question = null; Q.cancelled = true;
        clearTimeout(closeTimer);
        log('Frage abgebrochen – nicht gewertet.');
        break;
      }
      case 'finish': {
        // Quiz beenden: offene Frage verwerfen, Endergebnis an alle
        if (Q.question && Q.question.status !== 'done') return;
        Q.question = null; clearTimeout(closeTimer);
        Q.finished = true;
        log(`Quiz beendet nach ${Q.history.length} Fragen.`);
        break;
      }
      case 'continue': Q.finished = false; break;
      case 'rename': {
        const p = Q.players.get(m.id);
        const name = cleanName(m.name);
        if (p && name) p.name = uniqueName(name, p.id);
        break;
      }
      case 'remove': {
        const p = Q.players.get(m.id);
        if (!p) return;
        try { p.ws && p.ws.close(4001, 'Vom Trainer entfernt'); } catch { /* egal */ }
        Q.players.delete(p.id); Q.byToken.delete(p.token);
        if (Q.question) Q.question.answers.delete(p.id);
        break;
      }
      default: return;
    }
  } catch (err) {
    ws.send(JSON.stringify({ t: 'error', error: String(err.message || err) }));
  }
  broadcast();
}

/* ------------------------------------------------------------------ */
/* Lokaler Server (nur dieser Rechner)                                 */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* Automatisches Beenden                                               */
/* Ohne Spielrunde gilt: Browser zu = SilentBoard zu. Mit offener      */
/* Spielrunde läuft es weiter, damit Spieler und Punkte erhalten bleiben. */
/* ------------------------------------------------------------------ */
const views = new Set();        // offene TV-Fenster (Trainer-Fenster stehen in Q.trainers)
const EXIT_GRACE = 10_000;      // so lange warten, damit ein Neuladen (F5) nichts beendet
const START_WAIT = 120_000;     // öffnet sich gar kein Browserfenster, nach dieser Zeit beenden
let everOpened = false, exitTimer = null;

function windowCount() { return Q.trainers.size + views.size; }
function checkAutoExit() {
  clearTimeout(exitTimer); exitTimer = null;
  if (windowCount() > 0 || !everOpened) return;
  if (Q.pool) {
    log('Alle SilentBoard-Fenster sind zu, die Spielrunde ist aber offen – SilentBoard läuft weiter. Erneut starten holt alles zurück.');
    return;
  }
  log(`Kein SilentBoard-Fenster mehr offen – SilentBoard beendet sich in ${EXIT_GRACE / 1000} Sekunden …`);
  exitTimer = setTimeout(() => quit('Browser geschlossen'), EXIT_GRACE);
}
function windowOpened() {
  if (exitTimer) log('Fenster wieder offen – SilentBoard läuft weiter.');
  clearTimeout(exitTimer); exitTimer = null;
  everOpened = true;
}
function quit(reason) {
  if (Q.pool) closePool();
  log(`SilentBoard beendet (${reason}).`);
  setTimeout(() => process.exit(0), 300);
}

const PAGE = APP_HTML.replace('<!--@@PROGRAMM@@-->', '<script>window.SB_PROGRAM = true;</script>');
function startLocal(port) {
  const origins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
  return Bun.serve({
    hostname: '127.0.0.1',
    port,
    fetch(req, server) {
      const url = new URL(req.url);
      if (url.pathname === '/api/ping') return Response.json({ app: 'silentboard' });
      if (url.pathname === '/ws/trainer') {
        // nur Seiten von SilentBoard selbst dürfen das Quiz steuern
        if (!origins.has(req.headers.get('origin') || '')) return new Response('Verboten', { status: 403 });
        if (server.upgrade(req, { data: { role: 'trainer' } })) return;
        return new Response('Upgrade erwartet', { status: 400 });
      }
      if (url.pathname === '/ws/fenster') {
        // TV-Fenster melden sich hier nur an, damit SilentBoard weiß, dass sie offen sind
        if (!origins.has(req.headers.get('origin') || '')) return new Response('Verboten', { status: 403 });
        if (server.upgrade(req, { data: { role: 'view' } })) return;
        return new Response('Upgrade erwartet', { status: 400 });
      }
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return new Response(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
      }
      return new Response('Nicht gefunden', { status: 404 });
    },
    websocket: {
      maxPayloadLength: 256 * 1024,
      open(ws) {
        windowOpened();
        if (ws.data.role === 'view') { views.add(ws); return; }
        Q.trainers.add(ws); ws.send(JSON.stringify(trainerState()));
      },
      message(ws, raw) { if (ws.data.role === 'trainer') onTrainerMessage(ws, raw); },
      close(ws) { Q.trainers.delete(ws); views.delete(ws); checkAutoExit(); },
    },
  });
}

function log(s) { console.log(`[${new Date().toLocaleTimeString('de-DE')}] ${s}`); }
function openBrowser(url) {
  const cmd = process.platform === 'win32' ? ['cmd', '/c', 'start', '', url]
    : process.platform === 'darwin' ? ['open', url] : ['xdg-open', url];
  try { Bun.spawn(cmd, { stdout: 'ignore', stderr: 'ignore' }); } catch { /* dann eben von Hand öffnen */ }
}

async function main() {
  const url = `http://127.0.0.1:${LOCAL_PORT}/`;
  try {
    startLocal(LOCAL_PORT);
  } catch {
    // Läuft SilentBoard schon? Dann nur den Browser öffnen.
    try {
      const r = await fetch(url + 'api/ping');
      if ((await r.json()).app === 'silentboard') { log('SilentBoard läuft bereits – öffne den Browser.'); openBrowser(url); return; }
    } catch { /* anderes Programm auf dem Port */ }
    console.error(`Port ${LOCAL_PORT} ist von einem anderen Programm belegt. Bitte das andere Programm beenden.`);
    process.exit(1);
  }
  console.log('');
  console.log('  SilentBoard läuft.  © 2026 ostalbweb.de · GPL-3.0');
  console.log(`  Im Browser: ${url}`);
  console.log('');
  console.log('  Schließt du den Browser, beendet sich SilentBoard von selbst.');
  console.log('  Ist im Quiz eine Spielrunde offen, läuft es weiter, bis du sie schließt.');
  console.log('  Dieses Fenster zu schließen beendet SilentBoard sofort.');
  console.log('');
  if (!process.env.SB_NO_BROWSER) openBrowser(url);
  // Öffnet sich gar kein Browserfenster, nicht ewig im Hintergrund weiterlaufen
  setTimeout(() => { if (!everOpened) quit(`kein Browserfenster innerhalb von ${START_WAIT / 60000} Minuten`); }, START_WAIT);
}
main();
