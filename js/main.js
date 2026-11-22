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

// ---- machine screen must not trigger orbiting
const screenEl = document.getElementById('machine-screen');
screenEl.addEventListener('pointerdown', (e) => e.stopPropagation());
mountMachine(screenEl);
const phones = mountPhones(document.getElementById('seller'), document.getElementById('customer'));

// ---- 3D
const scene = initScene({ container: document.getElementById('three'), screenEl, onKey: (k) => { beep('scan'); press(k); } });
S.hooks.print = (sale) => scene.printReceipt(sale);
S.hooks.listening = (on) => scene.setListening(on);

// ---- weighing base: lift the machine off, place goods
const dockBtn = document.getElementById('btn-dock');
const goodsBtn = document.getElementById('btn-goods');
const GOODS_LABEL = ['Place bowl', 'Add tomatoes', 'Clear tray'];
function syncBase() {
  const b = S.state.base;
  dockBtn.firstElementChild.textContent = b.docked ? 'Lift machine off base' : 'Dock machine';
  dockBtn.classList.toggle('on', !b.docked);
  goodsBtn.firstElementChild.textContent = GOODS_LABEL[b.goods];
  goodsBtn.classList.toggle('off', b.docked);
  scene.setGoods(b.goods);
  const net = S.baseNet();
  scene.setWeightText(b.docked ? '0.00 kg' : net.toFixed(2) + ' kg');
}
dockBtn.addEventListener('click', () => {
  const docked = !S.state.base.docked;
  S.setBase({ docked, goods: 0, tare: 0 }); scene.setDocked(docked);
  if (!docked) pageToast('Machine lifted off. The base is now a scale. Place goods on it.');
});
goodsBtn.addEventListener('click', () => {
  if (S.state.base.docked) return pageToast('Lift the machine off the base first.');
  const goods = (S.state.base.goods + 1) % 3;
  S.setBase({ goods, tare: goods === 0 ? 0 : S.state.base.tare });
  if (goods === 2) pageToast('Tomatoes on the tray. Press Tare with the bowl alone to zero it.');
});
S.on(syncBase); syncBase();

document.getElementById('btn-view').addEventListener('click', () => scene.resetView());
function resetAll() { S.reset(); scene.setDocked(true); machineReset(); phones.seller.reset(); phones.customer.reset(); syncBase(); }
document.getElementById('btn-reset').addEventListener('click', resetAll);
document.addEventListener('neev-reset', () => { scene.setDocked(true); machineReset(); phones.seller.reset(); phones.customer.reset(); syncBase(); });

const guide = document.getElementById('guide');
document.getElementById('guide-toggle').addEventListener('click', () => guide.classList.toggle('closed'));
window.neev = { S, scene };
