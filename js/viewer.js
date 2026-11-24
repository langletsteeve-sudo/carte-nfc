import { renderCard, normalizeCard, decodeHash, buildVCard, icon, esc, slugify, fullName } from './render.js';

const root = document.getElementById('root');

async function load() {
  const id = new URLSearchParams(location.search).get('c');
  if (id) {
    if (!/^[a-z0-9-]{1,64}$/.test(id)) throw new Error('Lien de carte invalide.');
    let r;
    try { r = await fetch(`cards/${id}.json?t=${Date.now()}`, { cache: 'no-store' }); }
    catch { throw new Error('Pas de connexion internet.'); }
    if (r.status === 404) throw new Error('Cette carte n\'existe pas (ou pas encore : une publication met environ une minute à apparaître).');
    if (!r.ok) throw new Error('Erreur de chargement (' + r.status + ').');
    return r.json();
  }
  const m = location.hash.match(/[#&]d=([^&]+)/);
  if (m) return decodeHash(m[1]);
  throw new Error('Aucune carte à afficher.');
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

(async () => {
  try {
    const card = normalizeCard(await load());
    const s = card.style;
    const b = document.body.style;
    b.setProperty('--page', s.pageBg);
    b.setProperty('--acc', s.accent);
    b.setProperty('--on-acc', s.onAccent);
    b.setProperty('--font', `'${s.fontBody}'`);
    document.querySelector('meta[name=theme-color]').content = s.pageBg;
    const name = fullName(card.fields) || card.fields.company || 'Carte de visite';
    document.title = name;
    root.innerHTML = renderCard(card);

    const save = document.getElementById('btnSave');
    const share = document.getElementById('btnShare');
    save.insertAdjacentHTML('afterbegin', icon('userplus'));
    share.innerHTML = icon('share');
    save.addEventListener('click', async () => {
      const vcf = await buildVCard(card);
      download(new Blob([vcf], { type: 'text/vcard;charset=utf-8' }), `${slugify(name) || 'contact'}.vcf`);
    });
    share.addEventListener('click', async () => {
      if (navigator.share) {
        try { await navigator.share({ title: name, url: location.href }); } catch { /* annulé */ }
      } else {
        try { await navigator.clipboard.writeText(location.href); share.title = 'Lien copié'; } catch { /* ignore */ }
      }
    });
    document.getElementById('bar').hidden = false;
  } catch (err) {
    root.innerHTML = `<p class="msg">${esc(err.message)}</p>`;
  }
})();
