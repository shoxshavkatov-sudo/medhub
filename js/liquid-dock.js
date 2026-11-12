/* =====================================================================
   MedHub — нижняя панель «Liquid Glass»: стеклянный бар + жидкая капля.

   Основано на наборе «Liquid Glass для Telegram Mini Apps»
   © 2026 Volodymyr (@vovnx, https://t.me/vovnx) — все права у автора.
   Используется по лицензии, приобретённой владельцем проекта MedHub.
   Стекло (profile / maps / filterFor) и физика капли (frame) — из набора.

   Доработки для MedHub:
   • любое число вкладок (в наборе — 3): ширина вкладки, капли и бара
     считаются от ширины экрана, капля не становится уже своей высоты;
   • светлая / тёмная / ночная темы (цвета — CSS-переменные в style.css);
   • подписи RU / UZ / EN подбирают размер шрифта, чтобы не наезжать друг на друга;
   • анимация останавливается, когда капля успокоилась (не крутит кадры впустую);
   • prefers-reduced-motion и «низкое качество графики» — без пружин и SVG-фильтров.

   API:  LiquidDock.render(navEl, [{label, icon}], activeIndex, onSelect)
         onSelect(i, changed) — палец отпущен на вкладке i (или Enter/Space)
   ===================================================================== */
window.LiquidDock = (function(){
'use strict';
const isChromium = /Chrome\//.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
const BH = 190, THH = 165;                 // высота бара и капли в условных единицах u (как в наборе)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lowQ = () => document.documentElement.classList.contains('no-anim');
const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const reduced = () => lowQ() || !!(mq && mq.matches);

/* ---------- стекло: профиль линзы → карты смещения и блика → SVG-фильтр (из набора) ---------- */
const surf = x => Math.pow(1 - Math.pow(1 - x, 4), .25);
function profile(T, B, ior, N = 128) {
  const eta = 1 / ior, p = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const x = i / N, y = surf(x), dx = x < 1 ? 1e-4 : -1e-4;
    const d = (surf(x + dx) - y) / dx, m = Math.hypot(d, 1), nx = -d / m, ny = -1 / m;
    const k = 1 - eta * eta * (1 - ny * ny);
    if (k < 0) continue;
    const s = Math.sqrt(k);
    p[i] = -(eta * ny + s) * nx * ((y * B + T) / (eta - (eta * ny + s) * ny));
  }
  return p;
}
const k0 = (x, y, w) => (y * w + x) * 4 + 3;
function maps(w, h, r, B, p, mx) {
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); return [c, x, x.createImageData(w, h)]; };
  const [c1, x1, i1] = mk(), [c2, x2, i2] = mk(), a = i1.data, b = i2.data;
  const N = p.length, wB = w - 2 * r, hB = h - 2 * r, Bs = B * 2.5, sx = Math.cos(Math.PI / 3), sy = Math.sin(Math.PI / 3);
  for (let i = 0; i < a.length; i += 4) { a[i] = a[i + 1] = 128; a[i + 3] = 255; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x < r ? x - r : x >= w - r ? x - r - wB : 0, Y = y < r ? y - r : y >= h - r ? y - r - hB : 0;
    const d2 = X * X + Y * Y;
    if (d2 > (r + 1) ** 2) continue;
    const d = Math.sqrt(d2);
    if (!d) { b[k0(x, y, w)] = 0; continue; }
    const op = d < r ? 1 : 1 - (d - r), k = (y * w + x) * 4, cs = X / d, sn = Y / d, fs = r - d;
    if (op <= 0) continue;
    if (d2 >= Math.max(r - B, 0) ** 2) {
      const disp = p[Math.min(Math.max(fs / B * N, 0) | 0, N - 1)] || 0;
      a[k] = (128 + (-cs * disp / mx) * 127 * op + .5) | 0;
      a[k + 1] = (128 + (-sn * disp / mx) * 127 * op + .5) | 0;
    }
    if (d2 >= Math.max(r - Bs, 0) ** 2) {
      const dot = Math.abs(cs * sx + (-sn) * sy), edge = Math.sqrt(Math.max(0, 1 - (1 - fs) ** 2)), co = dot * edge, col = (255 * co) | 0;
      b[k] = b[k + 1] = b[k + 2] = col; b[k + 3] = (col * co * op) | 0;
    }
  }
  x1.putImageData(i1, 0, 0); x2.putImageData(i2, 0, 0);
  return [c1.toDataURL(), c2.toDataURL()];
}
function filterFor(el, id) {
  const w = el.offsetWidth, h = el.offsetHeight;
  if (w < 2 || h < 2) return '';
  const soft = !!el.dataset.soft, r = h / 2, B = Math.min(h * (soft ? .15 : .34), r - 1), p = profile(h * (soft ? .2 : .42), B, soft ? 1.5 : 1.9);
  const mx = Math.max(...Array.from(p, Math.abs)) || 1, [disp, spec] = maps(w, h, r, B, p, mx);
  const thumb = id === 'ld-thumb';
  return `<filter id="${id}" x="0%" y="0%" width="100%" height="100%">
<feGaussianBlur in="SourceGraphic" stdDeviation="0.2" result="bl"/>
<feImage href="${disp}" x="0" y="0" width="${w}" height="${h}" result="dm"/>
<feDisplacementMap in="bl" in2="dm" scale="${mx * (soft ? .1 : thumb ? .45 : .4)}" xChannelSelector="R" yChannelSelector="G" result="dp"/>
<feColorMatrix in="dp" type="saturate" values="5" result="ds"/>
<feImage href="${spec}" x="0" y="0" width="${w}" height="${h}" result="sl"/>
<feComposite in="ds" in2="sl" operator="in" result="sm"/>
<feComponentTransfer in="sl" result="sf"><feFuncA type="linear" slope="${soft ? 0 : thumb ? .22 : 1}"/></feComponentTransfer>
<feBlend in="sm" in2="dp" mode="normal" result="ws"/>
<feBlend in="sf" in2="ws" mode="normal"/></filter>`;
}

/* ---------- состояние ---------- */
let root = null, bar, base, fil, thumb, lens, tabsEl, clone, defs, tabs = [], cloneTabs = [];
let N = 0, TW = 273, THW = 252, PAD = 12, BW = 843, U = .46, labels = [], itemsKey = '', onSelect = null, lastLow = null;
let dirv = 1, cur = 0, vel = 0, target = 0, press = 0, pvel = 0, down = false, grab = 0, active = -1, hi = -2;
let pRaw = 0, pT = 0, pV = 0, mv = 0, mvv = 0, zz = 0, zzv = 0, wasMoving = false, lag = 0, lagv = 0;
let running = false, last = 0, rt = 0;

/* ---------- геометрия под N вкладок и ширину экрана ---------- */
const measure = document.createElement('canvas').getContext('2d');
function layout(){
  if (!bar || !N) return;
  const vw = document.documentElement.clientWidth || innerWidth;
  const mobile = vw <= 520, side = mobile ? 8 : 12;
  const Hpx = mobile ? 58 : 64, avail = Math.min(vw - 2 * side, 640);
  U = Hpx / BH;
  const availU = avail / U, maxTW = (mobile ? 64 : 74) / U;
  PAD = 12;
  for (let i = 0; i < 4; i++){                // капля не уже своей высоты; у крайних вкладок — запас до края бара
    TW = Math.min(maxTW, (availU - 2 * PAD) / N);
    THW = Math.max(TW - 21, THH * 1.04);
    PAD = Math.max(12, 12.5 - (TW - THW) / 2);
  }
  BW = N * TW + 2 * PAD;
  const s = bar.style;
  s.setProperty('--u', U.toFixed(5) + 'px');
  s.setProperty('--tw', TW.toFixed(3)); s.setProperty('--thw', THW.toFixed(3));
  s.setProperty('--pad', PAD.toFixed(3)); s.setProperty('--bw', BW.toFixed(3));
  const cols = `repeat(${N}, calc(${TW.toFixed(3)} * var(--u)))`;
  tabsEl.style.gridTemplateColumns = cols; if (clone) clone.style.gridTemplateColumns = cols;
  /* шрифт подписей: соседние подписи не наезжают, крайние не вылезают за бар */
  const fam = getComputedStyle(bar).fontFamily || 'system-ui, sans-serif', twPx = TW * U, padPx = PAD * U;
  let f = mobile ? 9.5 : 10.5;
  for (; f > 6.5; f -= .25){
    measure.font = `700 ${f}px ${fam}`;
    const w = labels.map(l => measure.measureText(l).width);
    let ok = w[0] / 2 <= twPx / 2 + padPx - 6 && w[N - 1] / 2 <= twPx / 2 + padPx - 6;
    for (let i = 0; ok && i < N - 1; i++) ok = (w[i] + w[i + 1]) / 2 + 4 <= twPx;
    if (ok) break;
  }
  s.setProperty('--lf', f.toFixed(2) + 'px');
  s.setProperty('--ic', (mobile ? 19 : 22) + 'px');
  document.documentElement.style.setProperty('--dock-h', (Hpx + side) + 'px');
  kick();
}

/* ---------- SVG-фильтры стекла (пересобираются под реальный размер) ---------- */
function rebuild(){
  if (!defs) return;
  lastLow = lowQ();
  if (lastLow){ defs.innerHTML = ''; lens.style.filter = ''; base.style.backdropFilter = base.style.webkitBackdropFilter = ''; return; }
  const glass = [[lens, 'ld-thumb']], bd = isChromium ? [[base, 'ld-bd-base']] : [];
  defs.innerHTML = glass.concat(bd).map(([el, id]) => filterFor(el, id)).join('');
  lens.style.filter = 'url(#ld-thumb)';
  // backdrop-filter: url(#svg) умеет только Chromium; в Safari остаётся обычное размытие из CSS
  if (isChromium){ const v = 'url(#ld-bd-base) blur(4px) saturate(1.8)'; base.style.backdropFilter = v; base.style.webkitBackdropFilter = v; }
}
const rebuildSoon = () => { clearTimeout(rt); rt = setTimeout(rebuild, 80); };

/* ---------- вкладки ---------- */
const tabHTML = (it, i) => `<button class="ld-tab" type="button" data-i="${i}" aria-label="${esc(it.label)}">
  <span class="ld-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${it.icon}</svg>${it.badge ? `<b class="ld-badge">${esc(it.badge)}</b>` : ''}</span>
  <span class="ld-lbl">${esc(it.label)}</span></button>`;
function setItems(items){
  N = items.length; labels = items.map(it => String(it.label));
  tabsEl.innerHTML = items.map(tabHTML).join('');
  clone = tabsEl.cloneNode(true); clone.removeAttribute('id'); clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('button').forEach(b => { b.tabIndex = -1; b.removeAttribute('aria-label'); });
  lens.innerHTML = ''; lens.appendChild(clone);
  tabs = [...tabsEl.children]; cloneTabs = [...clone.children];
  tabs.forEach((el, n) => el.addEventListener('click', e => {      // клавиатура (Enter/Space); мышь и палец — через pointer-события
    if (e.detail === 0){ target = n; select(n, true); kick(); }
  }));
  hi = -2; highlight(active);
  layout();
}
function highlight(i){
  if (i === hi) return; hi = i;
  tabs.forEach(el => el.style.removeProperty('--near'));
  [tabs, cloneTabs].forEach(arr => arr.forEach((el, n) => el.classList.toggle('on', n === i)));
  tabs.forEach((el, n) => n === i ? el.setAttribute('aria-current', 'page') : el.removeAttribute('aria-current'));
  bar.classList.toggle('none', i < 0);
}
function select(i, fire){
  highlight(i);
  const changed = i !== active; active = i;
  if (fire && onSelect) onSelect(i, changed);
}

/* ---------- палец: каплю можно таскать; вкладка открывается, когда палец отпущен ---------- */
function ptr(e){
  const rc = tabsEl.getBoundingClientRect(), w = TW * U;
  return (e.clientX - rc.left - PAD * U) / w;
}
function place(p, now){
  const raw = p - .5 - grab;
  target = raw < 0 ? raw * .3 : raw > N - 1 ? N - 1 + (raw - (N - 1)) * .3 : raw;   // сопротивление у краёв
  if (pT){ const dt = Math.max(.008, (now - pT) / 1000); pV += ((raw - pRaw) / dt - pV) * .35; }
  pRaw = raw; pT = now;
  highlight(clamp(Math.round(raw), 0, N - 1));
  kick();
}
function bindPointer(){
  bar.addEventListener('pointerdown', e => {
    if (e.button) return;
    bar.setPointerCapture(e.pointerId); down = true; bar.classList.add('down');
    pV = 0; pT = 0;
    const p = ptr(e); grab = active >= 0 && Math.abs(p - (cur + .5)) < .5 ? p - (cur + .5) : 0;
    place(p, e.timeStamp);
  });
  bar.addEventListener('pointermove', e => { if (down) place(ptr(e), e.timeStamp); });
  ['pointerup', 'pointercancel'].forEach(n => bar.addEventListener(n, e => {
    if (!down) return; down = false; bar.classList.remove('down');
    if (e.timeStamp - pT > 90) pV = 0;                    // палец стоял — инерции нет
    pV = clamp(pV, -9, 9);
    const dest = clamp(Math.round(pRaw + pV * .1), 0, N - 1);  // бросок «перебрасывает» каплю дальше
    if (n === 'pointercancel'){ target = active >= 0 ? active : dest; select(active, false); kick(); return; }
    target = dest;
    vel += pV * .22;                                       // импульс при отпускании
    kick();
    select(dest, true);
  }));
}

/* ---------- физика капли (из набора; константы в u обобщены на N вкладок) ---------- */
function apply(x, tx, sx, sy, p, clip){
  const s = bar.style;
  // содержимое выбранной вкладки прячется под линзой, только когда капля над ней (вкладок много — путь длинный)
  if (hi >= 0 && tabs[hi]) tabs[hi].style.setProperty('--near', clamp(1 - Math.abs(x - hi) * 1.5, 0, 1).toFixed(3));
  s.setProperty('--x', x.toFixed(4)); s.setProperty('--tx', tx.toFixed(3));
  s.setProperty('--sx', sx.toFixed(4)); s.setProperty('--sy', sy.toFixed(4)); s.setProperty('--p', p.toFixed(3));
  fil.style.clipPath = fil.style.webkitClipPath = clip ? `path('${clip}')` : 'path("M0 0 Z")';
}
function rest(){
  cur = lag = target = clamp(Math.round(target), 0, Math.max(0, N - 1));
  vel = lagv = press = pvel = mv = mvv = zz = zzv = 0; wasMoving = false;
  apply(cur, 0, 1, 1, 0, '');
}
function kick(){ if (!running && bar){ running = true; last = performance.now(); requestAnimationFrame(frame); } }
function frame(now){
  if (!bar){ running = false; return; }
  const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
  if (reduced()){                                           // без пружин: капля сразу на месте
    if (down){ cur = lag = target; apply(cur, 0, 1, 1, 0, ''); requestAnimationFrame(frame); }
    else { rest(); running = false; }
    return;
  }
  const k = down ? 210 : 230, c = down ? 22 : 1.6 * Math.sqrt(230), pk = 200, pc = 11;
  const n = 4, h = dt / n;
  for (let i = 0; i < n; i++){
    vel += (-k * (cur - target) - c * vel) * h; cur += vel * h;
    pvel += (-pk * (press - (down ? 1 : 0)) - pc * pvel) * h; press += pvel * h;
    lagv += (-180 * (lag - cur) - 2 * Math.sqrt(180) * lagv) * h; lag += lagv * h;   // «отстающее» тело капли
  }
  const vs = TW / 273, vn = vel * vs;          // скорость в «вкладках набора»: одно ощущение при любой ширине вкладки
  const moving = Math.abs(cur - target) > .1 || Math.abs(vn) > .9;
  if (wasMoving && !moving && !down) zzv -= 2.4;            // приземление: капля сплющивается и возвращается
  if (!wasMoving && moving) zzv += 1.4;                     // старт: капля «набухает»
  wasMoving = moving;
  { const mk = moving ? 380 : 900, mc = 2 * Math.sqrt(mk);
    for (let i = 0; i < 4; i++){ mvv += (-mk * (mv - (moving ? 1 : 0)) - mc * mvv) * (dt / 4); mv += mvv * (dt / 4); }
    mv = clamp(mv, -.2, 1.6); }
  { const zt = .02 * clamp(Math.abs(vn) / 6, 0, 1) + .04 * press;
    for (let i = 0; i < 4; i++){ zzv += (-170 * (zz - zt) - 1.2 * Math.sqrt(170) * zzv) * (dt / 4); zz += zzv * (dt / 4); }
    zz = clamp(zz, -.3, .3); }
  const g = (mv < 0 && press < .02) ? mv : Math.max(mv, press);
  const st = clamp(Math.abs(vn) * .055, 0, .26) * (down ? 1 : .6);
  const s = 1 + .05 * g + .06 * press, sy = 1 + .24 * g + .16 * press;
  const sm = (v, m, K) => v <= m - K ? v : m - K * Math.exp(-(v - (m - K)) / K);
  const cx = PAD + cur * TW + TW / 2;
  const horiz = w => [-sm(-(cx - w / 2), 48, 30), sm(cx + w / 2, BW + 48, 30)];
  if (Math.abs(vel) > .6) dirv = Math.sign(vel);
  const jel = clamp((cur - lag) * dirv * vs, -.55, .55);   // «желе» хвоста
  let sxv = s * (1 + st) * (1 + .48 * jel) * (1 - .45 * zz), syv = sy * (1 + zz);
  sxv = Math.min(sxv, 1.38);
  let [Lc, Rc] = horiz(THW * sxv);
  const cmp = Math.max(0, 1 - (Rc - Lc) / (THW * sxv));    // насколько сжало о стенку
  vel *= 1 - Math.min(.3, cmp * 4 * dt);
  syv *= 1 + .45 * cmp;
  const h0 = THH * syv, h1 = sm(h0, BH + 24, 14);
  sxv *= Math.sqrt(h0 / h1); syv = h1 / THH;
  [Lc, Rc] = horiz(THW * sxv);
  /* край бара «тянется» к выступившей капле и сливается с ней (как в iOS 27) */
  let d = '';
  { const Up = bar.offsetWidth / BW, r = THH / 2 * syv, cy = BH / 2, ex = r - cy;
    if (ex > 1.5){
      const OX = 60, OY = 40, f = (x, y) => ((x + OX) * Up).toFixed(1) + ' ' + ((y + OY) * Up).toFixed(1);
      const FLAT0 = BH / 2, FLAT1 = BW - BH / 2;
      const phi0 = Math.asin(cy / r), hc = Math.sqrt(r * r - cy * cy);
      const build = (kk, side, vert) => {
        const phi1 = Math.asin(Math.min(1, (cy + kk * ex) / r)), cc = side > 0 ? Rc - r : Lc + r;
        const px = cc + side * r * Math.cos(phi1), py = -(r * Math.sin(phi1) - cy);
        const tt = -py / Math.cos(phi1), Cx = px + side * tt * Math.sin(phi1), P0x = Cx + side * Math.abs(Cx - px) * 2;
        const xi = cc + side * hc;
        if (side > 0 ? P0x > FLAT1 : P0x < FLAT0) return null;
        const Y = y => vert > 0 ? y : BH - y;
        let pth = `M${f(xi, Y(0))} L${f(P0x, Y(0))} Q${f(Cx, Y(0))} ${f(px, Y(py))}`;
        for (let a = 1; a <= 8; a++){ const ph = phi1 + (phi0 - phi1) * a / 8; pth += ` L${f(cc + side * r * Math.cos(ph), Y(-(r * Math.sin(ph) - cy)))}`; }
        return pth + ' Z';
      };
      for (const side of [1, -1]) for (const vert of [1, -1]) for (const kk of [.95, .65, .4]){ const q = build(kk, side, vert); if (q){ d += q; break; } }
    }
  }
  apply(cur, (Lc + Rc) / 2 - cx, (Rc - Lc) / THW, syv, clamp(g, 0, 1), d);
  const still = !down && Math.abs(cur - target) < 5e-4 && Math.abs(vel) < 5e-3 && Math.abs(lag - cur) < 5e-4 && Math.abs(lagv) < 5e-3
    && Math.abs(press) < 1e-3 && Math.abs(pvel) < 5e-3 && Math.abs(mv) < 1e-3 && Math.abs(mvv) < 5e-3 && Math.abs(zz) < 1e-3 && Math.abs(zzv) < 5e-3;
  if (still){ rest(); running = false; return; }               // капля успокоилась — кадры больше не нужны
  requestAnimationFrame(frame);
}

/* ---------- сборка ---------- */
function mount(el){
  root = el;
  root.classList.add('ld-dock');
  root.innerHTML = `<div class="ld-bar" style="--x:0;--tx:0;--sx:1;--sy:1;--p:0">
      <div class="ld-matte"></div><div class="ld-fil"></div><div class="ld-solid"></div>
      <div class="ld-tabs"></div>
      <div class="ld-glass ld-thumb"><div class="ld-lens"></div></div>
    </div>
    <svg class="ld-svg" width="0" height="0" aria-hidden="true" focusable="false" color-interpolation-filters="sRGB"><defs></defs></svg>`;
  bar = root.querySelector('.ld-bar'); base = root.querySelector('.ld-matte'); fil = root.querySelector('.ld-fil');
  thumb = root.querySelector('.ld-thumb'); lens = root.querySelector('.ld-lens'); tabsEl = root.querySelector('.ld-tabs');
  defs = root.querySelector('defs');
  base.dataset.soft = '1';
  bindPointer();
  if (window.ResizeObserver){ const ro = new ResizeObserver(rebuildSoon); ro.observe(base); ro.observe(lens); }
  let rz = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });
  if (mq && mq.addEventListener) mq.addEventListener('change', kick);
}
function render(el, items, activeIndex, cb){
  if (!el) return;
  if (root !== el) mount(el);
  onSelect = cb;
  const key = JSON.stringify(items);
  const first = !itemsKey;
  if (key !== itemsKey){ itemsKey = key; setItems(items); }
  if (lastLow !== lowQ()) rebuildSoon();                     // сменили «качество графики»
  if (down) return;
  const i = activeIndex >= 0 && activeIndex < N ? activeIndex : -1;
  active = i; highlight(i);
  if (i >= 0){ target = i; if (first){ cur = lag = i; apply(i, 0, 1, 1, 0, ''); } }
  kick();
}
return {render};
})();
