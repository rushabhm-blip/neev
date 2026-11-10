import * as S from './store.js';
import { mountMachine, machineReset, press, toast as machineToast } from './machine-ui.js';
import { mountPhones } from './phone-ui.js';
import { initScene } from './scene.js';

// ---- small helpers
let actx;
function beep(kind = 'ok') {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const tones = { scan: [[1400, 0.07]], ok: [[880, 0.08], [1320, 0.1]], error: [[220, 0.18]], notify: [[660, 0.09], [880, 0.09], [660, 0.09]] }[kind] || [[880, 0.08]];
    let t = actx.currentTime;
    for (const [f, d] of tones) { const o = actx.createOscillator(), g = actx.createGain(); o.type = kind === 'error' ? 'square' : 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02); t += d + 0.02; }
  } catch (e) { /* audio is optional */ }
}
const pageToastEl = document.getElementById('toast'); let tt;
function pageToast(msg) { pageToastEl.textContent = msg; pageToastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => pageToastEl.classList.remove('show'), 2600); }
S.hooks.beep = beep; S.hooks.toast = pageToast;

// ---- slate (writing surface rendered in 3D)
const slateEl = document.getElementById('slate-el');
slateEl.innerHTML = `<div class="sl-head"><b>Writing slate</b><span id="sl-status">Docked</span></div><canvas id="sl-canvas" width="1000" height="780"></canvas><div class="sl-foot"><button id="sl-undo">Undo</button><button id="sl-clear">Clear</button><span>Write the item, quantity and price. Then press Recognise on the machine.</span></div>`;
const canvas = slateEl.querySelector('#sl-canvas'); const ctx = canvas.getContext('2d');
let strokes = [], cur = null;
function paint() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(100,120,150,.18)'; ctx.lineWidth = 2;
  for (let y = 130; y < canvas.height; y += 130) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(canvas.width - 40, y); ctx.stroke(); }
  if (!strokes.length && !cur) { ctx.fillStyle = 'rgba(80,95,120,.35)'; ctx.font = '500 44px Inter, Arial'; ctx.fillText('Write here with the stylus…', 70, 100); }
  ctx.strokeStyle = '#161c2a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of cur ? [...strokes, cur] : strokes) { if (s.length < 2) { if (s[0]) { ctx.beginPath(); ctx.arc(s[0][0], s[0][1], 4.5, 0, 7); ctx.fill(); } continue; } ctx.beginPath(); ctx.moveTo(s[0][0], s[0][1]); for (let i = 1; i < s.length; i++) { const m = [(s[i - 1][0] + s[i][0]) / 2, (s[i - 1][1] + s[i][1]) / 2]; ctx.quadraticCurveTo(s[i - 1][0], s[i - 1][1], m[0], m[1]); } ctx.stroke(); }
}
const pt = (e) => { const r = canvas.getBoundingClientRect(); const ox = e.offsetX, oy = e.offsetY; return [Math.max(0, Math.min(canvas.width, ox)), Math.max(0, Math.min(canvas.height, oy))]; };
canvas.addEventListener('pointerdown', (e) => { e.stopPropagation(); canvas.setPointerCapture(e.pointerId); cur = [pt(e)]; paint(); });
canvas.addEventListener('pointermove', (e) => { if (!cur) return; e.stopPropagation(); cur.push(pt(e)); paint(); });
const end = (e) => { if (!cur) return; e.stopPropagation(); strokes.push(cur); cur = null; paint(); S.setSlate({ strokes: strokes.length }); };
canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
slateEl.querySelector('#sl-undo').addEventListener('click', () => { strokes.pop(); paint(); S.setSlate({ strokes: strokes.length }); });
slateEl.querySelector('#sl-clear').addEventListener('click', () => { strokes = []; paint(); S.setSlate({ strokes: 0 }); });
slateEl.addEventListener('pointerdown', (e) => e.stopPropagation());
paint();
S.on((st) => { if (st.slate.strokes === 0 && strokes.length) { strokes = []; paint(); } slateEl.querySelector('#sl-status').textContent = st.slate.docked ? 'Docked' : 'Connected'; });

// ---- machine screen must not trigger orbiting
const screenEl = document.getElementById('machine-screen');
screenEl.addEventListener('pointerdown', (e) => e.stopPropagation());
mountMachine(screenEl);
const phones = mountPhones(document.getElementById('seller'), document.getElementById('customer'));

// ---- 3D
const scene = initScene({ container: document.getElementById('three'), screenEl, slateEl, onKey: (k) => { beep('scan'); press(k); } });
S.hooks.print = (sale) => scene.printReceipt(sale);

const slateBtn = document.getElementById('btn-slate');
function syncSlateBtn() { slateBtn.firstElementChild.textContent = S.state.slate.docked ? 'Undock slate' : 'Dock slate'; slateBtn.classList.toggle('on', !S.state.slate.docked); }
slateBtn.addEventListener('click', () => { const docked = !S.state.slate.docked; S.setSlate({ docked }); scene.setSlateDocked(docked); if (!docked) pageToast('Slate slid out. Write on it with the mouse.'); });
S.on(syncSlateBtn); syncSlateBtn();

document.getElementById('btn-view').addEventListener('click', () => scene.resetView());
function resetAll() { S.reset(); strokes = []; paint(); scene.setSlateDocked(true); machineReset(); phones.seller.reset(); phones.customer.reset(); syncSlateBtn(); }
document.getElementById('btn-reset').addEventListener('click', resetAll);
document.addEventListener('neev-reset', () => { strokes = []; paint(); scene.setSlateDocked(true); machineReset(); phones.seller.reset(); phones.customer.reset(); syncSlateBtn(); });

const guide = document.getElementById('guide');
document.getElementById('guide-toggle').addEventListener('click', () => guide.classList.toggle('closed'));
window.neev = { S, scene };
