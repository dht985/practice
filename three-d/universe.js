// ============================================================
// 星球宇宙 · Three.js（r128）
// 基础版：太阳 + 地球(月球) + 火星，点光源照明，公转/自转，轨道环绕
// ============================================================

// ---------- 场景 / 相机 / 渲染器 ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060f);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 7, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 鼠标拖拽环绕 / 滚轮缩放
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4;
controls.maxDistance = 40;

// ---------- 光源：太阳本体发光，弱环境光让暗面不死黑 ----------
scene.add(new THREE.AmbientLight(0x8899bb, 0.35));
const sunLight = new THREE.PointLight(0xfff1d0, 1.8, 0, 0); // decay=0：距离不衰减
scene.add(sunLight);

// ---------- 太阳（MeshBasicMaterial 不受光，自发光感） ----------
const SUN_R = 2;
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(SUN_R, 48, 48),
  new THREE.MeshBasicMaterial({ color: 0xffc233 })
);
scene.add(sun);

// ---------- 工具：细圆环轨道线 ----------
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

// ---------- 行星工厂：pivot 负责公转，mesh 负责自转 ----------
// 参数：半径、轨道半径、公转速度、自转速度、颜色
function makePlanet(cfg) {
  const pivot = new THREE.Object3D();
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(cfg.r, 40, 40),
    new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.9, metalness: 0 })
  );
  mesh.position.x = cfg.dist;
  pivot.add(mesh);
  pivot.rotation.y = cfg.startAngle || 0;
  scene.add(pivot);
  scene.add(makeOrbit(cfg.dist));
  return { pivot, mesh, orbitSpeed: cfg.orbitSpeed, spinSpeed: cfg.spinSpeed };
}

// 地球（蓝）
const earth = makePlanet({
  r: 0.6, dist: 5, orbitSpeed: 0.35, spinSpeed: 1.2,
  color: 0x2e6db4, startAngle: 0.5
});

// 月球：挂在地球 mesh 下，相对地球公转
const moonPivot = new THREE.Object3D();
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0xb8b8b8, roughness: 1 })
);
moon.position.x = 1.3;
moonPivot.add(moon);
earth.mesh.add(moonPivot);

// 火星（红）
const mars = makePlanet({
  r: 0.42, dist: 7.4, orbitSpeed: 0.22, spinSpeed: 1.0,
  color: 0xc1572b, startAngle: 2.6
});

const planets = [earth, mars];

// ---------- 动画主循环 ----------
const clock = new THREE.Clock();
let timeScale = 1; // 时间倍速（增强版会接 HUD）

function step(dt) {
  sun.rotation.y += dt * 0.15;
  planets.forEach(p => {
    p.pivot.rotation.y += dt * p.orbitSpeed * 0.3;
    p.mesh.rotation.y += dt * p.spinSpeed;
  });
  moonPivot.rotation.y += dt * 1.6; // 月球绕地球
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05) * timeScale;
  step(dt);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ---------- 窗口 resize 适配 ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 调试/自测钩子
window.__UNIVERSE__ = { scene, camera, sun, earth, mars, moon, step, setTimeScale: v => { timeScale = v; } };
