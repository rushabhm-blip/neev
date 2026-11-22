import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const BLUE = 0x6c86ae, BLUE_D = 0x4d6489, WHITE = 0xf3f5f9, INK = 0x151c28;

export function initScene({ container, screenEl, onKey }) {
  const w0 = container.clientWidth, h0 = container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w0, h0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;';
  container.appendChild(renderer.domElement);

  const css = new CSS3DRenderer();
  css.setSize(w0, h0);
  css.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  container.appendChild(css.domElement);

  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environmentIntensity = 0.5;
  const camera = new THREE.PerspectiveCamera(32, w0 / h0, 0.1, 60);
  const home = { pos: new THREE.Vector3(3.9, 3.0, 5.4), target: new THREE.Vector3(0, 1.05, 0.9) };
  camera.position.copy(home.pos);

  const controls = new OrbitControls(camera, container);
  controls.target.copy(home.target);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 3.6; controls.maxDistance = 16;
  controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.48;
  controls.minAzimuthAngle = -1.15; controls.maxAzimuthAngle = 1.15;
  controls.update();

  // ---- lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8696b4, 0.55));
  const rim = new THREE.DirectionalLight(0x7fa6ff, 1.6); rim.position.set(-4, 3, -5); scene.add(rim);
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(3.5, 7, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6; sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdde8ff, 0.7); fill.position.set(-5, 3, 2); scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.38 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // soft pool of light on the table so the product feels grounded
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); const gr = g.createRadialGradient(256, 256, 20, 256, 256, 256); gr.addColorStop(0, 'rgba(120,160,255,.42)'); gr.addColorStop(.45, 'rgba(90,130,230,.16)'); gr.addColorStop(1, 'rgba(60,100,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(0, -0.004, 0.8); scene.add(glow);

  const mat = (c, r = 0.5, m = 0.04) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const glossy = (c, r = 0.35) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, metalness: 0.08, clearcoat: 0.6, clearcoatRoughness: 0.28 });
  const shadowed = (o) => { o.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } }); return o; };

  // ---- machine body (side-profile extrusion)
  const machine = new THREE.Group(); machine.position.y = 0.14; scene.add(machine);
  const W = 2.4;
  const shape = new THREE.Shape();
  shape.moveTo(-1.2, 0.02); shape.lineTo(1.2, 0.02); shape.lineTo(1.2, 0.72); shape.lineTo(0.62, 0.9); shape.lineTo(-0.75, 2.15); shape.lineTo(-1.2, 2.15); shape.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: W - 0.16, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 6, curveSegments: 8 });
  bodyGeo.translate(0, 0, -(W - 0.16) / 2); bodyGeo.rotateY(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, glossy(BLUE, 0.42)); machine.add(body);
  // accent LED strip along the edge above the keys + status light
  const led = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.035, 0.05, 2, 0.015), new THREE.MeshBasicMaterial({ color: 0x5b8bff }));
  led.position.set(0, 0.92, 0.6); led.rotation.x = 0.7; machine.add(led);
  const statusLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshBasicMaterial({ color: 0x3ddc84 }));
  statusLed.position.set(1.02, 0.9, 0.97); machine.add(statusLed);

  // screen bezel + CSS3D screen on the sloped face
  const slopeN = new THREE.Vector3(0, 0.739, 0.674).normalize();
  const slopeRot = -Math.atan2(0.739, 0.674);          // rotation.x so +z faces slopeN
  const screenCenter = new THREE.Vector3(0, 1.525, -0.065).addScaledVector(slopeN, 0.115);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(2.16, 1.56, 0.05, 4, 0.06), new THREE.MeshPhysicalMaterial({ color: 0x0c1220, roughness: 0.25, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }));
  bezel.position.copy(screenCenter).addScaledVector(slopeN, -0.045); bezel.rotation.x = slopeRot; machine.add(bezel);
  const screenObj = new CSS3DObject(screenEl);
  screenObj.scale.setScalar(1 / 400);
  screenObj.position.copy(screenCenter).addScaledVector(slopeN, 0.012); screenObj.rotation.x = slopeRot;
  machine.add(screenObj);
  // glass sheen (very subtle) so the bezel reads as a display
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 }));
  glass.position.copy(screenObj.position); glass.rotation.x = slopeRot; machine.add(glass);

  // ---- hardware keys on the ledge
  const keyMeshes = [];
  const glyph = (txt) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#1b2433'; g.strokeStyle = '#1b2433'; g.lineCap = 'round'; g.lineJoin = 'round';
    if (txt === 'mic') { g.lineWidth = 9; g.beginPath(); g.roundRect(48, 18, 32, 56, 16); g.fill(); g.beginPath(); g.arc(64, 62, 30, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(64, 94); g.lineTo(64, 112); g.stroke(); }
    else { g.font = 'bold 84px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 70); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  let micKey = null, listening = false;
  // three keys: Confirm, Scan, Mic. There is no Back key (Mic again redoes a voice entry).
  [['ok', '✓', -0.62], ['scan', '▥', 0], ['mic', 'mic', 0.62]].forEach(([k, ch, x]) => {
    const g = new THREE.Group(); g.position.set(x, 0.835, 1.0); g.rotation.x = 0.3;
    const keyM = mat(k === 'mic' ? 0xe6eeff : WHITE, 0.35, 0.02);
    const key = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.09, 0.3, 4, 0.04), keyM); key.userData.key = k; key.userData.base = keyM;
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: glyph(ch), transparent: true })); lab.rotation.x = -Math.PI / 2; lab.position.y = 0.046;
    g.add(key, lab); machine.add(g); keyMeshes.push(key); if (k === 'mic') micKey = key;
  });
  // stylus on a tether, parked on the right side
  const stylusG = new THREE.Group(); stylusG.position.set(1.235, 1.2, -0.1);
  stylusG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 20), mat(0xf4f6fa, 0.4)));
  const sTip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 20), mat(0x2b3445, 0.4)); sTip.position.y = -0.41; sTip.rotation.x = Math.PI; stylusG.add(sTip);
  const sBand = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.05, 20), mat(BLUE_D, 0.4)); sBand.position.y = 0.2; stylusG.add(sBand);
  machine.add(stylusG);
  const tether = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(1.235, 0.84, -0.1), new THREE.Vector3(1.3, 0.68, 0.02), new THREE.Vector3(1.27, 0.5, 0.35)]), 24, 0.007, 8), mat(0x1c2230, 0.6)); machine.add(tether);

  // ---- printer slot + paper, scanner window, speaker, feet
  const slot = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.13, 0.06, 3, 0.03), mat(INK, 0.4)); slot.position.set(-0.55, 0.42, 1.27); machine.add(slot);
  const scanner = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.3, 0.05, 3, 0.04), mat(0x1c2230, 0.2, 0.2)); scanner.position.set(0.55, 0.4, 1.27); machine.add(scanner);
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.02), new THREE.MeshBasicMaterial({ color: 0xff3b30 })); beam.position.set(0.55, 0.4, 1.3); machine.add(beam);
  const paperTex = new THREE.CanvasTexture(document.createElement('canvas'));
  const paperMat = new THREE.MeshStandardMaterial({ map: paperTex, side: THREE.DoubleSide, roughness: 0.9 });
  const paperPivot = new THREE.Group(); paperPivot.position.set(-0.55, 0.43, 1.3); paperPivot.rotation.x = 0.28; machine.add(paperPivot);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1), paperMat); paper.geometry.translate(0, -0.5, 0); paper.scale.y = 0.001; paper.castShadow = true; paperPivot.add(paper);
  const grille = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#6f86a8'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#3c4d68'; for (let y = 12; y < 256; y += 20) for (let x = 12; x < 256; x += 20) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const spk = new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), new THREE.MeshStandardMaterial({ map: grille, roughness: 0.6 })); spk.position.set(1.285, 1.15, -0.55); spk.rotation.y = Math.PI / 2; machine.add(spk);
  const spkL = spk.clone(); spkL.position.x = -1.285; spkL.rotation.y = -Math.PI / 2; machine.add(spkL);
  const feet = [[-1, -0.95], [1, -0.95], [-1, 0.95], [1, 0.95]].map(([x, z]) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 24), mat(0x0f141d, 0.7)); f.position.set(x, -0.07, z); machine.add(f); return f; });
  const logo = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.92)'; g.font = '800 70px Plus Jakarta Sans, Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('neev', 128, 52); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshBasicMaterial({ map: t, transparent: true })); })();
  logo.position.set(0, 0.2, 1.285); machine.add(logo);
  shadowed(machine);

  // ---- weighing base (the machine docks on it; it also works as a scale beside the machine)
  const base = new THREE.Group(); scene.add(base);
  const BASE_TOP = 0.27;
  const silver = new THREE.MeshPhysicalMaterial({ color: 0xcfd6e2, roughness: 0.32, metalness: 0.7, clearcoat: 0.4 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: 0.22, metalness: 0.95 });
  const baseBody = new THREE.Mesh(new RoundedBoxGeometry(2.95, 0.22, 2.75, 5, 0.09), silver); baseBody.position.y = 0.11; base.add(baseBody);
  const tray = new THREE.Mesh(new RoundedBoxGeometry(2.7, 0.05, 2.5, 3, 0.02), steel); tray.position.y = 0.245; base.add(tray);
  const BZ = 1.38;                                          // front face of the base
  const latch = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.09, 0.05, 3, 0.02), mat(0xaab3c4, 0.3, 0.8)); latch.position.set(-0.55, 0.12, BZ); base.add(latch);
  const lcdCanvas = document.createElement('canvas'); lcdCanvas.width = 256; lcdCanvas.height = 96; const lcdTex = new THREE.CanvasTexture(lcdCanvas); lcdTex.colorSpace = THREE.SRGBColorSpace;
  function setWeightText(txt) { const g = lcdCanvas.getContext('2d'); g.fillStyle = '#0c1422'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#9fe8ff'; g.font = 'bold 54px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 52); lcdTex.needsUpdate = true; }
  setWeightText('0.00 kg');
  const lcd = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.15, 0.03, 3, 0.02), new THREE.MeshBasicMaterial({ map: lcdTex })); lcd.position.set(0.3, 0.12, BZ + 0.005); base.add(lcd);
  const tareM = mat(WHITE, 0.35, 0.02);
  const tareKey = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.12, 0.07, 3, 0.03), tareM); tareKey.position.set(0.98, 0.12, BZ + 0.01); tareKey.userData.key = 'tare'; tareKey.userData.y0 = 0.12; tareKey.userData.base = tareM; base.add(tareKey); keyMeshes.push(tareKey);
  const tareLab = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#1b2433'; g.font = 'bold 40px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Tare', 64, 34); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.13), new THREE.MeshBasicMaterial({ map: t, transparent: true })); })();
  tareLab.position.set(0, 0, 0.037); tareKey.add(tareLab);
  const baseLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), new THREE.MeshBasicMaterial({ color: 0x3ddc84 })); baseLed.position.set(-0.05, 0.18, BZ + 0.01); base.add(baseLed);
  for (const [x, z] of [[-1.25, -1.1], [1.25, -1.1], [-1.25, 1.1], [1.25, 1.1]]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.05, 20), mat(0x0f141d, 0.7)); f.position.set(x, 0.025, z); base.add(f); }
  // bowl and goods (shown when the machine is lifted off and goods are placed)
  const goods = new THREE.Group(); goods.position.set(0, BASE_TOP, 0); base.add(goods);
  const bowlPts = [[0, 0], [0.34, 0], [0.42, 0.03], [0.58, 0.16], [0.68, 0.3], [0.7, 0.45], [0.72, 0.48], [0.69, 0.48], [0.66, 0.44], [0.64, 0.31], [0.54, 0.18], [0.38, 0.06], [0, 0.04]].map(([r, y]) => new THREE.Vector2(r, y));
  const bowlM = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 48), new THREE.MeshStandardMaterial({ color: 0xdfe5ee, roughness: 0.16, metalness: 1, side: THREE.DoubleSide })); goods.add(bowlM);
  const toms = new THREE.Group(); goods.add(toms);
  const tomM = new THREE.MeshPhysicalMaterial({ color: 0xc8281e, roughness: 0.28, clearcoat: 0.7 });
  [[0, 0.5, 0, 0.22], [0.2, 0.42, 0.13, 0.2], [-0.2, 0.44, 0.1, 0.2], [0.04, 0.42, -0.24, 0.21], [-0.24, 0.4, -0.1, 0.19], [0.26, 0.4, -0.15, 0.19], [0.02, 0.7, 0.02, 0.2], [-0.12, 0.64, -0.12, 0.17]].forEach(([x, y, z, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), tomM); s.position.set(x, y - 0.14, z); s.scale.y = 0.9; toms.add(s); });
  goods.visible = false; toms.visible = false;
  shadowed(base); shadowed(goods);
  const BASE_X_DOCKED = 0, BASE_X_OUT = 1.75, MACH_X_OUT = -1.75;
  const MACH_Y_DOCKED = BASE_TOP + 0.14, MACH_Y_OUT = 0.14;
  machine.position.y = MACH_Y_DOCKED;
  let docked = true;

  // ---- interaction
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let down = null;
  container.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  container.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const hit = pick(e); if (hit) { pressKey(hit); }
    down = null;
  });
  container.addEventListener('pointermove', (e) => { if (e.buttons) return; const h = pick(e); container.style.cursor = h ? 'pointer' : 'grab'; keyMeshes.forEach((k) => k.material.emissive?.setHex(k === h || (listening && k === micKey) ? 0x2255ff : 0x000000)); });
  function pick(e) { const r = container.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, camera); const hits = ray.intersectObjects(keyMeshes, false); return hits[0] ? hits[0].object : null; }
  const pressAnim = new Map();
  function pressKey(mesh) { pressAnim.set(mesh, 1); onKey(mesh.userData.key); }

  // ---- state hooks
  function printReceipt(sale) {
    const c = paperTex.image; c.width = 340; c.height = 520; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 340, 520); g.fillStyle = '#18202E';
    g.font = 'bold 26px Arial'; g.fillText('Asha Stores', 20, 40); g.font = '16px Arial'; g.fillStyle = '#5F6B7A'; g.fillText('#' + sale.no + ' · ' + sale.when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), 20, 66);
    g.fillStyle = '#18202E'; let y = 108; g.font = '18px Arial';
    for (const l of sale.items.slice(0, 5)) { g.fillText(l.name.slice(0, 18), 20, y); g.textAlign = 'right'; g.fillText('₹' + l.price * l.qty, 320, y); g.textAlign = 'left'; g.fillStyle = '#5F6B7A'; g.font = '14px Arial'; g.fillText(l.qty + ' × ₹' + l.price, 20, y + 20); g.fillStyle = '#18202E'; g.font = '18px Arial'; y += 52; }
    g.fillRect(20, y, 300, 2); g.font = 'bold 24px Arial'; g.fillText('Total', 20, y + 38); g.textAlign = 'right'; g.fillText('₹' + sale.total, 320, y + 38); g.textAlign = 'left'; g.font = '15px Arial'; g.fillStyle = '#5F6B7A'; g.fillText('Paid by ' + (sale.method === 'cash' ? 'cash' : 'UPI') + ' · Thank you', 20, y + 70);
    paperTex.needsUpdate = true; paperTex.colorSpace = THREE.SRGBColorSpace;
    paperTex.repeat.set(1, 1);
    paperAnim = { t: 0 };
  }
  let paperAnim = null;

  const views = { docked: home, out: { pos: new THREE.Vector3(1.6, 3.6, 8.2), target: new THREE.Vector3(0, 0.95, 0.4) } };
  let tween = null;
  function setDocked(d) { docked = d; if (d) { goods.visible = false; setWeightText('0.00 kg'); } tween = { v: d ? views.docked : views.out, n: 0 }; }
  function setGoods(n) { goods.visible = docked ? false : n > 0; toms.visible = n > 1; }
  function setListening(on) { listening = on; if (!on && micKey) micKey.material.emissive?.setHex(0x000000); }
  function resetView() { camera.position.copy(home.pos); controls.target.copy(home.target); controls.update(); }

  // ---- loop
  const clock = new THREE.Clock(); const tmp = new THREE.Vector3(), nrm = new THREE.Vector3();
  const sWorld = new THREE.Vector3();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (tween) { const kk = 1 - Math.exp(-dt * 4.5); camera.position.lerp(tween.v.pos, kk); controls.target.lerp(tween.v.target, kk); tween.t = (tween.t || 0) + dt; if (tween.t > 2.5) tween = null; }
    controls.update();
    // machine lifts off the base and the base slides beside it (and back)
    const k = 1 - Math.exp(-dt * 6);
    const tx = docked ? 0 : MACH_X_OUT, ty = docked ? MACH_Y_DOCKED : MACH_Y_OUT, bx = docked ? BASE_X_DOCKED : BASE_X_OUT;
    machine.position.x += (tx - machine.position.x) * k; machine.position.y += (ty - machine.position.y) * k; base.position.x += (bx - base.position.x) * k;
    if (listening && micKey) micKey.material.emissiveIntensity = 0.55 + 0.45 * Math.sin(performance.now() / 160);
    else if (micKey) micKey.material.emissiveIntensity = 1;
    // paper animation
    if (paperAnim) { paperAnim.t += 0.016; const p = Math.min(paperAnim.t / 1.6, 1); paper.scale.y = 0.001 + 0.82 * (1 - Math.pow(1 - p, 3)); if (paperAnim.t > 9) { paper.scale.y = Math.max(0.001, paper.scale.y - 0.05); if (paper.scale.y <= 0.002) paperAnim = null; } }
    // key press animation
    pressAnim.forEach((v, k) => { const nv = v - 0.12, y0 = k.userData.y0 || 0; k.position.y = y0 - Math.sin(Math.max(nv, 0) * Math.PI) * 0.03; if (nv <= 0) { k.position.y = y0; pressAnim.delete(k); } else pressAnim.set(k, nv); });
    // hide DOM planes when seen from behind (CSS3D has no depth test)
    screenObj.getWorldPosition(tmp); nrm.copy(slopeN).applyQuaternion(machine.quaternion);
    const front = nrm.dot(camera.position.clone().sub(tmp)) > 0.15;
    screenEl.style.visibility = front ? 'visible' : 'hidden';
    renderer.render(scene, camera); css.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();

  const fit = () => { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h); css.setSize(w, h); camera.aspect = w / h; camera.fov = 2 * Math.atan(Math.tan((32 * Math.PI / 180) / 2) * Math.max(1, 1.12 / camera.aspect)) * 180 / Math.PI; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(fit); ro.observe(container); fit();

  return { setDocked, setGoods, setWeightText, setListening, printReceipt, resetView, isDocked: () => docked };
}
