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

  // URLSearchParams decodes spaces, Unicode and & in personalized invitation links.
  var guestName = (new URLSearchParams(location.search).get('name') || '').replace(/\s+/g, ' ').trim();
  var greeting = $('#guestGreeting');
  if (greeting && guestName) {
    greeting.textContent = 'Namaste, ' + guestName;
    greeting.title = 'Namaste, ' + guestName;
    if (guestName.length > 35) greeting.classList.add('intro__eyebrow--long');
  }


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
    var wantOn = CFG.musicDefault !== false;   // music is on by default
    var on = false, manualOff = false;
    var scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]; // Bhoopali (C D E G A)
    var phrases = [
      [0, 2, 3, 5, 3, 2, 0, null], [3, 5, 6, 5, 3, 2, 3, null], [0, null, 2, 3, 2, 0, 1, null], [5, 6, 7, 6, 5, 3, 2, 0]
    ];
    var step = 0, phrase = phrases[0];
    var running = function () { return !!ctx && ctx.state === 'running'; };

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
      if (!on || !running()) return;      // never queue notes while the browser is still holding audio back
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
        var p = audioEl.play(); if (p && p.catch) p.catch(function () {});   // blocked until the first tap; retried then
        ensureCtx();
        return;
      }
      if (!ensureCtx()) { on = false; setUi(); return; }
      var r = ctx.resume(); if (r && r.catch) r.catch(function () {});
      fade(.55, 2.5);
      if (!timer) timer = setInterval(tick, 820);
    }
    function stop() {
      on = false; setUi();
      if (audioEl) audioEl.pause();
      if (ctx) { fade(0, .8); setTimeout(function () { if (!on && ctx) ctx.suspend(); }, 900); }
      clearInterval(timer); timer = null;
    }
    btn.addEventListener('click', function () {
      if (on) { manualOff = true; stop(); } else { manualOff = false; start(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (!on) return;
      if (document.hidden) { if (ctx) ctx.suspend(); if (audioEl) audioEl.pause(); }
      else { if (ctx) ctx.resume(); if (audioEl) audioEl.play().catch(function () {}); }
    });

    /* Browsers only allow sound after a tap, click or key press. So music is switched on
       from the start, and the first touch anywhere lets it begin. */
    var gestures = ['pointerup', 'touchend', 'click', 'keydown'];
    function unlock() {
      if (!on || manualOff) return;
      if (ctx && ctx.state !== 'running') { var r = ctx.resume(); if (r && r.catch) r.catch(function () {}); }
      if (audioEl && audioEl.paused) audioEl.play().catch(function () {});
      setTimeout(function () {
        var ok = CFG.musicSrc ? (audioEl && !audioEl.paused) : running();
        if (ok) gestures.forEach(function (g) { document.removeEventListener(g, unlock, true); });
      }, 250);
    }
    if (wantOn) {
      start();
      gestures.forEach(function (g) { document.addEventListener(g, unlock, true); });
    } else { setUi(); }

    /* subtle effects, only while the music is on and running */
    function chime(notes) {
      if (!on || !running()) return;
      notes.forEach(function (n, i) { setTimeout(function () { if (on && running()) pluck(scale[n] * 2, .07, 1.8); }, i * 140); });
    }
    function whoosh(len) {
      if (!on || !running()) return;
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
     Small hand hints (tap / swipe). They appear a few seconds after a step
     is waiting for the guest, and vanish as soon as the guest acts.
     --------------------------------------------------------------- */
  var HAND_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>';
  function makeHand(kind, label, host, left, top) {
    var el = document.createElement('div');
    el.className = 'hand hand--' + kind;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = HAND_SVG + '<span>' + label + '</span>';
    if (left != null) { el.style.left = left; el.style.top = top; }
    host.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-on'); }); });
    var gone = false;
    return { hide: function () { if (gone) return; gone = true; el.classList.remove('is-on'); setTimeout(function () { el.remove(); }, 650); } };
  }
  /* After three seconds of inactivity, demonstrate an upward finger swipe. */
  var scrollHintTimer = null, scrollHint = null;
  function clearScrollHint() {
    clearTimeout(scrollHintTimer); scrollHintTimer = null;
    if (scrollHint) { scrollHint.hide(); scrollHint = null; }
  }
  function canShowScrollHint() {
    if (root.classList.contains('intro-lock') || document.hidden) return false;
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 24) return false;
    var stage = $('#stage');
    if (stage && !stage.classList.contains('is-open')) {
      var r = stage.getBoundingClientRect();
      var visible = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
      // The curtain's tap hint takes priority while guests are on that step.
      if (visible > Math.min(r.height, window.innerHeight) * .55) return false;
    }
    return true;
  }
  function armScrollHint(delay) {
    clearScrollHint();
    var y0 = window.scrollY;
    scrollHintTimer = setTimeout(function () {
      scrollHintTimer = null;
      if (Math.abs(window.scrollY - y0) > 4 || !canShowScrollHint()) return;
      scrollHint = makeHand('swipe', 'Swipe up to scroll', document.body);
    }, delay);
  }
  window.addEventListener('scroll', function () { armScrollHint(3000); }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearScrollHint(); else armScrollHint(3000);
  });

  /* ---------------------------------------------------------------
     Opening film
     Act 1: the couple pull the golden ropes (three joyful tugs, seal glows).
     Act 2: the camera moves into the seal, the wax cracks, the flap lifts,
            the card slides out of the envelope.
     --------------------------------------------------------------- */
  var intro = $('#intro');
  var scene = $('#scene');
  var frame = $('#picFrame');
  var fx = $('#picFx');
  var reveal = $('#reveal');
  var revealFx = $('#revealFx');
  var sealEl = $('.env__seal', intro);
  var btn = $('#introBtn');
  var skipBtn = $('#skipIntro');
  var state = 'idle'; // idle > playing > ready > done
  var cancelled = false;
  var ctaHint = null, ctaHintTimer = null;

  function showCta(label) {
    btn.textContent = label;
    btn.disabled = false;
  }
  function hideCtaHint() {
    clearTimeout(ctaHintTimer); ctaHintTimer = null;
    if (ctaHint) { ctaHint.hide(); ctaHint = null; }
  }
  function armCtaHint() {
    hideCtaHint();
    if (reduced) return;
    ctaHintTimer = setTimeout(function () {
      if (state === 'playing' || state === 'done') return;
      var s = scene.getBoundingClientRect(), r = btn.getBoundingClientRect();
      ctaHint = makeHand('tap', 'Tap', scene, (r.left - s.left + r.width * .58) + 'px', (r.top - s.top + r.height * .42) + 'px');
    }, 3000);
  }

  /* happy sparkles and little hearts rising from the couple on every tug */
  function emit(host, n, area) {
    if (reduced || !host) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var e = document.createElement('i');
      var heart = Math.random() < .4;
      e.className = 'fx ' + (heart ? 'fx--heart' : 'fx--spark');
      e.style.setProperty('--x', rand(area[0], area[1]).toFixed(1) + '%');
      e.style.setProperty('--y', rand(area[2], area[3]).toFixed(1) + '%');
      e.style.setProperty('--s', rand(8, 18).toFixed(1) + 'px');
      e.style.setProperty('--dx', rand(-26, 26).toFixed(0) + 'px');
      e.style.animationDelay = rand(0, .25).toFixed(2) + 's';
      frag.appendChild(e);
    }
    host.appendChild(frag);
    setTimeout(function () { $$('.fx', host).slice(0, n).forEach(function (x) { x.remove(); }); }, 2200);
  }

  /* A single clock selects each pose and its two hand anchors together. */
  var pullStarted = 0;
  var handPositions = {
    Boy: { rest: [.58, .16, .56, .29], reach: [.57, .055, .565, .20], tug: [.56, .37, .54, .45] },
    Girl: { rest: [.40, .17, .40, .27], reach: [.33, .06, .35, .19], tug: [.42, .38, .435, .46] }
  };
  function trackRopes(now) {
    if (!intro || intro.hidden || cancelled) return;
    var s = scene.getBoundingClientRect();
    var e = $('#env').getBoundingClientRect();
    ['Boy', 'Girl'].forEach(function (name) {
      var elapsed = pullStarted ? Math.max(0, (now || performance.now()) - pullStarted - (name === 'Girl' ? 80 : 0)) : 0;
      var phase = (elapsed % 1350) / 1350;
      var pose = 'rest';
      if (pullStarted) {
        pose = phase < .15 ? 'rest' : phase < .42 ? 'reach' : phase < .50 ? 'rest' : 'tug';
        if (elapsed >= 4050 || intro.classList.contains('is-reveal')) pose = 'tug';
      }
      var figure = $('.character--' + name.toLowerCase());
      figure.dataset.pose = pose;
      var points = handPositions[name][pose];
      var upper = $('#grip' + name), lower = $('#lower' + name);
      upper.style.left = points[0] * 100 + '%'; upper.style.top = points[1] * 100 + '%';
      lower.style.left = points[2] * 100 + '%'; lower.style.top = points[3] * 100 + '%';
      var u = upper.getBoundingClientRect(), l = lower.getBoundingClientRect();
      var x = u.left - s.left, y = u.top - s.top;
      var lx = l.left - s.left, ly = l.top - s.top;
      var ax = e.left - s.left + e.width * (name === 'Boy' ? .16 : .84);
      var ay = e.top - s.top + e.height * .82;
      var tail = ly + s.height * .10;
      $('#rope' + name).setAttribute('d', 'M' + ax + ',' + ay + ' L' + x + ',' + y + ' L' + lx + ',' + ly + ' Q' + (lx - 3) + ',' + (ly + 25) + ' ' + (lx - 5) + ',' + tail);
      $('#tassel' + name).setAttribute('transform', 'translate(' + (lx - 5) + ' ' + tail + ')');
    });
    if (!reduced) requestAnimationFrame(trackRopes);
  }

  var poseAssetsReady = Promise.all(['pull', 'reach', 'tug'].map(function (pose) {
    return new Promise(function (resolve) {
      var image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = 'assets/couple-' + pose + '.webp';
    });
  }));

  async function play() {
    if (state !== 'idle') return;
    state = 'playing';
    hideCtaHint();
    btn.disabled = true;
    await poseAssetsReady;
    if (cancelled) return;
    $('#introStatus').textContent = 'The couple is pulling the ropes to open your invitation.';
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
    await wait(350); if (cancelled) return;

    pullStarted = performance.now();
    intro.classList.add('is-pulling');                       // act 1: tug, tug, tug
    Sound.whoosh(.6);
    [810, 2160, 3510].forEach(function (t, i) {
      setTimeout(function () {
        if (cancelled) return;
        emit(fx, 7 + i * 2, [10, 92, 26, 58]);
        if (i === 1) Sound.whoosh(.5);
        if (i === 2) Sound.whoosh(.7);
      }, t);
    });
    await wait(4250); if (cancelled) return;

    // The connected envelope moves forward after the final pull.
    intro.classList.add('is-zoom', 'is-reveal', 'is-glow');
    await wait(1000); if (cancelled) return;

    intro.classList.add('is-crack');                         // the wax seal splits
    Sound.chime([0, 2]);
    emit(revealFx, 14, [-30, 30, -20, 20]);
    await wait(650); if (cancelled) return;

    intro.classList.add('is-open');
    emit(fx, 20, [10, 92, 8, 48]);                          // the flap lifts, light spills out
    Sound.whoosh(1);
    await wait(750); if (cancelled) return;
    intro.classList.add('is-flap-back');
    await wait(850); if (cancelled) return;

    intro.classList.add('is-out');                           // the card slides out
    Sound.chime([0, 2, 3, 5]);
    await wait(1700); if (cancelled) return;

    intro.classList.add('is-present');
    state = 'ready';
    $('#introStatus').textContent = 'Your invitation is ready.';
    showCta('View Our Wedding Invitation');
    btn.focus({ preventScroll: true });
    armCtaHint();
  }

  function finishIntro() {
    if (state === 'done') return;
    state = 'done'; cancelled = true;
    hideCtaHint();
    intro.classList.add('is-leaving');
    root.classList.remove('intro-lock');
    root.classList.add('invite-in');
    window.scrollTo(0, 0);
    var main = $('#top');
    if (main) main.focus({ preventScroll: true });
    setTimeout(function () { intro.hidden = true; }, 1100);
    revealCheck();
    armScrollHint(3000);
  }

  function initIntro() {
    if (!intro || skipFromUrl) { if (intro) intro.hidden = true; root.classList.remove('intro-lock'); armScrollHint(3000); return; }
    dust($('#introDust'), 22);
    trackRopes();
    btn.addEventListener('click', function () {
      if (state === 'idle') play();
      else if (state === 'ready') finishIntro();
    });
    skipBtn.addEventListener('click', finishIntro);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state !== 'done') finishIntro(); });

    if (reduced) {
      // Reduced motion: show the finished scene at once, no animation
      state = 'ready';
      intro.classList.add('is-zoom', 'is-reveal', 'is-open', 'is-flap-back', 'is-out', 'is-present');
      showCta('Open Our Wedding Invitation');
    } else {
      if (CFG.autoStartMs > 0) setTimeout(function () { if (state === 'idle') play(); }, CFG.autoStartMs);
      armCtaHint();
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
    var opened = false, hintTimer = null, hint = null;
    function hideHint() { clearTimeout(hintTimer); hintTimer = null; if (hint) { hint.hide(); hint = null; } }
    function open() {
      if (opened) return;
      opened = true;
      hideHint();
      stage.classList.add('is-open');
      Sound.whoosh(1.2); Sound.chime([0, 3, 5, 7]);
      setTimeout(function () { burst(stage); }, 700);
      if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) {} }
      $$('.curtain', stage).forEach(function (c) { c.setAttribute('aria-hidden', 'true'); });
      armScrollHint(3000);                                 // nudge the guest to keep scrolling
    }
    cbtn.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    stage.addEventListener('click', open);
    if (reduced) { stage.classList.add('is-open'); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (opened) return;
          if (en.isIntersecting) {
            clearScrollHint();
            if (!hintTimer && !hint) hintTimer = setTimeout(function () {
              hintTimer = null;
              hint = makeHand('tap', 'Tap', stage, 'calc(50% + 12px)', 'calc(50% + 6px)');
            }, 3000);
          } else { hideHint(); }
        });
      }, { threshold: .6 }).observe(stage);
    }
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
