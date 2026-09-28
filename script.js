/* Abby Mbuthu portfolio v2: preloader, menu, liquid hero, counters and scroll effects */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const body = document.body;
  const hero = document.querySelector('.hero');
  const header = document.querySelector('.site-header');

  /* ---------- Split the hero headline into letters (keeps italic words) ---------- */
  const title = document.querySelector('[data-liquid]');
  const letters = [];
  if (title) {
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    let i = 0;
    const build = (text, wrapTag) => {
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span');
        w.className = 'w';
        const holder = wrapTag ? document.createElement(wrapTag) : w;
        [...part].forEach((ch) => {
          const s = document.createElement('span');
          s.className = 'ch';
          s.textContent = ch;
          s.style.setProperty('--i', i++);
          holder.appendChild(s);
          letters.push({ el: s, weight: 300, y: 0, serif: !!wrapTag });
        });
        if (wrapTag) w.appendChild(holder);
        frag.appendChild(w);
      });
      return frag;
    };
    const nodes = [...title.childNodes];
    title.textContent = '';
    const inner = document.createElement('span');
    inner.setAttribute('aria-hidden', 'true');
    nodes.forEach((n) => {
      if (n.nodeType === 3) inner.appendChild(build(n.textContent, null));
      else if (n.nodeType === 1) inner.appendChild(build(n.textContent, n.tagName.toLowerCase()));
    });
    title.appendChild(inner);
  }

  /* ---------- Split section titles into rising words ---------- */
  document.querySelectorAll('[data-rise]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const nodes = [...el.childNodes];
    el.textContent = '';
    let i = 0;
    nodes.forEach((n) => {
      const isEm = n.nodeType === 1;
      n.textContent.split(/\s+/).filter(Boolean).forEach((word) => {
        if (el.childNodes.length) el.appendChild(document.createTextNode(' '));
        const outer = document.createElement('span');
        outer.className = 'rw';
        outer.setAttribute('aria-hidden', 'true');
        const inner = document.createElement(isEm ? 'em' : 'span');
        inner.textContent = word;
        inner.style.setProperty('--i', i++);
        outer.appendChild(inner);
        el.appendChild(outer);
      });
    });
  });

  /* ---------- Liquid fill on buttons ---------- */
  document.querySelectorAll('.btn').forEach((btn) => {
    const place = (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', `${e.clientX - r.left}px`);
      btn.style.setProperty('--y', `${e.clientY - r.top}px`);
    };
    btn.addEventListener('pointerenter', place);
    btn.addEventListener('pointerleave', place);
  });

  /* ---------- Full screen menu ---------- */
  const menu = document.getElementById('menu');
  const toggle = document.querySelector('.menu-toggle');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    body.classList.toggle('is-locked', open);
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    open ? menu.removeAttribute('inert') : menu.setAttribute('inert', '');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) setTimeout(() => menu.querySelector('a').focus({ preventScroll: true }), 300);
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Counters ---------- */
  const runCounter = (el) => {
    const end = parseFloat(el.dataset.count);
    if (reduceMotion) { el.textContent = end; return; }
    const start = performance.now();
    const dur = 1600;
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  };

  /* ---------- Reduced motion: show everything, keep it still ---------- */
  if (reduceMotion) {
    document.querySelectorAll('[data-reveal],[data-rise],[data-media]').forEach((el) => el.classList.add('is-in'));
    hero.classList.add('is-ready');
    document.querySelector('.loader').remove();
    document.querySelectorAll('video').forEach((v) => v.setAttribute('controls', ''));
    window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 40), { passive: true });
    return;
  }

  /* ---------- Preloader ---------- */
  const loader = document.querySelector('.loader');
  const num = document.getElementById('loader-num');
  let loaded = document.readyState === 'complete';
  window.addEventListener('load', () => { loaded = true; });
  body.classList.add('is-locked');
  let shown = 0;
  const loadStart = performance.now();
  const tickLoader = (now) => {
    const elapsed = now - loadStart;
    const cap = loaded || elapsed > 4000 ? 100 : 88;
    const target = Math.min(cap, (elapsed / 1300) * 100);
    shown = Math.max(shown, Math.floor(target));
    num.textContent = shown;
    if (shown < 100) { requestAnimationFrame(tickLoader); return; }
    setTimeout(() => {
      loader.classList.add('is-done');
      body.classList.remove('is-locked');
      startHero();
      setTimeout(() => loader.remove(), 1200);
    }, 200);
  };
  requestAnimationFrame(tickLoader);

  /* ---------- Hero: ink settles, then comes alive ---------- */
  const settleDisp = document.getElementById('settle-disp');
  const artBase = document.getElementById('art-base');
  function startHero() {
    hero.classList.add('is-ready');
    artBase.setAttribute('filter', 'url(#settle-filter)');
    const start = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / 2000, 0, 1);
      settleDisp.setAttribute('scale', (70 * Math.pow(1 - t, 3)).toFixed(2));
      if (t < 1) requestAnimationFrame(step);
      else artBase.removeAttribute('filter');
    };
    requestAnimationFrame(step);
    setTimeout(() => hero.classList.add('is-live'), 2000);
  }

  const wrap = document.querySelector('.hero-art-wrap');
  const lensSvg = document.querySelector('.hero-lens');
  const lensCircle = document.getElementById('lens-circle');
  const lensFilter = document.getElementById('lens-filter');
  const lensNoise = document.getElementById('lens-noise');
  const lensDisp = document.getElementById('lens-disp');
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, inside: false };
  const lens = { x: 368, y: 520, r: 0, scale: 0, pulse: 0 };
  const par = { x: 0, y: 0 };
  let heroRaf = null;

  const toSvg = (cx, cy) => {
    const ctm = lensSvg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const heroFrame = (now) => {
    const active = pointer.inside;
    par.x = lerp(par.x, active ? pointer.nx * -22 : 0, 0.06);
    par.y = lerp(par.y, active ? pointer.ny * -14 : 0, 0.06);
    wrap.style.transform = `translate3d(${par.x.toFixed(2)}px, ${par.y.toFixed(2)}px, 0)`;

    const target = active ? toSvg(pointer.x, pointer.y) : lens;
    lens.x = lerp(lens.x, target.x, 0.12);
    lens.y = lerp(lens.y, target.y, 0.12);
    lens.pulse *= 0.93;
    lens.r = lerp(lens.r, active ? 150 + lens.pulse * 90 : 0, 0.08);
    lens.scale = lerp(lens.scale, active ? 22 + lens.pulse * 40 : 0, 0.08);
    const pad = lens.r + 40;
    lensFilter.setAttribute('x', (lens.x - pad).toFixed(1));
    lensFilter.setAttribute('y', (lens.y - pad).toFixed(1));
    lensFilter.setAttribute('width', (pad * 2).toFixed(1));
    lensFilter.setAttribute('height', (pad * 2).toFixed(1));
    lensCircle.setAttribute('cx', lens.x.toFixed(1));
    lensCircle.setAttribute('cy', lens.y.toFixed(1));
    lensCircle.setAttribute('r', Math.max(0, lens.r).toFixed(1));
    lensNoise.setAttribute('baseFrequency', `${(0.016 + Math.sin(now * 0.0011) * 0.004).toFixed(4)} ${(0.022 + Math.cos(now * 0.0009) * 0.005).toFixed(4)}`);
    lensDisp.setAttribute('scale', lens.scale.toFixed(2));

    let moving = false;
    if (letters.length && hero.classList.contains('is-live')) {
      const rects = letters.map((l) => l.el.getBoundingClientRect());
      letters.forEach((l, i) => {
        const r = rects[i];
        let fall = 0;
        if (active) {
          const dx = pointer.x - (r.left + r.width / 2);
          const dy = pointer.y - (r.top + r.height / 2);
          fall = Math.exp(-(dx * dx + dy * dy) / (2 * 120 * 120));
        }
        const tw = 300 + 420 * fall;
        const ty = -0.08 * fall;
        l.weight = lerp(l.weight, tw, 0.14);
        l.y = lerp(l.y, ty, 0.14);
        if (Math.abs(l.weight - tw) > 0.5 || Math.abs(l.y - ty) > 0.001) moving = true;
      });
      letters.forEach((l) => {
        if (!l.serif) l.el.style.fontWeight = Math.round(l.weight);
        l.el.style.transform = `translateY(${l.y.toFixed(3)}em)`;
      });
    }

    if (!active && lens.r < 0.5 && Math.abs(par.x) < 0.1 && Math.abs(par.y) < 0.1 && !moving) {
      lensCircle.setAttribute('r', '0');
      heroRaf = null;
      return;
    }
    heroRaf = requestAnimationFrame(heroFrame);
  };
  const wakeHero = () => { if (!heroRaf) heroRaf = requestAnimationFrame(heroFrame); };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.nx = (e.clientX - r.left) / r.width - 0.5;
    pointer.ny = (e.clientY - r.top) / r.height - 0.5;
    if (!pointer.inside) { pointer.inside = true; const p = toSvg(e.clientX, e.clientY); lens.x = p.x; lens.y = p.y; }
    wakeHero();
  });
  hero.addEventListener('pointerleave', () => { pointer.inside = false; wakeHero(); });
  hero.addEventListener('pointerdown', () => { lens.pulse = 1; wakeHero(); });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transition = 'transform 200ms ease-out';
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';
      });
    });
  }

  /* ---------- Services: image follows the cursor ---------- */
  const float = document.querySelector('.service-float');
  const floatImg = float && float.querySelector('img');
  if (float && finePointer) {
    const fp = { x: 0, y: 0, tx: 0, ty: 0 };
    let fRaf = null;
    const fFrame = () => {
      fp.x = lerp(fp.x, fp.tx, 0.14);
      fp.y = lerp(fp.y, fp.ty, 0.14);
      float.style.left = `${fp.x}px`;
      float.style.top = `${fp.y}px`;
      fRaf = float.classList.contains('is-on') || Math.abs(fp.x - fp.tx) > 0.5 ? requestAnimationFrame(fFrame) : null;
    };
    document.querySelectorAll('.service').forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        floatImg.src = row.dataset.img;
        if (!float.classList.contains('is-on')) { fp.x = e.clientX; fp.y = e.clientY; }
        float.classList.add('is-on');
        if (!fRaf) fRaf = requestAnimationFrame(fFrame);
      });
      row.addEventListener('pointermove', (e) => { fp.tx = e.clientX + 180; fp.ty = e.clientY; });
      row.addEventListener('pointerleave', () => float.classList.remove('is-on'));
    });
  }

  /* ---------- Scroll: header, project scale, marquee speed ---------- */
  const leads = [...document.querySelectorAll('[data-scale]')];
  const marqueeAnims = [...document.querySelectorAll('.marquee-track, .gallery-track')]
    .map((el) => el.getAnimations()[0]).filter(Boolean);
  let lastY = window.scrollY;
  let velocity = 0;
  let sRaf = null;

  const sFrame = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    velocity = lerp(velocity, y - lastY, 0.2);
    lastY = y;

    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > vh * 0.9 && velocity > 2 && !body.classList.contains('menu-open'));

    leads.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return;
      const p = clamp((vh - r.top) / (vh * 0.85), 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.style.transform = `scale(${(0.86 + 0.14 * e).toFixed(4)})`;
    });

    const rate = 1 + Math.min(Math.abs(velocity) * 0.12, 4);
    marqueeAnims.forEach((a) => { a.playbackRate = lerp(a.playbackRate, rate, 0.2); });

    const busy = Math.abs(velocity) > 0.1 || marqueeAnims.some((a) => Math.abs(a.playbackRate - 1) > 0.02);
    sRaf = busy ? requestAnimationFrame(sFrame) : null;
  };
  const wakeScroll = () => { if (!sRaf) sRaf = requestAnimationFrame(sFrame); };
  window.addEventListener('scroll', wakeScroll, { passive: true });
  window.addEventListener('resize', wakeScroll);
  wakeScroll();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.querySelectorAll('[data-count]').forEach(runCounter);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal],[data-rise],[data-media]').forEach((el) => io.observe(el));

  /* ---------- Videos play only while on screen ---------- */
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => v.setAttribute('controls', '')); }
      else v.pause();
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('video').forEach((v) => vio.observe(v));
})();
