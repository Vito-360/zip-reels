/* zip reel stage. Builds a deterministic, seekable animation from window.SPEC.
   Every animation is a paused Web Animation; window.seek(t) sets all of them to time t (seconds).
   Scenes also emit sound cues into window.__events, which the audio engine turns into effects. */
'use strict';
(async () => {
const SPEC = window.SPEC || { scenes: [] };
const stage = document.getElementById('stage');
const EASE = {
  out: 'cubic-bezier(.16,1,.3,1)', io: 'cubic-bezier(.65,0,.35,1)', in: 'cubic-bezier(.7,0,.84,0)',
  back: 'cubic-bezier(.34,1.56,.64,1)', lin: 'linear'
};
const TL = { anims: [], ticks: [], events: [] };
const seen = new WeakMap();

const $ = (tag, cls, parent, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
};
/* A(): animate el. The first animation of a property fills both ways; later ones on the same
   property fill forwards only, so they do not override the earlier one before they start. */
function A(el, kf, o = {}) {
  const props = Object.keys(kf).filter(k => k !== 'offset' && k !== 'easing');
  let s = seen.get(el); if (!s) { s = new Set(); seen.set(el, s); }
  let fill = 'both';
  for (const p of props) { if (s.has(p)) fill = 'forwards'; s.add(p); }
  const a = el.animate(kf, {
    delay: (o.at || 0) * 1000, duration: Math.max(1, (o.dur ?? 0.5) * 1000),
    easing: o.ease || EASE.out, fill: o.iter ? 'both' : fill, iterations: o.iter || 1
  });
  a.pause(); TL.anims.push(a); return a;
}
const tick = fn => TL.ticks.push(fn);
const ANIM = (el, kf, o) => A(el, kf, o);   // A() under another name, for code where `A` is a local (the rig's actor)
const cue = (t, kind, extra) => TL.events.push(Object.assign({ t: Math.max(0, +(+t).toFixed(3)), kind }, extra || {}));
const showBetween = (el, t0, t1 = Infinity) => tick(t => { el.style.display = (t >= t0 - 1e-6 && t < t1 - 1e-6) ? '' : 'none'; });
const classAt = (el, cls, t0, t1 = Infinity) => tick(t => el.classList.toggle(cls, t >= t0 - 1e-6 && t < t1));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function rng(seed) { let a = (seed | 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* fit(): largest font size (px) at which every child line of el fits maxW. */
function fit(el, maxW, max, min = 40) {
  el.style.fontSize = '100px';
  let w = 0;
  const kids = el.children.length ? [...el.children] : [el];
  kids.forEach(k => { const ws = k.style.whiteSpace, d = k.style.display; k.style.whiteSpace = 'nowrap'; k.style.display = 'inline-block'; w = Math.max(w, k.getBoundingClientRect().width); k.style.whiteSpace = ws; k.style.display = d; });
  const size = clamp(Math.floor(100 * maxW / Math.max(1, w)), min, max);
  el.style.fontSize = size + 'px';
  return size;
}
/* vcenter(): centre a text block on the middle of the area Instagram leaves uncovered. */
function vcenter(el, mid = 790) { const top = Math.max(300, Math.round(mid - el.offsetHeight / 2)); el.style.top = top + 'px'; return top; }
const lead0 = (s, n, stagger) => (s.at === 0 ? -0.3 - Math.max(0, n - 1) * stagger : s.at);
const MAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHECK_W = CHECK.replace('#000', '#fff');
const LOGO = `<svg viewBox="-2 -38 236 185" aria-hidden="true"><defs>
<pattern id="zp" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5.94" height="11" fill="#fff"/></pattern>
<linearGradient id="zc" gradientUnits="userSpaceOnUse" x1="0" y1="-38" x2="36" y2="147"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#d6d6dc"/><stop offset=".43" stop-color="#5c5c64"/><stop offset=".5" stop-color="#19191d"/><stop offset=".56" stop-color="#f5f5f7"/><stop offset=".76" stop-color="#8e8e96"/><stop offset="1" stop-color="#fff"/></linearGradient>
<linearGradient id="zs" x1="0" y1="0" x2="1" y2=".25"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="zm" maskUnits="userSpaceOnUse" x="-10" y="-50" width="260" height="210"><rect x="-10" y="-50" width="260" height="210" fill="url(#zp)"/></mask>
<clipPath id="zk"><path d="M0 0H88V24L36 76H88V100H0V76L52 24H0Z"/><path d="M100 0H130V100H100ZM100 -36H130V-14H100Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M142 0H182A50 50 0 0 1 182 100H172V145H142ZM172 26H182A24 24 0 0 1 182 74H172Z"/></clipPath></defs>
<g mask="url(#zm)"><g fill="url(#zc)"><path d="M0 0H88V24L36 76H88V100H0V76L52 24H0Z"/><path d="M100 0H130V100H100ZM100 -36H130V-14H100Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M142 0H182A50 50 0 0 1 182 100H172V145H142ZM172 26H182A24 24 0 0 1 182 74H172Z"/></g>
<g clip-path="url(#zk)"><rect class="sheen" x="-130" y="-40" width="80" height="200" fill="url(#zs)"/></g></g></svg>`;

/* ------------------------------------------------------------------ scenes: timing */
const scenes = SPEC.scenes || [];
let cursor = 0;
scenes.forEach((s, i) => { if (s.at == null) s.at = cursor; cursor = s.at + s.dur; s.i = i; });
const DUR = SPEC.duration || cursor;
const KIN = SPEC.style === 'kinetic';
const LAND = SPEC.format === 'landscape', FW = LAND ? 1920 : 1080, FH = LAND ? 1080 : 1920;   // frame size
if (LAND) document.documentElement.classList.add('land');
const startOf = s => (s.at === 0 ? -0.3 : s.at);   // first scene is already mid-motion on frame 0

await document.fonts.load('700 100px Geist'); await document.fonts.load('400 30px Geist'); await document.fonts.ready;

if (!KIN) $('div', 'bg-grid', stage);

function sceneRoot(s, cls) {
  const root = $('div', 'layer ' + (cls || ''), stage);
  const end = s.at + s.dur, next = scenes[s.i + 1];
  showBetween(root, s.at, end);
  if (next && !KIN && next.type !== 'flash' && s.type !== 'flash' && !next.cut) A(root, { opacity: [1, 0] }, { at: end - 0.14, dur: 0.14, ease: EASE.lin });   // `cut`: a hard cut into the next scene, no dip
  return root;
}

/* ------------------------------------------------------------------ phone screens */
const SCR = {};
const starStr = n => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
function metaRow(parent, stars, meta) {
  const m = $('div', 'meta', parent);
  if (stars != null) $('span', 'stars' + (stars === 0 ? ' none' : ''), m, stars === 0 ? '☆☆☆☆☆' : starStr(stars));
  if (meta) $('span', '', m, meta);
  return m;
}
function tagRow(parent, tags, cls) {
  const t = $('div', 'tags ' + (cls || ''), parent);
  (tags || []).forEach(x => { const o = typeof x === 'string' ? { t: x } : x; $('span', 'tag ' + (o.tone || ''), t, o.t); });
  return t;
}
SCR.search = (scr, d, s) => {
  const inner = $('div', 'inner', scr), keys = {};
  const bar = $('div', 'sbar', inner); bar.innerHTML = MAG; const q = $('span', 'q', bar, ''); keys.bar = bar;
  const full = d.query || '';
  if (d.typing) {
    const t0 = s.at + (d.typing.t ?? 0.15), du = d.typing.dur ?? Math.min(1.1, full.length * 0.06);
    tick(t => { q.textContent = full.slice(0, Math.round(clamp((t - t0) / du, 0, 1) * full.length)); });
    for (let k = 0; k < full.length; k += 2) cue(t0 + du * k / full.length, 'key');
  } else q.textContent = full;
  const tIn = s.at + (d.typing ? (d.typing.t ?? 0.15) + (d.typing.dur ?? Math.min(1.1, full.length * 0.06)) + 0.1 : 0);
  (d.results || []).forEach((r, i) => {
    const c = $('div', 'res' + (r.you ? ' you' : ''), inner);
    $('div', 'nm', c, r.name);
    const before = $('div', 'st1', c); metaRow(before, r.stars, r.meta); tagRow(before, r.tags);
    if (r.after) { const af = $('div', 'st2', c); metaRow(af, r.after.stars, r.after.meta); tagRow(af, r.after.tags); af.style.display = 'none'; c._after = [before, af]; }
    $('div', 'rank', c, '#1');
    keys['r' + i] = c;
    if (d.typing || s.at > 0) A(c, { opacity: [0, 1], translate: ['0 26px', '0 0'] }, { at: tIn + i * 0.09, dur: 0.4 });
  });
  return { keys, inner };
};
SCR.oldsite = (scr, d) => {
  const inner = $('div', 'inner', scr), keys = {};
  const nav = $('div', 'old-nav', inner); ['HOME', 'ABOUT US', 'SERVICES', 'GALLERY', 'GUESTBOOK', 'FAQ', 'LINKS', 'CONTACT'].forEach(x => $('span', '', nav, x));
  $('div', 'old-hero', inner, d.hero || 'Welcome to our website!');
  const cols = $('div', 'old-cols', inner);
  const heads = [['Latest news 2016', 'Our history', 'Price list (PDF)'], ['Opening hours', 'Links'], ['Visitors: 004213', 'Webring']];
  heads.forEach((hs, ci) => { const c = $('div', '', cols); hs.forEach((hh, k) => { $('h6', '', c, hh); for (let j = 0; j < 9 - ci * 2 + k; j++) $('div', 'old-l' + (j % 4 === 3 ? ' s' : ''), c); if (ci === 1 && k === 0) keys.link = $('span', 'old-link', c, d.link || 'contact us'); }); });
  $('div', 'old-foot', inner, d.footer || '© 2016 · Best viewed in 1024×768');
  return { keys, inner };
};
SCR.newsite = (scr, d) => {
  const inner = $('div', 'inner', scr), keys = {};
  const top = $('div', 'site-top', inner); $('span', '', top, d.name || 'Your business'); if (d.open !== false) $('span', 'pill-open', top, d.open || 'Open now');
  $('div', 'site-hero', inner);
  $('div', 'site-h', inner, d.headline || 'What you do, in one line.');
  if (d.stars !== false) metaRow($('div', 'site-meta', inner), d.stars == null ? 5 : d.stars, d.meta || 'Google reviews');
  const btn = $('div', 'site-btn', inner);
  $('div', 'b1', btn, d.button || 'Book now');
  const b2 = $('div', 'b2', btn); b2.innerHTML = CHECK_W.replace('<svg', '<svg style="width:40px;height:40px"'); $('span', '', b2, d.button_done || 'Booked');
  keys.btn = btn;
  $('div', 'sk', inner); $('div', 'sk s', inner); $('div', 'sk', inner);
  return { keys, inner };
};
SCR.call = (scr, d, s) => {
  scr.classList.add('dark');
  const av = $('div', 'call-av', scr, d.initial || (d.name || 'C')[0]);
  for (let k = 0; k < 2; k++) { const r = $('div', 'call-ring', av); A(r, { scale: [1, 2.1], opacity: [.7, 0] }, { at: s.at + k * 0.8, dur: 1.6, ease: EASE.lin, iter: Infinity }); }
  $('div', 'call-nm', scr, d.name || 'Your competitor');
  $('div', 'call-st', scr, d.status || 'calling…');
  $('div', 'call-end', scr);
  for (let t = s.at + 0.15; t < s.at + s.dur - 0.6; t += 1.8) cue(t, 'ring');
  return { keys: {}, inner: scr };
};
SCR.chat = (scr, d, s) => {
  const top = $('div', 'chat-top', scr); $('div', 'chat-av', top, d.initial || (d.name || 'C')[0]);
  const tt = $('div', '', top); $('div', 'chat-nm', tt, d.name || 'New customer'); $('div', 'chat-sub', tt, d.sub || 'message');
  const body = $('div', 'chat-body', scr);
  (d.items || []).forEach(it => {
    const t = s.at + (it.t || 0), ta = (t <= 0.05 ? -0.45 : t); let el;
    if (it.stamp) { el = $('div', 'stamp', body, it.stamp); A(el, { opacity: [0, 1] }, { at: ta, dur: .3 }); }
    else if (it.note) { el = $('div', 'note' + (it.bad ? ' bad' : ''), body, it.note); A(el, { opacity: [0, 1] }, { at: ta, dur: .3 }); if (it.bad) cue(t, 'error'); }
    else { el = $('div', 'msg ' + (it.from === 'you' ? 'you' : 'them'), body, it.text); A(el, { opacity: [0, 1], scale: [.7, 1] }, { at: ta, dur: .34, ease: EASE.back }); if (t > 0.05) cue(t, it.from === 'you' ? 'send' : 'pop'); }
    showBetween(el, t);
  });
  return { keys: {}, inner: body };
};
SCR.listing = (scr, d) => {
  const inner = $('div', 'inner', scr), keys = {};
  $('div', 'li-nm', inner, d.name || 'Your business');
  $('div', 'li-cat', inner, d.category || 'Local business');
  if (d.stars != null) metaRow(inner, d.stars, d.meta);
  if (d.photos !== false) { const ph = $('div', 'li-ph', inner); for (let k = 0; k < 3; k++) $('b', '', $('i', '', ph)); keys.photos = ph; }
  (d.rows || []).forEach((r, i) => {
    const row = $('div', 'li-row' + (r.bad ? ' bad' : ''), inner); $('span', 'k', row, r.k);
    const v = $('span', 'v', row); $('span', 'v1', v, r.v); $('span', 'v2', v, r.fix || r.v);
    keys['row' + i] = row;
  });
  return { keys, inner };
};
SCR.loading = (scr, d, s) => {
  const inner = $('div', 'inner', scr);
  const url = $('div', 'url', inner); $('i', '', url); $('span', '', url, d.url || 'yourbusiness.com');
  const bar = $('b', '', $('div', 'load-bar', inner)); A(bar, { scale: ['0.05 1', '0.34 1'] }, { at: s.at, dur: s.dur, ease: EASE.out });
  const sp = $('div', 'spin', inner); A(sp, { rotate: ['0deg', '360deg'] }, { at: s.at, dur: 0.9, ease: EASE.lin, iter: Infinity });
  const n = $('div', 'load-s', inner, '1s'); $('div', 'load-c', inner, d.caption || 'still loading');
  const rate = d.rate || 1, to = d.count_to || 99;
  tick(t => { n.textContent = Math.min(to, Math.floor(Math.max(0, t - s.at) * rate) + 1) + 's'; });
  for (let k = 1; k / rate < s.dur - 0.1 && k < to; k++) cue(s.at + k / rate, 'tock');
  return { keys: {}, inner };
};
SCR.form = (scr, d) => {
  if (d.short) scr.classList.add('short');
  const fields = (d.fields || ['First name', 'Last name', 'Email', 'Phone', 'Company', 'Address', 'Subject', 'How did you hear about us?', 'Message']).map(f => (typeof f === 'string' ? { label: f } : f));
  const bar = $('div', 'form-bar', scr); $('div', 'form-h', bar, d.title || 'Contact form');
  const chip = d.counter ? $('span', 'form-chip', bar, '') : null;
  const inner = $('div', 'inner', scr), keys = {}, fills = [];
  fields.forEach((f, i) => {
    const w = $('div', 'fld' + ((f.big ?? /message/i.test(f.label)) ? ' big' : ''), inner);
    $('label', '', w, f.label + (d.short || d.required === false ? '' : ' *'));
    const box = $('div', '', w); box._val = $('span', '', box, f.value || '');
    keys['f' + i] = box;
  });
  const sub = $('div', 'form-sub', inner); $('span', 'b1', sub, d.submit || 'Submit');
  const b2 = $('span', 'b2', sub); b2.innerHTML = CHECK_W.replace('<svg', '<svg style="width:40px;height:40px"'); $('span', '', b2, d.submit_done || 'Sent');
  keys.submit = sub;
  (d.extras || []).forEach(x => $('div', 'form-x', inner, x));
  if (chip) tick(t => { chip.textContent = fills.filter(x => t >= x - 1e-6).length + ' of ' + fields.length; });
  return { keys, inner, fills };
};

/* reviews: a business's review list. The first review is the subject: a low rating, an age pill that
   the `age` action rolls forward, and under it the owner's reply slot (empty, then `flag`, `type`, `fix`). */
SCR.reviews = (scr, d) => {
  const inner = $('div', 'inner', scr), keys = {};
  $('div', 'li-nm', inner, d.name || 'Your business');
  metaRow(inner, d.stars == null ? 4 : d.stars, d.meta || 'reviews');
  const r = d.review || {};
  const card = $('div', 'rv-card', inner); keys.review = card;
  const head = $('div', 'rv-head', card);
  $('div', 'rv-av', head, r.initial || (r.name || 'A')[0]);
  $('div', 'rv-nm', head, r.name || 'Ana');
  const age = $('div', 'rv-age' + (r.age_bad ? ' bad' : ''), head); age._val = $('span', '', age, r.age || '2 days ago'); keys.age = age;
  $('div', 'stars rv-stars', card, starStr(r.stars == null ? 1 : r.stars));
  $('div', 'rv-text', card, r.text || '');
  const slot = $('div', 'rv-slot', inner); keys.slot = slot;
  const top = $('div', 'rv-slot-top', slot); $('span', '', top, d.reply_label || "Owner's reply");
  const ck = $('i', 'rv-ck', top); ck.innerHTML = CHECK;
  $('div', 'rv-ph', slot, d.empty || 'No reply yet');
  slot._val = $('div', 'rv-reply', slot, '');
  for (let k = 0; k < (d.more ?? 2); k++) {
    const c = $('div', 'rv-card rv-dim', inner), h = $('div', 'rv-head', c); $('div', 'rv-av', h); $('div', 'sk', h).style.cssText = 'width:150px;margin-top:0';
    $('div', 'stars rv-stars', c, starStr(5)); $('div', 'sk', c); $('div', 'sk s', c);
  }
  return { keys, inner };
};

function centerIn(el, scr) { let x = el.offsetWidth / 2, y = el.offsetHeight / 2, n = el; while (n && n !== scr) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return [x, y]; }
function tapAt(scr, [x, y], t, miss) {
  const d = $('div', 'tap' + (miss ? ' miss' : ''), scr); d.style.left = x + 'px'; d.style.top = y + 'px';
  A(d, { opacity: [0, 1, 1, 0], scale: [1.5, 1, 1, 1.25], offset: [0, .3, .7, 1] }, { at: t - 0.12, dur: 0.6, ease: EASE.lin });
  cue(t, miss ? 'error' : 'tap');
}
function act(scr, api, a, s) {
  const t = s.at + (a.t || 0), el = a.on ? api.keys[a.on] : null;
  const W = scr.offsetWidth, H = scr.offsetHeight;
  const pos = () => { const p = el ? centerIn(el, scr) : [(a.x ?? .5) * W, (a.y ?? .5) * H]; return [p[0] + (a.dx || 0), p[1] + (a.dy || 0)]; };
  switch (a.do) {
    case 'tap': tapAt(scr, pos(), t, a.miss); break;
    case 'highlight': classAt(el, 'sel', t); A(el, { scale: [.96, 1] }, { at: t, dur: .35 }); cue(t, 'tick'); break;
    case 'flag': classAt(el, 'flag', t); cue(t, 'error'); break;
    case 'zoom': { const k = a.to || 2.2, [x, y] = pos(); A(api.inner, { scale: [1, k], translate: ['0px 0px', `${-(x * k - W / 2)}px ${-(y * k - H * 0.42)}px`] }, { at: t, dur: a.dur || .7, ease: EASE.io }); cue(t, 'whoosh'); break; }
    case 'scroll': A(api.inner, { translate: ['0px 0px', `0px ${-(a.by || 400)}px`] }, { at: t, dur: a.dur || 1, ease: EASE.io }); cue(t, 'scroll', { dur: a.dur || 1 }); break;
    case 'press': tapAt(scr, pos(), t); classAt(el, 'done', t + 0.14); A(el, { scale: [1, .95, 1] }, { at: t, dur: .3 }); cue(t + 0.14, 'ding', { i: 2 }); break;
    case 'fix': classAt(el, 'fixed', t); if (el.classList.contains('bad')) classAt(el, 'bad', -1, t); A(el, { scale: [1.035, 1] }, { at: t, dur: .4 }); cue(t, 'ding', { i: a.i || 0 }); break;
    case 'type': {
      const sp = el._val || el, full = a.text || '', du = a.dur ?? Math.min(0.9, full.length * 0.05);
      tick(tm => { sp.textContent = full.slice(0, Math.round(clamp((tm - t) / du, 0, 1) * full.length)); });
      classAt(el, 'on', t);
      for (let k = 0; k < full.length; k += 2) cue(t + du * k / full.length, 'key');
      if (api.fills) api.fills.push(t + du);
      break;
    }
    case 'age': {                                       // roll an age pill forward ("2 days ago" -> "2 years ago")
      const sp = el._val || el;
      if (!el._steps) { el._steps = []; const base = sp.textContent, bad0 = el.classList.contains('bad');
        tick(tm => { let x = base, bad = bad0; el._steps.forEach(st => { if (tm >= st.t - 1e-6) { x = st.text; bad = !!st.bad; } }); sp.textContent = x; el.classList.toggle('bad', bad); }); }
      el._steps.push({ t, text: a.text, bad: a.bad }); el._steps.sort((p, q) => p.t - q.t);
      A(el, { scale: [1, 1.24, 1], offset: [0, .3, 1] }, { at: t, dur: .34, ease: EASE.lin }); cue(t, a.bad ? 'hit' : 'tock'); break;
    }
    case 'leave': A(scr, { translate: ['0 0', '112% 0'] }, { at: t, dur: .45, ease: EASE.in }); cue(t, 'whoosh'); break;
    case 'promote': {
      const cards = Object.keys(api.keys).filter(k => /^r\d+$/.test(k)).map(k => api.keys[k]);
      let y = cards[0].offsetTop; el.style.zIndex = 3;
      [el, ...cards.filter(c => c !== el)].forEach(c => { const dy = y - c.offsetTop; if (dy) A(c, { translate: ['0px 0px', `0px ${dy}px`] }, { at: t, dur: .65, ease: EASE.io }); y += c.offsetHeight + 18; });
      classAt(el, 'top', t + .3); classAt(el, 'sel', t + .3);
      if (el._after) { showBetween(el._after[0], -1, t + .3); showBetween(el._after[1], t + .3); }
      cue(t, 'rise'); cue(t + .5, 'ding', { i: 2 }); break;
    }
  }
}
const POSE = { center: ['0px 0px', '0deg'], left: ['-176px 0px', '-3deg'] };
function titleEl(root, lines, t0, t1, isFirstOfVideo) {
  const el = $('div', 'title', root);
  lines.forEach(l => $('span', 'ln', el, l));
  fit(el, 950, 92, 54);
  showBetween(el, t0, t1);
  [...el.children].forEach((ln, k) => {
    A(ln, { opacity: [0, 1], translate: ['0 34px', '0 0'], filter: ['blur(10px)', 'blur(0px)'] }, { at: (isFirstOfVideo ? -0.5 : t0) + k * 0.09, dur: .5 });
  });
  A(el, { opacity: [1, 0] }, { at: t1 - 0.12, dur: 0.12, ease: EASE.lin });
  return el;
}
function phoneRun(run) {
  const first = run[0], last = run[run.length - 1], t0 = first.at, t1 = last.at + last.dur;
  const root = $('div', 'layer', stage); showBetween(root, t0, t1);
  if (scenes[last.i + 1]) A(root, { opacity: [1, 0] }, { at: t1 - 0.14, dur: 0.14, ease: EASE.lin });
  const rig = $('div', 'rig', root), phone = $('div', 'phone', rig); $('div', 'island', phone);
  const glass = $('div', 'glass', phone);
  A(rig, { opacity: [0, 1], translate: ['0px 240px', '0px 0px'], scale: [.94, 1] }, { at: startOf(first) - (t0 === 0 ? 0.25 : 0), dur: .8 });
  if (t0 > 0) cue(t0, 'whoosh');
  let pose = 'center';
  const labels = $('div', 'labels', root); let labN = 0, held = null;
  run.forEach((s, i) => {
    const d = s.screen || (s.keep_screen && held ? {} : { kind: 'search' });
    if (s.labels_top) labels.style.top = s.labels_top + 'px';
    const titles = (s.title ? [{ t: 0, lines: s.title }] : []).concat(s.retitle || []);
    titles.forEach((tt, k) => { const a = s.at + tt.t, b = k < titles.length - 1 ? s.at + titles[k + 1].t : s.at + s.dur; titleEl(root, tt.lines, a, b, a === 0); if (a > 0) cue(a, 'swish'); });
    /* "keep_screen": true carries the previous scene's screen over as it is (same DOM, same state),
       so a story can run through several scenes (new headline, labels, pose) without the screen blinking. */
    let scr, api;
    if (s.keep_screen && held) { scr = held.scr; api = held.api; }
    else {
      scr = $('div', 'screen scr-' + d.kind, glass);
      api = (SCR[d.kind] || SCR.search)(scr, d, s);
      if (i > 0) { A(scr, { opacity: [0, 1], translate: ['0px 46px', '0px 0px'] }, { at: s.at, dur: .38 }); }
      held = { scr, api, from: i > 0 ? s.at : -1 };
    }
    showBetween(scr, held.from, run[i + 1] ? run[i + 1].at + 0.4 : t1 + 1);
    (s.actions || []).forEach(a => act(scr, api, a, s));
    const p = s.pose || (s.labels ? 'left' : 'center');
    if (p !== pose) { A(rig, { translate: [POSE[pose][0], POSE[p][0]], rotate: [POSE[pose][1], POSE[p][1]] }, { at: s.at, dur: .7, ease: EASE.io }); pose = p; }
    (s.labels || []).forEach(l => {
      const el = $('div', 'lab', labels); const lb = $('b', '', el, l.text); if (l.sub) $('span', '', el, l.sub);
      lb.style.whiteSpace = 'nowrap'; for (let fs = 66; fs > 44 && lb.scrollWidth > el.clientWidth - 34; fs -= 2) lb.style.fontSize = fs + 'px';   // a long word shrinks instead of running off the frame
      const t = s.at + (l.t || 0);
      A(el, { opacity: [0, 1], translate: ['-30px 0', '0 0'], filter: ['blur(8px)', 'blur(0px)'] }, { at: t, dur: .45 }); cue(t, 'label', { i: labN++ });
    });
  });
  if ((run.some(s => s.labels))) { const lastLab = run.filter(s => s.labels).pop(); showBetween(labels, run.find(s => s.labels).at, lastLab.at + lastLab.dur); }
}

/* ------------------------------------------------------------------ cards style */
const S = {};
S.bignum = s => {
  const root = sceneRoot(s);
  const lab = $('div', 'center bn-label', root, s.label || '');
  const num = $('div', 'center bn-num', root);
  const vals = (s.values || ['3', '2', '1']).map(String), step = s.step ?? (s.dur - (s.hold ?? 0.1)) / vals.length;
  const probe = $('span', 'chrome', num, vals.reduce((a, b) => a.length >= b.length ? a : b)); probe.style.position = 'static';
  const size = fit(num, 940, 640, 160); probe.remove();
  num.style.lineHeight = '640px';
  vals.forEach((v, i) => {
    const sp = $('span', 'chrome', num, v), a = s.at + i * step, first = i === 0 && s.at === 0;
    showBetween(sp, a, i === vals.length - 1 ? Infinity : a + step);
    A(sp, { scale: [1.22, 1], opacity: [0, 1], filter: ['blur(16px)', 'blur(0px)'] }, { at: first ? -0.22 : a, dur: .3 });
    cue(a, 'count', { i });
  });
  const word = $('div', 'center bn-word', root, s.word || ''); fit(word, 940, 120, 60);
  if (s.at > 0) { A(lab, { opacity: [0, 1], translate: ['0 30px', '0 0'] }, { at: s.at, dur: .4 }); A(word, { opacity: [0, 1], translate: ['0 30px', '0 0'] }, { at: s.at + .08, dur: .4 }); }
  if (s.bar !== false) { const b = $('b', '', $('div', 'bn-bar', root)); A(b, { scale: s.bar === 'fill' ? ['0 1', '1 1'] : ['1 1', '0 1'] }, { at: s.at, dur: step * vals.length, ease: EASE.lin }); }
};
S.flash = s => {
  const root = sceneRoot(s, 'flash');
  const el = $('div', '', root); (s.lines || [s.text || '']).forEach(l => $('div', '', el, l));
  fit(el, 940, 170, 70);
  A(el, { scale: [1.12, 1] }, { at: s.at, dur: .5 });
  cue(s.at, 'impact');
};
S.lines = s => {
  const root = sceneRoot(s);
  const kick = s.kicker ? $('div', 'kicker', root, s.kicker) : null;
  if (kick) { kick.style.textAlign = 'left'; kick.style.left = '72px'; A(kick, { opacity: [0, 1] }, { at: startOf(s), dur: .4 }); }
  const box = $('div', 'lines', root);
  const n = s.lines.length, step = s.step ?? (s.dur - 0.5) / n;
  s.lines.forEach((l, i) => { const ln = $('div', 'ln', box); if (s.numbered) $('span', 'n', ln, String(i + 1).padStart(2, '0')); $('span', '', ln, l); });
  fit(box, s.numbered ? 880 : 936, s.size || 150, 56);
  const top = vcenter(box); if (kick) kick.style.top = (top - 76) + 'px';
  [...box.children].forEach((ln, i) => {
    const a = s.at + (s.lead ?? 0.05) + i * step;
    A(ln, { opacity: [0, 1], translate: ['0 46px', '0 0'], filter: ['blur(10px)', 'blur(0px)'] }, { at: i === 0 && s.at === 0 ? -0.3 : a, dur: .4 });
    if (s.dim !== false && i < n - 1) A(ln, { opacity: [1, .3] }, { at: a + step, dur: .3, ease: EASE.io });
    cue(a, 'hit', { i });
  });
};
S.statement = s => {
  const root = sceneRoot(s);
  const box = $('div', 'statement', root);
  const wrap = $('div', '', box);
  s.lines.forEach((l, i) => { const ln = $('span', 'ln', wrap, l); if (s.chrome === i || s.chrome === l) ln.classList.add('chrome'); });
  fit(wrap, 936, s.size || 190, 70);
  const st = lead0(s, s.lines.length, 0.13);
  [...wrap.children].forEach((ln, i) => A(ln, { opacity: [0, 1], translate: ['0 60px', '0 0'], filter: ['blur(14px)', 'blur(0px)'] }, { at: st + i * 0.13, dur: .55 }));
  if (s.sub) { const sub = $('div', 'sub', box, s.sub); A(sub, { opacity: [0, 1], translate: ['0 30px', '0 0'] }, { at: st + 0.2 + s.lines.length * 0.13, dur: .5 }); }
  vcenter(box);
  cue(s.at, s.at === 0 ? 'hit' : 'swish'); cue(s.at + 0.08, 'hit', { i: 1 });
};
function widget(parent, w) {
  if (!w) return;
  const o = typeof w === 'string' ? { kind: w } : w, el = $('div', 'wd wd-' + o.kind, parent);
  if (o.kind === 'search') { el.innerHTML = MAG; $('span', '', el, o.text || 'near me'); }
  else el.textContent = o.text || ({ timer: '3s', button: 'Book now' })[o.kind] || '';
  return el;
}
S.cards = s => {
  const root = sceneRoot(s);
  if (s.kicker) { const k = $('div', 'kicker', root, s.kicker); A(k, { opacity: [0, 1] }, { at: startOf(s), dur: .4 }); }
  const box = $('div', 'cards', root); if (!s.kicker) box.style.top = '320px';
  const gap = s.gap ?? 0.45, n = s.cards.length;
  const checksAt = s.at + (s.checks_at ?? Math.max(0.3 + n * gap + 0.3, s.dur - 0.25 * n - 0.6));
  s.cards.forEach((c, i) => {
    const el = $('div', 'card', box), tx = $('div', '', el); $('h4', '', tx, c.title); if (c.sub) $('p', '', tx, c.sub);
    widget(el, c.widget);
    const a = s.at + 0.15 + i * gap;
    A(el, { opacity: [0, 1], translate: ['0 90px', '0 0'], rotate: [(i % 2 ? 4 : -4) + 'deg', '0deg'] }, { at: a, dur: .55 });
    cue(a, 'card', { i });
    if (s.checks !== false) { const ck = $('div', 'ck', el); ck.innerHTML = CHECK; const b = checksAt + i * 0.25; A(ck, { opacity: [0, 1], scale: [0, 1] }, { at: b, dur: .35, ease: EASE.back }); cue(b, 'ding', { i }); }
  });
};
S.offer = s => {
  const root = sceneRoot(s);
  const pill = $('div', 'center offer-pill', root); const b = $('b', '', pill, s.pill || 'FREE');
  A(b, { scale: [0, 1], rotate: ['-18deg', '-4deg'] }, { at: s.at, dur: .5, ease: EASE.back }); cue(s.at, 'impact');
  const h = $('div', 'center offer-h', root, s.title || 'website check.'); fit(h, 940, 124, 60);
  A(h, { opacity: [0, 1], translate: ['0 40px', '0 0'] }, { at: s.at + .25, dur: .45 });
  if (s.list) {
    const l = $('div', 'offer-list', root);
    s.list.forEach((x, i) => { const r = $('div', '', l); $('i', '', r).innerHTML = CHECK; $('span', '', r, x); const a = s.at + .7 + i * (s.gap ?? .4); A(r, { opacity: [0, 1], translate: ['-30px 0', '0 0'] }, { at: a, dur: .4 }); cue(a, 'ding', { i }); });
  } else if (s.sub) { const p = $('div', 'center offer-sub', root, s.sub); A(p, { opacity: [0, 1], translate: ['0 30px', '0 0'] }, { at: s.at + .5, dur: .45 }); }
};
/* cut: a long list; every item not in `keep` is struck out and drops away, the kept ones grow to fill the frame. */
S.cut = s => {
  const root = sceneRoot(s), items = s.items || [], keep = s.keep || [0], LS = 1.22, LB = 1.04;
  const tmp = $('div', 'cut', root); keep.forEach(i => $('div', 'it', tmp, items[i]));
  const big = fit(tmp, 936, s.size || 190, 80); tmp.remove();
  const box = $('div', 'cut', root);
  items.forEach((x, i) => { const it = $('div', 'it', box); $('span', '', it, x); if (!keep.includes(i)) $('i', '', it); });
  const small = Math.min(fit(box, 936, 120, 40), clamp(Math.floor(900 / items.length / LS), 40, 120));
  box.style.fontSize = small + 'px'; box.style.lineHeight = LS;
  const top = vcenter(box, 800);
  const els = [...box.children], tops = els.map(e => e.offsetTop);
  const st = s.at === 0 ? -0.3 - items.length * 0.04 : s.at;
  els.forEach((it, i) => A(it, { opacity: [0, 1], translate: ['-40px 0px', '0px 0px'], filter: ['blur(8px)', 'blur(0px)'] }, { at: st + i * (s.stagger ?? 0.04), dur: .3 }));
  const gone = items.map((_, i) => i).filter(i => !keep.includes(i));
  const t0 = s.at + (s.cut_at ?? 0.9), step = s.step ?? 0.11, tc = s.at + (s.collapse_at ?? ((s.cut_at ?? 0.9) + gone.length * step + 0.3));
  gone.forEach((i, n) => {
    const it = els[i], a = t0 + n * step;
    A(it.querySelector('i'), { scale: ['0 1', '1 1'] }, { at: a, dur: .16, ease: EASE.io });
    A(it.querySelector('span'), { opacity: [1, .38] }, { at: a, dur: .2 });
    cue(a, 'tick', { i: n });
    A(it, { opacity: [1, 0], translate: ['0px 0px', '-90px 0px'], filter: ['blur(0px)', 'blur(10px)'] }, { at: tc + n * 0.015, dur: .3, ease: EASE.in });
  });
  const subH = s.sub ? 110 : 0, H = keep.length * big * LB + subH, topB = Math.max(300, Math.round(800 - H / 2)), k = big / small;
  keep.forEach((i, j) => {
    const it = els[i], dy = topB + j * big * LB + big * (LB - LS) / 2 - (top + tops[i]);
    A(it, { translate: ['0px 0px', `0px ${dy}px`], scale: [1, k] }, { at: tc + 0.08, dur: .62, ease: EASE.io });
    cue(tc + 0.55 + j * 0.09, 'ding', { i: j });
  });
  cue(tc, 'whoosh');
  if (s.kicker) { const kk = $('div', 'kicker', root, s.kicker); kk.style.textAlign = 'left'; kk.style.left = '72px'; kk.style.top = (top - 70) + 'px'; A(kk, { opacity: [0, 1] }, { at: startOf(s), dur: .4 }); A(kk, { opacity: [1, 0] }, { at: tc, dur: .2, ease: EASE.lin }); }
  if (s.kicker_after) { const kk = $('div', 'kicker', root, s.kicker_after); kk.style.textAlign = 'left'; kk.style.left = '72px'; kk.style.top = (topB - 70) + 'px'; A(kk, { opacity: [0, 1] }, { at: tc + 0.45, dur: .4 }); }
  if (s.sub) { const sub = $('div', 'cut-sub', root, s.sub); sub.style.top = Math.round(topB + keep.length * big * LB + 30) + 'px'; A(sub, { opacity: [0, 1], translate: ['0 30px', '0 0'] }, { at: tc + 0.75, dur: .5 }); }
};
S.end = s => {
  const root = sceneRoot(s);
  const lg = $('div', 'end-logo', root); lg.innerHTML = LOGO;
  A(lg, { opacity: [0, 1], scale: [.86, 1], filter: ['blur(18px)', 'blur(0px)'] }, { at: s.at, dur: .6 });
  A(lg.querySelector('.sheen'), { transform: ['translate(0px,0px)', 'translate(380px,0px)'] }, { at: s.at + .08, dur: .6, ease: EASE.io });   // done before the CTA or question appears
  cue(s.at, 'logo');
  const tag = $('div', 'center end-tag', root, s.tagline || 'systems that sell.');
  A(tag, { opacity: [0, 1], translate: ['0 30px', '0 0'] }, { at: s.at + .35, dur: .5 });
  /* One ask at most: the button, or a question, or a plain closing line, or nothing (logo and tagline only). */
  if (s.cta) {
    const c = $('div', 'center end-cta', root); const b = $('b', '', c, s.cta);
    A(b, { opacity: [0, 1], scale: [.8, 1] }, { at: s.at + .75, dur: .45, ease: EASE.back }); cue(s.at + .75, 'ding', { i: 2 });
    if (s.note) { const n = $('div', 'center end-note', root, s.note); A(n, { opacity: [0, 1] }, { at: s.at + 1.0, dur: .4 }); }
  } else if (s.question || s.line) {
    const q = $('div', 'center end-q' + (s.line ? ' end-line' : ''), root, s.question || s.line); A(q, { opacity: [0, 1], translate: ['0 30px', '0 0'] }, { at: s.at + .75, dur: .5 }); cue(s.at + .75, 'swish');
  }
};

/* ------------------------------------------------------------------ kinetic style */
S.chaos = s => {
  const root = sceneRoot(s), rnd = rng(s.seed || 7), end = s.at + s.dur;
  const cam = $('div', 'layer', root); cam.style.transformOrigin = '50% 45%';
  (s.ghosts || []).forEach((g, i) => {
    const el = $('div', 'ghost ' + (i % 3 === 1 ? 'stripes' : i % 3 === 0 ? 'outline' : ''), cam, g);
    const size = 110 + Math.floor(rnd() * 190), vert = i % 4 === 2;
    el.style.fontSize = size + 'px'; el.style.opacity = i % 3 === 2 ? .28 : .5; if (i % 3 === 2) el.style.color = '#8e8e96';
    const x = -120 + rnd() * 800, y = 260 + rnd() * 1050, dx = (rnd() - .5) * 700, dy = (rnd() - .5) * 240;
    const a = s.at + (i < 3 ? 0 : rnd() * s.dur * 0.5);
    showBetween(el, a, end);
    A(el, { translate: [`${x}px ${y}px`, `${x + dx}px ${y + dy}px`], rotate: vert ? ['90deg', '90deg'] : ['0deg', '0deg'] }, { at: a, dur: s.dur, ease: EASE.lin });
    A(el, { opacity: [0, +el.style.opacity] }, { at: a, dur: .25 });
  });
  const words = s.main || [], step = s.step ?? (s.dur * 0.6) / Math.max(1, words.length), lead = s.lead ?? 0.06;
  const sizes = words.map(w => clamp(Math.floor(1500 / Math.max(2, w.length)), 230, 430));
  let y = 330;
  words.forEach((w, i) => {
    const el = $('div', 'ghost', cam, w); el.style.fontSize = sizes[i] + 'px'; el.style.letterSpacing = '-.055em'; el.style.zIndex = 5;
    const x = 56 + (i % 2) * 70 + rnd() * 60, yy = y; y += sizes[i] * 0.86;
    const a = s.at + lead + i * step; showBetween(el, a, end);
    const k = i % 3;
    if (k === 0) A(el, { translate: [`${-1300}px ${yy}px`, `${x}px ${yy}px`], filter: ['blur(30px)', 'blur(0px)'] }, { at: a, dur: .34 });
    else if (k === 1) { el.style.transformOrigin = '0 50%'; A(el, { translate: [`${x}px ${yy}px`, `${x}px ${yy}px`], scale: [3.2, 1], opacity: [0, 1], filter: ['blur(24px)', 'blur(0px)'] }, { at: a, dur: .34 }); }
    else A(el, { translate: [`${x}px ${yy + 900}px`, `${x}px ${yy}px`], rotate: ['14deg', '0deg'] }, { at: a, dur: .36 });
    cue(a, 'slam', { i });
  });
  A(cam, { scale: [1, 1.1], rotate: ['0deg', '-2.5deg'] }, { at: s.at, dur: s.dur - .32, ease: EASE.lin });
  if (s.collapse !== false) { A(cam, { scale: [1.1, .12], opacity: [1, 0], filter: ['blur(0px)', 'blur(26px)'] }, { at: end - .32, dur: .32, ease: EASE.in }); cue(end - .34, 'suck'); }
};
S.blurtype = s => {
  const root = sceneRoot(s), box = $('div', 'blurtype', root), stg = s.stagger ?? 0.2;
  s.lines.forEach((l, i) => { const ln = $('span', 'ln', box, l); if (s.stripes === i) ln.classList.add('stripes'); if (s.chrome === i) ln.classList.add('chrome'); });
  fit(box, 936, s.size || 250, 80);
  const sub = s.sub ? $('div', 'sub', box, s.sub) : null;
  vcenter(box);
  const st = lead0(s, s.lines.length, stg);
  [...box.querySelectorAll('.ln')].forEach((ln, i) => { const a = st + i * stg; A(ln, { opacity: [0, 1], scale: ['1.7 1', '1 1'], filter: ['blur(46px)', 'blur(0px)'] }, { at: a, dur: .5 }); cue(Math.max(s.at, a), i ? 'hit' : 'swish', { i }); });
  if (sub) A(sub, { opacity: [0, 1], translate: ['0 30px', '0 0'] }, { at: st + s.lines.length * stg + .2, dur: .5 });
};
S.stack = s => {
  const root = sceneRoot(s), box = $('div', 'stack', root), end = s.at + s.dur;
  const kick = s.kicker ? $('div', 'kicker', root, s.kicker) : null;
  if (kick) { kick.style.textAlign = 'left'; kick.style.left = '92px'; A(kick, { opacity: [0, 1] }, { at: startOf(s), dur: .4 }); }
  const rail = $('div', 'rail', box), n = s.items.length;
  const size = clamp(Math.floor(900 / n / 1.16), 90, 190); box.style.fontSize = size + 'px';
  const w = $('div', '', box); s.items.forEach(x => $('span', 'it', w, x)); fit(w, 800, size, 70);
  const top = vcenter(box, kick ? 820 : 790); if (kick) kick.style.top = (top - 84) + 'px';
  const step = s.step ?? (s.dur - 0.9) / n, lead = s.lead ?? 0.2;
  [...w.children].forEach((it, i) => { const a = s.at + lead + i * step; A(it, { opacity: [0, 1], translate: ['-70px 0', '0 0'], filter: ['blur(12px)', 'blur(0px)'] }, { at: a, dur: .36 }); cue(a, 'tick', { i }); });
  tick(t => { const k = clamp((t - s.at - lead) / (step * n) + 0.5 / n, 0, 1); rail.style.transform = `scaleY(${k})`; });
  if (s.collapse) { box.style.transformOrigin = '0 30%'; A(box, { scale: ['1 1', '.36 .62'], opacity: [1, 0], filter: ['blur(0px)', 'blur(10px)'] }, { at: end - .4, dur: .4, ease: EASE.in }); cue(end - .42, 'suck'); }
};
S.slam = s => {
  const root = sceneRoot(s), box = $('div', 'slam', root);
  s.lines.forEach((l, i) => { const ln = $('span', 'ln', box, l); if (s.chrome === i || (s.chrome == null && i === s.lines.length - 1)) ln.classList.add('chrome'); });
  const size = fit(box, 936, s.size || 330, 90);
  const sub = s.sub ? $('div', 'sub', box, s.sub) : null;
  const top = vcenter(box);
  const step = s.step ?? Math.min(0.5, (s.dur - 0.6) / s.lines.length), lead = s.lead ?? 0.1;
  [...box.querySelectorAll('.ln')].forEach((ln, i) => {
    const a = s.at + lead + i * step;
    A(ln, { opacity: [0, 1], scale: [1.6, 1], filter: ['blur(18px)', 'blur(0px)'] }, { at: a, dur: .26 }); cue(a, 'slam', { i });
    if (s.rules !== false) { const r = $('div', 'rule', root); r.style.top = (top + (i + 1) * size * 0.9 - size * 0.06) + 'px'; r.dataset.l = ['baseline', 'x-height', 'cap', 'descender'][i % 4]; root.insertBefore(r, box); A(r, { scale: ['0 1', '1 1'] }, { at: a - .1, dur: .5, ease: EASE.io }); }
  });
  if (sub) A(sub, { opacity: [0, 1], translate: ['0 30px', '0 0'] }, { at: s.at + lead + s.lines.length * step + .1, dur: .5 });
};

/* ------------------------------------------------------------------ story scenes
   One layout for all three: a centred headline whose bottom edge sits at y=900 and one object centred on
   y=1040. The object stays in the same place across cuts, so the eye never has to search for it.
   The headline is complete and sharp on the scene's first frame; after that only the object moves. */
const ANCHOR_Y = 1040;
const CURSOR = '<svg viewBox="0 0 50 72"><path d="M4 4V58L18 45 28 68 38 64 28 41H47Z" fill="#fafafa" stroke="#000" stroke-width="3.5" stroke-linejoin="round"/></svg>';
function storyHead(root, s, lines, chrome) {
  const el = $('div', 'st-head', root);
  lines.forEach((l, i) => { const ln = $('span', 'ln', el, l); if (chrome === i) ln.classList.add('chrome'); });
  fit(el, 940, s.size || 180, 80);
  if (s.at > 0) A(el, { scale: [1.05, 1] }, { at: s.at, dur: .2 });
  cue(s.at, s.at === 0 ? 'hit' : 'slam');
  return el;
}
function boxRow(root, items, cls) {
  const row = $('div', 'st-row', root), n = items.length, w = Math.floor((960 - (n - 1) * 22) / n);
  const els = items.map(x => { const b = $('div', 'st-box ' + (cls || ''), row, x); b.style.width = w + 'px'; return b; });
  if (!cls) { row.style.fontSize = '100px'; const widest = Math.max(...els.map(b => { const r = document.createRange(); r.selectNodeContents(b); return r.getBoundingClientRect().width; })); row.style.fontSize = clamp(Math.floor(100 * (w - 34) / widest), 26, 50) + 'px'; }
  return els;
}
const toCentre = (el, t, dur) => { const dx = 540 - (el.offsetLeft + el.offsetWidth / 2); A(el, { translate: ['0px 0px', `${dx}px 0px`], scale: [1, .25], opacity: [1, 0] }, { at: t, dur, ease: EASE.in }); };
/* button: headline + one pill button. A mouse cursor clicks it (pointer "cursor") or a finger taps it ("tap"). */
S.button = s => {
  const root = sceneRoot(s);
  storyHead(root, s, s.lines || [], s.chrome);
  const obj = $('div', 'st-obj', root), wrap = $('div', 'st-btnwrap', obj);
  $('div', 'st-btnsh', wrap);
  const btn = $('div', 'st-btn', wrap);
  $('span', 'b1', btn, s.label || 'Buy now');
  const b2 = $('span', 'b2', btn); if (s.check) $('i', '', b2).innerHTML = CHECK; $('span', '', b2, s.label_done || s.label || 'Buy now');
  const w1 = btn.offsetWidth; btn.classList.add('done'); const w2 = btn.offsetWidth; btn.classList.remove('done');
  btn.style.width = Math.max(w1, w2) + 'px';
  if (s.at > 0) A(wrap, { scale: [.6, 1], opacity: [0, 1] }, { at: s.at, dur: .26, ease: EASE.back });
  const W = btn.offsetWidth, H = btn.offsetHeight, tp = s.at + (s.press_at ?? 1.3);
  const px = 540 + W * (s.pointer === 'tap' ? 0.2 : 0.36), py = ANCHOR_Y + 16;
  if (s.pointer === 'tap') {
    const d = $('div', 'tap light st-tap', root); d.style.left = px + 'px'; d.style.top = py + 'px';
    A(d, { opacity: [0, 1, 1, 0], scale: [1.7, 1, 1, 1.3], offset: [0, .45, .7, 1] }, { at: tp - 0.26, dur: 0.6, ease: EASE.lin });
    cue(tp, 'tap');
  } else {
    const c = $('div', 'st-cursor', root); c.innerHTML = CURSOR;
    const t0 = tp - 0.62; showBetween(c, t0);
    A(c, { translate: [`${px + 300}px ${py + 400}px`, `${px}px ${py}px`] }, { at: t0, dur: .55, ease: EASE.io });
    A(c, { opacity: [0, 1] }, { at: t0, dur: .12, ease: EASE.lin });
    A(c, { scale: [1, .86, 1] }, { at: tp - 0.03, dur: .2 });
    cue(t0 + 0.05, 'swish'); cue(tp, 'click');
  }
  classAt(btn, 'done', tp + 0.02);
  A(wrap, { scale: [1, .94, 1] }, { at: tp, dur: .28 });
  const ring = $('div', 'st-ring', root); ring.style.left = px + 'px'; ring.style.top = py + 'px';
  A(ring, { scale: [.3, 2.4], opacity: [.9, 0] }, { at: tp, dur: .45 }); showBetween(ring, tp, tp + 0.45);
  if (s.check) cue(tp + 0.08, 'ding', { i: 2 });
  if (s.stamp) {
    const st = $('div', 'st-stamp', root, s.stamp.text), ts = s.at + (s.stamp.t ?? 1.6);
    st.style.left = Math.round(540 - W / 2 - st.offsetWidth * 0.2) + 'px'; st.style.top = Math.round(ANCHOR_Y + H / 2 - st.offsetHeight * 0.36) + 'px';   // lower-left edge of the button, clear of label and cursor
    showBetween(st, ts);
    A(st, { scale: [2.6, 1], opacity: [0, 1] }, { at: ts, dur: .2, ease: EASE.in });
    A(wrap, { translate: ['0px 0px', '0px 7px', '0px 0px'] }, { at: ts + 0.2, dur: .22 });
    cue(ts + 0.2, 'stamp');
  }
};
/* merge: a row of labelled steps is struck out and collapses into one circle; a second headline line then appears. */
S.merge = s => {
  const root = sceneRoot(s), lines = s.lines || [], after = s.after;
  const head = storyHead(root, s, after ? lines.concat([after.line]) : lines, after ? lines.length : s.chrome);
  const els = boxRow(root, s.items || []);
  const lead = s.lead ?? 0.3, step = s.step ?? 0.22;
  els.forEach((b, i) => { const a = s.at + lead + i * step; A(b, { opacity: [0, 1], scale: [.6, 1] }, { at: a, dur: .28, ease: EASE.back }); cue(a, 'tick', { i }); });
  const ts = s.at + (s.strike_at ?? lead + els.length * step + 0.25), tm = s.at + (s.merge_at ?? (ts - s.at) + 0.55);
  const strike = $('div', 'st-strike', root);
  A(strike, { scale: ['0 1', '1 1'] }, { at: ts, dur: .34, ease: EASE.io }); cue(ts, 'swish');
  els.forEach(b => toCentre(b, tm, .36));
  A(strike, { scale: ['1 1', '0 1'], translate: ['0px 0px', `${strike.offsetWidth / 2}px 0px`], opacity: [1, 0] }, { at: tm, dur: .3, ease: EASE.in });
  cue(tm - 0.02, 'suck');
  const one = $('div', 'st-one', root); $('i', '', one); $('b', '', one, s.into || '1');
  showBetween(one, tm + 0.3);
  A(one, { scale: [0, 1] }, { at: tm + 0.3, dur: .34, ease: EASE.back }); cue(tm + 0.34, 'ding', { i: 3 });
  if (after) {
    const ln = head.children[lines.length], ta = s.at + (after.t ?? (tm - s.at) + 0.7);
    A(ln, { opacity: [0, 1], translate: ['0 24px', '0 0'], filter: ['blur(12px)', 'blur(0px)'] }, { at: ta, dur: .34 }); cue(ta, 'hit', { i: 1 });
  }
};
/* count: the circle from `merge` stays where it was and counts up; the name of the current step sits right
   under it, so number and name are read in one place. Each count leaves one more ring behind the circle. */
S.count = s => {
  const root = sceneRoot(s), items = s.items || [], n = items.length, end = s.at + s.dur;
  storyHead(root, s, s.lines || [], s.chrome);
  const lead = s.lead ?? 0.4, step = s.step ?? 0.58, t0 = s.at + lead, at = i => t0 + i * step;
  const tOut = s.outro ? s.at + (s.outro.t ?? lead + n * step + 0.05) : Infinity;
  const tc = s.collapse === false ? Infinity : end - 0.3;
  const one = $('div', 'st-one', root); $('i', '', one);
  for (let i = n - 1; i >= 1; i--) { const r = $('u', '', one); showBetween(r, at(i)); A(r, { translate: [`${(i - 1) * 24}px 0px`, `${i * 24}px 0px`] }, { at: at(i), dur: .22 }); }
  const face = $('b', '', one);
  const lab = (text, a, b) => { const l = $('div', 'st-lab', root, text); fit(l, 940, 70, 40); showBetween(l, a, b); A(l, { opacity: [0, 1], translate: ['0 14px', '0 0'] }, { at: a, dur: .16 }); return l; };
  let last = null;
  items.forEach((x, i) => {
    const sp = $('span', '', face, String(i + 1));
    showBetween(sp, i === 0 ? -1 : at(i), i < n - 1 ? at(i + 1) : Infinity);
    if (i > 0) A(face, { scale: [.84, 1] }, { at: at(i), dur: .22, ease: EASE.back });
    last = lab(x, at(i), i < n - 1 ? at(i + 1) : tOut);
    cue(at(i), 'step', { i });
  });
  if (s.outro) { last = lab(s.outro.text, tOut, Infinity); cue(tOut, 'hit', { i: 1 }); }
  if (tc < Infinity) {
    A(one, { scale: [1, .5], opacity: [1, 0] }, { at: tc, dur: .3, ease: EASE.in });
    if (last) A(last, { opacity: [1, 0] }, { at: tc, dur: .2, ease: EASE.lin });
    cue(tc - 0.02, 'suck');
  }
};

/* ------------------------------------------------------------------ listing scenes
   Shared layout: a centred headline whose bottom edge sits at y=800 and the object right under it, starting
   at y=860. `dial` puts one call card there, `listings` puts its first row there, so the eye stays put
   across the cut. The headline is complete and sharp on the scene's first frame. */
const HANDSET = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
function lsHead(root, s, lines, chrome, t0, t1) {
  const el = $('div', 'ls-head', root);
  lines.forEach((l, i) => { const ln = $('span', 'ln', el, l); if (chrome === i) ln.classList.add('chrome'); });
  fit(el, 940, s.size || 140, 70);
  if (t0 != null) {
    showBetween(el, t0, t1 ?? Infinity);
    if (t0 > s.at) { [...el.children].forEach((ln, k) => A(ln, { opacity: [0, 1], translate: ['0 26px', '0 0'], filter: ['blur(12px)', 'blur(0px)'] }, { at: t0 + k * 0.08, dur: .32 })); cue(t0, 'slam'); }
    if (t1 != null) A(el, { opacity: [1, 0] }, { at: t1 - 0.1, dur: 0.1, ease: EASE.lin });
  }
  return el;
}
/* dial: headline + one call card. The handset rings ("calling…"); at fail_at the number is struck out, the
   status changes and the card shakes. Without fail_at the call simply keeps ringing. */
S.dial = s => {
  const root = sceneRoot(s);
  lsHead(root, s, s.lines || [], s.chrome);
  if (s.at > 0) cue(s.at, 'swish'); else cue(0, 'hit');
  const card = $('div', 'dl-card', root);
  const tf = s.fail_at != null ? s.at + s.fail_at : Infinity, end = s.at + s.dur;
  const ic = $('div', 'dl-ic', card);
  for (let k = 0; k < 2; k++) {
    const r = $('div', 'dl-ring', ic);
    A(r, { scale: [1, 1.62], opacity: [.8, 0] }, { at: s.at - 0.9 + k * 0.6, dur: 1.2, ease: EASE.lin, iter: Infinity });
    showBetween(r, -1, tf);
  }
  const on = $('div', 'dl-g', ic); on.innerHTML = HANDSET;
  const tx = $('div', 'dl-tx', card);
  const num = $('div', 'dl-num', tx); $('span', '', num, s.number || '098 000 111'); const strike = $('i', '', num);
  const st1 = $('div', 'dl-st', tx, s.status || 'calling…'), st2 = $('div', 'dl-st bad', tx, s.status_fail || 'not in service');
  showBetween(st1, -1, tf); showBetween(st2, tf);
  if (s.at > 0) A(card, { opacity: [0, 1], translate: ['0px 40px', '0px 0px'] }, { at: s.at + 0.05, dur: .4 });
  for (let t = s.at + 0.12; t < Math.min(tf, end) - 0.7; t += 1.05) cue(t, 'ring');
  if (tf < Infinity) {
    classAt(card, 'dead', tf);
    A(on, { rotate: ['0deg', '135deg'] }, { at: tf, dur: .3, ease: EASE.back });
    A(strike, { scale: ['0 1', '1 1'] }, { at: tf + 0.04, dur: .26, ease: EASE.io });
    A(card, { translate: ['0px 0px', '-16px 0px', '13px 0px', '-8px 0px', '0px 0px'] }, { at: tf, dur: .34, ease: EASE.lin });
    A(st2, { opacity: [0, 1], translate: ['0 12px', '0 0'] }, { at: tf, dur: .22 });
    cue(tf, 'error'); cue(tf + 0.04, 'hit', { i: 1 });
  }
};
/* listings: headline + up to three rows (a place and the value shown there). Every row starts with the old
   value and a grey cross. From fix.t the rows are corrected one at a time: the digits that differ roll to
   the new value and a lime check replaces the cross. `retitle` swaps the headline (usually at the turn). */
S.listings = s => {
  const root = sceneRoot(s), rows = s.rows || [], fix = s.fix || null, CELL = 64;
  const re = s.retitle || null, tr = re ? s.at + re.t : null;
  lsHead(root, s, s.lines || [], s.chrome, re ? s.at : null, tr);
  if (re) lsHead(root, s, re.lines, re.chrome, tr, null);
  cue(s.at, s.at === 0 ? 'hit' : 'swish');
  const box = $('div', 'ls-rows', root);
  const lead = s.lead ?? 0.35, step = s.step ?? 0.45;
  rows.forEach((r, i) => {
    const row = $('div', 'ls-row', box), a = s.at + lead + i * step;
    $('span', 'nm', row, r.name);
    const right = $('div', 'rt', row), num = $('div', 'ls-num', right);
    const from = String(r.value ?? s.value ?? ''), to = String((fix && (r.to ?? fix.value)) ?? from);
    const tfix = fix ? s.at + fix.t + i * (fix.step ?? 0.55) : Infinity, rolls = [];
    [...from.padEnd(to.length)].forEach((ch, k) => {
      const nw = to[k] ?? ch;
      if (ch === ' ' && nw === ' ') { $('span', 'sp', num); return; }
      const cell = $('span', 'd', num), col = $('span', 'col', cell);
      if (nw === ch) { $('b', '', col, ch); return; }
      const mid = /\d/.test(ch) && /\d/.test(nw) ? String((+ch + +nw + 5) % 10) : nw;
      [ch, mid, nw].forEach(x => $('b', '', col, x)); rolls.push(col);
    });
    const dot = $('div', 'ls-dot', right); dot.innerHTML = CROSS;
    const ck = $('div', 'ls-ck', right); ck.innerHTML = CHECK;
    if (s.at > 0 || i > 0 || lead > 0.05) { A(row, { opacity: [0, 1], translate: ['0px 44px', '0px 0px'] }, { at: a, dur: .36 }); cue(a, 'tick', { i }); }
    if (tfix < Infinity) {
      rolls.forEach((col, k) => A(col, { translate: ['0px 0px', `0px ${-2 * CELL}px`] }, { at: tfix + k * 0.05, dur: .42, ease: EASE.io }));
      const done = tfix + 0.34 + rolls.length * 0.05;
      classAt(row, 'ok', tfix + 0.2);
      A(row, { scale: [1, 1.025, 1] }, { at: tfix, dur: .5 });
      A(ck, { scale: [0, 1], opacity: [0, 1] }, { at: done, dur: .3, ease: EASE.back });
      for (let k = 0; k < 3; k++) cue(tfix + k * 0.09, 'key');
      cue(done, 'ding', { i });
    }
  });
};

/* ------------------------------------------------------------------ ad scenes
   Same layout as the listing scenes: a centred headline whose bottom edge sits at y=800 and one object
   right under it, starting at y=860, so the eye stays in one place across the cuts. */
/* receipt: headline + a paper receipt feeding out of a slot right under it. One row per paid click, the
   newest next to the slot (slow, fast, slow, so the first and the last rows can be read); then the total
   row lands: what all of it brought in. Only the paper moves. */
S.receipt = s => {
  const root = sceneRoot(s), n = s.count ?? 40, ROW = 78, TOT = 168, tot = s.total || {};
  lsHead(root, s, s.lines || [], s.chrome);
  cue(s.at, s.at === 0 ? 'hit' : 'slam');
  $('div', 'rc-slot', root);
  const win = $('div', 'rc-win', root), paper = $('div', 'rc-paper', win);
  const tr = $('div', 'rc-tot', paper); $('span', '', tr, tot.label || 'calls'); $('b', '', tr, String(tot.value ?? '0'));
  const rows = $('div', 'rc-rows', paper);
  for (let i = n; i >= 1; i--) { const r = $('div', 'rc-row', rows); $('span', '', r, (s.item || 'click') + ' ' + String(i).padStart(2, '0')); $('i', '', r); $('em', '', r, s.mark || 'paid'); }
  $('div', 'rc-tear', paper);
  const H = TOT + n * ROW, pre = Math.min(n, s.at === 0 ? (s.pre ?? 3) : 0);        // rows already out on the first frame
  const lead = s.lead ?? 0.2, T = s.feed ?? 1.9, t0 = s.at + lead, tt = s.at + (s.total_at ?? lead + T + 0.3);
  const ease = u => (u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
  const rowsAt = t => pre + (n - pre) * ease(clamp((t - t0) / T, 0, 1));
  tick(t => {
    const k = rowsAt(t), e = 1 - Math.pow(1 - clamp((t - tt) / 0.3, 0, 1), 3);
    paper.style.transform = `translateY(${Math.round(k * ROW + e * TOT - H)}px)`;
    const v = (rowsAt(t + 1 / 60) - rowsAt(t - 1 / 60)) * ROW;                      // px per frame: blur the rows while they fly
    rows.style.filter = v > 14 ? `blur(${Math.min(7, v / 16).toFixed(1)}px)` : 'none';
  });
  let lastCue = -1;
  for (let i = pre + 1; i <= n; i++) {
    const v = (i - pre) / (n - pre), u = v < .5 ? Math.sqrt(v / 2) : 1 - Math.sqrt((1 - v) / 2), t = t0 + u * T;
    if (t - lastCue < 0.05) continue;
    cue(t, t - lastCue > 0.11 ? 'click' : 'key'); lastCue = t;
  }
  A(win, { translate: ['0px 0px', '-14px 0px', '11px 0px', '-6px 0px', '0px 0px'] }, { at: tt + 0.24, dur: .32, ease: EASE.lin });
  cue(tt, 'swish'); cue(tt + 0.24, 'error'); cue(tt + 0.26, 'hit', { i: 1 });
};
/* landing: headline + one card that stays in place. It starts as the ad (what the ad promises), flips over
   at flip_at to the page the click lands on (which says something else: at miss_at a cross, a shake, the
   text goes grey), and from fix_at the page is corrected: its headline is retyped into the ad's words
   (lime check), then one button appears (button_at) and is tapped (press_at). `heads` swaps the headline. */
S.landing = s => {
  const root = sceneRoot(s), ad = s.ad || {}, pg = s.page || {}, heads = s.heads || [{ t: 0, lines: s.lines || [] }];
  const tf = s.at + (s.flip_at ?? 1.4), tm = s.at + (s.miss_at ?? (s.flip_at ?? 1.4) + 0.9);
  const tx = s.fix_at != null ? s.at + s.fix_at : Infinity;
  heads.forEach((h, k) => lsHead(root, s, h.lines, h.chrome, s.at + (h.t || 0), heads[k + 1] ? s.at + heads[k + 1].t : null));
  cue(s.at, s.at === 0 ? 'hit' : 'slam');
  const box = $('div', 'ld-box', root);
  const cA = $('div', 'ld-card ld-ad', box), top = $('div', 'ld-top', cA);
  $('b', '', top, ad.tag || 'Ad'); $('span', '', top, ad.site || 'yourbusiness.com');
  const adText = ad.text || 'Free quote today', pgText = pg.text || 'Welcome to our website', fixText = pg.fix || adText;
  const big = (parent, texts, max) => {                    // one line, sized so the longest of `texts` fits
    const el = $('div', 'ld-big', parent), sp = $('span', '', el, texts[0]); el.style.fontSize = '100px';
    const w = Math.max(...texts.map(x => { sp.textContent = x; return sp.getBoundingClientRect().width; })); sp.textContent = texts[0];
    el.style.fontSize = clamp(Math.floor(100 * 800 / Math.max(1, w)), 40, max) + 'px'; return sp;
  };
  big(cA, [adText], 108);
  const cB = $('div', 'ld-card ld-page', box), bar = $('div', 'ld-bar', cB);
  for (let k = 0; k < 3; k++) $('i', '', bar); $('span', '', bar, pg.url || ad.site || 'yourbusiness.com');
  const body = $('div', 'ld-body', cB), ptx = big(body, [pgText, fixText], 108);
  const slot = $('div', 'ld-slot', body), sk = $('div', 'ld-sk', slot); for (let k = 0; k < 2; k++) $('u', '', sk);
  const btn = $('div', 'ld-btn', slot); $('span', 'b1', btn, pg.button || 'Get my quote');
  const b2 = $('span', 'b2', btn); b2.innerHTML = CHECK_W.replace('<svg', '<svg style="width:46px;height:46px"'); $('span', '', b2, pg.button_done || 'Requested');
  const w1 = btn.offsetWidth; btn.classList.add('done'); const w2 = btn.offsetWidth; btn.classList.remove('done'); btn.style.width = Math.max(w1, w2) + 'px';
  const bad = $('div', 'ld-badge ld-bad', box); bad.innerHTML = CROSS;
  const ok = $('div', 'ld-badge ld-ok', box); ok.innerHTML = CHECK;
  const bc = centerIn(btn, root);                           // measured before any transform is animated
  if (s.at > 0) A(box, { scale: [.9, 1], opacity: [0, 1] }, { at: s.at, dur: .24 });
  /* flip: the ad turns away on its top edge, the page turns in */
  showBetween(cA, -1, tf + 0.16); showBetween(cB, tf + 0.16);
  A(cA, { rotate: ['x 0deg', 'x 88deg'] }, { at: tf, dur: .16, ease: EASE.in });
  A(cB, { rotate: ['x -88deg', 'x 0deg'] }, { at: tf + 0.16, dur: .26, ease: EASE.out });
  cue(tf, 'whoosh');
  /* miss */
  const t1 = tx + (s.fix_lead ?? 0.3), dd = 0.22, td = s.type_dur ?? 0.5, tc = t1 + dd + td + 0.12;
  showBetween(bad, tm, tc); A(bad, { scale: [0, 1] }, { at: tm, dur: .26, ease: EASE.back });
  classAt(cB, 'miss', tm, t1);
  A(box, { translate: ['0px 0px', '-16px 0px', '13px 0px', '-8px 0px', '0px 0px'] }, { at: tm, dur: .34, ease: EASE.lin });
  cue(tm, 'error'); cue(tm + 0.04, 'hit', { i: 1 });
  /* fix: same words as the ad, then one button */
  tick(t => {
    let x = pgText;
    if (t >= t1 - 1e-6) { const u = (t - t1) / dd; x = u < 1 ? pgText.slice(0, Math.round((1 - u) * pgText.length)) : fixText.slice(0, Math.round(clamp((t - t1 - dd) / td, 0, 1) * fixText.length)); }
    ptx.textContent = x || '​';
  });
  if (tx < Infinity) {
    classAt(cB, 'typing', t1, t1 + dd + td);
    for (let t = t1; t < t1 + dd + td - 0.01; t += 0.06) cue(t, 'key');
    showBetween(ok, tc); A(ok, { scale: [0, 1] }, { at: tc, dur: .3, ease: EASE.back }); cue(tc, 'ding', { i: 1 });
    const tb = s.at + (s.button_at ?? (tc - s.at) + 0.45), tp = s.press_at != null ? s.at + s.press_at : Infinity;
    A(sk, { opacity: [1, 0] }, { at: tb - 0.12, dur: .12, ease: EASE.lin });
    showBetween(btn, tb); A(btn, { scale: [.6, 1], opacity: [0, 1] }, { at: tb, dur: .3, ease: EASE.back }); cue(tb, 'pop');
    if (tp < Infinity) {
      const d = $('div', 'tap light st-tap', root); d.style.left = bc[0] + 'px'; d.style.top = bc[1] + 'px';
      A(d, { opacity: [0, 1, 1, 0], scale: [1.7, 1, 1, 1.3], offset: [0, .45, .7, 1] }, { at: tp - 0.26, dur: 0.6, ease: EASE.lin });
      classAt(btn, 'done', tp + 0.02); A(btn, { scale: [1, .94, 1] }, { at: tp, dur: .28 });
      cue(tp, 'tap'); cue(tp + 0.1, 'ding', { i: 3 });
    }
  } else showBetween(btn, Infinity);
};

/* ------------------------------------------------------------------ the cafe story: one set, one cast
   Two sets (inside the cafe, outside on the street) drawn in SVG on one floor line, and a cast of stick
   figures moved by a small rig. Every figure is built from the same RIG, so the owner looks the same in
   every scene. Feet are planted: while a foot carries the weight it stays where it landed, and the body
   travels exactly one stride per step, so nobody walks on the spot, slides or floats. Knees and elbows
   are solved from where the foot and the hand must be (two-bone IK), so a figure can sit exactly on a
   stool or stand exactly on a ledge. The set is 960x720 at x=60, y=560 of the frame; the floor (y=660)
   lands at frame y=1220, inside the area Instagram leaves uncovered. */
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const easeOut = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
const FLOOR = 660;
/* figure proportions in figure units; actors scale them (owner 1.35 ≈ 270 px tall) */
const RIG = { thigh: 43, shin: 41, upper: 27, fore: 25, torso: 80, shoulder: 58, head: 21, headAt: 103, stand: 82, walk: 78.5, stroke: 10.5, stride: 108, lift: 16 };
const INK = {
  owner: ['#FAFAFA', '#a6a6ad'],     // near limbs, far limbs (darker, so the stride reads)
  guest: ['#C8FF3D', '#88aa27'],     // zip's CTA lime: the people who came because of the fix
  street: ['#4b4b54', '#303037'],
  visitor: ['#a3a3ac', '#6a6a73']    // a lead figure who has not come in yet: lighter than the street, not the owner's white
};
function ik2(ax, ay, bx, by, l1, l2, bend) {
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.01;
  if (d > max) { bx = ax + dx / d * max; by = ay + dy / d * max; dx = bx - ax; dy = by - ay; d = max; }
  d = Math.max(d, Math.abs(l1 - l2) + 0.01);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const ang = Math.atan2(dy, dx) + bend * a;
  return [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1, bx, by];
}
/* mkPath: a polyline walked by arc length; each piece remembers which way the figure faces */
function mkPath(pts) {
  const P = [], cum = [0];
  pts.forEach(p => { if (!P.length || Math.hypot(p[0] - P[P.length - 1][0], p[1] - P[P.length - 1][1]) > 0.5) P.push([p[0], p[1]]); });
  if (P.length === 1) P.push([P[0][0] + 0.01, P[0][1]]);
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = cum[cum.length - 1], face = [];
  let last = P[1][0] < P[0][0] ? -1 : 1;
  for (let i = 1; i < P.length; i++) { const dx = P[i][0] - P[i - 1][0], len = (cum[i] - cum[i - 1]) || 1; if (Math.abs(dx / len) > 0.3) last = dx > 0 ? 1 : -1; face.push(last); }
  const at = s => {
    s = clamp(s, 0, L);
    let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
    const len = (cum[i] - cum[i - 1]) || 1, u = (s - cum[i - 1]) / len;
    return { x: lerp(P[i - 1][0], P[i][0], u), y: lerp(P[i - 1][1], P[i][1], u), tx: (P[i][0] - P[i - 1][0]) / len, d: face[i - 1] };
  };
  return { L, at, end: P[P.length - 1] };
}
const arcPts = (c, r, from, sweep, n = 60) => Array.from({ length: n + 1 }, (_, k) => { const a = (from + sweep * k / n) * Math.PI / 180; return [c[0] + r[0] * Math.cos(a), c[1] + r[1] * Math.sin(a)]; });

/* poses: hip (hx, hy), torso tilt (radians, forward), facing d, eye (−1…1, 0 = looking at us), scale,
   opacity, and the targets the feet and hands must reach (near limb first) */
const shoulderOf = p => [p.hx + p.d * Math.sin(p.tilt) * RIG.shoulder * p.sc, p.hy - Math.cos(p.tilt) * RIG.shoulder * p.sc];
const headOf = p => [p.hx + p.d * Math.sin(p.tilt) * RIG.headAt * p.sc, p.hy - Math.cos(p.tilt) * RIG.headAt * p.sc];
function standPose(A, x, g, d, t, o = {}) {
  const sc = A.scaleAt(g), br = Math.sin(t * 2.3 + A.seed) * 1.2 * sc, f = g - (o.e || 0);   // e: standing on something e px high
  const fd = o.fd ?? d;                                   // feet and hands keep the side they had; only the look turns
  const p = { hx: x, hy: f - RIG.stand * sc + (o.dip || 0) * sc + br * 0.3, tilt: o.tilt || 0.02, d, eye: o.eye ?? d, sc, op: 1, blink: o.blink || 0,
    feet: o.feet ? o.feet.map(q => [q[0], f]) : [[x + fd * 9 * sc, f], [x - fd * 8 * sc, f]] };
  const [sx, sy] = shoulderOf(p);
  p.hands = [[sx + fd * 7 * sc, sy + 47 * sc + br], [sx - fd * 6 * sc, sy + 47 * sc + br]];
  return p;
}
function walkPose(A, path, s, t) {
  const S = RIG.stride * A.scaleAt(path.at(0).y), P = path.at(s), sc = A.scaleAt(P.y), d = P.d;
  const feet = [0, 0.5].map(o => {
    const u = s / S + o, n = Math.floor(u), f = u - n, plant = k => path.at((k - o + 0.25) * S);
    if (f < 0.5) { const q = plant(n); return [q.x, q.y]; }
    const a = plant(n), b = plant(n + 1), w = smooth((f - 0.5) * 2);
    return [lerp(a.x, b.x, w), lerp(a.y, b.y, w) - Math.sin(Math.PI * (f - 0.5) * 2) * RIG.lift * sc];
  });
  const u0 = s / S, p = { hx: P.x, hy: P.y - RIG.walk * sc + Math.cos(4 * Math.PI * u0) * 2.6 * sc, tilt: 0.07, d, eye: P.tx, sc, op: 1, blink: 0, feet };
  const [sx, sy] = shoulderOf(p), w = Math.cos(2 * Math.PI * u0);          // +1 while the near foot is ahead
  p.hands = [-1, 1].map(k => { const phi = k * w * 0.5; return [sx + d * Math.sin(phi) * 49 * sc, sy + Math.cos(phi) * 49 * sc]; });
  return p;
}
function lerpPose(a, b, u) {
  const L2 = (x, y) => [lerp(x[0], y[0], u), lerp(x[1], y[1], u)];
  return { hx: lerp(a.hx, b.hx, u), hy: lerp(a.hy, b.hy, u), tilt: lerp(a.tilt, b.tilt, u), d: u < 0.5 ? a.d : b.d, eye: lerp(a.eye, b.eye, u), blink: lerp(a.blink || 0, b.blink || 0, u),
    sc: lerp(a.sc, b.sc, u), op: lerp(a.op, b.op, u), feet: [L2(a.feet[0], b.feet[0]), L2(a.feet[1], b.feet[1])], hands: [L2(a.hands[0], b.hands[0]), L2(a.hands[1], b.hands[1])] };
}
function drawFig(F, p) {
  if (p.op <= 0.01) { F.g.style.display = 'none'; return; }
  F.g.style.display = ''; F.g.setAttribute('opacity', p.op.toFixed(3));
  const sc = p.sc, d = p.d >= 0 ? 1 : -1, [sx, sy] = shoulderOf(p), [cx, cy] = headOf(p), sw = (RIG.stroke * sc).toFixed(2);
  const seg = (x, y, j) => `M${x.toFixed(1)} ${y.toFixed(1)}L${j[0].toFixed(1)} ${j[1].toFixed(1)}L${j[2].toFixed(1)} ${j[3].toFixed(1)}`;
  const legs = p.feet.map(f => ik2(p.hx, p.hy, f[0], f[1], RIG.thigh * sc, RIG.shin * sc, -d));
  const arms = p.hands.map(h => ik2(sx, sy, h[0], h[1], RIG.upper * sc, RIG.fore * sc, d));
  F.legN.setAttribute('d', seg(p.hx, p.hy, legs[0])); F.legF.setAttribute('d', seg(p.hx, p.hy, legs[1]));
  F.armN.setAttribute('d', seg(sx, sy, arms[0])); F.armF.setAttribute('d', seg(sx, sy, arms[1]));
  const ny = cy + RIG.head * sc * 0.8, nx = cx + (p.hx - cx) * (RIG.head * 0.8 / RIG.headAt);
  F.torso.setAttribute('d', `M${p.hx.toFixed(1)} ${p.hy.toFixed(1)}L${nx.toFixed(1)} ${ny.toFixed(1)}`);
  [F.legN, F.legF, F.armN, F.armF, F.torso].forEach(e => e.setAttribute('stroke-width', sw));
  F.head.setAttribute('cx', cx.toFixed(1)); F.head.setAttribute('cy', cy.toFixed(1)); F.head.setAttribute('r', (RIG.head * sc).toFixed(1));
  F.eye.setAttribute('cx', (cx + p.eye * 9.5 * sc).toFixed(1)); F.eye.setAttribute('cy', (cy - 2.5 * sc).toFixed(1));
  F.eye.setAttribute('rx', (3.3 * sc * (1 + 0.5 * (p.blink || 0))).toFixed(2)); F.eye.setAttribute('ry', (3.3 * sc * (1 - 0.82 * (p.blink || 0))).toFixed(2));   // blink: the eye closes to a line
}
/* actor(): one figure and its script. `segs` run one after another from `at` (seconds from the scene
   start, may be negative so the figure is already moving on the first frame):
     walk {to | path, cycle}   circle {c, r, from, sweep, cycle}   stand {dur, look:[[t, dir]…], tilt}
     hop {to, dur}   sit {seat, table, dur}   wipe {at, dur}   wave {dur}   shade {dur, look}   enter {dur}
   Each segment eases in from where the previous one ended, so poses never jump. */
function actor(layer, a, s) {
  const A = { sc: a.sc ?? 1.35, depth: a.depth ?? 0, ref: a.ref ?? (a.g ?? FLOOR), seed: a.seed ?? 1.7 };
  A.scaleAt = y => A.sc * (1 + (y - A.ref) * A.depth);
  const ink = INK[a.ink || 'owner'], g = sv('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, layer);
  const F = { g, armF: sv('path', { stroke: ink[1] }, g), legF: sv('path', { stroke: ink[1] }, g), torso: sv('path', { stroke: ink[0] }, g),
    legN: sv('path', { stroke: ink[0] }, g), armN: sv('path', { stroke: ink[0] }, g), head: sv('circle', { fill: ink[0] }, g), eye: sv('ellipse', { fill: '#000' }, g) };
  const base = s.at + (a.at || 0), segs = [];
  let cur = { x: a.x, g: a.g ?? FLOOR, d: a.d ?? 1, e: a.e || 0 }, t0 = 0;    // e: starts standing on something (a step behind the counter)
  const steps = (T, from, dur) => { if (!a.steps) return; for (let k = 0; k * T / 2 < dur; k++) { const at = base + from + k * T / 2; if (at >= s.at && at < s.at + a.steps) cue(at, 'foot', { i: k }); } };
  const dirAt = (look, d0, τ) => { let d = d0; (look || []).forEach(([lt, ld]) => { if (τ >= lt) d = ld; }); return d; };
  const lookAt = (look, d0, τ) => { let d = d0, prev = d0, ts = -9; (look || []).forEach(([lt, ld]) => { if (τ >= lt) { if (ld !== d) { prev = d; ts = lt; } d = ld; } }); return { d, eye: lerp(prev, d, smooth((τ - ts) / 0.14)) }; };
  const list = (a.segs || []).slice();
  const last = list[list.length - 1];
  if (!last || ['walk', 'circle', 'hop'].includes(last.do)) list.push({ do: 'stand', dur: 99 });
  list.forEach((q, qi) => {
    const c0 = { ...cur }, sg = { t0, blend: q.blend ?? 0.16 };
    if (q.do === 'walk' || q.do === 'circle') {
      const pts = q.do === 'walk' ? [[c0.x, c0.g], ...(q.path || [q.to])] : [[c0.x, c0.g], ...arcPts(q.c, q.r, q.from, q.sweep)];
      const path = mkPath(pts), T = q.cycle ?? 0.62, v = RIG.stride * A.scaleAt(path.at(0).y) / T, dur = path.L / v;
      sg.dur = dur; sg.walk = true; sg.pose = (τ, t) => walkPose(A, path, τ * v, t);
      steps(T, t0, dur);
      const e = path.at(path.L); cur = { x: e.x, g: e.y, d: e.d, e: 0 };
    } else if (q.do === 'hop') {
      const dur = q.dur ?? 0.46, [x1, g1] = q.to, e0 = c0.e || 0, e1 = q.up || 0, d = x1 >= c0.x ? 1 : -1;
      sg.dur = dur; sg.blend = 0.1;
      sg.pose = (τ, t) => {
        const u = τ / dur;
        if (u < 0.3) { const k = smooth(u / 0.3), p = standPose(A, c0.x, c0.g, d, t, { e: e0, dip: 12 * k, tilt: 0.25 * k }); const [sx, sy] = shoulderOf(p); p.hands = [[sx - d * 22 * p.sc * k, sy + 40 * p.sc], [sx - d * 26 * p.sc * k, sy + 38 * p.sc]]; return p; }
        if (u < 0.8) {
          const k = (u - 0.3) / 0.5, e = smooth(k), x = lerp(c0.x, x1, e), gy = lerp(c0.g - e0, g1 - e1, e) - Math.sin(Math.PI * k) * 40 * A.sc, sc = A.scaleAt(lerp(c0.g, g1, e));
          const p = { hx: x, hy: gy - (RIG.stand - 10) * sc, tilt: 0.12, d, eye: d, sc, op: 1, feet: [[x + d * 10 * sc, gy - 6 * sc], [x - d * 4 * sc, gy - 12 * sc]] };
          const [sx, sy] = shoulderOf(p); p.hands = [[sx + d * 28 * sc, sy - 12 * sc], [sx + d * 18 * sc, sy - 4 * sc]]; return p;
        }
        const k = (u - 0.8) / 0.2; return standPose(A, x1, g1, d, t, { e: e1, dip: 12 * Math.sin(Math.PI * k), tilt: 0.12 * (1 - k) });
      };
      cue(base + t0 + dur * 0.3, 'swish'); cue(base + t0 + dur * 0.8, 'land');
      cur = { x: x1, g: g1, d, e: e1 };
    } else if (q.do === 'sit') {
      const dur = q.dur ?? 0.36, [sxx, syy] = q.seat, d = c0.d;
      const seated = t => { const sc = A.scaleAt(FLOOR), p = { hx: sxx, hy: syy - 2 * sc + Math.sin(t * 2.3 + A.seed) * 0.6 * sc, tilt: 0.1, d, eye: d, sc, op: 1,
        feet: q.feet ? [[q.feet[0], q.feet[1]], [q.feet[0] - d * 10 * sc, q.feet[1]]] : [[sxx + d * 44 * sc, FLOOR], [sxx + d * 33 * sc, FLOOR]] };
        const [sx, sy] = shoulderOf(p);
        p.hands = q.table ? [[q.table[0], q.table[1]], [q.table[0] - d * 16 * sc, q.table[1]]] : [[sx + d * 30 * sc, sy + 40 * sc], [sx + d * 22 * sc, sy + 42 * sc]];
        return p; };
      sg.dur = q.hold ?? 99; sg.blend = dur; sg.pose = (τ, t) => seated(t);
      cue(base + t0 + dur, 'tick', { i: qi });
      cur = { x: sxx, g: FLOOR, d };
    } else {
      const dur = q.dur ?? 0.6, d0 = q.d ?? c0.d, pv = segs[segs.length - 1];
      let keep = null;
      if (pv && pv.walk && q.do !== 'enter') {
        const e = pv.pose(pv.dur, 0), pi = e.feet[0][1] >= e.feet[1][1] ? 0 : 1, pf = e.feet[pi], side = Math.sign(pf[0] - c0.x) || 1;
        keep = []; keep[pi] = [clamp(pf[0], c0.x - 22 * e.sc, c0.x + 22 * e.sc), c0.g]; keep[1 - pi] = [c0.x - side * 9 * e.sc, c0.g];
      }
      sg.dur = dur;
      if (q.do === 'wipe') sg.pose = (τ, t) => {
        const p = standPose(A, c0.x, c0.g, d0, t, { e: c0.e, tilt: q.tilt ?? 0.6, dip: q.dip ?? 18, feet: keep }), w = τ * 2 * Math.PI * 1.7;
        p.hands = [[q.at[0] + Math.cos(w) * 14 * p.sc, q.at[1] + Math.sin(w) * 3 * p.sc], [q.at[0] - d0 * 26 * p.sc, q.at[1] + 2]];
        return p; };
      else if (q.do === 'wave') sg.pose = (τ, t) => {
        const p = standPose(A, c0.x, c0.g, d0, t, { e: c0.e, feet: keep }), [sx, sy] = shoulderOf(p), k = Math.min(1, τ / 0.2);
        p.hands[0] = [sx + d0 * (16 + Math.sin(τ * 2 * Math.PI * 3.2) * 13 * k) * p.sc, sy - 46 * p.sc * k + 47 * p.sc * (1 - k)];
        return p; };
      else if (q.do === 'hold') sg.pose = (τ, t) => {
        const L = lookAt(q.look, d0, τ), bl = q.blink || [], p = standPose(A, c0.x, c0.g, L.d, t, { e: c0.e, tilt: 0.06, eye: L.eye, fd: d0, feet: keep });
        let b = 0; for (let k = 0; k < bl.length; k++) { const [bt, bv] = bl[k], nx = bl[k + 1]; if (τ >= bt) b = nx && τ < nx[0] ? lerp(bv, nx[1], smooth((τ - bt) / (nx[0] - bt))) : bv; }
        p.blink = b; const [sx, sy] = shoulderOf(p);
        p.hands = [[sx + d0 * 34 * p.sc, sy - 4 * p.sc], [sx + d0 * 27 * p.sc, sy + 3 * p.sc]];
        return p; };
      else if (q.do === 'shade') sg.pose = (τ, t) => {
        const L = lookAt(q.look, d0, τ), d = L.d, p = standPose(A, c0.x, c0.g, d, t, { e: c0.e, tilt: 0.06, eye: L.eye, fd: d0, feet: keep }), [hx, hy] = headOf(p);
        p.hands = [[hx + d * 16 * p.sc, hy - 3 * p.sc], [p.hx - d * 14 * p.sc, p.hy - 14 * p.sc]];
        return p; };
      else if (q.do === 'enter') { sg.blend = 0.08; sg.pose = (τ, t) => {
        const u = easeOut(τ / dur), p = standPose(A, c0.x, c0.g, d0, t, { eye: lerp(d0, 0, Math.min(1, τ / 0.1)) });
        p.op = 1 - u; p.sc *= 1 - 0.12 * u; p.hy -= 10 * u; p.feet.forEach(f => { f[1] -= 10 * u; }); return p; };
        if (base + t0 < s.at + s.dur) cue(base + t0 + 0.02, 'doorbell', { i: qi }); }   // only doors we can see
      else sg.pose = (τ, t) => { const L = lookAt(q.look, d0, τ); return standPose(A, c0.x, c0.g, L.d, t, { e: c0.e, tilt: q.tilt, eye: L.eye, fd: d0, feet: keep }); };
      cur = { ...c0, d: q.do === 'shade' || q.do === 'stand' ? dirAt(q.look, d0, 99) : d0 };
    }
    sg.t1 = t0 + sg.dur; t0 = sg.t1; segs.push(sg);
  });
  const poseAt = t => {
    const τ = t - base;
    let k = segs.findIndex(sg => τ < sg.t1); if (k < 0) k = segs.length - 1;
    const sg = segs[k], tk = clamp(τ - sg.t0, 0, sg.dur);
    let p = sg.pose(tk, t);
    if (k > 0 && tk < sg.blend) { const pv = segs[k - 1]; p = lerpPose(pv.pose(pv.dur, t), p, smooth(tk / sg.blend)); }
    if (a.appear != null) p.op *= clamp((τ - a.appear) / 0.22, 0, 1);
    return p;
  };
  if (a.bell) cue(base + (a.appear || 0), 'doorbell');
  const clock = t => (a.freeze != null ? s.at + a.freeze : t);       // freeze: the figure holds one instant
  const ph = a.phone ? sv('rect', { rx: 5 * A.sc, fill: '#e9e9ee', stroke: '#000', 'stroke-width': 2 }, g) : null;
  const inkTo = a.ink_to ? INK[a.ink_to] : null, tInk = s.at + (a.ink_at ?? 0);
  tick(t => {
    if (t < s.at - 1e-6 || t >= s.at + s.dur) return;
    const p = poseAt(clock(t)); drawFig(F, p);
    if (inkTo) { const k = t >= tInk ? inkTo : ink; [F.legN, F.armN, F.torso].forEach(e => e.setAttribute('stroke', k[0])); [F.legF, F.armF].forEach(e => e.setAttribute('stroke', k[1])); F.head.setAttribute('fill', k[0]); }
    if (ph) {
      const [hx, hy] = p.hands[0], w = 21 * p.sc, h = 37 * p.sc, off = a.phone_off_at != null && t >= s.at + a.phone_off_at;
      ph.setAttribute('x', (hx - w / 2 + p.d * 3 * p.sc).toFixed(1)); ph.setAttribute('y', (hy - h * 0.72).toFixed(1));
      ph.setAttribute('width', w.toFixed(1)); ph.setAttribute('height', h.toFixed(1)); ph.setAttribute('fill', off ? '#26262b' : '#e9e9ee');
      ph.style.display = p.op > 0.01 ? '' : 'none';
    }
  });
  if (inkTo) { cue(tInk, 'pop', { i: 4 }); ANIM(g, { opacity: [1, 0.35, 1] }, { at: tInk - 0.02, dur: 0.18, ease: EASE.lin }); }
  return { poseAt: t => poseAt(clock(t)) };
}
/* street passers-by: grey figures on two lanes, both directions; none of them turns in */
function passers(layers, s, o) {
  const r = rng(o.seed ?? 7), n = o.count ?? 8, lanes = o.lanes || [{ g: 664, sc: 1.2, layer: 'back' }, { g: 732, sc: 1.48, layer: 'front' }];
  const span = s.dur + 2.2, gap = span / n;
  for (let k = 0; k < n; k++) {
    const ln = lanes[(o.pattern || [0, 0, 1])[k % (o.pattern || [0, 0, 1]).length]], dir = r() < 0.5 ? 1 : -1, cyc = 0.6 + r() * 0.14;
    actor(layers[ln.layer], { ink: 'street', sc: ln.sc * (0.95 + r() * 0.1), x: dir > 0 ? -200 : 1160, g: ln.g, d: dir, at: -2.2 + k * gap + r() * gap * 0.6,
      seed: k * 1.3, segs: [{ do: 'walk', to: [dir > 0 ? 1160 : -200, ln.g], cycle: cyc }] }, s);
  }
}
/* fgStage: the headline at the top of the safe area, then the 960x720 area the set is drawn in.
   `hold_head` carries the same headline across a hard cut: no scale-in, no slam. */
function fgStage(s) {
  const root = sceneRoot(s);
  if ((s.lines || []).length) {
    const el = $('div', 'fg-head', root);
    s.lines.forEach((l, i) => { const ln = $('span', 'ln', el, l); if (s.chrome === i) ln.classList.add('chrome'); });
    fit(el, 940, s.size || 150, 70);
    if (s.at > 0 && !s.hold_head) A(el, { scale: [1.04, 1] }, { at: s.at, dur: .2 });
  }
  if (!s.hold_head) cue(s.at, s.at === 0 ? 'hit' : (s.lines || []).length ? 'slam' : 'swish');   // no headline, no slam
  (s.sfx || []).forEach(([t, k], i) => cue(s.at + t, k, { i }));     // extra cues: [[t, kind], …]
  const st = $('div', 'fg-stage', root);
  return { root, st };
}
const LINE = '#26262b', PANEL = '#0D0D0F', PANEL2 = '#17171A';
function setSvg(st, s) {
  const svg = sv('svg', { viewBox: '0 0 960 720', width: 960, height: 720, class: 'cf-set' }, st);
  const L = {}; ['back', 'door', 'counterBack', 'counter', 'stools', 'cast', 'front', 'top'].forEach(k => { L[k] = sv('g', {}, svg); });
  return { svg, L };
}
/* cafe_in: inside. Door on the left, two tables with a stool each, the counter on the right with the
   owner behind it when he is there. `door` "open" or a time it opens at, `lamps` "lit" (glow) or not,
   `ticks` a row of checked items under the headline, `cups` [{x, t}] that appear on the tables. */
S.cafe_in = s => {
  const { root, st } = fgStage(s), { svg, L } = setSvg(st, s);
  const defs = sv('defs', {}, svg), gid = 'glow' + s.i, rg = sv('radialGradient', { id: gid }, defs);
  sv('stop', { offset: '0', 'stop-color': '#FAFAFA', 'stop-opacity': '.32' }, rg); sv('stop', { offset: '1', 'stop-color': '#FAFAFA', 'stop-opacity': '0' }, rg);
  sv('line', { x1: -60, y1: FLOOR, x2: 1020, y2: FLOOR, stroke: LINE, 'stroke-width': 3 }, L.back);
  const menu = sv('g', {}, L.back); sv('rect', { x: 382, y: 196, width: 150, height: 104, rx: 8, fill: PANEL, stroke: LINE, 'stroke-width': 3 }, menu);
  [[402, 220, 84], [402, 244, 106], [402, 268, 70]].forEach(([x, y, w]) => sv('rect', { x, y, width: w, height: 8, rx: 4, fill: LINE }, menu));
  const TABLES = [310, 540], lit = s.lamps === 'lit', tl = s.at + (s.lit_at ?? 0);   // stools at table − 100
  TABLES.forEach((x, i) => {
    sv('line', { x1: x, y1: 40, x2: x, y2: 112, stroke: LINE, 'stroke-width': 3 }, L.back);   // short cord: clears the tick row above
    const glow = sv('ellipse', { cx: x, cy: 150, rx: 150, ry: 120, fill: `url(#${gid})`, opacity: 0 }, L.back);
    const shade = sv('path', { d: `M${x - 38} 146L${x - 20} 112H${x + 20}L${x + 38} 146Z`, fill: PANEL2, stroke: LINE, 'stroke-width': 3, 'stroke-linejoin': 'round' }, L.back);
    const bulb = sv('ellipse', { cx: x, cy: 148, rx: 14, ry: 5, fill: '#3a3a42' }, L.back);
    if (lit) { tick(t => { const u = clamp((t - tl - i * 0.12) / 0.25, 0, 1); glow.setAttribute('opacity', u.toFixed(3)); bulb.setAttribute('fill', u > 0.5 ? '#FAFAFA' : '#3a3a42'); shade.setAttribute('stroke', u > 0.5 ? '#5c5c64' : LINE); }); cue(tl + i * 0.12, 'pop', { i }); }
  });
  /* door: frame, the dark opening, and the leaf that swings open */
  sv('rect', { x: 20, y: 320, width: 150, height: 340, fill: '#000', stroke: LINE, 'stroke-width': 3 }, L.door);
  const leaf = sv('g', {}, L.door);
  sv('rect', { x: 24, y: 324, width: 142, height: 336, fill: PANEL, stroke: LINE, 'stroke-width': 3 }, leaf);
  sv('rect', { x: 46, y: 352, width: 98, height: 120, rx: 4, fill: '#000', stroke: LINE, 'stroke-width': 3 }, leaf);
  sv('circle', { cx: 146, cy: 500, r: 6, fill: '#3a3a42' }, leaf);
  const td = s.door === 'open' ? -1 : (typeof s.door === 'number' ? s.at + s.door : Infinity);
  tick(t => { const k = 1 - 0.84 * smooth((t - td) / 0.28); leaf.setAttribute('transform', `translate(22 0) scale(${k.toFixed(3)} 1) translate(-22 0)`); });
  if (td > s.at && td < Infinity) cue(td, 'doorbell');
  /* counter, shelf and machine */
  sv('line', { x1: 722, y1: 330, x2: 936, y2: 330, stroke: LINE, 'stroke-width': 4 }, L.counterBack);
  [[736, 34], [774, 46], [812, 30], [850, 42], [888, 36]].forEach(([x, h]) => sv('rect', { x, y: 328 - h, width: 26, height: h, rx: 3, fill: PANEL2, stroke: LINE, 'stroke-width': 2 }, L.counterBack));
  sv('rect', { x: 690, y: 500, width: 254, height: 160, fill: PANEL, stroke: LINE, 'stroke-width': 3 }, L.counter);
  sv('rect', { x: 676, y: 492, width: 282, height: 16, rx: 7, fill: LINE }, L.counter);
  sv('rect', { x: 872, y: 424, width: 58, height: 68, rx: 7, fill: PANEL2, stroke: LINE, 'stroke-width': 3 }, L.counter);
  sv('rect', { x: 884, y: 470, width: 10, height: 14, fill: LINE }, L.counter);
  /* stools: the seat top is at y=614, where a seated figure's hip rests */
  TABLES.forEach(x => { const c = x - 100; sv('line', { x1: c, y1: 618, x2: c, y2: FLOOR, stroke: LINE, 'stroke-width': 6 }, L.stools); sv('line', { x1: c - 18, y1: FLOOR - 2, x2: c + 18, y2: FLOOR - 2, stroke: LINE, 'stroke-width': 5, 'stroke-linecap': 'round' }, L.stools); sv('rect', { x: c - 27, y: 612, width: 54, height: 11, rx: 5.5, fill: PANEL2, stroke: LINE, 'stroke-width': 3 }, L.stools); });
  TABLES.forEach(x => { sv('line', { x1: x, y1: 580, x2: x, y2: FLOOR, stroke: LINE, 'stroke-width': 8 }, L.front); sv('line', { x1: x - 36, y1: FLOOR - 3, x2: x + 36, y2: FLOOR - 3, stroke: LINE, 'stroke-width': 6, 'stroke-linecap': 'round' }, L.front); sv('rect', { x: x - 72, y: 568, width: 144, height: 13, rx: 6.5, fill: PANEL2, stroke: LINE, 'stroke-width': 3 }, L.front); });
  (s.cups || []).forEach((c, i) => {
    const g = sv('g', {}, L.top), tc = s.at + c.t;
    sv('path', { d: `M${c.x - 14} 548h28l-3 19h-22z`, fill: '#FAFAFA' }, g); sv('path', { d: `M${c.x + 13} 552a7 7 0 0 1 0 12`, fill: 'none', stroke: '#FAFAFA', 'stroke-width': 4 }, g);
    tick(t => { const u = clamp((t - tc) / 0.22, 0, 1); g.setAttribute('opacity', u > 0 ? 1 : 0); g.setAttribute('transform', `translate(${c.x} 567) scale(${(0.4 + 0.6 * easeOut(u) + Math.sin(u * Math.PI) * 0.15).toFixed(3)}) translate(${-c.x} -567)`); });
    cue(tc, 'pop', { i: i + 2 });
  });
  if (s.ticks) {
    const box = $('div', 'cf-ticks', root), lead = s.lead ?? 0.2, step = s.step ?? 0.4;
    s.ticks.forEach((x, i) => {
      const it = $('div', 'cf-tick', box), ic = $('i', '', it); ic.innerHTML = CHECK; $('span', '', it, x);
      const a = s.at + lead + i * step; tick(t => { it.style.opacity = t >= a ? 1 : 0; });
      A(it, { translate: ['0 18px', '0 0'] }, { at: a, dur: .24 }); A(ic, { scale: [0, 1] }, { at: a + 0.03, dur: .26, ease: EASE.back });
      cue(a, 'ding', { i });
    });
  }
  (s.cast || []).forEach(a => actor(L[a.layer || 'cast'], a, s));
};
/* drawFacade: the cafe from the street — neighbours either side, awning, window over a stone ledge, open
   door with its OPEN sign, and a clock that runs fast. Shared by cafe_out and behind. */
function drawFacade(G, s) {
  [[-640, 120], [840, 1560]].forEach(([x0, x1]) => {                      // the neighbours: dim, so his is the one we see
    sv('rect', { x: x0, y: 214, width: x1 - x0, height: 446, fill: '#08080a', stroke: '#1a1a1f', 'stroke-width': 3 }, G);
    for (let x = x0 + 50; x < x1 - 120; x += 210) sv('rect', { x, y: 300, width: 140, height: 200, rx: 4, fill: '#050506', stroke: '#1a1a1f', 'stroke-width': 3 }, G);
  });
  sv('line', { x1: -1000, y1: FLOOR, x2: 2000, y2: FLOOR, stroke: LINE, 'stroke-width': 3 }, G);
  sv('line', { x1: -1000, y1: 752, x2: 2000, y2: 752, stroke: '#1b1b20', 'stroke-width': 3 }, G);
  sv('rect', { x: 150, y: 170, width: 660, height: 490, fill: PANEL, stroke: LINE, 'stroke-width': 3 }, G);
  for (let k = 0; k < 20; k++) sv('rect', { x: 130 + k * 35, y: 146, width: 35, height: 50, fill: k % 2 ? PANEL : PANEL2 }, G);
  for (let k = 0; k < 20; k++) sv('path', { d: `M${130 + k * 35} 196a17.5 17.5 0 0 0 35 0z`, fill: k % 2 ? PANEL : PANEL2, stroke: LINE, 'stroke-width': 2 }, G);
  sv('rect', { x: 130, y: 146, width: 700, height: 50, fill: 'none', stroke: LINE, 'stroke-width': 3 }, G);
  /* window with the empty room behind the glass */
  sv('rect', { x: 196, y: 262, width: 320, height: 290, rx: 4, fill: '#000', stroke: LINE, 'stroke-width': 3 }, G);
  [[262, 486], [430, 486]].forEach(([x, y]) => { sv('line', { x1: x - 30, y1: y, x2: x + 30, y2: y, stroke: '#1f1f25', 'stroke-width': 6, 'stroke-linecap': 'round' }, G); sv('line', { x1: x, y1: y, x2: x, y2: 552, stroke: '#1f1f25', 'stroke-width': 5 }, G); });
  sv('line', { x1: 356, y1: 262, x2: 356, y2: 552, stroke: LINE, 'stroke-width': 3 }, G);
  sv('rect', { x: 186, y: 586, width: 340, height: 74, rx: 4, fill: PANEL2, stroke: LINE, 'stroke-width': 3 }, G);
  sv('line', { x1: 180, y1: 586, x2: 532, y2: 586, stroke: '#33333a', 'stroke-width': 5, 'stroke-linecap': 'round' }, G);
  /* door (open: the cafe is open) and its sign */
  sv('rect', { x: 596, y: 320, width: 148, height: 340, fill: '#000', stroke: LINE, 'stroke-width': 3 }, G);
  sv('rect', { x: 612, y: 296, width: 116, height: 0, fill: 'none' }, G);
  const sign = sv('g', {}, G);
  sv('rect', { x: 620, y: 222, width: 100, height: 40, rx: 7, fill: 'none', stroke: '#FAFAFA', 'stroke-width': 3 }, sign);
  const tx = sv('text', { x: 670, y: 250, 'text-anchor': 'middle', fill: '#FAFAFA', 'font-family': 'Geist, sans-serif', 'font-weight': 800, 'font-size': 22, 'letter-spacing': '3' }, sign); tx.textContent = 'OPEN';
  /* clock: runs fast so the waiting is felt */
  sv('circle', { cx: 776, cy: 262, r: 25, fill: PANEL2, stroke: '#5c5c64', 'stroke-width': 4 }, G);
  const hh = sv('line', { x1: 776, y1: 262, x2: 776, y2: 248, stroke: '#8e8e96', 'stroke-width': 4, 'stroke-linecap': 'round' }, G);
  const mm = sv('line', { x1: 776, y1: 262, x2: 776, y2: 243, stroke: '#8e8e96', 'stroke-width': 3, 'stroke-linecap': 'round' }, G);
  const cs = s.clock ?? 1;
  tick(t => { const u = Math.max(0, t - s.at) * cs; hh.setAttribute('transform', `rotate(${(u * 90 + 40).toFixed(1)} 776 262)`); mm.setAttribute('transform', `rotate(${(u * 1080 + 200).toFixed(1)} 776 262)`); });
}
/* cafe_out: the street. The facade with its awning, a window over a stone ledge he can climb on, the
   open door, and a clock that runs fast while he waits. `passers` streams grey figures past. */
S.cafe_out = s => {
  const { st } = fgStage(s), { svg, L } = setSvg(st, s);
  drawFacade(L.back, s);
  const layers = { back: L.stools, mid: L.cast, front: L.front };
  if (s.passers) passers(layers, s, s.passers);
  (s.cast || []).forEach(a => actor(layers[a.layer || 'mid'], a, s));
};
/* phoneFx: a big phone showing a web page, at frame position (PX, PY) and scale PS, with everything that
   happens on it: a Citrus timer under the headline, a Citrus ring where the eye lands (`gaze`), taps on
   named parts of the page (`taps`), the back navigation (`back_at`) and the rewind look (`rewind`).
   Named parts: back, nav, hero, cols, foot, link (old site) and headline, stars, btn (new site).
   Returns the screen and `at(name)`, the frame position of a named part. Used by glance and pov. */
const PHONE_H = 1100;
function phoneFx(root, s, PX, PY, PS) {
  const rig = $('div', 'rig gl-rig', root); rig.style.cssText = `left:${PX}px;top:${PY}px;transform:scale(${PS});transform-origin:0 0`;
  const phone = $('div', 'phone', rig); $('div', 'island', phone);
  const glass = $('div', 'glass', phone), scr = $('div', 'screen gl-screen', glass);
  const bar = $('div', 'gl-bar', scr), back = $('b', '', bar, '‹'), url = $('span', '', bar, s.url || 'yourbusiness.com');
  SCR[(s.screen && s.screen.kind) || 'oldsite'](scr, s.screen || {}, s);
  const inner = scr.querySelector('.inner');
  if (s.screen && s.screen.zoom) inner.style.scale = s.screen.zoom;      // a desktop page on a phone: bigger than the screen, cut off at the right
  const T = { back, nav: '.old-nav', hero: '.old-hero, .site-hero', cols: '.old-cols', foot: '.old-foot', link: '.old-link', headline: '.site-h', stars: '.site-meta', btn: '.site-btn' };
  const sr = scr.getBoundingClientRect();
  const local = name => { const el = typeof T[name] === 'string' ? scr.querySelector(T[name]) : T[name]; if (!el) return [320, 600];
    const r = el.getBoundingClientRect(); return [(r.left + r.width / 2 - sr.left) / PS, (r.top + r.height / 2 - sr.top) / PS]; };
  const at = name => { const [x, y] = local(name); return [sr.left + x * PS, sr.top + y * PS]; };
  if (s.gaze) {
    const ring = $('div', 'gl-gaze', scr), keys = s.gaze.map(([t, n]) => [s.at + t, local(n)]);
    tick(t => {
      let k = 0; while (k < keys.length - 1 && t >= keys[k + 1][0]) k++;
      const [t0, p0] = keys[k], prev = keys[k - 1], u = prev ? smooth((t - t0) / 0.2) : 1, from = prev ? prev[1] : p0;
      ring.style.left = lerp(from[0], p0[0], u) + 'px'; ring.style.top = lerp(from[1], p0[1], u) + 'px';
      ring.style.display = t >= keys[0][0] - 1e-6 && (s.gaze_until == null || t < s.at + s.gaze_until) ? '' : 'none';
    });
    keys.slice(1).forEach(([t], i) => cue(t, 'tock', { i }));
  }
  (s.taps || []).forEach((q, i) => {
    const [x, y] = local(q.on), tp = s.at + q.t, d = $('div', 'gl-tap', scr);
    d.style.left = x + 'px'; d.style.top = y + 'px';
    A(d, { opacity: [0, 1, 1, 0], scale: [1.7, 1, 1, 1.3], offset: [0, .45, .7, 1] }, { at: tp - 0.26, dur: 0.6, ease: EASE.lin });
    cue(tp, 'tap', { i });
    if (q.press) { const btn = scr.querySelector(T[q.on]); if (btn) { classAt(btn, 'done', tp + 0.02); A(btn, { scale: [1, .95, 1] }, { at: tp, dur: .26 }); cue(tp + 0.08, 'ding', { i: 2 }); } }
  });
  if (s.back_at != null) {                                // the page slides away to the right and the address bar empties
    const tb = s.at + s.back_at;
    A(inner, { translate: ['0px 0px', '700px 0px'], opacity: [1, 0] }, { at: tb, dur: .28, ease: EASE.in });
    const res = $('div', 'gl-results', scr);                           // back on the results page: every other place, one tap away
    for (let k = 0; k < 4; k++) { const c = $('div', 'gl-res', res); $('i', '', c); $('u', '', c); $('u', 's', c); }
    showBetween(res, tb + 0.12); A(res, { translate: ['-80px 0px', '0px 0px'], opacity: [0, 1] }, { at: tb + 0.12, dur: .26 });
    [...res.children].forEach((c, k) => A(c, { opacity: [0, 1], translate: ['0 20px', '0 0'] }, { at: tb + 0.2 + k * 0.07, dur: .2 }));
    tick(t => { url.textContent = t >= tb + 0.2 ? '' : (s.url || 'yourbusiness.com'); });
    cue(tb, 'swish');
  }
  if (s.timer) {                                         // {from, to, t0, t1} counts; {hold, flicker} stands still and blinks
    const tm = $('div', 'gl-timer', root), q = s.timer, t0 = s.at + (q.t0 ?? 0), t1 = s.at + (q.t1 ?? s.dur), pre = s.rewind ? '◀◀ ' : '';
    tick(t => {
      const v = q.hold != null ? q.hold : lerp(q.from, q.to, clamp((t - t0) / Math.max(0.01, t1 - t0), 0, 1));
      tm.textContent = pre + (Math.round(v * 100) / 100).toFixed(2) + ' s';
      tm.style.opacity = q.flicker && Math.floor((t - s.at) / 0.3) % 2 ? 0.3 : 1;   // bright on the first frame (the cover)
    });
    if (q.hold == null) for (let k = 1; k <= 5; k++) cue(lerp(t0, t1, k / 5) - 0.01, 'tick', { i: k });
  }
  if (s.rewind) {
    const v = $('div', 'gl-vhs', root);
    tick(t => { v.style.transform = `translateY(${(Math.sin(t * 61) * 6).toFixed(1)}px)`; });
    A(rig, { translate: ['0px 0px', '0px -5px', '0px 4px', '0px 0px'] }, { at: s.at, dur: 0.24, iter: Math.ceil(s.dur / 0.24) });
    cue(s.at + 0.02, 'suck'); cue(s.at + 0.1, 'scroll', { dur: s.dur - 0.2 });
  }
  return { scr, at, w: 640 * PS, h: PHONE_H * PS };
}
/* glance: a figure on the left holds a phone; a dashed zoom callout leads to the same screen, large. */
S.glance = s => {
  const { root, st } = fgStage(s);
  const svg = sv('svg', { viewBox: '0 0 960 720', width: 960, height: 720, class: 'cf-set gl-set' }, st);
  sv('line', { x1: -1000, y1: FLOOR, x2: 2000, y2: FLOOR, stroke: LINE, 'stroke-width': 3 }, svg);
  const callout = sv('g', {}, svg), layer = sv('g', {}, svg);
  const cl = [0, 1].map(() => sv('line', { stroke: '#3a3a42', 'stroke-width': 3, 'stroke-dasharray': '8 8' }, callout));
  const PX = s.px ?? 430, PY = s.py ?? 520, PS = s.ps ?? 0.6;
  phoneFx(root, s, PX, PY, PS);
  const acts = (s.cast || []).map(a => ({ a, h: actor(layer, a, s) })), holder = acts.find(x => x.a.phone);
  const bx = PX - 60, byT = PY - 560 + 60, byB = PY - 560 + PHONE_H * PS - 60;
  tick(t => {
    if (!holder || s.callout === false) { cl.forEach(l => l.style.display = 'none'); return; }
    const p = holder.h.poseAt(t), off = holder.a.phone_off_at != null && t >= s.at + holder.a.phone_off_at;
    const w = 21 * p.sc, h = 37 * p.sc, x = p.hands[0][0] - w / 2 + p.d * 3 * p.sc + w, y = p.hands[0][1] - h * 0.72, show = p.op > 0.5 && !off && p.d > 0;
    [[y, byT], [y + h, byB]].forEach(([y0, y1], i) => { const l = cl[i]; l.style.display = show ? '' : 'none';
      l.setAttribute('x1', x.toFixed(1)); l.setAttribute('y1', y0.toFixed(1)); l.setAttribute('x2', bx); l.setAttribute('y2', y1); });
  });
};
/* pov: through his eyes. The phone fills the middle of the frame, his two forearms come up from the
   bottom edge to hold it, and his eyelids open and close over everything (`lids`: [[t, openness 0…1], …],
   1 = wide open). The thumb (right forearm) reaches for each tap. `hands` is an INK name; `hands_to` and
   `hands_at` change it, e.g. grey to lime the moment he books. */
S.pov = s => {
  const { root } = fgStage(s);
  const PS = s.ps ?? (LAND ? 0.58 : 0.55), PW = 640 * PS, PH = PHONE_H * PS;   // sized to sit inside the two eyes
  const PX = Math.round((FW - PW) / 2), PY = s.py ?? (LAND ? 320 : 650);
  /* what is behind the phone: the cafe he is standing in front of, out of focus. It also makes the two
     eye openings visible, since inside them is not as dark as outside. */
  const bg = $('div', 'pov-bg', root), bsv = sv('svg', { width: FW, height: FH, viewBox: LAND ? '-70 53 1100 619' : '275 -251 560 996', preserveAspectRatio: 'xMidYMid slice' }, bg);
  drawFacade(sv('g', {}, bsv), s);
  const ph = phoneFx(root, s, PX, PY, PS);
  /* forearms, drawn over the phone's edges */
  const hs = $('div', 'pov-hands', root);
  const svg = sv('svg', { width: FW, height: FH, viewBox: `0 0 ${FW} ${FH}` }, hs);
  const ink = INK[s.hands || 'visitor'], inkTo = s.hands_to ? INK[s.hands_to] : null, th = s.at + (s.hands_at ?? 0);
  const sw = LAND ? 30 : 38, restY = PY + PH * 0.64;
  const armL = sv('path', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': sw }, svg);
  const armR = sv('path', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': sw }, svg);
  const baseL = [PX - (LAND ? 260 : 170), FH + 60], baseR = [PX + PW + (LAND ? 260 : 170), FH + 60];
  const restL = [PX + 6, restY], restR = [PX + PW - 6, restY];
  const reach = (s.taps || []).map(q => ({ t: s.at + q.t, to: ph.at(q.on) }));
  tick(t => {
    let hand = restR;
    reach.forEach(r => { const u = t < r.t ? smooth((t - (r.t - 0.24)) / 0.24) : 1 - smooth((t - (r.t + 0.12)) / 0.26); if (u > 0) hand = [lerp(restR[0], r.to[0] + 26, u), lerp(restR[1], r.to[1] + 30, u)]; });
    const elbow = (b, h, out) => [lerp(b[0], h[0], 0.55) + out, lerp(b[1], h[1], 0.55) + 30];
    const eL = elbow(baseL, restL, -40), eR = elbow(baseR, hand, 40);
    armL.setAttribute('d', `M${baseL[0]} ${baseL[1]}Q${eL[0]} ${eL[1]} ${restL[0]} ${restL[1]}`);
    armR.setAttribute('d', `M${baseR[0]} ${baseR[1]}Q${eR[0]} ${eR[1]} ${hand[0].toFixed(1)} ${hand[1].toFixed(1)}`);
    const k = inkTo && t >= th ? inkTo : ink; armL.setAttribute('stroke', k[1]); armR.setAttribute('stroke', k[0]);
  });
  if (inkTo) { cue(th, 'pop', { i: 4 }); ANIM(hs, { opacity: [1, 0.4, 1] }, { at: th - 0.02, dur: 0.18, ease: EASE.lin }); }
  /* through his eyes: everything outside two round openings is black. Blinking squeezes both openings
     to a line (`lids`: [[t, openness 0…1], …], 1 = wide open). */
  const R = LAND ? 380 : 300, EX = LAND ? 300 : 222, EY = LAND ? 640 : 950;   // both eyes whole inside the frame
  const mk = $('div', 'pov-eyes', root), msv = sv('svg', { width: FW, height: FH, viewBox: `0 0 ${FW} ${FH}` }, mk);
  const mid = 'eyes' + s.i, defs = sv('defs', {}, msv), mask = sv('mask', { id: mid }, defs);
  const blur = sv('filter', { id: mid + 'b', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
  sv('feGaussianBlur', { stdDeviation: LAND ? 12 : 14 }, blur);                    // a soft edge, and one outline for both eyes together
  sv('rect', { x: 0, y: 0, width: FW, height: FH, fill: '#fff' }, mask);
  const holes = [-1, 1].map(k => sv('ellipse', { cx: FW / 2 + k * EX, cy: EY, rx: R, ry: R, fill: '#000', filter: `url(#${mid}b)` }, mask));
  sv('rect', { x: 0, y: 0, width: FW, height: FH, fill: '#000', mask: `url(#${mid})` }, msv);
  const keys = (s.lids || [[0, 1]]).map(([t, o]) => [s.at + t, o]);
  tick(t => {
    let o = keys[0][1];
    for (let k = 0; k < keys.length; k++) { const [kt, ko] = keys[k], nx = keys[k + 1]; if (t >= kt) o = nx && t < nx[0] ? lerp(ko, nx[1], smooth((t - kt) / (nx[0] - kt))) : ko; }
    const ry = Math.max(0.01, R * o).toFixed(1);
    holes.forEach(h => { h.setAttribute('ry', ry); h.style.display = o > 0.02 ? '' : 'none'; });
  });
  keys.forEach(([t, o], i) => { if (i && o < 0.2 && keys[i - 1][1] > 0.5) cue(t - 0.05, 'suck', { i }); });
};
/* behind: the street, seen from behind the visitor. He stands big in the foreground with his back to us,
   facing his own cafe and looking at his phone (a glow around his head). `cam`: [[t, zoom], …] pushes the
   camera into his head (zoom ≈ 36 fills the frame with it) or pulls it out again; `black`: [[t, opacity], …]
   fades to or from black; `walk` takes him into the door, `enter_at` through it. */
function backFig(G, f, s) {
  const ink = INK[f.ink || 'visitor'], inkTo = f.ink_to ? INK[f.ink_to] : null;
  const defs = sv('defs', {}, G), gid = 'pglow' + s.i, rg = sv('radialGradient', { id: gid }, defs);
  sv('stop', { offset: '0', 'stop-color': '#e9ecff', 'stop-opacity': '.55' }, rg); sv('stop', { offset: '1', 'stop-color': '#e9ecff', 'stop-opacity': '0' }, rg);
  const g = sv('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, G);
  const glow = sv('ellipse', { fill: `url(#${gid})` }, g);
  const fore = [0, 1].map(() => sv('path', {}, g)), legs = [0, 1].map(() => sv('path', {}, g));
  const torso = sv('path', {}, g), upper = [0, 1].map(() => sv('path', {}, g)), head = sv('circle', {}, g);
  const W0 = f.walk, tw0 = W0 ? s.at + W0.at : Infinity, tw1 = W0 ? tw0 + W0.dur : Infinity, te = f.enter_at != null ? s.at + f.enter_at : Infinity;
  if (W0) for (let t = tw0; t < tw1 - 0.05; t += (W0.cycle ?? 0.5) / 2) cue(t, 'foot');
  if (te < Infinity) cue(te + 0.02, 'doorbell');
  const pos = t => {
    if (!W0 || t < tw0) return { x: f.x, g: f.g, sc: f.sc, u: 0 };
    const u = clamp((t - tw0) / W0.dur, 0, 1), e = u;                    // steady pace into the door
    return { x: lerp(f.x, W0.to[0], e), g: lerp(f.g, W0.to[1], e), sc: lerp(f.sc, W0.sc_to ?? f.sc, e), u };
  };
  const draw = t => {
    const p = pos(t), sc = p.sc, walking = W0 && t >= tw0, cyc = W0 ? (W0.cycle ?? 0.5) : 1, ph = walking ? (t - tw0) / cyc : 0;
    const lift = walking ? 16 * sc : 0, lL = Math.max(0, Math.sin(2 * Math.PI * ph)) * lift, lR = Math.max(0, -Math.sin(2 * Math.PI * ph)) * lift;
    const br = Math.sin(t * 2.3) * 1.2 * sc, hx = p.x, hy = p.g - 82 * sc + (walking ? -Math.abs(Math.cos(2 * Math.PI * ph)) * 3 * sc : br * 0.3);
    const sy = hy - 58 * sc + br, ty = hy - 80 * sc, cy = hy - 103 * sc, r = 21 * sc;
    const holding = !walking || (t - tw0) < 0.12;
    const k = inkTo && t >= s.at + (f.ink_at ?? 0) ? inkTo : ink;
    const S = (el, d, c, w) => { el.setAttribute('d', d); el.setAttribute('stroke', c); el.setAttribute('stroke-width', (w * sc).toFixed(2)); };
    [[-1, lL], [1, lR]].forEach(([side, lf], i) => {                // legs: the stepping foot rises and lands a little further in
      const fx = hx + side * 12 * sc, fy = p.g - lf, kx = hx + side * 9 * sc, ky = (hy + fy) / 2 - lf * 0.3;
      S(legs[i], `M${hx} ${hy}L${kx} ${ky}L${fx} ${fy}`, k[0], 10.5);
    });
    [-1, 1].forEach((side, i) => {
      if (holding) {                                       // elbows out, forearms forward to the phone in front of him (hidden by the body)
        const ex = hx + side * 25 * sc, ey = sy + 26 * sc, scroll = side > 0 ? Math.max(0, Math.sin(t * 7.5)) * 4 * sc : 0;   // his thumb keeps scrolling
        S(upper[i], `M${hx} ${sy}L${ex} ${ey + scroll * 0.4}`, k[0], 10.5); S(fore[i], `M${ex} ${ey + scroll * 0.4}L${hx + side * 8 * sc} ${sy + 8 * sc - scroll}`, k[1], 10.5);
      } else {                                             // walking: arms down, swinging
        const sw = Math.sin(2 * Math.PI * ph) * side * 6 * sc, ex = hx + side * 15 * sc, ey = sy + 25 * sc;
        S(upper[i], `M${hx} ${sy}L${ex} ${ey}`, k[0], 10.5); S(fore[i], `M${ex} ${ey}L${hx + side * 18 * sc + sw} ${sy + 50 * sc}`, k[0], 10.5);
      }
    });
    S(torso, `M${hx} ${hy}L${hx} ${ty + r * 0.2}`, k[0], 10.5);
    head.setAttribute('cx', hx); head.setAttribute('cy', cy.toFixed(1)); head.setAttribute('r', r.toFixed(1)); head.setAttribute('fill', k[0]);
    glow.setAttribute('cx', hx); glow.setAttribute('cy', (cy + 14 * sc).toFixed(1)); glow.setAttribute('rx', (46 * sc).toFixed(1)); glow.setAttribute('ry', (36 * sc).toFixed(1));
    glow.style.display = holding && !(f.glow === false) ? '' : 'none'; glow.setAttribute('opacity', (0.82 + Math.sin(t * 7.5) * 0.12).toFixed(3));
    g.setAttribute('opacity', t < te ? 1 : (1 - easeOut((t - te) / 0.3)).toFixed(3));
    return { x: hx, y: cy };
  };
  let last = { x: f.x, y: f.g - 103 * f.sc };
  tick(t => { if (t >= s.at - 1e-6 && t < s.at + s.dur) last = draw(t); });
  return { headAt: t => { const p = pos(t); return { x: p.x, y: p.g - (82 + 103) * p.sc }; } };   // hip height + head above hip
}
S.behind = s => {
  const { root, st } = fgStage(s);
  const svg = sv('svg', { viewBox: '0 0 960 720', width: 960, height: 720, class: 'cf-set gl-set' }, st);
  const cam = sv('g', {}, svg), back = sv('g', {}, cam), mid = sv('g', {}, cam), front = sv('g', {}, cam);
  drawFacade(back, s);
  if (s.passers) passers({ back: mid, mid, front: mid }, s, s.passers);
  (s.cast || []).forEach(a => actor(mid, a, s));
  const fig = backFig(front, s.figure, s);
  /* camera: zoom about his head; as the zoom grows the head is also brought to the centre of the frame */
  const ck = (s.cam || [[0, 1]]).map(([t, z]) => [s.at + t, z]), C = [FW / 2 - (LAND ? 480 : 60), FH / 2 - (LAND ? 300 : 560)];
  tick(t => {
    let z = ck[0][1];
    for (let k = 0; k < ck.length; k++) { const [kt, kz] = ck[k], nx = ck[k + 1]; if (t >= kt) z = nx && t < nx[0] ? Math.exp(lerp(Math.log(kz), Math.log(nx[1]), smooth((t - kt) / (nx[0] - kt)))) : kz; }
    const h = fig.headAt(t), w = clamp((z - 1) / 3, 0, 1), qx = lerp(h.x, C[0], w), qy = lerp(h.y, C[1], w);
    cam.setAttribute('transform', `translate(${(qx - z * h.x).toFixed(2)} ${(qy - z * h.y).toFixed(2)}) scale(${z.toFixed(4)})`);
  });
  ck.forEach(([t, z], i) => { const nx = ck[i + 1]; if (nx && nx[1] > z * 4) cue(t + 0.05, 'whoosh', { i }); if (nx && z > nx[1] * 4) cue(t, 'whoosh', { i }); });
  const head = root.querySelector('.fg-head');
  if (head && s.head_out_at != null) A(head, { opacity: [1, 0] }, { at: s.at + s.head_out_at, dur: 0.2, ease: EASE.lin });
  if (head && s.head_in_at != null) A(head, { opacity: [0, 1] }, { at: s.at + s.head_in_at, dur: 0.2, ease: EASE.lin });
  if (s.black) {
    const bl = $('div', 'pov-black', root), bk = s.black.map(([t, o]) => [s.at + t, o]);
    tick(t => { let o = bk[0][1]; for (let k = 0; k < bk.length; k++) { const [kt, ko] = bk[k], nx = bk[k + 1]; if (t >= kt) o = nx && t < nx[0] ? lerp(ko, nx[1], (t - kt) / (nx[0] - kt)) : ko; } bl.style.opacity = o.toFixed(3); });
  }
};
/* map: the neighbourhood. Every other place is on it; his is the one pin that is not lit.
   `light_at` turns his pin on. */
S.map = s => {
  const { st } = fgStage(s);
  const card = $('div', 'mp-card', st), r = rng(s.seed ?? 11);
  const MX = 450, MY = 310;                              // centre of the card: his own pin never moves
  const others = [];
  const spots = [[-330,-170],[-190,-210],[-40,-180],[120,-200],[280,-140],[-350,10],[-200,-50],[170,-40],[320,20],[-310,150],[-150,130],[30,170],[190,140],[330,180],[-70,-70],[240,-80]];
  spots.forEach((p, i) => {
    const pin = $('div', 'mp-pin', card);
    pin.style.left = (MX + p[0]) + 'px'; pin.style.top = (MY + p[1]) + 'px';
    const a = s.at + (s.lead ?? 0.2) + i * (s.step ?? 0.075);
    if (s.others !== 'on') { classAt(pin, 'on', a); A(pin, { scale: [0, 1] }, { at: a, dur: .22, ease: EASE.back }); if (i % 4 === 0) cue(a, 'tick', { i }); }
    else pin.classList.add('on');
    others.push(pin);
  });
  if (s.dim_others) { const td = s.at + s.dim_others; others.forEach(p => A(p, { opacity: [1, .12] }, { at: td, dur: .4 })); cue(td, 'suck'); }
  const mine = $('div', 'mp-mine', card);
  mine.style.left = MX + 'px'; mine.style.top = MY + 'px';
  if (s.at > 0) A(mine, { scale: [0, 1] }, { at: s.at + 0.1, dur: .3, ease: EASE.back });
  const tl = s.light_at != null ? s.at + s.light_at : Infinity;
  if (tl < Infinity) {
    classAt(mine, 'on', tl);
    A(mine, { scale: [1, 1.4, 1] }, { at: tl, dur: .44, ease: EASE.back });
    const ring = $('div', 'mp-ring', card); ring.style.left = MX + 'px'; ring.style.top = MY + 'px';
    showBetween(ring, tl, tl + 0.7); A(ring, { scale: [.4, 3.4], opacity: [.9, 0] }, { at: tl, dur: .7 });
    const ring2 = $('div', 'mp-ring', card); ring2.style.left = MX + 'px'; ring2.style.top = MY + 'px';
    showBetween(ring2, tl + 0.2, tl + 0.9); A(ring2, { scale: [.4, 3.4], opacity: [.7, 0] }, { at: tl + 0.2, dur: .7 });
    cue(tl, 'ding', { i: 3 });
    others.forEach((p, i) => A(p, { opacity: [.12, .85] }, { at: tl + 0.1 + i * 0.03, dur: .3 }));  // the map comes back to life around him
  }
};

/* ------------------------------------------------------------------ build */
for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i];
  if (s.type === 'phone') { const run = [s]; while (scenes[i + 1] && scenes[i + 1].type === 'phone' && !scenes[i + 1].new_phone) run.push(scenes[++i]); phoneRun(run); }
  else if (S[s.type]) { S[s.type](s); if (s.at > 0 && !['flash', 'offer', 'end', 'bignum', 'slam', 'chaos', 'statement', 'blurtype', 'cut', 'button', 'merge', 'count', 'dial', 'listings', 'receipt', 'landing', 'cafe_in', 'cafe_out', 'map', 'glance', 'pov', 'behind'].includes(s.type)) cue(s.at, 'swish'); }
  else console.error('unknown scene type', s.type);
}
/* The technical HUD is opt-in ("hud": true). Its counters change on every frame in all four corners,
   which pulls the eye away from the text, and its top-left tag reads as a corner label. */
if (SPEC.hud === true) {
  const hud = $('div', 'hud', stage); ['tl', 'tr', 'bl', 'br'].forEach(c => $('i', c, hud));
  const a = $('span', '', hud), b = $('span', '', hud), c = $('span', '', hud), d = $('span', '', hud);
  a.style.cssText = 'left:78px;top:152px'; b.style.cssText = 'right:78px;top:152px'; c.style.cssText = 'left:78px;bottom:332px'; d.style.cssText = 'right:78px;bottom:332px';
  const p2 = n => String(n).padStart(2, '0');
  tick(t => {
    const cur = scenes.filter(s => t >= s.at).pop() || scenes[0], f = Math.round(t * 30);
    a.textContent = p2(cur.i + 1) + ' ' + (cur.tag || cur.type);
    b.textContent = `00:${p2(Math.floor(t))}:${p2(f % 30)}`;
    c.textContent = 'f ' + String(f).padStart(4, '0');
    d.textContent = `x ${String(540 + Math.round(Math.sin(t * 1.7) * 220)).padStart(4, '0')}  y ${String(960 + Math.round(Math.cos(t * 1.1) * 340)).padStart(4, '0')}`;
  });
}

const turn = scenes.find(s => s.turn), endScene = scenes.find(s => s.type === 'end');
window.__meta = { duration: DUR, drop: (SPEC.audio && SPEC.audio.drop_at) ?? (turn ? turn.at + (turn.turn_at || 0) : DUR * 0.45), end: endScene ? endScene.at : DUR - 2,
  says: (() => { const out = []; scenes.forEach(s => { if (s.say) out.push({ t: s.at + (s.say_at ?? 0.15), text: s.say, until: s.at + s.dur }); (s.says || []).forEach(x => out.push({ t: s.at + x.t, text: x.text, until: s.at + s.dur })); });
    out.sort((x, y) => x.t - y.t); out.forEach((o, i) => { if (out[i + 1]) o.until = Math.min(Math.max(o.until, o.t + 0.5), out[i + 1].t - 0.05); else o.until = DUR - 0.1; }); return out; })() };
window.__events = TL.events.sort((x, y) => x.t - y.t);
window.seek = t => { TL.anims.forEach(a => { a.currentTime = t * 1000; }); TL.ticks.forEach(f => f(t)); };
window.seek(0);
window.__ready = true;
})().catch(e => { console.error(e); window.__error = String(e && e.stack || e); });
