/* Rankit & Ria | Wedding invitation
   Plain JavaScript, no dependencies. Sections: helpers, dust, music, intro film,
   curtain reveal, countdown, scroll effects. */
(function () {
  'use strict';
  window.__weddingBoot = true;

  var CFG = window.WEDDING_CONFIG || {};
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var skipFromUrl = /[?&]skip(=|&|$)/.test(location.search);

  /* ---------------------------------------------------------------
     Floating gold dust
     --------------------------------------------------------------- */
  function dust(el, n) {
    if (!el || reduced) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var d = document.createElement('i');
      d.className = 'dust';
      d.style.setProperty('--x', rand(2, 98).toFixed(1) + '%');
      d.style.setProperty('--s', rand(3, 9).toFixed(1) + 'px');
      d.style.setProperty('--d', rand(9, 18).toFixed(1) + 's');
      d.style.setProperty('--dl', (-rand(0, 18)).toFixed(1) + 's');
      d.style.setProperty('--dx', rand(-40, 40).toFixed(0) + 'px');
      frag.appendChild(d);
    }
    el.appendChild(frag);
  }

  /* A short burst of golden petals (curtain reveal) */
  function burst(host) {
    if (reduced || !host) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 26; i++) {
      var p = document.createElement('i');
      p.className = 'spark';
      var ang = rand(-Math.PI * .95, -Math.PI * .05);
      var dist = rand(110, 300);
      p.style.setProperty('--tx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(ang) * dist + 'px');
      p.style.setProperty('--sz', rand(5, 11).toFixed(1) + 'px');
      p.style.animationDelay = rand(0, .35).toFixed(2) + 's';
      frag.appendChild(p);
    }
    host.appendChild(frag);
    setTimeout(function () { $$('.spark', host).forEach(function (n) { n.remove(); }); }, 2600);
  }
  var sparkCss = document.createElement('style');
  sparkCss.textContent = '.spark{position:absolute;left:50%;top:46%;width:var(--sz);height:var(--sz);border-radius:50%;background:radial-gradient(circle,#FFF6D0,#E8C46B 60%,transparent 72%);opacity:0;pointer-events:none;z-index:4;animation:sparkfly 1.9s cubic-bezier(.2,.7,.3,1) forwards}@keyframes sparkfly{0%{transform:translate(0,0) scale(.4);opacity:0}15%{opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(1);opacity:0}}';
  document.head.appendChild(sparkCss);

  /* ---------------------------------------------------------------
     Music and sound effects. Always off until the guest turns them on.
     --------------------------------------------------------------- */
  var Sound = (function () {
    var btn = $('#musicBtn');
    var ctx = null, master = null, bus = null, timer = null, audioEl = null;
    var on = false;
    var scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]; // Bhoopali (C D E G A)
    var phrases = [
      [0, 2, 3, 5, 3, 2, 0, null], [3, 5, 6, 5, 3, 2, 3, null], [0, null, 2, 3, 2, 0, 1, null], [5, 6, 7, 6, 5, 3, 2, 0]
    ];
    var step = 0, phrase = phrases[0];

    function ensureCtx() {
      if (ctx) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      bus = ctx.createGain(); bus.gain.value = 1;
      var dly = ctx.createDelay(1.5); dly.delayTime.value = .46;
      var fb = ctx.createGain(); fb.gain.value = .42;
      var wet = ctx.createGain(); wet.gain.value = .5;
      bus.connect(master); bus.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);
      drone(130.81, .05); drone(196.0, .035); drone(261.63, .02);
      pad([261.63, 329.63, 392.0]);
      return true;
    }
    function drone(freq, vol) {
      [-3, 3].forEach(function (cents) {
        var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq; o.detune.value = cents;
        var g = ctx.createGain(); g.gain.value = vol;
        var lfo = ctx.createOscillator(); lfo.frequency.value = rand(.08, .18);
        var lg = ctx.createGain(); lg.gain.value = vol * .5;
        lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(bus); o.start(); lfo.start();
      });
    }
    function pad(freqs) {
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      var g = ctx.createGain(); g.gain.value = .022;
      lp.connect(g); g.connect(bus);
      freqs.forEach(function (f, i) {
        var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * (i % 2 ? 1 : .5); o.detune.value = rand(-6, 6);
        var lfo = ctx.createOscillator(); lfo.frequency.value = .07 + i * .03;
        var lg = ctx.createGain(); lg.gain.value = 120; lfo.connect(lg); lg.connect(lp.frequency);
        o.connect(lp); o.start(); lfo.start();
      });
    }
    function pluck(freq, vol, dur) {
      var t = ctx.currentTime;
      var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
      var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
      var g2 = ctx.createGain(); g2.gain.value = .25;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus);
      o.start(t); o2.start(t); o.stop(t + dur + .1); o2.stop(t + dur + .1);
    }
    function tick() {
      if (!on || !ctx) return;
      if (step === 0) phrase = phrases[Math.floor(Math.random() * phrases.length)];
      var d = phrase[step];
      if (d !== null && d !== undefined) pluck(scale[d], .085, 2.4);
      step = (step + 1) % phrase.length;
    }
    function fade(to, secs) {
      if (!master) return;
      var t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(to, t + secs);
    }
    function setUi() {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Pause background music' : 'Play soft background music');
    }
    function start() {
      on = true; setUi();
      if (CFG.musicSrc) {
        if (!audioEl) { audioEl = new Audio(CFG.musicSrc); audioEl.loop = true; audioEl.volume = .45; }
        audioEl.play().catch(function () { on = false; setUi(); });
        ensureCtx();
        return;
      }
      if (!ensureCtx()) { on = false; setUi(); return; }
      ctx.resume();
      fade(.55, 2.5);
      if (!timer) timer = setInterval(tick, 820);
    }
    function stop() {
      on = false; setUi();
      if (audioEl) audioEl.pause();
      if (ctx) { fade(0, .8); setTimeout(function () { if (!on && ctx) ctx.suspend(); }, 900); }
      clearInterval(timer); timer = null;
    }
    btn.addEventListener('click', function () { on ? stop() : start(); });
    document.addEventListener('visibilitychange', function () {
      if (!on) return;
      if (document.hidden) { if (ctx) ctx.suspend(); if (audioEl) audioEl.pause(); }
      else { if (ctx) ctx.resume(); if (audioEl) audioEl.play().catch(function () {}); }
    });

    /* subtle effects, only when the guest has sound on */
    function chime(notes) {
      if (!on || !ctx) return;
      notes.forEach(function (n, i) { setTimeout(function () { if (on) pluck(scale[n] * 2, .07, 1.8); }, i * 140); });
    }
    function whoosh(len) {
      if (!on || !ctx) return;
      var n = Math.floor(ctx.sampleRate * len), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = .8;
      f.frequency.setValueAtTime(300, ctx.currentTime); f.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + len);
      var g = ctx.createGain(); g.gain.value = .09;
      src.connect(f); f.connect(g); g.connect(bus); src.start();
    }
    return { chime: chime, whoosh: whoosh };
  })();

  /* ---------------------------------------------------------------
     Opening film
     --------------------------------------------------------------- */
  var intro = $('#intro');
  var scene = $('#scene');
  var env = $('#env');
  var btn = $('#introBtn');
  var skipBtn = $('#skipIntro');
  var boyImg = $('#boyImg'), girlImg = $('#girlImg');
  var chars = $$('.char', scene);
  var ropes = [$('#rope0'), $('#rope1')];
  var state = 'idle'; // idle > playing > ready > done
  var cancelled = false;

  // Hand position inside the "pull" artwork (160 x 290 box) and the tassel end of each rope
  var ROPE_X = [141 / 160, 19 / 160];
  var ROPE_Y = 192 / 290;

  function updateRopes() {
    var s = scene.getBoundingClientRect();
    var e = env.getBoundingClientRect();
    for (var i = 0; i < 2; i++) {
      var c = chars[i].getBoundingClientRect();
      var x1 = e.left - s.left + e.width * (i === 0 ? .17 : .83);
      var y1 = e.top - s.top + e.height * .7;
      var x2 = c.left - s.left + c.width * ROPE_X[i];
      var y2 = c.top - s.top + c.height * ROPE_Y;
      var dx = x2 - x1, dy = y2 - y1;
      var len = Math.sqrt(dx * dx + dy * dy);
      var ang = -Math.atan2(dx, dy) * 180 / Math.PI;
      ropes[i].style.left = x1 + 'px';
      ropes[i].style.top = y1 + 'px';
      ropes[i].style.height = len + 'px';
      ropes[i].style.transform = 'rotate(' + ang.toFixed(2) + 'deg)';
    }
  }
  function setPull(px) { scene.style.setProperty('--pull', px.toFixed(1) + 'px'); updateRopes(); }
  function tween(from, to, dur, ease) {
    return new Promise(function (res) {
      var t0 = performance.now();
      (function f(t) {
        var k = Math.min(1, (t - t0) / dur);
        var e = ease ? ease(k) : k;
        setPull(from + (to - from) * e);
        if (k < 1 && !cancelled) requestAnimationFrame(f); else res();
      })(t0);
    });
  }
  var easeOut = function (k) { return 1 - Math.pow(1 - k, 3); };
  var easeInOut = function (k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };

  function setPose(pose) {
    boyImg.src = 'assets/boy-' + pose + '.svg';
    girlImg.src = 'assets/girl-' + pose + '.svg';
  }
  // warm the cache so the pose swap is instant
  ['pull', 'hold'].forEach(function (p) { new Image().src = 'assets/boy-' + p + '.svg'; new Image().src = 'assets/girl-' + p + '.svg'; });

  function showCta(label) {
    btn.textContent = label;
    btn.disabled = false;
  }

  async function play() {
    if (state !== 'idle') return;
    state = 'playing';
    btn.disabled = true;
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
    intro.classList.add('is-excited');               // the little ones hop with excitement
    await wait(1250); if (cancelled) return;
    setPose('pull');                                  // they grab the golden ropes
    var u = scene.clientHeight / 100;
    await wait(350); if (cancelled) return;

    Sound.whoosh(.5);
    await tween(0, u * 2.4, 420, easeOut); if (cancelled) return;      // pull one
    env.classList.add('is-shake');
    await tween(u * 2.4, u * .6, 280, easeInOut); if (cancelled) return;
    intro.classList.add('is-glow');                   // the seal begins to glow
    Sound.whoosh(.5);
    await tween(u * .6, u * 2.8, 420, easeOut); if (cancelled) return;  // pull two
    await tween(u * 2.8, u * 1, 260, easeInOut); if (cancelled) return;
    Sound.whoosh(.6);
    await tween(u * 1, u * 3.2, 480, easeOut); if (cancelled) return;   // pull three, the final tug
    await wait(150); if (cancelled) return;

    intro.classList.remove('is-excited');
    intro.classList.add('is-open');                   // flap folds open, card slides out
    Sound.chime([0, 2, 3, 5]);
    tween(u * 3.2, 0, 900, easeOut);
    setPose('cheer');
    await wait(3000); if (cancelled) return;

    state = 'ready';
    showCta('Open Our Wedding Invitation');
    btn.focus({ preventScroll: true });
  }

  function finishIntro() {
    if (state === 'done') return;
    state = 'done'; cancelled = true;
    intro.classList.add('is-leaving');
    root.classList.remove('intro-lock');
    root.classList.add('invite-in');
    window.scrollTo(0, 0);
    var main = $('#top');
    if (main) main.focus({ preventScroll: true });
    setTimeout(function () { intro.hidden = true; }, 1100);
    revealCheck();
  }

  function initIntro() {
    if (!intro || skipFromUrl) { if (intro) intro.hidden = true; root.classList.remove('intro-lock'); return; }
    dust($('#introDust'), 22);
    window.addEventListener('resize', updateRopes);
    window.addEventListener('orientationchange', function () { setTimeout(updateRopes, 250); });
    updateRopes();
    requestAnimationFrame(updateRopes);
    btn.addEventListener('click', function () {
      if (state === 'idle') play();
      else if (state === 'ready') finishIntro();
    });
    skipBtn.addEventListener('click', finishIntro);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state !== 'done') finishIntro(); });

    if (reduced) {
      // Reduced motion: show the finished scene at once, no animation
      state = 'ready';
      intro.classList.add('is-open');
      setPose('cheer');
      showCta('Open Our Wedding Invitation');
    } else if (CFG.autoStartMs > 0) {
      setTimeout(function () { if (state === 'idle') play(); }, CFG.autoStartMs);
    }
    setTimeout(function () { btn.focus({ preventScroll: true }); }, 50);
  }

  /* ---------------------------------------------------------------
     Curtain reveal
     --------------------------------------------------------------- */
  function initCurtains() {
    var stage = $('#stage');
    var cbtn = $('#curtainBtn');
    if (!stage || !cbtn) return;
    var opened = false;
    function open() {
      if (opened) return;
      opened = true;
      stage.classList.add('is-open');
      Sound.whoosh(1.2); Sound.chime([0, 3, 5, 7]);
      setTimeout(function () { burst(stage); }, 700);
      if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) {} }
      $$('.curtain', stage).forEach(function (c) { c.setAttribute('aria-hidden', 'true'); });
    }
    cbtn.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    stage.addEventListener('click', open);
    if (reduced) stage.classList.add('is-open');
  }

  /* ---------------------------------------------------------------
     Countdown (real time, from the configured date, in the visitor's local time)
     --------------------------------------------------------------- */
  function initCountdown() {
    var target = new Date(CFG.weddingDate || '2027-02-16T00:00:00');
    if (isNaN(target.getTime())) target = new Date(2027, 1, 16, 0, 0, 0);
    var els = { d: $('#cdDays'), h: $('#cdHours'), m: $('#cdMins'), s: $('#cdSecs') };
    var box = $('#countdown'), done = $('#cdDone');
    var two = function (n) { return n < 10 ? '0' + n : String(n); };
    var timer;
    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        box.hidden = true; done.hidden = false;
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      els.d.textContent = two(Math.floor(s / 86400));
      els.h.textContent = two(Math.floor(s % 86400 / 3600));
      els.m.textContent = two(Math.floor(s % 3600 / 60));
      els.s.textContent = two(s % 60);
    }
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------
     Scroll effects: reveal on scroll, timeline rail, back to top
     --------------------------------------------------------------- */
  var observer = null;
  function revealCheck() {
    // Called after the intro closes so the first card animates in on view.
    if (!observer) return;
    $$('.rv:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * .92) el.classList.add('in');
    });
  }
  function initScroll() {
    if ('IntersectionObserver' in window && !reduced) {
      root.classList.add('anim');
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); observer.unobserve(en.target); }
        });
      }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
      $$('.rv').forEach(function (el) { observer.observe(el); });
      $$('.sec__head').forEach(function (el) { observer.observe(el); });
      // safety net: never leave content hidden
      setTimeout(function () { $$('.rv').forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add('in'); }); }, 4500);
    }

    var tl = $('#timeline');
    var ticking = false;
    function rail() {
      ticking = false;
      if (!tl) return;
      var r = tl.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * .6 - r.top) / r.height;
      tl.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(rail); } }, { passive: true });
    window.addEventListener('resize', rail);
    rail();

    var back = $('#backTop');
    if (back) back.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var main = $('#top'); if (main) main.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------------
     Start
     --------------------------------------------------------------- */
  dust($('#pageDust'), 14);
  initScroll();
  initCountdown();
  initCurtains();
  initIntro();
})();
