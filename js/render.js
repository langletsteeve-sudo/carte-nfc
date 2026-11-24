// Moteur de rendu partagé entre l'éditeur et la page publique.

export const FONTS = {
  'Inter': '400;500;600;700;800',
  'Poppins': '400;500;600;700;800',
  'Montserrat': '400;500;600;700;800',
  'Raleway': '400;500;600;700;800',
  'Outfit': '400;500;600;700;800',
  'Space Grotesk': '400;500;600;700',
  'Archivo': '400;500;600;700;800',
  'Syne': '400;500;600;700;800',
  'Josefin Sans': '400;500;600;700',
  'Nunito': '400;600;700;800',
  'Lato': '400;700',
  'Roboto': '400;500;700',
  'Open Sans': '400;500;600;700;800',
  'Oswald': '400;500;600;700',
  'Bebas Neue': '400',
  'Playfair Display': '400;500;600;700;800',
  'DM Serif Display': '400',
  'Cormorant Garamond': '400;500;600;700',
  'Lora': '400;500;600;700',
  'Merriweather': '400;700',
  'Courier Prime': '400;700',
};

const loadedFonts = new Set();
export function loadFonts(names) {
  const todo = [...new Set(names)].filter(n => FONTS[n] && !loadedFonts.has(n));
  if (!todo.length) return;
  todo.forEach(n => loadedFonts.add(n));
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?' +
    todo.map(n => `family=${n.replace(/ /g, '+')}:wght@${FONTS[n]}`).join('&') + '&display=swap';
  document.head.appendChild(link);
}

const ICONS = {
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  x: '<path d="M4 4l11.7 16H20L8.3 4H4z"/><path d="M4 20l6.8-6.8M20 4l-6.8 6.8"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  tiktok: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  youtube: '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  nfc: '<path d="M6 8.32a7.43 7.43 0 0 1 0 7.36"/><path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58"/><path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8"/><path d="M16.37 2a20.16 20.16 0 0 1 0 20"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const slugify = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

const isUrl = v => /^https?:\/\//i.test(v);
const normUrl = v => (isUrl(v) ? v : 'https://' + v);
const handle = v => v.trim().replace(/^@/, '');
const stripUrl = v => v.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
const social = base => v => (isUrl(v.trim()) ? v.trim() : base + handle(v));
const socialShow = v => (isUrl(v.trim()) ? stripUrl(v.trim()) : '@' + handle(v));
const digits = v => v.replace(/[^\d+]/g, '');

export const IDENTITY = [
  { k: 'firstName', label: 'Prénom' },
  { k: 'lastName', label: 'Nom' },
  { k: 'title', label: 'Poste / fonction' },
  { k: 'company', label: 'Entreprise' },
  { k: 'bio', label: 'Description courte', multi: true },
];

export const LINKS = [
  { k: 'phone', label: 'Téléphone', icon: 'phone', mode: 'tel', ph: '+33 6 12 34 56 78', href: v => 'tel:' + digits(v) },
  { k: 'phone2', label: 'Téléphone fixe', icon: 'phone', mode: 'tel', ph: '+33 1 23 45 67 89', href: v => 'tel:' + digits(v) },
  { k: 'email', label: 'Email', icon: 'mail', mode: 'email', ph: 'nom@exemple.com', href: v => 'mailto:' + v.trim() },
  { k: 'website', label: 'Site web', icon: 'globe', mode: 'url', ph: 'www.exemple.com', href: v => normUrl(v.trim()), show: v => stripUrl(v.trim()) },
  { k: 'address', label: 'Adresse', icon: 'pin', ph: '12 rue de la Paix, 75002 Paris', href: v => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v.trim()) },
  { k: 'whatsapp', label: 'WhatsApp', icon: 'chat', mode: 'tel', ph: '+33612345678', href: v => 'https://wa.me/' + v.replace(/\D/g, '') },
  { k: 'telegram', label: 'Telegram', icon: 'send', ph: '@pseudo', href: social('https://t.me/'), show: socialShow },
  { k: 'linkedin', label: 'LinkedIn', icon: 'linkedin', mode: 'url', ph: 'pseudo ou URL du profil', href: social('https://www.linkedin.com/in/'), show: socialShow },
  { k: 'instagram', label: 'Instagram', icon: 'instagram', ph: '@pseudo', href: social('https://www.instagram.com/'), show: socialShow },
  { k: 'x', label: 'X (Twitter)', icon: 'x', ph: '@pseudo', href: social('https://x.com/'), show: socialShow },
  { k: 'facebook', label: 'Facebook', icon: 'facebook', ph: 'pseudo ou URL', href: social('https://www.facebook.com/'), show: socialShow },
  { k: 'tiktok', label: 'TikTok', icon: 'tiktok', ph: '@pseudo', href: social('https://www.tiktok.com/@'), show: socialShow },
  { k: 'youtube', label: 'YouTube', icon: 'youtube', ph: '@chaine', href: social('https://www.youtube.com/@'), show: socialShow },
  { k: 'github', label: 'GitHub', icon: 'github', ph: 'pseudo', href: social('https://github.com/'), show: socialShow },
  { k: 'custom', label: 'Lien perso', icon: 'link', mode: 'url', ph: 'https://...', href: v => normUrl(v.trim()), show: v => stripUrl(v.trim()) },
];

export const DEFAULT_STYLE = {
  layout: 'classic', linkStyle: 'list', align: 'left', density: 'normal',
  fontHead: 'Poppins', fontBody: 'Inter', nameSize: 30, nameWeight: 700, nameUpper: false, baseSize: 16,
  bgType: 'gradient', bg: '#0f172a', bg2: '#1e293b', angle: 160,
  pattern: 'none', patternOpacity: 0.08, overlay: 0.35, coverHeight: 130,
  text: '#f8fafc', muted: '#94a3b8', accent: '#38bdf8', onAccent: '#0b1220', pageBg: '#020617',
  radius: 28, shadow: 2, btnStyle: 'soft', btnRadius: 14, showIcons: true, showLabels: true,
  logoShape: 'circle', logoSize: 88, logoRing: true, logoPad: false, logoBg: '#ffffff',
};

export const PRESETS = [
  { id: 'nuit', name: 'Nuit', s: { bgType: 'gradient', bg: '#0f172a', bg2: '#1e293b', angle: 160, text: '#f8fafc', muted: '#94a3b8', accent: '#38bdf8', onAccent: '#0b1220', pageBg: '#020617', fontHead: 'Poppins', fontBody: 'Inter', btnStyle: 'soft', pattern: 'none' } },
  { id: 'papier', name: 'Papier', s: { bgType: 'solid', bg: '#f7f3ea', bg2: '#efe7d6', text: '#1c1917', muted: '#78716c', accent: '#9a3412', onAccent: '#ffffff', pageBg: '#e7e1d4', fontHead: 'Playfair Display', fontBody: 'Lora', btnStyle: 'outline', pattern: 'none' } },
  { id: 'corporate', name: 'Corporate', s: { bgType: 'solid', bg: '#ffffff', bg2: '#dbeafe', text: '#0f172a', muted: '#64748b', accent: '#2563eb', onAccent: '#ffffff', pageBg: '#e2e8f0', fontHead: 'Inter', fontBody: 'Inter', btnStyle: 'soft', pattern: 'none' } },
  { id: 'neon', name: 'Néon', s: { bgType: 'gradient', bg: '#09090b', bg2: '#2e1065', angle: 200, text: '#fafafa', muted: '#a1a1aa', accent: '#e879f9', onAccent: '#09090b', pageBg: '#000000', fontHead: 'Syne', fontBody: 'Space Grotesk', btnStyle: 'outline', pattern: 'grid', patternOpacity: 0.07 } },
  { id: 'foret', name: 'Forêt', s: { bgType: 'gradient', bg: '#14532d', bg2: '#052e16', angle: 170, text: '#ecfdf5', muted: '#a7f3d0', accent: '#fbbf24', onAccent: '#1c1917', pageBg: '#022c22', fontHead: 'Outfit', fontBody: 'Nunito', btnStyle: 'soft', pattern: 'dots', patternOpacity: 0.08 } },
  { id: 'sunset', name: 'Sunset', s: { bgType: 'gradient', bg: '#fb7185', bg2: '#f59e0b', angle: 135, text: '#ffffff', muted: '#fff1e6', accent: '#ffffff', onAccent: '#be123c', pageBg: '#fff7ed', fontHead: 'Josefin Sans', fontBody: 'Nunito', btnStyle: 'filled', pattern: 'bubbles', patternOpacity: 0.12 } },
  { id: 'mono', name: 'Mono', s: { bgType: 'solid', bg: '#ffffff', bg2: '#e5e5e5', text: '#0a0a0a', muted: '#525252', accent: '#0a0a0a', onAccent: '#ffffff', pageBg: '#d4d4d4', fontHead: 'Space Grotesk', fontBody: 'Courier Prime', btnStyle: 'outline', pattern: 'none', radius: 0, btnRadius: 0 } },
  { id: 'luxe', name: 'Luxe', s: { bgType: 'solid', bg: '#111111', bg2: '#292524', text: '#f5f5f4', muted: '#a8a29e', accent: '#d4af37', onAccent: '#111111', pageBg: '#0a0a0a', fontHead: 'Cormorant Garamond', fontBody: 'Montserrat', btnStyle: 'outline', pattern: 'none' } },
];

const isImg = v => typeof v === 'string' && /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/.test(v);
const isHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

export function newCard(id = 'ma-carte') {
  return normalizeCard({
    id,
    fields: { firstName: 'Prénom', lastName: 'Nom', title: 'Votre poste', company: 'Votre entreprise', phone: '+33 6 00 00 00 00', email: 'vous@exemple.com', website: 'www.exemple.com' },
  });
}

export function normalizeCard(c) {
  c = c && typeof c === 'object' ? c : {};
  const style = { ...DEFAULT_STYLE };
  for (const [k, v] of Object.entries(c.style || {})) {
    if (!(k in DEFAULT_STYLE)) continue;
    const d = DEFAULT_STYLE[k];
    if (typeof d === 'number' && Number.isFinite(+v)) style[k] = +v;
    else if (typeof d === 'boolean') style[k] = !!v;
    else if (typeof d === 'string' && typeof v === 'string' && (!d.startsWith('#') || isHex(v))) style[k] = v;
  }
  const fields = {};
  for (const [k, v] of Object.entries(c.fields || {})) if (typeof v === 'string') fields[k] = v;
  const keys = LINKS.map(l => l.k);
  const order = [...new Set([...(Array.isArray(c.order) ? c.order.filter(k => keys.includes(k)) : []), ...keys])];
  return {
    v: 1,
    id: slugify(c.id) || 'ma-carte',
    fields, style, order,
    logo: isImg(c.logo) ? c.logo : null,
    cover: isImg(c.cover) ? c.cover : null,
    updated: c.updated || Date.now(),
    publishedAt: c.publishedAt || null,
  };
}

export const fullName = f => [f.firstName, f.lastName].map(x => (x || '').trim()).filter(Boolean).join(' ');

export function renderCard(input) {
  const c = normalizeCard(input);
  const s = c.style, f = c.fields;
  loadFonts([s.fontHead, s.fontBody]);
  const name = fullName(f);
  const initials = (name || f.company || '?').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const vars = {
    '--bg': s.bg, '--bg2': s.bg2, '--angle': s.angle + 'deg',
    '--text': s.text, '--muted': s.muted, '--accent': s.accent, '--on-accent': s.onAccent,
    '--radius': s.radius + 'px', '--btn-radius': s.btnRadius + 'px',
    '--font-head': `'${s.fontHead}', system-ui, sans-serif`, '--font-body': `'${s.fontBody}', system-ui, sans-serif`,
    '--name-size': s.nameSize + 'px', '--name-weight': s.nameWeight, '--base': s.baseSize + 'px',
    '--logo': s.logoSize + 'px', '--logo-bg': s.logoBg, '--cover-h': s.coverHeight + 'px',
    '--pat-op': s.patternOpacity, '--overlay': s.overlay,
  };
  const styleStr = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');

  let logo = '';
  if (s.logoShape !== 'none') {
    if (c.logo) logo = `<div class="bc-logo"><img src="${c.logo}" alt=""></div>`;
    else if (s.logoShape !== 'free') logo = `<div class="bc-logo bc-mono"><span>${esc(initials)}</span></div>`;
  }

  const cls = ['bc', `bc--${s.layout}`, `bc-links--${s.linkStyle}`, `bc-al--${s.align}`, `bc-den--${s.density}`,
    `bc-bg--${s.bgType}`, `bc-pat--${s.pattern}`, `bc-sh--${s.shadow}`, `bc-btn--${s.btnStyle}`, `bc-logo--${s.logoShape}`];
  if (s.nameUpper) cls.push('bc-upper');
  if (s.logoRing) cls.push('bc-ring');
  if (s.logoPad) cls.push('bc-pad');
  if (!s.showLabels) cls.push('bc-nolabels');
  if (!s.showIcons) cls.push('bc-noicons');
  if (!logo) cls.push('bc-nologo');

  const links = c.order.map(k => LINKS.find(l => l.k === k))
    .filter(l => l && (f[l.k] || '').trim())
    .map(l => {
      const v = f[l.k].trim();
      const label = l.k === 'custom' ? (f.customLabel || '').trim() || 'Lien' : l.label;
      const shown = l.show ? l.show(v) : v;
      const href = l.href(v);
      const ext = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '';
      return `<a class="bc-link" href="${esc(href)}"${ext} title="${esc(label)}"><span class="bc-ic">${icon(l.icon)}</span><span class="bc-lt"><small>${esc(label)}</small><span>${esc(shown)}</span></span></a>`;
    });

  const bgimg = s.bgType === 'image' && c.cover ? `<img class="bc-bgimg" src="${c.cover}" alt="">` : '';
  const cover = s.layout === 'banner' ? `<div class="bc-cover">${c.cover ? `<img src="${c.cover}" alt="">` : ''}</div>` : '';

  return `<article class="${cls.join(' ')}" style="${esc(styleStr)}">${bgimg}<div class="bc-pat" aria-hidden="true"></div>${cover}` +
    `<header class="bc-head">${logo}<div class="bc-id">` +
    (name ? `<h1 class="bc-name">${esc(name)}</h1>` : '') +
    (f.title ? `<p class="bc-title">${esc(f.title)}</p>` : '') +
    (f.company ? `<p class="bc-company">${esc(f.company)}</p>` : '') +
    `</div></header>` +
    (f.bio ? `<p class="bc-bio">${esc(f.bio).replace(/\n/g, '<br>')}</p>` : '') +
    (links.length ? `<nav class="bc-links">${links.join('')}</nav>` : '') +
    `</article>`;
}

// Lien de test : la carte (sans images) encodée dans le #hash de l'URL.
function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0)));
}
export function encodeHash(card) {
  const c = normalizeCard(card);
  const style = {};
  for (const k in c.style) if (c.style[k] !== DEFAULT_STYLE[k]) style[k] = c.style[k];
  const fields = {};
  for (const k in c.fields) if (c.fields[k]) fields[k] = c.fields[k];
  const out = { id: c.id, fields, style };
  if (c.order.join() !== LINKS.map(l => l.k).join()) out.order = c.order;
  return b64urlEncode(JSON.stringify(out));
}
export const decodeHash = h => JSON.parse(b64urlDecode(h));

// vCard 3.0, avec le logo en photo du contact.
function toJpegBase64(dataUrl, size = 400) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const r = Math.min(1, size / Math.max(img.naturalWidth || size, img.naturalHeight || size));
      const w = Math.max(1, Math.round((img.naturalWidth || size) * r)), h = Math.max(1, Math.round((img.naturalHeight || size) * r));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(cv.toDataURL('image/jpeg', 0.85).split(',')[1]);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export async function buildVCard(card) {
  const c = normalizeCard(card), f = c.fields;
  const e = v => String(v || '').trim().replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
  const L = ['BEGIN:VCARD', 'VERSION:3.0',
    `N:${e(f.lastName)};${e(f.firstName)};;;`,
    `FN:${e(fullName(f) || f.company || 'Contact')}`];
  if (f.company) L.push('ORG:' + e(f.company));
  if (f.title) L.push('TITLE:' + e(f.title));
  if (f.phone) L.push('TEL;TYPE=CELL:' + f.phone.trim());
  if (f.phone2) L.push('TEL;TYPE=WORK,VOICE:' + f.phone2.trim());
  if (f.email) L.push('EMAIL;TYPE=INTERNET:' + f.email.trim());
  if (f.address) L.push('ADR;TYPE=WORK:;;' + e(f.address) + ';;;;');
  for (const l of LINKS) {
    const v = (f[l.k] || '').trim();
    if (!v || ['phone', 'phone2', 'email', 'address'].includes(l.k)) continue;
    L.push((l.k === 'website' ? 'URL:' : `URL;TYPE=${l.k}:`) + l.href(v));
  }
  if (f.bio) L.push('NOTE:' + e(f.bio));
  if (c.logo) {
    const b64 = await toJpegBase64(c.logo);
    if (b64) L.push('PHOTO;ENCODING=b;TYPE=JPEG:' + b64);
  }
  L.push('END:VCARD');
  const fold = line => {
    if (line.length <= 75) return line;
    const parts = [line.slice(0, 75)];
    for (let i = 75; i < line.length; i += 74) parts.push(' ' + line.slice(i, i + 74));
    return parts.join('\r\n');
  };
  return L.map(fold).join('\r\n') + '\r\n';
}
