/* MedHub — интерактивное 3D-тело (Three.js + настоящая GLB-модель человека):
   вращение, зум, «рентген», анимация, тыкабельные точки */
window.Body3D = (function(){
  const modelCaches = {}; // url -> Promise<{scene, animations}>
  let dracoLoader = null;
  function getDraco(){
    if (!dracoLoader && window.THREE && THREE.DRACOLoader){
      dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('vendor/draco/');
    }
    return dracoLoader;
  }

  function loadModel(url){
    url = url || 'models/human.glb';
    if (modelCaches[url]) return modelCaches[url];
    modelCaches[url] = new Promise((res, rej)=>{
      if (!window.THREE || !window.THREE.GLTFLoader) return rej(new Error('no loader'));
      const loader = new THREE.GLTFLoader();
      const dr = getDraco(); if (dr) loader.setDRACOLoader(dr);
      fetch(url).then(r=>{ if (!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
        .then(buf => new Promise((rs, rj) => loader.parse(buf, '', rs, rj)))
        .then(g => res({scene: g.scene, animations: g.animations || []}))
        .catch(err => { delete modelCaches[url]; rej(err); });
    });
    return modelCaches[url];
  }

  function px2world(u, v){
    // фото-проценты (0..100) → мировые координаты тела (рост ~1.7)
    return [ (u-50)/50*0.30, 1.62*(1 - v/100), 0.14 ];
  }

  function create(container, opts){
    opts = opts || {};
    if (!window.THREE || !window.THREE.OrbitControls) return null;
    try { const t=document.createElement('canvas'); if (!t.getContext('webgl') && !t.getContext('experimental-webgl')) return null; } catch(e){ return null; }
    const THREE = window.THREE;
    const mode = opts.mode || 'male';
    let W = container.clientWidth || 480, H = container.clientHeight || 540;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W/H, .05, 50);
    camera.position.set(0, 1.05, 3.3);
    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.setSize(W, H);
    renderer.domElement.style.display='block';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.05));
    const d1 = new THREE.DirectionalLight(0xffffff, .9); d1.position.set(2,3,4); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x93b4ff, .45); d2.position.set(-3,1.5,-2); scene.add(d2);

    const body = new THREE.Group(); scene.add(body);
    if (mode==='child') body.scale.setScalar(.76);

    let curOpacity = 1;
    const skinMat = new THREE.MeshStandardMaterial({color:0xe7b08a, roughness:.6, metalness:.04, transparent:true, opacity:1});
    const hairMat = new THREE.MeshStandardMaterial({color:0x3a2c22, roughness:.8, transparent:true, opacity:1});

    // --- примитив-заглушка (виден до загрузки GLB, потом убирается) ---
    const prim = new THREE.Group();
    const pmat = skinMat;
    const addP = (geo,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,mat=pmat)=>{
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.rotation.set(rx,ry,rz);
      prim.add(m); return m;
    };
    addP(new THREE.SphereGeometry(.15,24,18), 0,1.53,0, .95,1.05,.98, 0,0,0, hairMat);
    addP(new THREE.SphereGeometry(.135,24,18), 0,1.515,.01, .88,1,.94);
    addP(new THREE.CylinderGeometry(.05,.062,.13,14), 0,1.395,0);
    addP(new THREE.CapsuleGeometry(.185,.36,6,16), 0,1.10,0, mode==='female'?1.22:1.26,1,.76);
    addP(new THREE.SphereGeometry(.165,20,16), 0,.815,0, mode==='female'?1.26:1.16,.82,.76);
    addP(new THREE.SphereGeometry(.08,16,12), -.295,1.245,0);
    addP(new THREE.SphereGeometry(.08,16,12),  .295,1.245,0);
    addP(new THREE.CapsuleGeometry(.054,.24,6,12), -.318,1.06,0, 1,1,1, 0,0,.1);
    addP(new THREE.CapsuleGeometry(.054,.24,6,12),  .318,1.06,0, 1,1,1, 0,0,-.1);
    addP(new THREE.CapsuleGeometry(.046,.24,6,12), -.345,.75,.01, 1,1,1, 0,0,.06);
    addP(new THREE.CapsuleGeometry(.046,.24,6,12),  .345,.75,.01, 1,1,1, 0,0,-.06);
    addP(new THREE.SphereGeometry(.056,14,10), -.362,.575,.02);
    addP(new THREE.SphereGeometry(.056,14,10),  .362,.575,.02);
    addP(new THREE.CapsuleGeometry(.084,.30,6,14), -.10,.565,0);
    addP(new THREE.CapsuleGeometry(.084,.30,6,14),  .10,.565,0);
    addP(new THREE.CapsuleGeometry(.062,.30,6,14), -.10,.185,0);
    addP(new THREE.CapsuleGeometry(.062,.30,6,14),  .10,.185,0);
    addP(new THREE.BoxGeometry(.105,.055,.21), -.10,.028,.045);
    addP(new THREE.BoxGeometry(.105,.055,.21),  .10,.028,.045);
    body.add(prim);

    // --- настоящая GLB-модель ---
    let avatar = prim, mixer = null;
    loadModel().then(g=>{
      if (!renderer.domElement.isConnected) return;
      const clone = (window.THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(g.scene) : g.scene.clone(true));
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      // у скиннен-мешей bbox может быть вырожденным — тогда считаем модель в метрах
      let k = (size.y > .5 && size.y < 5) ? 1.72/size.y : 1;
      if (!isFinite(k) || k<=0) k = 1;
      clone.scale.setScalar(k);
      if (size.y > .1){
        box.setFromObject(clone);
        const c = box.getCenter(new THREE.Vector3());
        clone.position.x -= c.x; clone.position.z -= c.z; clone.position.y -= box.min.y;
      }
      if (mode==='female') clone.scale.multiply(new THREE.Vector3(.95,1,.94));
      clone.traverse(o=>{
        if (o.isMesh && o.material){
          o.material = o.material.clone();
          o.material.transparent = true;
          o.material.opacity = curOpacity;
          o.material.side = THREE.DoubleSide;
        }
      });
      body.add(clone);
      body.remove(prim);
      avatar = clone;
      /* модель стоит в позе покоя — без ходьбы */
    }).catch(()=>{ /* остаёмся на примитивах */ });

    // --- анатомическая модель туловища (models/torso.glb, если положена) ---
    fetch('models/torso.glb', {method:'HEAD'}).then(r=>{
      if (!r.ok) return;
      return loadModel('models/torso.glb').then(g=>{
        if (!renderer.domElement.isConnected) return;
        const at = g.scene.clone(true);
        const box = new THREE.Box3().setFromObject(at);
        const size = box.getSize(new THREE.Vector3());
        let k = (size.y > .05 && size.y < 50) ? .95/size.y : 1;
        if (!isFinite(k) || k<=0) k = 1;
        at.scale.setScalar(k);
        if (size.y > .01){
          const b2 = new THREE.Box3().setFromObject(at);
          const c = b2.getCenter(new THREE.Vector3());
          at.position.set(-c.x, 1.02 - (b2.min.y + b2.max.y)/2, -c.z);
        } else {
          at.position.set(0, 1.02, 0);
        }
        at.traverse(o=>{
          if (o.isMesh){
            o.userData = {organ: (o.name||'anatomy').replace(/[\s_]*\d+$/,'')};
            if (o.material){ o.material = o.material.clone(); o.material.side = THREE.DoubleSide; }
          }
        });
        organs.add(at);
        organs.userData.anatomy = true;
      });
    }).catch(()=>{});

    // --- органы (видны в «рентгене») ---
    const organs = new THREE.Group(); body.add(organs); organs.visible = false;
    const organ = (id,geo,color,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{
      const mat = new THREE.MeshStandardMaterial({color, roughness:.45, transparent:true, opacity:.96});
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.rotation.set(rx,ry,rz);
      m.userData = {organ:id};
      organs.add(m); return m;
    };
    organ('brain',  new THREE.SphereGeometry(.115,22,18), 0xc9a0b8, 0,1.545,.01);
    organ('heart',  new THREE.SphereGeometry(.06,18,14), 0xb03030, -.048,1.16,.05, 1,1.2,.8, 0,0,.32);
    organ('lungs',  new THREE.SphereGeometry(.088,18,14), 0xd99a9a, -.095,1.175,.035, 1,1.42,.72, 0,0,.16);
    organ('lungs2', new THREE.SphereGeometry(.088,18,14), 0xd99a9a,  .095,1.175,.035, 1,1.42,.72, 0,0,-.16);
    organ('liver',  new THREE.SphereGeometry(.10,18,14), 0x9c5a38, .068,.965,.045, 1.3,.68,.8);
    organ('stomach',new THREE.SphereGeometry(.066,18,14), 0xcf9f62, -.066,.965,.055, .95,1.15,.8);
    organ('gut',    new THREE.TorusGeometry(.105,.04,12,26), 0xd0906a, 0,.85,.05, 1,.9,.8, Math.PI/2,0,0);
    organ('gut',    new THREE.TorusGeometry(.085,.036,12,24), 0xd0906a, 0,.735,.055, 1,.85,.75, Math.PI/2,0,.35);
    organ('kidney', new THREE.SphereGeometry(.045,14,12), 0x8a3b2e, -.075,.72,-.02, .7,1.15,.6, 0,0,.18);
    organ('kidney', new THREE.SphereGeometry(.045,14,12), 0x8a3b2e,  .075,.72,-.02, .7,1.15,.6, 0,0,-.18);
    organ('bladder',new THREE.SphereGeometry(.042,14,12), 0xc9c05a, 0,.60,.05);

    // --- точки ---
    const markers = new THREE.Group(); body.add(markers);
    const markerMeshes = [];
    function setPoints(list){
      while (markers.children.length){ markers.remove(markers.children[0]); }
      markerMeshes.length = 0;
      const geo = new THREE.SphereGeometry(.026,14,12);
      (list||[]).forEach(p=>{
        const mat = new THREE.MeshBasicMaterial({color: opts.color||0x2f6fed});
        const m = new THREE.Mesh(geo, mat);
        const [x,y,z] = px2world(p.u, p.v);
        m.position.set(x,y,z);
        m.userData = {id:p.id, label:p.label||''};
        markers.add(m); markerMeshes.push(m);
      });
    }
    setPoints(opts.points);

    // --- управление ---
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0,.98,0);
    controls.enableDamping = true; controls.dampingFactor = .08;
    controls.enablePan = false;
    controls.minDistance = 1.1; controls.maxDistance = 6;
    let auto = true;
    renderer.domElement.addEventListener('pointerdown', ()=>{ auto = false; });

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function cast(e){
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX-r.left)/r.width)*2-1;
      ndc.y = -((e.clientY-r.top)/r.height)*2+1;
      ray.setFromCamera(ndc, camera);
      const hitM = ray.intersectObjects(markerMeshes, false);
      if (hitM.length) return hitM[0].object;
      if (organs.visible){
        const hitO = ray.intersectObjects(organs.children, false);
        if (hitO.length) return hitO[0].object;
      }
      return null;
    }
    let downXY = null;
    renderer.domElement.addEventListener('pointerdown', e=>{ downXY=[e.clientX,e.clientY]; });
    renderer.domElement.addEventListener('pointerup', e=>{
      if (!downXY) return;
      const moved = Math.hypot(e.clientX-downXY[0], e.clientY-downXY[1]); downXY=null;
      if (moved>7 || !opts.onPick) return;
      const m = cast(e);
      if (!m) return;
      if (m.userData.organ){ if (opts.onOrgan) opts.onOrgan(m.userData.organ); return; }
      if (opts.onPick) opts.onPick(m.userData.id, m.userData.label);
    });
    renderer.domElement.addEventListener('pointermove', e=>{
      renderer.domElement.style.cursor = cast(e) ? 'pointer' : 'grab';
    });

    function setSkin(op){
      curOpacity = op;
      avatar.traverse(o=>{ if (o.isMesh && o.material) o.material.opacity = op; });
      organs.visible = op < .92;
      if (organs.visible && organs.userData.anatomy){
        organs.children.forEach(ch=>{ if (ch.type==='Group' || ch.isMesh) ch.visible = true; });
      }
    }
    let raf = 0;
    let pending = false, kicker = null;
    function kick(){
      if (pending) return;
      pending = true;
      const run = () => { if (!pending) return; pending = false; loop(); };
      raf = requestAnimationFrame(run);
      kicker = setTimeout(run, 110);
    }
    const clock = new THREE.Clock();
    function loop(){
      if (!renderer.domElement.isConnected){ dispose(); return; }
      const dt = clock.getDelta();
      if (mixer) mixer.update(dt);
      if (auto) body.rotation.y += .004;
      const t = clock.elapsedTime;
      markerMeshes.forEach((m,i)=>{ const k = 1 + .28*Math.sin(t*3.2 + i*1.3); m.scale.setScalar(k); });
      controls.update();
      renderer.render(scene, camera);
    }
    function dispose(){
      cancelAnimationFrame(raf);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    const ro = new ResizeObserver(()=>{
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      W=w; H=h;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w,h);
    });
    ro.observe(container);
    kick();

    container._body3d = { setPoints, setSkin, _three:{scene,camera,renderer,body,markers} };
    return container._body3d;
  }
  return { create, px2world };
})();

/* ---------- универсальный просмотрщик GLB (анатомия) ---------- */
window.AnatViewer = (function(){
  function open(container, gltf, onPick){
    const url = null;
    if (!window.THREE || !window.THREE.OrbitControls || !window.THREE.GLTFLoader) return null;
    try { const t=document.createElement('canvas'); if (!t.getContext('webgl') && !t.getContext('experimental-webgl')) return null; } catch(e){ return null; }
    const THREE = window.THREE;
    let W = container.clientWidth || 600, H = container.clientHeight || 560;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W/H, .01, 100);
    camera.position.set(0, .4, 2.6);
    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.setSize(W, H);
    renderer.domElement.style.display='block';
    container.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.1));
    const d1 = new THREE.DirectionalLight(0xffffff, .95); d1.position.set(2,3,4); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x93b4ff, .5); d2.position.set(-3,1.5,-2); scene.add(d2);
    const root = new THREE.Group(); scene.add(root);

    let picking = [];
    {
      const obj = gltf.scene;
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      let k = (maxDim > 1e-4 && maxDim < 1000) ? 1.6/maxDim : 1;
      if (!isFinite(k) || k<=0) k = 1;
      obj.scale.setScalar(k);
      const b2 = new THREE.Box3().setFromObject(obj);
      const c = b2.getCenter(new THREE.Vector3());
      obj.position.set(-c.x, -c.y, -c.z);
      root.add(obj);
      picking = [];
      obj.traverse(o=>{ if (o.isMesh) picking.push(o); });
      container._anat = {state:'ok', meshes:picking.length, k, maxDim:+maxDim.toFixed(2)};
      }

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0,0,0);
    controls.enableDamping = true; controls.dampingFactor = .08;
    controls.minDistance = .4; controls.maxDistance = 12;
    let auto = true, downXY = null;
    renderer.domElement.addEventListener('pointerdown', e=>{ auto=false; downXY=[e.clientX,e.clientY]; });
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function cast(e){
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX-r.left)/r.width)*2-1;
      ndc.y = -((e.clientY-r.top)/r.height)*2+1;
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(picking, false);
      for (const h of hits){
        let o = h.object;
        while (o && !o.name) o = o.parent;
        if (o && o.name) return o.name;
        return h.object.uuid;
      }
      return null;
    }
    renderer.domElement.addEventListener('pointerup', e=>{
      if (!downXY) return;
      const moved = Math.hypot(e.clientX-downXY[0], e.clientY-downXY[1]); downXY=null;
      if (moved>7 || !onPick) return;
      const name = cast(e);
      if (name) onPick(name);
    });
    renderer.domElement.addEventListener('pointermove', e=>{
      renderer.domElement.style.cursor = cast(e) ? 'pointer' : 'grab';
    });
    let raf = 0;
    let pending = false, kicker = null;
    function kick(){
      if (pending) return;
      pending = true;
      const run = () => { if (!pending) return; pending = false; loop(); };
      raf = requestAnimationFrame(run);
      kicker = setTimeout(run, 110);
    }
    const clock = new THREE.Clock();
    function loop(){
      if (!renderer.domElement.isConnected){ dispose(); return; }
      try {
        renderer.render(scene, camera);
      } catch(err){ window.__anatErr = String(err && err.message || err).slice(0,300); }
    }
    function dispose(){
      cancelAnimationFrame(raf);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    const ro = new ResizeObserver(()=>{
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      W=w; H=h;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w,h);
    });
    ro.observe(container);
    kick();
    return { dispose };
  }
  return { open };
})();

/* загрузка GLB снаружи (проверенный путь: fetch+parse) */
window.AnatLoader = (function(){
  let dracoLoader = null;
  return {
    parse(buf){
      const loader = new THREE.GLTFLoader();
      if (!dracoLoader && THREE.DRACOLoader){
        dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('vendor/draco/');
      }
      if (dracoLoader) loader.setDRACOLoader(dracoLoader);
      return new Promise((res, rej) => loader.parse(buf, '', res, rej));
    }
  };
})();
