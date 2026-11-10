import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const BLUE = 0x7d93b5, BLUE_D = 0x5f7599, WHITE = 0xf3f5f9, INK = 0x151c28;

export function initScene({ container, screenEl, slateEl, onKey }) {
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

  const scene = new THREE.Scene();
  const cssScene = new THREE.Scene();
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
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb7c3d6, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(3.5, 7, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6; sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdde8ff, 0.7); fill.position.set(-5, 3, 2); scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.22 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const mat = (c, r = 0.5, m = 0.04) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const shadowed = (o) => { o.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } }); return o; };

  // ---- machine body (side-profile extrusion)
  const machine = new THREE.Group(); machine.position.y = 0.14; scene.add(machine);
  const W = 2.4;
  const shape = new THREE.Shape();
  shape.moveTo(-1.2, 0.02); shape.lineTo(1.2, 0.02); shape.lineTo(1.2, 0.72); shape.lineTo(0.62, 0.9); shape.lineTo(-0.75, 2.15); shape.lineTo(-1.2, 2.15); shape.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: W - 0.16, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 6, curveSegments: 8 });
  bodyGeo.translate(0, 0, -(W - 0.16) / 2); bodyGeo.rotateY(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, mat(BLUE, 0.48, 0.06)); machine.add(body);

  // screen bezel + CSS3D screen on the sloped face
  const slopeN = new THREE.Vector3(0, 0.739, 0.674).normalize();
  const slopeRot = -Math.atan2(0.739, 0.674);          // rotation.x so +z faces slopeN
  const screenCenter = new THREE.Vector3(0, 1.525, -0.065).addScaledVector(slopeN, 0.115);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(2.16, 1.56, 0.05, 4, 0.06), mat(INK, 0.3, 0.1));
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
  const glyph = (txt) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#1b2433'; g.font = 'bold 84px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 70); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  [['back', '↩', -0.62], ['ok', '✓', 0], ['scan', '▥', 0.62]].forEach(([k, ch, x]) => {
    const g = new THREE.Group(); g.position.set(x, 0.835, 1.0); g.rotation.x = 0.3;
    const keyM = mat(WHITE, 0.35, 0.02);
    const key = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.09, 0.3, 4, 0.04), keyM); key.userData.key = k; key.userData.base = keyM;
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: glyph(ch), transparent: true })); lab.rotation.x = -Math.PI / 2; lab.position.y = 0.046;
    g.add(key, lab); machine.add(g); keyMeshes.push(key);
  });

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

  // ---- writing slate (moves out under the machine)
  const slate = new THREE.Group(); slate.position.set(0, 0.07, 0); scene.add(slate);
  const slateBody = new THREE.Mesh(new RoundedBoxGeometry(2.7, 0.12, 2.7, 4, 0.05), mat(0xe9edf3, 0.55, 0.02)); slateBody.position.set(0, 0, 0.15); slate.add(slateBody);
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 2.35), mat(0xfbfbf4, 0.9)); surface.rotation.x = -Math.PI / 2; surface.position.set(0, 0.062, 0.12); slate.add(surface);
  const stylus = new THREE.Group();
  const sBody = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 20), mat(0xf7f7f9, 0.4)); sBody.rotation.z = Math.PI / 2;
  const sTip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 20), mat(0x2b3445, 0.4)); sTip.rotation.z = Math.PI / 2; sTip.position.x = 0.5;
  const sClip = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.05, 0.08, 2, 0.02), mat(BLUE_D, 0.4)); sClip.position.set(-0.15, 0.04, 0);
  stylus.add(sBody, sTip, sClip); stylus.position.set(0.35, 0.1, 1.38); slate.add(shadowed(stylus));
  shadowed(slateBody);
  const slateObj = new CSS3DObject(slateEl);
  slateObj.scale.setScalar(1 / 400);
  slateObj.position.set(0, 0.07, 0.12); slateObj.rotation.x = -Math.PI / 2;
  slate.add(slateObj);

  // ---- interaction
  let slateTarget = 0; const OUT = 2.75;
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let down = null;
  container.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  container.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const hit = pick(e); if (hit) { pressKey(hit); }
    down = null;
  });
  container.addEventListener('pointermove', (e) => { if (e.buttons) return; const h = pick(e); container.style.cursor = h ? 'pointer' : 'grab'; keyMeshes.forEach((k) => k.material.emissive?.setHex(k === h ? 0x2255ff : 0x000000)); });
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

  const views = { docked: home, out: { pos: new THREE.Vector3(0.8, 6.4, 8.4), target: new THREE.Vector3(0, 0.5, 1.7) } };
  let tween = null;
  function setSlateDocked(d) { slateTarget = d ? 0 : OUT; tween = { v: d ? views.docked : views.out, n: 0 }; }
  function resetView() { camera.position.copy(home.pos); controls.target.copy(home.target); controls.update(); }

  // ---- loop
  const clock = new THREE.Clock(); const tmp = new THREE.Vector3(), nrm = new THREE.Vector3();
  const sWorld = new THREE.Vector3();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (tween) { const kk = 1 - Math.exp(-dt * 4.5); camera.position.lerp(tween.v.pos, kk); controls.target.lerp(tween.v.target, kk); tween.t = (tween.t || 0) + dt; if (tween.t > 2.5) tween = null; }
    controls.update();
    // slate slide
    const k = 1 - Math.exp(-dt * 9); slate.position.z += (slateTarget - slate.position.z) * k; if (Math.abs(slateTarget - slate.position.z) < 0.01) slate.position.z = slateTarget;
    const slateOut = Math.abs(slate.position.z - OUT) < 0.06;
    // paper animation
    if (paperAnim) { paperAnim.t += 0.016; const p = Math.min(paperAnim.t / 1.6, 1); paper.scale.y = 0.001 + 0.82 * (1 - Math.pow(1 - p, 3)); if (paperAnim.t > 9) { paper.scale.y = Math.max(0.001, paper.scale.y - 0.05); if (paper.scale.y <= 0.002) paperAnim = null; } }
    // key press animation
    pressAnim.forEach((v, k) => { const nv = v - 0.12; k.position.y = -Math.sin(Math.max(nv, 0) * Math.PI) * 0.03; if (nv <= 0) { k.position.y = 0; pressAnim.delete(k); } else pressAnim.set(k, nv); });
    // hide DOM planes when seen from behind (CSS3D has no depth test)
    screenObj.getWorldPosition(tmp); nrm.copy(slopeN).applyQuaternion(machine.quaternion);
    const front = nrm.dot(camera.position.clone().sub(tmp)) > 0.15;
    screenEl.style.visibility = front ? 'visible' : 'hidden';
    slateObj.getWorldPosition(sWorld);
    const slateUp = camera.position.y > sWorld.y + 0.2;
    slateEl.style.visibility = slateOut && slateUp ? 'visible' : 'hidden';
    slateEl.style.pointerEvents = slateOut && slateUp ? 'auto' : 'none';
    renderer.render(scene, camera); css.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();

  const fit = () => { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h); css.setSize(w, h); camera.aspect = w / h; camera.fov = 2 * Math.atan(Math.tan((32 * Math.PI / 180) / 2) * Math.max(1, 1.12 / camera.aspect)) * 180 / Math.PI; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(fit); ro.observe(container); fit();

  return { setSlateDocked, printReceipt, resetView, isOut: () => Math.abs(slate.position.z - OUT) < 0.06, _z: () => slate.position.z };
}
