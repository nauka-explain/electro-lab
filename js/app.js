// Комплект №3. Лабораторная работа №13 (ОГЭ): измерение работы электрического тока
const NS = 'http://www.w3.org/2000/svg';
const $ = (t, a = {}, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const el = id => document.getElementById(id);

// ---- Скрытые параметры оборудования ----
const R_ = { r1: 4.7, r2: 5.7, r3: 8.2, wa: 1.5, wb: 4.5, wc: 7.5, lamp: 9.6 }; // Ом: R-1 4,7±0,5, R-2 5,7±0,6, R-3 8,2±0,8; проволочные 1:3:5 по длине; лампа 4,8 В, 0,5 А
const RH = 10;                                                  // реостат, Ом
const NOM = { r1: 4.7, r2: 5.7, r3: 8.2 }, TOL = { r1: .5, r2: .6, r3: .8 };   // номиналы и допуски резисторов
const rollR = () => { for (const k in NOM) R_[k] = Math.round((NOM[k] + (Math.random() * 2 - 1) * TOL[k]) * 100) / 100; };
rollR();                                                        // реальное сопротивление — случайно в пределах допуска
let WORK = 13, TG = 'r2'; const RN = () => 'R-' + TG.slice(1);   // номер работы и исследуемый резистор
const fI = x => String(x).replace('.', ',');
const ERR = ['Абсолютная погрешность измерения силы тока амперметром ±0,1 А', 'Абсолютная погрешность измерения напряжения вольтметром ±0,2 В'];
const WORKS = {
  12: { ttl: 'Измерение электрического сопротивления резистора', I: 0.4, ph: 'R, Ом', ex: L => L.U2 / L.I2, tol: .15,
    task: n => ['Определите электрическое сопротивление резистора ' + n, 'Для этого соберите экспериментальную установку, используя источник тока, вольтметр, амперметр, ключ, реостат, соединительные провода и резистор, обозначенный ' + n, 'При помощи реостата установите в цепи силу тока 0,4 А', ...ERR],
    tail: ['Рассчитай сопротивление по формуле R = U / I', 'Введи результат в поле проверки'], bad: 'Проверь формулу R = U / I', okm: 'Сопротивление сходится с расчётом по закону Ома' },
  13: { ttl: 'Измерение работы электрического тока', I: 0.5, ph: 'A, Дж', ex: L => L.I2 * L.U2 * 300, tol: .1,
    task: n => ['Соберите экспериментальную установку для определения работы электрического тока, совершаемой в резисторе ' + n, 'С помощью реостата установите в цепи силу тока 0,5 А', 'Определите работу электрического тока в резисторе в течение 5 мин', ...ERR],
    tail: ['Рассчитай работу тока A = I·U·t', 'Время t = 5 мин = 300 с', 'Введи результат в поле проверки'], bad: 'Проверь формулу A = I·U·t и время в секундах', okm: 'Работа тока сходится с расчётом по формуле A = I·U·t' },
  14: { ttl: 'Измерение мощности электрического тока', I: 0.5, ph: 'P, Вт', ex: L => L.I2 * L.U2, tol: .15,
    task: n => ['Используя источник тока, вольтметр, амперметр, ключ, реостат, соединительные провода, резистор, обозначенный ' + n + ', соберите экспериментальную установку для определения мощности, выделяемой на резисторе при силе тока 0,5 А', 'Абсолютная погрешность измерения силы тока с помощью амперметра равна ±0,1 А', 'Абсолютная погрешность измерения напряжения с помощью вольтметра равна ±0,2 В'],
    tail: ['Рассчитай мощность по формуле P = I·U', 'Введи результат в поле проверки'], bad: 'Проверь формулу P = I·U', okm: 'Мощность сходится с расчётом по формуле P = I·U' },
  15: { ttl: 'Исследование зависимости силы тока в резисторе от напряжения на его концах', def: 'r1', multi: true, targets: [0.3, 0.4, 0.5],
    task: n => ['Используя источник тока, вольтметр, амперметр, ключ, реостат, соединительные провода, резистор, обозначенный ' + n + ', соберите экспериментальную установку для исследования зависимости силы электрического тока в резисторе от напряжения на его концах', 'Абсолютную погрешность измерения силы тока принять равной ±0,02 А, напряжения — ±0,1 В', 'Установите с помощью реостата поочерёдно силу тока в цепи, равную 0,3 А, 0,4 А и 0,5 А', 'Измерьте в каждом случае напряжение на концах резистора и запишите результаты в таблицу черновика', 'Сформулируйте вывод о зависимости силы тока в резисторе от напряжения на его концах'] },
};
const S = { inst: {}, wires: [], p: 0.5, key: false, last: null };
let defCol = '#d22';

// ---- Звук (WebAudio, без файлов) ----
let AC, mute = false;
const ac = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
function noise(d, v, f, q = 1, ty = 'bandpass') {
  if (mute) return;
  try {
    const c = ac(), n = c.sampleRate * d | 0, b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; bp.type = ty; bp.frequency.value = f; bp.Q.value = q; g.gain.value = v;
    s.connect(bp); bp.connect(g); g.connect(c.destination); s.start();
  } catch (e) {}
}
function blip(f, d, v, w = 'sine', dr = .5) {
  if (mute) return;
  try {
    const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = w; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * dr, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(t + d);
  } catch (e) {}
}
const SND = {
  pick: () => blip(420, .06, .12, 'triangle'),
  drop: () => { blip(140, .14, .3); noise(.04, .2, 700); },
  plug: () => { blip(260, .1, .25); noise(.03, .25, 1200); },
  key: () => { noise(.03, .6, 2000, 1.5); blip(1100, .03, .12, 'square'); },
  rot: () => noise(.26, .18, 500, .7),
  // мягкий «тик» по рёбрам: приглушённый шорох + тихая нота пентатоники
  rib(st) {                                       // не чаще ~12 тиков в секунду, чтобы быстрое движение не сливалось в скрип
    const now = performance.now(); if (now - (this.t || 0) < 85) return; this.t = now;
    const P = [0, 2, 4, 7, 9], idx = Math.floor(st * 10 / 32), n = P[idx % 5] + 12 * Math.floor(idx / 5);   // высота растёт вправо, диапазон 2 октавы
    noise(.022, .1, 1380, .6, 'lowpass'); blip(734 * Math.pow(2, n / 12), .09, .03, 'sine', .98);
  },
  rst: () => noise(.3, .2, 800),
};

// ---- Рисование компонентов (локальные координаты, начало — левый верх) ----
let G, TL, UI;
const txt = (s, x, y, c = '#222', sz = 14, a = 'middle') => { const e = $('text', { x, y, fill: c, 'font-size': sz, 'text-anchor': a, class: 'lbl' }, G); e.textContent = s; return e; };
const term = (k, x, y, kind, lab, c = '#3b2b08') => { TL.push({ k, x, y, kind }); if (lab) txt(lab, x, y + 29, c, 13); };
const line = (d, s = '#8a8f98', w = 3, ex = {}) => $('path', { d, stroke: s, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', ...ex }, G);
const board = (x, y, w, h, f = 'url(#gPlate)', st = '#8a6a1a') => {
  $('rect', { x, y, width: w, height: h, rx: 7, fill: f, stroke: st, 'stroke-width': 2, filter: 'url(#sh)' }, G);
  $('rect', { x: x + 2, y: y + 2, width: w - 4, height: h - 4, rx: 5, fill: 'none', stroke: 'rgba(255,255,255,.4)', 'stroke-width': 1.5 }, G);
};
const screws = (w, h) => [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]].forEach(([x, y]) => {
  $('circle', { cx: x, cy: y, r: 4.5, fill: 'url(#gMetal)', stroke: '#555' }, G); line(`M${x - 2.5} ${y - 2.5}l5 5`, '#444', 1);
});
// Клемма: тень, металлическое кольцо, цветной колпачок, отверстие, блик
function tm(parent, q, id) {
  const g = $('g', { class: 'tm', transform: `translate(${q.x} ${q.y})` }, parent);
  $('ellipse', { cx: 0, cy: 3.5, rx: 15, ry: 12.5, fill: 'rgba(0,0,0,.45)' }, g);
  $('circle', { r: 14, fill: 'url(#gMetal)', stroke: '#4b4f56' }, g);
  if (q.kind === 'gold') {
    $('circle', { r: 9.5, fill: 'url(#gSilverV)', stroke: '#5a5e66' }, g);
    $('circle', { r: 4.2, fill: '#0b0b0b' }, g);
  } else {
    $('circle', { r: 10.5, fill: q.kind === 'red' ? 'url(#gRed)' : 'url(#gBlk)', stroke: 'rgba(0,0,0,.6)' }, g);
    $('circle', { r: 4.6, fill: '#080808', stroke: '#000' }, g);
  }
  $('path', { d: 'M-8.5 -5A10 10 0 0 1 -1 -10', stroke: 'rgba(255,255,255,.75)', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, g);
  if (id) $('circle', { r: 15, class: 'hit', 'data-id': id }, g);
}

const small = lab => { board(0, 0, 150, 105); screws(150, 105); txt(lab, 75, 99, '#3b2b08', 15); term('a', 28, 68, 'gold'); term('b', 122, 68, 'gold'); };
const resistor = lab => {
  small(lab); line('M28 68V40H40'); line('M122 68V40H110');
  $('path', { d: 'M40 26L48 17H112L104 26Z', fill: '#fff', stroke: '#bdb7a4' }, G);                                   // верхняя грань
  $('path', { d: 'M104 26L112 17V45L104 54Z', fill: '#bdb6a2', stroke: '#9a937c' }, G);                              // боковая грань
  $('rect', { x: 40, y: 26, width: 64, height: 28, rx: 1.5, fill: 'url(#gCer)', stroke: '#a9a38d', 'stroke-width': 1.5, filter: 'url(#sh2)' }, G); // лицевая грань
  $('rect', { x: 43, y: 29, width: 58, height: 5, fill: 'rgba(255,255,255,.8)' }, G);
  txt('5 Вт', 72, 46, '#7a745f', 10);
};
const wireS = (lab, n) => {                      // проволочный резистор: длина проволоки 1 : 3 : 5
  small(lab); const yb = 34 + 4 * (n - 1);
  let d = `M36 ${yb}H114`; for (let i = 1; i < n; i++) d += `V${yb - 8 * i}H${i % 2 ? 36 : 114}`;
  line(`M28 68V${yb}H36`); line(`M122 68V${yb - 8 * (n - 1)}H114`);
  line(d, '#5d8a69', 4.5, { 'stroke-dasharray': '2.5 1.5' }); line(d, 'rgba(255,255,255,.45)', 1.4, { 'stroke-dasharray': '2.5 1.5', transform: 'translate(0 -1.5)' });
};

function meter(ttl, [u0, u1, nM, sub, l0, l1, le, du, dl], mk, ts) {
  const cx = 145, cy = 140, r = 108;
  const fmt = (v, d) => (Math.round(v * 1e6) / 1e6 + 0).toFixed(d).replace(/\.0$/, '').replace('.', ',').replace('-', '−');
  $('rect', { width: 290, height: 270, rx: 14, fill: 'url(#gDark)', stroke: '#000', 'stroke-width': 2, filter: 'url(#sh)' }, G);
  $('rect', { x: 4, y: 4, width: 282, height: 262, rx: 11, fill: 'none', stroke: 'rgba(255,255,255,.14)' }, G);
  $('rect', { x: 12, y: 10, width: 266, height: 152, rx: 6, fill: '#f6f7f9', stroke: '#050505', 'stroke-width': 3 }, G);
  $('rect', { x: 12, y: 10, width: 266, height: 152, rx: 6, fill: 'url(#gInner)' }, G);
  const pt = (f, q) => { const a = (-50 + 100 * f) * Math.PI / 180; return [cx + q * Math.sin(a), cy - q * Math.cos(a)]; };
  line(`M${pt(0, r)}A${r} ${r} 0 0 1 ${pt(1, r)}`, '#111', 1.5);
  const n = nM * sub;
  for (let i = 0; i <= n; i++) {                // одна общая шкала
    const f = i / n, mj = i % sub === 0, [x1, y1] = pt(f, r), [x2, y2] = pt(f, r - (mj ? 12 : 6));
    line(`M${x1} ${y1}L${x2} ${y2}`, '#111', mj ? 2 : 1);
    if (mj) {
      let [lx, ly] = pt(f, r + 12); txt(fmt(u0 + (u1 - u0) * f, du), lx, ly + 4, '#111', 12);                 // цифры над шкалой
      if ((i / sub) % le === 0) { [lx, ly] = pt(f, r - 26); txt(fmt(l0 + (l1 - l0) * f, dl), lx, ly + 4, '#111', 12); } // цифры под шкалой
    }
  }
  txt(ttl, cx, cy - 40, '#111', 26).setAttribute('font-weight', 'bold');
  line('M22 148.5H38', '#333', 1.4); line('M22 153.5H38', '#333', 1.4, { 'stroke-dasharray': '3 2' });   // знак постоянного тока
  if (mk) txt(mk, 46, 154, '#333', 11, 'start'); txt('⊓ ∠ ☆ 2,5', 266, 153, '#333', 11, 'end');
  const g = $('g', { class: 'needle' }, G); g.style.transformOrigin = `${cx}px ${cy}px`; g.style.transform = 'rotate(-25deg)';
  $('path', { d: `M${cx} ${cy + 14}V${cy - 112}`, stroke: '#111', 'stroke-width': 2.5 }, g);
  $('circle', { cx, cy, r: 9, fill: 'url(#gMetal)', stroke: '#444' }, g);
  $('path', { d: 'M82 162Q88 132 145 130Q202 132 208 162Z', fill: 'rgba(255,255,255,.3)', stroke: 'rgba(255,255,255,.75)' }, G); // прозрачный пластик
  $('path', { d: 'M14 12H196L14 124Z', fill: 'url(#gGlare)' }, G);                                                  // блик на стекле
  $('path', { d: 'M20 132Q60 128 98 118', stroke: 'rgba(255,255,255,.35)', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, G);
  $('rect', { x: 18, y: 186, width: 254, height: 78, rx: 6, fill: 'url(#gMPlate)', stroke: '#0a1040', 'stroke-width': 2 }, G);
  $('rect', { x: 20, y: 188, width: 250, height: 74, rx: 5, fill: 'none', stroke: 'rgba(255,255,255,.2)' }, G);
  ts.forEach(([k, dx, kind, lab]) => term(k, dx, 226, kind, lab, '#fff'));
  UI.needle = g;
}

const TYPES = {
  r1: { n: 'Резистор R-1', w: 150, h: 105, s: [20, 20], d: () => resistor('R-1') },
  r2: { n: 'Резистор R-2', w: 150, h: 105, s: [185, 20], d: () => resistor('R-2') },
  r3: { n: 'Резистор R-3', w: 150, h: 105, s: [350, 20], d: () => resistor('R-3') },
  key: { n: 'Ключ', w: 150, h: 105, s: [515, 20], d() {
    small('Ключ'); line('M28 68V45'); line('M122 68V45');
    for (const x of [28, 122]) $('circle', { cx: x, cy: 45, r: 8, fill: 'url(#gMetal)', stroke: '#555' }, G);
    const lev = $('g', { class: 'lever' }, G), halo = $('path', { class: 'halo', stroke: '#ffe14d', 'stroke-width': 17, 'stroke-linecap': 'round', fill: 'none' }, lev), lv = $('path', { stroke: '#a8782a', 'stroke-width': 8, 'stroke-linecap': 'round' }, lev),
      lh = $('path', { stroke: '#ffe5a0', 'stroke-width': 2.5, 'stroke-linecap': 'round', transform: 'translate(0 -2)' }, lev),
      hit = $('path', { stroke: 'transparent', 'stroke-width': 28, 'stroke-linecap': 'round' }, lev);
    UI.setKey = () => { const d = S.key ? 'M28 45L122 45' : 'M28 45L108 12'; [halo, lv, lh, hit].forEach(p => p.setAttribute('d', d)); };
  } },
  rh: { n: 'Реостат 10 Ом', w: 300, h: 140, s: [680, 20], d() {
    board(0, 0, 300, 140); screws(300, 140); txt('Реостат 10 Ом', 150, 22, '#3b2b08', 15);
    $('rect', { x: 48, y: 56, width: 204, height: 44, rx: 20, fill: 'url(#gTube)', stroke: '#4d2410', 'stroke-width': 2, filter: 'url(#sh2)' }, G);
    for (let x = 62; x < 240; x += 5) { line(`M${x} 58V98`, '#cfd3d8', 2.2); line(`M${x + 2.2} 58V98`, 'rgba(0,0,0,.45)', 1); }
    $('rect', { x: 50, y: 58, width: 200, height: 10, rx: 5, fill: 'rgba(255,255,255,.22)' }, G);
    $('rect', { x: 30, y: 30, width: 240, height: 8, rx: 4, fill: 'url(#gSilverV)', stroke: '#666' }, G);
    line('M45 118V80H56'); line('M255 118V80H244');
    term('s', 35, 34, 'gold'); term('l', 45, 118, 'gold'); term('r', 255, 118, 'gold');
    const k = $('g', { class: 'knob' }, G);
    $('rect', { class: 'halo', x: -19, y: -21, width: 38, height: 42, rx: 10, fill: 'none', stroke: '#ffe14d', 'stroke-width': 4 }, k);
    $('path', { d: 'M0 12V32', stroke: '#555', 'stroke-width': 3.5 }, k);
    $('rect', { x: -14, y: -16, width: 28, height: 32, rx: 6, fill: 'url(#gDark)', stroke: '#000', filter: 'url(#sh2)' }, k);
    for (const i of [-8, -3, 2, 7]) $('path', { d: `M${i} -11V11`, stroke: 'rgba(255,255,255,.2)', 'stroke-width': 1.5 }, k);
    UI.knob = k;
  } },
  vm: { n: 'Вольтметр', w: 290, h: 270, s: [20, 190], d: () => meter('V', [-2, 6, 8, 5, -1, 3, 2, 0, 0], '', [['m', 60, 'blk', '−'], ['v3', 145, 'red', '3 В'], ['v6', 230, 'red', '6 В']]) },
  am: { n: 'Амперметр', w: 290, h: 270, s: [690, 190], d: () => meter('A', [-1, 3, 4, 10, -0.2, 0.6, 1, 0, 1], 'J0407', [['m', 60, 'blk', '−'], ['a6', 145, 'red', '0,6 А'], ['a3', 230, 'red', '3 А']]) },
  bat: { n: 'Источник тока (4 элемента по 1,5 В)', w: 310, h: 250, s: [345, 190], d() {
    board(0, 0, 310, 250, 'url(#gBlue)', '#1f6a99'); screws(310, 250);
    $('rect', { x: 40, y: 26, width: 230, height: 154, rx: 8, fill: 'url(#gDark)', stroke: '#000', 'stroke-width': 2 }, G);
    for (let i = 0; i < 4; i++) {                // элементы AA в лотках
      const x = 50 + i * 54;
      $('rect', { x, y: 34, width: 46, height: 138, rx: 5, fill: '#060606' }, G);
      line(`M${x + 12} 166h22`, '#9aa0aa', 1.5); line(`M${x + 15} 170h16`, '#9aa0aa', 1.5);
      const c = $('g', { filter: 'url(#sh2)' }, G);
      $('rect', { x: x + 17, y: 42, width: 12, height: 8, rx: 2, fill: 'url(#gSilverH)' }, c);                       // плюсовой контакт
      $('path', { d: `M${x + 5} 58L${x + 9} 50H${x + 37}L${x + 41} 58Z`, fill: 'url(#gSilverH)' }, c);               // верхняя крышка
      $('rect', { x: x + 5, y: 57, width: 36, height: 98, rx: 3, fill: 'url(#gCell)', stroke: '#000' }, c);         // корпус
      $('rect', { x: x + 5, y: 62, width: 36, height: 7, fill: '#d9a21b' }, c); $('rect', { x: x + 5, y: 142, width: 36, height: 7, fill: '#d9a21b' }, c);
      $('rect', { x: x + 5, y: 154, width: 36, height: 5, rx: 2, fill: 'url(#gSilverH)' }, c);                      // минусовой контакт
      $('rect', { x: x + 10, y: 60, width: 5, height: 92, rx: 2.5, fill: 'rgba(255,255,255,.22)' }, c);
      $('rect', { x: x + 34, y: 60, width: 6, height: 92, rx: 3, fill: 'rgba(0,0,0,.3)' }, c);
      txt('+', x + 23, 86, '#f2d27a', 15);
      txt('AA', 0, 0, '#f2d27a', 11).setAttribute('transform', `translate(${x + 28} 98) rotate(-90)`);
      txt('1.5V', 0, 0, '#f2d27a', 12).setAttribute('transform', `translate(${x + 28} 122) rotate(-90)`);
    }
    term('p6', 55, 215, 'red', '+6 В', '#052'); term('p3', 155, 215, 'red', '+3 В', '#052'); term('m', 255, 215, 'blk', '−', '#052');
  } },
  wa: { n: 'Проволочный резистор А (короткий)', w: 150, h: 105, s: [20, 480], d: () => wireS('А', 1) },
  wb: { n: 'Проволочный резистор Б (средний)', w: 150, h: 105, s: [185, 480], d: () => wireS('Б', 3) },
  wc: { n: 'Проволочный резистор В (длинный)', w: 150, h: 105, s: [350, 480], d: () => wireS('В', 5) },
  lamp: { n: 'Лампа 4,8 В, 0,5 А', w: 150, h: 105, s: [515, 480], d() {
    small('4,8 В · 0,5 А'); line('M28 68V54H62'); line('M122 68V54H88');
    $('rect', { x: 62, y: 46, width: 26, height: 18, rx: 3, fill: 'url(#gSilverH)', stroke: '#555' }, G);
    line('M62 51h26M62 56h26M62 61h26', '#777', 1);
    $('circle', { cx: 75, cy: 28, r: 22, fill: 'rgba(215,232,245,.55)', stroke: '#8fa3b3', 'stroke-width': 2 }, G);
    UI.glow = $('circle', { cx: 75, cy: 28, r: 20, fill: '#ffd93b', opacity: 0 }, G);
    line('M68 46V34l7-8 7 8v12', '#555', 1.5);
    $('path', { d: 'M62 18a15 15 0 0 1 10-6', stroke: '#fff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, G);
  } },
};
const knobPos = k => k.setAttribute('transform', `translate(${70 + S.p * 160} 34)`);

function build(t, parent, circ) {
  G = $('g', { class: 'body', 'data-inst': t, 'data-name': TYPES[t].n }, parent); TL = []; UI = {};
  $('rect', { class: 'outline', x: -5, y: -5, width: TYPES[t].w + 10, height: TYPES[t].h + 10, rx: 10, fill: 'none' }, G);
  TYPES[t].d();
  if (circ) TL.forEach(q => tm(G, q));
  if (UI.setKey) UI.setKey(); if (UI.knob) knobPos(UI.knob);
  return { g: G, tl: TL, ui: UI };
}
const TERM = {}; for (const t in TYPES) TERM[t] = build(t, $('g')).tl;

// ---- Сцена ----
const gC = $('g', {}, el('case')), gI = el('gI'), gW = el('gW'), gT = el('gT'), gR = el('gR');
const desk = el('desk'), world = el('world'), caseEl = el('case'), fl = el('fl'), fs = el('fs'), fg = el('fg');
let RT = {}; const V = { z: 1, tx: 1e9, ty: 1e9 };
const AREA = { x: -100, y: -100, w: 2500, h: 1600 };                       // рабочая область стола
const fit = (t, sz, z, a0, aw) => { const lo = sz - (a0 + aw) * z, hi = -a0 * z; return lo > hi ? (sz - aw * z) / 2 - a0 * z : Math.max(lo, Math.min(hi, t)); };
const minZ = () => { const r = desk.getBoundingClientRect(); return Math.min(r.width / AREA.w, r.height / AREA.h); };
function applyView() {                                                     // при минимальном масштабе видна вся область, сдвиг невозможен
  const r = desk.getBoundingClientRect(); V.z = Math.max(minZ(), Math.min(2.5, V.z));
  V.tx = fit(V.tx, r.width, V.z, AREA.x, AREA.w); V.ty = fit(V.ty, r.height, V.z, AREA.y, AREA.h);
  world.setAttribute('transform', `translate(${V.tx} ${V.ty}) scale(${V.z})`); el('zoom').textContent = Math.round(V.z * 100) + '%';
}
function centerView() { const r = desk.getBoundingClientRect(); V.z = 1; V.tx = r.width / 2 - (AREA.x + AREA.w / 2); V.ty = r.height / 2 - (AREA.y + AREA.h / 2); applyView(); }
function zoomAt(x, y, nz) { nz = Math.max(minZ(), Math.min(2.5, nz)); V.tx = x - (x - V.tx) * nz / V.z; V.ty = y - (y - V.ty) * nz / V.z; V.z = nz; applyView(); }

const tp = id => {
  const [t, k] = id.split('.'), q = TERM[t].find(z => z.k === k), p = S.inst[t], T = TYPES[t];
  const a = (RT[t] ? RT[t].a : (p.r || 0) * 90) * Math.PI / 180, dx = q.x - T.w / 2, dy = q.y - T.h / 2;
  return { x: p.x + T.w / 2 + dx * Math.cos(a) - dy * Math.sin(a), y: p.y + T.h / 2 + dx * Math.sin(a) + dy * Math.cos(a) };
};
function place(t) {
  const p = S.inst[t], R = RT[t], T = TYPES[t], tr = `translate(${p.x} ${p.y}) rotate(${R.a} ${T.w / 2} ${T.h / 2})`;
  R.g.setAttribute('transform', tr); R.tg.setAttribute('transform', tr);
  R.rb.setAttribute('transform', `translate(${p.x + T.w / 2} ${p.y + T.h / 2 - Math.min(T.w, T.h) / 2 - 26})`);
}
function addInst(t) {
  const { g, tl, ui } = build(t, gI), tg = $('g', { 'data-inst': t, 'data-name': TYPES[t].n }, gT);
  tl.forEach(q => tm(tg, q, t + '.' + q.k));
  const rb = $('g', { class: 'rb', 'data-inst': t, 'data-name': 'Повернуть по часовой стрелке (R)' }, gR);
  $('circle', { r: 16, fill: '#fff', stroke: '#14202e', 'stroke-width': 2, filter: 'url(#sh2)' }, rb);
  $('path', { d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5', transform: 'translate(-9.6 -9.6) scale(.8)', stroke: '#14202e', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, rb);
  RT[t] = { g, tg, rb, ui, a: (S.inst[t].r || 0) * 90 }; place(t);
}
function render() {
  gC.innerHTML = ''; gI.innerHTML = ''; gT.innerHTML = ''; gR.innerHTML = ''; RT = {};
  $('rect', { width: 1000, height: 600, rx: 30, fill: '#1d70c4' }, gC);
  $('rect', { x: 8, y: 8, width: 984, height: 584, rx: 22, fill: '#171717' }, gC);
  const lb = $('text', { x: 975, y: 572, fill: '#4a4a4a', 'font-size': 22, 'text-anchor': 'end', 'font-weight': 'bold', 'pointer-events': 'none' }, gC); lb.textContent = 'Комплект № 3';
  for (const t in TYPES) {
    const T = TYPES[t];
    if (S.inst[t]) $('rect', { x: T.s[0], y: T.s[1], width: T.w, height: T.h, rx: 8, fill: 'none', stroke: '#444', 'stroke-width': 3, 'stroke-dasharray': '10 8' }, gC);
    else build(t, gC, true).g.setAttribute('transform', `translate(${T.s[0]} ${T.s[1]})`);
  }
  for (const t in S.inst) addInst(t);
  for (const k of [...SEL]) if (!S.inst[k]) SEL.delete(k);
  applySel(); redrawWires(); recompute();
}

// ---- Провода: качание (пружинная модель) ----
const RW = new WeakMap(), rw = w => RW.get(w) || (RW.set(w, {}), RW.get(w));
let wd = null;                                   // провод, который сейчас тянут
function redrawWires() {
  gW.innerHTML = '';
  S.wires.forEach((w, i) => {
    const g = $('g', { class: 'wire', 'data-i': i }, gW), o = rw(w);
    o.el = [$('path', { stroke: '#000', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', opacity: .45 }, g), $('path', { stroke: w.c, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g)];
    $('path', { stroke: 'rgba(255,255,255,.35)', 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round', transform: 'translate(0 -1.5)', class: 'hl' }, g);
    o.el.push(g.lastChild); o.d = null;
  });
}
function wstep(o, a, b, dt) {
  const q = o.q || (o.q = { o: 0, vo: 0, s: 0, vs: 0, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  if (o.imp) { q.vs += o.imp[0]; q.vo += o.imp[1]; o.imp = 0; }
  q.o = Math.max(-50, Math.min(50, q.o - (mx - q.mx) * .6)); q.s = Math.max(-40, Math.min(40, q.s - (my - q.my) * .5)); q.mx = mx; q.my = my;
  q.vo += (-140 * q.o - 5 * q.vo) * dt; q.o += q.vo * dt; q.vs += (-140 * q.s - 5 * q.vs) * dt; q.s += q.vs * dt;
  const sg = 30 + Math.hypot(b.x - a.x, b.y - a.y) * .2 + q.s, f = n => n.toFixed(1);
  const d = `M${f(a.x)} ${f(a.y)}C${f(a.x + q.o)} ${f(a.y + sg)} ${f(b.x + q.o)} ${f(b.y + sg)} ${f(b.x)} ${f(b.y)}`;
  if (d !== o.d) { o.d = d; if (o.el) o.el.forEach(e => e.setAttribute('d', d)); }
}
let tLast = performance.now();
function loop(now) {
  const dt = Math.min(.033, (now - tLast) / 1000); tLast = now;
  S.wires.forEach(w => { if (S.inst[w.a.split('.')[0]] && S.inst[w.b.split('.')[0]]) wstep(rw(w), tp(w.a), tp(w.b), dt); });
  if (wd) wstep(wd, tp(wd.from), wd.end, dt);
  updFrame();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
function startWd(id, e) {
  const g = $('g', { 'pointer-events': 'none' }, gW);
  wd = { from: id, end: world_(e), sx: e.clientX, sy: e.clientY, moved: false, follow: false, g, el: [] };
  wd.el.push($('path', { stroke: '#000', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', opacity: .35 }, g), $('path', { stroke: defCol, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: .85 }, g));
}
const endWd = () => { if (wd) wd.g.remove(); wd = null; };
function addWire(a, b) {
  if (S.wires.some(w => (w.a === a && w.b === b) || (w.a === b && w.b === a))) return;
  const w = { a, b, c: defCol }; S.wires.push(w); redrawWires(); rw(w).imp = [(Math.random() < .5 ? -1 : 1) * 170, (Math.random() < .5 ? -1 : 1) * 90];
  recompute(); commit(); SND.plug();
}

// ---- Физика ----
function calc(keyOn) {
  const on = k => !!S.inst[k], par = {}, f = i => { if (!(i in par)) par[i] = i; return par[i] === i ? i : (par[i] = f(par[i])); };
  S.wires.forEach(w => { par[f(w.a)] = f(w.b); });
  const nodeOf = {}; let n = 1; nodeOf[f(on('bat') ? 'bat.m' : '_')] = 0;
  const N = i => { const r = f(i); if (!(r in nodeOf)) nodeOf[r] = n++; return nodeOf[r]; };
  const res = [], vs = [], R = (a, b, r) => res.push([N(a), N(b), r]);
  for (const k of ['r1', 'r2', 'r3', 'wa', 'wb', 'wc', 'lamp']) if (on(k)) R(k + '.a', k + '.b', R_[k]);
  if (on('key')) R('key.a', 'key.b', keyOn ? 0.01 : 1e9);
  if (on('rh')) { R('rh.s', 'rh.l', RH * S.p + 0.01); R('rh.s', 'rh.r', RH * (1 - S.p) + 0.01); }
  if (on('am')) { R('am.a6', 'am.m', 0.1); R('am.a3', 'am.m', 0.02); }
  if (on('vm')) { R('vm.v3', 'vm.m', 3000); R('vm.v6', 'vm.m', 6000); }
  if (on('bat')) { vs.push([N('bat.n1'), N('bat.m'), 3]); R('bat.n1', 'bat.p3', 0.15); vs.push([N('bat.n2'), N('bat.p3'), 3]); R('bat.n2', 'bat.p6', 0.15); }
  const v = solve(n, res, vs), g = id => { const r = f(id); return r in nodeOf ? v[nodeOf[r]] : 0; }, Vd = (a, b) => g(a) - g(b);
  const has = id => S.wires.some(w => w.a === id || w.b === id), o = { hasA: false, hasV: false, Ia: 0, ra: 3, Uv: 0, rv: 6, short: false, Pl: 0 };
  if (on('am')) { if (has('am.a6')) { o.Ia = Vd('am.a6', 'am.m') / 0.1; o.ra = 0.6; o.hasA = true; } else if (has('am.a3')) { o.Ia = Vd('am.a3', 'am.m') / 0.02; o.hasA = true; } }
  if (on('vm')) { if (has('vm.v3')) { o.Uv = Vd('vm.v3', 'vm.m'); o.rv = 3; o.hasV = true; } else if (has('vm.v6')) { o.Uv = Vd('vm.v6', 'vm.m'); o.hasV = true; } }
  if (on('lamp')) o.Pl = Math.pow(Vd('lamp.a', 'lamp.b'), 2) / R_.lamp;
  o.short = on('bat') && Vd('bat.n1', 'bat.p3') / 0.15 > 2;
  o.U2 = on(TG) ? Vd(TG + '.a', TG + '.b') : 0; o.I2 = o.U2 / R_[TG];
  return o;
}
function recompute() {
  const c = calc(S.key), ang = x => 'rotate(' + (-50 + 100 * Math.max(-0.02, Math.min(1.1, x))) + 'deg)', w = [];
  if (RT.am) { RT.am.ui.needle.style.transform = ang(0.25 + 0.75 * c.Ia / c.ra); if (Math.abs(c.Ia) > c.ra * 1.2) w.push('Перегрузка амперметра\nВыбери другой предел или проверь схему'); }
  if (RT.vm) { RT.vm.ui.needle.style.transform = ang(0.25 + 0.75 * c.Uv / c.rv); if (Math.abs(c.Uv) > c.rv * 1.2) w.push('Перегрузка вольтметра\nВыбери предел 6 В'); }
  if (RT.lamp) RT.lamp.ui.glow.setAttribute('opacity', Math.min(1, c.Pl / 2.4));
  if (c.short) w.push('Короткое замыкание источника тока');
  S.last = S.inst[TG] ? { I2: c.I2, U2: c.U2 } : null;
  el('warn').textContent = w.join('\n');
}
const syncUI = () => { if (RT.key) RT.key.ui.setKey(); if (RT.rh) knobPos(RT.rh.ui.knob); };

// ---- История: отмена / повтор / заново ----
const snap = () => JSON.stringify({ inst: S.inst, wires: S.wires.map(({ a, b, c }) => ({ a, b, c })), p: S.p, key: S.key });
let hist = [snap()], hi = 0;
const histBtns = () => { el('undo').disabled = hi === 0; el('redo').disabled = hi === hist.length - 1; };
function commit() { const s = snap(); if (s === hist[hi]) return; hist.length = hi + 1; hist.push(s); hi++; histBtns(); }
const load = s => { Object.assign(S, JSON.parse(s)); render(); histBtns(); };
const undo = () => { if (hi > 0) load(hist[--hi]); };
const redo = () => { if (hi < hist.length - 1) load(hist[++hi]); };
const restart = () => { endWd(); rollR(); Object.assign(S, { inst: {}, wires: [], p: 0.5, key: false }); SEL.clear(); render(); centerView(); commit(); SND.rst(); };
el('undo').onclick = undo; el('redo').onclick = redo; el('restart').onclick = restart;

// ---- Поворот по часовой стрелке (плавно) ----
function rot(t) {                                  // поворот на 90° по часовой стрелке; выделенная группа вращается вокруг общего центра
  const keys = SEL.has(t) && selKeys().length > 1 ? selKeys() : [t];
  if (keys.some(k => !S.inst[k] || !RT[k] || RT[k].busy)) return;
  const c0 = {}, a0 = {}; let px = 0, py = 0;
  keys.forEach(k => { c0[k] = ctr(k); a0[k] = RT[k].a; px += c0[k].x; py += c0[k].y; RT[k].busy = true; S.inst[k].r = (S.inst[k].r || 0) + 1; });
  px /= keys.length; py /= keys.length; SND.rot(); const t0 = performance.now(), q = v => Math.round(v * 100) / 100;
  const step = now => {
    const kk = Math.min(1, (now - t0) / 380), e = 1 - Math.pow(1 - kk, 3), th = e * Math.PI / 2, cs = Math.cos(th), sn = Math.sin(th);
    keys.forEach(k => {
      const R = RT[k]; if (!R || !S.inst[k]) return; const T = TYPES[k], dx = c0[k].x - px, dy = c0[k].y - py;
      S.inst[k].x = q(px + dx * cs - dy * sn - T.w / 2); S.inst[k].y = q(py + dx * sn + dy * cs - T.h / 2); R.a = a0[k] + 90 * e; place(k);
    });
    if (kk < 1) requestAnimationFrame(step); else { keys.forEach(k => { if (RT[k]) RT[k].busy = false; }); commit(); }
  };
  requestAnimationFrame(step);
}

// ---- Подсказка-лампочка: следующий этап ----
function reachHint(T) {                            // хватает ли диапазона реостата при выбранной клемме источника
  const p0 = S.p; S.p = 1; const lo = calc(true).I2; S.p = 0; const hi = calc(true).I2; S.p = p0;
  if (lo > T + 0.03) return 'Даже при полном сопротивлении реостата ток больше ' + fI(T) + ' А\nПодключи источник к клемме +3 В';
  if (hi < T - 0.03) return 'Силы тока ' + fI(T) + ' А при этом напряжении не получить\nПодключи источник к клемме +6 В';
  return '';
}
function hint() {
  const num = id => parseFloat(el(id).value.replace(',', '.')), W = WORKS[WORK];
  const need = [[['bat'], 'источник тока (батарейный блок)'], [['key'], 'ключ'], [['rh'], 'реостат'], [['am'], 'амперметр'], [['vm'], 'вольтметр'], [[TG], 'резистор ' + RN()]];
  const miss = need.filter(([ks]) => !ks.some(k => S.inst[k])).map(n => n[1]);
  if (miss.length) return 'Достань из кейса и положи на стол:\n' + miss.join(', ');
  const c = calc(true);
  if (c.I2 < 0.02) return 'Цепь пока не замкнута\nСоедини последовательно: источник тока, ключ, реостат, амперметр, резистор ' + RN() + '\nЗажми клемму и протяни провод до другой клеммы';
  if (!c.hasA || Math.abs(c.Ia) < 0.8 * c.I2) return 'Амперметр включи в цепь последовательно\nИспользуй клемму «−» и клемму 0,6 А';
  if (c.Ia < 0) return 'Поменяй полярность амперметра\nТок должен входить в клемму 0,6 А';
  if (!c.hasV || Math.abs(Math.abs(c.Uv) - Math.abs(c.U2)) > 0.3) return 'Подключи вольтметр параллельно резистору ' + RN() + '\nВыбери предел 3 В или 6 В';
  if (c.Uv < 0) return 'Поменяй полярность вольтметра\nКлемма «−» — к стороне резистора, ближе к минусу источника';
  if (!S.key) return 'Замкни ключ\nКликни по его рычагу';
  if (W.multi) {
    const rows = [1, 2, 3].map(i => [num('i' + i), num('u' + i)]), nx = rows.findIndex(([i, u]) => isNaN(i) || isNaN(u));
    if (nx < 0) return el('conc').value ? 'Всё готово\nНажми «Проверить»' : 'Сравни отношение U / I в трёх опытах\nВыбери вывод в поле проверки';
    const T = W.targets[nx];
    if (Math.abs(c.I2 - T) > 0.03) return 'Опыт ' + (nx + 1) + '\n' + (reachHint(T) || 'Установи силу тока ' + fI(T) + ' А ползунком реостата');
    return 'Опыт ' + (nx + 1) + '\nСчитай показания амперметра и вольтметра\nЗапиши I и U в строку ' + (nx + 1) + ' таблицы';
  }
  if (Math.abs(c.I2 - W.I) > 0.05) return reachHint(W.I) || 'Установи силу тока ' + fI(W.I) + ' А\nДвигай ползунок реостата и следи за амперметром';
  if (isNaN(num('dI')) || isNaN(num('dU'))) return 'Считай показания приборов по стрелкам\nЗапиши силу тока I и напряжение U в черновик';
  if (isNaN(num('ans'))) return W.tail.join('\n');
  return 'Всё готово\nНажми «Проверить»';
}
let hintT; const hb = el('hint');
const showHint = () => { hb.textContent = hint(); hb.hidden = false; clearTimeout(hintT); hintT = setTimeout(() => hb.hidden = true, 6000); };
el('hintBtn').onclick = showHint;
el('snd').onclick = () => { mute = !mute; el('snd').classList.toggle('off', mute); el('snd').dataset.tip = mute ? 'Звук: выкл (M)' : 'Звук: вкл (M)'; };

// ---- Подсказки при наведении и подсветка ----
const tip = el('tip'), pop = el('pop'); let hov = null, hovT, tipT, mx = 0, my = 0, drag = null;
const hl = (n, on) => n && document.querySelectorAll(`[data-inst="${n.dataset.inst}"].body,[data-inst="${n.dataset.inst}"].rb`).forEach(b => b.classList.toggle('hov', on));
const hideTip = () => { clearTimeout(tipT); tip.hidden = true; };
document.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
document.addEventListener('pointerover', e => {
  const n = e.target.closest && e.target.closest('[data-name]');
  if (n) {
    clearTimeout(hovT); if (n === hov) return;
    hl(hov, false); hideTip(); hov = n; hl(n, true);
    tipT = setTimeout(() => { if (drag) return; tip.textContent = n.dataset.name; tip.style.left = mx + 14 + 'px'; tip.style.top = my + 18 + 'px'; tip.hidden = false; }, 700);
  } else if (hov) { hideTip(); hovT = setTimeout(() => { hl(hov, false); hov = null; }, 250); }
});

// ---- Масштаб и сдвиг стола ----
desk.addEventListener('wheel', e => {
  e.preventDefault(); const r = desk.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, V.z * Math.exp(-e.deltaY * 0.0015));
}, { passive: false });
el('zoom').onclick = () => { const r = desk.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1); };
function world_(e) { const r = desk.getBoundingClientRect(); return { x: (e.clientX - r.left - V.tx) / V.z, y: (e.clientY - r.top - V.ty) / V.z }; }
const inR = (e, r) => e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;

// ---- Выделение (как ярлыки на рабочем столе) ----
const SEL = new Set(); let spaceDown = false; const mq = el('mq');
let selStrong = false;                                  // «явное» выделение: рамка, Ctrl+клик, Ctrl+A (простой клик по прибору — слабое)
const applySel = () => { const grp = SEL.size > 1; for (const k in RT) { RT[k].g.classList.toggle('sel', SEL.has(k)); RT[k].g.classList.toggle('grp', grp && SEL.has(k)); } };
const gS = el('gS'), sf = $('rect', { class: 'sf', rx: 14, display: 'none' }, gS), chip = $('g', { class: 'chip', display: 'none' }, gS);
$('rect', { width: 108, height: 24, rx: 12, fill: '#4aa3ff' }, chip);
const chipT = $('text', { x: 54, y: 17, 'text-anchor': 'middle', fill: '#fff', 'font-size': 13, 'font-weight': 600, class: 'lbl' }, chip);
let frameKey = '';
function updFrame() {                                   // общая рамка вокруг выделенной группы
  const ks = selKeys(), show = ks.length > 1 && !(drag && drag.mv) && ks.every(k => RT[k]);
  if (!show) { if (frameKey) { sf.setAttribute('display', 'none'); chip.setAttribute('display', 'none'); frameKey = ''; } return; }
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  ks.forEach(k => { const q = bbox(k); x0 = Math.min(x0, q.x0); y0 = Math.min(y0, q.y0); x1 = Math.max(x1, q.x1); y1 = Math.max(y1, q.y1); });
  x0 -= 16; y0 -= 16; x1 += 16; y1 += 16;
  const key = [x0, y0, x1, y1, ks.length].map(v => Math.round(v * 10)).join(); if (key === frameKey) return; frameKey = key;
  sf.setAttribute('x', x0); sf.setAttribute('y', y0); sf.setAttribute('width', x1 - x0); sf.setAttribute('height', y1 - y0); sf.setAttribute('display', '');
  chip.setAttribute('transform', `translate(${x0} ${y0 - 30})`); chip.setAttribute('display', ''); chipT.textContent = 'Группа: ' + ks.length;
}
const selKeys = () => [...SEL].filter(k => S.inst[k]);
const ctr = k => { const I = S.inst[k], T = TYPES[k]; return { x: I.x + T.w / 2, y: I.y + T.h / 2 }; };
function bbox(k) {
  const T = TYPES[k], a = RT[k].a * Math.PI / 180, c = ctr(k), ex = Math.abs(Math.cos(a)) * T.w / 2 + Math.abs(Math.sin(a)) * T.h / 2, ey = Math.abs(Math.sin(a)) * T.w / 2 + Math.abs(Math.cos(a)) * T.h / 2;
  return { x0: c.x - ex, x1: c.x + ex, y0: c.y - ey, y1: c.y + ey };
}
function toCase(keys) {
  keys.forEach(k => { delete S.inst[k]; SEL.delete(k); });
  S.wires = S.wires.filter(w => !keys.includes(w.a.split('.')[0]) && !keys.includes(w.b.split('.')[0])); render();
}

// ---- Перенос одного или нескольких компонентов через плавающий слой (поверх кейса и стола) ----
function lift(keys, g, ox, oy, fromCase, e) {
  const cg = ctr(g), off = {};
  keys.forEach(k => {
    const R = RT[k], T = TYPES[k], c = ctr(k); off[k] = { x: c.x - cg.x, y: c.y - cg.y };
    const tr = `translate(${off[k].x - ox} ${off[k].y - oy}) rotate(${R.a}) translate(${-T.w / 2} ${-T.h / 2})`;
    fg.append(R.g, R.tg); R.g.setAttribute('transform', tr); R.tg.setAttribute('transform', tr); R.rb.style.display = 'none';
  });
  const cs = caseEl.getBoundingClientRect().width / 1000;
  fl.setAttribute('transform', `translate(${e.clientX} ${e.clientY})`);
  fs.style.transition = 'none'; fs.style.transform = `scale(${fromCase ? cs : V.z})`; void fs.getBoundingClientRect();
  fs.style.transition = ''; fs.style.transform = `scale(${V.z})`;      // «вырастает» до масштаба стола
  document.body.classList.add('dragging'); hideTip();
  return { mv: 1, keys, g, ox, oy, off, left: !fromCase, cs, k: V.z };
}
function unlift(k) { const R = RT[k]; gI.appendChild(R.g); gT.appendChild(R.tg); R.rb.style.display = ''; place(k); }

document.addEventListener('pointerdown', e => {
  try { ac().resume(); } catch (x) {}
  const t = e.target; hideTip();
  if (!t.closest('#pop')) pop.hidden = true;
  if (t.closest('button,input,textarea,a,#pop,#help')) return;
  const isBg = t.id === 'bg' || t === desk;
  if (e.button === 1 || (e.button === 2 && isBg) || (e.button === 0 && spaceDown && desk.contains(t))) {   // сдвиг стола
    e.preventDefault(); drag = { pan: 1, x: e.clientX, y: e.clientY, tx: V.tx, ty: V.ty }; document.body.classList.add('dragging'); return;
  }
  if (e.button !== 0) return;
  const id = t.dataset && t.dataset.id;
  if (wd && wd.follow) { if (id && id !== wd.from) addWire(wd.from, id); endWd(); return; }   // способ 2: второй клик
  if (id) {                                                                                   // способ 1/2: старт провода
    const k = id.split('.')[0];
    if (selStrong && SEL.has(k) && RT[k] && !RT[k].busy) {                                    // компонент выделен: тянем клемму — переносим
      const p = world_(e), c = ctr(k); drag = { pend: 1, k, tid: id, sx: e.clientX, sy: e.clientY, ox: p.x - c.x, oy: p.y - c.y }; return;
    }
    startWd(id, e); return;
  }
  const rb = t.closest('.rb'); if (rb) { rot(rb.dataset.inst); return; }
  if (t.closest('.knob') && gI.contains(t)) { drag = { knob: 1, st: -1 }; return; }
  if (t.closest('.lever') && gI.contains(t)) { S.key = !S.key; syncUI(); recompute(); commit(); SND.key(); return; }
  const mod = e.ctrlKey || e.metaKey || e.shiftKey, b = t.closest('.body');
  if (b && gC.contains(b)) {                                        // достать из кейса
    const k = b.dataset.inst, p = world_(e), T = TYPES[k]; S.inst[k] = { x: p.x - T.w / 2, y: p.y - T.h / 2, r: 0 };
    SEL.clear(); SEL.add(k); selStrong = false; render(); drag = lift([k], k, 0, 0, true, e); SND.pick(); return;
  }
  if (b && gI.contains(b)) {                                        // клик по прибору: выделить, потянуть: перенести всё выделенное
    const k = b.dataset.inst, p = world_(e), c = ctr(k); if (RT[k].busy) return;
    if (mod) { SEL.has(k) ? SEL.delete(k) : SEL.add(k); selStrong = true; applySel(); return; }
    if (!SEL.has(k)) { SEL.clear(); SEL.add(k); selStrong = false; applySel(); }
    drag = { pend: 1, k, sx: e.clientX, sy: e.clientY, ox: p.x - c.x, oy: p.y - c.y }; return;
  }
  if (isBg) { if (!mod) { SEL.clear(); applySel(); } drag = { mq: 1, sx: e.clientX, sy: e.clientY, moved: false }; }   // рамка выделения
});
document.addEventListener('pointermove', e => {
  if (wd) { wd.end = world_(e); if (!wd.follow && Math.hypot(e.clientX - wd.sx, e.clientY - wd.sy) > 6) wd.moved = true; }
  if (!drag) return;
  if (drag.pend) {
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
    const d = drag; drag = lift(selKeys(), d.k, d.ox, d.oy, false, e); SND.pick();
  }
  if (drag.mv) {
    const p = world_(e), over = inR(e, caseEl.getBoundingClientRect());
    drag.keys.forEach(k => { const T = TYPES[k], o = drag.off[k], I = S.inst[k]; I.x = p.x - drag.ox + o.x - T.w / 2; I.y = p.y - drag.oy + o.y - T.h / 2; });
    fl.setAttribute('transform', `translate(${e.clientX} ${e.clientY})`);
    if (!over) drag.left = true;
    const k = drag.left && over ? drag.cs : V.z;                  // уменьшается над кейсом
    if (k !== drag.k) { fs.style.transform = `scale(${k})`; drag.k = k; }
    caseEl.classList.toggle('drop', drag.left && over);
  } else if (drag.knob) {
    const p = world_(e), q = S.inst.rh; S.p = Math.max(0, Math.min(1, (p.x - q.x - 70) / 160)); syncUI(); recompute();
    const st = Math.floor(S.p * 32); if (st !== drag.st) { if (drag.st >= 0) SND.rib(st); drag.st = st; }
  } else if (drag.pan) { V.tx = drag.tx + e.clientX - drag.x; V.ty = drag.ty + e.clientY - drag.y; applyView(); }
  else if (drag.mq) {
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
    if (drag.moved) { const r = desk.getBoundingClientRect(); mq.style.display = ''; mq.setAttribute('x', Math.min(drag.sx, e.clientX) - r.left); mq.setAttribute('y', Math.min(drag.sy, e.clientY) - r.top); mq.setAttribute('width', Math.abs(e.clientX - drag.sx)); mq.setAttribute('height', Math.abs(e.clientY - drag.sy)); }
  }
});
document.addEventListener('pointerup', e => {
  if (wd && !wd.follow) {
    if (wd.moved) { const x = document.elementFromPoint(e.clientX, e.clientY), id = x && x.dataset && x.dataset.id; if (id && id !== wd.from) addWire(wd.from, id); endWd(); }
    else wd.follow = true;                                        // клик по клемме: провод тянется за курсором
  }
  if (!drag) return;
  if (drag.pend) { if (drag.tid) { startWd(drag.tid, e); wd.follow = true; } else if (SEL.size > 1) { SEL.clear(); SEL.add(drag.k); selStrong = false; applySel(); } }   // клик без движения по члену группы: оставить только его
  else if (drag.mv) {
    const keys = drag.keys; document.body.classList.remove('dragging'); caseEl.classList.remove('drop');
    if (inR(e, caseEl.getBoundingClientRect())) { fg.innerHTML = ''; toCase(keys); }              // вернуть в кейс
    else {
      const r = desk.getBoundingClientRect(), cx = Math.max(r.left + 30, Math.min(r.right - 30, e.clientX)), cy = Math.max(r.top + 30, Math.min(r.bottom - 30, e.clientY));
      const gx = (cx - r.left - V.tx) / V.z - drag.ox, gy = (cy - r.top - V.ty) / V.z - drag.oy;
      keys.forEach(k => {
        const T = TYPES[k], o = drag.off[k], I = S.inst[k];
        I.x = Math.max(AREA.x + 40, Math.min(AREA.x + AREA.w - 40, gx + o.x)) - T.w / 2; I.y = Math.max(AREA.y + 40, Math.min(AREA.y + AREA.h - 40, gy + o.y)) - T.h / 2; unlift(k);
      });
    }
    SND.drop(); commit();
  } else if (drag.knob) commit();
  else if (drag.pan) document.body.classList.remove('dragging');
  else if (drag.mq) {
    mq.style.display = 'none';
    if (drag.moved) {
      const a = world_({ clientX: drag.sx, clientY: drag.sy }), b = world_(e), x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
      for (const k in S.inst) { const q = bbox(k); if (q.x1 >= x0 && q.x0 <= x1 && q.y1 >= y0 && q.y0 <= y1) SEL.add(k); }
      if (SEL.size) selStrong = true;
      applySel();
    }
  }
  drag = null;
});

// ---- Контекстное меню провода (ПКМ) ----
let popI = -1;
document.addEventListener('contextmenu', e => {
  const w = e.target.closest && e.target.closest('.wire');
  if (w) {
    e.preventDefault(); popI = +w.dataset.i; pop.hidden = false;
    pop.style.left = Math.min(e.clientX, innerWidth - 230) + 'px'; pop.style.top = Math.min(e.clientY, innerHeight - 130) + 'px';
    pop.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b.dataset.c === S.wires[popI].c));
  } else if (desk.contains(e.target)) { e.preventDefault(); endWd(); }
});
pop.querySelectorAll('.sw').forEach(b => b.addEventListener('click', () => {
  if (popI < 0 || !S.wires[popI]) return;
  S.wires[popI].c = defCol = b.dataset.c; redrawWires(); commit(); pop.hidden = true;
}));
el('del').onclick = () => { if (popI >= 0 && S.wires[popI]) { S.wires.splice(popI, 1); redrawWires(); recompute(); commit(); } pop.hidden = true; popI = -1; };

// ---- Горячие клавиши ----
document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
  const m = e.ctrlKey || e.metaKey;
  if (m && e.code === 'KeyZ') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (m && e.code === 'KeyY') { e.preventDefault(); redo(); }
  else if (m && e.code === 'KeyA') { e.preventDefault(); Object.keys(S.inst).forEach(k => SEL.add(k)); selStrong = true; applySel(); }
  else if (m || e.altKey) return;
  else if (e.code === 'KeyR') { const k = (hov && S.inst[hov.dataset.inst] && hov.dataset.inst) || selKeys()[0]; if (k) rot(k); }
  else if (e.code === 'Space') { e.preventDefault(); spaceDown = true; document.body.classList.add('space'); }
  else if (e.code === 'KeyH') showHint();
  else if (e.code === 'KeyM') el('snd').click();
  else if (e.code === 'Slash' && e.shiftKey) el('help').hidden = false;
  else if (e.code === 'Escape') { pop.hidden = true; endWd(); el('help').hidden = true; SEL.clear(); selStrong = false; applySel(); }
  else if (e.code === 'Delete' || e.code === 'Backspace') { if (!pop.hidden) el('del').click(); else if (SEL.size) { toCase(selKeys()); commit(); SND.drop(); } }
});
document.addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false; document.body.classList.remove('space'); } });

// ---- Проверка результата ----
function checkMulti(W, m, say, num) {                 // работа №15: три опыта и вывод
  const R = R_[TG]; let ok = true;
  [1, 2, 3].forEach(n => {
    const I = num('i' + n), U = num('u' + n), T = W.targets[n - 1];
    if (isNaN(I) || isNaN(U)) { m.push('Опыт ' + n + ': заполни силу тока и напряжение'); ok = false; return; }
    if (Math.abs(I - T) > 0.03) { m.push('Опыт ' + n + ': сила тока должна быть около ' + fI(T) + ' А'); ok = false; }
    if (Math.abs(U - I * R) > 0.12 + R * 0.03) { m.push('Опыт ' + n + ': напряжение не соответствует показаниям вольтметра'); ok = false; }
  });
  const c = el('conc').value;
  if (!c) { m.push('Выбери вывод'); ok = false; }
  else if (c !== 'dir') { m.push('Вывод не сходится с таблицей\nСравни отношение U / I во всех трёх опытах'); ok = false; }
  if (ok) m.push('Всё верно\nСила тока прямо пропорциональна напряжению: отношение U / I во всех опытах одинаково');
  say(ok ? 'ok' : 'bad');
}
function drawPlot() {                                  // график I(U) по записанным опытам
  const pl = el('plot'); pl.innerHTML = '';
  const nv = id => parseFloat(el(id).value.replace(',', '.')), P = [1, 2, 3].map(i => [nv('u' + i), nv('i' + i)]).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
  const X0 = 34, Y0 = 124, WW = 196, HH = 104, xm = Math.max(3.5, ...P.map(p => p[0] * 1.15)), ym = 0.6, A = (t, a) => $(t, a, pl);
  const sx = u => X0 + u / xm * WW, sy = i => Y0 - i / ym * HH, T = (x, y, s, an = 'middle') => { const t = A('text', { x, y, 'text-anchor': an, 'font-size': 10, fill: 'currentColor' }); t.textContent = s; };
  A('path', { d: `M${X0} ${Y0 - HH - 8}V${Y0}H${X0 + WW + 8}`, stroke: 'currentColor', fill: 'none', 'stroke-width': 1.5 });
  for (let u = 0; u <= xm; u++) { A('path', { d: `M${sx(u)} ${Y0}v4`, stroke: 'currentColor' }); T(sx(u), Y0 + 15, u); }
  for (const i of [0.2, 0.4, 0.6]) { A('path', { d: `M${X0 - 4} ${sy(i)}h4`, stroke: 'currentColor' }); T(X0 - 7, sy(i) + 3, String(i).replace('.', ','), 'end'); }
  T(X0 + WW + 8, Y0 + 15, 'U, В', 'end'); T(X0 + 4, Y0 - HH - 10, 'I, А', 'start');
  if (P.length) {
    const m = P.reduce((a, b) => b[0] > a[0] ? b : a);
    A('path', { d: `M${sx(0)} ${sy(0)}L${sx(m[0])} ${sy(m[1])}`, stroke: '#4aa3ff', 'stroke-dasharray': '5 4', 'stroke-width': 1.5, fill: 'none' });
    P.forEach(p => A('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 4, fill: '#d33' }));
  }
}
['i1', 'u1', 'i2', 'u2', 'i3', 'u3'].forEach(i => el(i).addEventListener('input', drawPlot));
el('chk').onclick = () => {
  const W = WORKS[WORK], out = el('res'), L = S.last, num = id => parseFloat(el(id).value.replace(',', '.')), m = [];
  const say = c => { out.textContent = m.join('\n'); out.className = c; };
  if (!L) { m.push('Резистор ' + RN() + ' не поставлен на стол'); return say('bad'); }
  if (W.multi) return checkMulti(W, m, say, num);
  const I = num('dI'), U = num('dU'), A = num('ans'); let ok = true;
  if (!(Math.abs(L.I2 - W.I) <= 0.05)) { m.push('Сила тока в ' + RN() + ' ' + (L.I2 < 0.05 ? 'почти нулевая' : 'не равна ' + fI(W.I) + ' А') + '\nСоберите цепь и установите ' + fI(W.I) + ' А реостатом'); ok = false; }
  if (!isNaN(I) && Math.abs(I - L.I2) > 0.1) { m.push('Сила тока в черновике не совпадает с показанием амперметра'); ok = false; }
  if (!isNaN(U) && Math.abs(U - L.U2) > 0.2) { m.push('Напряжение в черновике не совпадает с показанием вольтметра'); ok = false; }
  const ex = W.ex(L);                                              // ответ пересчитывается под текущий резистор и работу
  if (isNaN(A)) { m.push('Введите ответ в поле проверки'); ok = false; }
  else if (Math.abs(A - ex) > W.tol * ex) { m.push('Ответ не сходится с расчётом\n' + W.bad); ok = false; }
  if (ok) m.push('Всё верно\n' + W.okm);
  say(ok ? 'ok' : 'bad');
};

// ---- Выбор работы, исследуемого резистора, справка ----
function refreshWork() {
  const W = WORKS[WORK], box = el('taskText'); box.innerHTML = '';
  W.task(RN()).forEach(t => { const p = document.createElement('p'); p.textContent = t; box.appendChild(p); });
  el('ttl').textContent = 'Комплект №3. Лабораторная работа №' + WORK + '. ' + W.ttl; document.title = el('ttl').textContent;
  el('ans').placeholder = W.ph || ''; el('ans').setAttribute('aria-label', W.ph || 'Ответ');
  const mu = !!W.multi; el('draft1').hidden = mu; el('draft3').hidden = !mu; el('plot').hidden = !mu; el('ans').hidden = mu; el('conc').hidden = !mu; drawPlot();
  document.querySelectorAll('#segW button').forEach(b => b.classList.toggle('on', +b.dataset.w === WORK));
  document.querySelectorAll('#segR button').forEach(b => b.classList.toggle('on', b.dataset.r === TG));
}
const resetAnswer = () => { ['dI', 'dU', 'ans', 'i1', 'u1', 'i2', 'u2', 'i3', 'u3', 'conc'].forEach(i => el(i).value = ''); el('res').textContent = ''; drawPlot(); hb.hidden = true; };
document.querySelectorAll('#segW button').forEach(b => b.onclick = () => { WORK = +b.dataset.w; TG = WORKS[WORK].def || 'r2'; recompute(); resetAnswer(); refreshWork(); history.replaceState(null, '', '#' + WORK); });
document.querySelectorAll('#segR button').forEach(b => b.onclick = () => { TG = b.dataset.r; resetAnswer(); recompute(); refreshWork(); });
el('help').onclick = e => { if (e.target === el('help')) el('help').hidden = true; };
el('helpX').onclick = () => { el('help').hidden = true; };
el('helpBtn').onclick = () => { el('help').hidden = false; el('helpX').focus(); };

if (WORKS[+location.hash.slice(1)]) { WORK = +location.hash.slice(1); TG = WORKS[WORK].def || 'r2'; }
centerView(); render(); histBtns(); refreshWork();
addEventListener('resize', applyView);
