/* Информация об органах для 3D-тела */
window.ORGAN_INFO = {
  brain:'Центр управления: мышление, память, движения и ощущения. Потребляет ~20% всей энергии организма.',
  heart:'Мышечный насос: гонит кровь по большому и малому кругу кровообращения. ~100 000 сокращений в сутки.',
  lungs:'Газообмен: отдают кислород в кровь и выводят углекислый газ. В правом лёгком 3 доли, в левом — 2 (место для сердца).',
  lungs2:'Газообмен: отдают кислород в кровь и выводят углекислый газ. В правом лёгком 3 доли, в левом — 2 (место для сердца).',
  liver:'Главный химзавод: обезвреживает токсины, вырабатывает жёлчь, запасает гликоген. Способна регенерировать.',
  stomach:'Мешок для переваривания: кислота (pH 1.5–2) убивает микробы, ферменты расщепляют белки.',
  gut:'Тонкий кишечник всасывает питательные вещества, толстый — воду и формирует кал. Длина ~7–9 м.',
  kidney:'Фильтр крови: выводят продукты обмена с мочой, держат давление и водно-солевой баланс.',
  bladder:'Мышечный мешок: накапливает мочу (до 400–600 мл) и выводит её через уретру.'
};
/* MedHub — simulators: body map SVG, WebAudio auscultation, ECG renderer, atlas schematics */

/* ================= 1. BODY MAP (real 3D body photo + zone overlay) ================= */
window.BodyMap = (function(){
  const BASE = {male:'img/body_blue.jpg', female:'img/anat_digestive.jpg', child:'img/body_blue.jpg'};
  function pointsFor(mode, only){
    const pos = window.PAIN_POS[mode] || window.PAIN_POS.male;
    const pts = [];
    for (const z of window.PAIN_ZONES){
      const p = pos[z.id]; if (!p) continue;
      if (only && z.id !== only) continue;
      pts.push({id:z.id, label:z.n, u:p[0], v:p[1]});
    }
    return pts;
  }
  function html(mode, only){
    const pts = pointsFor(mode, only);
    if (window.Body3D && pts.length){
      return `<div class="body3d-box"><div class="body3d" data-bm3d="${mode}" data-only="${only||''}"></div>
        <div class="body3d-bar">${ic3dHint()}<label class="xray-lbl"><input type="range" min="15" max="100" value="100" class="xray-range"> <span data-i18n="xray"></span></label></div></div>`;
    }
    let dots = '';
    for (const z of window.PAIN_ZONES){
      const p = (window.PAIN_POS[mode]||{})[z.id]; if (!p) continue;
      if (only && z.id !== only) continue;
      dots += `<button class="zone-dot" data-zone="${z.id}" style="left:${p[0]}%;top:${p[1]}%" title="${z.n}" aria-label="${z.n}"></button>`;
    }
    return `<div class="body-photo"><img src="${BASE[mode]}" alt="" draggable="false">${dots}</div>`;
  }
  function ic3dHint(){ return '<span class="body3d-hint">Вращайте мышью · колесо — зум · тыкайте в точки</span>'; }
  function bind(container, onZone){
    const box = container.querySelector('[data-bm3d]');
    if (box && window.Body3D){
      const mode = box.dataset.bm3d, only = box.dataset.only || undefined;
      const inst = window.Body3D.create(box, {mode, points:pointsFor(mode, only), color:0x2f6fed,
        onPick:(id)=>{ if (id) onZone(id); },
        onOrgan:(oid)=>{ if (window.organDlg) window.organDlg(oid); }});
      const xr = container.querySelector('.xray-range');
      if (xr && inst) xr.oninput = ()=> inst.setSkin(+xr.value/100);
      return;
    }
    container.querySelectorAll('.zone-dot').forEach(el=>{
      const pick = () => {
        container.querySelectorAll('.zone-dot').forEach(d=>d.classList.remove('sel'));
        el.classList.add('sel');
        onZone(el.dataset.zone);
      };
      el.addEventListener('click', pick);
      el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' ') {e.preventDefault();pick();} });
    });
  }
  return {html, bind, BASE, pointsFor};
})();

/* ================= 2. AUSCULTATION SYNTH (WebAudio) ================= */
window.Ausc = (function(){
  let ctx = null, noiseBuf = null, timer = null, cursor = 0, current = null;
  function ac(){
    if (!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    if (!noiseBuf){
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    }
    return ctx;
  }
  function env(t0, dur, peak, a, r){ const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0+a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur+r);
    return g; }
  function tone(t0, dur, f0, f1, peak, type='sine', a=0.01){
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1,1), t0+dur);
    const g = env(t0, dur, peak, a, 0.05);
    o.connect(g).connect(master); o.start(t0); o.stop(t0+dur+a+0.1);
  }
  function noise(t0, dur, freq, q, peak, a=0.02, r=0.08){
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=q;
    const g = env(t0, dur, peak, a, r);
    s.connect(f).connect(g).connect(master);
    s.start(t0, Math.random()*1.5); s.stop(t0+dur+a+r+0.1);
  }
  let master = null;
  function beat(t0, S){ // generic heart cycle with murmur slots
    tone(t0, 0.14, 55, 40, 0.9, 'sine', 0.008);                 // S1
    noise(t0, 0.09, 90, 2, 0.25, 0.005, 0.04);
    if (S.sys) noise(t0+0.07, S.sysDur||0.26, S.sysF||140, 1.6, S.sysP||0.4, 0.06, 0.12); // systolic murmur
    tone(t0+0.34, 0.10, 70, 52, 0.6, 'sine', 0.008);            // S2
    if (S.dias) noise(t0+0.36, S.diasDur||0.34, S.diasF||420, 3, S.diasP||0.28, 0.02, 0.25); // diastolic
    if (S.s3) tone(t0+0.46, 0.09, 42, 38, 0.5, 'sine', 0.01);   // S3 gallop
    if (S.rub) { noise(t0+0.02, 0.30, 260, 1.2, 0.32, 0.05, 0.1);
                 noise(t0+0.38, 0.22, 300, 1.4, 0.24, 0.05, 0.1);
                 noise(t0+0.64, 0.18, 280, 1.6, 0.18, 0.04, 0.1); }
  }
  function breathCycle(t0, B){
    const ins = B.ins||1.6, exp = B.exp||2.2;
    const f = B.freq||480, q = B.q||0.8;
    noise(t0, ins, f, q, B.pIns||0.16, 0.18, 0.12);            // inspiration
    if (B.expHiss!==false) noise(t0+ins, exp, f*(B.expMul||0.8), q, B.pExp||0.08, 0.15, 0.15);
    if (B.wheeze) for (let k=0;k<3;k++)
      tone(t0+ins+0.15+k*0.45, 0.5, 420+k*90, 620+k*110, 0.10, 'sine', 0.08);
    if (B.crackles) for (let k=0;k<9;k++){                     // late-inspiratory pops
      const tt = t0 + ins*(0.55+0.05*k) + Math.random()*0.05;
      noise(tt, 0.012, 500+Math.random()*900, 5, 0.35, 0.002, 0.006);
    }
    if (B.rub) { noise(t0+0.1, ins*0.8, 700, 2.5, 0.14, 0.08, 0.1);
                 noise(t0+ins+0.1, exp*0.7, 800, 2.5, 0.10, 0.08, 0.1); }
    if (B.stridor) tone(t0, ins, 640, 560, 0.22, 'sawtooth', 0.12);
  }
  function gurgle(t0, big){
    const dur = big ? 0.5+Math.random()*0.5 : 0.12+Math.random()*0.15;
    noise(t0, dur, 130+Math.random()*160, 1.8, big?0.30:0.16, 0.03, 0.12);
    if (big) tone(t0+0.05, dur*0.8, 90, 60, 0.10, 'sine', 0.05);
  }
  const SYNTHS = {
    heart_normal:   ()=>({period:0.85, draw:t=>beat(t,{})}),
    heart_s3:       ()=>({period:0.9,  draw:t=>beat(t,{s3:true})}),
    heart_sys_murmur:()=>({period:0.8,draw:t=>beat(t,{sys:true, sysF:150})}),
    heart_dias_murmur:()=>({period:0.95,draw:t=>beat(t,{dias:true, diasF:480, diasP:0.26})}),
    heart_rub:      ()=>({period:0.95, draw:t=>beat(t,{rub:true})}),
    lung_vesicular: ()=>({period:3.8,  draw:t=>breathCycle(t,{freq:420,pIns:0.15,pExp:0.07})}),
    lung_bronchial: ()=>({period:3.4,  draw:t=>breathCycle(t,{freq:720,q:1.2,pIns:0.22,pExp:0.26,expMul:1})}),
    lung_wheeze:    ()=>({period:3.6,  draw:t=>breathCycle(t,{freq:400,pIns:0.12,pExp:0.1,wheeze:true})}),
    lung_crackles:  ()=>({period:3.6,  draw:t=>breathCycle(t,{freq:500,crackles:true,pIns:0.14})}),
    lung_stridor:   ()=>({period:3.0,  draw:t=>breathCycle(t,{freq:300,stridor:true,pIns:0.18})}),
    lung_pleural_rub:()=>({period:3.4, draw:t=>breathCycle(t,{freq:650,q:2,rub:true,pIns:0.12})}),
    bowel_normal:   ()=>{let next=0; return {period:4.5, draw:t=>{ if(t>=next){gurgle(t,false); next=t+0.6+Math.random()*1.6;} }};},
    bowel_hyper:    ()=>{let next=0; return {period:5,   draw:t=>{ if(t>=next){gurgle(t, Math.random()<0.4); next=t+0.25+Math.random()*0.6;} }};},
    bowel_absent:   ()=>({period:5,    draw:t=>{}})
  };
  function stop(){ if (timer){ clearTimeout(timer); timer=null; } current=null; }
  function play(id){
    stop(); const S = SYNTHS[id]; if (!S) return;
    current = id; const c = ac();
    if (!master){ master = c.createGain(); master.gain.value = 0.9; master.connect(c.destination); }
    cursor = c.currentTime + 0.08;
    const inst = S();
    const tick = () => {
      if (current !== id) return;
      while (cursor < c.currentTime + 0.35){ inst.draw(cursor); cursor += inst.period; }
      timer = setTimeout(tick, 150);
    };
    tick();
  }
  return {play, stop};
})();

/* ================= 3. ECG RENDERER (canvas) ================= */
window.ECGRen = (function(){
  /* Мониторная развёртка: пишущая головка движется слева направо,
     старый след остаётся «на бумаге», впереди — стирающая полоса.
     Морфология P-QRS-T — сумма гауссиан (реалистичные зубцы). */
  const W = 900, H = 300;
  let raf = null;

  const G = (t, c, w, a) => a * Math.exp(-((t - c) * (t - c)) / (2 * w * w));

  function makeBeatFn(p){
    // возвращает f(tp мс от начала комплекса) -> мм
    const pr = p.pr || 160, qd = 100;               // QRS длительность, мс
    const qA = p.q ? -1.6 : -0.6;                   // амплитуда Q
    const rA = p.wide ? 8.5 : 11;                   // амплитуда R
    const sA = p.wide ? -4 : (p.q ? -3.2 : -2.4);   // амплитуда S
    const rw = p.wide ? 16 : 7;                     // полуширина R
    const st = p.st || 0;
    const tA = (p.t || 0) * (p.tPeak ? 2 : 1) * 1.9;
    const tW = p.wide ? 52 : 42;
    const inv = p.tInv;
    return tp => {
      let y = 0;
      if (p.pAmp > 0) y += G(tp, pr * .5, 26, p.pAmp);           // P
      y += G(tp, qd * .30, rw * .55, qA);                        // Q
      y += G(tp, qd * .45, rw, rA);                              // R
      y += G(tp, qd * .68, rw * .7, sA);                         // S
      y += st * (tp > qd * .9 && tp < qd * 2.4 ? 1 : 0) * G(tp, qd * 1.6, 60, 1); // ST
      const tAmp = inv ? -Math.abs(tA || 2.4) : tA;
      if (p.t !== 0) y += G(tp, qd * 2.1, tW, tAmp);             // T
      return y;
    };
  }

  function start(canvas, rhythm, theme, speed, onBeat){
    stop();
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = '100%'; canvas.style.height = 'auto';
    ctx.scale(dpr, dpr);

    // «бумага» — сюда пишется след
    const paper = document.createElement('canvas');
    paper.width = W * dpr; paper.height = H * dpr;
    const pctx = paper.getContext('2d');
    pctx.scale(dpr, dpr);

    const night = theme === 'night', dark = theme === 'dark';
    // сетка ЭКГ-бумаги
    const grid = (c1, c2, step1, step2) => {
      pctx.lineWidth = .5; pctx.strokeStyle = c1;
      for (let x = 0; x <= W; x += step1){ pctx.beginPath(); pctx.moveTo(x, 0); pctx.lineTo(x, H); pctx.stroke(); }
      for (let y = 0; y <= H; y += step1){ pctx.beginPath(); pctx.moveTo(0, y); pctx.lineTo(W, y); pctx.stroke(); }
      pctx.lineWidth = 1; pctx.strokeStyle = c2;
      for (let x = 0; x <= W; x += step2){ pctx.beginPath(); pctx.moveTo(x, 0); pctx.lineTo(x, H); pctx.stroke(); }
      for (let y = 0; y <= H; y += step2){ pctx.beginPath(); pctx.moveTo(0, y); pctx.lineTo(W, y); pctx.stroke(); }
    };
    const gc = night ? ['rgba(224,150,80,.14)', 'rgba(224,150,80,.32)', 12, 60]
                     : dark ? ['rgba(90,160,255,.10)', 'rgba(90,160,255,.26)', 12, 60]
                            : ['rgba(220,60,60,.12)', 'rgba(200,50,50,.30)', 12, 60];
    grid(gc[0], gc[1], gc[2], gc[3]);

    const traceCol = night ? '#ffb45e' : dark ? '#5ee0a0' : '#19c37d';
    const glowCol  = night ? 'rgba(255,170,90,.9)' : dark ? 'rgba(94,224,160,.9)' : 'rgba(25,195,125,.9)';

    const p0 = Object.assign({}, rhythm.p || {});
    if (rhythm.id === 'pericard'){ p0.st = 1.6; p0.pAmp = p0.pAmp || 1.2; }
    const chaotic = p0.chaotic;         // ФЖ
    const dissoc = p0.dissociation;     // полная АВ-блокада
    const fWave = p0.fWave;             // ФП
    const drop = p0.drop;               // Мобиц II
    const baseRate = rhythm.rate || 75;
    let beatFn = makeBeatFn(p0);

    // расписание комплексов
    let beats = [];            // {at, rr, skipQRS, fn}
    let tSim = 0, nextAt = 400, beatIdx = 0, lastR = -1;
    function schedule(t){
      while (nextAt < t + 4000){
        let rr;
        if (fWave) rr = 320 + Math.random() * 480;                       // абс. аритмия
        else rr = 60000 / baseRate;
        const skip = drop && (beatIdx % 4 === 2);                        // Мобиц II 3:2→4:3-иш
        const fn = makeBeatFn(p0);
        beats.push({at: nextAt, rr, skipQRS: skip, fn});
        if (!skip) nextAt += rr; else nextAt += rr * 1.15;
        beatIdx++;
      }
      beats = beats.filter(b => b.at > t - 3000);
    }

    const mm = v => v * 1.7;
    let sx = 0, lastY = 0, prev = null, Tsim = 0;
    const V = 130;                       // скорость развёртки, px/с
    const GAP = 26;                      // стирающая полоса
    let beepOn = false, lastBeepT = 0;

    function beep(){
      if (!beepOn) return;
      try{
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        window.__ecgAC = window.__ecgAC || new AC();
        const ac = window.__ecgAC;
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = 880;
        g.gain.setValueAtTime(.06, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + .09);
        o.connect(g); g.connect(ac.destination);
        o.start(); o.stop(ac.currentTime + .1);
      }catch(e){}
    }

    function yAt(t){
      // значение кривой (мм) в момент t (мс симуляции)
      if (chaotic){
        return Math.sin(t * .021) * 3.4 * Math.sin(t * .0053 + 1.7)
             + Math.sin(t * .043 + 2.1) * 2.2 * Math.sin(t * .011)
             + Math.sin(t * .093) * 1.1;
      }
      schedule(t);
      let y = 0;
      // предсердная активность
      if (dissoc){
        const pr = 950;
        const tp = t % pr;
        if (p0.pAmp > 0) y += G(tp, pr * .45, 26, p0.pAmp);
      } else if (fWave){
        y += Math.sin(t * .085) * .5 + Math.sin(t * .147 + 1.3) * .35;
      } else if (drop){
        // P рисуется на все комплексы (даже выпавшие)
      }
      // желудочный комплекс
      for (let i = beats.length - 1; i >= 0; i--){
        const b = beats[i];
        if (t >= b.at && t < b.at + b.rr + 200){
          if (!b.skipQRS) y += b.fn(t - b.at);
          break;
        }
      }
      return y;
    }

    let pending = false, kicker = null;
    function kick(){
      if (pending) return;
      pending = true;
      const run = ts => { if (!pending) return; pending = false; frame(ts); };
      raf = requestAnimationFrame(run);
      kicker = setTimeout(() => run(performance.now()), 110);
    }
    function frame(ts){
      window.__ecgFrames = (window.__ecgFrames||0)+1;
      try {
      if (!prev) prev = ts;
      let dt = (ts - prev) / 1000; prev = ts;
      if (dt > .12) dt = .12;
      dt *= speed;
      Tsim += 0; // (время уже растёт выше)
      const dx = V * dt;
      Tsim += dt * 1000;
      schedule(Tsim);
      let x1 = sx, x2 = sx + dx;
      if (x2 >= W){ x2 = W; sx = 0; } else sx = x2;
      // пишем новый сегмент следа (непрерывное время!)
      const step = 1.25;
      pctx.lineWidth = 2.1; pctx.lineCap = 'round'; pctx.lineJoin = 'round';
      pctx.strokeStyle = traceCol;
      pctx.beginPath();
      let first = true;
      for (let x = x1; x <= x2; x += step){
        const tt = Tsim - (x2 - x) / V * 1000;
        const y = mm(yAt(tt));
        if (first){ pctx.moveTo(x, H * .46 - y); first = false; }
        else pctx.lineTo(x, H * .46 - y);
        lastY = y;
      }
      pctx.stroke();
      // «бип» на пересечении R (грубая эвристика: резкий пик в последней точке)
      if (lastY > 6 && Tsim - lastBeepT > .25){ beep(); lastBeepT = Tsim; if (onBeat) onBeat(); }
      // стирающая полоса впереди головки
      pctx.save();
      pctx.globalCompositeOperation = 'destination-out';
      pctx.fillStyle = 'rgba(0,0,0,.95)';
      const ex = (sx + 4) % W;
      pctx.fillRect(ex, 0, GAP, H);
      pctx.restore();
      // перерисовка сетки в стёртой полосе
      pctx.lineWidth = .5; pctx.strokeStyle = gc[0];
      for (let x = Math.floor(ex / gc[2]) * gc[2]; x <= ex + GAP; x += gc[2]){ pctx.beginPath(); pctx.moveTo(x, 0); pctx.lineTo(x, H); pctx.stroke(); }
      for (let y = 0; y <= H; y += gc[2]){ pctx.beginPath(); pctx.moveTo(Math.max(ex, 0), y); pctx.lineTo(ex + GAP, y); pctx.stroke(); }

      // вывод на экран: бумага + светящаяся головка
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(paper, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hx = sx, hy = H * .46 - lastY;
      ctx.save();
      ctx.shadowColor = glowCol; ctx.shadowBlur = 14;
      ctx.fillStyle = night ? '#ffe9c9' : '#eafff2';
      ctx.beginPath(); ctx.arc(hx, hy, 3.4, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = night ? '#ffb45e' : dark ? '#5ee0a0' : '#19c37d';
      ctx.beginPath(); ctx.arc(hx, hy, 2.2, 0, 7); ctx.fill();
      ctx.restore();
      } catch(err){ window.__ecgErr = String(err && err.message || err).slice(0,250); }
      pending = false;
      kick();
    }
    kick();

    return {
      setBeep(v){ beepOn = v; },
      W, H
    };
  }
  function stop(){ if (raf) cancelAnimationFrame(raf); raf = null; }
  return {start, stop, W, H};
})();

/* ================= 4. ATLAS SCHEMATIC DRAWINGS ================= */
window.ATLAS_DRAW = {
  cxr_norm(c,w,h){ base(c,w,h); lungs(c,w,h); heartSil(c,w,h,0.42); diaphragm(c,w,h); ribs(c,w,h); },
  cxr_pneum(c,w,h){ base(c,w,h); lungs(c,w,h); heartSil(c,w,h,0.44); diaphragm(c,w,h); ribs(c,w,h);
    c.fillStyle='rgba(235,235,230,0.92)';
    c.beginPath(); c.ellipse(w*0.70,h*0.68,w*0.16,h*0.16,0.3,0,7); c.fill();
    c.strokeStyle='#20242c'; c.lineWidth=2;
    c.beginPath(); c.moveTo(w*0.66,h*0.62); c.lineTo(w*0.70,h*0.70); c.moveTo(w*0.72,h*0.60); c.lineTo(w*0.76,h*0.68);
    c.moveTo(w*0.63,h*0.70); c.lineTo(w*0.67,h*0.77); c.stroke();
    label(c,w,h,'консолидация + воздушная бронхограмма',0.70,0.88); },
  cxr_ptx(c,w,h){ base(c,w,h); lungs(c,w,h); heartSil(c,w,h,0.42); diaphragm(c,w,h); ribs(c,w,h);
    c.fillStyle='rgba(10,12,16,0.85)';
    c.beginPath(); c.ellipse(w*0.30,h*0.45,w*0.17,h*0.30,0,0,7); c.fill();
    c.strokeStyle='#cfd6e4'; c.lineWidth=2.5;
    c.beginPath(); c.moveTo(w*0.42,h*0.20); c.quadraticCurveTo(w*0.33,h*0.45,w*0.40,h*0.72); c.stroke();
    label(c,w,h,'край коллабированного лёгкого',0.33,0.16); },
  cxr_eff(c,w,h){ base(c,w,h); lungs(c,w,h); heartSil(c,w,h,0.44); diaphragm(c,w,h); ribs(c,w,h);
    c.fillStyle='rgba(235,235,230,0.9)';
    c.beginPath(); c.moveTo(w*0.55,h); c.quadraticCurveTo(w*0.62,h*0.60,w*0.90,h*0.58);
    c.lineTo(w*0.92,h); c.closePath(); c.fill();
    label(c,w,h,'уровень жидкости «мениск»',0.72,0.55); },
  ct_sdh(c,w,h){ skull(c,w,h);
    c.fillStyle='#e8e4da'; c.beginPath(); c.ellipse(w*0.5,h*0.52,w*0.34,h*0.36,0,0,7); c.fill();
    c.fillStyle='#5a6272'; c.beginPath(); c.ellipse(w*0.47,h*0.48,w*0.07,h*0.10,0.2,0,7); c.fill();
    c.beginPath(); c.ellipse(w*0.55,h*0.48,w*0.07,h*0.10,-0.2,0,7); c.fill();
    c.fillStyle='#ffffff';
    c.beginPath(); c.ellipse(w*0.62,h*0.55,w*0.09,h*0.08,0.4,0,7); c.fill();
    label(c,w,h,'гиперденсный очаг',0.66,0.72); },
  ct_inf(c,w,h){ skull(c,w,h);
    c.fillStyle='#e8e4da'; c.beginPath(); c.ellipse(w*0.5,h*0.52,w*0.34,h*0.36,0,0,7); c.fill();
    c.fillStyle='#b9b4a6';
    c.beginPath(); c.ellipse(w*0.36,h*0.52,w*0.14,h*0.20,0.15,0,7); c.fill();
    c.strokeStyle='#5a6272'; c.lineWidth=1.5; c.beginPath(); c.moveTo(w*0.5,h*0.16); c.lineTo(w*0.48,h*0.86); c.stroke();
    label(c,w,h,'гиподенсная зона (MCA)',0.30,0.78); },
  mri_disc(c,w,h){
    c.fillStyle='#0b0e13'; c.fillRect(0,0,w,h);
    for (let i=0;i<7;i++){ // vertebral bodies
      const y = h*0.14+i*h*0.11;
      c.fillStyle='#dcd8cc'; c.fillRect(w*0.42,y,w*0.16,h*0.065);
      c.fillStyle='#8f97a6'; c.fillRect(w*0.42,y+h*0.065,w*0.16,h*0.022);
    }
    c.strokeStyle='#6dd47e'; c.lineWidth=3; // thecal sac
    c.beginPath(); c.moveTo(w*0.50,h*0.10);
    for (let i=0;i<7;i++) c.quadraticCurveTo(w*0.50+8,h*0.16+i*h*0.11,w*0.50,h*0.21+i*h*0.11);
    c.stroke();
    c.fillStyle='#e0b34c'; // herniation at L4-L5
    c.beginPath(); c.ellipse(w*0.535,h*0.60,w*0.035,h*0.045,0,0,7); c.fill();
    label(c,w,h,'грыжа L4-L5 → дуральный мешок',0.56,0.66); },
  hist_adeno(c,w,h){
    c.fillStyle='#d8c9e8'; c.fillRect(0,0,w*0.5,h); c.fillStyle='#e9cfc9'; c.fillRect(w*0.5,0,w*0.5,h);
    c.strokeStyle='#4a3d5c'; c.lineWidth=1.5;
    for (let i=0;i<4;i++){ // normal glands (left)
      const x=w*0.08+i*w*0.1, y=h*0.2+((i%2)*h*0.35);
      c.beginPath(); c.arc(x,y,w*0.035,0,7); c.stroke();
    }
    c.strokeStyle='#7a2f2f';
    for (let i=0;i<7;i++){ // atypical glands (right)
      const x=w*0.55+Math.random()*w*0.35, y=h*0.12+Math.random()*h*0.7, r=w*(0.02+Math.random()*0.045);
      c.beginPath();
      for (let a=0;a<8;a++){ const ang=a/8*7, rr=r*(0.6+Math.random()*0.6);
        const px=x+Math.cos(ang)*rr, py=y+Math.sin(ang)*rr; a===0?c.moveTo(px,py):c.lineTo(px,py); }
      c.closePath(); c.stroke();
    }
    label(c,w,h,'норма | аденокарцинома',0.5,0.94); },
  fundus_htn(c,w,h){ fundusBase(c,w,h);
    c.strokeStyle='#c94b3f'; c.lineWidth=2;
    c.beginPath(); c.moveTo(w*0.30,h*0.5); c.lineTo(w*0.24,h*0.42); c.stroke(); // AV nipping
    c.fillStyle='#b3202a';
    c.beginPath(); c.ellipse(w*0.6,h*0.4,10,4,0.5,0,7); c.fill();
    c.beginPath(); c.ellipse(w*0.68,h*0.62,8,3,-0.4,0,7); c.fill();
    c.fillStyle='rgba(240,238,230,0.85)';
    c.beginPath(); c.arc(w*0.55,h*0.66,6,0,7); c.fill();
    label(c,w,h,'AV-ниппинг, кровоизлияния «пламя»',0.5,0.94); },
  fundus_dm(c,w,h){ fundusBase(c,w,h);
    c.fillStyle='#c9403a';
    for (let i=0;i<14;i++){ const a=Math.random()*7, r=Math.random()*w*0.16;
      c.beginPath(); c.arc(w*0.55+Math.cos(a)*r, h*0.5+Math.sin(a)*r, 1.6+Math.random()*1.4, 0, 7); c.fill(); }
    c.fillStyle='rgba(235,220,150,0.9)';
    for (let i=0;i<6;i++){ c.beginPath(); c.arc(w*0.6+Math.random()*w*0.12, h*0.42+Math.random()*h*0.2, 2.5+Math.random()*2, 0, 7); c.fill(); }
    label(c,w,h,'микроаневризмы, твёрдые экссудаты',0.5,0.94); },
  oto_norm(c,w,h){ earBase(c,w,h);
    c.strokeStyle='rgba(255,246,214,0.9)'; c.lineWidth=3;
    c.beginPath(); c.moveTo(w*0.58,h*0.52); c.lineTo(w*0.40,h*0.68); c.stroke();
    label(c,w,h,'световой конус',0.5,0.94); },
  oto_aom(c,w,h){ earBase(c,w,h,true);
    label(c,w,h,'выбухание, гиперемия',0.5,0.94); }
};
function base(c,w,h){ c.fillStyle='#0b0e13'; c.fillRect(0,0,w,h); }
function skull(c,w,h){ c.strokeStyle='#9aa4b8'; c.lineWidth=6;
  c.beginPath(); c.ellipse(w*0.5,h*0.52,w*0.37,h*0.39,0,0,7); c.stroke(); }
function lungs(c,w,h){ c.fillStyle='#171b24';
  c.beginPath(); c.ellipse(w*0.32,h*0.44,w*0.17,h*0.30,0.06,0,7); c.fill();
  c.beginPath(); c.ellipse(w*0.68,h*0.44,w*0.17,h*0.30,-0.06,0,7); c.fill();
  c.strokeStyle='rgba(200,210,230,0.28)'; c.lineWidth=1.2;
  for (let i=0;i<7;i++){
    c.beginPath(); c.moveTo(w*0.32,h*0.24+i*h*0.05); c.quadraticCurveTo(w*0.24,h*0.30+i*h*0.05,w*0.19,h*0.27+i*h*0.06); c.stroke();
    c.beginPath(); c.moveTo(w*0.68,h*0.24+i*h*0.05); c.quadraticCurveTo(w*0.76,h*0.30+i*h*0.05,w*0.81,h*0.27+i*h*0.06); c.stroke();
  }
  c.strokeStyle='rgba(200,210,230,0.5)'; c.lineWidth=2;
  for (let i=0;i<6;i++){ c.beginPath(); c.arc(w*0.5,h*0.95,w*0.5-Math.abs(i-2.5)*w*0.09,-2.4,-0.75); c.stroke(); } }
function heartSil(c,w,h,scale){ c.fillStyle='rgba(200,208,224,0.95)';
  c.beginPath(); c.moveTo(w*0.40,h*0.24);
  c.lineTo(w*0.60,h*0.24);
  c.bezierCurveTo(w*0.66,h*0.30,w*0.66,h*0.50,w*0.58,h*0.60);
  c.bezierCurveTo(w*0.52,h*0.66,w*0.44,h*0.62,w*0.41,h*0.50);
  c.bezierCurveTo(w*0.38,h*0.40,w*0.38,h*0.30,w*0.40,h*0.24); c.fill();
  c.fillStyle='rgba(200,208,224,0.9)';
  c.fillRect(w*0.47,h*0.12,w*0.06,h*0.14); }
function diaphragm(c,w,h){ c.strokeStyle='rgba(220,225,240,0.75)'; c.lineWidth=2.5;
  c.beginPath(); c.moveTo(w*0.16,h*0.78); c.quadraticCurveTo(w*0.32,h*0.66,w*0.48,h*0.76); c.stroke();
  c.beginPath(); c.moveTo(w*0.52,h*0.76); c.quadraticCurveTo(w*0.68,h*0.66,w*0.84,h*0.78); c.stroke(); }
function ribs(c,w,h){ c.strokeStyle='rgba(210,218,235,0.35)'; c.lineWidth=2;
  for (let i=0;i<7;i++){ c.beginPath(); c.arc(w*0.5,h*1.05,w*0.42-i*w*0.045,-2.25,-0.9); c.stroke(); } }
function fundusBase(c,w,h){
  c.fillStyle='#7e1f1a'; c.fillRect(0,0,w,h);
  const g = c.createRadialGradient(w*0.5,h*0.5,10,w*0.5,h*0.5,w*0.5);
  g.addColorStop(0,'#b5402f'); g.addColorStop(1,'#6e1712');
  c.fillStyle=g; c.fillRect(0,0,w,h);
  c.fillStyle='#e8c844'; c.beginPath(); c.arc(w*0.28,h*0.5,h*0.09,0,7); c.fill();
  c.strokeStyle='#c23a30'; c.lineWidth=2;
  for (const ang of [-0.5,-0.15,0.2,0.5]){ c.beginPath(); c.moveTo(w*0.31,h*0.5);
    c.quadraticCurveTo(w*0.5,h*0.5+ang*h, w*0.85,h*0.5+ang*h*0.9); c.stroke(); } }
function earBase(c,w,h,inflamed){
  c.fillStyle='#0b0e13'; c.fillRect(0,0,w,h);
  c.strokeStyle='#8f97a6'; c.lineWidth=5;
  c.beginPath(); c.ellipse(w*0.5,h*0.5,w*0.34,h*0.38,0,0,7); c.stroke();
  c.fillStyle= inflamed ? '#b23327' : '#c9b8a4';
  c.beginPath(); c.ellipse(w*0.5,h*0.5,w*0.26,h*0.31,0,0,7); c.fill();
  c.strokeStyle='#5f4f3f'; c.lineWidth=4;
  c.beginPath(); c.moveTo(w*0.42,h*0.30); c.lineTo(w*0.47,h*0.52); c.stroke();
  c.fillStyle='#5f4f3f'; c.beginPath(); c.arc(w*0.42,h*0.29,5,0,7); c.fill(); }
function label(c,w,h,txt,x,y){
  c.font = `${Math.max(11,w*0.028)}px sans-serif`;
  c.textAlign='center'; c.fillStyle='rgba(232,245,233,0.92)';
  c.fillText(txt, w*x, h*y);
}
