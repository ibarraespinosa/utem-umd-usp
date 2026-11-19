/* =========================================================================
   Globo animado de la portada: puntos de tierra (Natural Earth), Chile en
   dorado, EE.UU. en rojo y un arco que une Santiago con College Park.
   ========================================================================= */
(function () {
  'use strict';
  var canvas = document.getElementById('globe');
  if (!canvas || !window.GLOBE_POINTS) return;
  var slide = canvas.closest('.slide');
  var ctx = canvas.getContext('2d');
  var SIZE = parseInt(canvas.getAttribute('data-size') || '1150', 10);
  var R = SIZE * 0.40;
  var CX = SIZE / 2, CY = SIZE / 2;
  var D2R = Math.PI / 180;

  var P = window.GLOBE_POINTS, F = window.GLOBE_FLAGS || '';
  var N = P.length / 2;
  var cphi = new Float32Array(N), sphi = new Float32Array(N), clam = new Float32Array(N), slam = new Float32Array(N);
  var flag = new Uint8Array(N);
  for (var i = 0; i < N; i++) {
    var la = P[2 * i] * D2R, lo = P[2 * i + 1] * D2R;
    cphi[i] = Math.cos(la); sphi[i] = Math.sin(la); clam[i] = Math.cos(lo); slam[i] = Math.sin(lo);
    flag[i] = F.charCodeAt(i) - 48 || 0;
  }

  var CITIES = {
    stgo: { lat: -33.45, lon: -70.67, name: 'SANTIAGO', sub: 'UTEM', color: '#FFD200', side: -1 },
    cp: { lat: 38.99, lon: -76.94, name: 'COLLEGE PARK', sub: 'UMD · NOAA · NASA', color: '#FF4D66', side: -1 },
    sp: { lat: -23.55, lon: -46.63, name: 'SÃO PAULO', sub: 'USP · IAG · IF', color: '#2BB5F0', side: 1 }
  };

  function toVec(lat, lon) {
    var a = lat * D2R, b = lon * D2R;
    return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)];
  }
  function toLatLon(v) {
    var r = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [Math.asin(v[2] / r) / D2R, Math.atan2(v[1], v[0]) / D2R];
  }
  // Arcos de círculo máximo (slerp) con elevación
  function buildArc(a, b, lift) {
    var out = [];
    var A = toVec(a.lat, a.lon), B = toVec(b.lat, b.lon);
    var dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
    var om = Math.acos(Math.max(-1, Math.min(1, dot)));
    var S = 120;
    for (var k = 0; k <= S; k++) {
      var t = k / S;
      var s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
      var v = [A[0] * s1 + B[0] * s2, A[1] * s1 + B[1] * s2, A[2] * s1 + B[2] * s2];
      var ll = toLatLon(v);
      out.push({ lat: ll[0], lon: ll[1], h: 1 + lift * Math.sin(Math.PI * t) });
    }
    return out;
  }
  var ARCS = [
    { pts: buildArc(CITIES.stgo, CITIES.cp, 0.17), c0: '#FFD200', c1: '#E21833', glow: 'rgba(255,190,60,0.85)', delay: 0.6, main: true },
    { pts: buildArc(CITIES.stgo, CITIES.sp, 0.10), c0: '#FFD200', c1: '#2BB5F0', glow: 'rgba(80,190,255,0.85)', delay: 1.4, main: true },
    { pts: buildArc(CITIES.sp, CITIES.cp, 0.13), c0: '#2BB5F0', c1: '#E21833', glow: 'rgba(255,255,255,0.4)', delay: 2.4, main: false }
  ];

  var lam0 = -62, phi0 = 8, cl0, sl0, cp0, sp0;
  function setView(l, p) {
    lam0 = l; phi0 = p;
    cl0 = Math.cos(l * D2R); sl0 = Math.sin(l * D2R); cp0 = Math.cos(p * D2R); sp0 = Math.sin(p * D2R);
  }
  function project(lat, lon, h) {
    var cf = Math.cos(lat * D2R), sf = Math.sin(lat * D2R);
    var dl = (lon - lam0) * D2R;
    var x = cf * Math.sin(dl);
    var y = cp0 * sf - sp0 * cf * Math.cos(dl);
    var z = sp0 * sf + cp0 * cf * Math.cos(dl);
    h = h || 1;
    return { x: CX + R * h * x, y: CY - R * h * y, z: z, h: h, r2: (x * x + y * y) * h * h };
  }

  var pr = 1;
  function resize() {
    var s = window.__deckScale || 1;
    pr = Math.max(1, Math.min(2.2, (window.devicePixelRatio || 1) * s));
    canvas.width = Math.round(SIZE * pr);
    canvas.height = Math.round(SIZE * pr);
    draw(lastT);
  }

  var BUCKETS = 5;
  var COLORS = [
    function (a) { return 'rgba(168,194,236,' + (a * 0.7).toFixed(3) + ')'; },
    function (a) { return 'rgba(255,210,0,' + a.toFixed(3) + ')'; },
    function (a) { return 'rgba(255,88,110,' + (a * 0.92).toFixed(3) + ')'; }
  ];

  var t0 = performance.now(), lastT = 0, running = false, enterAt = performance.now();

  function draw(t) {
    lastT = t;
    var el = (performance.now() - enterAt) / 1000;
    setView(-62 + 9 * Math.sin(t / 40 * 2 * Math.PI), 8 + 2.5 * Math.sin(t / 55 * 2 * Math.PI));
    ctx.setTransform(pr, 0, 0, pr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Atmósfera
    var g = ctx.createRadialGradient(CX, CY, R * 0.92, CX, CY, R * 1.28);
    g.addColorStop(0, 'rgba(70,130,255,0.30)');
    g.addColorStop(0.35, 'rgba(70,130,255,0.10)');
    g.addColorStop(1, 'rgba(70,130,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(CX, CY, R * 1.28, 0, Math.PI * 2); ctx.fill();

    // Disco del océano
    var o = ctx.createRadialGradient(CX - R * 0.35, CY - R * 0.4, R * 0.1, CX, CY, R);
    o.addColorStop(0, '#16294a');
    o.addColorStop(0.7, '#0b1730');
    o.addColorStop(1, '#070f20');
    ctx.fillStyle = o;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fill();

    // Retícula
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(140,170,220,0.09)';
    ctx.beginPath();
    var lat, lon, p, prevVis;
    for (lon = -180; lon < 180; lon += 20) {
      prevVis = false;
      for (lat = -88; lat <= 88; lat += 4) {
        p = project(lat, lon);
        if (p.z > 0) { if (prevVis) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); prevVis = true; } else prevVis = false;
      }
    }
    for (lat = -60; lat <= 60; lat += 20) {
      prevVis = false;
      for (lon = -180; lon <= 180; lon += 4) {
        p = project(lat, lon);
        if (p.z > 0) { if (prevVis) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); prevVis = true; } else prevVis = false;
      }
    }
    ctx.stroke();

    // Puntos de tierra (agrupados por color e intensidad)
    var paths = [];
    for (var c = 0; c < 3; c++) { paths[c] = []; for (var b = 0; b < BUCKETS; b++) paths[c][b] = new Path2D(); }
    for (var i = 0; i < N; i++) {
      var sdl = slam[i] * cl0 - clam[i] * sl0;
      var cdl = clam[i] * cl0 + slam[i] * sl0;
      var z = sp0 * sphi[i] + cp0 * cphi[i] * cdl;
      if (z <= 0.02) continue;
      var x = CX + R * cphi[i] * sdl;
      var y = CY - R * (cp0 * sphi[i] - sp0 * cphi[i] * cdl);
      var f = flag[i];
      var bk = Math.min(BUCKETS - 1, Math.floor(z * BUCKETS));
      var rad = (f === 1 ? 2.9 : 2.3) * (0.55 + 0.45 * z);
      var path = paths[f][bk];
      path.moveTo(x + rad, y);
      path.arc(x, y, rad, 0, Math.PI * 2);
    }
    for (var cc = 0; cc < 3; cc++) {
      for (var bb = 0; bb < BUCKETS; bb++) {
        ctx.fillStyle = COLORS[cc](0.25 + 0.75 * (bb + 0.5) / BUCKETS);
        ctx.fill(paths[cc][bb]);
      }
    }

    // Brillo del borde
    var rim = ctx.createRadialGradient(CX, CY, R * 0.82, CX, CY, R * 1.01);
    rim.addColorStop(0, 'rgba(120,170,255,0)');
    rim.addColorStop(1, 'rgba(120,170,255,0.22)');
    ctx.fillStyle = rim;
    ctx.beginPath(); ctx.arc(CX, CY, R * 1.005, 0, Math.PI * 2); ctx.fill();

    // Arcos: Santiago ↔ College Park, Santiago ↔ São Paulo (y São Paulo ↔ College Park, tenue)
    ARCS.forEach(function (arc, ai) {
      var pts = arc.pts.map(function (q) { return project(q.lat, q.lon, q.h); });
      var fr = Math.max(0, Math.min(1, (el - arc.delay) / 2.0));
      fr = 1 - Math.pow(1 - fr, 3);
      if (fr <= 0) return;
      var nDraw = Math.max(1, Math.floor(fr * (pts.length - 1)));
      var a0 = pts[0], a1 = pts[pts.length - 1];
      var lg = ctx.createLinearGradient(a0.x, a0.y, a1.x, a1.y);
      lg.addColorStop(0, arc.c0);
      lg.addColorStop(1, arc.c1);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.shadowColor = arc.glow;
      ctx.shadowBlur = arc.main ? 18 : 6;
      ctx.strokeStyle = lg;
      ctx.lineWidth = arc.main ? 3.4 : 1.8;
      ctx.globalAlpha = arc.main ? 1 : 0.55;
      if (!arc.main) ctx.setLineDash([6, 9]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var k = 1; k <= nDraw; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.stroke();
      ctx.restore();

      // Pulso viajero (ida y vuelta) en los arcos principales
      if (arc.main && fr >= 1) {
        var cyc = ((el - arc.delay - 2.2 + ai * 1.3) / 3.6) % 2;
        if (cyc < 0) return;
        var u = cyc < 1 ? cyc : 2 - cyc;
        u = u * u * (3 - 2 * u);
        var head = Math.floor(u * (pts.length - 1));
        var tail = cyc < 1 ? Math.max(0, head - 14) : Math.min(pts.length - 1, head + 14);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(255,255,255,0.9)';
        ctx.shadowBlur = 22;
        ctx.strokeStyle = 'rgba(255,248,220,0.95)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(pts[tail].x, pts[tail].y);
        var step = head > tail ? 1 : -1;
        for (var m = tail; m !== head; m += step) ctx.lineTo(pts[m + step].x, pts[m + step].y);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Ciudades
    ['stgo', 'cp', 'sp'].forEach(function (key, j) {
      var cdef = CITIES[key];
      var q = project(cdef.lat, cdef.lon);
      if (q.z <= 0) return;
      var show = Math.max(0, Math.min(1, (el - 0.3 - j * 1.0) / 0.6));
      if (show <= 0) return;
      ctx.save();
      for (var r = 0; r < 2; r++) {
        var ph = ((el * 0.42) + r * 0.5) % 1;
        ctx.strokeStyle = cdef.color;
        ctx.globalAlpha = show * (1 - ph) * 0.9;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(q.x, q.y, 8 + ph * 34, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = show;
      ctx.shadowColor = cdef.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(q.x, q.y, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = cdef.color;
      ctx.beginPath(); ctx.arc(q.x, q.y, 3.6, 0, Math.PI * 2); ctx.fill();

      var tx = q.x + cdef.side * 26;
      ctx.textAlign = cdef.side < 0 ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 30px "Barlow Condensed", "Arial Narrow", sans-serif';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
      ctx.fillText(cdef.name, tx, q.y - 12);
      ctx.fillStyle = cdef.color;
      ctx.font = '600 21px "Barlow Condensed", "Arial Narrow", sans-serif';
      ctx.fillText(cdef.sub, tx, q.y + 16);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.restore();
    });
  }

  function frame(now) {
    if (!running) return;
    draw((now - t0) / 1000);
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true;
    enterAt = document.body.classList.contains('static') ? performance.now() - 20000 : performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  slide.addEventListener('slide:enter', start);
  slide.addEventListener('slide:leave', stop);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (slide.classList.contains('is-active')) start();
  });
  window.addEventListener('deck:resize', resize);
  window.addEventListener('beforeprint', function () { enterAt = performance.now() - 20000; draw(lastT); });
  resize();
  enterAt = performance.now() - 20000;
  draw(0);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!running) draw(lastT); });
})();
