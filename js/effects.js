/* =========================================================================
   Efectos de láminas: contadores animados, mapa de trayectoria (arcos) y
   mapa regional de Washington–Maryland.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- Contadores ---------------------------------------------------------
     <span data-count="42052" data-decimals="0" data-plain>42.052</span>
     El contenido del elemento ya trae el valor final (útil para imprimir).   */
  function fmt(v, dec, plain) {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
      useGrouping: !plain
    }).format(v);
  }
  function runCounters(slide) {
    if (document.body.classList.contains('static')) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    slide.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var plain = el.hasAttribute('data-plain');
      var from = parseFloat(el.getAttribute('data-from') || '0');
      var dur = parseFloat(el.getAttribute('data-dur') || '1.9') * 1000;
      var delay = parseFloat(el.getAttribute('data-delay') || '0.35') * 1000;
      var start = null;
      el.textContent = fmt(from, dec, plain);
      if (el._raf) cancelAnimationFrame(el._raf);
      var tick = function (now) {
        if (start === null) start = now + delay;
        var t = Math.max(0, Math.min(1, (now - start) / dur));
        var e = 1 - Math.pow(1 - t, 4);
        el.textContent = fmt(from + (target - from) * e, dec, plain);
        if (t < 1) el._raf = requestAnimationFrame(tick);
      };
      el._raf = requestAnimationFrame(tick);
    });
  }
  document.addEventListener('slide:enter', function (e) { runCounters(e.target); });

  /* ---- Mapa mundial de trayectoria ----------------------------------------
     Proyección equirectangular: x = (lon+180)*10, y = (90-lat)*10 (viewBox
     compartido con assets/maps/world-dots.svg).                              */
  function eq(lat, lon) { return [(lon + 180) * 10, (90 - lat) * 10]; }
  function parseLL(s) { var a = s.split(',').map(parseFloat); return eq(a[0], a[1]); }

  document.querySelectorAll('svg.world-overlay').forEach(function (svg) {
    svg.querySelectorAll('[data-ll]').forEach(function (g) {
      var p = parseLL(g.getAttribute('data-ll'));
      g.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')');
    });
    svg.querySelectorAll('path[data-from][data-to]').forEach(function (path) {
      var a = parseLL(path.getAttribute('data-from'));
      var b = parseLL(path.getAttribute('data-to'));
      var bend = parseFloat(path.getAttribute('data-bend') || '0.25');
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var cx = mx - dy * bend, cy = my + dx * bend;
      path.setAttribute('d', 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) +
        ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1));
    });
  });

  /* ---- Mapa regional (Washington D.C. – Maryland) ------------------------- */
  var dmv = window.DMV_MAP;
  document.querySelectorAll('svg.dmv-map').forEach(function (svg) {
    if (!dmv) return;
    var base = svg.querySelector('.base');
    if (!base) return;
    var ns = 'http://www.w3.org/2000/svg';
    [['other', 'st-other'], ['md', 'st-md'], ['dc', 'st-dc']].forEach(function (pair) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', dmv[pair[0]]);
      p.setAttribute('class', pair[1]);
      base.appendChild(p);
    });
  });
})();
