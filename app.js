/* =====================================================================
   Web version of proposal.py: same scenes, timings, colors and music.
   Names and texts live in config.js. You normally never edit this file.
   ===================================================================== */
(() => {
  'use strict';

  const CFG = window.PROPOSAL_CONFIG || {};
  const {
    HIS_FULL, HIS, HER_FULL, HER, START_LINE, START_HINT, INTRO, NAMES_SUB, BOOK_LINE, BOOK_COVER,
    CHAPTERS, SONG_TITLE, SONG_LINES, POEM_TITLE, POEM_TAGORE, POEM_CREDIT, POEM_MINE_TITLE, POEM_MINE,
    HEART_TEXT, HEART_SUB, LETTER, QUESTION, QUESTION_SUB, YES_TEXT, NO_TEXT, TEASES, CEL_TITLE,
    CEL_NAMES, CEL_WISH, CEL_LAST,
  } = CFG;
  const PLAY_MUSIC = CFG.PLAY_MUSIC !== false;
  const BANGLA_FONT = CFG.BANGLA_FONT || '';
  const CUSTOM_SONG = CFG.CUSTOM_SONG || '';
  const NOTIFY_TOPIC = String(CFG.NOTIFY_TOPIC || '').trim();
  const NOTIFY_SERVER = String(CFG.NOTIFY_SERVER || 'https://ntfy.sh').trim().replace(/\/+$/, '');
  const NOTIFY_TITLE = CFG.NOTIFY_TITLE || `${HER} হ্যাঁ বলেছে! 💍`;
  const SPEED_SCENES = Array.isArray(CFG.SPEED_SCENES) ? CFG.SPEED_SCENES : ['song', 'poem'];
  const SPEED_OPTIONS = Array.isArray(CFG.SPEED_OPTIONS) && CFG.SPEED_OPTIONS.length ? CFG.SPEED_OPTIONS : [1, 1.5, 2];

  const PINKS = ['#ff4d79', '#ff8fab', '#ffb3c7', '#ff2d5f', '#ffd1dc', '#ffffff'];
  const CONFETTI_COLORS = ['#ff4d79', '#ffd479', '#7ad7ff', '#b38bff', '#7dffb0', '#ffffff', '#ff9a3c'];
  const FIREWORK_SETS = [
    ['#ff4d79', '#ffd1dc', '#ffffff'],
    ['#ffd479', '#fff3c4', '#ff9a3c'],
    ['#7ad7ff', '#d8f3ff', '#ffffff'],
    ['#b38bff', '#e6dbff', '#ff8fab'],
    ['#7dffb0', '#d9ffe9', '#ffd479'],
  ];

  // ---------------------------------------------------------------------
  //  Small helpers (same maths as the Python version)
  // ---------------------------------------------------------------------
  const rand = Math.random;
  const uni = (a, b) => a + (b - a) * rand();
  const choice = (arr) => arr[Math.floor(rand() * arr.length)];
  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
  const easeOut = (p) => { p = clamp(p); return 1 - (1 - p) ** 3; };
  const easeInOut = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const easeBack = (p) => { p = clamp(p); const c1 = 1.70158; return 1 + (c1 + 1) * (p - 1) ** 3 + c1 * (p - 1) ** 2; };

  const rgbCache = new Map();
  function rgb(h) {
    let v = rgbCache.get(h);
    if (!v) {
      const s = h.replace('#', '');
      v = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
      rgbCache.set(h, v);
    }
    return v;
  }
  const hex2 = (n) => n.toString(16).padStart(2, '0');
  function mix(a, b, t) {
    t = clamp(t);
    const [ra, ga, ba] = rgb(a);
    const [rb, gb, bb] = rgb(b);
    return '#' + hex2(Math.trunc(ra + (rb - ra) * t)) + hex2(Math.trunc(ga + (gb - ga) * t)) +
      hex2(Math.trunc(ba + (bb - ba) * t));
  }

  function makeHeart(n) {
    const raw = [];
    for (let i = 0; i < n; i++) {
      const t = 2 * Math.PI * i / n;
      const x = 16 * Math.sin(t) ** 3;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      raw.push([x, y]);
    }
    const xs = raw.map((p) => p[0]);
    const ys = raw.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs);
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    return raw.map(([x, y]) => [x / w, (y - cy) / w]);
  }
  const HEART_BIG = makeHeart(64);
  const HEART_SMALL = makeHeart(22);

  function heartPoints(cx, cy, size, shape = HEART_BIG) {
    const out = [];
    for (const [x, y] of shape) out.push(cx + x * size, cy + y * size);
    return out;
  }

  function pillPoints(x1, y1, x2, y2, r) {
    r = Math.max(1, Math.min(r, (x2 - x1) / 2, (y2 - y1) / 2));
    return [x1 + r, y1, x1 + r, y1, x2 - r, y1, x2 - r, y1, x2, y1, x2, y1 + r, x2, y1 + r,
      x2, y2 - r, x2, y2 - r, x2, y2, x2 - r, y2, x2 - r, y2, x1 + r, y2, x1 + r, y2,
      x1, y2, x1, y2 - r, x1, y2 - r, x1, y1 + r, x1, y1 + r, x1, y1];
  }

  // Split Bangla text into letter clusters so the typewriter never breaks a conjunct.
  const MARK = /\p{M}/u;
  function clusters(text) {
    const ch = Array.from(text);
    const out = [];
    let i = 0;
    while (i < ch.length) {
      let j = i + 1;
      while (j < ch.length && (MARK.test(ch[j]) || ch[j] === '‌' || ch[j] === '‍' || ch[j - 1] === '্')) j++;
      out.push(ch.slice(i, j).join(''));
      i = j;
    }
    return out;
  }

  // Best place to break one line into two (by width), for narrow phone screens.
  function splitBalanced(text, font) {
    const words = text.split(' ');
    if (words.length < 2) return null;
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const score = Math.max(font.measure(a), font.measure(b));
      if (!best || score < best[0]) best = [score, a, b];
    }
    return [best[1], best[2]];
  }

  function wrapWords(text, font, maxW) {
    if (font.measure(text) <= maxW) return [text];
    const two = splitBalanced(text, font);
    if (two && font.measure(two[0]) <= maxW && font.measure(two[1]) <= maxW) return two;
    const words = text.split(' ');
    const rows = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (cur && font.measure(t) > maxW) { rows.push(cur); cur = w; } else cur = t;
    }
    if (cur) rows.push(cur);
    return rows;
  }

  function stackCenters(hs, gaps, top, bottom) {
    let g = gaps.slice();
    const sumH = hs.reduce((a, b) => a + b, 0);
    let sumG = g.reduce((a, b) => a + b, 0);
    const room = bottom - top;
    if (sumH + sumG > room && sumG > 0) {
      const k = Math.max(0.25, (room - sumH) / sumG);
      g = g.map((x) => x * k);
      sumG *= k;
    }
    let y = top + Math.max(0, (room - sumH - sumG) / 2);
    return hs.map((h, i) => { const c = y + h / 2; y += h + (g[i] || 0); return c; });
  }

  // Smooth curves exactly like Tk's "smooth=True" (quadratic B-spline through mid points).
  function tracePath(ctx, p, smooth, closed) {
    let n = p.length >> 1;
    ctx.beginPath();
    if (n < 2) return false;
    if (!smooth || n < 3) {
      ctx.moveTo(p[0], p[1]);
      for (let i = 1; i < n; i++) ctx.lineTo(p[2 * i], p[2 * i + 1]);
      if (closed) ctx.closePath();
      return true;
    }
    if (closed) {
      if (p[0] === p[2 * n - 2] && p[1] === p[2 * n - 1]) n -= 1;
      const X = (i) => p[2 * (((i % n) + n) % n)];
      const Y = (i) => p[2 * (((i % n) + n) % n) + 1];
      ctx.moveTo((X(n - 1) + X(0)) / 2, (Y(n - 1) + Y(0)) / 2);
      for (let i = 0; i < n; i++) ctx.quadraticCurveTo(X(i), Y(i), (X(i) + X(i + 1)) / 2, (Y(i) + Y(i + 1)) / 2);
      ctx.closePath();
      return true;
    }
    ctx.moveTo(p[0], p[1]);
    for (let i = 1; i <= n - 2; i++) {
      const last = i === n - 2;
      const ex = last ? p[2 * n - 2] : (p[2 * i] + p[2 * i + 2]) / 2;
      const ey = last ? p[2 * n - 1] : (p[2 * i + 1] + p[2 * i + 3]) / 2;
      ctx.quadraticCurveTo(p[2 * i], p[2 * i + 1], ex, ey);
    }
    return true;
  }

  // ---------------------------------------------------------------------
  //  Music: a gentle music-box version of Pachelbel's Canon (public domain),
  //  synthesised into a WAV file in the browser, then looped in the background.
  //  This function is self-contained so it can also run inside a Web Worker.
  // ---------------------------------------------------------------------
  function buildCanonWav(speed, bright) {
    const SR = 22050;
    const BASS = [62, 57, 59, 54, 55, 50, 55, 57];
    const ARP = [[66, 69, 74, 78], [64, 69, 73, 76], [66, 71, 74, 78], [61, 66, 69, 73],
      [62, 67, 71, 74], [66, 69, 74, 78], [62, 67, 71, 74], [64, 69, 73, 76]];
    const MELODY = [[90, 88, 86, 85, 83, 81, 83, 85], [86, 85, 83, 81, 79, 78, 79, 76]];

    function tone(midi, dur) {
      const f = 440 * Math.pow(2, (midi - 69) / 12);
      const n = Math.trunc(dur * SR);
      const w = 2 * Math.PI * f / SR;
      const att = Math.max(1, Math.trunc(0.004 * SR));
      const d1 = Math.exp(-3 / SR), d2 = Math.exp(-5.5 / SR), d3 = Math.exp(-9 / SR);
      let e1 = 1, e2 = 1, e3 = 1;
      const out = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        const a = i < att ? i / att : 1;
        out[i] = a * (e1 * Math.sin(w * i) + 0.35 * e2 * Math.sin(2 * w * i) + 0.12 * e3 * Math.sin(3 * w * i + 0.5));
        e1 *= d1; e2 *= d2; e3 *= d3;
      }
      const tail = Math.trunc(0.03 * SR);
      for (let i = Math.max(0, n - tail); i < n; i++) out[i] *= (n - i) / tail;
      return out;
    }

    const eighth = 0.25 / speed;
    const chordLen = Math.trunc(8 * eighth * SR);
    const total = chordLen * 16;
    const buf = new Float64Array(total);
    const cache = new Map();
    function add(start, midi, dur, gain) {
      const key = midi + '|' + dur;
      let wv = cache.get(key);
      if (!wv) { wv = tone(midi, dur); cache.set(key, wv); }
      let j = start % total;
      for (let i = 0; i < wv.length; i++) {
        buf[j] = buf[j] + gain * wv[i];
        j++;
        if (j >= total) j = 0;
      }
    }
    const pattern = ['B', 0, 1, 2, 3, 2, 1, 0];
    for (let rep = 0; rep < 2; rep++) {
      for (let ci = 0; ci < 8; ci++) {
        const base = (rep * 8 + ci) * chordLen;
        for (let k = 0; k < pattern.length; k++) {
          const p = pattern[k];
          const st = base + Math.trunc(k * eighth * SR);
          if (p === 'B') add(st, BASS[ci], 1.6, 0.42);
          else add(st, ARP[ci][p], 1.0, 0.26);
        }
        const mel = MELODY[rep][ci];
        add(base, mel, 1.9, 0.55);
        if (bright) {
          add(base, mel + 12, 1.2, 0.18);
          add(base + Math.trunc(4 * eighth * SR), mel, 1.2, 0.30);
        }
      }
    }
    const d = Math.trunc(0.19 * SR);
    const out = new Float64Array(total);
    let peak = 1e-9;
    for (let i = 0; i < total; i++) {
      const j = i - d;
      out[i] = buf[i] + 0.28 * buf[j < 0 ? j + total : j];
      const a = Math.abs(out[i]);
      if (a > peak) peak = a;
    }
    const k = 0.85 * 32767 / peak;
    const bytes = new ArrayBuffer(44 + total * 2);
    const v = new DataView(bytes);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + total * 2, true); str(8, 'WAVE');
    str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, total * 2, true);
    for (let i = 0; i < total; i++) v.setInt16(44 + 2 * i, Math.trunc(out[i] * k), true);
    return bytes;
  }

  function silentWav() {
    const n = 2205;
    const b = new ArrayBuffer(44 + n * 2);
    const v = new DataView(b);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 22050, true);
    v.setUint32(28, 44100, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data');
    v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  }

  class Music {
    constructor(enabled) {
      this.enabled = enabled;
      this.urls = {};
      this.want = null;
      this.playing = null;
      this.el = null;
      this.resume = false;
      if (!enabled) return;
      this.el = new Audio();
      this.el.loop = true;
      this.el.preload = 'auto';
      this.el.setAttribute('playsinline', '');
      if (CUSTOM_SONG) {
        this.urls.main = CUSTOM_SONG;
        this.urls.joy = CUSTOM_SONG;
      } else {
        this.prepare();
      }
      document.addEventListener('visibilitychange', () => {
        if (!this.el || !this.playing) return;
        if (document.hidden) {
          if (!this.el.paused) { this.el.pause(); this.resume = true; }
        } else if (this.resume) {
          this.resume = false;
          this.el.play().catch(() => {});
        }
      });
    }

    prepare() {
      const jobs = [['main', 1.0, false], ['joy', 1.45, true]];
      const ready = (key, buf) => {
        if (this.urls[key]) return;
        this.urls[key] = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
        this.apply();
      };
      const fallback = () => {
        jobs.forEach(([key, speed, bright], i) => {
          setTimeout(() => { if (!this.urls[key]) ready(key, buildCanonWav(speed, bright)); }, 30 + i * 60);
        });
      };
      try {
        const src = 'self.onmessage=function(e){var b=(' + buildCanonWav.toString() +
          ')(e.data.speed,e.data.bright);self.postMessage({key:e.data.key,buf:b},[b]);};';
        const worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
        worker.onmessage = (e) => ready(e.data.key, e.data.buf);
        worker.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); fallback(); };
        for (const [key, speed, bright] of jobs) worker.postMessage({ key, speed, bright });
      } catch (err) {
        fallback();
      }
    }

    play(key) {
      if (!this.enabled) return;
      this.want = key;
      if (!this.urls[key] && !this.playing) {
        // Called from the first tap/click: unlock audio now (needed on iPhone), real music follows.
        this.playing = 'unlock';
        this.el.src = silentWav();
        this.el.play().catch(() => {});
        return;
      }
      this.apply();
    }

    apply() {
      if (!this.el) return;
      const url = this.want && this.urls[this.want];
      if (!url || url === this.playing) return;
      this.playing = url;
      this.el.src = url;
      const p = this.el.play();
      if (p && p.catch) {
        p.catch(() => {
          const retry = () => {
            window.removeEventListener('pointerdown', retry, true);
            window.removeEventListener('keydown', retry, true);
            this.el.play().catch(() => {});
          };
          window.addEventListener('pointerdown', retry, true);
          window.addEventListener('keydown', retry, true);
        });
      }
    }
  }

  // ---------------------------------------------------------------------
  //  "She said yes" notification to your phone (ntfy app). Silent: nothing
  //  changes on her screen, and any network problem is ignored.
  //  Open the site with ?test at the end to get a small test panel that shows
  //  whether ntfy.sh really received the notification.
  // ---------------------------------------------------------------------
  const TEST_MODE = (() => { try { return new URLSearchParams(location.search).has('test'); } catch (e) { return false; } })();
  const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট',
    'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const bnNum = (v) => String(v).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);

  function bnTime(d) {
    const h = d.getHours();
    const part = h >= 4 && h < 6 ? 'ভোর' : h >= 6 && h < 12 ? 'সকাল' : h >= 12 && h < 15 ? 'দুপুর'
      : h >= 15 && h < 18 ? 'বিকাল' : h >= 18 && h < 20 ? 'সন্ধ্যা' : 'রাত';
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${part} ${bnNum(h % 12 || 12)}:${bnNum(mm)}, ${bnNum(d.getDate())} ${BN_MONTHS[d.getMonth()]}`;
  }

  function yesText(tries) {
    return {
      title: (TEST_MODE ? 'পরীক্ষা: ' : '') + NOTIFY_TITLE,
      message: `সময়: ${bnTime(new Date())}\n` + (tries > 0
        ? `'না' বাটন ধরার চেষ্টা করেছে ${bnNum(tries)} বার।`
        : `একবারও 'না' বাটন ধরার চেষ্টা করেনি।`),
    };
  }

  // Sends one notification and resolves to { ok, detail }. Never throws.
  // 1st try: ntfy's simple link form  https://ntfy.sh/<topic>/publish?title=..&message=..
  // if ntfy answers with an error: the JSON form (POST to https://ntfy.sh/)
  // if the network call itself fails: an image beacon of the simple link, as a last resort.
  function sendNtfy(title, message) {
    if (!NOTIFY_TOPIC) return Promise.resolve({ ok: false, detail: 'NOTIFY_TOPIC is empty in config.js' });
    const query = new URLSearchParams({ title, message, tags: 'tada', priority: '4' }).toString();
    const link = `${NOTIFY_SERVER}/${encodeURIComponent(NOTIFY_TOPIC)}/publish?${query}`;
    const beacon = () => { try { new Image().src = link + '&nc=' + Date.now(); } catch (e) { /* ignore */ } };
    if (!window.fetch) { beacon(); return Promise.resolve({ ok: true, detail: 'sent (this browser cannot show the reply)' }); }
    const json = JSON.stringify({ topic: NOTIFY_TOPIC, title, message, tags: ['tada'], priority: 4 });
    try {
      return fetch(link, { cache: 'no-store', keepalive: true })
        .then((r) => (r.ok ? r : fetch(NOTIFY_SERVER + '/', { method: 'POST', body: json, keepalive: true })))
        .then((r) => r.text().then((t) => ({ ok: r.ok, detail: `HTTP ${r.status} ${t.trim().slice(0, 150)}` })))
        .catch((e) => { beacon(); return { ok: false, detail: (e && e.message) || String(e) }; });
    } catch (e) {
      beacon();
      return Promise.resolve({ ok: false, detail: String(e) });
    }
  }

  // Small panel shown only with ?test, so you can check the notification without playing the whole show.
  class NtfyPanel {
    constructor() {
      const box = document.createElement('div');
      box.className = 'ntfy-test';
      box.innerHTML = '<div class="nt-head"><b>Notification test</b><button type="button" class="nt-x" aria-label="Close">×</button></div>' +
        '<div class="nt-topic">Topic: <code></code></div>' +
        '<button type="button" class="nt-send">Send test notification</button>' +
        '<div class="nt-status" role="status">Tap the button, or play the show and tap Yes.</div>' +
        '<a class="nt-link" target="_blank" rel="noopener">What ntfy.sh received in the last hour</a>';
      box.querySelector('code').textContent = NOTIFY_TOPIC || '(empty)';
      box.querySelector('.nt-link').href = `${NOTIFY_SERVER}/${encodeURIComponent(NOTIFY_TOPIC || 'x')}/json?poll=1&since=1h`;
      box.querySelector('.nt-x').addEventListener('click', () => box.remove());
      box.querySelector('.nt-send').addEventListener('click', () => {
        this.track(sendNtfy('পরীক্ষা: নোটিফিকেশন ঠিকমতো কাজ করছে', `সময়: ${bnTime(new Date())}`));
      });
      document.body.appendChild(box);
      this.box = box;
      this.status = box.querySelector('.nt-status');
    }
    track(promise) {
      this.status.className = 'nt-status';
      this.status.textContent = 'Sending...';
      promise.then((r) => {
        this.status.className = 'nt-status ' + (r.ok ? 'ok' : 'bad');
        this.status.textContent = r.ok
          ? '✓ ntfy.sh received it. If your phone stays silent, the problem is in the ntfy app: topic name, notification permission, Do Not Disturb or battery saver.'
          : '✗ Not delivered (' + r.detail + '). This browser or network is blocking ntfy.sh. Try Chrome, or switch between Wi-Fi and mobile data.';
      });
    }
  }

  // ---------------------------------------------------------------------
  //  Fonts and canvas items (a tiny retained-mode copy of the Tk canvas)
  // ---------------------------------------------------------------------
  const quote = (s) => `"${s}"`;
  const BN_FAMILY = [BANGLA_FONT, 'Nirmala UI', 'Noto Serif Bengali', 'Hind Siliguri', 'Kalpurush', 'SolaimanLipi',
    'Siyam Rupali', 'Vrinda', 'Kohinoor Bangla', 'Bangla Sangam MN', 'Bangla MN', 'Noto Sans Bengali',
    'Lohit Bengali', 'FreeSerif'].filter(Boolean).map(quote).join(', ') + ', serif';
  const EN_FAMILY = ['Segoe UI Semibold', 'Segoe UI', 'Helvetica Neue', 'Helvetica', 'Arial', 'DejaVu Sans']
    .map(quote).join(', ') + ', sans-serif';

  const mctx = document.createElement('canvas').getContext('2d');

  class Font {
    constructor(px, weight, family) {
      this.px = px;
      this.weight = weight;
      this.family = family;
      this.css = `${weight === 'bold' ? 700 : 400} ${px}px ${family}`;
      this.reset();
    }
    reset() { this.cache = new Map(); this.asc = null; this.desc = null; }
    measure(s) {
      let w = this.cache.get(s);
      if (w === undefined) {
        mctx.font = this.css;
        w = mctx.measureText(s).width;
        this.cache.set(s, w);
      }
      return w;
    }
    metrics() {
      if (this.asc === null) {
        mctx.font = this.css;
        const m = mctx.measureText('অআগ্যর্কিপ্রু Mgy');
        let a = m.fontBoundingBoxAscent;
        let d = m.fontBoundingBoxDescent;
        if (!(a > 0)) { a = this.px * 1.05; d = this.px * 0.45; }
        this.asc = a;
        this.desc = d;
      }
    }
    get ascent() { this.metrics(); return this.asc; }
    get linespace() { this.metrics(); return this.asc + this.desc; }
  }

  class Item {
    constructor(kind, coords, o = {}) {
      this.kind = kind;
      this.coords = coords;
      this.fill = o.fill !== undefined ? o.fill : '';
      this.outline = o.outline !== undefined ? o.outline : '';
      this.width = o.width !== undefined ? o.width : 1;
      this.smooth = !!o.smooth;
      this.cap = o.capstyle || 'butt';
      this.join = o.joinstyle || 'round';
      this.hidden = o.state === 'hidden';
      this.tags = o.tags || null;
      this.op = o.op !== undefined ? o.op : 1;
      this.reg = null;
      this.vis = 0;
      this.dead = false;
      if (kind === 'arc') { this.start = o.start || 0; this.extent = o.extent || 90; }
      if (kind === 'text') {
        this.lines = o.lines || [''];
        this.font = o.font;
        this.anchor = o.anchor || 'center';
        this.glow = o.glow || null;
        this.shadow = !!o.shadow;
        this.gr = o.gr || 1.5;
        this.sd = o.sd || 1;
        this.rowGap = o.rowGap || 1;
      }
    }
  }

  function textBox(it) {
    const f = it.font;
    const n = it.lines.length;
    const h = f.linespace * (1 + (n - 1) * it.rowGap);
    let w = 0;
    for (const s of it.lines) w = Math.max(w, f.measure(s));
    const x = it.coords[0], y = it.coords[1];
    const x1 = it.anchor === 'e' ? x - w : it.anchor === 'w' ? x : x - w / 2;
    return [x1, y - h / 2, x1 + w, y + h / 2];
  }

  function drawText(ctx, it, op) {
    const f = it.font;
    const lines = it.lines;
    ctx.font = f.css;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const rowH = f.linespace * it.rowGap;
    const blockH = f.linespace + rowH * (lines.length - 1);
    const x = it.coords[0];
    const top = it.coords[1] - blockH / 2;
    for (let i = 0; i < lines.length; i++) {
      const s = lines[i];
      if (!s || !s.trim()) continue;
      const w = f.measure(s);
      const lx = it.anchor === 'e' ? x - w : it.anchor === 'w' ? x : x - w / 2;
      const by = top + i * rowH + f.ascent;
      if (it.glow) {
        ctx.globalAlpha = op * 0.38;
        ctx.lineJoin = 'round';
        ctx.lineWidth = it.gr * 2;
        ctx.strokeStyle = it.glow;
        ctx.strokeText(s, lx, by);
      }
      if (it.shadow) {
        ctx.globalAlpha = op * 0.55;
        ctx.fillStyle = '#000000';
        ctx.fillText(s, lx + it.sd, by + it.sd * 1.3);
      }
      ctx.globalAlpha = op;
      ctx.fillStyle = it.fill;
      ctx.fillText(s, lx, by);
    }
  }

  function drawItem(ctx, it) {
    let op = it.reg ? it.reg.alpha * it.vis : it.op;
    if (!(op > 0.004)) return;
    if (op > 1) op = 1;
    ctx.globalAlpha = op;
    const c = it.coords;
    switch (it.kind) {
      case 'polygon':
        if (!tracePath(ctx, c, it.smooth, true)) return;
        if (it.fill) { ctx.fillStyle = it.fill; ctx.fill(); }
        if (it.outline && it.width > 0) {
          ctx.lineWidth = it.width; ctx.lineJoin = 'round'; ctx.strokeStyle = it.outline; ctx.stroke();
        }
        break;
      case 'line':
        if (!it.fill || !tracePath(ctx, c, it.smooth, false)) return;
        ctx.lineWidth = it.width;
        ctx.lineCap = it.cap;
        ctx.lineJoin = it.join;
        ctx.strokeStyle = it.fill;
        ctx.stroke();
        break;
      case 'oval':
      case 'arc': {
        const x1 = Math.min(c[0], c[2]), x2 = Math.max(c[0], c[2]);
        const y1 = Math.min(c[1], c[3]), y2 = Math.max(c[1], c[3]);
        const rx = (x2 - x1) / 2, ry = (y2 - y1) / 2;
        if (!(rx > 0 && ry > 0)) return;
        ctx.beginPath();
        if (it.kind === 'oval') {
          ctx.ellipse(x1 + rx, y1 + ry, rx, ry, 0, 0, Math.PI * 2);
          if (it.fill) { ctx.fillStyle = it.fill; ctx.fill(); }
          if (it.outline && it.width > 0) { ctx.lineWidth = it.width; ctx.strokeStyle = it.outline; ctx.stroke(); }
        } else {
          const a0 = -it.start * Math.PI / 180;
          const a1 = -(it.start + it.extent) * Math.PI / 180;
          ctx.ellipse(x1 + rx, y1 + ry, rx, ry, 0, a0, a1, true);
          ctx.lineWidth = it.width; ctx.lineCap = 'butt'; ctx.strokeStyle = it.outline; ctx.stroke();
        }
        break;
      }
      case 'rect': {
        const x1 = Math.min(c[0], c[2]), y1 = Math.min(c[1], c[3]);
        const w = Math.abs(c[2] - c[0]), h = Math.abs(c[3] - c[1]);
        if (it.fill) { ctx.fillStyle = it.fill; ctx.fillRect(x1, y1, w, h); }
        if (it.outline && it.width > 0) { ctx.lineWidth = it.width; ctx.strokeStyle = it.outline; ctx.strokeRect(x1, y1, w, h); }
        break;
      }
      case 'text':
        drawText(ctx, it, op);
        break;
      default:
        break;
    }
  }

  function moveCoords(c, dx, dy) {
    for (let i = 0; i < c.length; i += 2) { c[i] += dx; c[i + 1] += dy; }
  }
  function scaleCoords(c, cx, cy, kx, ky) {
    for (let i = 0; i < c.length; i += 2) { c[i] = cx + (c[i] - cx) * kx; c[i + 1] = cy + (c[i + 1] - cy) * ky; }
  }

  // ---------------------------------------------------------------------
  //  Animation helpers
  // ---------------------------------------------------------------------
  class Tween {
    constructor(start, dur, fn, done = null) { this.start = start; this.dur = dur; this.fn = fn; this.done = done; this.sid = null; }
    step(t) {
      if (t < this.start) return true;
      const p = this.dur <= 0 ? 1 : (t - this.start) / this.dur;
      if (p >= 1) {
        this.fn(1);
        if (this.done) this.done();
        return false;
      }
      this.fn(p);
      return true;
    }
  }

  class Loop {
    constructor(fn) { this.fn = fn; this.sid = null; }
    step(t) { return this.fn(t) !== false; }
  }

  // ---------------------------------------------------------------------
  //  Background: gradient sky and floating hearts
  // ---------------------------------------------------------------------
  class Background {
    constructor(app, top, bottom) {
      this.app = app;
      this.top = top;
      this.bottom = bottom;
      this.hearts = [];
      this.heartsTarget = 0;
      this.grad = null;
      this.last = app.realClock;
    }
    setGradient(top, bottom, dur = 2.0) {
      this.grad = [this.app.realClock, Math.max(0.01, dur), this.top, this.bottom, top, bottom];
    }
    spawn() {
      const { vw: W, vh: H, vu: U } = this.app;
      const s = U * uni(0.018, 0.05);
      const x0 = uni(0, W);
      this.hearts.push({
        x0, x: x0, y: H + s, s, vy: -H / uni(9.0, 16.0), amp: U * uni(0.01, 0.035), ph: uni(0, 6.3),
        fr: uni(0.6, 1.4), a: uni(0.18, 0.45), col: choice(['#ff4d79', '#ff8fab', '#ffb3c7', '#ff6b9a', '#ffd1dc']),
      });
    }
    step(t) {
      const dt = Math.min(0.05, t - this.last);
      this.last = t;
      if (this.grad) {
        const [t0, dur, a0, b0, a1, b1] = this.grad;
        const p = easeInOut((t - t0) / dur);
        this.top = mix(a0, a1, p);
        this.bottom = mix(b0, b1, p);
        if (p >= 1) this.grad = null;
      }
      if (this.hearts.length < this.heartsTarget && rand() < dt * 3.0) this.spawn();
      const keep = [];
      for (const h of this.hearts) {
        h.x = h.x0 + h.amp * Math.sin(h.ph + t * h.fr);
        h.y += h.vy * dt;
        if (h.y < -h.s) continue;
        keep.push(h);
      }
      this.hearts = keep;
    }
    draw(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, this.top);
      g.addColorStop(1, this.bottom);
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      for (const h of this.hearts) {
        ctx.globalAlpha = h.a;
        ctx.fillStyle = h.col;
        tracePath(ctx, heartPoints(h.x, h.y, h.s, HEART_SMALL), false, true);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  class PulseHeart {
    constructor(app, cx, cy, size, color, { glow = true, alpha = 1.0, gloss = true } = {}) {
      this.app = app;
      this.cx = cx; this.cy = cy; this.size = size; this.scale = 1;
      this.alive = true;
      this.parts = [];
      const layers = glow ? [[1.42, 0.08], [1.2, 0.18], [1.0, 1.0]] : [[1.0, 1.0]];
      let cover = 0;
      for (const [k, a] of layers) {
        // real transparency stacks; this keeps each ring the same strength as the original
        const target = a * alpha;
        const eff = target > cover ? (target - cover) / (1 - cover) : 0;
        cover = Math.max(cover, target);
        const it = app.create('polygon', [0, 0, 0, 0, 0, 0], { smooth: true, state: 'hidden' });
        app.reg(it, eff, { fill: color });
        this.parts.push([it, k]);
      }
      this.gloss = null;
      if (gloss) {
        this.gloss = app.create('oval', [0, 0, 1, 1], { state: 'hidden' });
        app.reg(this.gloss, alpha, { fill: mix(color, '#ffffff', 0.4) });
      }
      this.setScale(1);
    }
    get items() { return this.parts.map((p) => p[0]).concat(this.gloss ? [this.gloss] : []); }
    setScale(s) {
      this.scale = s;
      for (const [it, k] of this.parts) it.coords = heartPoints(this.cx, this.cy, this.size * k * s);
      if (this.gloss) {
        const z = this.size * s;
        const gx = this.cx - z * 0.22, gy = this.cy - z * 0.17;
        this.gloss.coords = [gx - z * 0.09, gy - z * 0.055, gx + z * 0.09, gy + z * 0.055];
      }
    }
    show(dur = 1.0, delay = 0) { this.app.fade(this.items, 1, dur, delay); }
    hide(dur = 0.5, delay = 0) { this.app.fade(this.items, 0, dur, delay, { del: true, done: () => { this.alive = false; } }); }
    pop(dur = 0.8, delay = 0, beat = true) {
      this.setScale(0.01);
      this.app.add(new Tween(this.app.now() + delay, dur, (p) => this.setScale(Math.max(0.01, easeBack(p))),
        beat ? () => this.beat() : null));
      this.app.fade(this.items, 1, dur * 0.6, delay);
    }
    beat(period = 1.1, amp = 0.10) {
      const t0 = this.app.now();
      this.app.add(new Loop((t) => {
        if (!this.alive) return false;
        const ph = ((t - t0) % period) / period;
        this.setScale(1 + amp * (Math.exp(-(((ph - 0.10) / 0.06) ** 2)) + 0.6 * Math.exp(-(((ph - 0.32) / 0.06) ** 2))));
        return true;
      }));
    }
    grow(newSize, dur = 1.2) {
      const s0 = this.size;
      this.app.add(new Tween(this.app.now(), dur, (p) => {
        this.size = s0 + (newSize - s0) * easeInOut(p);
        this.setScale(this.scale);
      }));
    }
  }

  class Burst {
    constructor(app, x, y, { n = 40, size = null, speed = null, life = 1.6, colors = PINKS, behind = false } = {}) {
      this.app = app;
      const U = app.U;
      size = size || U * 0.028;
      speed = speed || U * 0.55;
      this.life = life;
      this.g = U * 0.3;
      this.parts = [];
      for (let i = 0; i < n; i++) {
        const a = uni(0, 2 * Math.PI);
        const sp = speed * uni(0.35, 1.0);
        const col = choice(colors);
        const it = app.create('polygon', heartPoints(x, y, size * uni(0.5, 1.25), HEART_SMALL), { fill: col });
        if (behind) app.toBack(it);
        this.parts.push({ it, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - speed * 0.25 });
      }
      this.t0 = this.last = app.now();
      app.add(this);
    }
    step(t) {
      const dt = Math.min(0.05 * this.app.rate, t - this.last);
      this.last = t;
      const age = (t - this.t0) / this.life;
      if (age >= 1) { for (const p of this.parts) p.it.dead = true; return false; }
      const fade = (1 - age * age) * this.app.sceneAlpha;
      for (const p of this.parts) {
        p.vy += this.g * dt;
        p.vx *= (1 - 0.8 * dt);
        moveCoords(p.it.coords, p.vx * dt, p.vy * dt);
        p.it.op = fade;
      }
      return true;
    }
  }

  class Firework {
    constructor(app, x, y, n = 40) {
      this.app = app;
      const U = app.U;
      const cols = choice(FIREWORK_SETS);
      const speed = U * uni(0.26, 0.40);
      const r = Math.max(2, U * 0.0032);
      this.parts = [];
      for (let i = 0; i < n; i++) {
        const a = 2 * Math.PI * i / n + uni(-0.06, 0.06);
        const sp = speed * uni(0.7, 1.0);
        const it = app.create('oval', [x - r, y - r, x + r, y + r], { fill: choice(cols) });
        app.toBack(it);
        this.parts.push({ it, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
      }
      this.t0 = this.last = app.now();
      this.life = 1.6;
      app.add(this);
    }
    step(t) {
      const dt = Math.min(0.05 * this.app.rate, t - this.last);
      this.last = t;
      const age = (t - this.t0) / this.life;
      if (age >= 1) { for (const p of this.parts) p.it.dead = true; return false; }
      const g = this.app.U * 0.22;
      const fade = (1 - age) ** 1.5 * this.app.sceneAlpha;
      for (const p of this.parts) {
        p.vy += g * dt;
        p.vx *= (1 - 1.2 * dt);
        p.vy *= (1 - 1.2 * dt);
        moveCoords(p.it.coords, p.vx * dt, p.vy * dt);
        p.it.op = fade;
      }
      return true;
    }
  }

  class Confetti {
    constructor(app, n = 34) {
      this.app = app;
      this.ps = [];
      for (let i = 0; i < n; i++) this.ps.push(this.fresh(uni(-app.H, 0)));
      this.last = app.now();
      app.add(this);
    }
    fresh(y, it = null) {
      const app = this.app;
      const w = app.U * uni(0.006, 0.011);
      const col = choice(CONFETTI_COLORS);
      if (!it) { it = app.create('polygon', [0, 0, 0, 0, 0, 0], { fill: col }); app.toBack(it); } else it.fill = col;
      return {
        it, x0: uni(0, app.W), y, w, h: w * uni(1.6, 2.4), a: uni(0, 6.3), va: uni(-4, 4),
        vy: app.H * uni(0.10, 0.22), ph: uni(0, 6.3),
      };
    }
    step(t) {
      const { H, U } = this.app;
      const dt = Math.min(0.05 * this.app.rate, t - this.last);
      this.last = t;
      for (const d of this.ps) {
        d.y += d.vy * dt;
        d.a += d.va * dt;
        const x = d.x0 + Math.sin(d.ph + t * 1.7) * U * 0.02;
        const ca = Math.cos(d.a), sa = Math.sin(d.a);
        const hw = d.w / 2;
        const hh = d.h / 2 * Math.abs(Math.cos(d.a * 0.7)) + 0.5;
        const pts = [];
        for (const [px, py] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) pts.push(x + px * ca - py * sa, d.y + px * sa + py * ca);
        d.it.coords = pts;
        if (d.y > H + 20) Object.assign(d, this.fresh(-20, d.it));
      }
      return true;
    }
  }

  // Little hearts rising and fading (used above the hugging couple).
  class Rising {
    constructor(app, x, y, spread, { rate = 2.5, delay = 0 } = {}) {
      this.app = app;
      this.x = x; this.y = y; this.spread = spread; this.rate = rate;
      this.size = app.U * 0.026;
      this.parts = [];
      this.tStart = app.now() + delay;
      this.acc = 0;
      this.last = app.now();
      app.add(this);
    }
    step(t) {
      const U = this.app.U;
      const dt = Math.min(0.05 * this.app.rate, t - this.last);
      this.last = t;
      if (t >= this.tStart) {
        this.acc += dt * this.rate;
        while (this.acc >= 1) {
          this.acc -= 1;
          const x = this.x + uni(-this.spread, this.spread);
          const col = choice(PINKS);
          const it = this.app.create('polygon', heartPoints(x, this.y, this.size * uni(0.6, 1.2), HEART_SMALL), { fill: col });
          this.parts.push({ it, ox: x, x, y: this.y, born: t, ph: uni(0, 6.3) });
        }
      }
      const keep = [];
      for (const p of this.parts) {
        const age = (t - p.born) / 2.3;
        if (age >= 1) { p.it.dead = true; continue; }
        const ny = this.y - age * U * 0.13;
        const nx = p.ox + Math.sin(p.ph + age * 6.0) * U * 0.012;
        moveCoords(p.it.coords, nx - p.x, ny - p.y);
        p.x = nx; p.y = ny;
        p.it.op = (1 - age) * this.app.sceneAlpha;
        keep.push(p);
      }
      this.parts = keep;
      return true;
    }
  }

  // Musical notes floating upward (song scene).
  class NoteRain {
    constructor(app, rate = 2.2) {
      this.app = app;
      this.rate = rate;
      this.notes = [];
      this.acc = 0;
      this.last = app.now();
      app.add(this);
    }
    spawn() {
      const app = this.app;
      const { W, H, U } = app;
      // only in the side margins so the notes never cover the lyrics
      // (phones have almost no margin, so there the notes are smaller, single and at the very edges)
      const x = app.P
        ? (rand() < 0.5 ? uni(W * 0.02, W * 0.035) : uni(W * 0.94, W * 0.96))
        : (rand() < 0.5 ? uni(W * 0.03, W * 0.19) : uni(W * 0.78, W * 0.94));
      const y = H * 1.03;
      const s = U * uni(0.022, 0.04) * (app.P ? 0.7 : 1);
      const col = choice(['#ffd479', '#ff8fab', '#c9b6ff', '#ffffff']);
      const dbl = !app.P && rand() < 0.4;
      const heads = [[x, y]].concat(dbl ? [[x + s * 1.3, y - s * 0.35]] : []);
      const items = [];
      for (const [hx, hy] of heads) {
        items.push(app.create('oval', [hx - s * 0.55, hy - s * 0.4, hx + s * 0.55, hy + s * 0.4], { fill: col, op: 0 }));
        items.push(app.create('line', [hx + s * 0.5, hy, hx + s * 0.5, hy - s * 2.0], { fill: col, width: Math.max(1.5, s * 0.12), op: 0 }));
      }
      if (dbl) {
        items.push(app.create('line', [x + s * 0.5, y - s * 2.0, x + s * 1.8, y - s * 2.35], { fill: col, width: Math.max(2.0, s * 0.3), op: 0 }));
      } else {
        items.push(app.create('line', [x + s * 0.5, y - s * 2.0, x + s * 1.1, y - s * 1.5, x + s * 0.9, y - s * 1.0],
          { fill: col, width: Math.max(1.5, s * 0.14), smooth: true, op: 0 }));
      }
      for (const it of items) app.toBack(it);
      this.notes.push({ items, x0: x, x, y, vy: -H / uni(5.5, 8.5), ph: uni(0, 6.3), a: uni(0.45, 0.8) });
    }
    step(t) {
      const { H, U } = this.app;
      const dt = Math.min(0.05 * this.app.rate, t - this.last);
      this.last = t;
      if (this.app.sceneAlpha > 0.99) {
        this.acc += dt * this.rate;
        while (this.acc >= 1) { this.acc -= 1; this.spawn(); }
      }
      const keep = [];
      for (const n of this.notes) {
        const dy = n.vy * dt;
        const nx = n.x0 + Math.sin(n.ph + t * 1.3) * U * 0.02;
        const dx = nx - n.x;
        n.x = nx;
        n.y += dy;
        if (n.y < -H * 0.1) { for (const it of n.items) it.dead = true; continue; }
        const a = n.a * clamp(n.y / (H * 0.25)) * this.app.sceneAlpha;
        for (const it of n.items) { moveCoords(it.coords, dx, dy); it.op = a; }
        keep.push(n);
      }
      this.notes = keep;
      return true;
    }
  }

  // Soft animated sound waves along the bottom (song scene).
  class SoundWave {
    constructor(app) {
      this.app = app;
      const { W, H, U } = app;
      this.base = H * 0.91;
      this.lines = [];
      [['#ff8fab', 0.55], ['#ffd479', 0.4], ['#c9b6ff', 0.45]].forEach(([col, a], k) => {
        const it = app.create('line', [0, 0, 1, 1], { smooth: true, width: Math.max(2.0, U * 0.003), fill: col, op: 0 });
        app.toBack(it);
        this.lines.push([it, a, k]);
      });
      this.xs = [];
      for (let i = 0; i <= 60; i++) this.xs.push(W * i / 60);
      this.t0 = app.now();
      app.add(this);
    }
    step(t) {
      const U = this.app.U;
      const fade = clamp((t - this.t0) / 2.0) * this.app.sceneAlpha;
      for (const [it, a, k] of this.lines) {
        const amp = U * 0.03 * (0.6 + 0.4 * Math.sin(t * 1.7 + k));
        const pts = [];
        for (let i = 0; i < this.xs.length; i++) {
          const env = Math.sin(Math.PI * i / 60);
          pts.push(this.xs[i], this.base + amp * env * Math.sin(i * 0.35 + t * (2.2 + k * 0.6) + k * 1.7));
        }
        it.coords = pts;
        it.op = a * fade;
      }
      return true;
    }
  }

  const PETAL = [[0, -1], [0.55, -0.45], [0.6, 0.2], [0.3, 0.75], [0, 1], [-0.3, 0.75], [-0.6, 0.2], [-0.55, -0.45]];

  // Rose petals falling and turning (poem scene).
  class Petals {
    constructor(app, n = 16) {
      this.app = app;
      this.ps = [];
      for (let i = 0; i < n; i++) this.ps.push(this.fresh(uni(-app.H, 0)));
      this.last = this.t0 = app.now();
      app.add(this);
    }
    fresh(y, it = null) {
      const app = this.app;
      if (!it) { it = app.create('polygon', [0, 0, 0, 0, 0, 0], { smooth: true, op: 0 }); app.toBack(it); }
      const col = choice(['#ff8fab', '#ffb3c7', '#ff6b9a', '#ffd1dc']);
      it.fill = col;
      return {
        it, x0: uni(0, app.W), y, s: app.U * uni(0.012, 0.022), a: uni(0, 6.3), va: uni(-1.5, 1.5),
        vy: app.H / uni(7, 12), ph: uni(0, 6.3), al: uni(0.45, 0.8),
      };
    }
    step(t) {
      const { H, U } = this.app;
      const dt = Math.min(0.05 * this.app.rate, t - this.last);
      this.last = t;
      const fade = clamp((t - this.t0) / 1.5) * this.app.sceneAlpha;
      for (const d of this.ps) {
        d.y += d.vy * dt;
        d.a += d.va * dt;
        const x = d.x0 + Math.sin(d.ph + t * 0.9) * U * 0.04;
        const ca = Math.cos(d.a), sa = Math.sin(d.a), s = d.s;
        const pts = [];
        for (const [px0, py0] of PETAL) {
          const px = px0 * s * 0.7, py = py0 * s;
          pts.push(x + px * ca - py * sa, d.y + px * sa + py * ca);
        }
        d.it.coords = pts;
        d.it.op = d.al * fade;
        if (d.y > H + s * 2) Object.assign(d, this.fresh(-s * 2, d.it));
      }
      return true;
    }
  }

  // Hundreds of glowing dots flying together to form a big heart.
  class HeartForm {
    constructor(app, cx, cy, size) {
      this.app = app;
      const { W, H } = app;
      const uh = size / 0.62;
      this.cx = cx; this.cy = cy;
      const targets = [];
      for (const [x, y] of makeHeart(110)) targets.push([cx + x * size, cy + y * size, 'o']);
      for (const [x, y] of makeHeart(70)) targets.push([cx + x * size * 0.9, cy + y * size * 0.9, 'o']);
      for (let i = 0; i < 45; i++) {
        const [hx, hy] = choice(HEART_BIG);
        const r = Math.sqrt(rand()) * 0.8;
        targets.push([cx + hx * size * r, cy + hy * size * r, 'f']);
      }
      this.ps = [];
      for (const [tx, ty, kind] of targets) {
        const sx = uni(0, W), sy = uni(0, H);
        let r, col;
        if (kind === 'o') {
          r = uh * uni(0.0045, 0.0075);
          col = choice(['#ff4d79', '#ff2d5f', '#ff8fab', '#ffb3c7', '#ffd1dc']);
        } else {
          r = uh * uni(0.003, 0.005);
          col = choice(['#a3123a', '#c2185b', '#ff4d79']);
        }
        const it = app.create('oval', [sx - r, sy - r, sx + r, sy + r], {});
        app.reg(it, 1, { fill: col });
        app.setVis(it, 1);
        this.ps.push({ it, sx, sy, tx, ty, r, dl: uni(0, 1) });
      }
      this.t0 = app.now();
      this.dur = 2.4;
      this.formed = false;
      this.fPrev = 1;
      this.flash = [];
      this.last = app.now();
      app.add(this);
    }
    step(t) {
      const app = this.app;
      const dt = Math.max(0, t - this.last);
      this.last = t;
      if (!this.formed) {
        let done = true;
        for (const p of this.ps) {
          const q = (t - this.t0 - p.dl) / this.dur;
          if (q < 1) done = false;
          const e = easeInOut(q);
          const x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e;
          p.it.coords = [x - p.r, y - p.r, x + p.r, y + p.r];
        }
        if (done) { this.formed = true; this.tf = t; }
        return true;
      }
      const f = 1 + 0.035 * Math.sin((t - this.tf) * 2 * Math.PI / 1.4);
      const k = f / this.fPrev;
      this.fPrev = f;
      for (const p of this.ps) scaleCoords(p.it.coords, this.cx, this.cy, k, k);
      if (app.sceneAlpha > 0.99 && rand() < 0.5 * Math.min(2, dt * 60)) {
        const p = choice(this.ps);
        p.it.fill = '#ffffff';
        this.flash.push([t + 0.15, p.it]);
      }
      this.flash = this.flash.filter(([when, it]) => {
        if (t >= when) { app.setVis(it, it.vis); return false; }
        return true;
      });
      return true;
    }
  }

  class Typewriter {
    constructor(app, item, text, cps, font, x, caret = null, done = null) {
      this.app = app; this.item = item; this.cps = cps; this.font = font; this.x = x;
      this.cl = clusters(text);
      this.caret = caret; this.done = done;
      this.t0 = app.now();
      this.n = 0;
      app.add(this);
    }
    step(t) {
      const n = Math.min(this.cl.length, Math.floor((t - this.t0) * this.cps) + 1);
      if (n !== this.n) {
        this.n = n;
        const s = this.cl.slice(0, n).join('');
        this.item.lines = [s];
        if (this.caret) {
          const xe = this.x + this.font.measure(s) + 3;
          const cs = this.caret.coords;
          this.caret.coords = [xe, cs[1], xe, cs[3]];
        }
      }
      if (n >= this.cl.length) {
        if (this.done) this.done();
        return false;
      }
      return true;
    }
  }

  // ---------------------------------------------------------------------
  //  Cartoon couple for the hug
  // ---------------------------------------------------------------------
  const SKIN = '#f4c38f', SKIN_EDGE = '#d79a5f', HAIR = '#2b1b14';
  const BOY_HAIR = [[-16.5, -62], [-16, -70], [-11, -76], [-3, -79], [6, -78.5], [13, -75], [16.5, -68],
    [16.8, -61], [12, -67], [5, -70], [-3, -69], [-10, -66.5], [-14, -61]];
  const GIRL_HAIR = [[-17, -60], [-16, -71], [-10, -77.5], [0, -79.5], [10, -77.5], [16, -71], [17, -60],
    [13, -66], [6, -69.5], [-1, -70], [-8, -68.5], [-13, -65]];
  const GIRL_HAIR_BACK = [[-18.5, -63], [-17.5, -74], [-9, -80.5], [9, -80.5], [17.5, -74], [18.5, -63],
    [19.5, -48], [15, -41], [-15, -41], [-19.5, -48]];
  const BOY_BODY = [[-11, -45], [11, -45], [13.5, -33], [12.5, -14], [-12.5, -14], [-13.5, -33]];
  const GIRL_BODY = [[-9, -45], [9, -45], [11, -33], [18, -13], [-18, -13], [-11, -33]];

  class Buddy {
    constructor(app, x, ground, unit, kind) {
      this.app = app;
      this.x = x; this.g = ground; this.k = unit; this.kind = kind;
      this.d = kind === 'boy' ? 1 : -1; // direction of the partner
      this.hug = 0; this.lean = 0; this.bob = 0;
      this.it = {};
      if (kind === 'boy') { this.cloth = '#3b7ddd'; this.clothEdge = '#2a5fb0'; this.leg = '#2b3557'; }
      else { this.cloth = '#ff4f86'; this.clothEdge = '#d93468'; this.leg = SKIN; }
    }
    P(lx, ly) { return [this.x + lx * this.k, this.g + (ly + this.bob) * this.k]; }
    pts(lst, dx = 0) { const out = []; for (const [x, y] of lst) out.push(...this.P(x + dx, y)); return out; }
    make(layer) {
      const app = this.app, k = this.k, boy = this.kind === 'boy';
      const mk = (kind, coords, o) => app.create(kind, coords, Object.assign({ tags: ['buddy'] }, o));
      const it = this.it;
      if (layer === 'back' && !boy) {
        it.hairback = mk('polygon', [0, 0, 0, 0, 0, 0], { smooth: true, fill: HAIR });
      } else if (layer === 'body') {
        for (const nm of ['legL', 'legR']) it[nm] = mk('line', [0, 0, 1, 1], { width: Math.max(2, (boy ? 4.5 : 3.2) * k), fill: this.leg, capstyle: 'round' });
        it.body = mk('polygon', [0, 0, 0, 0, 0, 0], { smooth: true, fill: this.cloth, outline: this.clothEdge, width: 2 });
      } else if (layer === 'arms') {
        for (const nm of ['armO', 'armI']) it[nm] = mk('line', [0, 0, 1, 1, 2, 2], { smooth: true, width: Math.max(3, 4.2 * k), fill: this.cloth, capstyle: 'round', joinstyle: 'round' });
        for (const nm of ['handO', 'handI']) it[nm] = mk('oval', [0, 0, 1, 1], { fill: SKIN, outline: SKIN_EDGE });
      } else if (layer === 'head') {
        it.head = mk('oval', [0, 0, 1, 1], { fill: SKIN, outline: SKIN_EDGE, width: 2 });
        it.hair = mk('polygon', [0, 0, 0, 0, 0, 0], { smooth: true, fill: HAIR });
        if (!boy) it.flower = mk('oval', [0, 0, 1, 1], { fill: '#ff8fb8', outline: '#ff5c8a', width: 2 });
      } else if (layer === 'face') {
        for (const nm of ['eyeL', 'eyeR']) it[nm] = mk('oval', [0, 0, 1, 1], { fill: '#2a1a12' });
        for (const nm of ['happyL', 'happyR']) it[nm] = mk('arc', [0, 0, 1, 1], { start: 0, extent: 180, outline: '#2a1a12', width: Math.max(2, 1.6 * k), state: 'hidden' });
        for (const nm of ['blushL', 'blushR']) it[nm] = mk('oval', [0, 0, 1, 1], { fill: '#ff8fa3', state: 'hidden' });
        it.mouth = mk('arc', [0, 0, 1, 1], { start: 200, extent: 140, outline: '#8a2a2a', width: Math.max(2, 1.4 * k) });
      }
      this.layout();
    }
    setHappy() {
      for (const nm of ['eyeL', 'eyeR']) this.it[nm].hidden = true;
      for (const nm of ['happyL', 'happyR', 'blushL', 'blushR']) this.it[nm].hidden = false;
    }
    layout() {
      const it = this.it, d = this.d, k = this.k;
      const L = this.lean * d;
      const h = easeInOut(this.hug);
      if (it.hairback) it.hairback.coords = this.pts(GIRL_HAIR_BACK, L);
      if (it.body) {
        const sx = this.kind === 'boy' ? 4.5 : 4.0;
        it.legL.coords = this.P(-sx, -15).concat(this.P(-sx, -1));
        it.legR.coords = this.P(sx, -15).concat(this.P(sx, -1));
        it.body.coords = this.pts(this.kind === 'boy' ? BOY_BODY : GIRL_BODY);
      }
      if (it.armO) {
        const restO = [[-d * 9, -42], [-d * 14, -31], [-d * 15, -21]];
        const hugO = [[-d * 9, -42], [-d * 2, -27], [d * 20, -31]];
        const restI = [[d * 9, -42], [d * 14, -31], [d * 15, -21]];
        const hugI = [[d * 9, -42], [d * 25, -47], [d * 40, -37]];
        for (const [nm, hn, a, b] of [['armO', 'handO', restO, hugO], ['armI', 'handI', restI, hugI]]) {
          const pp = [0, 1, 2].map((i) => [a[i][0] + (b[i][0] - a[i][0]) * h, a[i][1] + (b[i][1] - a[i][1]) * h]);
          it[nm].coords = this.pts(pp);
          const [hx, hy] = this.P(pp[2][0], pp[2][1]);
          const r = 3.0 * k;
          it[hn].coords = [hx - r, hy - r, hx + r, hy + r];
        }
      }
      if (it.head) {
        const [hx, hy] = this.P(L, -61);
        const r = 16.5 * k;
        it.head.coords = [hx - r, hy - r, hx + r, hy + r];
        it.hair.coords = this.pts(this.kind === 'boy' ? BOY_HAIR : GIRL_HAIR, L);
        if (it.flower) {
          const [fx, fy] = this.P(L + 12.5, -74);
          const fr = 3.2 * k;
          it.flower.coords = [fx - fr, fy - fr, fx + fr, fy + fr];
        }
      }
      if (it.eyeL) {
        for (const [side, en, hn, bn] of [[-1, 'eyeL', 'happyL', 'blushL'], [1, 'eyeR', 'happyR', 'blushR']]) {
          const [ex, ey] = this.P(L + side * 5.5, -61);
          const r = 2.1 * k;
          it[en].coords = [ex - r, ey - r * 1.15, ex + r, ey + r * 1.15];
          it[hn].coords = [ex - 3 * k, ey - 2.2 * k, ex + 3 * k, ey + 2.8 * k];
          const [bx, by] = this.P(L + side * 10.5, -55.5);
          it[bn].coords = [bx - 3.4 * k, by - 2 * k, bx + 3.4 * k, by + 2 * k];
        }
        const [mx, my] = this.P(L, -54.5);
        it.mouth.coords = [mx - 4.5 * k, my - 3.5 * k, mx + 4.5 * k, my + 3.5 * k];
      }
    }
  }

  const inside = (x, y, ctr, w, h, pad = 0) => Math.abs(x - ctr[0]) <= w / 2 + pad && Math.abs(y - ctr[1]) <= h / 2 + pad;

  // ---------------------------------------------------------------------
  //  The show
  // ---------------------------------------------------------------------
  const SCENE_NAMES = ['start', 'intro', 'names', 'book', 'song', 'poem', 'heart', 'letter', 'question', 'celebrate'];

  class App {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.items = [];
      this.actors = [];
      this.pending = [];
      this.timers = [];
      this.sceneId = 0;
      this.sceneAlpha = 1;
      this.clock = 0;
      this.realClock = 0;
      this.fonts = new Map();
      this.state = 'start';
      this.buttonsReady = false;
      this.finishing = false;
      this.back = null;
      this.bn = BN_FAMILY;
      this.en = EN_FAMILY;
      this.speedSel = 1;
      this.sceneName = '';
      this.paused = false;
      this.lastTs = null;
      this.view = { s: 1, ox: 0, oy: 0 };
      this.dprCap = 2;
      this.wantDpr = 0;
      this.measure();
      this.setStage();
      this.bg = new Background(this, '#12001f', '#3a0030');
      this.music = new Music(PLAY_MUSIC);
      this.scenes = [this.sceneStart, this.sceneIntro, this.sceneNames, this.sceneBook, this.sceneSong,
        this.scenePoem, this.sceneHeart, this.sceneLetter, this.sceneQuestion, this.sceneCelebrate];
      this.scenePos = -1;
      if (HER) document.title = HER;
      if (TEST_MODE) this.ntfyPanel = new NtfyPanel();
      this.setupSpeedUI();
      this.bindInput();
      this.frame = this.frame.bind(this);
      requestAnimationFrame(this.frame);
    }

    // ---------- size ----------
    measure() {
      this.vw = Math.max(1, window.innerWidth);
      this.vh = Math.max(1, window.innerHeight);
      this.vu = this.vw < this.vh ? Math.min(this.vh * 0.88, this.vw * 1.5) : this.vh;
      this.dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
      const c = this.canvas;
      c.width = Math.round(this.vw * this.dpr);
      c.height = Math.round(this.vh * this.dpr);
      c.style.width = this.vw + 'px';
      c.style.height = this.vh + 'px';
    }
    setStage() {
      this.W = this.vw;
      this.H = this.vh;
      this.P = this.W < this.H;          // portrait phone layout
      this.U = this.vu;                  // size unit: screen height on landscape screens
    }
    onResize() {
      this.measure();
      clearTimeout(this.resizeT);
      this.resizeT = setTimeout(() => {
        const nowP = this.vw < this.vh;
        if (nowP !== this.P && this.scenePos >= 0 && !this.finishing && this.scenePos < this.scenes.length) {
          this.scenePos -= 1;          // rotated: replay this scene in the new layout
          this.nextScene();
        }
      }, 350);
    }

    // ---------- engine ----------
    get rate() { return SPEED_SCENES.includes(this.sceneName) ? this.speedSel : 1; }
    now() { return this.clock; }
    add(actor) { actor.sid = this.sceneId; this.pending.push(actor); return actor; }
    at(delay, fn, ...args) { this.timers.push({ when: this.clock + delay, sid: this.sceneId, fn, args }); }

    frame(ts) {
      const real = ts / 1000;
      const gap = this.lastTs === null ? 0 : real - this.lastTs;
      this.lastTs = real;
      const dt = gap > 0.1 ? 0.1 : gap < 0 ? 0 : gap;
      if (this.wantDpr) { this.dprCap = this.wantDpr; this.wantDpr = 0; this.measure(); }
      const t0 = performance.now();
      if (!this.paused) this.advance(dt);
      this.render();
      this.watchSpeed(t0, gap);
      requestAnimationFrame(this.frame);
    }

    // Safety net for slow phones: if frames drop because drawing is too heavy for the phone,
    // draw with fewer pixels (sharpness 2x, then 1.5x, then 1x). Fast phones never trigger it.
    watchSpeed(t0, gap) {
      if (this.paused || this.dpr <= 1 || document.hidden || !(gap > 0) || gap > 0.25) return;
      if (!this.probe) {
        if (typeof MessageChannel === 'undefined') return;
        this.probe = new MessageChannel();
        this.samples = [];
        this.probe.port1.onmessage = (e) => {
          // time from the start of the frame until the browser finished drawing it
          this.samples.push([e.data.gap * 1000, performance.now() - e.data.t0]);
          if (this.samples.length < 45) return;
          const median = (i) => this.samples.map((s) => s[i]).sort((a, b) => a - b)[this.samples.length >> 1];
          const interval = median(0), work = median(1);
          this.samples = [];
          if (interval > 21 && work > 12 && this.dpr > 1) this.wantDpr = this.dpr > 1.5 ? 1.5 : 1;
        };
      }
      this.probe.port2.postMessage({ t0, gap });
    }

    advance(dt) {
      this.realClock += dt;
      this.clock += dt * this.rate;
      this.bg.step(this.realClock);
      this.tick();
    }

    tick() {
      const t = this.clock;
      if (this.pending.length) {
        for (const a of this.pending) if (a.sid === this.sceneId) this.actors.push(a);
        this.pending = [];
      }
      if (this.timers.length) {
        const due = this.timers.filter((x) => x.when <= t);
        if (due.length) {
          this.timers = this.timers.filter((x) => x.when > t);
          due.sort((a, b) => a.when - b.when);
          for (const d of due) {
            if (d.sid !== this.sceneId) continue;
            try { d.fn(...d.args); } catch (e) { console.error(e); }
          }
        }
      }
      const keep = [];
      for (const a of this.actors) {
        if (a.sid !== this.sceneId) continue;
        let ok;
        try { ok = a.step(t); } catch (e) { console.error(e); ok = false; }
        if (ok && a.sid === this.sceneId) keep.push(a);
      }
      this.actors = keep;
    }

    render() {
      const ctx = this.ctx, dpr = this.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.bg.draw(ctx, this.vw, this.vh);
      const s = Math.min(this.vw / this.W, this.vh / this.H);
      const ox = (this.vw - this.W * s) / 2, oy = (this.vh - this.H * s) / 2;
      this.view = { s, ox, oy };
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      let dead = 0;
      for (const it of this.items) {
        if (it.dead) { dead++; continue; }
        if (!it.hidden) drawItem(ctx, it);
      }
      if (dead > 64) this.items = this.items.filter((it) => !it.dead);
      ctx.globalAlpha = 1;
    }

    clearScene() {
      this.sceneId += 1;
      this.timers = [];
      this.pending = [];
      this.items = [];
      this.sceneAlpha = 1;
      this.finishing = false;
      this.setStage();
      this.back = this.create('marker', [0, 0], { state: 'hidden' });
    }

    nextScene() {
      this.clearScene();
      this.scenePos += 1;
      if (this.scenePos < this.scenes.length) {
        this.sceneName = SCENE_NAMES[this.scenePos];
        this.updateSpeedUI(SPEED_SCENES.includes(this.sceneName));
        this.scenes[this.scenePos].call(this);
      }
    }

    finish(at, fade = 1.2) {
      this.at(at, () => {
        this.finishing = true;
        const next = SCENE_NAMES[this.scenePos + 1];
        if (!SPEED_SCENES.includes(next)) this.updateSpeedUI(false);
        this.add(new Tween(this.now(), fade, (p) => { this.sceneAlpha = 1 - p; }));
        this.fade(this.items.filter((it) => it.reg && !it.dead), 0, fade, 0, { done: () => this.nextScene() });
      });
    }

    // ---------- canvas items ----------
    create(kind, coords, o = {}) {
      const it = new Item(kind, coords, o);
      this.items.push(it);
      return it;
    }
    toBack(it) {
      // like Tk "tag_raise(item, back)": put the item just above the scene's bottom marker
      const i = this.items.indexOf(it);
      if (i >= 0) this.items.splice(i, 1);
      const m = this.items.indexOf(this.back);
      this.items.splice(m + 1, 0, it);
    }
    move(it, dx, dy) { moveCoords(it.coords, dx, dy); }
    moveTag(tag, dx, dy) {
      for (const it of this.items) if (!it.dead && it.tags && it.tags.includes(tag)) moveCoords(it.coords, dx, dy);
    }
    tag(items, name) { for (const it of items) it.tags = (it.tags || []).concat([name]); }

    // ---------- fading (registered items have an opacity "vis" from 0 to 1) ----------
    reg(item, alpha = 1, colors = {}) {
      item.reg = { alpha, colors };
      Object.assign(item, colors);
      item.vis = 0;
      return item;
    }
    setVis(item, v) {
      if (!item.reg || item.dead) return;
      Object.assign(item, item.reg.colors);
      item.vis = v;
    }
    retarget(item, colors) {
      if (item.reg && !item.dead) {
        item.reg.colors = colors;
        Object.assign(item, colors);
      }
    }
    fade(items, to = 1, dur = 1, delay = 0, { del = false, done = null, ease = easeInOut } = {}) {
      items = items.filter(Boolean);
      let start = null;
      const fn = (p) => {
        if (!start) {
          start = new Map();
          for (const it of items) {
            start.set(it, it.vis || 0);
            if (to > 0) it.hidden = false;
          }
        }
        const e = ease(p);
        for (const it of items) {
          if (it.reg && !it.dead) {
            const v0 = start.get(it);
            this.setVis(it, v0 + (to - v0) * e);
          }
        }
      };
      const fin = () => {
        if (del) for (const it of items) it.dead = true;
        if (done) done();
      };
      this.add(new Tween(this.now() + delay, dur, fn, fin));
    }
    show(items, delay = 0, fin = 1, life = null, fout = 0.8) {
      this.fade(items, 1, fin, delay);
      if (life !== null) this.fade(items, 0, fout, delay + fin + life, { del: true });
    }
    slide(items, dx, dy, dur, delay = 0, ease = easeOut) {
      let last = 0;
      this.add(new Tween(this.now() + delay, dur, (p) => {
        const e = ease(p);
        const d = e - last;
        last = e;
        for (const it of items) this.move(it, dx * d, dy * d);
      }));
    }

    // ---------- text ----------
    font(frac, weight = 'normal', family = null) {
      const px = Math.max(10, Math.round(this.U * frac));
      const fam = family || this.bn;
      const key = fam + '|' + px + '|' + weight;
      let f = this.fonts.get(key);
      if (!f) { f = new Font(px, weight, fam); this.fonts.set(key, f); }
      return f;
    }
    fit(lines, frac, maxW, weight = 'normal', family = null) {
      if (!Array.isArray(lines)) lines = [lines];
      for (;;) {
        const f = this.font(frac, weight, family);
        if (frac <= 0.014 || Math.max(...lines.map((s) => f.measure(s))) <= maxW) return f;
        frac *= 0.94;
      }
    }
    // Landscape: exactly fit(). Portrait phones: break a long line in two instead of making it tiny.
    wrapFit(text, frac, maxW, weight = 'normal', family = null, minRatio = 0.8) {
      const f1 = this.fit(text, frac, maxW, weight, family);
      if (!this.P) return { font: f1, lines: [text] };
      const want = this.font(frac, weight, family);
      const overflow = f1.measure(text) > maxW;
      if (!overflow && f1.px >= want.px * minRatio) return { font: f1, lines: [text] };
      const parts = splitBalanced(text, want);
      if (!parts) return { font: f1, lines: [text] };
      const f2 = this.fit(parts, frac, maxW, weight, family);
      return (overflow || f2.px > f1.px * 1.1) ? { font: f2, lines: parts } : { font: f1, lines: [text] };
    }
    wrapGroup(lines, frac, maxW, weight = 'normal', family = null, minRatio = 0.8) {
      const f1 = this.fit(lines, frac, maxW, weight, family);
      const single = lines.map((s) => [s]);
      if (!this.P) return { font: f1, rows: single };
      const want = this.font(frac, weight, family);
      const overflow = lines.some((s) => f1.measure(s) > maxW);
      if (!overflow && f1.px >= want.px * minRatio) return { font: f1, rows: single };
      const rows = lines.map((s) => (want.measure(s) > maxW ? (splitBalanced(s, want) || [s]) : [s]));
      const f2 = this.fit([].concat(...rows), frac, maxW, weight, family);
      return (overflow || f2.px > f1.px * 1.1) ? { font: f2, rows } : { font: f1, rows: single };
    }
    blockH(font, rows, rowGap = 0.96) { return font.linespace * (1 + (rows - 1) * rowGap); }

    txt(x, y, s, font, color, { anchor = 'center', glow = null, shadow = true } = {}) {
      const lines = Array.isArray(s) ? s : [s];
      const it = this.create('text', [x, y], {
        state: 'hidden', lines, font, anchor, glow, shadow,
        gr: Math.max(1.5, this.U * 0.0022), sd: Math.max(1.0, this.U * 0.0018), rowGap: 0.96,
      });
      this.reg(it, 1, { fill: color });
      return [it];
    }
    polyItem(pts, color, alpha = 1, smooth = true) {
      const it = this.create('polygon', pts, { smooth, state: 'hidden' });
      this.reg(it, alpha, { fill: color });
      return it;
    }

    // ---------- input ----------
    toStage(e) {
      const r = this.canvas.getBoundingClientRect();
      const { s, ox, oy } = this.view;
      return [(e.clientX - r.left - ox) / s, (e.clientY - r.top - oy) / s];
    }
    bindInput() {
      const c = this.canvas;
      c.addEventListener('click', () => { if (this.state === 'start') this.begin(); });
      c.addEventListener('pointerdown', (e) => {
        if (this.state !== 'question') return;
        const [x, y] = this.toStage(e);
        this.onPress(x, y);
      });
      c.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'mouse') this.peekCursor();
        const [x, y] = this.toStage(e);
        this.onMotion(x, y);
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          if (e.target && e.target.closest && e.target.closest('button, a')) return; // let buttons work normally
          if (this.state === 'start') { e.preventDefault(); this.begin(); }
        } else if (e.key === 'ArrowRight') {
          this.skip();
        }
      });
      window.addEventListener('resize', () => this.onResize());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.state !== 'start') this.keepAwake();
      });
      if (document.fonts && document.fonts.addEventListener) {
        document.fonts.addEventListener('loadingdone', () => { for (const f of this.fonts.values()) f.reset(); });
      }
    }
    cursor(show) {
      this.cursorOn = show;
      this.canvas.style.cursor = show ? '' : 'none';
    }
    peekCursor() {
      if (this.cursorOn) return;
      this.canvas.style.cursor = '';
      clearTimeout(this.cursorT);
      this.cursorT = setTimeout(() => { if (!this.cursorOn) this.canvas.style.cursor = 'none'; }, 1800);
    }
    goFullscreen() {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!req || document.fullscreenElement || document.webkitFullscreenElement) return;
      try {
        const p = req.call(el, { navigationUI: 'hide' });
        if (p && p.catch) p.catch(() => {});
      } catch (e) { /* not supported here */ }
    }
    keepAwake() {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          navigator.wakeLock.request('screen').then((l) => { this.wakeLock = l; }).catch(() => {});
        }
      } catch (e) { /* not supported here */ }
    }
    begin() {
      if (this.state !== 'start') return;
      this.state = 'show';
      this.cursor(false);
      this.music.play('main');
      this.goFullscreen();
      this.keepAwake();
      this.finish(0, 0.9);
    }
    skip() {
      if (this.state === 'start') this.begin();
      else if (this.state === 'show') this.nextScene();
    }

    // ---------- speed buttons (song and poem) ----------
    setupSpeedUI() {
      const box = document.getElementById('speed');
      this.speedBox = box;
      if (!box) return;
      box.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.2v11.6c0 .8.9 1.3 1.6.8l8.1-5.8c.6-.4.6-1.2 0-1.6L4.6 5.4C3.9 4.9 3 5.4 3 6.2zm9.5 0v11.6c0 .8.9 1.3 1.6.8l8.1-5.8c.6-.4.6-1.2 0-1.6l-8.1-5.8c-.7-.5-1.6 0-1.6.8z"/></svg>';
      this.speedBtns = SPEED_OPTIONS.map((sp) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = sp + 'x';
        b.setAttribute('aria-label', 'Speed ' + sp + 'x');
        b.setAttribute('aria-pressed', String(sp === this.speedSel));
        b.addEventListener('click', (e) => { e.stopPropagation(); this.setSpeed(sp); });
        box.appendChild(b);
        return [sp, b];
      });
    }
    setSpeed(sp) {
      this.speedSel = sp;
      for (const [v, b] of this.speedBtns || []) b.setAttribute('aria-pressed', String(v === sp));
    }
    // On phones the speed bar sits above the text, so text starts below it.
    topReserve() {
      if (!this.P || !this.speedBox || !SPEED_SCENES.includes(this.sceneName)) return 0;
      const r = this.speedBox.getBoundingClientRect();
      return r.height ? r.bottom + 14 : 0;
    }
    updateSpeedUI(on) {
      if (!this.speedBox) return;
      this.speedBox.classList.toggle('on', !!on);
      this.speedBox.setAttribute('aria-hidden', on ? 'false' : 'true');
    }

    // =================================================================
    //  Scenes
    // =================================================================
    sceneStart() {
      this.state = 'start';
      this.cursor(true);
      const { W, H, U, P } = this;
      this.bg.setGradient('#12001f', '#3a0030', 0.5);
      this.bg.heartsTarget = 14;
      const la = this.wrapFit(START_LINE, 0.046, W * 0.88);
      const lb = this.wrapFit(START_HINT, 0.028, W * 0.9, 'normal', null, 0.72);
      let hy = H * 0.40, ya = H * 0.70, yb = H * 0.80;
      if (P) {
        const ha = this.blockH(la.font, la.lines.length), hb = this.blockH(lb.font, lb.lines.length);
        hy = H * 0.38;
        [ya, yb] = stackCenters([ha, hb], [U * 0.05], hy + U * 0.16, H * 0.95);
      }
      const heart = new PulseHeart(this, W / 2, hy, U * 0.20, '#ff2d5f');
      heart.show(1.4);
      heart.beat();
      const a = this.txt(W / 2, ya, la.lines, la.font, '#ffe3ec', { glow: '#ff4d79' });
      const b = this.txt(W / 2, yb, lb.lines, lb.font, '#ffb3c7');
      this.show(a, 0.6, 1.4);
      this.show(b, 1.8, 1.2);
      const t0 = this.now() + 3.2;
      this.add(new Loop((t) => {
        if (t >= t0 && this.state === 'start') {
          const v = 0.55 + 0.45 * Math.cos((t - t0) * 2.4);
          for (const it of b) this.setVis(it, v);
        }
        return true;
      }));
    }

    sceneIntro() {
      this.state = 'show';
      this.cursor(false);
      const { W, H, U } = this;
      this.bg.setGradient('#12001f', '#3a0030', 1.5);
      this.bg.heartsTarget = 12;
      const cx = W / 2, cy = H * 0.42;
      const heart = new PulseHeart(this, cx, cy, U * 0.20, '#ff2d5f');
      heart.show(1.5);
      heart.beat();
      INTRO.forEach((s, i) => {
        const w = this.wrapFit(s, 0.05, W * 0.9);
        const t = this.txt(cx, H * 0.76, w.lines, w.font, '#ffe3ec', { glow: '#ff4d79' });
        this.show(t, 1.2 + i * 4.4, 1.2, 2.4, 0.8);
      });
      this.at(9.8, () => heart.grow(U * 0.30, 1.4));
      const name = this.txt(cx, cy - U * 0.012, HER, this.fit(HER, 0.085, U * 0.24, 'bold'), '#ffffff', { glow: '#ff9ab5' });
      this.show(name, 10.4, 1.4);
      this.at(13.8, () => {
        new Burst(this, cx, cy, { n: 60, size: U * 0.03, speed: U * 0.75, life: 1.8 });
        heart.hide(0.5);
        this.fade(name, 0, 0.5, 0, { del: true });
      });
      this.finish(14.8, 0.8);
    }

    sceneNames() {
      const { W, H, U, P } = this;
      this.bg.setGradient('#2b0030', '#6b0f3a', 2.0);
      this.bg.heartsTarget = 18;
      const s1f = this.wrapFit(NAMES_SUB[0], 0.044, W * 0.9);
      const s2f = this.wrapFit(NAMES_SUB[1], 0.036, W * 0.9);
      let cy, hs, y1, y2;
      if (!P) {
        cy = H * 0.42;
        hs = U * 0.11;
        const gap = U * 0.085;
        const f = this.fit([HIS_FULL, HER_FULL], 0.064, W / 2 - gap - W * 0.04, 'bold');
        const left = this.txt(-W * 0.02, cy, HIS_FULL, f, '#ffffff', { anchor: 'e', glow: '#ff6b9a' });
        const right = this.txt(W * 1.02, cy, HER_FULL, f, '#ffffff', { anchor: 'w', glow: '#ff6b9a' });
        this.slide(left, W / 2 - gap + W * 0.02, 0, 2.2, 0.3);
        this.slide(right, W / 2 + gap - W * 1.02, 0, 2.2, 0.3);
        this.show(left, 0.3, 1.4);
        this.show(right, 0.3, 1.4);
        y1 = H * 0.62;
        y2 = H * 0.70;
      } else {
        // phone: one name comes from the left above the heart, the other from the right below it
        cy = H * 0.38;
        hs = U * 0.13;
        const f = this.fit([HIS_FULL, HER_FULL], 0.064, W * 0.86, 'bold');
        const off = hs * 0.45 + f.linespace * 0.5 + U * 0.025;
        const wl = f.measure(HIS_FULL), wr = f.measure(HER_FULL);
        const left = this.txt(-W * 0.02, cy - off, HIS_FULL, f, '#ffffff', { anchor: 'e', glow: '#ff6b9a' });
        const right = this.txt(W * 1.02, cy + off, HER_FULL, f, '#ffffff', { anchor: 'w', glow: '#ff6b9a' });
        this.slide(left, W / 2 + wl / 2 + W * 0.02, 0, 2.2, 0.3);
        this.slide(right, W / 2 - wr / 2 - W * 1.02, 0, 2.2, 0.3);
        this.show(left, 0.3, 1.4);
        this.show(right, 0.3, 1.4);
        const h1 = this.blockH(s1f.font, s1f.lines.length), h2 = this.blockH(s2f.font, s2f.lines.length);
        [y1, y2] = stackCenters([h1, h2], [U * 0.03], cy + off + f.linespace * 0.5 + U * 0.06, H * 0.95);
      }
      const heart = new PulseHeart(this, W / 2, cy, hs, '#ff2d5f');
      heart.pop(0.9, 2.2);
      const s1 = this.txt(W / 2, y1, s1f.lines, s1f.font, '#ffd479', { glow: '#ff9a3c' });
      const s2 = this.txt(W / 2, y2, s2f.lines, s2f.font, '#ffc2d4');
      this.show(s1, 3.4, 1.2);
      this.show(s2, 5.0, 1.2);
      this.at(8.8, () => new Burst(this, W / 2, cy, { n: 50 }));
      this.finish(9.8);
    }

    sceneBook() {
      const { W, H, U, P } = this;
      this.bg.setGradient('#1d0b24', '#4a1530', 2.0);
      this.bg.heartsTarget = 10;
      const tf = this.wrapFit(BOOK_LINE, 0.046, W * 0.9);
      let ph, pw, y0, titleY;
      if (!P) {
        ph = H * 0.70;
        pw = Math.min(W * 0.31, ph * 0.76);
        y0 = H * 0.19;
        titleY = H * 0.095;
      } else {
        pw = W * 0.45;
        ph = Math.min(H * 0.66, pw * 2.05);
        const th = this.blockH(tf.font, tf.lines.length);
        const gap = U * 0.06;
        const top = Math.max(H * 0.04, this.topReserve(), (H - (th + gap + ph)) / 2 - U * 0.01);
        titleY = top + th / 2;
        y0 = top + th + gap;
      }
      const title = this.txt(W / 2, titleY, tf.lines, tf.font, '#ffd479', { glow: '#ff9a3c' });
      this.show(title, 0.2, 1.2);
      const cx = W / 2;
      const y1 = y0 + ph;
      const pad = U * 0.008;
      const PAGE = '#fdf6e3', EDGE = '#dccfb0', GUT = '#c8b48c';
      const COVER = '#8e1b3f', COVER_IN = '#5e1029', COVER_EDGE = '#4a0c20', GOLD = '#e7c26a';
      const hidden = (kind, coords, o = {}) => this.create(kind, coords, Object.assign({ state: 'hidden', tags: ['book'] }, o));

      const shR = hidden('polygon', pillPoints(cx, y0 + U * 0.02, cx + pw + U * 0.03, y1 + U * 0.03, U * 0.02), { smooth: true });
      this.reg(shR, 0.45, { fill: '#000000' });
      const shL = hidden('polygon', pillPoints(cx - pw - U * 0.01, y0 + U * 0.02, cx + U * 0.01, y1 + U * 0.03, U * 0.02), { smooth: true });
      this.reg(shL, 0.45, { fill: '#000000' });
      const rp = hidden('rect', [cx, y0, cx + pw, y1]);
      this.reg(rp, 1, { fill: PAGE, outline: EDGE });
      const edgesR = [];
      for (let k = 1; k < 4; k++) {
        const ln = hidden('line', [cx + pw + k * 2.2, y0 + k * 2.2, cx + pw + k * 2.2, y1 + k * 1.2]);
        this.reg(ln, 1, { fill: EDGE });
        edgesR.push(ln);
      }
      const cover = hidden('polygon', [cx, y0 - pad, cx + pw + pad, y0 - pad, cx + pw + pad, y1 + pad, cx, y1 + pad], { width: 2 });
      this.reg(cover, 1, { fill: COVER, outline: COVER_EDGE });
      const bx = pw * 0.08;
      const border = hidden('rect', [cx + bx, y0 + bx, cx + pw - bx + pad, y1 - bx], { width: 2 });
      this.reg(border, 1, { outline: GOLD });
      const ccx = cx + (pw + pad) / 2;
      const c3 = this.wrapFit(BOOK_COVER[2], 0.022, pw * 0.76);
      const t1 = this.txt(ccx, y0 + ph * 0.36, BOOK_COVER[0], this.fit(BOOK_COVER[0], 0.05, pw * 0.78, 'bold'), GOLD, { shadow: false });
      const t2 = this.txt(ccx, y0 + ph * 0.48, BOOK_COVER[1], this.fit(BOOK_COVER[1], 0.034, pw * 0.78), '#fff1e0', { shadow: false });
      const hh = this.polyItem(heartPoints(ccx, y0 + ph * 0.62, pw * 0.13), GOLD);
      const t3 = this.txt(ccx, y0 + ph * 0.84, c3.lines, c3.font, GOLD, { shadow: false });
      const coverItems = [border, hh, ...t1, ...t2, ...t3];
      this.tag([hh, ...t1, ...t2, ...t3], 'book');
      const lp = hidden('rect', [cx - pw, y0, cx, y1]);
      this.reg(lp, 1, { fill: PAGE, outline: EDGE });
      const edgesL = [];
      for (let k = 1; k < 4; k++) {
        const ln = hidden('line', [cx - pw - k * 2.2, y0 + k * 2.2, cx - pw - k * 2.2, y1 + k * 1.2]);
        this.reg(ln, 1, { fill: EDGE });
        edgesL.push(ln);
      }
      const gutter = [];
      for (let k = 0; k < 6; k++) {
        for (const sg of [-1, 1]) {
          const x = cx + sg * k * pw * 0.007;
          const ln = hidden('line', [x, y0, x, y1]);
          this.reg(ln, 1, { fill: mix(PAGE, GUT, 0.7 * (1 - k / 6)) });
          gutter.push(ln);
        }
      }
      const leftItems = [shL, lp, ...edgesL, ...gutter];
      // the closed book starts centred and glides left as it opens
      this.moveTag('book', -pw / 2, 0);
      this.show([shR, rp, cover, ...edgesR], 0.6, 1.4);
      this.show(coverItems, 2.0, 1.0);

      const openCover = () => {
        this.fade(coverItems, 0, 0.35, 0, { del: true });
        const lift = ph * 0.05;
        let last = -pw / 2;
        const fn = (p) => {
          const e = easeInOut(p);
          const th = Math.PI * e;
          const shift = -pw / 2 * (1 - e);
          this.moveTag('book', shift - last, 0);
          last = shift;
          const bx2 = cx + shift;
          const xo = bx2 + (pw + pad) * Math.cos(th);
          const lf = lift * Math.sin(th);
          cover.coords = [bx2, y0 - pad, xo, y0 - pad - lf, xo, y1 + pad + lf, bx2, y1 + pad];
          const face = th < Math.PI / 2 ? COVER : COVER_IN;
          cover.fill = mix('#1a0410', face, 0.45 + 0.55 * Math.abs(Math.cos(th)));
        };
        const done = () => {
          this.retarget(cover, { fill: COVER_IN, outline: COVER_EDGE });
          this.fade(leftItems, 1, 0.6);
        };
        this.add(new Tween(this.now() + 0.35, 1.7, fn, done));
      };

      const turnPage = () => {
        const pg = this.create('polygon', [cx, y0, cx + pw, y0, cx + pw, y1, cx, y1], { fill: PAGE, outline: EDGE });
        const fn = (p) => {
          const th = Math.PI * easeInOut(p);
          const xo = cx + pw * Math.cos(th);
          const lf = ph * 0.035 * Math.sin(th);
          pg.coords = [cx, y0, xo, y0 - lf, xo, y1 + lf, cx, y1];
          pg.fill = mix('#bba98a', PAGE, 0.35 + 0.65 * Math.abs(Math.cos(th)));
        };
        this.add(new Tween(this.now(), 0.9, fn, () => { pg.dead = true; }));
      };

      const lx = cx - pw / 2, rx = cx + pw / 2;
      const fh = this.fit(CHAPTERS.map((c) => c[0]), 0.042, pw * 0.8, 'bold');
      const fs = this.fit(CHAPTERS.map((c) => c[1]), 0.032, pw * 0.8);
      const all = [].concat(...CHAPTERS.map((c) => c[2]));
      const g = this.wrapGroup(all, 0.031, pw * 0.86, 'normal', null, 0.85);
      const fb = g.font;
      const wrapped = g.rows.some((r) => r.length > 1);
      const rowsBy = [];
      let off = 0;
      for (const ch of CHAPTERS) { rowsBy.push(g.rows.slice(off, off + ch[2].length)); off += ch[2].length; }
      const holder = {};

      const startChapter = (i) => {
        const [head, sub] = CHAPTERS[i];
        const rows = rowsBy[i];
        const a = this.txt(lx, y0 + ph * 0.30, head, fh, '#b0304a', { shadow: false });
        const orn = this.create('line', [lx - pw * 0.18, y0 + ph * 0.36, lx + pw * 0.18, y0 + ph * 0.36], { state: 'hidden', width: 2 });
        this.reg(orn, 1, { fill: '#d9a6b3' });
        const b = this.txt(lx, y0 + ph * 0.43, sub, fs, '#7a3b4f', { shadow: false });
        const hrt = this.polyItem(heartPoints(lx, y0 + ph * 0.60, pw * 0.12), '#e05a7a');
        this.show(a, 0, 1.0);
        this.show([orn], 0.3, 0.8);
        this.show(b, 0.5, 1.0);
        this.show([hrt], 0.9, 1.0);
        const ls = fb.linespace;
        const hs = rows.map((r) => this.blockH(fb, r.length));
        const gaps = rows.slice(1).map(() => ls * (wrapped ? 0.45 : 0.15));
        const ys = stackCenters(hs, gaps, y0 + ph * 0.5 - 1e5, y0 + ph * 0.5 + 1e5);
        let items = [...a, ...b, orn, hrt];
        rows.forEach((r, j) => {
          const it = this.txt(rx, ys[j], r, fb, '#4a2533', { shadow: false });
          this.show(it, 1.3 + j * 0.8, 1.0);
          items = items.concat(it);
        });
        holder[i] = items;
      };
      const endChapter = (i) => this.fade(holder[i] || [], 0, 0.6, 0, { del: true });

      this.at(4.6, openCover);
      const t0 = 6.8;
      for (let i = 0; i < CHAPTERS.length; i++) {
        const st = t0 + i * 9.8;
        this.at(st, startChapter, i);
        if (i < CHAPTERS.length - 1) {
          this.at(st + 8.2, endChapter, i);
          this.at(st + 8.8, turnPage);
        }
      }
      this.finish(t0 + (CHAPTERS.length - 1) * 9.8 + 8.6);
    }

    sceneSong() {
      const { W, H, U, P } = this;
      this.bg.setGradient('#140a2e', '#3d1257', 2.0);
      this.bg.heartsTarget = 8;
      new NoteRain(this);
      new SoundWave(this);
      const tw = this.wrapFit(SONG_TITLE, 0.056, W * 0.9, 'bold', null, 0.7);
      const g = this.wrapGroup(SONG_LINES, 0.043, W * 0.84);
      const n = Math.min(SONG_LINES.length, 6);
      let titleY = H * 0.16;
      let ys = [0.32, 0.40, 0.48, 0.56, 0.68, 0.76].map((v) => v * H);
      if (P) {
        const th = this.blockH(tw.font, tw.lines.length);
        const ls = g.font.linespace;
        const hs = g.rows.slice(0, n).map((r) => this.blockH(g.font, r.length));
        const gaps = hs.slice(1).map((_, i) => (i === 3 ? ls * 1.1 : ls * 0.42));
        titleY = Math.max(H * 0.13, this.topReserve() + th / 2 + U * 0.01);
        ys = stackCenters(hs, gaps, titleY + th / 2 + U * 0.06, H * 0.86);
      }
      const t = this.txt(W / 2, titleY, tw.lines, tw.font, '#ffd479', { glow: '#ff9a3c' });
      this.show(t, 0.3, 1.2);
      const times = [2.0, 3.7, 5.4, 7.1, 9.6, 11.3];
      const cols = ['#ffffff', '#ffe0ea', '#ffffff', '#ffd479', '#ffffff', '#ffe0ea'];
      for (let i = 0; i < n; i++) {
        const it = this.txt(W / 2, ys[i] + H * 0.025, g.rows[i], g.font, cols[i], { glow: '#a45cff' });
        this.show(it, times[i], 1.3);
        this.slide(it, 0, -H * 0.025, 1.4, times[i]);
      }
      this.finish(17.0);
    }

    scenePoem() {
      const { W, H, U, P } = this;
      this.bg.setGradient('#0f0f2e', '#2f1747', 2.0);
      this.bg.heartsTarget = 6;
      new Petals(this);
      const fa = this.fit(POEM_TITLE, 0.034, W * 0.92);
      const g1 = this.wrapGroup(POEM_TAGORE, 0.05, W * 0.88);
      const fc = this.fit(POEM_CREDIT, 0.028, W * 0.92);
      const fm = this.fit(POEM_MINE_TITLE, 0.032, W * 0.92);
      const g2 = this.wrapGroup(POEM_MINE, 0.046, W * 0.88);
      let ys = [0.16, 0.29, 0.38, 0.47, 0.61, 0.71, 0.80].map((v) => v * H);
      if (P) {
        const hs = [fa.linespace, this.blockH(g1.font, g1.rows[0].length), this.blockH(g1.font, (g1.rows[1] || ['']).length),
          fc.linespace, fm.linespace, this.blockH(g2.font, g2.rows[0].length), this.blockH(g2.font, (g2.rows[1] || ['']).length)];
        const gaps = [U * 0.055, g1.font.linespace * 0.4, U * 0.03, U * 0.10, U * 0.035, g2.font.linespace * 0.4];
        ys = stackCenters(hs, gaps, Math.max(H * 0.05, this.topReserve()), H * 0.96);
      }
      const a = this.txt(W / 2, ys[0], POEM_TITLE, fa, '#c9b6ff');
      const b1 = this.txt(W / 2, ys[1], g1.rows[0], g1.font, '#fff3e6', { glow: '#8a63ff' });
      const b2 = this.txt(W / 2, ys[2], g1.rows[1] || [''], g1.font, '#fff3e6', { glow: '#8a63ff' });
      const cr = this.txt(W / 2, ys[3], POEM_CREDIT, fc, '#ffd479');
      const m = this.txt(W / 2, ys[4], POEM_MINE_TITLE, fm, '#c9b6ff');
      const o1 = this.txt(W / 2, ys[5], g2.rows[0], g2.font, '#ffc2d4', { glow: '#ff4d79' });
      const o2 = this.txt(W / 2, ys[6], g2.rows[1] || [''], g2.font, '#ffc2d4', { glow: '#ff4d79' });
      this.show(a, 0.4, 1.0);
      this.show(b1, 1.6, 1.4);
      this.show(b2, 3.4, 1.4);
      this.show(cr, 5.2, 1.0);
      this.show(m, 8.4, 1.0);
      this.show(o1, 9.6, 1.4);
      this.show(o2, 11.4, 1.4);
      this.finish(17.2);
    }

    sceneHeart() {
      const { W, H, U, P } = this;
      this.bg.setGradient('#1a0010', '#4a0020', 2.0);
      this.bg.heartsTarget = 0;
      const size = P ? Math.min(W * 0.92, U * 0.62) : H * 0.62;
      const cy = H * (P ? 0.42 : 0.45);
      new HeartForm(this, W / 2, cy, size);
      const tf = this.fit(HEART_TEXT, 0.062, size * (0.46 / 0.62), 'bold');
      const t = this.txt(W / 2, cy - size * (0.01 / 0.62), HEART_TEXT, tf, '#ffffff', { glow: '#ff3f73' });
      this.show(t, 3.6, 1.4);
      const sf = this.wrapFit(HEART_SUB, 0.042, W * 0.9);
      const sy = P ? Math.max(H * 0.82, cy + size * 0.5 + U * 0.08) : H * 0.87;
      const s = this.txt(W / 2, Math.min(sy, H * 0.92), sf.lines, sf.font, '#ffd479', { glow: '#ff9a3c' });
      this.show(s, 5.2, 1.2);
      this.finish(11.0);
    }

    sceneLetter() {
      const { W, H, U, P } = this;
      this.bg.setGradient('#2a0a1a', '#5a1a35', 2.0);
      this.bg.heartsTarget = 12;
      const CARD = '#fff8f0', INK = '#4a1a2c', RED = '#c2185b', SOFT = '#e8b9c4';
      const cw = P ? W * 0.93 : Math.min(W * 0.64, H * 1.10);
      const chh = H * (P ? 0.88 : 0.86);
      const x1 = W / 2 - cw / 2, y1 = H * (P ? 0.06 : 0.07);
      const x2 = x1 + cw, y2 = y1 + chh;
      const r = U * 0.03;
      const sh = this.polyItem(pillPoints(x1 + U * 0.012, y1 + U * 0.016, x2 + U * 0.012, y2 + U * 0.016, r), '#000000', 0.5);
      const card = this.polyItem(pillPoints(x1, y1, x2, y2, r), CARD);
      const inner = this.create('polygon', pillPoints(x1 + U * 0.016, y1 + U * 0.016, x2 - U * 0.016, y2 - U * 0.016, U * 0.022),
        { smooth: true, width: 2, state: 'hidden' });
      this.reg(inner, 1, { outline: SOFT });
      const corners = [[x1 + U * 0.05, y1 + U * 0.05], [x2 - U * 0.05, y1 + U * 0.05], [x1 + U * 0.05, y2 - U * 0.05], [x2 - U * 0.05, y2 - U * 0.05]]
        .map(([hx, hy]) => this.polyItem(heartPoints(hx, hy, U * 0.03), '#f3a6b8'));
      const seal = new PulseHeart(this, W / 2, y1, U * 0.07, RED, { glow: false });
      this.show([sh, card], 0.3, 1.2);
      this.show([inner, ...corners], 1.5, 0.8);
      seal.pop(0.8, 1.6, false);

      const padX = cw * (P ? 0.075 : 0.085);
      const lx = x1 + padX, rx = x2 - padX;
      const maxw = rx - lx, avail = chh * (P ? 0.84 : 0.80);
      let scale = 1, F, rows, heights, total;
      for (;;) {
        F = {
          head: this.font(0.040 * scale, 'bold'), body: this.font(0.035 * scale), key: this.font(0.043 * scale, 'bold'),
          sign: this.font(0.035 * scale), sign2: this.font(0.050 * scale, 'bold'),
        };
        rows = LETTER.map(([k, s]) => (P ? wrapWords(s, F[k], maxw) : [s]));
        const ok = LETTER.every(([k], i) => rows[i].every((s) => F[k].measure(s) <= maxw));
        heights = LETTER.map(([k], i) => F[k].linespace * 1.05 * (1 + (rows[i].length - 1) * 0.92));
        total = heights.reduce((a, b) => a + b, 0) + heights[0] * 0.4 + heights[heights.length - 1] * 0.5;
        if ((ok && total <= avail) || scale < 0.45) break;
        scale *= 0.94;
      }
      let y = y1 + (chh - total) / 2;
      const layout = [];
      LETTER.forEach(([kind, s], i) => {
        const hgt = heights[i];
        if (i === 1) y += heights[0] * 0.4;
        if (kind === 'sign') y += hgt * 0.5;
        const f = F[kind];
        const rowH = rows[i].length > 1 ? f.linespace * 1.05 * 0.92 : hgt;
        rows[i].forEach((row, ri) => {
          const wdt = f.measure(row);
          let x;
          if (kind === 'key') x = W / 2 - wdt / 2;
          else if (kind.startsWith('sign')) x = rx - wdt;
          else x = lx;
          const yc = rows[i].length > 1 ? y + f.linespace * 1.05 / 2 + ri * rowH : y + hgt / 2;
          layout.push({ kind, s: row, x, yc, f, col: (kind === 'key' || kind === 'sign2') ? RED : INK, cont: ri > 0 });
        });
        y += hgt;
      });

      const caret = this.create('line', [0, 0, 0, 1], { fill: INK, width: Math.max(2, U * 0.0025), state: 'hidden' });
      const st = { on: false, busy: false };
      this.add(new Loop((t) => {
        const vis = st.on && (st.busy || Math.floor(t * 2.4) % 2 === 0);
        caret.hidden = !vis;
        return true;
      }));

      const typeLine = (i) => {
        if (i >= layout.length) {
          st.on = false;
          this.finish(6.0, 1.4);
          return;
        }
        const L = layout[i];
        const it = this.create('text', [L.x, L.yc], { lines: [''], font: L.f, anchor: 'w' });
        this.reg(it, 1, { fill: L.col });
        this.setVis(it, 1);
        const half = L.f.linespace * 0.36;
        caret.coords = [L.x, L.yc - half, L.x, L.yc + half];
        st.on = true;
        st.busy = true;
        const nxt = layout[i + 1];
        let pause = (L.kind === 'key' || (nxt && nxt.kind === 'key')) ? 1.1 : 0.55;
        if (nxt && nxt.cont) pause = 0.12;
        new Typewriter(this, it, L.s, L.kind === 'key' ? 11.0 : 15.0, L.f, L.x, caret, () => {
          st.busy = false;
          this.at(pause, typeLine, i + 1);
        });
      };
      this.at(2.6, typeLine, 0);
    }

    // ---------------- the question ----------------
    sceneQuestion() {
      this.state = 'question';
      this.cursor(true);
      const { W, H, U, P } = this;
      this.bg.setGradient('#3a0a2a', '#7a1d48', 2.0);
      this.bg.heartsTarget = 20;
      const big = new PulseHeart(this, W / 2, H * 0.47, P ? Math.min(U * 0.75, W * 0.98) : H * 0.75, '#ff3f73',
        { glow: false, alpha: 0.13, gloss: false });
      big.show(2.0);
      big.beat(1.6, 0.04);
      const qf = this.wrapFit(QUESTION, 0.075, W * 0.9, 'bold');
      const sf = this.wrapFit(QUESTION_SUB, 0.034, W * 0.9);
      let qy = H * 0.30, sy = H * 0.41;
      if (P) {
        const hq = this.blockH(qf.font, qf.lines.length), hs = this.blockH(sf.font, sf.lines.length);
        [qy, sy] = stackCenters([hq, hs], [U * 0.025], H * 0.12, H * 0.60 - U * 0.09);
      }
      const q = this.txt(W / 2, qy, qf.lines, qf.font, '#ffffff', { glow: '#ff3f73' });
      this.qMain = q[q.length - 1];
      this.show(q, 0.4, 1.6);
      const sub = this.txt(W / 2, sy, sf.lines, sf.font, '#ffd1dc');
      this.qSub = sub[sub.length - 1];
      this.show(sub, 1.8, 1.2);
      this.buttonsReady = false;
      this.tease = this.txt(W / 2, H * 0.80, ' ', this.fit(TEASES, 0.034, W * 0.9), '#ffe08a');
      this.teaseI = 0;
      this.at(2.8, () => this.makeButtons());
    }

    makeButtons() {
      const { W, H, U, P } = this;
      this.bw = P ? W * 0.34 : Math.max(W * 0.12, H * 0.2);
      this.bh = U * 0.09;
      this.yesC = [W * (P ? 0.28 : 0.40), H * 0.60];
      this.noC = [W * (P ? 0.72 : 0.60), H * 0.60];
      this.noTarget = this.noC.slice();
      this.yesS = 1;
      this.noS = 1;
      // on narrow phones the growing Yes button must stay on screen
      this.yesMax = Math.min(1.7, (2 * Math.min(this.yesC[0], W - this.yesC[0]) - W * 0.06) / this.bw);
      this.yesFs = null;
      this.noFs = null;
      this.glowK = 1;
      this.noTok = 0;
      this.hover = false;
      const pill = (colors, alpha = 1, width = 1) => {
        const it = this.create('polygon', [0, 0, 0, 0, 0, 0], { smooth: true, width, state: 'hidden' });
        this.reg(it, alpha, colors);
        return it;
      };
      this.yesGlow = pill({ fill: '#ff8fb1' }, 0.35);
      this.yesSh = pill({ fill: '#000000' }, 0.4);
      this.yesBody = pill({ fill: '#ff3f73', outline: '#ffd6e2' }, 1, 2);
      this.yesTxt = this.create('text', [0, 0], { lines: [YES_TEXT], font: this.font(0.045, 'bold', this.en), state: 'hidden' });
      this.reg(this.yesTxt, 1, { fill: '#ffffff' });
      this.noSh = pill({ fill: '#000000' }, 0.4);
      this.noBody = pill({ fill: '#5d5470', outline: '#b3a9c9' }, 1, 2);
      this.noTxt = this.create('text', [0, 0], { lines: [NO_TEXT], font: this.font(0.045, 'bold', this.en), state: 'hidden' });
      this.reg(this.noTxt, 1, { fill: '#f2f2f2' });
      this.layoutYes();
      this.layoutNo();
      const items = [this.yesGlow, this.yesSh, this.yesBody, this.yesTxt, this.noSh, this.noBody, this.noTxt];
      this.fade(items, 1, 0.8, 0, { done: () => { this.buttonsReady = true; } });
      const t0 = this.now();
      this.add(new Loop((t) => {
        this.glowK = 0.6 + 0.8 * (0.5 + 0.5 * Math.sin((t - t0) * 3.2));
        this.layoutYes(true);
        return true;
      }));
    }

    layoutYes(glowOnly = false) {
      const [x, y] = this.yesC;
      const w = this.bw * this.yesS, h = this.bh * this.yesS;
      const g = this.bh * 0.32 * this.glowK;
      this.yesGlow.coords = pillPoints(x - w / 2 - g, y - h / 2 - g, x + w / 2 + g, y + h / 2 + g, h / 2 + g);
      if (glowOnly) return;
      const d = this.bh * 0.08;
      this.yesSh.coords = pillPoints(x - w / 2 + d, y - h / 2 + d * 1.4, x + w / 2 + d, y + h / 2 + d * 1.4, h / 2);
      this.yesBody.coords = pillPoints(x - w / 2, y - h / 2, x + w / 2, y + h / 2, h / 2);
      this.yesTxt.coords = [x, y];
      const fs = Math.round(0.045 * this.yesS * 10000) / 10000;
      if (fs !== this.yesFs) { this.yesFs = fs; this.yesTxt.font = this.font(fs, 'bold', this.en); }
    }

    layoutNo() {
      const [x, y] = this.noC;
      const w = this.bw * this.noS, h = this.bh * this.noS;
      const d = this.bh * 0.08;
      this.noSh.coords = pillPoints(x - w / 2 + d, y - h / 2 + d * 1.4, x + w / 2 + d, y + h / 2 + d * 1.4, h / 2);
      this.noBody.coords = pillPoints(x - w / 2, y - h / 2, x + w / 2, y + h / 2, h / 2);
      this.noTxt.coords = [x, y];
      const fs = Math.round(0.045 * this.noS * 10000) / 10000;
      if (fs !== this.noFs) { this.noFs = fs; this.noTxt.font = this.font(fs, 'bold', this.en); }
    }

    onMotion(x, y) {
      if (this.state !== 'question' || !this.buttonsReady) return;
      // test against where the No button is going, so one approach = one escape
      if (inside(x, y, this.noTarget, this.bw * this.noS, this.bh * this.noS, this.U * 0.07)) this.flee(x, y);
      const over = inside(x, y, this.yesC, this.bw * this.yesS, this.bh * this.yesS);
      if (over !== this.hover) {
        this.hover = over;
        this.retarget(this.yesBody, { fill: over ? '#ff6b95' : '#ff3f73', outline: '#ffd6e2' });
        this.canvas.style.cursor = over ? 'pointer' : '';
      }
    }

    onPress(x, y) {
      if (this.state === 'question' && this.buttonsReady) {
        const nw = this.bw * this.noS, nh = this.bh * this.noS, pad = this.U * 0.02;
        if (inside(x, y, this.noC, nw, nh, pad) || inside(x, y, this.noTarget, nw, nh, pad)) {
          this.flee(x, y); // "No" can never be clicked
        } else if (inside(x, y, this.yesC, this.bw * this.yesS, this.bh * this.yesS)) {
          this.accept();
        }
      }
    }

    flee(px, py) {
      const { W, H, U, P } = this;
      this.noS = Math.max(0.72, this.noS * 0.96);
      this.yesS = Math.min(this.yesMax, this.yesS * 1.06);
      this.layoutYes();
      const nw = this.bw * this.noS, nh = this.bh * this.noS;
      const yw = this.bw * this.yesS, yh = this.bh * this.yesS;
      const m = U * 0.04, gap = U * 0.05;
      const blocks = [textBox(this.qMain), textBox(this.qSub),
        P ? [W * 0.04, H * 0.76, W * 0.96, H * 0.84] : [W * 0.2, H * 0.76, W * 0.8, H * 0.84]];
      const cands = [];
      for (let k = 0; k < 80; k++) {
        const x = uni(m + nw / 2, W - m - nw / 2);
        const y = uni(m + nh / 2, H - m - nh / 2);
        if (Math.abs(x - this.yesC[0]) < (yw + nw) / 2 + gap && Math.abs(y - this.yesC[1]) < (yh + nh) / 2 + gap) continue;
        if (blocks.some((b) => b[0] - nw / 2 - gap < x && x < b[2] + nw / 2 + gap && b[1] - nh / 2 - gap < y && y < b[3] + nh / 2 + gap)) continue;
        const d = Math.hypot(x - px, y - py);
        if (d >= Math.min(W, H) * 0.3) cands.push([d, x, y]);
      }
      let x, y;
      if (cands.length) {
        cands.sort((a, b) => b[0] - a[0]);
        [, x, y] = choice(cands.slice(0, 6));
      } else {
        x = px > W / 2 ? m + nw / 2 : W - m - nw / 2;
        y = py > H / 2 ? m + nh / 2 : H - m - nh / 2;
      }
      this.moveNo(x, y);
      const msg = TEASES[this.teaseI % TEASES.length];
      this.teaseI += 1;
      for (const it of this.tease) {
        it.lines = [msg];
        this.setVis(it, 0);
      }
      this.fade(this.tease, 1, 0.35);
    }

    moveNo(x, y) {
      this.noTok += 1;
      const tok = this.noTok;
      this.noTarget = [x, y];
      const [x0, y0] = this.noC;
      this.add(new Tween(this.now(), 0.22, (p) => {
        if (tok === this.noTok) {
          const e = easeOut(p);
          this.noC = [x0 + (x - x0) * e, y0 + (y - y0) * e];
          this.layoutNo();
        }
      }));
    }

    accept() {
      if (this.state !== 'question') return;
      this.state = 'yes';
      this.yesPos = this.yesC.slice();
      const note = yesText(this.teaseI || 0);
      const sent = sendNtfy(note.title, note.message);
      if (this.ntfyPanel) this.ntfyPanel.track(sent);
      this.music.play('joy');
      this.finish(0, 0.6);
    }

    // ---------------- the happy ending ----------------
    sceneCelebrate() {
      this.state = 'yes';
      this.cursor(true);
      const { W, H, U, P } = this;
      this.bg.setGradient('#2a0845', '#b8306a', 1.4);
      this.bg.heartsTarget = 30;
      let [x0, y0] = this.yesPos || [W / 2, H / 2];
      x0 = clamp(x0, 0, W);
      y0 = clamp(y0, 0, H);
      new Burst(this, x0, y0, { n: 70, size: U * 0.032, speed: U * 0.9, life: 2.0 });
      new Confetti(this);
      let nxt = this.now() + 0.4;
      this.add(new Loop((t) => {
        if (t >= nxt) {
          new Firework(this, uni(W * 0.08, W * 0.92), uni(H * 0.08, H * 0.42));
          nxt = t + uni(0.9, 1.6);
        }
        return true;
      }));
      const tw = this.wrapFit(CEL_TITLE, 0.058, W * 0.9, 'bold', null, 0.68);
      const k = U * 0.0039;
      const fn = this.fit(CEL_NAMES, 0.07, W * 0.9, 'bold');
      const g = this.wrapGroup(CEL_WISH, 0.038, W * 0.9);
      const fl = this.wrapFit(CEL_LAST, 0.032, W * 0.9);
      const heartSize = P ? Math.min(U * 0.46, W * 0.9) : H * 0.46;
      let titleY = H * 0.10, ground = H * 0.62;
      let ys = [0.715, 0.80, 0.865, 0.935].map((v) => v * H);
      if (P) {
        const th = this.blockH(tw.font, tw.lines.length);
        titleY = H * 0.035 + th / 2;
        const hs = [fn.linespace, this.blockH(g.font, g.rows[0].length), this.blockH(g.font, (g.rows[1] || ['']).length),
          this.blockH(fl.font, fl.lines.length)];
        const gaps = [U * 0.02, g.font.linespace * 0.3, U * 0.02];
        const lowH = hs.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
        const above = 46 * k + heartSize * 0.45;
        ground = Math.min(H * 0.035 + th + U * 0.03 + above, H * 0.97 - lowH - U * 0.04);
        ground = Math.max(ground, H * 0.035 + th + 84 * k);
        ys = stackCenters(hs, gaps, ground + U * 0.03, H * 0.975);
      }
      const title = this.txt(W / 2, titleY, tw.lines, tw.font, '#ffd479', { glow: '#ff9a3c' });
      this.show(title, 0.3, 1.2);
      const big = new PulseHeart(this, W / 2, ground - 46 * k, heartSize, '#ff4d79', { alpha: 0.45, gloss: false });
      big.show(1.5, 0.5);
      big.beat(1.3, 0.05);
      const boy = new Buddy(this, -W * 0.08, ground, k, 'boy');
      const girl = new Buddy(this, W * 1.08, ground, k * 0.95, 'girl');
      for (const layer of ['back', 'body', 'arms', 'head', 'face']) { boy.make(layer); girl.make(layer); }
      const sxB = boy.x, sxG = girl.x;
      const txB = W / 2 - 15 * k, txG = W / 2 + 15 * k * 0.95;
      const walk = (p) => {
        const e = easeOut(p);
        boy.x = sxB + (txB - sxB) * e;
        girl.x = sxG + (txG - sxG) * e;
        boy.bob = girl.bob = -Math.abs(Math.sin(p * Math.PI * 8)) * 2.4 * (1 - p);
        boy.layout();
        girl.layout();
      };
      const hug = (p) => {
        boy.hug = girl.hug = p;
        boy.lean = girl.lean = 2.6 * easeInOut(p);
        boy.layout();
        girl.layout();
      };
      const hugged = () => {
        boy.setHappy();
        girl.setHappy();
        new Rising(this, W / 2, ground - 84 * k, 18 * k, { rate: 2.8 });
        let last = 0;
        const ts = this.now();
        this.add(new Loop((t) => {
          const dx = Math.sin((t - ts) * 1.6) * 3.0 * k;
          this.moveTag('buddy', dx - last, 0);
          last = dx;
          return true;
        }));
      };
      this.add(new Tween(this.now() + 0.4, 2.6, walk));
      this.add(new Tween(this.now() + 3.1, 0.8, hug, hugged));
      const names = this.txt(W / 2, ys[0], CEL_NAMES, fn, '#ffffff', { glow: '#ff3f73' });
      this.show(names, 3.8, 1.4);
      const w1 = this.txt(W / 2, ys[1], g.rows[0], g.font, '#ffe3ec');
      const w2 = this.txt(W / 2, ys[2], g.rows[1] || [''], g.font, '#ffe3ec');
      const w3 = this.txt(W / 2, ys[3], fl.lines, fl.font, '#ffd479', { glow: '#ff9a3c' });
      this.show(w1, 5.2, 1.2);
      this.show(w2, 6.6, 1.2);
      this.show(w3, 8.2, 1.2);
    }
  }

  // ---------------------------------------------------------------------
  //  Start
  // ---------------------------------------------------------------------
  // Wait (at most `ms`) for the Bangla web font, so the very first scene already uses it.
  function fontsReady(ms) {
    const deadline = Date.now() + ms;
    const wait = (t) => new Promise((r) => setTimeout(r, Math.max(0, t)));
    const link = document.getElementById('bn-font');
    const css = new Promise((resolve) => {
      if (!link || link.sheet) { if (link) link.media = 'all'; resolve(); return; }
      link.addEventListener('load', () => resolve(), { once: true });
      link.addEventListener('error', () => resolve(), { once: true });
    });
    return Promise.race([css, wait(ms)]).then(() => {
      if (!document.fonts || !document.fonts.load) return null;
      const sample = 'অআকখগ বাংলা ' + (HER || '');
      const fams = ['"Noto Serif Bengali"'].concat(BANGLA_FONT ? [quote(BANGLA_FONT)] : []);
      const jobs = [];
      for (const fam of fams) for (const w of ['400', '700']) jobs.push(document.fonts.load(`${w} 32px ${fam}`, sample).catch(() => {}));
      return Promise.race([Promise.all(jobs), wait(deadline - Date.now())]);
    });
  }

  function boot() {
    const canvas = document.getElementById('stage');
    const app = new App(canvas);
    window.__proposal = app;
    fontsReady(3500).then(() => {
      for (const f of app.fonts.values()) f.reset();
      app.nextScene();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
