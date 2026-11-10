import * as S from './store.js';
const { state, money, byId, available } = S;

const P = {
  d: { search: '<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/>', back: '<path d="M15 5l-7 7 7 7"/>', chevr: '<path d="M9 6l6 6-6 6"/>', check: '<path d="M5 12.5 10 17.5 19 7"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="14" r="4"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', box: '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9zM3 7.5 12 12l9-4.5M12 12v9"/>', list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>', bag: '<path d="M6 8h12l1 12H5zM9 8a3 3 0 0 1 6 0"/>', store: '<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>', flash: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', dev: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M8 20h8M12 16v4"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>' },
};
const I = (n, s = 22, w = 2) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P.d[n] || ''}</svg>`;
const thumb = (p, s = 64, r = 10) => p.img ? `<img class="th" src="${p.img}" style="width:${s}px;height:${s}px;border-radius:${r}px" alt="">` : `<span class="th emo" style="width:${s}px;height:${s}px;border-radius:${r}px;font-size:${s * .55}px">${p.emoji || '📦'}</span>`;
const bar = (title, back) => `<div class="p-bar">${back ? `<button class="pb" data-act="back">${I('back', 24, 2.4)}</button>` : '<span class="pb"></span>'}<b>${title}</b><span class="pb"></span></div>`;
const tabs = (cur, items) => `<nav class="p-tabs">${items.map(([k, l, ic]) => `<button data-act="tab" data-to="${k}" class="${cur === k ? 'on' : ''}">${I(ic, 24)}<span>${l}</span></button>`).join('')}</nav>`;
const stBadge = (s) => `<span class="sb ${s}">${s}</span>`;

function makePhone(el, name, init, views, handlers) {
  const st = init();
  const rerender = () => {
    const active = document.activeElement;
    const key = el.contains(active) && active.dataset ? active.dataset.bind : null;
    el.querySelector('.p-screen').innerHTML = (views[st.screen] || (() => ''))(st);
    if (key) { const n = el.querySelector(`[data-bind="${key}"]`); if (n) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) {} } }
  };
  el.innerHTML = `<div class="p-screen"></div>`;
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const h = handlers[a.dataset.act]; if (h) { h(st, { ...a.dataset }, el); rerender(); }
  });
  el.addEventListener('input', (e) => { const b = e.target.dataset.bind; if (b) { st[b] = e.target.value; if (e.target.dataset.live) rerender(); } });
  S.on(rerender);
  rerender();
  return { st, rerender, reset: () => { Object.assign(st, init()); rerender(); } };
}

// ================= SELLER PHONE =================
const sellerTabs = (c) => tabs(c, [['home', 'Shop', 'home'], ['cat', 'Catalogue', 'box'], ['orders', 'Orders', 'list'], ['you', 'You', 'user']]);
const sellerViews = {
  welcome: (s) => `<div class="p-pad"><div class="hero-img"><img src="assets/shirt.png" alt=""></div><h1>Welcome to NEEV</h1><p class="muted">Register your shop in a minute.</p><label>Mobile number</label><div class="inp"><b>+91</b><input data-bind="mobile" value="${s.mobile}" inputmode="numeric"></div><button class="primary" data-act="otp">Send OTP</button><div class="langs">${['English', 'Hindi', 'Marathi'].map((l) => `<button data-act="lang" data-l="${l}" class="${state.shop.lang === l ? 'on' : ''}">${l}</button>`).join('')}</div><small class="muted">Prototype: any number works.</small></div>`,
  otp: (s) => `<div class="p-pad">${bar('Verify', 1)}<p class="muted">We sent a 4-digit code to +91 ${s.mobile}. Prototype code: <b>1234</b></p><div class="otp">${[0, 1, 2, 3].map((i) => `<i class="${s.otp[i] ? 'f' : ''}">${s.otp[i] || ''}</i>`).join('')}</div><div class="kp">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) => `<button data-act="okey" data-k="${k}">${k}</button>`).join('')}</div></div>`,
  type: (s) => `<div class="p-pad">${bar('What do you sell?', 1)}<p class="muted">This sets your units and stock rules.</p><div class="types">${[['Produce', 'Sold by kg', '🍅'], ['Packs', 'Sold in packs', '📦'], ['Clothes', 'Sizes, colours', '👕'], ['Flowers', 'Made to order', '🌹']].map(([t, d, e]) => `<button class="type ${s.type === t ? 'on' : ''}" data-act="type" data-t="${t}"><span>${e}</span><b>${t}</b><small>${d}</small>${s.type === t ? `<i>${I('check', 14, 3)}</i>` : ''}</button>`).join('')}</div><button class="primary" data-act="typeNext" ${s.type ? '' : 'disabled'}>Continue</button></div>`,
  pair: (s) => `<div class="p-pad">${bar('Pair your counter', 1)}<p class="muted">Enter the 4-digit code shown on the machine screen.</p><div class="mini-dev">${I('dev', 54)}<b>NV-????</b></div><div class="otp">${[0, 1, 2, 3].map((i) => `<i class="${s.pair[i] ? 'f' : ''}">${s.pair[i] || ''}</i>`).join('')}</div>${s.pairErr ? `<div class="err">${s.pairErr}</div>` : ''}<div class="kp">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) => `<button data-act="pkey" data-k="${k}">${k}</button>`).join('')}</div><button class="primary" data-act="pairGo" ${s.pair.length === 4 ? '' : 'disabled'}>Pair machine</button><button class="link" data-act="skipPair">Demo: skip pairing</button></div>`,
  home: () => {
    const sales = state.receipts.reduce((a, r) => a + r.total, 0);
    const pend = state.orders.filter((o) => o.status === 'pending').length;
    return `<div class="p-pad"><div class="p-head"><b class="logo">NEEV</b></div><div class="shopcard"><div class="av">${I('store', 26)}</div><div><b>${state.shop.name}</b><br><small>Main Market, Civil Lines</small></div><span class="conn ${state.shop.paired ? 'ok' : ''}">${state.shop.paired ? 'Terminal connected' : 'Not paired'}</span></div><h2>Today</h2><div class="stats3"><div><small>Sales</small><b>${money(sales)}</b></div><div><small>Bills</small><b>${state.receipts.length}</b></div><div><small>Requests</small><b>${pend}</b></div></div><h2>Low stock</h2>${state.products.filter((p) => available(p) < 5).map((p) => `<div class="mrow">${thumb(p, 44)}<div><b>${p.name}</b><br><small>${available(p)} ${p.unit} left</small></div></div>`).join('') || '<p class="muted">Nothing low right now.</p>'}</div>${sellerTabs('home')}`;
  },
  cat: (s) => `<div class="p-pad nopad-b"><div class="p-head"><b class="logo">NEEV</b></div><h1 class="h-sm">My catalogue</h1><div class="seg"><button class="${s.filter === 'pub' ? 'on' : ''}" data-act="filter" data-f="pub">Published (${state.products.filter((p) => p.published).length})</button><button class="${s.filter === 'draft' ? 'on' : ''}" data-act="filter" data-f="draft">Drafts (${state.products.filter((p) => !p.published).length})</button></div><div class="plist">${state.products.filter((p) => (s.filter === 'pub') === !!p.published).map((p) => `<button class="prow" data-act="sel" data-id="${p.id}">${thumb(p, 62, 8)}<div><b>${p.name}</b><br><b>${money(p.price)}</b><br><span class="stock ${available(p) > 0 ? '' : 'out'}">${available(p) > 0 ? `In stock · ${available(p)} ${p.unit}` : 'Out of stock'}</span></div>${p.published ? '' : '<em>Draft</em>'}</button>`).join('') || '<p class="muted pad">Nothing here yet. Add stock at the machine and it appears as a draft.</p>'}</div></div>${sellerTabs('cat')}`,
  product: (s) => { const p = byId(s.sel); return `<div class="p-pad nopad-b">${bar('Product details', 1)}<div class="pd"><div class="phb" data-act="camera">${thumb(p, 110, 8)}<i>${I('camera', 16)}</i></div><div class="pf"><label>Product name *</label><div class="inp"><input value="${p.name}" disabled></div><label>Selling price *</label><div class="inp"><input value="₹${p.price}" disabled></div></div></div><div class="sec">${I('box', 20)}<b>Inventory (stock)</b></div><div class="mrow"><span class="tag">${p.unit}</span><span>${p.stock} on hand</span><span class="muted">${p.reserved} reserved</span></div><div class="trow"><div>${I('store', 22)}<span><b>Pickup at shop</b><br><small>Customers can pick up from your shop</small></span></div><i class="tg on"></i></div><div class="trow"><div>${I('search', 22)}<span><b>Show in nearby search</b><br><small>Customers around you can discover this</small></span></div><i class="tg ${p.published ? 'on' : ''}" data-act="togglepub"></i></div><button class="primary stick" data-act="publish">${p.published ? 'Update listing' : 'Publish product'}</button></div>`; },
  camera: (s) => { const p = byId(s.sel); return `<div class="cam"><div class="camtop"><button class="pb" data-act="back">${I('back', 24, 2.4)}</button><b>Add product photo</b><button class="skip" data-act="back">Skip photo</button></div><div class="vf">${p.img ? `<img src="${p.img}" alt="">` : `<div class="noimg">${p.emoji || '📦'}</div>`}<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><span class="hint">Keep the whole item in frame</span></div><div class="shutter"><button data-act="snap"><i></i></button></div></div>`; },
  orders: () => `<div class="p-pad nopad-b"><div class="p-head"><b class="logo">NEEV</b></div><h1 class="h-sm">Orders</h1>${state.orders.length ? state.orders.map((o) => { const p = byId(o.productId); return `<div class="orow2">${thumb(p, 52)}<div><b>#${o.id} · ${p.name}</b><br><small>${o.customer} · qty ${o.qty}</small></div>${stBadge(o.status)}</div>`; }).join('') : '<p class="muted pad">No requests yet. They arrive here and on the machine. Accept them at the counter.</p>'}</div>${sellerTabs('orders')}`,
  you: () => `<div class="p-pad"><div class="p-head"><b class="logo">NEEV</b></div><h1 class="h-sm">You</h1><div class="mrow"><span>${I('user', 22)}</span><div><b>Asha</b><br><small>Owner · ${state.shop.name}</small></div></div><div class="mrow"><span>${I('dev', 22)}</span><div><b>Counter 1</b><br><small>${state.shop.paired ? 'Paired' : 'Not paired'}</small></div></div><h2>Language</h2><div class="langs">${['English', 'Hindi', 'Marathi'].map((l) => `<button data-act="lang" data-l="${l}" class="${state.shop.lang === l ? 'on' : ''}">${l}</button>`).join('')}</div><button class="outline" data-act="resetAll">Reset whole prototype</button></div>${sellerTabs('you')}`,
};
const sellerHandlers = {
  otp: (s) => { s.screen = 'otp'; s.otp = ''; },
  lang: (s, d) => { state.shop.lang = d.l; },
  back: (s) => { s.screen = { otp: 'welcome', type: 'otp', pair: 'type', product: 'cat', camera: 'product' }[s.screen] || 'home'; },
  okey: (s, d) => { if (d.k === '⌫') s.otp = s.otp.slice(0, -1); else if (d.k && s.otp.length < 4) s.otp += d.k; if (s.otp.length === 4) s.screen = 'type'; },
  type: (s, d) => { s.type = d.t; }, typeNext: (s) => { s.screen = state.shop.paired ? 'home' : 'pair'; },
  pkey: (s, d) => { if (d.k === '⌫') s.pair = s.pair.slice(0, -1); else if (d.k && s.pair.length < 4) s.pair += d.k; s.pairErr = ''; },
  pairGo: (s) => { if (S.pairMachine(s.pair)) s.screen = 'home'; else s.pairErr = 'That code does not match the machine. Check the screen and try again.'; },
  skipPair: (s) => { state.shop.paired = true; S.emit(); s.screen = 'home'; },
  tab: (s, d) => { s.screen = d.to; },
  filter: (s, d) => { s.filter = d.f; }, sel: (s, d) => { s.sel = d.id; s.screen = 'product'; },
  camera: (s) => { s.screen = 'camera'; },
  snap: (s) => { S.hooks.beep('scan'); S.hooks.toast('Photo saved to the product'); s.screen = 'product'; },
  togglepub: (s) => { const p = byId(s.sel); S.publish(p.id, !p.published); },
  publish: (s) => { S.publish(s.sel, true); S.hooks.toast('Published. Customers nearby can now find it.'); s.screen = 'cat'; s.filter = 'pub'; },
  resetAll: () => { S.reset(); document.dispatchEvent(new CustomEvent('neev-reset')); },
};

// ================= CUSTOMER PHONE =================
const custTabs = (c) => tabs(c, [['explore', 'Explore', 'home'], ['saved', 'Saved', 'heart'], ['pickups', 'Pickups', 'bag'], ['acct', 'Account', 'user']]);
const dist = (p) => (p.id.length * 37) % 400 + 180;
const custViews = {
  explore: (s) => { const list = state.products.filter((p) => p.published && (!s.q || p.name.toLowerCase().includes(s.q.toLowerCase()))); return `<div class="p-pad nopad-b"><div class="p-head"><b class="logo">NEEV</b><span class="loc">${I('pin', 16)} Chandni Chowk</span></div><div class="inp sr">${I('search', 20)}<input data-bind="q" data-live="1" placeholder="What are you looking for?" value="${s.q}"></div><div class="map">${I('pin', 28)}<i style="left:20%;top:30%"></i><i style="left:62%;top:22%"></i><i style="left:44%;top:60%"></i><i class="me"></i><span>Asha Stores · ${dist(byId('shirt'))} m</span></div><h2>Near you</h2>${list.map((p) => `<button class="prow" data-act="view" data-id="${p.id}">${thumb(p, 62, 8)}<div><b>${p.name}</b><br><b>${money(p.price)}</b><br><small>${I('pin', 12)} Asha Stores · ${dist(p)} m</small></div><span class="stock ${available(p) > 0 ? '' : 'out'}">${available(p) > 0 ? 'In stock' : 'Out'}</span></button>`).join('') || '<p class="muted pad">No matching items.</p>'}</div>${custTabs('explore')}`; },
  product: (s) => { const p = byId(s.sel); const max = available(p); return `<div class="p-pad nopad-b">${bar('Product', 1)}<div class="bigimg">${p.img ? `<img src="${p.img}" alt="">` : `<div class="noimg">${p.emoji}</div>`}</div><div class="rowb"><h2>${p.name}</h2><b class="price">${money(p.price)}</b></div><small class="ok">● ${max} available · Updated 2 min ago</small><div class="qrow"><div><label>Quantity</label><div class="qty"><button data-act="qminus">–</button><i>${s.qty}</i><button data-act="qplus">+</button></div></div><div><label>Pickup</label><div class="sel">Today</div></div></div><div class="mrow">${I('store', 22)}<div><b>Asha Textiles</b><br><small>Shop 18, First floor, Lane B</small></div></div><button class="primary stick" data-act="request" ${max > 0 ? '' : 'disabled'}>${I('bag', 22)} Request pickup</button><small class="muted c">Shop confirms availability</small></div>`; },
  status: (s) => { const o = S.getOrder(s.order); if (!o) return custViews.explore(s); const p = byId(o.productId); const idx = { pending: 0, accepted: 1, ready: 2, completed: 3 }[o.status]; const msg = { pending: ['Awaiting shop acceptance', 'We will notify you once the shop accepts your request.'], accepted: ['Accepted · being prepared', 'Your item is reserved. We will tell you when it is ready.'], ready: ['Ready for pickup', 'Show this code at the shop.'], completed: ['Collected', 'Thank you. Stock was updated once.'], declined: ['Declined', 'The shop could not accept this request. Nothing was reserved.'], cancelled: ['Cancelled', 'Reservation released.'] }[o.status]; return `<div class="p-pad nopad-b">${bar('Pickup request', 1)}<div class="mrow">${thumb(p, 72, 8)}<div><b>${p.name}</b><br><b>${money(p.price)}</b><br><small>Qty ${o.qty}</small></div></div><div class="stepper">${['Requested', 'Accepted', 'Ready'].map((t, i) => `<div class="${i <= idx ? 'on' : ''}"><i>${i <= idx ? I('check', 14, 3) : ''}</i><small>${t}</small></div>`).join('')}</div><div class="note ${o.status === 'ready' || o.status === 'completed' ? 'ok' : ''}"><b>${msg[0]}</b><br><small>${msg[1]}</small></div>${o.status === 'ready' ? `<div class="bigcode">${o.code.split('').map((c) => `<i>${c}</i>`).join('')}</div>` : ''}<div class="mrow">${I('store', 22)}<div><b>Asha Stores</b><br><small>Shop 18, First floor, Lane B</small></div></div>${['pending', 'accepted'].includes(o.status) ? '<button class="outline" data-act="cancelreq">Cancel request</button>' : ''}</div>`; },
  pickups: () => `<div class="p-pad nopad-b"><div class="p-head"><b class="logo">NEEV</b></div><h1 class="h-sm">Pickups</h1>${state.orders.length ? state.orders.map((o) => { const p = byId(o.productId); return `<button class="orow2 btn" data-act="openorder" data-id="${o.id}">${thumb(p, 52)}<div><b>#${o.id} · ${p.name}</b><br><small>Qty ${o.qty}</small></div>${stBadge(o.status)}</button>`; }).join('') : '<p class="muted pad">No pickups yet. Find an item and request one.</p>'}</div>${custTabs('pickups')}`,
  saved: () => `<div class="p-pad"><div class="p-head"><b class="logo">NEEV</b></div><h1 class="h-sm">Saved</h1><p class="muted pad">Nothing saved yet (not part of this prototype).</p></div>${custTabs('saved')}`,
  acct: () => `<div class="p-pad"><div class="p-head"><b class="logo">NEEV</b></div><h1 class="h-sm">Account</h1><div class="mrow"><span>${I('user', 22)}</span><div><b>Meera</b><br><small>+91 98765 43210</small></div></div><p class="muted pad">Location is optional. A typed market area still works.</p></div>${custTabs('acct')}`,
};
const custHandlers = {
  back: (s) => { s.screen = s.screen === 'status' ? 'pickups' : 'explore'; },
  tab: (s, d) => { s.screen = d.to; },
  view: (s, d) => { s.sel = d.id; s.qty = 1; s.screen = 'product'; },
  qminus: (s) => { s.qty = Math.max(1, s.qty - 1); }, qplus: (s) => { s.qty = Math.min(available(byId(s.sel)), s.qty + 1); },
  request: (s) => { const o = S.requestPickup(s.sel, s.qty); if (o) { s.order = o.id; s.screen = 'status'; } },
  cancelreq: (s) => S.cancelOrder(s.order),
  openorder: (s, d) => { s.order = d.id; s.screen = 'status'; },
};

export function mountPhones(sellerEl, customerEl) {
  const seller = makePhone(sellerEl, 'seller', () => ({ screen: 'welcome', mobile: '98765 43210', otp: '', type: null, pair: '', pairErr: '', filter: 'pub', sel: 'shirt' }), sellerViews, sellerHandlers);
  const customer = makePhone(customerEl, 'customer', () => ({ screen: 'explore', q: '', sel: 'shirt', qty: 1, order: null }), custViews, custHandlers);
  // jump the seller to its home once the machine pairs from elsewhere
  S.on(() => { if (state.shop.paired && ['welcome', 'otp', 'type', 'pair'].includes(seller.st.screen) && seller.st.screen === 'pair') { seller.st.screen = 'home'; seller.rerender(); } });
  return { seller, customer };
}
