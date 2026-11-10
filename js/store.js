// Shared state for the NEEV prototype. One ledger, three surfaces (machine, seller phone, customer phone).
const listeners = new Set();
export const on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const emit = () => listeners.forEach((f) => f(state));

const fresh = () => ({
  shop: { name: 'Asha Stores', type: null, paired: false, code: '4821', lang: 'English' },
  products: [
    { id: 'tea', name: 'Tea 250 g', unit: 'pack', price: 120, stock: 24, reserved: 0, emoji: '🍵', published: true },
    { id: 'rice', name: 'Rice 5 kg', unit: 'pack', price: 340, stock: 10, reserved: 0, emoji: '🍚', published: true },
    { id: 'milk', name: 'Milk 1 L', unit: 'pack', price: 56, stock: 18, reserved: 0, emoji: '🥛', published: true },
    { id: 'onion', name: 'Onions', unit: 'kg', price: 32, stock: 20, reserved: 0, emoji: '🧅', published: true },
    { id: 'potato', name: 'Potatoes', unit: 'kg', price: 28, stock: 25, reserved: 0, emoji: '🥔', published: true },
    { id: 'tomatoes', name: 'Tomatoes', unit: 'kg', price: 40, stock: 0, reserved: 0, img: 'assets/tomato.png', published: false },
    { id: 'shirt', name: 'Blue cotton shirt', unit: 'pcs', price: 650, stock: 6, reserved: 0, img: 'assets/shirt.png', published: true },
    { id: 'rose', name: 'Rose bouquet', unit: 'pcs', price: 350, stock: 4, reserved: 0, img: 'assets/rose.png', published: false },
    { id: 'dupatta', name: 'Printed dupatta', unit: 'pcs', price: 350, stock: 15, reserved: 0, img: 'assets/dupatta.png', published: true },
  ],
  cart: [],            // [{id, qty}]
  orders: [],          // pickup requests
  receipts: [],
  lastSale: null,
  lastStock: null,
  conditions: { air: 31, hum: 62, surface: 29, limit: 32, alert: false, snoozed: false },
  slate: { docked: true, strokes: 0 },
  seq: { order: 1042, receipt: 1042 },
});

export let state = fresh();
export const reset = () => { Object.assign(state, fresh()); emit(); };

export const byId = (id) => state.products.find((p) => p.id === id);
export const available = (p) => p.stock - p.reserved;
export const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
export const cartTotal = () => state.cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0);

// ---- toasts + beep (UI hooks set by main.js)
export const hooks = { toast: () => {}, beep: () => {}, print: () => {} };

// ---- selling
export function addToCart(id) {
  const p = byId(id);
  if (!p) return;
  const line = state.cart.find((l) => l.id === id);
  const inCart = line ? line.qty : 0;
  if (inCart + 1 > available(p)) { hooks.toast(`Only ${available(p)} available for ${p.name}`); hooks.beep('error'); return; }
  if (line) line.qty += 1; else state.cart.push({ id, qty: 1 });
  hooks.beep('scan');
  emit();
}
export function setQty(id, qty) {
  const line = state.cart.find((l) => l.id === id);
  if (!line) return;
  const p = byId(id);
  if (qty <= 0) state.cart = state.cart.filter((l) => l.id !== id);
  else line.qty = Math.min(qty, available(p));
  emit();
}
export function clearCart() { state.cart = []; emit(); }
export function completeSale(method, cashIn) {
  const total = cartTotal();
  if (!state.cart.length) return false;
  for (const l of state.cart) { if (l.qty > available(byId(l.id))) { hooks.toast('Stock changed. Check the bill.'); return false; } }
  const items = state.cart.map((l) => ({ ...l, name: byId(l.id).name, price: byId(l.id).price }));
  const before = {};
  for (const l of state.cart) { const p = byId(l.id); before[l.id] = p.stock; p.stock -= l.qty; }  // deduct exactly once
  const sale = { no: 'N' + state.seq.receipt++, items, total, method, cashIn: cashIn ?? total, when: new Date(), stock: before };
  state.receipts.push(sale);
  state.lastSale = sale;
  state.cart = [];
  hooks.beep('ok');
  emit();
  return true;
}

// ---- adding stock (slate / voice / scan all end up here)
export function receiveStock({ name, qty, unit, price }) {
  const key = name.trim().toLowerCase();
  let p = state.products.find((x) => x.name.toLowerCase().includes(key) || key.includes(x.name.toLowerCase().split(' ')[0]));
  const before = p ? p.stock : 0;
  if (!p) {
    p = { id: key.replace(/\W+/g, '-'), name: name.trim() || 'New item', unit, price, stock: 0, reserved: 0, emoji: '📦', published: false };
    state.products.push(p);
  }
  p.stock += qty; p.unit = unit; p.price = price;
  if (p.id === 'tomatoes' || /tomato/i.test(p.name)) p.img = 'assets/tomato.png';
  state.lastStock = { id: p.id, qty, before, after: p.stock };
  hooks.beep('ok');
  emit();
  return p;
}
export function publish(id, value = true) { const p = byId(id); if (p) { p.published = value; emit(); } }

// ---- pickup
export function requestPickup(productId, qty, customer = 'Meera') {
  const p = byId(productId);
  if (!p || !p.published) return null;
  const o = { id: 'P' + state.seq.order++, productId, qty, customer, status: 'pending', code: String(Math.floor(1000 + Math.random() * 9000)), at: new Date() };
  state.orders.unshift(o);
  hooks.beep('notify');
  hooks.toast(`New pickup request ${o.id} · ${p.name}`);
  emit();
  return o;
}
export const getOrder = (id) => state.orders.find((o) => o.id === id);
export function acceptOrder(id) {
  const o = getOrder(id); const p = o && byId(o.productId);
  if (!o || o.status !== 'pending') return false;
  if (o.qty > available(p)) { hooks.toast('Not enough available. Decline or offer another.'); return false; }
  p.reserved += o.qty; o.status = 'accepted'; emit(); return true;
}
export function declineOrder(id) { const o = getOrder(id); if (o && o.status === 'pending') { o.status = 'declined'; emit(); } }
export function markReady(id) { const o = getOrder(id); if (o && o.status === 'accepted') { o.status = 'ready'; hooks.beep('ok'); emit(); } }
export function completePickup(id, code) {
  const o = getOrder(id); const p = o && byId(o.productId);
  if (!o || o.status !== 'ready') return 'wrong-state';
  if (String(code) !== o.code) return 'bad-code';
  p.reserved -= o.qty; p.stock -= o.qty; o.status = 'completed'; o.stockAfter = p.stock;
  hooks.beep('ok'); emit(); return 'ok';
}
export function cancelOrder(id) {
  const o = getOrder(id); const p = o && byId(o.productId);
  if (!o) return;
  if (o.status === 'accepted' || o.status === 'ready') p.reserved -= o.qty;
  if (o.status !== 'completed') o.status = 'cancelled';
  emit();
}

// ---- shop setup
export function pairMachine(code) {
  if (String(code) === state.shop.code) { state.shop.paired = true; hooks.beep('ok'); emit(); return true; }
  return false;
}
export function setConditions(patch) { Object.assign(state.conditions, patch); emit(); }
export function setSlate(patch) { Object.assign(state.slate, patch); emit(); }
