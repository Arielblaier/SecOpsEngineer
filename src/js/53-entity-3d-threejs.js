/* ======================================================================
   3D ENTITY (three.js), liquid core, gyroscopic rings, particles
   ====================================================================== */
const ORBS = [];
const ST_COL = { 'st-cortex': ['#4DFFA6', '#d2ffe9', '#00704f'], 'st-pending': ['#f59e0b', '#fde68a', '#92400e'], 'st-progress': ['#3b82f6', '#bfdbfe', '#1e3a8a'], 'st-resolved': ['#00c389', '#a7f3d0', '#065f46'] };
const NOISE_GLSL = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

function webglOK() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }

class Orb3D {
  constructor(el) {
    const T3 = THREE;
    this.el = el; el.classList.add('gl');

    this.renderer = new T3.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
    this.renderer.setClearColor(0x000000, 0);
    el.appendChild(this.renderer.domElement);
    this.scene = new T3.Scene();
    this.cam = new T3.PerspectiveCamera(30, 1, .1, 100); this.cam.position.set(0, 0, 9.4);
    this.root = new T3.Group(); this.scene.add(this.root);
    this.c1 = new T3.Color('#3b82f6'); this.c2 = new T3.Color('#bfdbfe'); this.c3 = new T3.Color('#1e3a8a');
    this.lineMats = [];
    const lineMat = (op, light) => { const m = new T3.LineBasicMaterial({ color: light ? this.c2.clone() : this.c1.clone(), transparent: true, opacity: op, depthWrite: false }); m.userData = { light, base: op }; this.lineMats.push(m); return m; };

    // liquid core
    this.coreU = { uTime: { value: 0 }, uAmp: { value: .1 }, uC1: { value: this.c1.clone() }, uC2: { value: this.c2.clone() }, uC3: { value: this.c3.clone() } };
    const coreMat = new T3.ShaderMaterial({
      uniforms: this.coreU,
      vertexShader: NOISE_GLSL + `
        uniform float uTime; uniform float uAmp; varying vec3 vN; varying vec3 vV; varying float vD; varying vec3 vP;
        void main(){ float n = snoise(normal * 1.1 + vec3(uTime * .28)); float n2 = snoise(normal * 2.4 - vec3(uTime * .19)) * .22;
          float d = (n + n2) * uAmp; vec3 p = position + normal * d; vD = n; vP = p;
          vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(p, 1.); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
      extensions: { derivatives: true },
      fragmentShader: NOISE_GLSL + `
        uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform float uTime;
        varying vec3 vN; varying vec3 vV; varying float vD; varying vec3 vP;
        float fbm(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * snoise(p); p *= 2.07; a *= .5; } return s; }
        vec3 bump(vec3 n, vec3 pos, float h, float k){
          vec3 sx = dFdx(pos), sy = dFdy(pos); vec3 r1 = cross(sy, n), r2 = cross(n, sx);
          float det = dot(sx, r1); vec3 g = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2) * k;
          return normalize(abs(det) * n - g); }
        void main(){
          vec3 v = normalize(vV); vec3 pos = -vV;
          vec3 q = vP * 2.1 + vec3(0., uTime * .12, uTime * .06);
          float h = fbm(q);                                    /* flowing surface texture */
          float cells = snoise(vP * 5.5 - vec3(uTime * .2));  /* fine grain */
          vec3 n = bump(normalize(vN), pos, (h * .9 + cells * .12) * .03, 1.);
          vec3 L = normalize(vec3(-.45, .65, .75)), L2 = normalize(vec3(.6, -.3, .5));
          float dif = max(dot(n, L), 0.), dif2 = max(dot(n, L2), 0.) * .35;
          float fr = pow(1. - max(dot(n, v), 0.), 2.6);
          float spec = pow(max(dot(reflect(-L, n), v), 0.), 90.) * 1.1 + pow(max(dot(reflect(-L, n), v), 0.), 14.) * .18;
          /* glowing veins */
          float vein = 1. - smoothstep(0., .07, abs(snoise(vP * 2.8 + vec3(uTime * .18, 0., 0.) + h * .6)));
          float vein2 = 1. - smoothstep(0., .05, abs(snoise(vP * 5.2 - vec3(0., uTime * .22, 0.))));
          /* depth: darker deep pools, lighter crests */
          vec3 col = mix(uC3, uC1, clamp(.2 + dif * .9 + dif2 + h * .35, 0., 1.));
          col = mix(col, uC2, clamp(h * .45 + .08, 0., .45));
          col += uC2 * (vein * .45 + vein2 * .18) * (.5 + .5 * (1. - fr));
          /* subsurface core glow */
          col += uC2 * pow(max(dot(n, v), 0.), 4.) * .18;
          /* thin-film iridescence on the rim */
          vec3 irid = .5 + .5 * cos(6.2831 * (fr * .9 + h * .3 + vec3(0., .33, .67)) + uTime * .25);
          col = mix(col, col + irid * .35, fr * .8);
          col += uC2 * fr * .75 + vec3(1.) * spec;
          gl_FragColor = vec4(min(col, vec3(1.)), 1.);
        }`
    });
    this.core = new T3.Mesh(new T3.IcosahedronGeometry(1, 7), coreMat);
    this.root.add(this.core);

    // wireframe lattice around core
    this.lattice = new T3.LineSegments(new T3.EdgesGeometry(new T3.IcosahedronGeometry(1.32, 1)), lineMat(.22));
    this.root.add(this.lattice);

    // gyroscope great circles
    const circle = (r, n = 128) => { const pts = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; pts.push(new T3.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); } return new T3.BufferGeometry().setFromPoints(pts); };
    this.gyro = new T3.Group();
    [[0, 0], [Math.PI / 2, 0], [Math.PI / 2, Math.PI / 2]].forEach(([rx, ry], i) => { const l = new T3.Line(circle(1.48), lineMat(i ? .28 : .4)); l.rotation.set(rx, ry, 0); this.gyro.add(l); });
    this.root.add(this.gyro);

    // segmented ring (saturn tilt)
    const segs = (r, count, fillFrac, thickEvery) => {
      const pos = []; for (let i = 0; i < count; i++) { const a0 = i / count * Math.PI * 2, span = (Math.PI * 2 / count) * (i % thickEvery === 0 ? fillFrac : fillFrac * .5), steps = 6;
        for (let k = 0; k < steps; k++) { const t0 = a0 + span * k / steps, t1 = a0 + span * (k + 1) / steps; pos.push(Math.cos(t0) * r, Math.sin(t0) * r, 0, Math.cos(t1) * r, Math.sin(t1) * r, 0); } }
      const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); return g; };
    this.ringA = new T3.LineSegments(segs(1.8, 48, .7, 4), lineMat(.75));
    this.ringA.rotation.set(1.22, .18, 0); this.root.add(this.ringA);
    this.ringB = new T3.LineSegments(segs(2.02, 90, .35, 90), lineMat(.45, true));
    this.ringB.rotation.set(-.42, .55, 0); this.root.add(this.ringB);

    // orbit with a node
    this.orbit = new T3.Group(); this.orbit.rotation.set(.95, -.7, 0);
    this.orbit.add(new T3.Line(circle(1.62), lineMat(.3)));
    this.node = new T3.Mesh(new T3.SphereGeometry(.055, 16, 16), new T3.MeshBasicMaterial({ color: this.c1.clone() }));
    this.node.position.set(1.62, 0, 0); this.orbit.add(this.node); this.root.add(this.orbit);

    // precision tick scale (faces camera)
    const tpos = []; for (let i = 0; i < 180; i++) { const a = i / 180 * Math.PI * 2, major = i % 15 === 0, mid = i % 5 === 0, r0 = major ? 2.2 : mid ? 2.26 : 2.3, r1 = 2.34;
      tpos.push(Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0); }
    const tg = new T3.BufferGeometry(); tg.setAttribute('position', new T3.Float32BufferAttribute(tpos, 3));
    this.ticks = new T3.LineSegments(tg, lineMat(.5)); this.scene.add(this.ticks);

    // live status arcs (pending / in progress / resolved)
    this.status = new T3.Group(); this.scene.add(this.status);
    this.statusMats = ['#f59e0b', '#3b82f6', '#00c389'].map(c => new T3.LineBasicMaterial({ color: new T3.Color(c), transparent: true, opacity: .95 }));
    this.statusLines = this.statusMats.map(m => { const l = new T3.Line(new T3.BufferGeometry(), m); this.status.add(l); return l; });
    this.statusCur = [.33, .33, .34]; this.statusTgt = [.33, .33, .34];

    // holographic scan line over the core
    this.scan = new T3.Line(circle(1, 96), lineMat(.6, true)); this.scan.rotation.x = Math.PI / 2; this.root.add(this.scan);

    // particles
    const N = 420, pp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 1.55 + Math.random() * .95, q = Math.sqrt(1 - u * u);
      pp[i * 3] = Math.cos(th) * q * r; pp[i * 3 + 1] = u * r * .55; pp[i * 3 + 2] = Math.sin(th) * q * r; }
    const pg = new T3.BufferGeometry(); pg.setAttribute('position', new T3.BufferAttribute(pp, 3));
    this.pMat = new T3.PointsMaterial({ color: this.c1.clone(), size: .028, transparent: true, opacity: .75, depthWrite: false, sizeAttenuation: true });
    this.points = new T3.Points(pg, this.pMat); this.root.add(this.points);

    this.mouse = { x: 0, y: 0 }; this.speed = 1; this.t = 0; this.last = performance.now(); this.pulse = 0;
    this.onMove = e => { const r = el.getBoundingClientRect(); if (!r.width) return; const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      this.mouse.x = Math.max(-1, Math.min(1, (e.clientX - cx) / 500)); this.mouse.y = Math.max(-1, Math.min(1, (e.clientY - cy) / 500)); };
    window.addEventListener('mousemove', this.onMove, { passive: true });
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el); this.resize();
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    ORBS.push(this);
  }
  resize() { const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
  setStatus(p, i, r) { const t = Math.max(1, p + i + r); this.statusTgt = [p / t, i / t, r / t]; }
  buildStatus() {
    const R = 2.08, gap = .035; let a = Math.PI / 2;
    this.statusCur.forEach((f, k) => {
      const span = Math.max(0, f * Math.PI * 2 - gap), pts = [], n = Math.max(2, Math.ceil(span * 40));
      for (let j = 0; j <= n; j++) { const t = a - span * j / n; pts.push(new THREE.Vector3(Math.cos(t) * R, Math.sin(t) * R, 0)); }
      this.statusLines[k].geometry.dispose(); this.statusLines[k].geometry = new THREE.BufferGeometry().setFromPoints(pts);
      a -= f * Math.PI * 2;
    });
  }
  loop(now) {
    if (this.renderer && this.renderer.domElement && !this.renderer.domElement.isConnected) return;
    requestAnimationFrame(this.loop);
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
    if (document.hidden || !this.el.getClientRects().length) return;
    const cl = this.el.classList;
    const st = cl.contains('st-cortex') ? 'st-cortex' : cl.contains('st-pending') ? 'st-pending' : cl.contains('st-resolved') ? 'st-resolved' : 'st-progress';
    const think = cl.contains('thinking'), alert = cl.contains('alert'), listen = cl.contains('listening'), hover = this.el.matches(':hover');
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tgtSpeed = calm ? .12 : think ? 3.2 : alert ? 2.2 : listen || hover ? 1.6 : 1;
    this.speed += (tgtSpeed - this.speed) * Math.min(1, dt * 3);
    this.t += dt * this.speed;
    const [a, b, c] = ST_COL[st];
    const k = this._seen ? Math.min(1, dt * 3) : 1; this._seen = true;
    this.c1.lerp(new THREE.Color(a), k); this.c2.lerp(new THREE.Color(b), k); this.c3.lerp(new THREE.Color(c), k);
    this.coreU.uC1.value.copy(this.c1); this.coreU.uC2.value.copy(this.c2); this.coreU.uC3.value.copy(this.c3);
    this.lineMats.forEach(m => { m.color.copy(m.userData.light ? this.c2 : this.c1); m.opacity = m.userData.base * (listen ? 1.25 : 1); });
    if (effectiveTheme() === 'light') { const dk = this.c1.clone().lerp(this.c3, .35); this.lineMats.forEach(m => { m.color.copy(m.userData.light ? this.c1 : dk); m.opacity = Math.min(1, m.userData.base * 1.35); }); }
    this.pMat.color.copy(this.c1); this.node.material.color.copy(this.c1);
    this.coreU.uTime.value = this.t;
    this.coreU.uAmp.value += ((think ? .17 : .1) - this.coreU.uAmp.value) * k;
    this.pulse = alert ? (this.pulse + dt * 6) : this.pulse * .9;
    const sc = 1 + (alert ? Math.sin(this.pulse) * .04 : 0);
    this.core.scale.setScalar(sc);
    // motion
    this.core.rotation.y += dt * .25 * this.speed;
    this.lattice.rotation.y -= dt * .12 * this.speed; this.lattice.rotation.x += dt * .05 * this.speed;
    this.gyro.rotation.y += dt * .35 * this.speed; this.gyro.rotation.z += dt * .12 * this.speed;
    this.ringA.rotation.z += dt * .22 * this.speed;
    this.ringB.rotation.z -= dt * .14 * this.speed;
    this.orbit.rotation.z += dt * .9 * this.speed;
    this.ticks.rotation.z += dt * .02 * this.speed;
    this.points.rotation.y += dt * .06 * this.speed;
    const sy = Math.sin(this.t * .9) * .92, sr = Math.sqrt(Math.max(0, 1.06 * 1.06 - sy * sy));
    this.scan.position.y = sy; this.scan.scale.set(sr, sr, 1);
    this.root.rotation.x += ((this.mouse.y * .45 + .12) - this.root.rotation.x) * k;
    this.root.rotation.y += ((this.mouse.x * .6) - this.root.rotation.y) * k;
    // status arcs
    let moved = false;
    this.statusCur = this.statusCur.map((v, i) => { const nv = v + (this.statusTgt[i] - v) * Math.min(1, dt * 2.5); if (Math.abs(nv - v) > 1e-4) moved = true; return nv; });
    if (moved || !this.built) { this.buildStatus(); this.built = true; }
    const small = cl.contains('small');
    this.ticks.visible = !small; this.status.visible = true;
    this.renderer.render(this.scene, this.cam);
  }
}
