/* Agency site: navigation, scroll effects, interactive components and the enquiry form */
(() => {
  'use strict';

  const EMAIL = 'mbuthuabby@gmail.com';
  const WHATSAPP = '254731389851';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  clearTimeout(window.__rf); // scripts loaded: the safety net that reveals content is not needed

  const root = document.documentElement;
  const header = $('.site-header');
  const hero = $('.hero');
  const nav = $('#site-nav');
  const toggle = $('.menu-toggle');
  const progress = $('.progress');

  /* ---------- Split headings into words that rise into place ---------- */
  $$('[data-split]').forEach((el) => {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(' ').forEach((word, i, all) => {
      const outer = document.createElement('span');
      outer.className = 'sw';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- Hero fades in once the page has painted ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (hero) hero.classList.add('is-ready');
    $$('.hero [data-split], .page-hero [data-split], .contact--page [data-split]').forEach((el) => el.classList.add('is-in'));
  }));

  /* ---------- Mobile menu ---------- */
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  /* ---------- Header shadow, scroll progress bar and timelines ---------- */
  const timelines = $$('[data-timeline]');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 8);
      if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0})`;
      timelines.forEach((tl) => {
        const r = tl.getBoundingClientRect();
        const ratio = clamp((window.innerHeight * 0.8 - r.top) / (r.height * 0.9), 0, 1);
        tl.style.setProperty('--fill', `${(ratio * 100).toFixed(1)}%`);
        const steps = $$('.step', tl);
        steps.forEach((s, i) => s.classList.toggle('is-active', ratio >= (i + 0.35) / steps.length || (ratio > 0.98)));
      });
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Reveal on scroll (content stays visible if this cannot run) ---------- */
  const revealEls = $$('[data-reveal], [data-split], .steps--timeline');
  const showAll = () => revealEls.forEach((el) => el.classList.add('is-in'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Counters ---------- */
  $$('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion || !('IntersectionObserver' in window)) { el.textContent = target; return; }
    el.textContent = '0';
    const co = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      co.disconnect();
      const start = performance.now();
      const dur = 1300;
      const step = (now) => {
        const t = clamp((now - start) / dur, 0, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0 });
    co.observe(el);
  });

  /* ---------- Rotating words in the hero ---------- */
  const rot = $('.rot');
  if (rot) {
    const words = $$('.rot-word', rot);
    let i = 0, timer = null;
    const next = () => {
      words[i].classList.remove('is-on');
      words[i].classList.add('is-out');
      const prev = words[i];
      setTimeout(() => prev.classList.remove('is-out'), 700);
      i = (i + 1) % words.length;
      words[i].classList.add('is-on');
    };
    const start = () => { if (!timer && !reduceMotion) timer = setInterval(next, 2400); };
    const stop = () => { clearInterval(timer); timer = null; };
    start();
    const holder = rot.parentElement;
    holder.addEventListener('pointerenter', stop);
    holder.addEventListener('pointerleave', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  /* ---------- Hero line art follows the pointer ---------- */
  const wrap = $('.hero-art-wrap');
  if (hero && wrap && finePointer && !reduceMotion) {
    const p = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = null;
    const frame = () => {
      p.x = lerp(p.x, p.tx, 0.07);
      p.y = lerp(p.y, p.ty, 0.07);
      wrap.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${(p.x * 0.02).toFixed(3)}deg)`;
      raf = (Math.abs(p.x - p.tx) > 0.05 || Math.abs(p.y - p.ty) > 0.05) ? requestAnimationFrame(frame) : null;
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      p.tx = ((e.clientX - r.left) / r.width - 0.5) * -34;
      p.ty = ((e.clientY - r.top) / r.height - 0.5) * -22;
      wake();
    });
    hero.addEventListener('pointerleave', () => { p.tx = 0; p.ty = 0; wake(); });
  }

  /* ---------- Spotlight that follows the pointer on cards ---------- */
  if (finePointer) {
    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Magnetic call to action buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('.btn-cta').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--tx', `${((e.clientX - r.left) / r.width - 0.5) * 10}px`);
        btn.style.setProperty('--ty', `${((e.clientY - r.top) / r.height - 0.5) * 8}px`);
      });
      btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--tx'); btn.style.removeProperty('--ty'); });
    });
  }

  /* ---------- Service tabs ---------- */
  $$('[data-tabs]').forEach((group) => {
    const tabs = $$('[role="tab"]', group);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const select = (idx, focus) => {
      tabs.forEach((t, i) => {
        const on = i === idx;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach((p, i) => {
        if (i === idx) {
          p.hidden = false;
          requestAnimationFrame(() => p.classList.add('is-active'));
        } else {
          p.classList.remove('is-active');
          p.hidden = true;
        }
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false));
      t.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- FAQ: one answer open at a time ---------- */
  const faqItems = $$('.faq-item');
  faqItems.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) faqItems.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ---------- Videos: play while on screen, with a pause button ---------- */
  const PAUSE = '<svg class="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
  const PLAY = '<svg class="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const videos = $$('.frame video');
  const vstate = new WeakMap();
  videos.forEach((v) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vid-toggle';
    btn.setAttribute('aria-label', 'Pause video');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = PAUSE + PLAY;
    v.parentElement.appendChild(btn);
    vstate.set(v, { userPaused: reduceMotion, btn });
    if (reduceMotion) { btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Play video'); }
    btn.addEventListener('click', () => {
      const st = vstate.get(v);
      st.userPaused = !st.userPaused;
      btn.setAttribute('aria-pressed', String(st.userPaused));
      btn.setAttribute('aria-label', st.userPaused ? 'Play video' : 'Pause video');
      if (st.userPaused) v.pause(); else v.play().catch(() => {});
    });
  });
  if ('IntersectionObserver' in window && videos.length) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        const st = vstate.get(v);
        if (e.isIntersecting && !st.userPaused) {
          if (v.preload === 'none') v.preload = 'auto';
          const pr = v.play();
          if (pr && pr.catch) pr.catch(() => { st.userPaused = true; st.btn.setAttribute('aria-pressed', 'true'); st.btn.setAttribute('aria-label', 'Play video'); });
        } else if (!e.isIntersecting) {
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    videos.forEach((v) => vio.observe(v));
  }

  /* ---------- Lightbox: click a screenshot to enlarge it ---------- */
  const shots = $$('.frame:not(.frame--video) img');
  if (shots.length && typeof HTMLDialogElement === 'function') {
    const dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', 'Enlarged screenshot');
    dlg.innerHTML = '<button type="button" class="lb-close" aria-label="Close enlarged view"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><img alt=""><p class="lb-cap"></p>';
    document.body.appendChild(dlg);
    const big = $('img', dlg);
    const cap = $('.lb-cap', dlg);
    let opener = null;
    const open = (img) => {
      opener = img;
      big.src = img.currentSrc && img.src ? img.src.replace('-800.webp', '.webp') : img.src;
      big.alt = img.alt;
      const fig = img.closest('figure');
      cap.textContent = fig && fig.querySelector('figcaption') ? fig.querySelector('figcaption').textContent : '';
      dlg.showModal();
    };
    shots.forEach((img) => {
      const f = img.closest('.frame');
      f.classList.add('is-zoomable');
      f.tabIndex = 0;
      f.setAttribute('role', 'button');
      f.setAttribute('aria-label', `Enlarge screenshot: ${img.alt}`);
      f.addEventListener('click', () => open(img));
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
    });
    $('.lb-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { if (opener) opener.closest('.frame').focus(); });
  }

  /* ---------- Enquiry form ----------
     This is a static site with no server, so the form builds a ready-to-send
     message and opens the visitor's email app or WhatsApp with it filled in. */
  const form = document.getElementById('enquiry');
  if (!form) return;
  const status = document.getElementById('form-status');
  const fName = document.getElementById('f-name');
  const fReach = document.getElementById('f-reach');

  const showErr = (input, errId, bad) => {
    document.getElementById(errId).hidden = !bad;
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (bad) input.setAttribute('aria-describedby', errId); else input.removeAttribute('aria-describedby');
  };
  const validate = () => {
    const nameBad = fName.value.trim().length < 2;
    const reach = fReach.value.trim();
    const reachBad = !(/^\S+@\S+\.\S+$/.test(reach) || reach.replace(/[^\d]/g, '').length >= 9);
    showErr(fName, 'e-name', nameBad);
    showErr(fReach, 'e-reach', reachBad);
    if (nameBad) { fName.focus(); return false; }
    if (reachBad) { fReach.focus(); return false; }
    return true;
  };
  fName.addEventListener('input', () => { if (fName.getAttribute('aria-invalid') === 'true') showErr(fName, 'e-name', fName.value.trim().length < 2); });
  fReach.addEventListener('input', () => { if (fReach.getAttribute('aria-invalid') === 'true') showErr(fReach, 'e-reach', false); });

  const buildMessage = () => {
    const d = new FormData(form);
    const lines = [
      'Hello,',
      '',
      `This is ${d.get('name').toString().trim()}.`,
      `Type of business: ${d.get('business')}`,
      `Looking for: ${d.get('need')}`,
    ];
    const msg = d.get('message').toString().trim();
    if (msg) lines.push('', msg);
    lines.push('', `Reach us on: ${d.get('reach').toString().trim()}`);
    return lines.join('\n');
  };

  // Open a link the way a normal click would (works for mailto: and new tabs, and is not blocked as a popup)
  const openLink = (href, newTab) => {
    const a = document.createElement('a');
    a.href = href;
    if (newTab) { a.target = '_blank'; a.rel = 'noopener'; }
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const subject = `Project enquiry from ${fName.value.trim()}`;
    status.className = 'form-status is-ok';
    status.textContent = `Opening your email app with your message ready to send. If nothing opens, email ${EMAIL} or use WhatsApp instead.`;
    openLink(`mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildMessage())}`, false);
  });

  document.getElementById('send-wa').addEventListener('click', () => {
    if (!validate()) return;
    status.className = 'form-status is-ok';
    status.textContent = 'Opening WhatsApp with your message ready to send.';
    openLink(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildMessage())}`, true);
  });
})();
