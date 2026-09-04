/* MedHub — simulators: body map SVG, WebAudio auscultation, ECG renderer, atlas schematics */

/* ================= 1. BODY MAP (SVG) ================= */
window.BodyMap = (function(){
  function bodyPath(mode){
  // viewBox 200x440; mode: male | female | child
  const ch = mode === 'child';
  const headR = ch ? 30 : 24, headY = ch ? 46 : 38;
  const hip = mode === 'female' ? 26 : 20;      // half hip width
  const sh  = ch ? 34 : (mode === 'female' ? 38 : 42); // half shoulder width
  const torsoTop = headY + headR + 10, pelvisY = torsoTop + 100;
  const shoulderY = torsoTop + 2;
  const legTop = pelvisY + 18, legLen = 155, legW = 17;
  const footY = legTop + legLen, footH = 30;
  return `
    <circle cx="100" cy="${headY}" r="${headR}" class="bm-skin"/>
    <rect x="92" y="${headY+headR-4}" width="16" height="16" rx="6" class="bm-skin"/>
    <rect x="44" y="${shoulderY}" width="15" height="150" rx="7.5" class="bm-skin"/>
    <rect x="141" y="${shoulderY}" width="15" height="150" rx="7.5" class="bm-skin"/>
    <path class="bm-skin" d="M ${100-sh} ${shoulderY}
      C ${100-sh-6} ${shoulderY+30}, ${100-sh-2} ${pelvisY-26}, ${100-hip} ${pelvisY}
      L ${100+hip} ${pelvisY}
      C ${100+sh+2} ${pelvisY-26}, ${100+sh+6} ${shoulderY+30}, ${100+sh} ${shoulderY}
      Q 100 ${shoulderY-8}, ${100-sh} ${shoulderY} Z"/>
      ${mode==='female' ? `<path class="bm-skin" d="M 82 ${torsoTop+14} q 8 12 8 25 q 0 8 -8 8 q -8 0 -8 -8 q 0 -13 8 -25 Z M 118 ${torsoTop+14} q -8 12 -8 25 q 0 8 8 8 q 8 0 8 -8 q 0 -13 -8 -25 Z"/>` : ''}
    <rect x="${100-hip-6}" y="${pelvisY-2}" width="${hip*2+12}" height="26" rx="10" class="bm-skin"/>
    <rect x="${100-hip+2}" y="${legTop}" width="${legW}" height="${legLen}" rx="8.5" class="bm-skin"/>
    <rect x="${100+hip-2-legW}" y="${legTop}" width="${legW}" height="${legLen}" rx="8.5" class="bm-skin"/>
    <rect x="${100-hip+2}" y="${footY}" width="17" height="${footH}" rx="6" class="bm-skin"/>
    <rect x="${100+hip-2-17}" y="${footY}" width="17" height="${footH}" rx="6" class="bm-skin"/>`;
}
function svg(mode, onZone){
    const modeX = mode==='child' ? 0.9 : 1;
    let zones = '';
    for (const z of window.PAIN_ZONES){
      const r = z.id==='skin' ? z.r : z.r*modeX;
      zones += `<g class="zone" data-zone="${z.id}" role="button" tabindex="0" aria-label="${z.n}">
        <circle cx="${z.x}" cy="${z.y}" r="${r}" class="zone-hit"/>
        <circle cx="${z.x}" cy="${z.y}" r="${r}" class="zone-mark"/></g>`;
    }
    return `<svg viewBox="0 0 210 450" class="bodymap" xmlns="http://www.w3.org/2000/svg">
      <style>
        .bm-skin{fill:var(--panel2);stroke:var(--line);stroke-width:1.4}
        .zone-hit{fill:transparent;stroke:none}
        .zone-mark{fill:var(--accent);opacity:.28;stroke:var(--accent);stroke-width:1.2;transition:.15s}
        .zone:hover .zone-mark{opacity:.55}
        .zone.sel .zone-mark{fill:var(--danger);stroke:var(--danger);opacity:.6;stroke-width:2}
        .zone.sel .zone-mark{animation:zonepulse 1.4s infinite}
      </style>${bodyPath(mode)}${zones}</svg>`;
  }
  function bind(container, onZone){
    container.querySelectorAll('.zone').forEach(el=>{
      const pick = () => {
        container.querySelectorAll('.zone').forEach(z=>z.classList.remove('sel'));
        el.classList.add('sel');
        onZone(el.dataset.zone);
      };
      el.addEventListener('click', pick);
      el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' ') {e.preventDefault();pick();} });
    });
  }
  return {svg, bind};
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
  let raf = null, state = null;
  const W = 900, H = 300;
  function mm(v){ return v * 1.6; } // mm -> px scale (10mm/mV-ish)
  function wave(ctx, x, y0, p, xEnd){
    // draws one cardiac cycle starting at x; returns duration px consumed
    const s = 0.09; // px per ms
    const dur = (p.pr + 110 + p.qrs + 80 + 200) * s + 40;
    let cx = x;
    const line = (dx, dy)=>{ ctx.lineTo(cx+dx, y0+dy); cx += dx; };
    // P wave
    if (p.pAmp>0){ const pw = 90*s;
      ctx.moveTo(cx, y0); ctx.quadraticCurveTo(cx+pw/2, y0-mm(p.pAmp), cx+pw, y0); cx += pw; }
    cx += p.pr*s;
    if (p.dissociation){} // P drawn separately
    // QRS
    if (p.chaotic) return dur;
    if (p.wide){ // ventricular complex
      ctx.moveTo(cx, y0);
      ctx.quadraticCurveTo(cx+40*s, y0-mm(9), cx+80*s, y0+mm(3));
      ctx.quadraticCurveTo(cx+110*s, y0-mm(7), cx+160*s, y0);
      cx += 170*s;
    } else if (p.qrs>0){
      if (p.q) { line(12*s, mm(2)); }
      line(20*s, -mm(11));
      line(25*s, mm(p.q?9:4));
      if (Math.abs(p.st)>0.1) line(70*s, -mm(p.st));
      else line(60*s, 0);
    }
    // T
    if (p.t>0){ const tw = 160*s;
      ctx.lineTo(cx+tw/2, y0-mm(p.t*(p.tPeak?2:1))); ctx.lineTo(cx+tw, y0); cx += tw; }
    else if (p.t<0){ const tw = 150*s;
      ctx.lineTo(cx+tw/2, y0-mm(p.t)); ctx.lineTo(cx+tw, y0); cx += tw; }
    ctx.lineTo(xEnd || x+600, y0);
    return dur;
  }
  function drawFrame(ctx, st){
    ctx.clearRect(0,0,W,H);
    // grid
    ctx.strokeStyle = st.theme==='night' ? '#4a2a12' : '#3b1f1f';
    ctx.lineWidth = 0.5;
    for (let x=0;x<W;x+=20){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0;y<H;y+=20){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.strokeStyle = st.theme==='night' ? '#6b3c18' : '#5a2a2a'; ctx.lineWidth = 1;
    for (let x=0;x<W;x+=100){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0;y<H;y+=100){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    const p = st.p, y0 = H*0.45, px = 0.09;
    ctx.strokeStyle = '#e8f5e9'; ctx.lineWidth = 1.8; ctx.beginPath();
    if (p.chaotic){ // VF
      let y = y0;
      for (let x=0;x<W;x+=3){ y = y0 + Math.sin(x*0.08+st.t*8)*mm(4)*Math.sin(x*0.013+st.t*3) + Math.sin(x*0.21-st.t*11)*mm(2.5);
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }
    } else if (p.dissociation){ // CHB: independent P and QRS
      const pr = 950*px, qr = 1600*px;
      const po = st.off % pr, qo = st.off % qr;
      for (let x=-200;x<W;x+=pr){ const bx = x+po; if (bx<-40||bx>W+40) continue;
        ctx.moveTo(bx,y0); ctx.quadraticCurveTo(bx+13, y0-mm(p.pAmp), bx+27, y0); }
      for (let x=-300;x<W;x+=qr){ const bx = x+qo; if (bx<-60||bx>W+60) continue;
        ctx.moveTo(bx,y0); ctx.lineTo(bx+8,y0+mm(2)); ctx.lineTo(bx+18,y0-mm(10)); ctx.lineTo(bx+30,y0+mm(3)); ctx.lineTo(bx+46,y0);
        ctx.lineTo(bx+70,y0); ctx.quadraticCurveTo(bx+85,y0-mm(2.5),bx+100,y0); }
      ctx.moveTo(0,y0); ctx.lineTo(W,y0);
    } else if (p.fWave){ // AF: fibrillatory baseline + irregular QRS, no P
      for (let x=0;x<W;x+=2){
        const y = y0 + Math.sin(x*0.35+st.t*14)*mm(0.55) + Math.sin(x*0.11-st.t*9)*mm(0.4);
        ctx.lineTo(x,y);
      }
      let gap = 420 + ((st.t*137|0)%7)*80; // pseudo-irregular spacing shifting over time
      let x = -(st.off % 900);
      while (x < W){
        ctx.moveTo(x,y0); ctx.lineTo(x+5,y0+mm(2.5)); ctx.lineTo(x+14,y0-mm(10)); ctx.lineTo(x+26,y0+mm(3.5));
        ctx.lineTo(x+46,y0); ctx.quadraticCurveTo(x+60,y0-mm(2.5),x+74,y0);
        gap = 320 + (Math.abs(Math.sin(x*0.017+st.t))*520);
        x += gap;
      }
      ctx.moveTo(0,y0); ctx.lineTo(W,y0);
    } else {
      const cyc = (60000/st.rate)*px; // px per beat
      const dropMod = p.drop ? 3 : 0;
      let x = -((st.off) % cyc) - cyc;
      let beatNo = Math.floor(st.off/cyc);
      while (x < W + cyc){
        const isDrop = dropMod && ((beatNo + st.phase) % (dropMod+1) === dropMod);
        if (isDrop){ // P then pause (Mobitz II)
          ctx.moveTo(x,y0); ctx.quadraticCurveTo(x+13,y0-mm(p.pAmp),x+27,y0);
        } else {
          wave(ctx, x, y0, p, Math.min(x+cyc*1.2, W));
        }
        x += cyc; beatNo++;
      }
      ctx.moveTo(0,y0);
    }
    ctx.stroke();
  }
  function start(canvas, rhythm, theme, speed=1){
    stop(); const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    const p = Object.assign({}, rhythm.p);
    if (rhythm.id==='pericard'){ p.prDown = true; p.concave = true; }
    state = {p, off:0, t:0, theme, phase:0, speed, rate: rhythm.rate || 75};
    const loop = () => {
      state.t += 0.016*speed; state.off += 140*0.016*speed*(rhythm.rate?Math.max(rhythm.rate/75,0.6):1);
      drawFrame(ctx, state);
      raf = requestAnimationFrame(loop);
    };
    loop();
  }
  function stop(){ if (raf) cancelAnimationFrame(raf); raf=null; }
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
