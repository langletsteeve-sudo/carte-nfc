// QR code dessiné sur un canvas (librairie qrcode-generator chargée dans index.html).
export function qrCanvas(text, { size = 720, margin = 4, dark = '#000000', light = '#ffffff' } = {}) {
  if (typeof window.qrcode !== 'function') throw new Error('lib');
  const q = window.qrcode(0, 'M');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const cell = Math.max(2, Math.floor(size / (n + margin * 2)));
  const dim = cell * (n + margin * 2);
  const cv = document.createElement('canvas');
  cv.width = cv.height = dim;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = dark;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (q.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
  }
  return cv;
}
