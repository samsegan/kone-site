/* K.ONE: artist site preview. Plain JavaScript, no libraries. */
(() => {
  const D = window.KONE || { records: [], unreleased: [] };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const wide = matchMedia('(min-width: 1025px)');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  // Phones and tablets: Play opens SoundCloud itself (its embedded player needs several taps there).
  const handheld = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const inDock = () => wide.matches && !handheld;
  // A record SoundCloud will not play inside another site (embed: false) opens SoundCloud too.
  const docks = (r) => !!(r && r.soundcloud && r.embed !== false && inDock());
  const rec = (id) => D.records.find((r) => r.id === id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const clock = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // ---------- opening: the name, then the picture ----------
  let seen = false;
  try { seen = sessionStorage.getItem('kone-in') === '1'; sessionStorage.setItem('kone-in', '1'); } catch (e) { /* private mode */ }
  const fast = seen || calm.matches || location.hash.length > 1;
  const ready = () => { html.classList.add('ready'); setTimeout(() => html.classList.add('gone'), 1200); };
  if (fast) { $('#intro').style.transition = 'none'; ready(); } else setTimeout(ready, 1750);

  // ---------- the mark shrinks once the landing picture is left ----------
  const hero = $('.hero'), heroPic = $('.hero-pic');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    html.classList.toggle('small', y > 80);
    if (wide.matches && !calm.matches && y < innerHeight) heroPic.style.transform = `translate3d(0, ${(y * 0.18).toFixed(1)}px, 0)`;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ---------- menu ----------
  const menu = $('#menu'), menuBtn = $('#menu-btn'), word = $('.menu-word');
  function setMenu(on) {
    if (on) { menu.hidden = false; void menu.offsetWidth; }
    html.classList.toggle('open', on);
    menuBtn.setAttribute('aria-expanded', on);
    word.textContent = on ? word.dataset.close : word.dataset.open;
    document.body.style.overflow = on ? 'hidden' : '';
    if (!on) setTimeout(() => { if (!html.classList.contains('open')) menu.hidden = true; }, 480);
  }
  menuBtn.addEventListener('click', () => setMenu(!html.classList.contains('open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });

  // ---------- landing: the gap inside each word closes on hover ----------
  function gaps() {
    $$('.plat a').forEach((a) => {
      const [s1, s2] = $$('span', a);
      a.style.setProperty('--g', Math.max(0, s2.offsetLeft - (s1.offsetLeft + s1.offsetWidth)) + 'px');
    });
  }
  gaps(); addEventListener('resize', gaps);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(gaps);

  // ---------- music: every record, newest first ----------
  const KIND = { single: 'Single', soundcloud: 'SoundCloud', edit: 'Edit', free: 'Free download', remix: 'Remix' };
  const FIRST = 8;
  const grid = $('#grid');
  grid.innerHTML = D.records.map((r, i) => {
    const others = r.by === 'K.ONE' ? '' : (/K\.ONE/.test(r.by) ? 'with ' + r.by.split(', ').filter((n) => n !== 'K.ONE').join(', ') : 'for ' + r.by);
    const line = [others, r.label].filter(Boolean).join(' · ');
    return `<button type="button" class="tile${i >= FIRST ? ' extra' : ''}" data-play="${r.id}" data-id="${r.id}" aria-label="${esc(r.title)}, ${esc(r.by)}">` +
      `<span class="cover"><img src="${r.art}" alt="" width="640" height="640" loading="lazy"><i class="glyph"></i></span>` +
      `<span class="cap"><span class="n">(${String(i + 1).padStart(2, '0')})</span><span class="t">${esc(r.title)}</span>` +
      `<span class="k">${KIND[r.kind] || r.kind} · ${r.date.slice(0, 4)}</span><span class="w">${esc(line)}</span></span></button>`;
  }).join('');
  const more = $('#more'), moreWord = $('#more-word');
  moreWord.textContent = `View all (${D.records.length})`;
  more.addEventListener('click', () => {
    const on = !grid.classList.contains('all');
    grid.classList.toggle('all', on);
    more.setAttribute('aria-expanded', on);
    moreWord.textContent = on ? 'Show fewer' : `View all (${D.records.length})`;
    $('.ar', more).classList.toggle('up', on); $('.ar', more).classList.toggle('dn', !on);
    if (on) $$('.tile.extra').forEach((t, i) => { t.style.transitionDelay = (i % 4) * 60 + 'ms'; watch.observe(t); });
    else $('#music').scrollIntoView({ block: 'start' });
  });

  // ---------- the next show: counts down, and steps aside once the night has passed ----------
  const ticket = $('#ticket');
  (function show() {
    const [y, m, d] = ticket.dataset.date.split('-').map(Number);
    const now = new Date();
    const days = Math.round((new Date(y, m - 1, d) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
    // the night runs past midnight: keep it up through the morning after
    if (days < -1 || (days === -1 && now.getHours() >= 6)) {
      ticket.hidden = true; $('#noshow').hidden = false;
      $('#shows-line').textContent = 'Nothing on sale this week. New dates are announced on Instagram first.';
      $('#menu-shows').textContent = 'No dates right now';
      $('#foot-show-tag').textContent = 'Shows';
      $('#foot-show').innerHTML = '<b>Soon</b><span>Dates to come</span>';
      $('.menu-list .hot').classList.remove('hot');
      return;
    }
    $('#ticket-when').textContent = days > 1 ? `In ${days} days` : days === 1 ? 'Tomorrow' : 'Tonight';
  })();

  // ---------- unreleased: blurred cards, a file name on each, unlocked by holding ----------
  const scatter = $('#scatter');
  const SPOTS = [
    { x: '0.5%', y: '8%', w: '18.5%', a: '-7deg', ar: '.8' },
    { x: '34%', y: '2%', w: '14.5%', a: '4deg', ar: '.8' },
    { x: '57%', y: '5%', w: '25%', a: '-3deg', ar: '1.42' },
    { x: '82.5%', y: '33%', w: '16.5%', a: '8deg', ar: '.76' },
    { x: '14.5%', y: '55%', w: '27%', a: '5deg', ar: '1.45' },
  ];
  scatter.insertAdjacentHTML('afterbegin', D.unreleased.map((u, i) => {
    const s = SPOTS[i % SPOTS.length];
    return `<article class="card rv" style="--x:${s.x};--y:${s.y};--w:${s.w};--a:${s.a};--ar:${s.ar}">` +
      `<p class="file"><span>${esc(u.file)}<small>${esc(u.note)}</small></span><b>×</b></p>` +
      `<div class="card-pic"><img src="${u.img}" alt="" loading="lazy"><span class="stamp">Unreleased</span>` +
      `<div class="card-info"><b>${esc(u.title)}</b><span>${esc(u.by)}</span><span>${esc(u.where)}</span>` +
      `<a href="${u.url}" target="_blank" rel="noopener" tabindex="-1">${esc(u.go)}</a></div></div></article>`;
  }).join(''));
  const hold = $('#hold');
  let holdT = 0;
  function unlock() {
    scatter.classList.remove('holding'); scatter.classList.add('unlocked');
    hold.setAttribute('aria-pressed', 'true');
    $('#hold-word').textContent = 'Unlocked';
    $('#hold-note').textContent = 'Now you know. Ask for them by name.';
    $$('.card-info a', scatter).forEach((a) => a.removeAttribute('tabindex'));
  }
  const holdStart = (e) => {
    if (scatter.classList.contains('unlocked')) return;
    if (e.pointerId !== undefined && hold.setPointerCapture) { try { hold.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } }
    scatter.classList.add('holding');
    clearTimeout(holdT); holdT = setTimeout(unlock, calm.matches ? 0 : 900);
  };
  const holdEnd = () => { if (!scatter.classList.contains('unlocked')) { clearTimeout(holdT); scatter.classList.remove('holding'); } };
  hold.addEventListener('pointerdown', holdStart);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => hold.addEventListener(n, holdEnd));
  hold.addEventListener('contextmenu', (e) => e.preventDefault());
  hold.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); unlock(); } });

  // ---------- contact: pick a topic, see who reads it ----------
  const MGMT = 'hendrik@notoriously-good.com';
  const TOPICS = {
    booking: { who: 'Management', addr: MGMT, say: 'The date, the city, the room and the offer.' },
    ausnz: { who: 'Bookings, Australia & New Zealand', addr: 'fraser@m87.au', say: 'The date, the city, the room and the offer.' },
    press: { who: 'Management', addr: MGMT, say: 'Who you write for, what you need and by when.' },
    hi: { who: 'K.ONE, on Instagram', addr: '@k.oneeeeee', href: 'https://www.instagram.com/k.oneeeeee/', say: 'Anything. The ID you are looking for, maybe.' },
  };
  function topic(key) {
    const t = TOPICS[key];
    $$('.topics button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.topic === key)));
    const href = t.href || 'mailto:' + t.addr;
    $('#c-who').textContent = t.who; $('#c-say').textContent = t.say;
    const a = $('#c-addr'); a.textContent = t.addr; a.href = href;
    const o = $('#c-open'); o.href = href; $('#c-open-word').textContent = t.href ? 'Open Instagram' : 'Open mail';
    if (t.href) { a.target = o.target = '_blank'; a.rel = o.rel = 'noopener'; } else { a.removeAttribute('target'); o.removeAttribute('target'); }
    $('#c-copy-word').textContent = t.href ? 'Copy handle' : 'Copy address';
    $$('.contact-r .field b, .contact-r .field a').forEach((el) => { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); });
  }
  $$('.topics button').forEach((b) => b.addEventListener('click', () => topic(b.dataset.topic)));
  $('.topics').addEventListener('keydown', (e) => {
    const all = $$('.topics button'), i = all.indexOf(document.activeElement);
    if (i < 0 || !/^Arrow/.test(e.key)) return;
    e.preventDefault();
    const n = all[(i + (/Right|Down/.test(e.key) ? 1 : -1) + all.length) % all.length];
    n.focus(); topic(n.dataset.topic);
  });
  $('#c-copy').addEventListener('click', () => {
    const text = $('#c-addr').textContent, w = $('#c-copy-word'), was = w.textContent;
    const done = (ok) => { w.textContent = ok ? 'Copied' : text; clearTimeout(done.t); done.t = setTimeout(() => { w.textContent = was.startsWith('Cop') && was !== 'Copied' ? was : 'Copy address'; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); else done(false);
  });

  // ---------- things rise into place as they are reached ----------
  const watch = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); watch.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('.ln, .rv, .tile:not(.extra)').forEach((el) => watch.observe(el));
  $$('.tile:not(.extra)').forEach((t, i) => { t.style.transitionDelay = (i % 4) * 70 + 'ms'; });
  $$('.wall img').forEach((t, i) => { t.style.transitionDelay = (i % 3) * 70 + 'ms'; });

  // ---------- player: SoundCloud's own widget, our controls (wide screens) ----------
  const dock = { el: $('#dock'), widget: null, frame: null, dur: 0, rel: null, started: false, on: false };
  function play(id) {
    const r = rec(id);
    if (!r) return;
    if (!r.soundcloud) { window.open(r.spotify, '_blank', 'noopener'); return; }
    if (!docks(r)) { window.open(r.soundcloud, '_blank', 'noopener'); return; }
    if (dock.rel && dock.rel.id === r.id && dock.widget && !dock.el.hidden) { dock.widget.toggle(); return; }
    loadSC().then(() => start(r)).catch(() => window.open(r.soundcloud, '_blank', 'noopener'));
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-play]'); if (b) play(b.dataset.play); });
  function loadSC() {
    if (window.SC && window.SC.Widget) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://w.soundcloud.com/player/api.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function state() {
    $$('[data-play]').forEach((p) => p.classList.toggle('playing', !!(dock.on && dock.rel && dock.rel.id === p.dataset.play)));
  }
  const paused = (p) => { dock.on = !p; $('#dock-play').classList.toggle('paused', p); state(); };
  function start(r) {
    const url = r.soundcloud;
    $('#dock-title').textContent = r.by === 'K.ONE' ? r.title : `${r.title}  ·  ${r.by}`;
    $('#dock-art').src = r.art;
    $('#dock-out').href = url;
    $('#dock-time').textContent = 'Loading';
    $('#dock-fill').style.width = '0';
    dock.el.hidden = false;
    html.style.setProperty('--dock', dock.el.offsetHeight + 'px');
    dock.rel = r; dock.started = false; dock.dur = r.seconds * 1000;   // the length SoundCloud lists; its widget reports the last track's for a moment
    paused(true);
    const opts = { auto_play: true, show_artwork: false, show_comments: false, visual: false };
    if (!dock.frame) {
      const src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&auto_play=true&show_artwork=false&show_comments=false&visual=false';
      dock.frame = Object.assign(document.createElement('iframe'), { className: 'sc-frame', allow: 'autoplay; encrypted-media', title: 'SoundCloud player', src });
      dock.tap.appendChild(dock.frame);
      dock.widget = window.SC.Widget(dock.frame);
      const E = window.SC.Widget.Events;
      dock.widget.bind(E.READY, expectSound);
      dock.widget.bind(E.PLAY_PROGRESS, (e) => {
        if (!dock.started && e.currentPosition > 0) { dock.started = true; needTap(false); }
        $('#dock-fill').style.width = (e.relativePosition * 100).toFixed(2) + '%';
        $('#dock-bar').setAttribute('aria-valuenow', Math.round(e.relativePosition * 100));
        $('#dock-time').textContent = `${clock(e.currentPosition)} / ${clock(dock.dur)}`;
      });
      dock.widget.bind(E.PLAY, () => paused(false));
      dock.widget.bind(E.PAUSE, () => paused(true));
      dock.widget.bind(E.FINISH, () => paused(true));
    } else {
      dock.widget.load(url, Object.assign({ callback: expectSound }, opts));
    }
  }
  // If the browser will not start sound by itself, SoundCloud's own play button slides up for one click.
  dock.tap = Object.assign(document.createElement('div'), { className: 'sc-tap', innerHTML: '<p>Press play once to start the sound</p>' });
  document.body.appendChild(dock.tap);
  function needTap(on) {
    clearTimeout(dock.wait);
    if (on) $('#dock-time').textContent = 'Press play';
    dock.tap.classList.toggle('on', on);
  }
  function expectSound() {
    clearTimeout(dock.wait);
    dock.wait = setTimeout(() => { if (!dock.started && !dock.el.hidden) needTap(true); }, 2500);
  }
  $('#dock-play').addEventListener('click', () => { if (dock.widget) { dock.widget.toggle(); if (!dock.started) expectSound(); } });
  $('#dock-close').addEventListener('click', () => {
    if (dock.widget) dock.widget.pause();
    needTap(false); dock.el.hidden = true; html.style.setProperty('--dock', '0px'); paused(true);
  });
  const seek = (frac) => { if (dock.widget && dock.dur) dock.widget.seekTo(dock.dur * clamp(frac)); };
  $('#dock-bar').addEventListener('click', (e) => { const b = e.currentTarget.getBoundingClientRect(); seek((e.clientX - b.left) / b.width); });
  $('#dock-bar').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (!dock.widget || !dock.dur) return;
    dock.widget.getPosition((ms) => dock.widget.seekTo(clamp(ms + (e.key === 'ArrowRight' ? 5000 : -5000), 0, dock.dur)));
  });
})();
