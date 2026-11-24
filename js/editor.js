import { FONTS, LINKS, IDENTITY, PRESETS, DEFAULT_STYLE, newCard, normalizeCard, renderCard, icon, esc, slugify, encodeHash, loadFonts, fullName } from './render.js';
import * as gh from './github.js';
import { qrCanvas } from './qr.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Pont natif exposé par l'APK Android (absent dans un navigateur).
const native = window.CarteNFC || null;

// ---------- Stockage local ----------
const LS = { cards: 'cnfc.cards', cur: 'cnfc.current', gh: 'cnfc.github', tab: 'cnfc.tab' };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch { toast('Stockage plein : retire ou réduis des images.', 4000); return false; }
  },
};

let cards = {};
for (const raw of Object.values(store.get(LS.cards, {}) || {})) { const c = normalizeCard(raw); cards[c.id] = c; }
if (!Object.keys(cards).length) { const c = newCard(); cards[c.id] = c; }
let curId = store.get(LS.cur, null);
if (!cards[curId]) curId = Object.keys(cards)[0];
let ghCfg = { ...gh.guess(), ...store.get(LS.gh, {}) };
const card = () => cards[curId];
const isDesktop = matchMedia('(min-width: 960px)');

let saveT;
function persist() {
  clearTimeout(saveT);
  saveT = setTimeout(() => { store.set(LS.cards, cards); store.set(LS.cur, curId); }, 250);
}
function changed() { card().updated = Date.now(); schedRender(); persist(); }

let toastT;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), ms);
}

function download(blob, name) {
  if (native) {
    const reader = new FileReader();
    reader.onload = () => toast(native.saveFile(name, blob.type || 'application/octet-stream', String(reader.result).split(',')[1]), 4000);
    reader.readAsDataURL(blob);
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ---------- Aperçu ----------
let raf = 0;
function schedRender() { cancelAnimationFrame(raf); raf = requestAnimationFrame(renderPreview); }
function renderPreview() {
  $('#preview').innerHTML = renderCard(card());
  document.documentElement.style.setProperty('--page-bg', card().style.pageBg);
}
$('#preview').addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); });

// ---------- Onglets ----------
function setTab(t) {
  if (t === 'preview' && isDesktop.matches) t = 'infos';
  document.body.dataset.tab = t;
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  try { sessionStorage.setItem(LS.tab, t); } catch { /* ignore */ }
  if (t === 'design') { loadFonts(Object.keys(FONTS)); buildDesign(); }
  if (t === 'share') renderShare();
  window.scrollTo(0, 0);
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) setTab(b.dataset.t); });
isDesktop.addEventListener('change', () => setTab(document.body.dataset.tab));

// ---------- Gestion des cartes ----------
const labelOf = c => { const n = fullName(c.fields); return n ? `${n} (${c.id})` : c.id; };
function renderSelect() {
  $('#cardSelect').innerHTML = Object.values(cards)
    .map(c => `<option value="${esc(c.id)}"${c.id === curId ? ' selected' : ''}>${esc(labelOf(c))}</option>`).join('');
}
function uniqueId(base) {
  const b = slugify(base) || 'carte';
  let id = b, i = 2;
  while (cards[id]) id = `${b}-${i++}`;
  return id;
}
function renderAll() {
  renderSelect();
  buildInfos();
  buildDesign();
  renderPreview();
  if (document.body.dataset.tab === 'share') renderShare();
}
function switchTo(id) { curId = id; persist(); renderAll(); }

$('#cardSelect').addEventListener('change', e => switchTo(e.target.value));
$('#btnNew').addEventListener('click', () => {
  const c = newCard(uniqueId('carte'));
  c.style = { ...card().style };
  cards[c.id] = c;
  switchTo(c.id);
  setTab('infos');
  toast('Nouvelle carte créée (même design que la précédente)');
});

const menu = $('#menu');
document.addEventListener('click', e => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
const actions = {
  dup() {
    const c = normalizeCard(JSON.parse(JSON.stringify(card())));
    c.id = uniqueId(card().id + '-copie');
    c.publishedAt = null;
    cards[c.id] = c;
    switchTo(c.id);
    toast('Carte dupliquée');
  },
  del() {
    if (Object.keys(cards).length === 1) return toast('Il faut garder au moins une carte');
    if (!confirm(`Supprimer « ${labelOf(card())} » de ce téléphone ?\nLa version déjà publiée reste en ligne.`)) return;
    delete cards[curId];
    switchTo(Object.keys(cards)[0]);
  },
  export() {
    const data = JSON.stringify({ app: 'carte-nfc', v: 1, cards: Object.values(cards) });
    download(new Blob([data], { type: 'application/json' }), `cartes-nfc-${new Date().toISOString().slice(0, 10)}.json`);
  },
  import() { $('#importFile').click(); },
};
menu.addEventListener('click', e => {
  const a = e.target.closest('[data-act]')?.dataset.act;
  if (!a) return;
  menu.open = false;
  actions[a]();
});
$('#importFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : (data.cards || [data]);
    let n = 0, last = null;
    for (const raw of list) {
      const c = normalizeCard(raw);
      if (cards[c.id] && !confirm(`La carte « ${c.id} » existe déjà. La remplacer ?`)) continue;
      cards[c.id] = c; last = c.id; n++;
    }
    if (last) curId = last;
    persist();
    renderAll();
    toast(`${n} carte(s) importée(s)`);
  } catch { toast('Fichier de sauvegarde invalide'); }
});

// ---------- Onglet Infos ----------
function field(k, label, { ph = '', mode = '', multi = false } = {}) {
  const v = esc(card().fields[k] || '');
  const im = mode ? ` inputmode="${mode}"` : '';
  const ac = mode === 'url' || mode === 'email' ? ' autocapitalize="none" spellcheck="false"' : '';
  return multi
    ? `<label class="fld"><span>${label}</span><textarea data-f="${k}" rows="3" placeholder="${esc(ph)}">${v}</textarea></label>`
    : `<label class="fld"><span>${label}</span><input type="text" data-f="${k}" value="${v}" placeholder="${esc(ph)}" autocomplete="off"${im}${ac}></label>`;
}
function buildInfos() {
  $('#infos').innerHTML =
    '<h2>Identité</h2>' +
    IDENTITY.map(i => field(i.k, i.label, { multi: i.multi, ph: i.multi ? 'Une phrase qui résume ce que tu fais' : '' })).join('') +
    '<h2>Coordonnées et réseaux</h2><p class="hint">Les champs vides n\'apparaissent pas sur la carte. L\'ordre se règle dans Design.</p>' +
    LINKS.map(l => (l.k === 'custom' ? field('customLabel', 'Nom du lien perso', { ph: 'Portfolio, prise de RDV...' }) : '') +
      field(l.k, l.label, { ph: l.ph, mode: l.mode })).join('');
}
$('#infos').addEventListener('input', e => {
  const k = e.target.dataset.f;
  if (!k) return;
  card().fields[k] = e.target.value;
  changed();
  if (k === 'firstName' || k === 'lastName') renderSelect();
});

// ---------- Onglet Design ----------
const seg = (k, l, o, extra = {}) => ({ k, l, type: 'seg', o, ...extra });
const range = (k, l, min, max, step = 1, u = '', extra = {}) => ({ k, l, type: 'range', min, max, step, u, ...extra });
const color = (k, l, extra = {}) => ({ k, l, type: 'color', ...extra });
const toggle = (k, l, extra = {}) => ({ k, l, type: 'toggle', ...extra });
const usesBanner = s => s.layout === 'banner';

const SECTIONS = [
  { id: 'themes', t: 'Thèmes prêts à l\'emploi', open: true, html: presetsHtml },
  { id: 'layout', t: 'Disposition', c: [
    seg('layout', 'Mise en page', [['classic', 'Classique'], ['stacked', 'Empilée'], ['banner', 'Bannière'], ['block', 'Bloc'], ['bold', 'Affiche'], ['minimal', 'Minimal']]),
    seg('align', 'Alignement', [['left', 'Gauche'], ['center', 'Centre'], ['right', 'Droite']]),
    seg('density', 'Espacement', [['compact', 'Serré'], ['normal', 'Normal'], ['airy', 'Aéré']]),
    range('radius', 'Arrondi de la carte', 0, 44, 1, 'px'),
    seg('shadow', 'Ombre', [[0, 'Aucune'], [1, 'Légère'], [2, 'Moyenne'], [3, 'Forte']]),
  ] },
  { id: 'logo', t: 'Logo / photo', c: [
    { k: 'logo', l: 'Image', type: 'image', max: 420 },
    seg('logoShape', 'Forme', [['circle', 'Rond'], ['rounded', 'Arrondi'], ['square', 'Carré'], ['hexagon', 'Hexagone'], ['free', 'Libre'], ['none', 'Aucun']]),
    range('logoSize', 'Taille', 40, 180, 1, 'px', { when: s => s.logoShape !== 'none' }),
    toggle('logoRing', 'Contour couleur d\'accent', { when: s => ['circle', 'rounded', 'square'].includes(s.logoShape) }),
    toggle('logoPad', 'Fond derrière le logo (pour un logo transparent)', { when: s => !['none', 'free'].includes(s.logoShape) }),
    color('logoBg', 'Couleur du fond du logo', { when: s => s.logoPad && !['none', 'free'].includes(s.logoShape) }),
  ] },
  { id: 'bg', t: 'Fond et bannière', c: [
    seg('bgType', 'Type de fond', [['solid', 'Uni'], ['gradient', 'Dégradé'], ['image', 'Image']]),
    color('bg', 'Couleur principale'),
    color('bg2', 'Seconde couleur', { when: s => s.bgType === 'gradient' || usesBanner(s) }),
    range('angle', 'Angle du dégradé', 0, 360, 5, '°', { when: s => s.bgType === 'gradient' || usesBanner(s) }),
    { k: 'cover', l: 'Image de fond / de bannière', type: 'image', max: 1100, when: s => s.bgType === 'image' || usesBanner(s) },
    range('coverHeight', 'Hauteur de la bannière', 60, 260, 2, 'px', { when: usesBanner }),
    range('overlay', 'Voile de couleur sur l\'image', 0, 0.9, 0.05, '%', { when: s => s.bgType === 'image' }),
    seg('pattern', 'Motif', [['none', 'Aucun'], ['dots', 'Points'], ['grid', 'Grille'], ['lines', 'Rayures'], ['bubbles', 'Bulles']]),
    range('patternOpacity', 'Intensité du motif', 0.02, 0.4, 0.01, '%', { when: s => s.pattern !== 'none' }),
    color('pageBg', 'Couleur autour de la carte'),
  ] },
  { id: 'colors', t: 'Couleurs du texte', c: [
    color('text', 'Texte principal'),
    color('muted', 'Texte secondaire'),
    color('accent', 'Couleur d\'accent'),
    color('onAccent', 'Texte posé sur l\'accent'),
  ] },
  { id: 'type', t: 'Typographie', c: [
    { k: 'fontHead', l: 'Police du nom', type: 'font' },
    { k: 'fontBody', l: 'Police du texte', type: 'font' },
    range('nameSize', 'Taille du nom', 16, 60, 1, 'px'),
    seg('nameWeight', 'Graisse du nom', [[400, 'Normal'], [500, 'Medium'], [600, 'Semi'], [700, 'Gras'], [800, 'Extra']]),
    toggle('nameUpper', 'Nom en majuscules'),
    range('baseSize', 'Taille du texte', 12, 20, 1, 'px'),
  ] },
  { id: 'buttons', t: 'Liens et boutons', c: [
    seg('linkStyle', 'Présentation', [['list', 'Liste'], ['tiles', 'Tuiles'], ['icons', 'Icônes'], ['text', 'Texte']]),
    seg('btnStyle', 'Style', [['filled', 'Plein'], ['soft', 'Doux'], ['outline', 'Contour'], ['ghost', 'Discret']]),
    range('btnRadius', 'Arrondi des boutons', 0, 30, 1, 'px'),
    toggle('showIcons', 'Afficher les icônes', { when: s => s.linkStyle !== 'icons' }),
    toggle('showLabels', 'Afficher les intitulés (Téléphone, Email...)', { when: s => s.linkStyle === 'list' || s.linkStyle === 'tiles' }),
  ] },
  { id: 'order', t: 'Ordre des liens', html: orderHtml },
];
const CTRLS = SECTIONS.flatMap(s => s.c || []);

function presetsHtml() {
  return '<div class="presets">' + PRESETS.map(p => {
    const bg = p.s.bgType === 'gradient' ? `linear-gradient(135deg,${p.s.bg},${p.s.bg2})` : p.s.bg;
    return `<button type="button" class="preset" data-preset="${p.id}" style="font-family:'${p.s.fontHead}'"><span class="sw" style="background:${bg}"><i style="background:${p.s.accent}"></i></span>${esc(p.name)}</button>`;
  }).join('') + '</div><p class="hint" style="margin-top:10px">Un thème change les couleurs et les polices. Tout reste modifiable ensuite.</p>';
}

function orderHtml() {
  const c = card();
  return '<p class="hint">Les liens grisés sont vides et n\'apparaissent pas.</p><ol class="order">' + c.order.map((k, i) => {
    const l = LINKS.find(x => x.k === k);
    const name = k === 'custom' ? (c.fields.customLabel || '').trim() || l.label : l.label;
    const has = !!(c.fields[k] || '').trim();
    return `<li class="${has ? '' : 'empty'}">${icon(l.icon)}<span class="on">${esc(name)}</span>` +
      `<button type="button" data-mv="${i}" data-d="-1"${i === 0 ? ' disabled' : ''} aria-label="Monter">${icon('up')}</button>` +
      `<button type="button" data-mv="${i}" data-d="1"${i === c.order.length - 1 ? ' disabled' : ''} aria-label="Descendre">${icon('down')}</button></li>`;
  }).join('') + '</ol>';
}

const fmt = (x, v) => (x.u === '%' ? Math.round(v * 100) + '%' : v + x.u);

function ctrlHtml(x) {
  const s = card().style;
  const v = x.type === 'image' ? card()[x.k] : s[x.k];
  let h = '';
  switch (x.type) {
    case 'seg':
      h = `<div class="fld"><span>${x.l}</span><div class="seg" data-k="${x.k}">` +
        x.o.map(([ov, ol]) => `<button type="button" data-v="${ov}" class="${String(v) === String(ov) ? 'on' : ''}">${ol}</button>`).join('') + '</div></div>';
      break;
    case 'range':
      h = `<label class="fld"><span>${x.l}<output>${fmt(x, v)}</output></span><input type="range" data-k="${x.k}" min="${x.min}" max="${x.max}" step="${x.step}" value="${v}"></label>`;
      break;
    case 'color':
      h = `<div class="fld"><span>${x.l}</span><div class="cin"><input type="color" data-k="${x.k}" value="${v}" aria-label="${x.l}"><input type="text" data-hex="${x.k}" value="${v}" maxlength="7" autocapitalize="none" spellcheck="false"></div></div>`;
      break;
    case 'toggle':
      h = `<label class="tgl"><input type="checkbox" data-k="${x.k}"${v ? ' checked' : ''}><span>${x.l}</span></label>`;
      break;
    case 'font':
      h = `<label class="fld"><span>${x.l}</span><select data-k="${x.k}" style="font-family:'${v}'">` +
        Object.keys(FONTS).map(n => `<option value="${n}"${n === v ? ' selected' : ''} style="font-family:'${n}'">${n}</option>`).join('') + '</select></label>';
      break;
    case 'image':
      h = `<div class="fld"><span>${x.l}</span><div class="img-up"><div class="thumb">${v ? `<img src="${v}" alt="">` : 'Aucune'}</div>` +
        `<label class="btn sm">Choisir une image<input type="file" accept="image/*" data-img="${x.k}" data-max="${x.max}" hidden></label>` +
        (v ? `<button type="button" class="btn sm ghost" data-imgdel="${x.k}">Retirer</button>` : '') + '</div></div>';
      break;
  }
  return `<div class="ctl" data-ctl="${x.k}">${h}</div>`;
}

function buildDesign() {
  const panel = $('#design');
  const opened = new Set($$('details[data-sec]', panel).filter(d => d.open).map(d => d.dataset.sec));
  const first = !panel.children.length;
  panel.innerHTML = SECTIONS.map(sec => {
    const open = first ? sec.open : opened.has(sec.id);
    const body = sec.html ? sec.html() : sec.c.map(ctrlHtml).join('');
    return `<details class="acc" data-sec="${sec.id}"${open ? ' open' : ''}><summary>${sec.t}</summary><div class="acc-body">${body}</div></details>`;
  }).join('');
  refreshWhen();
}

function refreshWhen() {
  const s = card().style;
  for (const x of CTRLS) if (x.when) $(`[data-ctl="${x.k}"]`, $('#design'))?.classList.toggle('hide', !x.when(s));
}

function setStyle(k, v) {
  const d = DEFAULT_STYLE[k];
  if (typeof d === 'number') v = Number(v);
  else if (typeof d === 'boolean') v = !!v;
  card().style[k] = v;
  changed();
  refreshWhen();
}

async function shrinkImage(file, max) {
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    let w = img.naturalWidth || 512, h = img.naturalHeight || 512;
    const r = Math.min(1, max / Math.max(w, h));
    w = Math.max(1, Math.round(w * r)); h = Math.max(1, Math.round(h * r));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(img, 0, 0, w, h);
    let out = cv.toDataURL('image/webp', 0.86);
    if (!out.startsWith('data:image/webp')) out = cv.toDataURL('image/png');
    return out;
  } finally { URL.revokeObjectURL(src); }
}

const design = $('#design');
design.addEventListener('click', e => {
  const b = e.target.closest('.seg button');
  if (b) {
    setStyle(b.parentElement.dataset.k, b.dataset.v);
    $$('button', b.parentElement).forEach(x => x.classList.toggle('on', x === b));
    return;
  }
  const p = e.target.closest('[data-preset]');
  if (p) {
    const preset = PRESETS.find(x => x.id === p.dataset.preset);
    Object.assign(card().style, preset.s);
    changed();
    buildDesign();
    toast(`Thème « ${preset.name} » appliqué`);
    return;
  }
  const mv = e.target.closest('[data-mv]');
  if (mv) {
    const o = card().order, i = +mv.dataset.mv, j = i + +mv.dataset.d;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    changed();
    buildDesign();
    return;
  }
  const del = e.target.closest('[data-imgdel]');
  if (del) { card()[del.dataset.imgdel] = null; changed(); buildDesign(); }
});
design.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.k && t.type === 'range') {
    setStyle(t.dataset.k, t.value);
    const x = CTRLS.find(c => c.k === t.dataset.k);
    t.closest('.fld').querySelector('output').textContent = fmt(x, card().style[t.dataset.k]);
  } else if (t.dataset.k && t.type === 'color') {
    setStyle(t.dataset.k, t.value);
    const hex = $(`[data-hex="${t.dataset.k}"]`, design);
    if (hex) hex.value = t.value;
  } else if (t.dataset.hex) {
    const v = t.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) {
      setStyle(t.dataset.hex, v.toLowerCase());
      $(`input[type=color][data-k="${t.dataset.hex}"]`, design).value = v.toLowerCase();
    }
  }
});
design.addEventListener('change', async e => {
  const t = e.target;
  if (t.type === 'checkbox' && t.dataset.k) setStyle(t.dataset.k, t.checked);
  else if (t.tagName === 'SELECT' && t.dataset.k) { setStyle(t.dataset.k, t.value); t.style.fontFamily = `'${t.value}'`; }
  else if (t.dataset.img) {
    const file = t.files[0];
    t.value = '';
    if (!file) return;
    try {
      card()[t.dataset.img] = await shrinkImage(file, +t.dataset.max || 600);
      if (t.dataset.img === 'logo' && card().style.logoShape === 'none') card().style.logoShape = 'circle';
      changed();
      buildDesign();
    } catch { toast('Image illisible'); }
  }
});

// ---------- Onglet Partager ----------
const publicUrl = (c = card()) => { const b = gh.baseUrl(ghCfg); return b ? `${b}c.html?c=${c.id}` : null; };
function testUrl(c = card()) {
  const u = new URL('c.html', gh.baseUrl(ghCfg) || location.href);
  u.search = '';
  u.hash = 'd=' + encodeHash(c);
  return u.href;
}
const fmtDate = ts => new Date(ts).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

let qrCv = null;
function drawQr(text, isTest) {
  const box = $('#qrBox');
  try {
    qrCv = qrCanvas(text);
    box.replaceChildren(qrCv);
    $('#qrNote').textContent = isTest ? 'QR du lien de test : configure GitHub pour un QR définitif.' : 'Scannable par tous les téléphones, même sans NFC.';
  } catch (err) {
    qrCv = null;
    box.textContent = err.message === 'lib' ? 'QR indisponible hors connexion.' : 'Lien trop long pour un QR code.';
    $('#qrNote').textContent = '';
  }
}

function showPubUrl(url) {
  const el = $('#pubUrl');
  el.textContent = url || 'Pas encore de lien public : remplis les réglages GitHub en bas de cette page.';
  el.classList.toggle('empty', !url);
}

function renderShare() {
  const c = card(), url = publicUrl(c);
  $('#cardId').value = c.id;
  showPubUrl(url);
  $('#btnCopy').disabled = $('#btnOpen').disabled = !url;
  const st = $('#pubStatus');
  if (!gh.ready(ghCfg)) { st.textContent = 'GitHub non configuré.'; st.className = 'status warn'; }
  else if (!c.publishedAt) { st.textContent = 'Jamais publiée.'; st.className = 'status warn'; }
  else if (c.updated > c.publishedAt) { st.textContent = `Modifications non publiées (dernière publication : ${fmtDate(c.publishedAt)}).`; st.className = 'status warn'; }
  else { st.textContent = `En ligne et à jour (publiée ${fmtDate(c.publishedAt)}).`; st.className = 'status ok'; }
  $$('[data-gh]').forEach(i => { if (document.activeElement !== i) i.value = ghCfg[i.dataset.gh] || ''; });
  drawQr(url || testUrl(c), !url);
}

$('#cardId').addEventListener('change', e => {
  const c = card(), nid = slugify(e.target.value);
  if (!nid || nid === c.id) { e.target.value = c.id; return; }
  if (cards[nid]) { toast('Cet identifiant est déjà utilisé'); e.target.value = c.id; return; }
  if (c.publishedAt && !confirm('Le lien public va changer. Une puce NFC déjà programmée pointera toujours vers l\'ancien lien. Continuer ?')) { e.target.value = c.id; return; }
  delete cards[c.id];
  c.id = nid;
  c.publishedAt = null;
  cards[nid] = c;
  curId = nid;
  persist();
  renderSelect();
  renderShare();
});

async function copy(text) {
  if (native) { native.copy(text); toast('Lien copié'); return; }
  try { await navigator.clipboard.writeText(text); toast('Lien copié'); }
  catch { prompt('Copie ce lien :', text); }
}
const openExternal = url => (native ? native.openUrl(url) : window.open(url, '_blank', 'noopener'));
$('#btnCopy').addEventListener('click', () => { const u = publicUrl(); if (u) copy(u); });
$('#btnOpen').addEventListener('click', () => { const u = publicUrl(); if (u) openExternal(u); });
$('#btnTestOpen').addEventListener('click', () => openExternal(testUrl()));
$('#btnTestCopy').addEventListener('click', () => copy(testUrl()));
$('#btnShare').addEventListener('click', async () => {
  const url = publicUrl() || testUrl();
  const title = fullName(card().fields) || 'Ma carte de visite';
  if (native) native.share(title, url);
  else if (navigator.share) {
    try { await navigator.share({ title, url }); } catch { /* annulé */ }
  } else copy(url);
});
$('#btnQrDl').addEventListener('click', () => { if (qrCv) qrCv.toBlob(b => download(b, `qr-${card().id}.png`)); });

$('#btnPublish').addEventListener('click', async () => {
  if (!gh.ready(ghCfg)) {
    $('#ghAcc').open = true;
    $('#ghAcc').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return toast('Remplis d\'abord les réglages GitHub');
  }
  const b = $('#btnPublish');
  b.disabled = true;
  b.textContent = 'Publication...';
  try {
    const c = card();
    const data = { ...c };
    delete data.publishedAt;
    await gh.putFile(ghCfg, `cards/${c.id}.json`, JSON.stringify(data), `Carte ${c.id}`);
    c.publishedAt = Date.now();
    persist();
    toast('Publiée. Visible en ligne d\'ici une minute environ.', 4500);
  } catch (err) {
    toast(err.message, 6000);
  } finally {
    b.disabled = false;
    b.textContent = 'Publier / mettre à jour';
    renderShare();
  }
});

$('#share').addEventListener('input', e => {
  const k = e.target.dataset.gh;
  if (!k) return;
  ghCfg[k] = e.target.value.trim();
  store.set(LS.gh, ghCfg);
  showPubUrl(publicUrl());
});
$('#share').addEventListener('change', e => { if (e.target.dataset.gh) renderShare(); });
$('#btnGhTest').addEventListener('click', async () => {
  if (!gh.ready(ghCfg)) return toast('Propriétaire, dépôt et token sont nécessaires');
  try {
    const repo = await gh.test(ghCfg);
    toast(`Connexion OK : ${repo.full_name}`);
  } catch (err) { toast(err.message, 6000); }
});

// ---------- NFC (Web NFC, Chrome Android) ----------
let nfcCtl = null;
function nfcMsg(text, kind = '') {
  const m = $('#nfcMsg');
  m.hidden = !text;
  m.className = 'nfcmsg ' + kind;
  $('span', m).textContent = text || '';
  $('#btnNfcCancel').hidden = kind !== 'wait';
}
// Côté APK : l'écriture passe par l'API NFC Android, le résultat revient via window.__cnfcNfc.
let nativeNfcDone = null;
window.__cnfcNfc = (kind, text) => { const done = nativeNfcDone; nativeNfcDone = null; if (done) done({ kind, text }); };
function nativeNfc(op, url) {
  if (nativeNfcDone) nativeNfcDone({ kind: 'cancel', text: '' });
  return new Promise(resolve => {
    nativeNfcDone = resolve;
    if (op === 'write') native.nfcWrite(url); else native.nfcRead();
  });
}
function showReadResult(found) {
  const want = publicUrl();
  if (!found.length) nfcMsg('Puce vide ou contenu non reconnu.', 'err');
  else if (want && found.includes(want)) nfcMsg('Puce OK : elle ouvre bien cette carte.', 'ok');
  else nfcMsg('La puce contient : ' + found.join(', '), '');
}

function nfcAvailable() {
  if (native) {
    const st = native.nfcState();
    if (st === 'on') return true;
    if (st === 'off') { nfcMsg('Le NFC est désactivé : active-le dans les paramètres qui viennent de s\'ouvrir, puis réessaie.', 'err'); native.nfcSettings(); }
    else nfcMsg('Ce téléphone n\'a pas de puce NFC. Utilise le QR code.', 'err');
    return false;
  }
  if ('NDEFReader' in window) return true;
  nfcMsg(window.isSecureContext
    ? 'Ce navigateur ne gère pas le NFC. Ouvre l\'application dans Chrome sur Android.'
    : 'Le NFC exige une page en https : ouvre la version en ligne (GitHub Pages).', 'err');
  return false;
}
function nfcError(e) {
  if (e.name === 'AbortError') return 'Annulé.';
  if (e.name === 'NotAllowedError') return 'Autorisation NFC refusée, ou puce verrouillée en lecture seule.';
  if (e.name === 'NotSupportedError') return 'NFC indisponible : active-le dans les paramètres Android.';
  if (e.name === 'NetworkError') return 'Écriture interrompue : garde la puce collée au téléphone et réessaie.';
  return 'Erreur NFC : ' + e.message;
}
$('#btnNfcWrite').addEventListener('click', async () => {
  if (!nfcAvailable()) return;
  const url = publicUrl();
  if (!url) return nfcMsg('Configure GitHub avant d\'écrire la puce : elle doit pointer vers le lien public définitif.', 'err');
  if (!card().publishedAt) toast('Attention : la carte n\'est pas encore publiée', 4000);
  if (native) {
    nfcMsg('Approche la puce du dos du téléphone...', 'wait');
    const r = await nativeNfc('write', url);
    if (r.kind === 'ok') nfcMsg('Puce programmée : ' + r.text, 'ok');
    else if (r.kind === 'err') nfcMsg(r.text, 'err');
    return;
  }
  nfcCtl?.abort();
  nfcCtl = new AbortController();
  nfcMsg('Approche la puce du dos du téléphone...', 'wait');
  try {
    await new window.NDEFReader().write({ records: [{ recordType: 'url', data: url }] }, { signal: nfcCtl.signal });
    navigator.vibrate?.(60);
    nfcMsg('Puce programmée : ' + url, 'ok');
  } catch (err) {
    nfcMsg(nfcError(err), err.name === 'AbortError' ? '' : 'err');
  } finally { nfcCtl = null; }
});
$('#btnNfcRead').addEventListener('click', async () => {
  if (!nfcAvailable()) return;
  if (native) {
    nfcMsg('Approche la puce à vérifier...', 'wait');
    const r = await nativeNfc('read');
    if (r.kind === 'ok') showReadResult(r.text ? r.text.split('\n') : []);
    else if (r.kind === 'err') nfcMsg(r.text, 'err');
    return;
  }
  nfcCtl?.abort();
  const ctl = nfcCtl = new AbortController();
  const reader = new window.NDEFReader();
  try {
    await reader.scan({ signal: ctl.signal });
    nfcMsg('Approche la puce à vérifier...', 'wait');
    reader.onreading = ev => {
      ctl.abort();
      if (nfcCtl === ctl) nfcCtl = null;
      showReadResult(ev.message.records
        .filter(r => ['url', 'absolute-url', 'text'].includes(r.recordType))
        .map(r => new TextDecoder(r.encoding || 'utf-8').decode(r.data)));
    };
    reader.onreadingerror = () => nfcMsg('Lecture impossible, réessaie.', 'err');
  } catch (err) { nfcMsg(nfcError(err), 'err'); }
});
$('#btnNfcCancel').addEventListener('click', () => {
  if (native) { native.nfcCancel(); window.__cnfcNfc('cancel', ''); }
  nfcCtl?.abort();
  nfcCtl = null;
  nfcMsg('');
});

// ---------- Démarrage ----------
$$('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));
renderAll();
let startTab = 'preview';
try { startTab = sessionStorage.getItem(LS.tab) || 'preview'; } catch { /* ignore */ }
setTab(startTab);

if (!native && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
