// Publication des cartes dans le dépôt GitHub Pages via l'API Contents.
import { DEFAULT_REPO } from './config.js';

export function guess() {
  const cfg = { owner: '', repo: '', branch: 'main', token: '', baseUrl: '' };
  const h = location.hostname;
  if (h.endsWith('.github.io')) {
    cfg.owner = h.split('.')[0];
    const seg = location.pathname.split('/').filter(Boolean)[0];
    cfg.repo = seg && !seg.includes('.') ? seg : h;
  } else {
    Object.assign(cfg, DEFAULT_REPO);
  }
  return cfg;
}

export function baseUrl(cfg) {
  if (cfg.baseUrl) return cfg.baseUrl.trim().replace(/\/?$/, '/');
  if (cfg.owner && cfg.repo) {
    const o = cfg.owner.toLowerCase();
    return cfg.repo.toLowerCase() === `${o}.github.io` ? `https://${o}.github.io/` : `https://${o}.github.io/${cfg.repo}/`;
  }
  if (location.hostname.endsWith('.github.io')) return new URL('./', location.href).href;
  return null;
}

export const ready = cfg => !!(cfg.owner && cfg.repo && cfg.token);

function errText(status, msg) {
  if (status === 401) return 'Token GitHub invalide ou expiré.';
  if (status === 403) return "Accès refusé : le token n'a pas la permission Contents en écriture sur ce dépôt.";
  if (status === 404) return 'Dépôt introuvable : vérifie le propriétaire, le nom du dépôt et les droits du token.';
  if (status === 409) return "Conflit d'écriture, réessaie.";
  return `Erreur GitHub ${status}${msg ? ' : ' + msg : ''}`;
}

async function call(cfg, path, init = {}) {
  const enc = encodeURIComponent;
  let r;
  try {
    r = await fetch(`https://api.github.com/repos/${enc(cfg.owner.trim())}/${enc(cfg.repo.trim())}${path}`, {
      method: init.method || 'GET',
      body: init.body,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${cfg.token.trim()}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new Error('Impossible de joindre GitHub (pas de réseau ?).');
  }
  if (r.status === 404 && init.allow404) return null;
  if (!r.ok) {
    let m = '';
    try { m = (await r.json()).message; } catch { /* ignore */ }
    throw new Error(errText(r.status, m));
  }
  return r.status === 204 ? null : r.json();
}

function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const test = cfg => call(cfg, '');

export async function putFile(cfg, path, text, message) {
  const p = '/contents/' + path.split('/').map(encodeURIComponent).join('/');
  const branch = (cfg.branch || 'main').trim();
  const cur = await call(cfg, `${p}?ref=${encodeURIComponent(branch)}`, { allow404: true });
  const body = { message, content: b64utf8(text), branch };
  if (cur && cur.sha) body.sha = cur.sha;
  return call(cfg, p, { method: 'PUT', body: JSON.stringify(body) });
}
