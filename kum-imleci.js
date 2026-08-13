/* ---------------- kum imleci (opsiyonel, kişisel tercih) ---------------- */
function kumImleciTercihOku(){
  try { return localStorage.getItem("tys_kum_imleci") === "acik"; }
  catch(e){ return false; }
}
function kumImleciTercihYaz(deger){
  try { localStorage.setItem("tys_kum_imleci", deger ? "acik" : "kapali"); } catch(e){}
}

(function(){
  const SCALE = 1.4;
  const BASE_SIZE = 24;
  const PAD = 4;
  const FILL_DURATION = 1400;
  const GRAIN_COUNT = 420;
  const GRAIN_COLORS = ['#e6b955','#d9a441','#c8892c','#f2c96b','#b9791f'];
  const OUTLINE_COLOR = '#f5f1e6';
  const OUTLINE_WIDTH = 1.6;
  const rawPoints = [[4,4],[11.07,21],[13.58,13.61],[21,11.07]];

  let aktif = false;
  let kurulumTamam = false;
  let canvas, ctx, SIZE, pts, tip, arrowPath, grains, maxDist;
  let particles = [];
  let startTime = 0, mouseX = -100, mouseY = -100, visible = false, lastSpawn = 0;

  function spawnParticle(){
    const centroid = [
      (pts[0][0]+pts[1][0]+pts[2][0]+pts[3][0]) / 4,
      (pts[0][1]+pts[1][1]+pts[2][1]+pts[3][1]) / 4
    ];
    const dx = centroid[0]-tip[0], dy = centroid[1]-tip[1];
    const len = Math.hypot(dx,dy) || 1;
    particles.push({
      x: tip[0], y: tip[1],
      vx: (dx/len)*0.6 + (Math.random()-0.5)*0.4,
      vy: (dy/len)*0.6 + Math.random()*0.3,
      life: 0, maxLife: 260 + Math.random()*200,
      r: 0.25 + Math.random()*0.3,
      color: GRAIN_COLORS[(Math.random()*GRAIN_COLORS.length)|0]
    });
  }

  function kurulumYap(){
    if (kurulumTamam) return;
    kurulumTamam = true;
    const dpr = window.devicePixelRatio || 1;
    SIZE = Math.ceil(BASE_SIZE*SCALE) + PAD*2;
    canvas = document.getElementById('sandCursor');
    if (!canvas) { kurulumTamam = false; return; }
    canvas.width = SIZE*dpr; canvas.height = SIZE*dpr;
    canvas.style.width = SIZE+'px'; canvas.style.height = SIZE+'px';
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    pts = rawPoints.map(([x,y]) => [x*SCALE+PAD, y*SCALE+PAD]);
    tip = pts[0];
    const p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i=1; i<pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
    arrowPath = p;

    const minX = Math.min(...pts.map(p=>p[0])), maxX = Math.max(...pts.map(p=>p[0]));
    const minY = Math.min(...pts.map(p=>p[1])), maxY = Math.max(...pts.map(p=>p[1]));
    grains = [];
    let guard = 0;
    while (grains.length < GRAIN_COUNT && guard < GRAIN_COUNT*60){
      guard++;
      const x = minX + Math.random()*(maxX-minX);
      const y = minY + Math.random()*(maxY-minY);
      if (ctx.isPointInPath(arrowPath, x, y)){
        const dist = Math.hypot(x-tip[0], y-tip[1]);
        grains.push({ x, y, dist, r: 0.28+Math.random()*0.38, color: GRAIN_COLORS[(Math.random()*GRAIN_COLORS.length)|0], jitter: Math.random()*220 });
      }
    }
    maxDist = Math.max(...grains.map(g=>g.dist));
    grains.sort((a,b)=>a.dist-b.dist);
    startTime = performance.now();

    window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; visible = true; });
    window.addEventListener('mousedown', () => { startTime = performance.now(); particles = []; });
    window.addEventListener('mouseleave', () => { visible = false; });
    window.addEventListener('mouseenter', () => { visible = true; });

    requestAnimationFrame(draw);
  }

  function draw(now){
    if (!aktif) { if (canvas) canvas.style.opacity = 0; return; }
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / FILL_DURATION);
    if (progress < 1 && now - lastSpawn > 35){ spawnParticle(); lastSpawn = now; }

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.clip(arrowPath);

    const revealRadius = progress * maxDist * 1.35;
    if (revealRadius > 0){
      ctx.beginPath(); ctx.fillStyle = '#c8892c';
      ctx.arc(tip[0], tip[1], revealRadius, 0, Math.PI*2); ctx.fill();
    }
    for (const g of grains){
      if (g.dist <= revealRadius){
        ctx.beginPath(); ctx.fillStyle = g.color;
        ctx.arc(g.x, g.y, g.r, 0, Math.PI*2); ctx.fill();
      }
    }
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life += 16;
      const a = Math.max(0, 1 - p.life/p.maxLife);
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });
    particles = particles.filter(p => p.life < p.maxLife);
    ctx.restore();

    ctx.lineJoin = 'round';
    ctx.lineWidth = OUTLINE_WIDTH;
    ctx.strokeStyle = OUTLINE_COLOR;
    ctx.stroke(arrowPath);

    if (visible){
      canvas.style.transform = `translate3d(${mouseX-tip[0]}px, ${mouseY-tip[1]}px, 0)`;
      canvas.style.opacity = 1;
    } else {
      canvas.style.opacity = 0;
    }
    requestAnimationFrame(draw);
  }

  window.kumImleciBaslat = function(){
    if (!window.matchMedia('(pointer: fine)').matches) return; // dokunmatik cihazlarda çalışmasın
    aktif = true;
    document.body.classList.add('custom-cursor-active');
    kurulumYap();
  };
  window.kumImleciDurdur = function(){
    aktif = false;
    document.body.classList.remove('custom-cursor-active');
    if (canvas) canvas.style.opacity = 0;
  };
})();

function kumImleciAcKapat(deger){
  kumImleciTercihYaz(deger);
  if (deger) { if (window.kumImleciBaslat) window.kumImleciBaslat(); }
  else { if (window.kumImleciDurdur) window.kumImleciDurdur(); }
  render();
}
