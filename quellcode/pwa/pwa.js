// SilentBoard – Copyright (C) 2026 ostalbweb.de
// SPDX-License-Identifier: GPL-3.0-or-later
/* ---- PWA: Offline-Speicher und „App installieren“ (nur in der Web-Version) ---- */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service Worker:', err));
}
if (!IS_TV) {
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    $('#installBtn').hidden = false;
  });
  $('#installBtn').onclick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $('#installBtn').hidden = true;
  };
  window.addEventListener('appinstalled', () => { $('#installBtn').hidden = true; });
}
