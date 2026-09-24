/* Abby Mbuthu portfolio: liquid hero, flowing section edges and scroll reveals */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const hero = document.querySelector('.hero');
  const header = document.querySelector('.site-header');

  /* ---------- Split the headline into letters ---------- */
  const title = document.querySelector('[data-liquid]');
  const letters = [];
  if (title) {
    const text = title.textContent.trim();
    const words = text.split(/\s+/);
    title.setAttribute('aria-label', text);
    title.textContent = '';
    let i = 0;
    words.forEach((word, wi) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      [...word].forEach((ch) => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        s.style.setProperty('--i', i++);
        w.appendChild(s);
        letters.push({ el: s, weight: 300, y: 0 });
      });
      title.appendChild(w);
      if (wi < words.length - 1) title.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------- Split case study titles into rising words ---------- */
  document.querySelectorAll('[data-rise]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'rw';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- Liquid fill on buttons: starts where the pointer enters ---------- */
  document.querySelectorAll('.btn').forEach((btn) => {
    const place = (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', `${e.clientX - r.left}px`);
      btn.style.setProperty('--y', `${e.clientY - r.top}px`);
    };
    btn.addEventListener('pointerenter', place);
    btn.addEventListener('pointerleave', place);
  });

  /* ---------- Reduced motion: show everything and stop here ---------- */
  if (reduceMotion) {
    document.querySelectorAll('[data-reveal],[data-rise],[data-media]').forEach((el) => el.classList.add('is-in'));
    hero && hero.classList.add('is-ready');
    document.querySelectorAll('.media video').forEach((v) => v.setAttribute('controls', ''));
    window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 40), { passive: true });
    return;
  }

  /* ---------- Hero: ink settles on load ---------- */
  const settleDisp = document.getElementById('settle-disp');
  const artBase = document.getElementById('art-base');
  requestAnimationFrame(() => {
    hero.classList.add('is-ready');
    artBase.setAttribute('filter', 'url(#settle-filter)');
    const start = performance.now();
    const dur = 2000;
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      settleDisp.setAttribute('scale', (70 * (1 - eased)).toFixed(2));
      if (t < 1) requestAnimationFrame(step);
      else artBase.removeAttribute('filter');
    };
    requestAnimationFrame(step);
    setTimeout(() => hero.classList.add('is-live'), 2400);
  });

  /* ---------- Hero: liquid lens, parallax and flowing type ---------- */
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
    const pt = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  };

  const heroFrame = (now) => {
    const active = pointer.inside;

    // Parallax drift of the line art
    const tx = active ? pointer.nx * -22 : 0;
    const ty = active ? pointer.ny * -14 : 0;
    par.x = lerp(par.x, tx, 0.06);
    par.y = lerp(par.y, ty, 0.06);
    wrap.style.transform = `translate3d(${par.x.toFixed(2)}px, ${par.y.toFixed(2)}px, 0)`;

    // Lens follows the pointer and ripples
    const target = active ? toSvg(pointer.x, pointer.y) : { x: lens.x, y: lens.y };
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
    const f = 0.016 + Math.sin(now * 0.0011) * 0.004;
    const g = 0.022 + Math.cos(now * 0.0009) * 0.005;
    lensNoise.setAttribute('baseFrequency', `${f.toFixed(4)} ${g.toFixed(4)}`);
    lensDisp.setAttribute('scale', lens.scale.toFixed(2));

    // Letters swell towards the pointer like a drop of ink
    let moving = false;
    if (letters.length && hero.classList.contains('is-live')) {
      const rects = letters.map((l) => l.el.getBoundingClientRect());
      letters.forEach((l, i) => {
        const r = rects[i];
        let fall = 0;
        if (active) {
          const dx = pointer.x - (r.left + r.width / 2);
          const dy = pointer.y - (r.top + r.height / 2);
          fall = Math.exp(-(dx * dx + dy * dy) / (2 * 110 * 110));
        }
        const tw = 300 + 420 * fall;
        const tyL = -0.09 * fall;
        l.weight = lerp(l.weight, tw, 0.14);
        l.y = lerp(l.y, tyL, 0.14);
        if (Math.abs(l.weight - tw) > 0.5) moving = true;
      });
      letters.forEach((l) => {
        l.el.style.fontWeight = Math.round(l.weight);
        l.el.style.transform = `translateY(${l.y.toFixed(3)}em)`;
      });
    }

    const settled = !active && lens.r < 0.5 && Math.abs(par.x) < 0.1 && Math.abs(par.y) < 0.1 && !moving;
    if (settled) {
      lensCircle.setAttribute('r', '0');
      heroRaf = null;
      return;
    }
    heroRaf = requestAnimationFrame(heroFrame);
  };
  const wakeHero = () => { if (!heroRaf) heroRaf = requestAnimationFrame(heroFrame); };

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX - r.left) / r.width - 0.5;
    pointer.ny = (e.clientY - r.top) / r.height - 0.5;
    if (!pointer.inside) {
      pointer.inside = true;
      const p = toSvg(e.clientX, e.clientY);
      lens.x = p.x; lens.y = p.y;
    }
    wakeHero();
  });
  hero.addEventListener('pointerleave', () => { pointer.inside = false; wakeHero(); });
  hero.addEventListener('pointerdown', () => { lens.pulse = 1; wakeHero(); });

  /* ---------- Flowing section edges and header on scroll ---------- */
  const flows = [...document.querySelectorAll('.flow')].map((sec) => ({
    sec,
    path: sec.querySelector('.wave path'),
    amp: 0,
  }));
  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.nav a')];
  const W = 1440, H = 140, POINTS = 12;

  let lastY = window.scrollY;
  let velocity = 0;
  let scrollRaf = null;

  const wavePath = (amp, phase) => {
    const pts = [];
    for (let i = 0; i <= POINTS; i++) {
      const x = (i / POINTS) * W;
      const u = i / POINTS;
      const bulge = Math.sin(Math.PI * u);
      const ripple = 0.55 * Math.sin(u * Math.PI * 2.2 + phase) + 0.25 * Math.sin(u * Math.PI * 4.1 - phase * 1.3);
      const y = H - amp * clamp(bulge * (0.7 + ripple * 0.5), 0, 1.2);
      pts.push([x, y]);
    }
    let d = `M0 ${H} L${pts[0][0]} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return `${d} L${W} ${H} Z`;
  };

  const scrollFrame = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    velocity = lerp(velocity, y - lastY, 0.2);
    lastY = y;

    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > vh * 0.9 && velocity > 2);

    let busy = Math.abs(velocity) > 0.2;

    flows.forEach((f) => {
      const top = f.sec.getBoundingClientRect().top;
      const entering = clamp((top - vh * 0.15) / (vh * 0.85), 0, 1);
      const target = top > vh + 150 || top < -150 ? 0 : entering * 110 + Math.min(Math.abs(velocity) * 1.6, 30) * (top > 0 ? 1 : 0);
      f.amp = lerp(f.amp, clamp(target, 0, 125), 0.12);
      if (Math.abs(f.amp - target) > 0.3) busy = true;
      f.path.setAttribute('d', wavePath(f.amp, y * 0.004));
    });

    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top < vh * 0.45) current = s.id; });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${current}`));

    scrollRaf = busy ? requestAnimationFrame(scrollFrame) : null;
  };
  const wakeScroll = () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(scrollFrame); };
  window.addEventListener('scroll', wakeScroll, { passive: true });
  window.addEventListener('resize', wakeScroll);
  wakeScroll();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
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
  document.querySelectorAll('.media video').forEach((v) => vio.observe(v));
})();
