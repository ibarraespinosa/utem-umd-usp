/* =========================================================================
   Motor de la presentación UTEM × UMD × USP
   - Escenario fijo de 1920×1080 que se escala a cualquier pantalla
   - Navegación: teclado, clic, control remoto (PageUp/PageDown), gestos táctiles
   - Vista general (O), notas (N), modo presentador (P), pantalla negra (B),
     pantalla completa (F), ayuda (H)
   ========================================================================= */
(function () {
  'use strict';

  var W = 1920, H = 1080;
  var params = new URLSearchParams(location.search);
  var PRESENTER = params.has('presenter');
  var STATIC = params.has('static');
  var CHANNEL = 'umd-utem-deck';
  var bc = ('BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL) : null;

  var stage = document.querySelector('.stage');
  var slides = Array.prototype.slice.call(stage.querySelectorAll(':scope > .slide'));
  var total = slides.length;
  var idx = -1;
  var presenterWin = null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function make(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function icon(name) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function titleOf(i) {
    var s = slides[i];
    if (!s) return '';
    return s.getAttribute('data-title') || ('Lámina ' + (i + 1));
  }
  function notesOf(i) {
    var n = slides[i] && slides[i].querySelector('.notes');
    return n ? n.innerHTML : '';
  }

  /* ---- Datos configurables (js/config.js) ------------------------------ */
  function applyConfig() {
    var cfg = window.DECK_CONFIG || {};
    document.querySelectorAll('[data-cfg]').forEach(function (el) {
      var v = cfg[el.getAttribute('data-cfg')];
      if (typeof v === 'string' && v.trim() && !/^\s*\[/.test(v)) {
        el.textContent = v;
        el.classList.remove('ph');
      }
    });
    // Tarjetas opcionales: se ocultan si su campo se deja vacío ("")
    document.querySelectorAll('[data-optional]').forEach(function (el) {
      var v = cfg[el.getAttribute('data-optional')];
      if (typeof v === 'string' && !v.trim()) el.style.display = 'none';
    });
  }

  /* ---- Longitud de trazos SVG animados --------------------------------- */
  function measureDrawPaths(root) {
    (root || document).querySelectorAll('.draw').forEach(function (p) {
      try {
        if (typeof p.getTotalLength === 'function') {
          p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1);
        }
      } catch (e) { /* sin acción */ }
    });
  }

  /* ---- Clonado de láminas (miniaturas y presentador) ------------------- */
  function cloneSlide(i) {
    var wrap = make('div', 'clone-stage static');
    var src = slides[i];
    if (!src) return wrap;
    var c = src.cloneNode(true);
    c.classList.add('is-active');
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    var srcCanvases = src.querySelectorAll('canvas');
    var dstCanvases = c.querySelectorAll('canvas');
    for (var k = 0; k < dstCanvases.length; k++) {
      try {
        dstCanvases[k].width = srcCanvases[k].width;
        dstCanvases[k].height = srcCanvases[k].height;
        dstCanvases[k].getContext('2d').drawImage(srcCanvases[k], 0, 0);
      } catch (e) { /* sin acción */ }
    }
    wrap.appendChild(c);
    return wrap;
  }
  function fitClone(box) {
    var cs = box.querySelector('.clone-stage');
    if (cs) cs.style.transform = 'scale(' + (box.clientWidth / W) + ')';
  }

  /* =======================================================================
     MODO PRESENTADOR (ventana aparte con notas, tiempo y próxima lámina)
     ======================================================================= */
  if (PRESENTER) {
    document.body.classList.add('presenter-mode');
    applyConfig();
    var pv = make('div', 'presenter',
      '<div class="pv-top">' +
        '<div class="title"></div>' +
        '<div class="cnt"></div>' +
        '<div class="clock"></div>' +
        '<div class="timer" title="Clic para reiniciar el cronómetro">00:00</div>' +
        '<button type="button" data-act="prev">◀ Anterior</button>' +
        '<button type="button" data-act="next">Siguiente ▶</button>' +
      '</div>' +
      '<div class="pv-left"><div class="pv-label">Lámina actual</div><div class="pv-cur"></div></div>' +
      '<div class="pv-right"><div class="pv-label">Siguiente</div><div class="pv-next"></div>' +
        '<div class="pv-label">Notas para el expositor</div><div class="pv-notes"></div></div>');
    document.body.appendChild(pv);

    var pIdx = 0;
    var t0 = Date.now();
    var render = function () {
      $('.title', pv).textContent = titleOf(pIdx);
      $('.cnt', pv).textContent = pad(pIdx + 1) + ' / ' + pad(total);
      var cur = $('.pv-cur', pv), nxt = $('.pv-next', pv);
      cur.innerHTML = '';
      cur.appendChild(cloneSlide(pIdx));
      nxt.innerHTML = '';
      if (pIdx + 1 < total) nxt.appendChild(cloneSlide(pIdx + 1));
      else nxt.innerHTML = '<div style="display:grid;place-items:center;height:100%;color:#6b778a;font:600 22px var(--font-sans)">Fin de la presentación</div>';
      fitClone(cur);
      fitClone(nxt);
      $('.pv-notes', pv).innerHTML = notesOf(pIdx);
      $('.pv-notes', pv).scrollTop = 0;
      document.title = 'Presentador · ' + pad(pIdx + 1) + ' / ' + pad(total);
    };
    var send = function (n) {
      var msg = { deck: CHANNEL, type: 'go', idx: n };
      try { if (window.opener) window.opener.postMessage(msg, '*'); } catch (e) { /* sin acción */ }
      if (bc) bc.postMessage(msg);
    };
    var goP = function (n, silent) {
      n = Math.max(0, Math.min(total - 1, n));
      if (n === pIdx && silent) return;
      pIdx = n;
      render();
      if (!silent) send(n);
    };
    var onMsg = function (d) {
      if (d && d.deck === CHANNEL && d.type === 'sync') goP(d.idx, true);
    };
    window.addEventListener('message', function (e) { onMsg(e.data); });
    if (bc) bc.onmessage = function (e) { onMsg(e.data); };

    pv.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) goP(pIdx + (b.getAttribute('data-act') === 'next' ? 1 : -1));
      if (e.target.closest('.timer')) t0 = Date.now();
    });
    document.addEventListener('keydown', function (e) {
      var k = e.key;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].indexOf(k) >= 0) { e.preventDefault(); goP(pIdx + 1); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].indexOf(k) >= 0) { e.preventDefault(); goP(pIdx - 1); }
      else if (k === 'Home') goP(0);
      else if (k === 'End') goP(total - 1);
    });
    window.addEventListener('resize', function () { fitClone($('.pv-cur', pv)); fitClone($('.pv-next', pv)); });
    setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      $('.timer', pv).textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
      var d = new Date();
      $('.clock', pv).textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
    }, 500);

    var m = /#\/(\d+)/.exec(location.hash);
    pIdx = m ? Math.max(0, Math.min(total - 1, parseInt(m[1], 10) - 1)) : 0;
    render();
    var hello = { deck: CHANNEL, type: 'hello' };
    try { if (window.opener) window.opener.postMessage(hello, '*'); } catch (e) { /* sin acción */ }
    if (bc) bc.postMessage(hello);
    return;
  }

  /* =======================================================================
     MODO AUDIENCIA (presentación principal)
     ======================================================================= */
  applyConfig();
  measureDrawPaths();
  if (STATIC) document.body.classList.add('static');

  // Pie de página + progreso
  var chrome = make('div', 'chrome',
    '<div class="brand"><i></i><span>UTEM &nbsp;×&nbsp; University of Maryland &nbsp;×&nbsp; Universidade de São Paulo</span></div>' +
    '<div class="num"><b class="cur">01</b> / ' + pad(total) + '</div>' +
    '<div class="progress"><span></span></div>');
  stage.appendChild(chrome);

  // Controles en pantalla
  var ui = make('div', 'ui',
    '<button type="button" data-act="prev" title="Anterior (←)">' + icon('arrow-left') + '</button>' +
    '<div class="count">01 / ' + pad(total) + '</div>' +
    '<button type="button" data-act="next" title="Siguiente (→)">' + icon('arrow-right') + '</button>' +
    '<span class="sep"></span>' +
    '<button type="button" data-act="overview" title="Vista general (O)">' + icon('grid-3x3') + '</button>' +
    '<button type="button" data-act="notes" title="Notas del expositor (N)">' + icon('notebook-pen') + '</button>' +
    '<button type="button" data-act="presenter" title="Modo presentador en otra ventana (P)">' + icon('monitor-play') + '</button>' +
    '<button type="button" data-act="fullscreen" title="Pantalla completa (F)">' + icon('maximize') + '</button>' +
    '<button type="button" data-act="help" title="Ayuda (H)">' + icon('circle-question-mark') + '</button>');
  document.body.appendChild(ui);

  var notesPanel = make('div', 'notes-panel', '');
  document.body.appendChild(notesPanel);

  var overview = make('div', 'overview',
    '<header><h3>Vista general</h3><span>Clic en una lámina para ir a ella · Esc para cerrar</span></header>' +
    '<div class="ov-grid"></div>');
  document.body.appendChild(overview);

  document.body.appendChild(make('div', 'blackout'));

  var help = make('div', 'help',
    '<div class="box"><h3>Atajos de teclado</h3><table>' +
    '<tr><td><kbd>→</kbd><kbd>Espacio</kbd><kbd>Av Pág</kbd></td><td>Lámina siguiente (también clic)</td></tr>' +
    '<tr><td><kbd>←</kbd><kbd>Re Pág</kbd></td><td>Lámina anterior</td></tr>' +
    '<tr><td><kbd>Inicio</kbd> <kbd>Fin</kbd></td><td>Primera / última lámina</td></tr>' +
    '<tr><td><kbd>5</kbd><kbd>Enter</kbd></td><td>Ir a la lámina 5 (cualquier número)</td></tr>' +
    '<tr><td><kbd>O</kbd> / <kbd>Esc</kbd></td><td>Vista general de todas las láminas</td></tr>' +
    '<tr><td><kbd>F</kbd></td><td>Pantalla completa</td></tr>' +
    '<tr><td><kbd>N</kbd></td><td>Mostrar / ocultar notas del expositor</td></tr>' +
    '<tr><td><kbd>P</kbd></td><td>Abrir modo presentador (notas, cronómetro, siguiente lámina)</td></tr>' +
    '<tr><td><kbd>B</kbd></td><td>Pantalla negra (pausa)</td></tr>' +
    '<tr><td><kbd>H</kbd> / <kbd>?</kbd></td><td>Mostrar / ocultar esta ayuda</td></tr>' +
    '</table><div class="foot">Para exportar a PDF: <b>Ctrl/Cmd + P</b> → “Guardar como PDF” (márgenes: ninguno, con gráficos de fondo).</div></div>');
  document.body.appendChild(help);

  var hint = make('div', 'hint', 'Use <kbd>→</kbd> para avanzar · <kbd>F</kbd> pantalla completa · <kbd>H</kbd> ayuda');
  document.body.appendChild(hint);

  /* ---- Escalado ---------------------------------------------------------- */
  function fit() {
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = 'scale(' + s + ')';
    document.documentElement.style.setProperty('--deck-scale', s);
    window.__deckScale = s;
    window.dispatchEvent(new CustomEvent('deck:resize', { detail: { scale: s } }));
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---- Navegación -------------------------------------------------------- */
  function updateChrome() {
    var n = pad(idx + 1) + ' / ' + pad(total);
    chrome.querySelector('.cur').textContent = pad(idx + 1);
    chrome.querySelector('.progress span').style.width = ((idx + 1) / total * 100) + '%';
    ui.querySelector('.count').textContent = n;
    document.title = titleOf(idx) + ' · UTEM × UMD × USP';
  }
  function updateNotes() {
    var html = notesOf(idx);
    notesPanel.innerHTML = '<h4>Notas · ' + pad(idx + 1) + ' — ' + titleOf(idx) + '</h4>' + (html || '<p style="color:#7d889a">Sin notas para esta lámina.</p>');
    notesPanel.scrollTop = 0;
  }
  function sync() {
    var msg = { deck: CHANNEL, type: 'sync', idx: idx };
    try { if (presenterWin && !presenterWin.closed) presenterWin.postMessage(msg, '*'); } catch (e) { /* sin acción */ }
    if (bc) bc.postMessage(msg);
  }
  function go(n) {
    n = Math.max(0, Math.min(total - 1, n | 0));
    if (n === idx) return;
    var prev = slides[idx];
    if (prev) {
      prev.classList.remove('is-active');
      prev.dispatchEvent(new CustomEvent('slide:leave', { bubbles: true, detail: { index: idx } }));
    }
    idx = n;
    var cur = slides[idx];
    void cur.offsetWidth; // reinicia animaciones CSS
    cur.classList.add('is-active');
    stage.setAttribute('data-theme', cur.getAttribute('data-theme') || 'dark');
    stage.setAttribute('data-chrome', cur.getAttribute('data-chrome') || 'on');
    updateChrome();
    updateNotes();
    if (location.hash !== '#/' + (idx + 1)) {
      try { history.replaceState(null, '', '#/' + (idx + 1)); } catch (e) { location.hash = '#/' + (idx + 1); }
    }
    cur.dispatchEvent(new CustomEvent('slide:enter', { bubbles: true, detail: { index: idx } }));
    sync();
    if (document.body.classList.contains('overview-open')) markOverview();
  }
  function next() { go(idx + 1); }
  function prev() { go(idx - 1); }
  window.deck = { go: go, next: next, prev: prev, get index() { return idx; }, total: total };

  /* ---- Vista general ----------------------------------------------------- */
  var ovBuilt = false;
  function buildOverview() {
    var grid = overview.querySelector('.ov-grid');
    grid.innerHTML = '';
    slides.forEach(function (s, i) {
      var item = make('div', 'ov-item', '');
      var th = make('div', 'ov-thumb', '');
      th.appendChild(cloneSlide(i));
      item.appendChild(th);
      item.appendChild(make('div', 'cap', '<b>' + pad(i + 1) + '</b><span>' + titleOf(i) + '</span>'));
      item.addEventListener('click', function () { closeOverview(); go(i); });
      grid.appendChild(item);
    });
    ovBuilt = true;
  }
  function markOverview() {
    overview.querySelectorAll('.ov-item').forEach(function (it, i) { it.classList.toggle('current', i === idx); });
  }
  function openOverview() {
    if (!ovBuilt) buildOverview();
    document.body.classList.add('overview-open');
    overview.querySelectorAll('.ov-thumb').forEach(fitClone);
    markOverview();
    var cur = overview.querySelectorAll('.ov-item')[idx];
    if (cur) cur.scrollIntoView({ block: 'center' });
  }
  function closeOverview() { document.body.classList.remove('overview-open'); }
  function toggleOverview() {
    if (document.body.classList.contains('overview-open')) closeOverview(); else openOverview();
  }
  window.addEventListener('resize', function () {
    if (document.body.classList.contains('overview-open')) overview.querySelectorAll('.ov-thumb').forEach(fitClone);
  });

  /* ---- Pantalla completa, notas, presentador ---------------------------- */
  function toggleFullscreen() {
    var d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      var el = d.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d);
    }
  }
  function toggleNotes() {
    document.body.classList.toggle('notes-open');
    ui.querySelector('[data-act="notes"]').classList.toggle('on', document.body.classList.contains('notes-open'));
  }
  function openPresenter() {
    var url = location.href.split('#')[0].split('?')[0] + '?presenter#/' + (idx + 1);
    presenterWin = window.open(url, 'umd-utem-presentador', 'width=1400,height=860');
    setTimeout(sync, 800);
  }
  function toggleHelp() { document.body.classList.toggle('help-open'); }

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.deck !== CHANNEL) return;
    if (d.type === 'go') go(d.idx);
    if (d.type === 'hello') {
      if (e.source && e.source !== window) presenterWin = e.source;
      sync();
    }
  });
  if (bc) bc.onmessage = function (e) {
    var d = e.data;
    if (!d || d.deck !== CHANNEL) return;
    if (d.type === 'go') go(d.idx);
    if (d.type === 'hello') sync();
  };

  /* ---- Teclado ----------------------------------------------------------- */
  var numBuf = '', numTimer = null;
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable="true"]')) return;
    var k = e.key;
    var body = document.body;

    if (body.classList.contains('help-open') && (k === 'Escape' || k === 'h' || k === 'H' || k === '?')) { toggleHelp(); e.preventDefault(); return; }
    if (body.classList.contains('overview-open') && (k === 'Escape' || k === 'o' || k === 'O')) { closeOverview(); e.preventDefault(); return; }
    if (body.classList.contains('black') && k !== 'b' && k !== 'B' && k !== '.') { body.classList.remove('black'); }

    if (/^[0-9]$/.test(k)) {
      numBuf += k;
      clearTimeout(numTimer);
      numTimer = setTimeout(function () { numBuf = ''; }, 1500);
      return;
    }
    switch (k) {
      case 'Enter':
        if (numBuf) { go(parseInt(numBuf, 10) - 1); numBuf = ''; } else next();
        e.preventDefault();
        break;
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
        e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(total - 1); break;
      case 'o': case 'O': case 'Escape':
        if (k === 'Escape' && (document.fullscreenElement || document.webkitFullscreenElement)) break;
        toggleOverview(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'n': case 'N': toggleNotes(); break;
      case 'p': case 'P': openPresenter(); break;
      case 'b': case 'B': case '.': body.classList.toggle('black'); break;
      case 'h': case 'H': case '?': toggleHelp(); break;
      default: break;
    }
  });

  /* ---- Mouse, clic y gestos táctiles ------------------------------------ */
  ui.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    var a = b.getAttribute('data-act');
    if (a === 'prev') prev();
    else if (a === 'next') next();
    else if (a === 'overview') toggleOverview();
    else if (a === 'notes') toggleNotes();
    else if (a === 'presenter') openPresenter();
    else if (a === 'fullscreen') toggleFullscreen();
    else if (a === 'help') toggleHelp();
  });
  help.addEventListener('click', toggleHelp);

  var deckEl = document.querySelector('.deck');
  var downX = null, downY = null, downT = 0, downType = 'mouse';
  deckEl.addEventListener('pointerdown', function (e) { downX = e.clientX; downY = e.clientY; downT = Date.now(); downType = e.pointerType; });
  deckEl.addEventListener('pointerup', function (e) {
    if (downX === null) return;
    var dx = e.clientX - downX, dy = e.clientY - downY;
    var quick = Date.now() - downT < 600;
    downX = null;
    if (e.target.closest('a, button, [data-noclick]')) return;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && quick) { if (dx < 0) next(); else prev(); return; }
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && e.button === 0) {
      if (downType === 'touch') { if (e.clientX < window.innerWidth * 0.3) prev(); else next(); }
      else next();
    }
  });

  var idleTimer = null;
  function showUI() {
    document.body.classList.add('ui-visible');
    document.body.classList.remove('hide-cursor');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (!ui.matches(':hover')) {
        document.body.classList.remove('ui-visible');
        document.body.classList.add('hide-cursor');
      }
    }, 2600);
  }
  document.addEventListener('mousemove', showUI);

  window.addEventListener('hashchange', function () {
    var m = /#\/(\d+)/.exec(location.hash);
    if (m) go(parseInt(m[1], 10) - 1);
  });

  /* ---- Inicio -------------------------------------------------------------- */
  var m = /#\/(\d+)/.exec(location.hash);
  go(m ? parseInt(m[1], 10) - 1 : 0);
  if (!STATIC) {
    setTimeout(function () { hint.classList.add('show'); }, 900);
    setTimeout(function () { hint.classList.remove('show'); }, 6500);
  }
})();
