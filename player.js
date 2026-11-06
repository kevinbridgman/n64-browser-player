import {normalizeRom, romKey} from './rom.js';
const $ = selector => document.querySelector(selector);
const status = $('#status');
let started = false, loading = false, failed = false, pending = null, timer = null;
for (const card of document.querySelectorAll('[data-game]')) {
  card.addEventListener('click', () => { $('#game-choice').value = card.dataset.game; updateCards(); $('#rom').focus(); });
}
function updateCards() {
  for (const card of document.querySelectorAll('[data-game]')) card.setAttribute('aria-pressed', String(card.dataset.game === $('#game-choice').value));
}
$('#game-choice').addEventListener('change', updateCards);
updateCards();
try { $('#touch').value = localStorage.getItem('n64-touch') || 'auto'; } catch {}
$('#touch').addEventListener('change', () => { try { localStorage.setItem('n64-touch', $('#touch').value); } catch {} });
function webglAvailable() {
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
}
function fail(message) {
  failed = true;
  clearTimeout(timer);
  status.textContent = message + ' Use “Choose another game” to reload and try again.';
  $('#play').hidden = false;
}
async function persistSave() {
  if (!started) return true;
  if (pending) return pending;
  pending = (async () => {
    try {
      const manager = window.EJS_emulator.gameManager;
      manager.saveSaveFiles();
      await new Promise((resolve, reject) => manager.FS.syncfs(false, error => error ? reject(error) : resolve()));
      $('#save-status').textContent = 'Browser save storage synced at ' + new Date().toLocaleTimeString() + '. Use the game’s save feature to record progress.';
      return true;
    } catch {
      $('#save-status').textContent = 'Browser save storage could not sync. Keep the game open and download a save backup from the emulator menu.';
      return false;
    }
  })().finally(() => { pending = null; });
  return pending;
}
$('#store').addEventListener('click', persistSave);
$('#restart').addEventListener('click', async () => {
  if (started && !await persistSave()) return;
  location.reload();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) void persistSave(); });
$('#start').addEventListener('click', async () => {
  if (loading) return;
  loading = true; $('#start').disabled = true;
  try {
    const file = $('#rom').files[0];
    if (!file) throw Error('Choose your N64 ROM first.');
    if (file.size > 64 * 1024 * 1024) throw Error('ROMs larger than 64 MB are not supported.');
    if (!window.isSecureContext || !crypto.subtle) throw Error('Open this player over HTTPS or localhost.');
    if (!webglAvailable()) throw Error('WebGL is unavailable. Enable browser hardware acceleration and try again.');
    status.textContent = 'Reading and identifying your ROM locally…';
    const {bytes, title} = normalizeRom(await file.arrayBuffer(), $('#game-choice').value);
    const key = await romKey(bytes);
    const touch = $('#touch').value;
    const showTouch = touch === 'on' || (touch === 'auto' && navigator.maxTouchPoints > 0);
    window.EJS_player = '#game';
    window.EJS_core = 'n64';
    window.EJS_gameUrl = URL.createObjectURL(new Blob([bytes], {type:'application/octet-stream'}));
    window.EJS_gameName = key;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_startOnLoaded = true;
    window.EJS_threads = false;
    window.EJS_color = '#779953';
    window.EJS_defaultOptions = {'virtual-gamepad':showTouch ? 'enabled' : 'disabled'};
    window.EJS_ready = () => { if (!failed) status.textContent = 'Emulator loaded. Preparing game…'; };
    window.EJS_onGameStart = () => {
      if (failed) return;
      started = true; clearTimeout(timer);
      $('#store').disabled = false;
      status.textContent = 'Playing ' + title + '. Configure controls in the emulator menu.';
      clearInterval(window.EJS_emulator.saveSaveInterval);
      window.EJS_emulator.saveSaveInterval = null;
      void persistSave();
      setInterval(() => { if (!document.hidden) void persistSave(); }, 5000);
    };
    $('#setup').hidden = true; $('#play').hidden = false;
    $('#playing-title').textContent = title;
    status.textContent = 'Downloading N64 emulator. The first load can take a moment…';
    const loader = document.createElement('script');
    loader.src = window.EJS_pathtodata + 'loader.js';
    loader.onerror = () => fail('Emulator download failed. Check your connection or content blocker.');
    timer = setTimeout(() => { if (!started) status.textContent = 'The emulator is taking longer than expected. Check your connection and WebGL support; you can reload with “Choose another game”.'; }, 90000);
    document.body.appendChild(loader);
  } catch (error) {
    status.textContent = error.message;
    loading = false; $('#start').disabled = false;
  }
});
