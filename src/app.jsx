/*!
 * Aperture · pick a mood, not a genre
 * Designed and built by Erfan Kooshesh · erfesh.com · linkedin.com/in/erfesh
 */
const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } = React;

const EK = 0x454b; // "EK" in ASCII. Seeds the hash below.
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ART = window.__EK_ART__ || {}; // slug → image path, written by the build when art/ has files

/* ── catalog ────────────────────────────────────────────────────
   Moods are phrased to finish one sentence: "Tonight I want something…" */
const MOODS = [
  { id: 'slow', chip: 'slow-burning',        row: 'Slow-burning' },
  { id: 'cry',  chip: 'to cry over',         row: 'Worth the tears' },
  { id: 'half', chip: 'I can half-watch',    row: 'Easy to half-watch' },
  { id: 'date', chip: 'for a first date',    row: 'First-date safe' },
  { id: 'big',  chip: 'made for a big screen', row: 'Made for the big screen' },
];
const MOOD = Object.fromEntries(MOODS.map(m => [m.id, m]));

const FILMS = [
  { slug: 'past-lives', title: 'Past Lives', year: 2023, by: 'Celine Song', rating: 'PG-13', genre: 'Drama', tone: ['#122838', '#c99a6c'], why: {
      slow: 'Two people, one bar, a conversation twenty-four years late. Nothing explodes, and you still can’t look away.',
      cry: 'It never asks you to cry. The quiet walk to the car at the end does it anyway.' } },
  { slug: 'aftersun', title: 'Aftersun', year: 2022, by: 'Charlotte Wells', rating: 'R', genre: 'Drama', tone: ['#0d3540', '#e5865a'], why: {
      slow: 'A holiday in Turkey, half of it on an old camcorder. It feels like nothing is happening until you realize everything was.',
      cry: 'Hits hardest if you’ve ever looked back at a parent and seen them as a person for the first time.' } },
  { slug: 'perfect-days', title: 'Perfect Days', year: 2023, by: 'Wim Wenders', rating: 'PG', genre: 'Drama', tone: ['#17291f', '#d6c286'], why: {
      slow: 'A Tokyo toilet cleaner, cassette tapes, the same quiet routine every morning. The calmest two hours you’ll spend this year.',
      half: 'Very little dialogue and a soundtrack of old cassettes. It works as company as much as a movie.' } },
  { slug: 'arrival', title: 'Arrival', year: 2016, by: 'Denis Villeneuve', rating: 'PG-13', genre: 'Sci-fi', tone: ['#151d20', '#8ea6a6'], why: {
      slow: 'First contact as a language problem. It takes its time, and the last act changes everything you watched before it.',
      cry: 'Sold as sci-fi, lands as a story about loving someone even when you know how it ends.',
      big: 'Those shells hovering in the fog deserve the biggest screen in the house and the lights off.' } },
  { slug: 'dune-part-two', title: 'Dune: Part Two', year: 2024, by: 'Denis Villeneuve', rating: 'PG-13', genre: 'Sci-fi', tone: ['#2f1607', '#e69a4a'], why: {
      big: 'The first sandworm ride alone is worth the biggest screen and the loudest speakers you have.' } },
  { slug: 'oppenheimer', title: 'Oppenheimer', year: 2023, by: 'Christopher Nolan', rating: 'R', genre: 'Drama', tone: ['#170b05', '#f08a2c'], why: {
      big: 'Shot on IMAX film, mostly faces in rooms, and it still needs the big screen. The Trinity test is why.',
      slow: 'Three hours of hearings and conversations that play like a thriller. Put your phone in another room.' } },
  { slug: 'fury-road', title: 'Mad Max: Fury Road', year: 2015, by: 'George Miller', rating: 'R', genre: 'Action', tone: ['#351405', '#2c7380'], why: {
      big: 'One long chase, built mostly with real vehicles and real stunts. On a phone you lose half the craft.' } },
  { slug: 'interstellar', title: 'Interstellar', year: 2014, by: 'Christopher Nolan', rating: 'PG-13', genre: 'Sci-fi', tone: ['#0a1120', '#c9a45c'], why: {
      big: 'The docking scene and that organ score need room to breathe. Turn it up.',
      cry: 'The video messages scene. You know the one.' } },
  { slug: 'coco', title: 'Coco', year: 2017, by: 'Lee Unkrich', rating: 'PG', genre: 'Animation', tone: ['#330b29', '#f2a33a'], why: {
      cry: 'It plants one song early and pays it off in the last ten minutes. Keep tissues close.' } },
  { slug: 'up', title: 'Up', year: 2009, by: 'Pete Docter', rating: 'PG', genre: 'Animation', tone: ['#0f3049', '#f2c14e'], why: {
      cry: 'The first ten minutes, with almost no dialogue, do what most movies can’t in two hours.',
      half: 'After that opening it turns into a light adventure that’s easy to dip in and out of.' } },
  { slug: 'paddington-2', title: 'Paddington 2', year: 2017, by: 'Paul King', rating: 'PG', genre: 'Family', tone: ['#360d11', '#4f86c6'], why: {
      half: 'Warm, gentle and impossible to lose track of, even with dinner going in the other room.',
      date: 'Nobody leaves Paddington 2 in a bad mood, and Hugh Grant is a gift.' } },
  { slug: 'knives-out', title: 'Knives Out', year: 2019, by: 'Rian Johnson', rating: 'PG-13', genre: 'Mystery', tone: ['#26140b', '#b5683a'], why: {
      date: 'A whodunit that gives you something to argue about over dessert. The sweater is its own conversation.' } },
  { slug: 'la-la-land', title: 'La La Land', year: 2016, by: 'Damien Chazelle', rating: 'PG-13', genre: 'Musical', tone: ['#1a1140', '#e9b949'], why: {
      date: 'Good music, gorgeous color, and an ending you’ll still be talking about on the walk home.',
      big: 'Shot in CinemaScope, and the planetarium scene earns a big screen.' } },
  { slug: 'about-time', title: 'About Time', year: 2013, by: 'Richard Curtis', rating: 'R', genre: 'Romance', tone: ['#261d14', '#9fb3c8'], why: {
      date: 'Romantic without getting sappy, and funny in a very British way.',
      cry: 'It sneaks up on you through a father and son, not the romance.' } },
  { slug: 'chef', title: 'Chef', year: 2014, by: 'Jon Favreau', rating: 'R', genre: 'Comedy', tone: ['#341008', '#f0b23d'], why: {
      half: 'Food truck, road trip, great soundtrack. Cook along and you miss nothing.',
      date: 'Low stakes and very hungry-making. Plan dinner after.' } },
];
const FILM = Object.fromEntries(FILMS.map(f => [f.slug, f]));

/* ── small engine bits ────────────────────────────────────────── */
function ekHash(s) { let x = EK; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 0x01000193); return x >>> 0; }

/* ── what each title costs on Aperture, and how long it runs ─────
   Prices and the add-on are fictional. Runtimes are the films' real ones. */
const EXTRA = {
  'past-lives': [106, { type: 'included' }], 'aftersun': [102, { type: 'addon', name: 'Aperture+', price: 5.99, trial: 7 }],
  'perfect-days': [124, { type: 'included' }], 'arrival': [116, { type: 'included' }],
  'dune-part-two': [166, { type: 'rent', rent: 5.99, buy: 19.99 }], 'oppenheimer': [180, { type: 'rent', rent: 5.99, buy: 19.99 }],
  'fury-road': [120, { type: 'rent', rent: 3.99, buy: 12.99 }], 'interstellar': [169, { type: 'included' }],
  'coco': [105, { type: 'included' }], 'up': [96, { type: 'included' }], 'paddington-2': [104, { type: 'included' }],
  'knives-out': [130, { type: 'included' }], 'la-la-land': [128, { type: 'rent', rent: 3.99, buy: 12.99 }],
  'about-time': [123, { type: 'addon', name: 'Aperture+', price: 5.99, trial: 7 }], 'chef': [114, { type: 'included' }],
};
FILMS.forEach(f => { f.mins = EXTRA[f.slug][0]; f.offer = EXTRA[f.slug][1]; });
const fmtMins = (m) => Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm';
const firstMood = (f) => Object.keys(f.why)[0];
const usd = (n) => '$' + n.toFixed(2);

/* ── tonight: the three questions people actually answer before picking ── */
const TIMES = [{ id: 'any', label: 'Any length', tv: 'Any length' }, { id: 'short', label: 'Under 2 hours', tv: 'Under 2h' }, { id: 'long', label: 'A long night', tv: 'Long night' }];
const WHO = [{ id: 'me', label: 'Just me', tv: 'Just me' }, { id: 'two', label: 'With someone', tv: 'Together' }, { id: 'kids', label: 'With kids', tv: 'With kids' }];
const KID_OK = new Set(['G', 'PG']);
const TonightCtx = React.createContext(null);
const useTonight = () => React.useContext(TonightCtx);

const canWatch = (f, t) => f.offer.type === 'included' || t.owned.has(f.slug) || (f.offer.type === 'addon' && t.subs.has(f.offer.name));
function fits(f, t) {
  const o = t.opts;
  if (o.time === 'short' && f.mins > 120) return false;
  if (o.time === 'long' && f.mins < 140) return false;
  if (o.who === 'kids' && !KID_OK.has(f.rating)) return false;
  if (o.now && !canWatch(f, t)) return false;
  return true;
}
const together = (films, t) => (t.opts.who === 'two' ? [...films].sort((a, b) => (b.why.date ? 1 : 0) - (a.why.date ? 1 : 0)) : films);
function filterNote(t) {
  const o = t.opts, bits = [];
  if (o.time !== 'any') bits.push(TIMES.find(x => x.id === o.time).label.toLowerCase());
  if (o.who !== 'me') bits.push(WHO.find(x => x.id === o.who).label.toLowerCase());
  if (o.now) bits.push('watch now');
  return bits.join(' · ');
}
function buildRows(mood, t) {
  const m = MOOD[mood];
  let main = together(FILMS.filter(f => f.why[mood] && fits(f, t)), t), label = 'Because you want something ' + m.chip, closest = false;
  if (!main.length) { // never a dead end: show the nearest fits and say so
    const all = FILMS.filter(f => f.why[mood]);
    main = t.opts.time === 'short' ? [...all].sort((a, b) => a.mins - b.mins) : t.opts.time === 'long' ? [...all].sort((a, b) => b.mins - a.mins) : all;
    label = 'Nothing ' + m.chip + ' fits all of that, so here are the closest'; closest = true;
  }
  const rows = [{ key: 'main', mood, label, films: main, closest }];
  const cont = t.cont.map(c => FILM[c.slug]).filter(f => t.opts.who !== 'kids' || KID_OK.has(f.rating));
  if (cont.length) rows.push({ key: 'cont', mood: null, label: 'Pick up where you left off', films: cont, cont: true });
  MOODS.filter(x => x.id !== mood).forEach(x => {
    const films = together(FILMS.filter(f => f.why[x.id] && fits(f, t)), t);
    if (films.length) rows.push({ key: x.id, mood: x.id, label: x.row, films });
  });
  return rows;
}
const rowMood = (row, f) => row.mood || firstMood(f);
const sigOf = (mood, t) => mood + JSON.stringify(t.opts) + [...t.owned, ...t.subs].join() + t.cont.map(c => c.slug).join();

function rankAll(mood, t) {
  return FILMS.filter(f => fits(f, t))
    .map(f => ({ f, s: (f.why[mood] ? 3 : 0) + (canWatch(f, t) ? 1 : 0) + (t.opts.who === 'two' && f.why.date ? 1 : 0) + (ekHash(f.slug + mood) % 100) / 100 }))
    .sort((a, b) => b.s - a.s).map(x => x.f);
}
// each "show me three others" moves to the next three in the ranking, so nothing repeats until the list runs out
function pickThree(mood, t, round) {
  const all = rankAll(mood, t); if (all.length <= 3) return { picks: all, pages: 1 };
  const pages = Math.ceil(all.length / 3), start = (round % pages) * 3;
  let picks = all.slice(start, start + 3);
  if (picks.length < 3) picks = picks.concat(all.slice(0, 3 - picks.length));
  return { picks, pages };
}

const bus = new EventTarget();
const toast = (text) => bus.dispatchEvent(new CustomEvent('toast', { detail: text }));

/* Average the vivid, bright pixels of an image so the room glows in the film's own color */
const colorCache = new Map();
function sampleColor(img) {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 28;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, 28, 28);
    const d = g.getImageData(0, 0, 28, 28).data; let r = 0, gr = 0, b = 0, w = 0;
    for (let i = 0; i < d.length; i += 4) {
      const R = d[i], G = d[i + 1], B = d[i + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B);
      const sat = mx ? (mx - mn) / mx : 0, wt = 0.04 + sat * sat * (mx / 255);
      r += R * wt; gr += G * wt; b += B * wt; w += wt;
    }
    return `rgb(${Math.round(r / w)} ${Math.round(gr / w)} ${Math.round(b / w)})`;
  } catch { return null; }
}
function useFilmColor(film) {
  const [c, setC] = useState(() => colorCache.get(film.slug) || film.tone[1]);
  useEffect(() => {
    const hit = colorCache.get(film.slug); setC(hit || film.tone[1]);
    const src = ART[film.slug] && ART[film.slug].key; if (hit || !src) return;
    let alive = true; const im = new Image(); im.decoding = 'async'; im.src = src;
    im.onload = () => { const s = sampleColor(im); if (s) { colorCache.set(film.slug, s); if (alive) setC(s); } };
    return () => { alive = false; };
  }, [film.slug]);
  return c;
}

/* The "why" endpoint. There's no server: the lines are hand-written (see the notes).
   The client is built as if there were one: abortable requests, a cache, a skeleton. */
const whyCache = new Map();
function fetchWhy(slug, mood, signal) {
  const key = slug + ':' + mood;
  if (whyCache.has(key)) return Promise.resolve(whyCache.get(key));
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      const f = FILM[slug]; const text = f.why[mood] || Object.values(f.why)[0];
      whyCache.set(key, text); resolve(text);
    }, 260 + Math.random() * 420);
    signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
}
function useWhy(slug, mood) {
  const [s, setS] = useState({ text: null, loading: true });
  useEffect(() => {
    const key = slug + ':' + mood, ctrl = new AbortController();
    if (whyCache.has(key)) { setS({ text: whyCache.get(key), loading: false }); return; }
    setS({ text: null, loading: true });
    const t = setTimeout(() => fetchWhy(slug, mood, ctrl.signal)
      .then(text => setS({ text, loading: false }))
      .catch(e => { if (e.name !== 'AbortError') setS({ text: null, loading: false }); }), 90); // debounce fast focus moves
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [slug, mood]);
  return s;
}

/* Word-by-word reveal, the way a streamed model response arrives */
function useStream(text) {
  const parts = useMemo(() => (text ? text.split(/(\s+)/) : []), [text]);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!text) { setN(0); return; }
    if (reduceMotion()) { setN(parts.length); return; }
    setN(0); let i = 0, t;
    const tick = () => { i += 2; setN(i); if (i < parts.length) t = setTimeout(tick, 22 + Math.random() * 46); };
    t = setTimeout(tick, 60);
    return () => clearTimeout(t);
  }, [text]);
  return { shown: parts.slice(0, n).join(''), done: n >= parts.length };
}

/* A damped spring, used by the iris logo */
function useSpring(target, k = 160, d = 17) {
  const [v, setV] = useState(target); const st = useRef({ x: target, v: 0 });
  useEffect(() => {
    if (reduceMotion()) { st.current.x = target; setV(target); return; }
    let raf, last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000); last = now; const s = st.current;
      s.v += (-k * (s.x - target) - d * s.v) * dt; s.x += s.v * dt; setV(s.x);
      if (Math.abs(s.v) > 0.002 || Math.abs(s.x - target) > 0.002) raf = requestAnimationFrame(step); else { s.x = target; setV(target); }
    };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

/* Fit a fixed logical canvas (1280×720, 390×844…) into whatever width the mockup has */
function Scaled({ w, h, children }) {
  const ref = useRef(); const [s, setS] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current; const fit = () => setS(el.clientWidth / w);
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className="ek-scaled" style={{ height: h * s }}>
      <div className="ek-scaled__inner" style={{ width: w, height: h, transform: `scale(${s})` }}>{children}</div>
    </div>
  );
}

/* Slide a pill under the active button of a segmented control */
function usePill(containerRef, activeKey) {
  const [box, setBox] = useState({ x: 0, w: 0 });
  useLayoutEffect(() => {
    const el = containerRef.current; if (!el) return;
    const measure = () => { const a = el.querySelector('[aria-pressed="true"]'); if (a) setBox({ x: a.offsetLeft, w: a.offsetWidth }); };
    measure(); const ro = new ResizeObserver(measure); ro.observe(el);
    document.fonts && document.fonts.ready.then(measure);
    return () => ro.disconnect();
  }, [activeKey]);
  return { transform: `translateX(${box.x}px)`, width: box.w };
}

/* ── icons ─────────────────────────────────────────────────── */
const I = {
  play: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>,
  film: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9.5v5l4-2.5-4-2.5z" fill="currentColor" stroke="none" /></svg>,
  spark: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" /></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  out: <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M4 2h6v6M10 2L3 9" /></svg>,
  lock: <svg viewBox="0 0 12 12" fill="currentColor"><path d="M3 5V4a3 3 0 0 1 6 0v1h.5A1.5 1.5 0 0 1 11 6.5v4A1.5 1.5 0 0 1 9.5 12h-7A1.5 1.5 0 0 1 1 10.5v-4A1.5 1.5 0 0 1 2.5 5H3zm1.5 0h3V4a1.5 1.5 0 0 0-3 0v1z" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  tv: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4" width="19" height="12" rx="1.5" /><path d="M9 20h6M12 16v4" /></svg>,
  web: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="2.5" y="4" width="19" height="16" rx="2" /><path d="M2.5 8.5h19" /><circle cx="5.5" cy="6.3" r=".6" fill="currentColor" /><circle cx="7.6" cy="6.3" r=".6" fill="currentColor" /></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.8" /><path d="M10.5 5h3" strokeLinecap="round" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2 3 10.4V20a1 1 0 0 0 1 1h5.5v-6h5v6H20a1 1 0 0 0 1-1v-9.6L12 3.2z" /></svg>,
  chev: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" /></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>,
  people: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="9" cy="9" r="3.4" /><path d="M3.5 19c.9-3 3-4.6 5.5-4.6s4.6 1.6 5.5 4.6" /><circle cx="16.5" cy="8" r="2.6" /><path d="M16 13.4c2.3 0 4 1.3 4.6 3.6" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
  shuffle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h4v4M4 20l16-16M20 16v4h-4M15 15l5 5M4 4l5 5" /></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></svg>,
  list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M5 7h14M5 12h14M5 17h9" /></svg>,
};

function Iris({ size = 22, open = 1, spin = 0 }) {
  // Six blades. Each line starts at a corner of the hexagonal opening and runs
  // through the next corner to the rim, which is how a real aperture icon is drawn.
  const R = 10, rin = 1.6 + open * 4.6, lines = [];
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60 + spin) * Math.PI) / 180, px = rin * Math.cos(a), py = rin * Math.sin(a);
    const dx = Math.cos(a + (2 * Math.PI) / 3), dy = Math.sin(a + (2 * Math.PI) / 3);
    const pd = px * dx + py * dy, s = -pd + Math.sqrt(pd * pd - (px * px + py * py) + R * R);
    lines.push(<line key={i} x1={px.toFixed(2)} y1={py.toFixed(2)} x2={(px + s * dx).toFixed(2)} y2={(py + s * dy).toFixed(2)} />);
  }
  return <svg className="ek-iris" viewBox="-12 -12 24 24" width={size} height={size} aria-hidden="true"><circle r={R} />{lines}</svg>;
}
function LiveIris({ mood, size }) {
  const idx = MOODS.findIndex(m => m.id === mood);
  const [closing, setClosing] = useState(false);
  useEffect(() => { setClosing(true); const t = setTimeout(() => setClosing(false), 170); return () => clearTimeout(t); }, [mood]);
  const open = useSpring(closing ? 0.05 : 1), spin = useSpring(idx * 60);
  return <Iris size={size} open={open} spin={spin} />;
}

/* ── art ───────────────────────────────────────────────────── */
function Art({ film, kind = 'key', pos }) {
  const src = ART[film.slug] && ART[film.slug][kind]; const [ok, setOk] = useState(true);
  if (src && ok) return <img className="p-art" src={src} alt="" draggable="false" decoding="async" style={pos ? { objectPosition: pos } : undefined} onError={() => setOk(false)} />;
  const h = ekHash(film.slug);
  const style = { '--a': film.tone[0], '--b': film.tone[1], '--hy': 48 + (h % 22) + '%', '--ox': 8 + (h % 40) + '%', '--oy': 8 + ((h >> 4) % 30) + '%', '--orb': 22 + ((h >> 8) % 22) + '%' };
  return <div className="p-tc" style={style} />;
}

/* ── endless carousels ──────────────────────────────────────────
   Each row renders five copies of its titles and slides over them. After a move
   settles, the position jumps back into the middle copy with the transition off,
   so you can keep going right (or left) forever without seeing a seam. */
const COPIES = 5;
const mod = (a, n) => ((a % n) + n) % n;
// rows too short to fill the screen don't loop: repeating three cards right next to themselves looks broken
const loopInit = (len, vis = 4) => (len <= vis ? { v: 0, w: 0, anim: true, moved: false, flat: true } : { v: 2 * len, w: 2 * len, anim: true, moved: false });
function loopStep(L, dv, len, vis) {
  if (L.flat) return { ...L, v: Math.max(0, Math.min(len - 1, L.v + dv)) };
  let v = L.v + dv, w = L.w;
  if (!L.moved && v < 2 * len) return L; // first visit: the row starts clean at the left edge, so going left does nothing yet
  if (v < w) w = v; else if (v > w + vis - 1) w = v - vis + 1;
  const moved = L.moved || w !== L.w;
  if (w < len || w + vis > 4 * len) { const d = 2 * len + mod(w - 2 * len, len) - w; v += d; w += d; } // never run off the ends
  return { v, w, anim: true, moved };
}
function loopPage(L, dir, len, vis) { if (L.flat || (dir < 0 && !L.moved)) return L; const w = L.w + dir * vis; return loopStep({ ...L, w, v: dir > 0 ? w : w + vis - 1 }, 0, len, vis); }
const loopHome = (L, len) => { if (L.flat) return L; const d = 2 * len + mod(L.w - 2 * len, len) - L.w; return d ? { ...L, v: L.v + d, w: L.w + d, anim: false } : L; };

function useSettle(loops, setLoops, lens) {
  // once a slide has finished, quietly re-center every row in its middle copy
  useEffect(() => {
    if (!loops.some((L, i) => !L.flat && (L.w < 2 * lens[i] || L.w >= 3 * lens[i]))) return;
    const t = setTimeout(() => setLoops(ls => ls.map((L, i) => loopHome(L, lens[i]))), 650);
    return () => clearTimeout(t);
  }, [loops]);
  useEffect(() => {
    if (loops.every(L => L.anim)) return;
    let r2; const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setLoops(ls => ls.map(L => (L.anim ? L : { ...L, anim: true })))); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [loops]);
}
const tripled = (films, L) => (L && L.flat ? films : null) || Array.from({ length: COPIES * films.length }, (_, i) => films[i % films.length]);

/* Phone rows scroll natively, so the loop is done with scrollLeft instead */
function LoopScroll({ films, children, min = 3 }) {
  const ref = useRef(); const t = useRef();
  const loop = films.length > min;
  const items = useMemo(() => (loop ? [...films, ...films, ...films] : films), [films]);
  const moved = useRef(false);
  useLayoutEffect(() => { ref.current.scrollLeft = 0; moved.current = false; }, [films]);
  const onScroll = () => {
    if (!loop) return;
    clearTimeout(t.current);
    t.current = setTimeout(() => {
      const el = ref.current, third = el.scrollWidth / 3;
      if (el.scrollLeft > third * 1.5) { el.scrollLeft -= third; moved.current = true; }
      else if (el.scrollLeft >= third) moved.current = true;
      else if (moved.current && el.scrollLeft < third * 0.5) el.scrollLeft += third; // left wrap only after a full forward pass
    }, 120);
  };
  return <div ref={ref} className="p-track p-scrollx" onScroll={onScroll}>{items.map((f, i) => children(f, i))}</div>;
}

/* ── you ───────────────────────────────────────────────────── */
const ME = { name: 'Erfan Kooshesh', handle: '@erfesh', avatar: (window.__EK_ART__ || {}).__avatar,
  line: 'Film and TV recommendations for 260K+ people on Instagram, TikTok and YouTube.',
  favorites: ['past-lives', 'interstellar', 'arrival', 'la-la-land', 'coco', 'dune-part-two'] };
function Avatar({ size = 30, onClick, focused }) {
  const inner = ME.avatar ? <img src={ME.avatar} alt="" /> : <span>EK</span>;
  return <button className={'p-avatar' + (focused ? ' is-focus' : '')} style={{ width: size, height: size, fontSize: size * 0.36 }} onClick={onClick} aria-label="Open profile" title={ME.name}>{inner}</button>;
}
const moodLog = new Map(); // moods picked this visit, shown on the profile
function logMood(id) { moodLog.set(id, (moodLog.get(id) || 0) + 1); }
logMood('slow'); // the mood the page opens on

function Profile({ device, onClose, onOpenFilm }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape' || (device === 'tv' && e.key === 'Backspace')) { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose, device]);
  const total = [...moodLog.values()].reduce((a, b) => a + b, 0);
  return (
    <div className="p-detail p-profile" role="dialog" aria-label="Profile">
      <div className="p-detail__back" onClick={onClose} />
      <div className="p-detail__panel">
        {device === 'phone' && <div className="p-detail__grab" />}
        {device !== 'tv' ? <button className="p-close" onClick={onClose} aria-label="Close">{I.close}</button>
          : <button className="p-back-hint" onClick={onClose} aria-label="Back"><span className="p-back-hint__chev">{I.chev}</span></button>}
        <div className="p-profile__cover"><Art film={FILM[ME.favorites[0]]} /><div className="p-scrim-b" /></div>
        <div className="p-profile__body">
          <div className="p-profile__head">
            <div className="p-profile__ring"><Avatar size={device === 'tv' ? 112 : 88} /></div>
            <div>
              <h2 className="p-title is-in">{ME.name}</h2>
              <div className="p-meta"><span>{ME.handle}</span><span>·</span><span>Film and TV</span></div>
              <p className="p-profile__line">{ME.line}</p>
            </div>
          </div>
          <div className="p-profile__sec">
            <div className="p-row__label">Favorites<small>{ME.favorites.length} titles</small></div>
            <div className="p-profile__favs">
              {ME.favorites.map((slug, i) => <Card key={slug} film={FILM[slug]} kind="poster" delay={i * 60} onOpen={() => onOpenFilm && onOpenFilm(slug)} />)}
            </div>
          </div>
          <div className="p-profile__sec">
            <div className="p-row__label">Moods this visit<small>{total} picks</small></div>
            <div className="p-profile__moods">
              {MOODS.map(m => { const n = moodLog.get(m.id) || 0; return (
                <div key={m.id} className="p-profile__mood"><span>{m.row}</span><i style={{ '--w': total ? (n / total) * 100 + '%' : '0%' }} /><b>{n}</b></div>
              ); })}
            </div>
          </div>
          {device !== 'tv' && <div className="p-actions">
            <a className="p-btn p-btn--primary" href="https://erfesh.com" target="_blank" rel="noopener">erfesh.com</a>
            <a className="p-btn" href="https://www.linkedin.com/in/erfesh" target="_blank" rel="noopener">LinkedIn</a>
          </div>}
        </div>
      </div>
    </div>
  );
}

/* ── product pieces ────────────────────────────────────────── */
function Why({ slug, mood, compact }) {
  const { text, loading } = useWhy(slug, mood);
  const { shown, done } = useStream(text);
  return (
    <div className="p-why" aria-live="polite">
      <div className="p-why__label">{I.spark}Why this, tonight</div>
      {loading
        ? <div className="p-skel"><i style={{ width: '94%' }} /><i style={{ width: '78%' }} />{!compact && <i style={{ width: '52%' }} />}</div>
        : <div className="p-why__text">{shown}{!done && <span className="p-caret" />}</div>}
    </div>
  );
}

function Meta({ film }) {
  return <div className="p-meta"><span>{film.year}</span><span>·</span><span>{film.by}</span><span>·</span><span>{fmtMins(film.mins)}</span><b>{film.rating}</b><span>{film.genre}</span></div>;
}

/* What the main button says is decided by what you'd actually have to do to watch */
function useOffer(film) {
  const t = useTonight(); const c = t.cont.find(x => x.slug === film.slug);
  const left = c ? Math.round(film.mins * (1 - c.pct)) : 0;
  if (canWatch(film, t)) return { watch: true, label: c ? 'Resume' : 'Play', note: c ? (left >= 60 ? fmtMins(left) : left + 'm') + ' left' : null, cont: c };
  if (film.offer.type === 'rent') return { watch: false, label: 'Rent ' + usd(film.offer.rent), badge: 'Rent ' + usd(film.offer.rent) };
  return { watch: false, label: 'Try ' + film.offer.name + ' free', badge: film.offer.name };
}

function listAction(film, t) {
  const on = t.listed.has(film.slug);
  return { label: on ? 'On my list' : 'My list', icon: on ? I.check : I.plus, run: () => { t.toggleList(film.slug); toast(on ? film.title + ' removed from My list' : film.title + ' added to My list'); } };
}
function ListButton({ film, icon }) {
  const t = useTonight(), a = listAction(film, t);
  return <button className={'p-btn' + (icon ? ' p-btn--icon' : '') + (t.listed.has(film.slug) ? ' is-on' : '')} aria-label={a.label} onClick={a.run}>{a.icon}{!icon && a.label}</button>;
}

function Hero({ film, mood, device, onOpen }) {
  const [layers, setLayers] = useState([film.slug]);
  useEffect(() => { setLayers(ls => (ls[ls.length - 1] === film.slug ? ls : [...ls.slice(-1), film.slug])); }, [film.slug]);
  const pos = device === 'web' ? 'center 30%' : undefined, offer = useOffer(film);
  return (
    <div className="p-hero">
      {layers.map((slug, i) => (
        <div key={slug} className={'p-hero__layer' + (i === layers.length - 1 && layers.length > 1 ? ' is-in' : '')}>
          <div className="p-hero__media"><Art film={FILM[slug]} pos={pos} /></div>
        </div>
      ))}
      <div className="p-scrim-l" /><div className="p-scrim-b" />
      <div className="p-copy">
        <div className="p-kicker"><i />{MOOD[mood].row}{!offer.watch && <span className="p-price">{offer.badge}</span>}</div>
        <h2 key={film.slug} className="p-title is-in">{film.title}</h2>
        <Meta film={film} />
        <Why slug={film.slug} mood={mood} compact={device === 'phone'} />
        <div className="p-actions">
          <button className="p-btn p-btn--primary" onClick={() => (offer.watch ? toast('Playback isn’t part of this prototype') : onOpen && onOpen())}>{offer.watch && I.play}{offer.label}{offer.note && <em>{offer.note}</em>}</button>
          <ListButton film={film} icon={device === 'phone'} />
        </div>
      </div>
    </div>
  );
}

/* Tonight bar: mood, length, who's watching, "watch now" and Pick for me, in one row */
const BAR_LEN = MOODS.length + 4;
function TonightBar({ mood, setMood, focusIdx = -1, device, onPick }) {
  const t = useTonight(), o = t.opts, tv = device === 'tv';
  const ref = useRef(); const pill = usePill(ref, mood);
  const cycle = (list, key) => () => t.setOpts(x => ({ ...x, [key]: list[(list.findIndex(i => i.id === x[key]) + 1) % list.length].id }));
  const f = (i) => (focusIdx === i ? ' is-focus' : '');
  const time = TIMES.find(x => x.id === o.time), who = WHO.find(x => x.id === o.who);
  return (
    <div className="p-tonight">
      <div className="p-chipscroll">
        <div className="p-chips" ref={ref} role="group" aria-label="Mood">
          <span className="p-chips__pill" style={pill} />
          {MOODS.map((m, i) => <button key={m.id} className={'p-chip' + f(i)} aria-pressed={m.id === mood} onClick={() => setMood(m.id)}>{m.chip}</button>)}
        </div>
      </div>
      <div className="p-tokens">
        <button className={'p-token' + (o.time !== 'any' ? ' is-set' : '') + f(MOODS.length)} onClick={cycle(TIMES, 'time')} aria-label={'Length: ' + time.label}>{I.clock}{tv ? time.tv : time.label}</button>
        <button className={'p-token' + (o.who !== 'me' ? ' is-set' : '') + f(MOODS.length + 1)} onClick={cycle(WHO, 'who')} aria-label={'Watching: ' + who.label}>{I.people}{tv ? who.tv : who.label}</button>
        <button className={'p-token p-token--switch' + (o.now ? ' is-set' : '') + f(MOODS.length + 2)} role="switch" aria-checked={o.now} onClick={() => t.setOpts(x => ({ ...x, now: !x.now }))}><i />Watch now</button>
        <button className={'p-token p-token--pick' + f(MOODS.length + 3)} onClick={onPick}>{I.spark}Pick for me</button>
      </div>
    </div>
  );
}

function Card({ film, kind = 'key', focused, ghost, delay = 0, onFocus, onOpen, onDone }) {
  const offer = useOffer(film);
  const card = (
    <button className={'p-card' + (kind === 'poster' ? ' p-card--poster' : '') + (focused ? ' is-focus' : '') + (ghost ? ' is-ghost' : '')} style={{ '--d': delay + 'ms' }} tabIndex={ghost ? -1 : undefined} aria-hidden={ghost || undefined}
      onMouseEnter={onFocus} onFocus={onFocus} onClick={onOpen} aria-label={film.title + ', ' + film.year + (offer.badge ? ', ' + offer.badge : '')}>
      <Art film={film} kind={kind} />
      {offer.badge && <span className="p-badge">{offer.badge}</span>}
      {kind === 'key' && <><div className="p-card__scrim" /><div className="p-card__label"><strong>{film.title}</strong><span>{offer.cont ? offer.note : film.year + ' · ' + fmtMins(film.mins)}</span></div></>}
      {offer.cont && <span className="p-progress"><i style={{ width: offer.cont.pct * 100 + '%' }} /></span>}
    </button>
  );
  if (!onDone) return card;
  return <div className={'p-cardwrap' + (ghost ? ' is-ghost' : '')}>{card}<button className="p-done" onClick={onDone} aria-label={'Remove ' + film.title + ' from Continue watching'} tabIndex={ghost ? -1 : undefined}>{I.close}<span>Done</span></button></div>;
}

/* One honest step between you and a purchase: what it costs, what you get, how to undo it */
function Confirm({ film, kind, onClose, onDone }) {
  const o = film.offer;
  const rows = kind === 'trial'
    ? [['Free for', o.trial + ' days'], ['Then', usd(o.price) + ' a month'], ['Reminder', '2 days before it ends'], ['Cancel', 'Anytime in Settings, two taps']]
    : kind === 'buy' ? [['Price', usd(o.buy)], ['Yours to keep', 'Watch anytime, on any device']]
    : [['Price', usd(o.rent)], ['Time to watch', '30 days to start, 48 hours to finish']];
  const title = kind === 'trial' ? 'Start your free week of ' + o.name : (kind === 'buy' ? 'Buy ' : 'Rent ') + film.title;
  const cta = kind === 'trial' ? 'Start free trial' : kind === 'buy' ? 'Buy for ' + usd(o.buy) : 'Rent for ' + usd(o.rent);
  return (
    <div className="p-confirm" role="dialog" aria-label={title}>
      <div className="p-confirm__card">
        <div className="p-kicker"><i />{kind === 'trial' ? 'Add-on' : 'Checkout'}</div>
        <h3>{title}</h3>
        <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}<div><dt>Pay with</dt><dd>Visa ending 4242</dd></div></dl>
        <div className="p-actions">
          <button className="p-btn p-btn--primary is-focus" onClick={onDone}>{cta}</button>
          <button className="p-btn" onClick={onClose}>Not now</button>
        </div>
      </div>
    </div>
  );
}

function Detail({ film, mood, device, onClose }) {
  const t = useTonight(), offer = useOffer(film);
  const [confirm, setConfirm] = useState(null); const [fi, setFi] = useState(0);
  const box = useRef();
  const done = () => {
    if (confirm === 'trial') { t.subscribe(film.offer.name); toast('Your free week of ' + film.offer.name + ' has started'); }
    else { t.own(film.slug); toast(confirm === 'buy' ? film.title + ' is yours' : 'Rented. You have 30 days to start it.'); }
    setConfirm(null);
  };
  const actions = offer.watch
    ? [{ label: offer.label, note: offer.note, primary: true, icon: I.play, run: () => toast('Playback isn’t part of this prototype') },
       ...(offer.cont ? [{ label: 'I’m done with this', run: () => { t.clearCont(film.slug); toast(film.title + ' removed from Continue watching'); } }] : []),
       listAction(film, t)]
    : film.offer.type === 'rent'
      ? [{ label: 'Rent ' + usd(film.offer.rent), primary: true, run: () => setConfirm('rent') }, { label: 'Buy ' + usd(film.offer.buy), run: () => setConfirm('buy') }]
      : [{ label: 'Try ' + film.offer.name + ' free', primary: true, run: () => setConfirm('trial') }, listAction(film, t)];
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape' || (device === 'tv' && e.key === 'Backspace')) { e.preventDefault(); confirm ? setConfirm(null) : onClose(); return; }
      if (device !== 'tv') return;
      if (confirm) { if (e.key === 'Enter') { e.preventDefault(); done(); } return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFi(x => Math.max(0, x - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFi(x => Math.min(actions.length - 1, x + 1)); }
      if (e.key === 'Enter') { e.preventDefault(); actions[Math.min(fi, actions.length - 1)].run(); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  const fits2 = Object.keys(film.why).filter(m => m !== mood).map(m => MOOD[m].row);
  const note = !offer.watch && (film.offer.type === 'rent' ? 'Not included with Aperture. Rent it for 48 hours or buy it to keep.' : 'Part of the ' + film.offer.name + ' add-on, ' + usd(film.offer.price) + ' a month after a free week.');
  return (
    <div className="p-detail" role="dialog" aria-label={film.title} ref={box}>
      <div className="p-detail__back" onClick={onClose} />
      <div className="p-detail__panel">
        {device === 'phone' && <div className="p-detail__grab" />}
        {device !== 'tv' && <button className="p-close" onClick={onClose} aria-label="Close">{I.close}</button>}
        {device === 'tv' && <button className="p-back-hint" onClick={onClose} aria-label="Back"><span className="p-back-hint__chev">{I.chev}</span></button>}
        <div className="p-detail__art"><Art film={film} /><div className="p-scrim-b" />{device === 'tv' && <div className="p-scrim-l" />}</div>
        {device === 'tv' && <div className="p-detail__poster"><Art film={film} kind="poster" /></div>}
        <div className="p-detail__body">
          <div className="p-kicker"><i />{MOOD[mood].row}{!offer.watch && <span className="p-price">{offer.badge}</span>}</div>
          <h2 className="p-title is-in">{film.title}</h2>
          <Meta film={film} />
          <Why slug={film.slug} mood={mood} />
          {note && <p className="p-offer-note">{note}</p>}
          {fits2.length > 0 && <div className="p-fits">{fits2.map(f => <span key={f}>Also: {f.toLowerCase()}</span>)}</div>}
          <div className="p-actions">
            {actions.map((a, i) => (
              <button key={a.label} className={'p-btn' + (a.primary ? ' p-btn--primary' : '') + (device === 'tv' && i === Math.min(fi, actions.length - 1) ? ' is-focus' : '')} onClick={a.run}>{a.icon}{a.label}{a.note && <em>{a.note}</em>}</button>
            ))}
          </div>
        </div>
        {confirm && <Confirm film={film} kind={confirm} onClose={() => setConfirm(null)} onDone={done} />}
      </div>
    </div>
  );
}

/* Pick for me: three choices, not three hundred */
function Picks({ device, mood, onOpen, onClose }) {
  const t = useTonight(); const [seed, setSeed] = useState(0); const [fi, setFi] = useState(0);
  const { picks, pages } = useMemo(() => pickThree(mood, t, seed), [mood, t.opts, t.owned, t.subs, seed]);
  const more = () => { if (pages < 2) { toast('That’s everything that fits right now'); return; } setSeed(x => x + 1); setFi(0); };
  const summary = ['Something ' + MOOD[mood].chip, t.opts.time !== 'any' && TIMES.find(x => x.id === t.opts.time).label.toLowerCase(), t.opts.who !== 'me' && WHO.find(x => x.id === t.opts.who).label.toLowerCase()].filter(Boolean).join(', ') + '.';
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape' || (device === 'tv' && e.key === 'Backspace')) { e.preventDefault(); onClose(); return; }
      if (device !== 'tv') return;
      const n = picks.length + 1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFi(x => Math.max(0, x - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFi(x => Math.min(n - 1, x + 1)); }
      if (e.key === 'Enter') { e.preventDefault(); fi < picks.length ? onOpen(picks[fi]) : more(); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  return (
    <div className="p-detail p-picks" role="dialog" aria-label="Three for tonight">
      <div className="p-detail__back" onClick={onClose} />
      <div className="p-detail__panel">
        {device === 'tv' ? <button className="p-back-hint" onClick={onClose} aria-label="Back"><span className="p-back-hint__chev">{I.chev}</span></button> : <button className="p-close" onClick={onClose} aria-label="Close">{I.close}</button>}
        <div className="p-picks__head">
          <div className="p-kicker"><i />Pick for me</div>
          <h2 className="p-title is-in">Three for tonight</h2>
          <p>{summary}</p>
        </div>
        {picks.length ? (
          <div className="p-picks__grid" key={seed}>
            {picks.map((f, i) => (
              <button key={f.slug} className={'p-pick' + (device === 'tv' && fi === i ? ' is-focus' : '')} style={{ '--d': i * 90 + 'ms' }} onMouseEnter={() => setFi(i)} onClick={() => onOpen(f)}>
                <div className="p-pick__art"><Art film={f} /><PickBadge film={f} /></div>
                <strong>{f.title}</strong>
                <span className="p-pick__meta">{f.year} · {fmtMins(f.mins)} · {f.rating}</span>
                <span className="p-pick__why">{f.why[mood] || f.why[firstMood(f)]}</span>
              </button>
            ))}
          </div>
        ) : <p className="p-picks__empty">Nothing fits all of that tonight. Try a different length, or turn off Watch now.</p>}
        <div className="p-picks__foot">
          <button className={'p-btn' + (device === 'tv' && fi === picks.length ? ' is-focus' : '')} onClick={more}>{I.shuffle}{pages > 1 ? 'Show me three others' : 'That’s all that fits'}</button>
        </div>
      </div>
    </div>
  );
}
function PickBadge({ film }) { const o = useOffer(film); return o.badge ? <span className="p-badge">{o.badge}</span> : <span className="p-badge p-badge--ok">{I.check}Included</span>; }

/* ── spatial navigation for the TV pages ───────────────────────
   Anything marked data-focus can be reached with the arrow keys. The next
   element is the nearest one in the pressed direction, with sideways drift
   weighted heavier, which is how TV operating systems move focus. */
function useSpatial(ref, active, { onBack, onFocusEl, resetKey } = {}) {
  const cb = useRef(); cb.current = { onBack, onFocusEl };
  useEffect(() => {
    if (!active) return;
    const root = ref.current; if (!root) return;
    const all = () => [...root.querySelectorAll('[data-focus]')].filter(el => el.getClientRects().length && !el.closest('.is-ghost'));
    const cur = () => root.querySelector('[data-sfocus]');
    const set = (el) => {
      const c = cur(); if (c) c.removeAttribute('data-sfocus');
      if (!el) return; el.setAttribute('data-sfocus', '');
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
      cb.current.onFocusEl && cb.current.onFocusEl(el);
    };
    const first = () => root.querySelector('[data-focus-first]') || all().find(el => !el.closest('.p-nav')) || all()[0];
    const raf = requestAnimationFrame(() => { if (!cur() || !root.contains(cur())) set(first()); });
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const onKey = (e) => {
      if (e.defaultPrevented) return;
      if (dirs[e.key]) {
        e.preventDefault();
        const c = cur() || first(); if (!c) return;
        const [dx, dy] = dirs[e.key], r = c.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        let best = null, bd = Infinity;
        for (const el of all()) {
          if (el === c) continue;
          const q = el.getBoundingClientRect(), ex = dx ? (dx > 0 ? q.left : q.right) : q.left + q.width / 2, ey = dy ? (dy > 0 ? q.top : q.bottom) : q.top + q.height / 2;
          const ox = dx ? (dx > 0 ? r.right : r.left) : cx, oy = dy ? (dy > 0 ? r.bottom : r.top) : cy;
          const along = dx ? (ex - ox) * dx : (ey - oy) * dy; if (along < -2) continue;
          const across = dx ? Math.abs(q.top + q.height / 2 - cy) : Math.abs(q.left + q.width / 2 - cx);
          const d = along + across * 2.4; if (d < bd) { bd = d; best = el; }
        }
        if (best) set(best);
      } else if (e.key === 'Enter') { const c = cur(); if (c) { e.preventDefault(); c.click(); } }
      else if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); cb.current.onBack && cb.current.onBack(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
  }, [active, resetKey]);
}

/* ── Browse ─────────────────────────────────────────────────── */
const SORTS = [
  { id: 'fit', label: 'Best for tonight', fn: (a, b, t, mood) => rankAll(mood, t).indexOf(a) - rankAll(mood, t).indexOf(b) },
  { id: 'az', label: 'A to Z', fn: (a, b) => a.title.localeCompare(b.title) },
  { id: 'new', label: 'Newest', fn: (a, b) => b.year - a.year },
  { id: 'short', label: 'Shortest', fn: (a, b) => a.mins - b.mins },
];
function BrowsePage({ device, mood, goMood, onOpen, onHero }) {
  const t = useTonight(); const [sort, setSort] = useState('fit');
  const ranked = useMemo(() => rankAll(mood, t), [mood, t.opts, t.owned, t.subs]);
  const list = useMemo(() => {
    const base = sort === 'fit' ? [...ranked, ...FILMS.filter(f => !ranked.includes(f))] : [...FILMS].sort((a, b) => SORTS.find(s => s.id === sort).fn(a, b, t, mood));
    return base;
  }, [sort, ranked]);
  return (
    <div className="p-page">
      <div className="p-page__head"><div className="p-kicker"><i />Browse</div><h2 className="p-title is-in">Every mood, and everything on Aperture</h2></div>
      <div className="p-moodtiles">
        {MOODS.map((m, i) => {
          const films = FILMS.filter(f => f.why[m.id]);
          return (
            <button key={m.id} className={'p-moodtile' + (m.id === mood ? ' is-on' : '')} data-focus data-focus-first={i === 0 || undefined} style={{ '--d': i * 60 + 'ms' }}
              onClick={() => goMood(m.id)} onMouseEnter={() => onHero(films[0])} data-slug={films[0].slug}>
              <div className="p-moodtile__art">{films.slice(0, 3).map((f, j) => <div key={f.slug} className="p-moodtile__cell" style={{ '--j': j }}><Art film={f} /></div>)}</div>
              <div className="p-moodtile__scrim" />
              <div className="p-moodtile__label"><strong>{m.row}</strong><span>{films.length} titles</span></div>
            </button>
          );
        })}
      </div>
      <div className="p-page__bar">
        <div className="p-row__label">All titles<small>{FILMS.length} titles</small></div>
        <div className="p-sorts" role="group" aria-label="Sort">
          {SORTS.map(s => <button key={s.id} className="p-token" data-focus aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</button>)}
        </div>
      </div>
      <div className="p-grid">
        {list.map((f, i) => <PosterTile key={f.slug} film={f} delay={i * 30} onOpen={() => onOpen(f)} onHero={onHero} fit={sort === 'fit' && ranked.includes(f)} />)}
      </div>
    </div>
  );
}
function PosterTile({ film, delay = 0, onOpen, onHero, fit, extra }) {
  const offer = useOffer(film);
  return (
    <button className="p-tile" data-focus data-slug={film.slug} style={{ '--d': delay + 'ms' }} onClick={onOpen} onMouseEnter={() => onHero && onHero(film)} aria-label={film.title}>
      <div className="p-tile__art"><Art film={film} kind="poster" />{offer.badge && <span className="p-badge">{offer.badge}</span>}{offer.cont && <span className="p-progress"><i style={{ width: offer.cont.pct * 100 + '%' }} /></span>}</div>
      <strong>{film.title}</strong>
      <span>{extra || (film.year + ' · ' + fmtMins(film.mins))}</span>
    </button>
  );
}

/* ── My stuff ───────────────────────────────────────────────── */
function MinePage({ device, onOpen, onHero }) {
  const t = useTonight(); const [cancel, setCancel] = useState(false);
  const cont = t.cont.map(c => FILM[c.slug]);
  const list = [...t.listed].map(s => FILM[s]);
  const owned = [...t.owned].map(s => FILM[s]);
  const member = t.subs.has('Aperture+');
  const plus = FILMS.filter(f => f.offer.type === 'addon');
  return (
    <div className="p-page">
      <div className="p-page__head"><div className="p-kicker"><i />My stuff</div><h2 className="p-title is-in">Everything that’s yours</h2></div>

      <section className="p-mine">
        <div className="p-row__label">Pick up where you left off<small>{cont.length} titles</small></div>
        {cont.length ? (
          <div className="p-mine__cont">
            {cont.map((f, i) => (
              <div key={f.slug} className="p-mine__c">
                <Card film={f} delay={i * 50} onFocus={() => onHero(f)} onOpen={() => onOpen(f)} />
                <button className="p-mine__done" data-focus onClick={() => { t.clearCont(f.slug); toast(f.title + ' removed from Continue watching'); }}>{I.close}I’m done with this</button>
              </div>
            ))}
          </div>
        ) : <p className="p-empty">You’re all caught up. Anything you start shows up here, and you can clear it in one tap.</p>}
      </section>

      <section className="p-mine">
        <div className="p-row__label">My list<small>{list.length} titles</small></div>
        {list.length ? <div className="p-grid p-grid--short">{list.map((f, i) => <PosterTile key={f.slug} film={f} delay={i * 40} onOpen={() => onOpen(f)} onHero={onHero} />)}</div>
          : <p className="p-empty">Nothing saved yet. Use My list on any title to keep it here.</p>}
      </section>

      <section className="p-mine">
        <div className="p-row__label">Rented and bought<small>{owned.length} titles</small></div>
        {owned.length ? <div className="p-grid p-grid--short">{owned.map((f, i) => <PosterTile key={f.slug} film={f} delay={i * 40} onOpen={() => onOpen(f)} onHero={onHero} extra="Rented · 30 days to start" />)}</div>
          : <p className="p-empty">Nothing rented or bought. Titles that cost extra always say so before you pay.</p>}
      </section>

      <section className="p-mine">
        <div className="p-plan">
          <div className="p-plan__art">{plus.map((f, i) => <div key={f.slug} className="p-plan__p" style={{ '--i': i }}><Art film={f} kind="poster" /></div>)}</div>
          <div className="p-plan__body">
            <div className="p-kicker"><i />{member ? 'Your plan' : 'Add-on'}</div>
            <h3>Aperture+</h3>
            <p>{member ? 'Free week is on. 7 days left, then $5.99 a month. We’ll remind you 2 days before it ends.' : 'Adds hand-picked arthouse films like ' + plus.map(f => f.title).join(' and ') + '. 7 days free, then $5.99 a month.'}</p>
            <div className="p-actions">
              {member ? <button className="p-btn" data-focus onClick={() => setCancel(true)}>Cancel Aperture+</button>
                : <button className="p-btn p-btn--primary" data-focus onClick={() => { t.subscribe('Aperture+'); toast('Your free week of Aperture+ has started'); }}>Try Aperture+ free</button>}
            </div>
          </div>
        </div>
      </section>
      {cancel && (
        <div className="p-confirm" role="dialog" aria-label="Cancel Aperture+">
          <div className="p-confirm__card">
            <div className="p-kicker"><i />Your plan</div>
            <h3>Cancel Aperture+?</h3>
            <dl><div><dt>You keep it until</dt><dd>The end of your free week</dd></div><div><dt>You won’t be charged</dt><dd>$5.99 a month stops</dd></div><div><dt>Come back</dt><dd>Anytime, from here</dd></div></dl>
            <div className="p-actions">
              <button className="p-btn p-btn--primary" data-focus data-focus-first onClick={() => { t.unsubscribe('Aperture+'); setCancel(false); toast('Aperture+ is canceled. No charge.'); }}>Cancel Aperture+</button>
              <button className="p-btn" data-focus onClick={() => setCancel(false)}>Keep it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Search ─────────────────────────────────────────────────────
   Titles, people and genres match as you type. Words that describe a feeling
   or a constraint ("sad", "short", "kids") match moods and filters too. */
const HINTS = [
  { re: /\b(sad|cry|tears|emotional|weep)/, mood: 'cry' }, { re: /\b(slow|quiet|calm|patient)/, mood: 'slow' },
  { re: /\b(date|romantic|romance|love)/, mood: 'date' }, { re: /\b(easy|background|chill|cozy|cosy|comfort)/, mood: 'half' },
  { re: /\b(epic|imax|big|spectacle|loud)/, mood: 'big' },
];
function runSearch(q) {
  const s = q.trim().toLowerCase(); if (!s) return { films: [], moods: [], tags: [] };
  const moods = [...new Set(HINTS.filter(h => h.re.test(s)).map(h => h.mood))];
  const tags = [];
  let films = FILMS.filter(f => [f.title, f.by, f.genre].some(x => x.toLowerCase().includes(s)) || s.split(/\s+/).some(w => w.length > 2 && (f.title + ' ' + f.by + ' ' + f.genre).toLowerCase().includes(w)));
  if (/\b(short|quick|under)/.test(s)) { tags.push('under 2 hours'); films = films.concat(FILMS.filter(f => f.mins <= 110)); }
  if (/\b(kid|kids|family|children)/.test(s)) { tags.push('fine for kids'); films = films.concat(FILMS.filter(f => KID_OK.has(f.rating))); }
  if (/\b(free|included)/.test(s)) { tags.push('included'); films = films.concat(FILMS.filter(f => f.offer.type === 'included')); }
  moods.forEach(m => { films = films.concat(FILMS.filter(f => f.why[m])); });
  return { films: [...new Set(films)], moods, tags };
}
const KEYS = 'abcdefghijklmnopqrstuvwxyz'.split('');
function SearchPage({ device, mood, goMood, onOpen, onHero }) {
  const t = useTonight(); const [q, setQ] = useState('');
  const input = useRef();
  const res = useMemo(() => runSearch(q), [q]);
  const fallback = useMemo(() => pickThree(mood, t, 0).picks, [mood]);
  const tv = device === 'tv';
  useEffect(() => { if (!tv && input.current) input.current.focus({ preventScroll: true }); }, []);
  useEffect(() => { // on TV, letters typed on a keyboard work too, and Backspace deletes before it goes back
    if (!tv) return;
    const k = (e) => {
      if (e.key.length === 1 && /[a-z0-9 ]/i.test(e.key)) { e.preventDefault(); setQ(x => (x + e.key.toLowerCase()).slice(0, 30)); }
      else if (e.key === 'Backspace' && qRef.current) { e.preventDefault(); setQ(x => x.slice(0, -1)); }
    };
    window.addEventListener('keydown', k, true); return () => window.removeEventListener('keydown', k, true);
  }, []);
  const qRef = useRef(q); qRef.current = q;
  const suggestions = ['something to cry over', 'Denis Villeneuve', 'short', 'kids', 'Nolan', 'romantic'];
  return (
    <div className={'p-page p-search' + (tv ? ' p-search--tv' : '')}>
      <div className="p-search__side">
        <div className="p-page__head"><div className="p-kicker"><i />Search</div></div>
        {tv ? <div className="p-search__field" aria-live="polite">{I.search}<span>{q || <em>Titles, people, moods</em>}</span></div>
          : <label className="p-search__field">{I.search}<input ref={input} id="ek-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titles, people, moods" autoComplete="off" spellCheck="false" />{q && <button className="p-search__clear" onClick={() => setQ('')} aria-label="Clear">{I.close}</button>}</label>}
        {tv && (
          <div className="p-keys">
            {KEYS.map((k, i) => <button key={k} className="p-key" data-focus data-focus-first={i === 0 || undefined} onClick={() => setQ(x => (x + k).slice(0, 30))}>{k}</button>)}
            <button className="p-key p-key--wide" data-focus onClick={() => setQ(x => x + ' ')}>space</button>
            <button className="p-key p-key--wide" data-focus onClick={() => setQ(x => x.slice(0, -1))}>delete</button>
            <button className="p-key p-key--wide" data-focus onClick={() => setQ('')}>clear</button>
          </div>
        )}
        {!q && <div className="p-search__try"><span>Try</span>{suggestions.map(s => <button key={s} className="p-token" data-focus onClick={() => setQ(s.toLowerCase())}>{s}</button>)}</div>}
      </div>
      <div className="p-search__main">
        {res.moods.length > 0 && (
          <div className="p-search__moods">
            {res.moods.map(m => <button key={m} className="p-moodlink" data-focus onClick={() => goMood(m)}>{I.spark}<span>Sounds like you want something <b>{MOOD[m].chip}</b></span>{I.chev}</button>)}
          </div>
        )}
        {q && res.films.length > 0 && <div className="p-row__label">Results<small>{res.films.length} titles{res.tags.length ? ' · ' + res.tags.join(' · ') : ''}</small></div>}
        {q && res.films.length > 0 && <div className="p-grid p-grid--search">{res.films.map((f, i) => <PosterTile key={f.slug} film={f} delay={i * 25} onOpen={() => onOpen(f)} onHero={onHero} />)}</div>}
        {q && !res.films.length && (
          <div className="p-search__none">
            <p><b>Nothing on Aperture matches “{q}”.</b> It may be on another service. Here’s what fits your mood tonight instead.</p>
            <div className="p-grid p-grid--short">{fallback.map((f, i) => <PosterTile key={f.slug} film={f} delay={i * 40} onOpen={() => onOpen(f)} onHero={onHero} />)}</div>
          </div>
        )}
        {!q && <div className="p-search__blank"><Iris size={54} /><p>Search by title, director or genre. Or describe the night you want, like “something sad” or “short and funny”.</p></div>}
      </div>
    </div>
  );
}

/* ── the three surfaces ─────────────────────────────────────── */
function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 30000); return () => clearInterval(i); }, []);
  return t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function RowLabel({ row, t, extra }) {
  const note = row.key === 'main' && !row.closest ? filterNote(t) : '';
  return <div className="p-row__label">{row.label}<small>{row.films.length} titles{note && ' · ' + note}</small>{extra}</div>;
}
const openFor = (row, f) => ({ slug: f.slug, mood: rowMood(row, f) });
const PAGES = [{ id: 'tonight', label: 'Tonight' }, { id: 'browse', label: 'Browse' }, { id: 'mine', label: 'My stuff' }, { id: 'search', label: 'Search' }];
function PageBody({ page, ...props }) {
  return page === 'browse' ? <BrowsePage {...props} /> : page === 'mine' ? <MinePage {...props} /> : <SearchPage {...props} />;
}

const TV_STEP = 262 + 20, TV_VIS = 4, ROW_H = 214;
function TV({ mood, setMood, onHero, active }) {
  const t = useTonight();
  const sig = sigOf(mood, t);
  const rows = useMemo(() => buildRows(mood, t), [sig]);
  const lens = useMemo(() => rows.map(r => r.films.length), [rows]);
  const [zone, setZone] = useState('rows'); const [r, setR] = useState(0); const [m, setM] = useState(0);
  const [loops, setLoops] = useState(() => lens.map(n => loopInit(n, TV_VIS)));
  const [open, setOpen] = useState(null); const [profile, setProfile] = useState(false); const [picks, setPicks] = useState(false);
  const [page, setPage] = useState('tonight'); const [n, setN] = useState(0);
  const rootRef = useRef();
  const clock = useClock();
  const go = (id) => { setPage(id); setZone(id === 'tonight' ? 'nav' : 'rows'); setN(Math.max(0, PAGES.findIndex(x => x.id === id))); };
  const goMood = (x) => { setMood(x); setPage('tonight'); setZone('rows'); setR(0); };
  const openFilm = (f) => setOpen({ slug: f.slug, mood: f.why[mood] ? mood : firstMood(f) });
  useSpatial(rootRef, active && page !== 'tonight' && !open && !profile, { onBack: () => go('tonight'), onFocusEl: (el) => { const sl = el.dataset.slug || (el.querySelector('[data-slug]') || {}).dataset?.slug; if (sl) onHero(FILM[sl]); }, resetKey: page });
  useEffect(() => { setLoops(lens.map(n => loopInit(n, TV_VIS))); setR(x => Math.min(x, rows.length - 1)); }, [rows]);
  useSettle(loops, setLoops, lens);

  const rr = Math.min(r, rows.length - 1);
  const L = loops[rr] || loopInit(lens[rr], TV_VIS);
  const hero = rows[rr].films[mod(L.v, lens[rr])], heroMood = rowMood(rows[rr], hero);
  useEffect(() => { onHero(hero); }, [hero.slug]);

  const st = useRef(); st.current = { zone, r: rr, m, n, loops, rows, lens, mood };
  const barAct = (i) => {
    if (i < MOODS.length) { setMood(MOODS[i].id); setZone('rows'); setR(0); return; }
    const j = i - MOODS.length;
    if (j === 0) t.setOpts(x => ({ ...x, time: TIMES[(TIMES.findIndex(v => v.id === x.time) + 1) % TIMES.length].id }));
    if (j === 1) t.setOpts(x => ({ ...x, who: WHO[(WHO.findIndex(v => v.id === x.who) + 1) % WHO.length].id }));
    if (j === 2) t.setOpts(x => ({ ...x, now: !x.now }));
    if (j === 3) setPicks(true);
  };
  useEffect(() => {
    if (!active || open || profile || picks || page !== 'tonight') return;
    const onKey = (e) => {
      const k = e.key; if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Backspace'].includes(k)) return;
      if (e.target.closest && e.target.closest('input,textarea,a')) return;
      e.preventDefault();
      const s = st.current;
      if (s.zone === 'bar') {
        if (k === 'ArrowLeft') setM(x => Math.max(0, x - 1));
        else if (k === 'ArrowRight') setM(x => Math.min(BAR_LEN - 1, x + 1));
        else if (k === 'Enter') barAct(s.m);
        else if (k === 'ArrowDown') setZone('rows');
        else if (k === 'ArrowUp') { setZone('nav'); setN(0); }
        return;
      }
      if (s.zone === 'nav') {
        if (k === 'ArrowLeft') setN(x => Math.max(0, x - 1));
        else if (k === 'ArrowRight') setN(x => Math.min(PAGES.length, x + 1));
        else if (k === 'ArrowDown') setZone('bar');
        else if (k === 'Enter') { if (s.n === PAGES.length) setProfile(true); else if (s.n > 0) go(PAGES[s.n].id); else setZone('bar'); }
        return;
      }
      const row = s.rows[s.r], f = row.films[mod(s.loops[s.r].v, s.lens[s.r])];
      if (k === 'ArrowLeft' || k === 'ArrowRight') setLoops(ls => ls.map((Lx, i) => (i === s.r ? loopStep(Lx, k === 'ArrowRight' ? 1 : -1, s.lens[i], TV_VIS) : Lx)));
      else if (k === 'ArrowDown') setR(x => Math.min(s.rows.length - 1, x + 1));
      else if (k === 'ArrowUp') { if (s.r === 0) { setZone('bar'); setM(MOODS.findIndex(x => x.id === s.mood)); } else setR(x => x - 1); }
      else if (k === 'Enter') setOpen(openFor(row, f));
      else if (k === 'Backspace' && row.cont) { t.clearCont(f.slug); toast(f.title + ' removed from Continue watching'); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [active, open, profile, picks, page, setMood]);

  const deep = rr > 0;
  return (
    <div className={'p p--tv' + (deep ? ' is-deep' : '') + (page !== 'tonight' ? ' is-page' : '')} ref={rootRef}>
      {page === 'tonight' && <Hero film={hero} mood={heroMood} device="tv" />}
      <div className="p-nav">
        {PAGES.map((pg, i) => <button key={pg.id} className={'p-navlink' + (page === pg.id ? ' is-on' : '') + (page === 'tonight' && zone === 'nav' && n === i ? ' is-focus' : '')} data-focus={page !== 'tonight' || undefined} onClick={() => go(pg.id)}>{pg.id === 'search' && I.search}{pg.label}</button>)}
        <span className="p-clock">{clock}</span>
        <span data-focus={page !== 'tonight' || undefined} onClick={() => setProfile(true)} className="p-navavatar"><Avatar size={40} focused={page === 'tonight' && zone === 'nav' && n === PAGES.length} onClick={() => setProfile(true)} /></span>
      </div>
      {page !== 'tonight' && <div className="p-pagewrap" key={page}><PageBody page={page} device="tv" mood={mood} goMood={goMood} onOpen={openFilm} onHero={onHero} /></div>}
      {page === 'tonight' && <div className="p-lower">
        <div className="p-lower__inner" style={{ transform: `translateY(${deep ? -(58 + rr * ROW_H) : 0}px)` }}>
          <TonightBar mood={mood} setMood={(x) => { setMood(x); setR(0); }} device="tv" focusIdx={zone === 'bar' ? m : -1} onPick={() => setPicks(true)} />
          <div className="p-rows">
            {rows.map((row, ri) => {
              const Lr = loops[ri] || loopInit(lens[ri], TV_VIS);
              return (
                <div className="p-row" key={row.key + sig}>
                  <RowLabel row={row} t={t} extra={row.cont && ri === rr && zone === 'rows' && <span className="p-row__hint"><kbd>⌫</kbd> I’m done with this</span>} />
                  <div className={'p-track' + (Lr.anim ? '' : ' no-anim')} style={{ transform: `translateX(${-Lr.w * TV_STEP}px)` }}>
                    {tripled(row.films, Lr).map((f, i) => (
                      <Card key={i} film={f} ghost={!Lr.moved && i < Lr.w} delay={Math.max(0, i - Lr.w) * 50 + ri * 30} focused={zone === 'rows' && ri === rr && i === Lr.v}
                        onFocus={() => { setZone('rows'); setR(ri); setLoops(ls => ls.map((Lx, j) => (j === ri ? { ...Lx, v: i } : Lx))); }}
                        onOpen={() => setOpen(openFor(row, f))} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>}
      {picks && <Picks device="tv" mood={mood} onClose={() => setPicks(false)} onOpen={(f) => { setPicks(false); setOpen({ slug: f.slug, mood: f.why[mood] ? mood : firstMood(f) }); }} />}
      {open && <Detail film={FILM[open.slug]} mood={open.mood} device="tv" onClose={() => setOpen(null)} />}
      {profile && <Profile device="tv" onClose={() => setProfile(false)} onOpenFilm={(slug) => { setProfile(false); setOpen({ slug, mood: firstMood(FILM[slug]) }); }} />}
    </div>
  );
}

const WEB_STEP = { key: 228 + 14, poster: 140 + 14 }, WEB_VIS = { key: 4, poster: 7 };
function Web({ mood, setMood, onHero }) {
  const t = useTonight();
  const sig = sigOf(mood, t);
  const rows = useMemo(() => buildRows(mood, t), [sig]);
  const lens = useMemo(() => rows.map(r => r.films.length), [rows]);
  const [hero, setHero] = useState({ slug: rows[0].films[0].slug, mood });
  const visOf = (ri) => WEB_VIS[ri === 0 ? 'poster' : 'key'];
  const [loops, setLoops] = useState(() => lens.map((n, i) => loopInit(n, visOf(i))));
  const [open, setOpen] = useState(null); const [scrolled, setScrolled] = useState(false); const [profile, setProfile] = useState(false); const [picks, setPicks] = useState(false);
  const [page, setPage] = useState('tonight');
  const goMood = (x) => { setMood(x); setPage('tonight'); };
  const openFilm = (f) => setOpen({ slug: f.slug, mood: f.why[mood] ? mood : firstMood(f) });
  const timer = useRef();
  useEffect(() => { setHero({ slug: rows[0].films[0].slug, mood: rowMood(rows[0], rows[0].films[0]) }); setLoops(lens.map((n, i) => loopInit(n, visOf(i)))); }, [rows]);
  useEffect(() => { onHero(FILM[hero.slug]); }, [hero.slug]);
  useSettle(loops, setLoops, lens);
  const preview = (slug, m) => { clearTimeout(timer.current); timer.current = setTimeout(() => setHero({ slug, mood: m }), 220); };
  const flip = (ri, dir, kind) => setLoops(ls => ls.map((L, i) => (i === ri ? loopPage(L, dir, lens[i], WEB_VIS[kind]) : L)));
  return (
    <div className={'p p--web' + (scrolled ? ' is-scrolled' : '') + (page !== 'tonight' ? ' is-page' : '')}>
      {page !== 'tonight' && <div className="p-scroll p-scroll--page" key={page}><PageBody page={page} device="web" mood={mood} goMood={goMood} onOpen={openFilm} onHero={onHero} /></div>}
      {page === 'tonight' && <Hero film={FILM[hero.slug]} mood={hero.mood} device="web" onOpen={() => setOpen({ slug: hero.slug, mood: hero.mood })} />}
      {page === 'tonight' && <div className="p-scroll" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}>
        <TonightBar mood={mood} setMood={setMood} device="web" onPick={() => setPicks(true)} />
        {rows.map((row, ri) => {
          const kind = ri === 0 ? 'poster' : 'key', L = loops[ri] || loopInit(lens[ri], WEB_VIS[kind]);
          return (
            <div className={'p-row p-row--' + kind} key={row.key + sig}>
              <RowLabel row={row} t={t} />
              <div className="p-carousel">
                <div className={'p-track' + (L.anim ? '' : ' no-anim')} style={{ transform: `translateX(${-L.w * WEB_STEP[kind]}px)` }}>
                  {tripled(row.films, L).map((f, i) => (
                    <Card key={i} film={f} kind={kind} ghost={!L.moved && i < L.w} delay={Math.max(0, i - L.w) * 45 + ri * 30}
                      onFocus={() => preview(f.slug, rowMood(row, f))} onOpen={() => setOpen(openFor(row, f))}
                      onDone={row.cont ? () => { t.clearCont(f.slug); toast(f.title + ' removed from Continue watching'); } : undefined} />
                  ))}
                </div>
                {L.moved && <button className="p-arrow p-arrow--l" aria-label="Previous" onClick={() => flip(ri, -1, kind)}>{I.chev}</button>}
                {!L.flat && <button className="p-arrow p-arrow--r" aria-label="Next" onClick={() => flip(ri, 1, kind)}>{I.chev}</button>}
              </div>
            </div>
          );
        })}
      </div>}
      <div className="p-nav">
        <button className="p-logo" onClick={() => setPage('tonight')}><LiveIris mood={mood} size={20} />Aperture</button>
        {PAGES.slice(0, 3).map(pg => <button key={pg.id} className={'p-navlink' + (page === pg.id ? ' is-on' : '')} onClick={() => setPage(pg.id)}>{pg.label}</button>)}
        <span className="p-nav__end"><button className={'p-navsearch' + (page === 'search' ? ' is-on' : '')} onClick={() => setPage('search')} aria-label="Search">{I.search}</button><Avatar onClick={() => setProfile(true)} /></span>
      </div>
      {picks && <Picks device="web" mood={mood} onClose={() => setPicks(false)} onOpen={(f) => { setPicks(false); setOpen({ slug: f.slug, mood: f.why[mood] ? mood : firstMood(f) }); }} />}
      {open && <Detail film={FILM[open.slug]} mood={open.mood} device="web" onClose={() => setOpen(null)} />}
      {profile && <Profile device="web" onClose={() => setProfile(false)} onOpenFilm={(slug) => { setProfile(false); setOpen({ slug, mood: firstMood(FILM[slug]) }); }} />}
    </div>
  );
}

function Phone({ mood, setMood, onHero }) {
  const t = useTonight();
  const sig = sigOf(mood, t);
  const rows = useMemo(() => buildRows(mood, t), [sig]);
  const [open, setOpen] = useState(null); const [profile, setProfile] = useState(false); const [picks, setPicks] = useState(false);
  const [page, setPage] = useState('tonight');
  const goMood = (x) => { setMood(x); setPage('tonight'); };
  const openFilm = (f) => setOpen({ slug: f.slug, mood: f.why[mood] ? mood : firstMood(f) });
  const hero = rows[0].films[0];
  useEffect(() => { onHero(open ? FILM[open.slug] : hero); }, [hero.slug, open && open.slug]);
  return (
    <div className="p p--phone">
      <div className="p-island" />
      <div className="p-status">
        <span>9:41</span>
        <span className="p-status__icons">
          <svg viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
          <svg viewBox="0 0 16 12" fill="#fff"><path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .4 10.6 10.6 0 0 0 .5 3.4l1.2 1.3A9 9 0 0 1 8 2.2zm0 3.6c1.4 0 2.7.5 3.7 1.4l1.2-1.3A7.2 7.2 0 0 0 8 4a7.2 7.2 0 0 0-4.9 1.9l1.2 1.3c1-.9 2.3-1.4 3.7-1.4zM8 9.3l2-2.1a3 3 0 0 0-4 0z" /></svg>
          <svg viewBox="0 0 27 12" fill="none"><rect x=".5" y=".5" width="23" height="11" rx="3.2" stroke="#fff" strokeOpacity=".4" /><rect x="2" y="2" width="20" height="8" rx="2" fill="#fff" /><path d="M25 4v4c.8-.3 1.3-1.1 1.3-2S25.8 4.3 25 4z" fill="#fff" fillOpacity=".45" /></svg>
        </span>
      </div>
      <div className="p-scroll">
        <div className="p-apphead"><span className="p-logo"><LiveIris mood={mood} size={22} />Aperture</span><Avatar size={32} onClick={() => setProfile(true)} /></div>
        {page !== 'tonight' ? <PageBody key={page} page={page} device="phone" mood={mood} goMood={goMood} onOpen={openFilm} onHero={onHero} /> : <>
        <Hero film={hero} mood={rowMood(rows[0], hero)} device="phone" onOpen={() => setOpen(openFor(rows[0], hero))} />
        <div className="p-moods"><span className="p-moods__lead">Tonight I want something</span><TonightBar mood={mood} setMood={setMood} device="phone" onPick={() => setPicks(true)} /></div>
        {rows.map((row, ri) => {
          const kind = ri === 0 ? 'poster' : 'key';
          return (
            <div className={'p-row p-row--' + kind} key={row.key + sig}>
              <RowLabel row={row} t={t} />
              <LoopScroll films={row.films}>{(f, i) => <Card key={i} film={f} kind={kind} delay={ri * 30} onOpen={() => setOpen(openFor(row, f))}
                onDone={row.cont ? () => { t.clearCont(f.slug); toast(f.title + ' removed from Continue watching'); } : undefined} />}</LoopScroll>
            </div>
          );
        })}
        </>}
      </div>
      <nav className="p-tabs">
        {[['tonight', I.home], ['browse', I.grid], ['search', I.search], ['mine', I.list]].map(([id, ic]) => <button key={id} className={'p-tab' + (page === id ? ' is-on' : '')} onClick={() => setPage(id)}>{ic}{PAGES.find(x => x.id === id).label}</button>)}
      </nav>
      <div className="p-homebar" />
      {picks && <Picks device="phone" mood={mood} onClose={() => setPicks(false)} onOpen={(f) => { setPicks(false); setOpen({ slug: f.slug, mood: f.why[mood] ? mood : firstMood(f) }); }} />}
      {open && <Detail film={FILM[open.slug]} mood={open.mood} device="phone" onClose={() => setOpen(null)} />}
      {profile && <Profile device="phone" onClose={() => setProfile(false)} onOpenFilm={(slug) => { setProfile(false); setOpen({ slug, mood: firstMood(FILM[slug]) }); }} />}
    </div>
  );
}

/* ── the wall behind the device ─────────────────────────────────
   A blurred copy of what's on screen, the way LED strips behind a TV throw
   the picture's colors onto the wall. */
function Backlight({ film }) {
  // two copies of the picture behind the device: a tight one for the bright edge
  // and a wide one for the falloff on the wall, both in the device's own shape
  const [layers, setLayers] = useState([film.slug]);
  useEffect(() => { setLayers(ls => (ls[ls.length - 1] === film.slug ? ls : [...ls.slice(-1), film.slug])); }, [film.slug]);
  const pic = layers.map((slug, i) => (
    <div key={slug} className={'ek-bias__layer' + (i === layers.length - 1 && layers.length > 1 ? ' is-in' : '')}><Art film={FILM[slug]} /></div>
  ));
  return <><div className="ek-bias ek-bias--far" aria-hidden="true">{pic}</div><div className="ek-bias ek-bias--near" aria-hidden="true">{pic}</div></>;
}

/* ── mockups ───────────────────────────────────────────────── */
function TVMock({ children, film }) {
  return (
    <div className="ek-tv">
      <div className="ek-tv__body"><Backlight film={film} />
      <div className="ek-tv__panel">
        <div className="ek-tv__screen"><Scaled w={1280} h={720}>{children}</Scaled><div className="ek-tv__glare" /></div>
        <div className="ek-tv__badge">EK</div>
      </div></div>
      <div className="ek-tv__neck" /><div className="ek-tv__base" />
    </div>
  );
}
function BrowserMock({ children, film }) {
  return (
    <div className="ek-browser">
      <div className="ek-browser__body"><Backlight film={film} />
      <div className="ek-browser__win">
        <div className="ek-browser__bar"><div className="ek-dots"><i /><i /><i /></div><div className="ek-url">{I.lock}<span>aperture.erfesh.com</span></div><div className="ek-browser__spacer" /></div>
        <Scaled w={1280} h={760}>{children}</Scaled>
      </div></div>
    </div>
  );
}
function PhoneMock({ children, film }) {
  return (
    <div className="ek-phone">
      <div className="ek-phone__body"><Backlight film={film} />
      <div className="ek-phone__frame">
        <span className="ek-phone__btn" style={{ left: -2, top: '17%', height: '4%' }} />
        <span className="ek-phone__btn" style={{ left: -2, top: '25%', height: '7.5%' }} />
        <span className="ek-phone__btn" style={{ left: -2, top: '34%', height: '7.5%' }} />
        <span className="ek-phone__btn" style={{ right: -2, top: '27%', height: '11%' }} />
        <div className="ek-phone__screen"><Scaled w={390} h={844}>{children}</Scaled></div>
      </div></div>
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────── */
const DEVICES = [{ id: 'tv', label: 'TV' }, { id: 'web', label: 'Web' }, { id: 'phone', label: 'Phone' }];

function Toast() {
  const [msg, setMsg] = useState(null); const t = useRef();
  useEffect(() => {
    const on = (e) => { setMsg(e.detail); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 2600); };
    bus.addEventListener('toast', on); return () => bus.removeEventListener('toast', on);
  }, []);
  const [last, setLast] = useState(''); useEffect(() => { if (msg) setLast(msg); }, [msg]);
  return <div className={'ek-toast' + (msg ? ' is-on' : '')} role="status"><Iris size={16} />{last}</div>;
}

function useEasterEgg() {
  useEffect(() => {
    let buf = '';
    const k = (e) => { if (e.key.length !== 1) return; buf = (buf + e.key.toLowerCase()).slice(-3); if (buf === 'erf') toast('Hi, I’m Erfan. Thanks for reading the source.'); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
}

function App() {
  const [device, setDevice] = useState(() => (window.innerWidth < 720 ? 'phone' : 'tv'));
  const [mood, setMood] = useState('slow');
  const [hero, setHero] = useState(FILMS[0]);
  const [opts, setOpts] = useState({ time: 'any', who: 'me', now: false });
  const [cont, setCont] = useState([{ slug: 'perfect-days', pct: 0.85 }, { slug: 'interstellar', pct: 0.62 }, { slug: 'knives-out', pct: 0.3 }]);
  const [owned, setOwned] = useState(() => new Set()); const [subs, setSubs] = useState(() => new Set());
  const [listed, setListed] = useState(() => new Set(['arrival', 'coco']));
  const tonight = useMemo(() => ({ opts, setOpts, cont, owned, subs,
    clearCont: (slug) => setCont(c => c.filter(x => x.slug !== slug)),
    own: (slug) => setOwned(o => new Set([...o, slug])),
    subscribe: (name) => setSubs(o => new Set([...o, name])),
    unsubscribe: (name) => setSubs(o => { const n = new Set(o); n.delete(name); return n; }),
    listed, toggleList: (slug) => setListed(o => { const n = new Set(o); n.has(slug) ? n.delete(slug) : n.add(slug); return n; }) }), [opts, cont, owned, subs, listed]);
  const ambient = useFilmColor(hero);
  const segRef = useRef(); const pill = usePill(segRef, device);
  const pickMood = useCallback((m) => { logMood(m); setMood(m); }, []);
  const stageRef = useRef(); const [inView, setInView] = useState(true);
  useEasterEgg();

  useEffect(() => { document.documentElement.style.setProperty('--ek-ambient', ambient); }, [ambient]);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio > 0.45), { threshold: [0, 0.45, 1] });
    io.observe(stageRef.current); return () => io.disconnect();
  }, []);

  const product = device === 'tv' ? <TV mood={mood} setMood={pickMood} onHero={setHero} active={inView} />
    : device === 'web' ? <Web mood={mood} setMood={pickMood} onHero={setHero} />
    : <Phone mood={mood} setMood={pickMood} onHero={setHero} />;

  return (
    <>
      <TonightCtx.Provider value={tonight}>
      <div className="ek-room" /><div className="ek-grain" />
      <div className="ek-page" data-cut="ek">
        <header className="ek-top">
          <div className="ek-brand"><LiveIris mood={mood} size={24} /><span className="ek-brand__name">Aperture</span><span className="ek-brand__by">A prototype by Erfan Kooshesh</span></div>
          <nav className="ek-links">
            <a className="ek-link" href="https://erfesh.com" target="_blank" rel="noopener">erfesh.com{I.out}</a>
            <a className="ek-link" href="https://www.linkedin.com/in/erfesh" target="_blank" rel="noopener">LinkedIn{I.out}</a>
          </nav>
        </header>

        <section className="ek-lede">
          <div>
            <h1>Pick a mood, <em>not a genre.</em></h1>
            <p>A streaming home screen that starts from how you want tonight to feel, and tells you why each film fits.</p>
          </div>
          <div className="ek-seg" ref={segRef} role="group" aria-label="Device">
            <span className="ek-seg__pill" style={pill} />
            {DEVICES.map(d => <button key={d.id} aria-pressed={device === d.id} onClick={() => setDevice(d.id)}>{I[d.id]}{d.label}</button>)}
          </div>
        </section>

        <section className="ek-stage" ref={stageRef} aria-label="Prototype">
          <div key={device} className="ek-swap">
            {device === 'tv' ? <TVMock film={hero}>{product}</TVMock> : device === 'web' ? <BrowserMock film={hero}>{product}</BrowserMock> : <PhoneMock film={hero}>{product}</PhoneMock>}
          </div>
          <div className="ek-hint">
            {device === 'tv'
              ? <><span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open, pick or change</span><span><kbd>⌫</kbd> clear or back</span><span><kbd>Esc</kbd> back</span></>
              : device === 'web' ? <span>Hover a title to preview it, click to open</span> : <span>Tap a mood, tap a title</span>}
          </div>
        </section>

        <section className="ek-notes" aria-labelledby="notes-h">
          <div className="ek-notes__head"><div><div className="ek-eyebrow">A note from the designer</div><h2 id="notes-h">Behind the prototype</h2></div></div>
          <div className="ek-notes__grid">
            <div className="ek-note"><h3>The idea</h3><p>For five years I've written a version of this sentence for @erfesh almost every day: here's why this one, for you, tonight. Streaming apps mostly sort by genre and popularity. People don't actually choose that way, they choose by mood: what they have the attention for, who they're watching with, whether tonight can take a sad ending.</p></div>
            <div className="ek-note"><h3>The reasons</h3><p>This prototype swaps genre rows for mood rows, and gives each title a short, specific reason instead of a star rating. The reasons are written by hand to show the voice I'd want an AI step to match, not pulled from a live model. The loading behavior, request IDs and skeleton states are real, though, built the way it would work against an actual API.</p></div>
            <div className="ek-note"><h3>Every screen</h3><p>It's built the same way across web, mobile and the TV, and the TV layout is fully navigable by remote: arrow keys move between rows and within them, Enter opens a title.</p></div>
          </div>
        </section>

        <section className="ek-notes ek-notes--fix" aria-labelledby="fix-h">
          <div className="ek-notes__head"><div><div className="ek-eyebrow">What it fixes</div><h2 id="fix-h">Three things streaming apps get wrong</h2></div></div>
          <div className="ek-notes__grid">
            <div className="ek-note"><h3>Too much choice</h3><p>Endless rows make deciding harder, not easier. The Tonight bar asks the three questions people actually answer first: what mood, how much time, and who's watching. Pick for me then shows three options, each with its reason, instead of three hundred.</p></div>
            <div className="ek-note"><h3>Hidden prices</h3><p>Included titles, rentals and add-on channels usually sit in the same rows with no clear signal. Here every card that costs extra says so up front, Watch now hides anything you'd have to pay for, and checkout is one honest step: the price, how long you get it, and how to cancel.</p></div>
            <div className="ek-note"><h3>A cluttered Continue watching</h3><p>Shows you gave up on months ago shouldn't follow you around. Each title shows how much is left, and one tap (or the back key on a remote) clears it for good.</p></div>
          </div>
        </section>

        <footer className="ek-foot">
          <span>Designed and built by Erfan Kooshesh · <a href="https://erfesh.com" target="_blank" rel="noopener">erfesh.com</a> · <a href="https://www.linkedin.com/in/erfesh" target="_blank" rel="noopener">LinkedIn</a></span>
          <span>Film titles and artwork belong to their studios. Shown here in a non-commercial prototype.</span>
        </footer>
      </div>
      <Toast />
      </TonightCtx.Provider>
    </>
  );
}

console.log('%c◎ Aperture ', 'font:600 13px system-ui;padding:4px 10px;border-radius:6px;background:#f3f3f0;color:#07080a');
console.log('%cDesigned and built by Erfan Kooshesh\nerfesh.com · linkedin.com/in/erfesh\n\nP.S. type "erf" on the page.', 'font:12px ui-monospace,monospace;color:#a6aab2;line-height:1.6');

const ekBoot = () => ReactDOM.createRoot(document.getElementById('ek-root')).render(<App />);
window.claude?.hot?.ready ? window.claude.hot.ready(ekBoot) : ekBoot();
