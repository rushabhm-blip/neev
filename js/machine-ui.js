import * as S from './store.js';
const { state, money, byId, available } = S;

// Machine UI state (screen routing + inputs). Business data lives in store.js.
const m = { screen: 'setup', cash: '', pay: 'cash', order: null, code: '', draft: null, mode: 'write', toast: '' };
let root;

const icon = (n) => ({
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cart: '<path d="M3 4h2l2.5 10h10L20 7H6.5M9 20h.01M17 20h.01"/>',
  box: '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9zM3 7.5 12 12l9-4.5M12 12v9"/>',
  list: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M5 12.5 10 17.5 19 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  scan: '<path d="M4 8V5h3M17 5h3v3M4 16v3h3M20 16v3h-3M8 9v6M11 9v6M14 9v6M17 9v6"/>',
  printer: '<path d="M7 9V3h10v6M7 17H4V9h16v8h-3M7 14h10v7H7z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',
  store: '<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>',
  warn: '<path d="M12 3 2 21h20zM12 10v5M12 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bag: '<path d="M6 8h12l1 12H5zM9 8a3 3 0 0 1 6 0"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
}[n] || '');
const I = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon(n)}</svg>`;
const thumb = (p, size = 64) => p.img ? `<img src="${p.img}" style="width:${size}px;height:${size}px" alt="">` : `<span class="emo" style="width:${size}px;height:${size}px;font-size:${size * .55}px">${p.emoji || '📦'}</span>`;
const nav = (a) => `<nav class="m-nav">${[['home', 'Home', 'home'], ['sell', 'Sell', 'cart'], ['stock', 'Stock', 'box'], ['orders', 'Orders', 'list']].map(([k, l, ic]) => `<button data-act="go" data-to="${k}" class="${a === k ? 'on' : ''}">${I(ic, 22)}<span>${l}</span></button>`).join('')}</nav>`;
const top = (title, back) => `<header class="m-top"><div class="brand">neev</div><div class="shop">${I('store', 18)} ${state.shop.name}</div><div class="spacer"></div>${state.conditions.alert && !state.conditions.snoozed ? `<button class="chipbtn warn" data-act="go" data-to="cond">${I('warn', 16)} Alert</button>` : ''}<span class="wifi">${I('wifi', 20)}</span><span class="clock">10:24</span></header>${title ? `<div class="m-title">${back ? `<button class="back" data-act="back">${I('back', 24)}</button>` : ''}<h2>${title}</h2></div>` : ''}`;
const pendingCount = () => state.orders.filter((o) => o.status === 'pending').length;

const screens = {
  setup() {
    return `${top()}<div class="m-body center"><div class="pair"><div class="eyebrow">PAIRING CODE</div><div class="code">NV-${state.shop.code}</div><div class="muted">${state.shop.paired ? 'Paired with the seller phone.' : 'Waiting for the seller phone'}</div></div>
    <ol class="steps"><li>${I('phone', 22)} Open the NEEV seller app</li><li>${I('plus', 22)} Choose <b>Pair machine</b></li><li>${I('check', 22)} Enter this code</li></ol>
    ${state.shop.paired ? `<button class="primary wide" data-primary data-act="go" data-to="home">${I('check', 22)} Start selling</button>` : `<button class="ghost small" data-act="skip-setup">Demo: skip pairing</button>`}</div>`;
  },
  home() {
    const draft = state.cart.length;
    return `${top()}<div class="m-body"><div class="hello"><div><h1>Good morning!</h1><span class="muted">${state.shop.name} · Counter ready</span></div><button class="alertbtn" data-act="go" data-to="cond">${I('bell', 24)}<small>Alerts</small>${state.conditions.alert && !state.conditions.snoozed ? '<i></i>' : ''}</button></div>
    <div class="tiles"><button class="tile hero" data-primary data-act="go" data-to="sell">${I('cart', 54)}<b>${draft ? 'Continue sale' : 'New sale'}</b><span>${draft ? `Saved bill · ${draft} item${draft > 1 ? 's' : ''} · ${money(S.cartTotal())}` : 'Bill and collect payment'}</span></button>
    <button class="tile" data-act="go" data-to="stock">${I('box', 40)}<b>Add stock</b><span>Receive new items</span></button>
    <button class="tile" data-act="go" data-to="orders">${I('list', 40)}<b>Orders</b><span>Pickup requests</span>${pendingCount() ? `<em>${pendingCount()}</em>` : ''}</button></div>
    <h3>Quick items</h3><div class="quick">${['tea', 'rice', 'potato'].map((id) => { const p = byId(id); return `<button class="qi" data-act="add" data-id="${id}">${thumb(p, 54)}<div><b>${p.name}</b><span>${money(p.price)}</span></div><i>+ Add</i></button>`; }).join('')}</div></div>${nav('home')}`;
  },
  sell() {
    const total = S.cartTotal();
    const grid = state.products.filter((p) => p.published || p.stock > 0).slice(0, 6);
    return `${top('New sale', true)}<div class="m-body split"><div class="grid3">${grid.map((p) => `<button class="prod ${available(p) <= 0 ? 'out' : ''}" data-act="add" data-id="${p.id}">${thumb(p, 78)}<b>${p.name}</b><span>${money(p.price)}</span><small>${available(p) <= 0 ? 'Out of stock' : available(p) + ' ' + (p.unit === 'kg' ? 'kg' : 'left')}</small></button>`).join('')}</div>
    <aside class="cart"><div class="row"><b>Cart</b><span class="muted">(${state.cart.length} item${state.cart.length === 1 ? '' : 's'})</span><button class="link" data-act="clear">Clear</button></div>
    <div class="lines">${state.cart.length ? state.cart.map((l) => { const p = byId(l.id); return `<div class="line">${thumb(p, 44)}<div class="ln"><b>${p.name}</b><span>${money(p.price)} each</span><div class="qty"><button data-act="dec" data-id="${l.id}">–</button><i>${l.qty}</i><button data-act="inc" data-id="${l.id}">+</button></div></div><b class="amt">${money(p.price * l.qty)}</b></div>`; }).join('') : `<div class="empty">${I('scan', 34)}<span>Tap a product, or press the <b>Scan</b> key</span></div>`}</div>
    <div class="total"><span>Total</span><b>${money(total)}</b></div><button class="primary wide" data-primary data-act="pay" ${state.cart.length ? '' : 'disabled'}>Review bill ${I('arrow', 22)}</button></aside></div>${nav('sell')}`;
  },
  pay() {
    const total = S.cartTotal();
    const cash = m.cash === '' ? total : Number(m.cash);
    const change = Math.max(0, cash - total);
    const enough = m.pay === 'upi' || cash >= total;
    return `${top('Payment', true)}<div class="m-body split pay"><section class="card"><b>Items (${state.cart.length})</b>${state.cart.map((l) => { const p = byId(l.id); return `<div class="line">${thumb(p, 44)}<div class="ln"><b>${p.name}</b><span>${l.qty} × ${money(p.price)}</span></div><b class="amt">${money(p.price * l.qty)}</b></div>`; }).join('')}<div class="sub"><span>Subtotal</span><span>${money(total)}</span></div><div class="grand"><span>Total</span><b>${money(total)}</b></div></section>
    <section class="card"><b>Payment method</b><div class="seg"><button class="${m.pay === 'cash' ? 'on' : ''}" data-act="paym" data-m="cash">Cash</button><button class="${m.pay === 'upi' ? 'on' : ''}" data-act="paym" data-m="upi">UPI</button></div>
    ${m.pay === 'cash' ? `<label>Cash received</label><div class="field big">${money(cash)}</div><div class="keys">${['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '⌫'].map((k) => `<button data-act="key" data-k="${k}">${k}</button>`).join('')}<div class="change"><small>Change</small><b>${money(change)}</b></div></div>` : `<div class="upi">${I('phone', 40)}<b>Ask the customer to scan the UPI code</b><span class="muted">Payment stays pending until the provider confirms. (Demo provider)</span></div>`}
    <button class="primary wide" data-primary data-act="confirm" ${enough ? '' : 'disabled'}>${I('check', 22)} ${m.pay === 'cash' ? 'Confirm cash sale' : 'Provider confirmed'}</button></section></div>${nav('sell')}`;
  },
  done() {
    const s = state.lastSale;
    if (!s) return screens.home();
    const first = s.items[0];
    return `${top()}<div class="m-body done"><div class="okc">${I('check', 44)}</div><h1>Sale complete</h1><div class="pill">${money(s.total)} paid in ${s.method === 'cash' ? 'cash' : 'UPI'}</div>
    <div class="split2"><div class="receipt"><div class="rh"><b>${state.shop.name}</b><span>#${s.no}</span></div><small>${s.when.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small><hr>${s.items.map((l) => `<div class="rl"><span>${l.name}<br><small>${l.qty} × ${money(l.price)}</small></span><b>${money(l.price * l.qty)}</b></div>`).join('')}<hr><div class="rl"><b>Total</b><b>${money(s.total)}</b></div><div class="rl"><span>Payment</span><span>${s.method === 'cash' ? 'Cash' : 'UPI'}</span></div></div>
    <div class="acts"><div class="stockpill">${I('box', 26)} Stock <b>${s.stock[first.id]} → ${s.stock[first.id] - first.qty}</b></div><button class="outline" data-act="print">${I('printer', 22)} Print receipt</button><button class="primary wide" data-primary data-act="next">Next customer ${I('arrow', 22)}</button></div></div></div>${nav('sell')}`;
  },
  stock() {
    return `${top('Add stock', true)}<div class="m-body"><h3>How do you want to add stock?</h3><div class="modes">${[['write', 'edit', 'Write on slate', 'Write item, quantity and price'], ['speak', 'mic', 'Speak', 'Say the item, quantity and price'], ['scan', 'scan', 'Scan barcode', "Use a product's barcode"]].map(([k, ic, t, d]) => `<button class="mode ${m.mode === k ? 'on' : ''}" data-act="mode" data-m="${k}">${I(ic, 44)}<b>${t}</b><span>${d}</span></button>`).join('')}</div>
    <button class="primary wide" data-primary data-act="startadd">Continue ${I('arrow', 22)}</button>
    <h3>Recently used products</h3><div class="quick">${['onion', 'tea', 'potato'].map((id) => { const p = byId(id); return `<div class="qi">${thumb(p, 54)}<div><b>${p.name}</b><span>On hand ${p.stock}</span></div></div>`; }).join('')}</div></div>${nav('stock')}`;
  },
  write() {
    const docked = state.slate.docked;
    return `${top('Write on slate', true)}<div class="m-body write"><div class="slatecard">${docked ? `<div class="hint">${I('edit', 44)}<b>The slate is docked under the machine</b><span>Use <b>Undock slate</b> below the machine to slide it out, then write with the stylus.</span></div>` : `<div class="hint ok">${I('check', 44)}<b>Slate connected</b><span>${state.slate.strokes ? `${state.slate.strokes} stroke${state.slate.strokes > 1 ? 's' : ''} captured.` : 'Write on the slate in front of the machine. Try: “Tomatoes, 30 kg, ₹40 per kg”.'}</span></div>`}</div>
    <div class="side"><div class="pill soft">${docked ? 'Slate docked' : 'Slate connected'}</div><button class="primary wide" data-primary data-act="recog">${I('edit', 22)} Recognise writing</button><button class="outline wide" data-act="speakdemo">${I('mic', 22)} Or speak instead</button><small class="muted">Prototype: recognition is simulated. It returns the sample entry for any writing.</small></div></div>${nav('stock')}`;
  },
  review() {
    const d = m.draft;
    return `${top('Review stock', true)}<div class="m-body review"><div class="rv"><div class="photo">${d.name.toLowerCase().includes('tomato') ? '<img src="assets/tomato.png" alt="">' : '<span class="emo" style="font-size:80px">📦</span>'}</div><div class="fields"><h2>${d.name} <i class="tick">${I('check', 16)}</i></h2><small class="ok">Recognised • 98% confidence</small><div class="frow"><label>Quantity received *<input data-bind="qty" value="${d.qty}" inputmode="decimal"></label><label>Unit *<select data-bind="unit"><option ${d.unit === 'kg' ? 'selected' : ''}>kg</option><option ${d.unit === 'pcs' ? 'selected' : ''}>pcs</option><option ${d.unit === 'pack' ? 'selected' : ''}>pack</option></select></label></div><label>Selling price *<input data-bind="price" value="${d.price}" inputmode="decimal"></label></div></div>
    <div class="beforeafter"><div class="ba"><small>Existing stock</small><b>${(byId(d.id) ? byId(d.id).stock : 0)} ${d.unit}</b></div>${I('arrow', 26)}<div class="ba new"><small>New stock (after adding)</small><b>${(byId(d.id) ? byId(d.id).stock : 0) + Number(d.qty || 0)} ${d.unit}</b></div></div>
    <div class="row2"><button class="outline" data-act="back">${I('edit', 22)} Edit details</button><button class="primary" data-primary data-act="savestock">${I('check', 22)} Save stock</button></div></div>${nav('stock')}`;
  },
  saved() {
    const ls = state.lastStock; const p = ls && byId(ls.id);
    if (!p) return screens.home();
    return `${top()}<div class="m-body"><div class="banner ok">${I('check', 26)}<b>Stock saved</b></div><div class="savedrow"><div class="photo sm">${thumb(p, 120)}</div><div class="sv"><div class="rowb"><h2>${p.name}</h2><span class="pill amber">${p.published ? 'Published' : 'Not published'}</span></div><div class="stats"><div class="stat ok"><small>On-hand stock</small><b>${p.stock} ${p.unit}</b></div><div class="stat"><small>Reserved</small><b>${p.reserved} ${p.unit}</b></div><div class="stat"><small>Available</small><b class="g">${available(p)} ${p.unit}</b></div></div></div></div><div class="mv">${I('box', 22)}<div><b>Stock movement</b><br>+${ls.qty} ${p.unit} received · 10:32</div></div>
    <div class="row2"><button class="primary" data-primary data-act="createlisting">${I('store', 22)} ${p.published ? 'View listing' : 'Create listing'}</button><button class="outline" data-act="addmore">${I('plus', 22)} Add another item</button></div></div>${nav('stock')}`;
  },
  orders() {
    const list = state.orders;
    return `${top('Pickups', false)}<div class="m-body"><div class="tabs">${['pending', 'accepted', 'ready'].map((k) => `<span class="tb">${k[0].toUpperCase() + k.slice(1)} <i>${list.filter((o) => o.status === k).length}</i></span>`).join('')}</div>
    <div class="olist">${list.length ? list.map((o) => { const p = byId(o.productId); return `<button class="orow ${o.status}" data-act="open" data-id="${o.id}">${thumb(p, 50)}<div><b>#${o.id}</b> · ${p.name}<br><small>${o.customer} · qty ${o.qty}</small></div><span class="st">${o.status}</span></button>`; }).join('') : `<div class="empty big">${I('list', 40)}<span>No pickup requests yet.<br>Request one from the <b>Customer</b> phone.</span></div>`}</div></div>${nav('orders')}`;
  },
  order() {
    const o = S.getOrder(m.order); if (!o) return screens.orders();
    const p = byId(o.productId);
    const actions = { pending: `<button class="primary" data-primary data-act="accept">${I('check', 22)} Accept & reserve</button><button class="outline" data-act="decline">${I('x', 22)} Decline</button>`, accepted: `<button class="primary" data-primary data-act="ready">${I('bag', 22)} Mark ready for pickup</button><button class="outline" data-act="cancelo">${I('x', 22)} Cancel</button>`, ready: '', completed: `<div class="banner ok">${I('check', 26)}<b>Collected · stock ${o.stockAfter + o.qty} → ${o.stockAfter}</b></div>`, declined: `<div class="banner">Declined. Nothing was reserved.</div>`, cancelled: `<div class="banner">Cancelled. Reservation released.</div>` }[o.status];
    const codeBlock = o.status === 'ready' ? `<div class="codeentry"><b>Enter pickup code</b><div class="cd">${[0, 1, 2, 3].map((i) => `<i class="${m.code[i] ? 'f' : ''}">${m.code[i] || ''}</i>`).join('')}</div><div class="keys small">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'ok'].map((k) => `<button data-act="ckey" data-k="${k}">${k === 'ok' ? '✓' : k}</button>`).join('')}</div></div>` : '';
    return `${top('Pickup ' + o.id, true)}<div class="m-body ord"><div class="card od">${thumb(p, 120)}<div><h2>${p.name}</h2><b>${money(p.price)}</b><div class="chips"><span>Qty ${o.qty}</span><span>Available ${available(p) + (o.status === 'pending' ? 0 : 0)}</span></div><div class="info">${I('phone', 18)} ${o.customer} · +91 98765 43210</div><div class="info">${I('clock', 18)} Pickup today, before 5:00 PM</div><div class="info">On hand <b>${p.stock}</b> · Reserved <b>${p.reserved}</b></div></div></div><div class="oa">${codeBlock}${actions ? `<div class="row2 ${o.status === 'ready' ? 'single' : ''}">${actions}</div>` : ''}${o.status === 'ready' ? `<button class="primary wide" data-primary data-act="verify">${I('check', 22)} Complete collection</button>` : ''}${m.codeErr ? `<div class="err">${m.codeErr}</div>` : ''}</div></div>${nav('orders')}`;
  },
  cond() {
    const c = state.conditions;
    return `${top('Shop conditions', true)}<div class="m-body"><div class="tiles2"><div class="stat warm"><small>Temperature</small><b>${c.air}°C</b></div><div class="stat cool"><small>Humidity</small><b>${c.hum}%</b></div><div class="stat"><small>Surface (IR)</small><b>${c.surface}°C</b></div></div>
    <div class="chart"><b>Temperature trend (Air)</b><svg viewBox="0 0 700 120" preserveAspectRatio="none"><line x1="0" y1="${120 - (c.limit - 26) * 10}" x2="700" y2="${120 - (c.limit - 26) * 10}" stroke="#F59E0B" stroke-dasharray="6 6"/><polyline fill="none" stroke="#2F6FEF" stroke-width="3" points="${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `${i * 77},${120 - (c.air - 26 - (9 - i) * (c.alert ? .35 : .05) + Math.sin(i * 1.7) * .4) * 10}`).join(' ')}"/></svg><small class="muted">Limit ${c.limit}°C · sensor source: air sensor, 10:24</small></div>
    <div class="row2">${c.alert ? `<div class="banner warn">${I('warn', 26)}<b>Above configured limit</b></div><button class="primary" data-primary data-act="ack">${I('check', 22)} Acknowledge</button>` : `<div class="banner ok">${I('check', 26)}<b>Within limits</b></div><button class="outline" data-act="heat">Demo: simulate heatwave</button>`}</div>${c.alert ? '<button class="outline wide" data-act="snooze">Snooze 15 min</button>' : ''}</div>${nav('home')}`;
  },
};
function render() {
  if (!root) return;
  const fn = screens[m.screen] || screens.home;
  const keep = root.querySelector('[data-bind]:focus');
  root.querySelector('.m-screen').innerHTML = fn();
  root.querySelector('.toast').textContent = m.toast;
  root.querySelector('.toast').classList.toggle('show', !!m.toast);
  if (keep) { const el = root.querySelector(`[data-bind="${keep.dataset.bind}"]`); if (el) { el.focus(); el.setSelectionRange?.(el.value.length, el.value.length); } }
}
let toastT;
export function toast(msg) { m.toast = msg; render(); clearTimeout(toastT); toastT = setTimeout(() => { m.toast = ''; render(); }, 2600); }

const go = (s) => { m.screen = s; m.codeErr = ''; render(); };
const history = [];
function nav2(s) { history.push(m.screen); go(s); }
const dest = { home: 'home', sell: 'sell', stock: 'stock', orders: 'orders', cond: 'cond' };

const actions = {
  go: (d) => { history.length = 0; go(dest[d.to] || d.to); },
  back: () => { const t = m.screen; if (t === 'review') return go('write'); if (t === 'pay') return go('sell'); if (t === 'order') return go('orders'); go(history.pop() || (['write', 'saved'].includes(t) ? 'stock' : 'home')); },
  'skip-setup': () => { state.shop.paired = true; S.emit(); go('home'); },
  add: (d) => S.addToCart(d.id), inc: (d) => S.setQty(d.id, state.cart.find((l) => l.id === d.id).qty + 1), dec: (d) => S.setQty(d.id, state.cart.find((l) => l.id === d.id).qty - 1), clear: () => S.clearCart(),
  pay: () => { m.cash = ''; m.pay = 'cash'; go('pay'); },
  paym: (d) => { m.pay = d.m; m.cash = ''; render(); },
  key: (d) => { const k = d.k; let v = m.cash === '' ? '' : String(m.cash); v = k === '⌫' ? v.slice(0, -1) : (v + k).replace(/^0+(?=\d)/, ''); m.cash = v.slice(0, 6); render(); },
  confirm: () => { const total = S.cartTotal(); const cash = m.cash === '' ? total : Number(m.cash); if (S.completeSale(m.pay, m.pay === 'cash' ? cash : total)) go('done'); },
  print: () => { S.hooks.print(state.lastSale); toast('Printing receipt…'); },
  next: () => go('sell'),
  mode: (d) => { m.mode = d.m; render(); },
  startadd: () => { if (m.mode === 'write') go('write'); else { toast(m.mode === 'speak' ? 'Listening… (demo) heard “Tomatoes 30 kilos 40 rupees”' : 'Scanned a barcode (demo) → Tomatoes'); actions.recog(true); } },
  recog: (force) => { if (force !== true) { if (state.slate.docked) return toast('Slide the slate out first, then write on it.'); if (!state.slate.strokes) return toast('Write something on the slate first.'); } m.draft = { id: 'tomatoes', name: 'Tomatoes', qty: '30', unit: 'kg', price: '40' }; if (!byId('tomatoes')) S.state.products.push({ id: 'tomatoes', name: 'Tomatoes', unit: 'kg', price: 40, stock: 0, reserved: 0, emoji: '🍅', img: 'assets/tomato.png', published: false }); go('review'); },
  speakdemo: () => actions.recog(true),
  savestock: () => { const d = m.draft; const qty = Number(d.qty); const price = Number(d.price); if (!(qty > 0) || !(price > 0)) return toast('Enter a quantity and a price.'); S.receiveStock({ name: d.name, qty, unit: d.unit, price }); S.setSlate({ strokes: 0 }); go('saved'); },
  createlisting: () => { const id = state.lastStock.id; if (!byId(id).published) { S.publish(id, true); toast('Listed. Customers nearby can find it.'); } else toast('Already listed.'); },
  addmore: () => go('stock'),
  open: (d) => { m.order = d.id; m.code = ''; go('order'); },
  accept: () => S.acceptOrder(m.order), decline: () => S.declineOrder(m.order), ready: () => { S.markReady(m.order); toast('Customer notified. Ask for the 4-digit code.'); }, cancelo: () => S.cancelOrder(m.order),
  ckey: (d) => { if (d.k === '⌫') m.code = m.code.slice(0, -1); else if (d.k === 'ok') return actions.verify(); else if (m.code.length < 4) m.code += d.k; m.codeErr = ''; render(); },
  verify: () => { const r = S.completePickup(m.order, m.code); if (r === 'bad-code') { m.codeErr = 'Code does not match. Ask the customer to show it again.'; S.hooks.beep('error'); render(); } else if (r === 'ok') { m.code = ''; toast('Collection complete. Stock updated once.'); } },
  heat: () => S.setConditions({ air: 34, hum: 68, surface: 31, alert: true, snoozed: false }), ack: () => S.setConditions({ alert: false, air: 31, hum: 62 }), snooze: () => { S.setConditions({ snoozed: true }); toast('Snoozed for 15 min'); },
};

export function mountMachine(el) {
  root = el;
  el.innerHTML = '<div class="m-screen"></div><div class="toast"></div>';
  el.addEventListener('click', (e) => { const a = e.target.closest('[data-act]'); if (!a || a.disabled) return; const f = actions[a.dataset.act]; if (f) { f({ ...a.dataset }); } });
  el.addEventListener('input', (e) => { const b = e.target.dataset.bind; if (b && m.draft) { m.draft[b] = e.target.value; render(); } });
  el.addEventListener('change', (e) => { const b = e.target.dataset.bind; if (b && m.draft) { m.draft[b] = e.target.value; render(); } });
  S.on(() => { if (!state.shop.paired && m.screen !== 'setup') m.screen = 'setup'; if (state.shop.paired && m.screen === 'setup') m.screen = 'home'; render(); });
  m.screen = state.shop.paired ? 'home' : 'setup';
  render();
}
export const machineReset = () => { Object.assign(m, { screen: 'setup', cash: '', pay: 'cash', order: null, code: '', draft: null, mode: 'write', toast: '' }); render(); };

// Hardware keys
const scanOrder = ['tea', 'rice', 'milk', 'potato'];
let scanI = 0;
export function press(key) {
  if (key === 'back') return actions.back();
  if (key === 'ok') { const b = root.querySelector('[data-primary]:not([disabled])'); if (b) b.click(); else S.hooks.beep('error'); return; }
  if (key === 'scan') {
    if (m.screen === 'sell' || m.screen === 'home') { if (m.screen === 'home') go('sell'); S.addToCart(scanOrder[scanI++ % scanOrder.length]); }
    else if (m.screen === 'stock') actions.startadd();
    else toast('Scan works on Sell and Add stock.');
  }
}
