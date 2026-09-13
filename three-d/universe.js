// ============================================================
// 星球宇宙 · Three.js（r128）
// 太阳 + 地球(月球) + 火星 + 土星环 + 小行星带 + 星空粒子
// 所有纹理均由 Canvas 程序化生成，无任何外部图片资源
// ============================================================

// ---------- 固定随机数（每次刷新天体布局一致） ----------
function makeRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- Canvas 程序化纹理 ----------
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// 通用：随机椭圆斑块
function blobs(g, rnd, n, w, h, colors, rMin, rMax) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(rnd() * colors.length) | 0];
    g.beginPath();
    g.ellipse(rnd() * w, rnd() * h,
      rMin + rnd() * (rMax - rMin), rMin + rnd() * (rMax - rMin) * 0.6,
      rnd() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
}

function makeEarthTexture() {
  const rnd = makeRandom(101);
  return canvasTexture(512, 256, function (g, w, h) {
    g.fillStyle = '#15467a';                 // 海洋
    g.fillRect(0, 0, w, h);
    blobs(g, rnd, 26, w, h, ['#3c7a44', '#5c9148', '#8a7a48', '#2f6638'], 14, 64); // 陆地
    const top = g.createLinearGradient(0, 0, 0, 34);       // 北极冰盖
    top.addColorStop(0, 'rgba(240,248,255,.95)');
    top.addColorStop(1, 'rgba(240,248,255,0)');
    g.fillStyle = top; g.fillRect(0, 0, w, 34);
    const bot = g.createLinearGradient(0, h, 0, h - 34);    // 南极冰盖
    bot.addColorStop(0, 'rgba(240,248,255,.95)');
    bot.addColorStop(1, 'rgba(240,248,255,0)');
    g.fillStyle = bot; g.fillRect(0, h - 34, w, 34);
  });
}

function makeMarsTexture() {
  const rnd = makeRandom(202);
  return canvasTexture(512, 256, function (g, w, h) {
    g.fillStyle = '#a8471f';
    g.fillRect(0, 0, w, h);
    blobs(g, rnd, 20, w, h, ['#7c2f15', '#c16230', '#8f3d1c'], 10, 50);
    g.fillStyle = 'rgba(235,225,210,.8)';                 // 极冠
    g.beginPath(); g.ellipse(w / 2, 14, 70, 16, 0, 0, Math.PI * 2); g.fill();
  });
}

function makeMoonTexture() {
  const rnd = makeRandom(303);
  return canvasTexture(256, 128, function (g, w, h) {
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 38; i++) {                        // 陨石坑
      const x = rnd() * w, y = rnd() * h, r = 3 + rnd() * 10;
      const grd = g.createRadialGradient(x, y, 1, x, y, r);
      grd.addColorStop(0, 'rgba(60,60,60,.55)');
      grd.addColorStop(1, 'rgba(60,60,60,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  });
}

function makeSaturnTexture() {
  const rnd = makeRandom(404);
  return canvasTexture(256, 128, function (g, w, h) {
    g.fillStyle = '#d9bd8a';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {                         // 横向云带
      g.fillStyle = rnd() > 0.5 ? 'rgba(160,130,80,.35)' : 'rgba(245,230,195,.3)';
      const y = rnd() * h, hh = 4 + rnd() * 10;
      g.fillRect(0, y, w, hh);
    }
  });
}

function makeSunTexture() {
  const rnd = makeRandom(505);
  return canvasTexture(256, 128, function (g, w, h) {
    g.fillStyle = '#ffb020';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {                        // 表面亮/暗翻涌斑
      const x = rnd() * w, y = rnd() * h, r = 6 + rnd() * 22;
      const grd = g.createRadialGradient(x, y, 1, x, y, r);
      const light = rnd() > 0.5;
      grd.addColorStop(0, light ? 'rgba(255,235,160,.7)' : 'rgba(210,110,0,.45)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  });
}

// 太阳辉光：径向渐变 Sprite
function makeGlowTexture() {
  return canvasTexture(256, 256, function (g, w, h) {
    const grd = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.46);
    grd.addColorStop(0, 'rgba(255,228,160,.85)');
    grd.addColorStop(0.18, 'rgba(255,190,90,.32)');
    grd.addColorStop(0.45, 'rgba(255,160,60,.08)');
    grd.addColorStop(1, 'rgba(255,150,40,0)'); // 外缘严格透明，避免方形边
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
}

// ---------- 场景 / 相机 / 渲染器 ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060f);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 8.5, 18.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4;
controls.maxDistance = 60;

// ---------- 光源 ----------
scene.add(new THREE.AmbientLight(0x8899bb, 0.45));
const sunLight = new THREE.PointLight(0xfff1d0, 1.8, 0, 0); // decay=0：距离不衰减
scene.add(sunLight);

// ---------- 星空背景：1600 颗 Points 粒子 ----------
const starRnd = makeRandom(606);
const STAR_N = 1600;
const starPos = new Float32Array(STAR_N * 3);
const starCol = new Float32Array(STAR_N * 3);
const starPalette = [new THREE.Color(0xffffff), new THREE.Color(0xcfe0ff), new THREE.Color(0xffe8c0)];
for (let i = 0; i < STAR_N; i++) {
  const r = 60 + starRnd() * 90;
  const theta = starRnd() * Math.PI * 2;
  const phi = Math.acos(2 * starRnd() - 1);
  starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.cos(phi);
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  const c = starPalette[(starRnd() * starPalette.length) | 0];
  starCol[i * 3] = c.r; starCol[i * 3 + 1] = c.g; starCol[i * 3 + 2] = c.b;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  size: 0.55, vertexColors: true, transparent: true, opacity: 0.95,
  sizeAttenuation: true, depthWrite: false
}));
scene.add(stars);

// ---------- 太阳 + 辉光 ----------
const SUN_R = 2;
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(SUN_R, 48, 48),
  new THREE.MeshBasicMaterial({ map: makeSunTexture() })
);
scene.add(sun);

const glow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture(), transparent: true,
  blending: THREE.AdditiveBlending, depthWrite: false
}));
glow.scale.set(5.6, 5.6, 1);
scene.add(glow);

// ---------- 细圆环轨道线 ----------
function makeOrbit(radius) {
  const seg = 128;
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0x5f6f9e, transparent: true, opacity: 0.45 });
  return new THREE.Line(geo, mat);
}

// ---------- 行星工厂：pivot公转 → tilt轴倾角 → mesh自转 ----------
function makePlanet(cfg) {
  const pivot = new THREE.Object3D();
  const holder = new THREE.Object3D();
  holder.position.x = cfg.dist;          // 轨道半径偏移
  const tilt = new THREE.Object3D();
  tilt.rotation.z = cfg.tilt || 0;       // 自转轴倾角（只影响自转，不抬离轨道面）
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(cfg.r, 40, 40),
    new THREE.MeshStandardMaterial({
      map: cfg.texture || null,
      color: cfg.texture ? 0xffffff : cfg.color,
      roughness: 0.9, metalness: 0
    })
  );
  tilt.add(mesh);
  holder.add(tilt);
  pivot.add(holder);
  pivot.rotation.y = cfg.startAngle || 0;
  scene.add(pivot);
  scene.add(makeOrbit(cfg.dist));
  return { pivot, holder, tilt, mesh, orbitSpeed: cfg.orbitSpeed, spinSpeed: cfg.spinSpeed };
}

const earth = makePlanet({
  r: 0.6, dist: 5, orbitSpeed: 0.35, spinSpeed: 1.2, tilt: 0.18,
  texture: makeEarthTexture(), startAngle: 0.5
});

const moonPivot = new THREE.Object3D();
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 24, 24),
  new THREE.MeshStandardMaterial({ map: makeMoonTexture(), roughness: 1 })
);
moon.position.x = 1.3;
moonPivot.add(moon);
earth.mesh.add(moonPivot);

const mars = makePlanet({
  r: 0.42, dist: 7.4, orbitSpeed: 0.22, spinSpeed: 1.0,
  texture: makeMarsTexture(), startAngle: 2.6
});

// ---------- 土星：球体 + 三层环 ----------
const saturn = makePlanet({
  r: 1.05, dist: 10.4, orbitSpeed: 0.15, spinSpeed: 0.8, tilt: 0.42,
  texture: makeSaturnTexture(), startAngle: 1.95
});
const ringDefs = [
  [1.35, 1.55, 0xcbbf96, 0.7],
  [1.62, 1.95, 0xb3a277, 0.5],
  [2.02, 2.25, 0x9c8d66, 0.3]
];
ringDefs.forEach(function (d) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(d[0], d[1], 96),
    new THREE.MeshStandardMaterial({
      color: d[2], roughness: 0.9, side: THREE.DoubleSide,
      transparent: true, opacity: d[3]
    })
  );
  ring.rotation.x = -Math.PI / 2; // 环铺在赤道面上（受 tilt 组影响整体倾斜）
  saturn.tilt.add(ring);
});

const planets = [earth, mars, saturn];

// ---------- 小行星带：260 个四面体，InstancedMesh 一次绘制 ----------
const BELT_N = 260;
const beltRnd = makeRandom(707);
const belt = new THREE.InstancedMesh(
  new THREE.TetrahedronGeometry(0.09, 0),
  new THREE.MeshStandardMaterial({ color: 0x756b5f, roughness: 1 }),
  BELT_N
);
const dummy = new THREE.Object3D();
for (let i = 0; i < BELT_N; i++) {
  const r = 8.4 + beltRnd() * 1.1;
  const a = beltRnd() * Math.PI * 2;
  dummy.position.set(Math.cos(a) * r, (beltRnd() - 0.5) * 0.5, Math.sin(a) * r);
  dummy.rotation.set(beltRnd() * 6, beltRnd() * 6, beltRnd() * 6);
  const s = 0.5 + beltRnd() * 1.3;
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  belt.setMatrixAt(i, dummy.matrix);
}
belt.instanceMatrix.needsUpdate = true;
scene.add(belt);

// ---------- 动画主循环 ----------
const clock = new THREE.Clock();
let timeScale = 1;
let paused = false;

function step(dt) {
  sun.rotation.y += dt * 0.15;
  planets.forEach(function (p) {
    p.pivot.rotation.y += dt * p.orbitSpeed * 0.3;
    p.mesh.rotation.y += dt * p.spinSpeed;
  });
  moonPivot.rotation.y += dt * 1.6;
  belt.rotation.y += dt * 0.06;   // 小行星带整体缓转
  stars.rotation.y += dt * 0.004; // 星空极慢转动
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05) * timeScale;
  if (!paused) step(dt);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ---------- HUD：暂停 + 倍速 ----------
const btnPause = document.getElementById('btn-pause');
btnPause.addEventListener('click', function () {
  paused = !paused;
  btnPause.textContent = paused ? '▶ 继续' : '⏸ 暂停';
});
const speedBtns = document.querySelectorAll('.btn-speed');
speedBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    timeScale = parseFloat(btn.dataset.speed);
    speedBtns.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

// ---------- 窗口 resize 适配 ----------
window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 调试/自测钩子
window.__UNIVERSE__ = {
  scene, camera, sun, earth, mars, saturn, moon, belt, stars,
  step, setTimeScale: function (v) { timeScale = v; },
  setPaused: function (v) { paused = v; },
  isPaused: function () { return paused; },
  getTimeScale: function () { return timeScale; }
};
