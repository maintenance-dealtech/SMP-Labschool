// Shared behaviour for the SMP Labschool Jakarta pages: scroll reveal, card
// hovers, gallery filter + lightbox. Called once per page from its DC logic.

export function wireAll(root) {
  if (!root) return () => {};
  const off = [];
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); off.push(() => el.removeEventListener(ev, fn, opt)); };

  // scroll reveal — hide only what is still below the fold, so a failed
  // observer can never leave content invisible.
  const items = Array.from(root.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window) {
    items.forEach((el) => {
      el.style.transition = 'opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1)';
      if (el.getBoundingClientRect().top > window.innerHeight * 0.88) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
      }
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const d = parseFloat(en.target.getAttribute('data-reveal-delay') || '0');
        setTimeout(() => { en.target.style.opacity = '1'; en.target.style.transform = 'none'; }, d);
        io.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
    off.push(() => io.disconnect());
    const failsafe = setTimeout(() => items.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; }), 4000);
    off.push(() => clearTimeout(failsafe));
  }

  // news thumbnail zoom
  root.querySelectorAll('[data-news]').forEach((card) => {
    const z = card.querySelector('[data-zoom]');
    if (!z) return;
    on(card, 'mouseenter', () => { z.style.transform = 'scale(1.07)'; });
    on(card, 'mouseleave', () => { z.style.transform = 'none'; });
  });

  // gallery hover overlay + lightbox
  const lb = root.querySelector('[data-lightbox]');
  const lbImg = root.querySelector('[data-lightbox-img]');
  const lbEmpty = root.querySelector('[data-lightbox-empty]');
  const lbCap = root.querySelector('[data-lightbox-cap]');
  const closeLb = () => { if (lb) lb.style.display = 'none'; };
  const openLb = (fig) => {
    if (!lb) return;
    const slot = fig.querySelector('image-slot');
    let src = '';
    try { src = ((slot && slot.shadowRoot && slot.shadowRoot.querySelector('.frame img')) || {}).src || ''; } catch (_) {}
    const filled = !!src && !!slot && slot.hasAttribute('data-filled');
    if (lbImg) { lbImg.style.display = filled ? 'block' : 'none'; if (filled) lbImg.src = src; }
    if (lbEmpty) lbEmpty.style.display = filled ? 'none' : 'flex';
    if (lbCap) lbCap.textContent = fig.getAttribute('data-title') || '';
    lb.style.display = 'flex';
  };
  root.querySelectorAll('[data-gal]').forEach((fig) => {
    const ov = fig.querySelector('[data-gal-ov]');
    const img = fig.querySelector('[data-gal-img]');
    on(fig, 'mouseenter', () => {
      if (ov) ov.style.opacity = '1';
      if (img) img.style.transform = 'scale(1.08)';
      fig.style.boxShadow = '0 22px 44px rgba(8,45,110,.2)';
    });
    on(fig, 'mouseleave', () => {
      if (ov) ov.style.opacity = '0';
      if (img) img.style.transform = 'none';
      fig.style.boxShadow = '0 10px 26px rgba(8,45,110,.08)';
    });
    const btn = fig.querySelector('[data-gal-zoom]');
    if (btn) on(btn, 'click', (e) => { e.stopPropagation(); e.preventDefault(); openLb(fig); });
  });
  const lbClose = root.querySelector('[data-lightbox-close]');
  if (lbClose) on(lbClose, 'click', closeLb);
  if (lb) on(lb, 'click', (e) => { if (e.target === lb) closeLb(); });
  on(document, 'keydown', (e) => { if (e.key === 'Escape') closeLb(); });

  // category filter (gallery cards or news cards)
  const pills = Array.from(root.querySelectorAll('[data-filter]'));
  const cards = Array.from(root.querySelectorAll('[data-cat]'));
  const box = root.querySelector('[data-filters]');
  const cfg = (k, d) => (box && box.getAttribute('data-' + k)) || d;
  pills.forEach((p) => on(p, 'click', () => {
    const cat = p.getAttribute('data-filter');
    pills.forEach((q) => {
      const active = q === p;
      q.style.background = active ? cfg('active-bg', 'linear-gradient(135deg,#3B82F6,#7C3AED)') : cfg('idle-bg', '#fff');
      q.style.color = active ? cfg('active-color', '#fff') : cfg('idle-color', '#64748B');
      q.style.borderColor = active ? cfg('active-border', 'transparent') : cfg('idle-border', '#E4EBF6');
      q.style.fontWeight = active ? '600' : '500';
      q.style.boxShadow = active ? cfg('active-shadow', '0 10px 22px rgba(99,102,241,.3)') : 'none';
    });
    cards.forEach((f) => {
      const show = cat === 'semua' || f.getAttribute('data-cat') === cat;
      if (show) {
        f.style.display = '';
        requestAnimationFrame(() => { f.style.opacity = '1'; f.style.transform = 'none'; });
      } else {
        f.style.opacity = '0';
        f.style.transform = 'scale(.96)';
        setTimeout(() => { if (f.style.opacity === '0') f.style.display = 'none'; }, 320);
      }
    });
  }));

  // responsive: explicit column counts per breakpoint (no media queries available)
  const cols = () => {
    const w = window.innerWidth;
    root.querySelectorAll('[data-grid]').forEach((el) => {
      const n = parseInt(el.getAttribute('data-grid'), 10) || 3;
      let c;
      if (n >= 4) c = w >= 980 ? 4 : w >= 330 ? 2 : 1;
      else if (n === 3) c = w >= 760 ? 3 : 1;
      else c = w >= 780 ? 2 : 1;
      el.style.gridTemplateColumns = 'repeat(' + c + ',minmax(0,1fr))';
    });
    root.querySelectorAll('[data-hide-narrow]').forEach((el) => {
      el.style.display = w < 640 ? 'none' : 'flex';
    });
  };
  on(window, 'resize', cols);
  cols();

  // mobile-only layout tweaks: desktop keeps its original single-row styling;
  // only viewports narrower than NARROW get the stacked/rewrapped treatment.
  const NARROW = 640;
  const newsBar = root.querySelector('[data-news-filter-bar]');
  const newsFilters = newsBar ? newsBar.querySelector('[data-filters-toggle]') : null;
  if (newsBar && newsFilters) {
    const layoutNews = () => {
      if (window.innerWidth < NARROW) {
        newsBar.style.flexDirection = 'column';
        newsBar.style.alignItems = 'stretch';
        newsFilters.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;width:100%;margin-top:14px';
      } else {
        newsBar.style.flexDirection = 'row';
        newsBar.style.alignItems = 'center';
        newsFilters.style.cssText = 'display:flex;align-items:center;gap:9px;flex:1 1 280px;min-width:0;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px';
      }
    };
    on(window, 'resize', layoutNews);
    layoutNews();
  }

  root.querySelectorAll('[data-share-row]').forEach((row) => {
    const label = row.querySelector('[data-share-label]');
    const links = row.querySelector('[data-share-links]');
    const layoutShare = () => {
      if (window.innerWidth < NARROW) {
        row.style.textAlign = 'center';
        if (label) label.style.cssText = 'display:block;font-size:12.5px;color:#64748B;margin-bottom:12px';
        if (links) links.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:320px;margin:0 auto';
      } else {
        row.style.textAlign = '';
        if (label) label.style.cssText = 'font-size:12.5px;color:#64748B';
        if (links) links.style.cssText = 'display:contents';
      }
    };
    on(window, 'resize', layoutShare);
    layoutShare();
  });

  root.querySelectorAll('[data-justify-mobile-fix]').forEach((el) => {
    const layoutJustify = () => { el.style.textAlign = window.innerWidth < NARROW ? 'left' : 'justify'; };
    on(window, 'resize', layoutJustify);
    layoutJustify();
  });

  // news cards: on narrow screens, group into 2 swipeable slides (scroll-snap)
  // instead of one tall stack; desktop keeps its original grid untouched.
  const newsSlider = root.querySelector('[data-news-slider]');
  const newsDots = root.querySelector('[data-news-dots]');
  if (newsSlider && newsDots) {
    const cards = Array.from(newsSlider.children);
    const GROUP = 2;
    const SLIDER_BP = 760;
    let sliding = false;
    let scrollHandler = null;

    const teardown = () => {
      if (!sliding) return;
      cards.forEach((c) => newsSlider.appendChild(c));
      newsSlider.querySelectorAll('[data-news-page]').forEach((p) => p.remove());
      newsSlider.style.cssText = 'display:grid;min-width:0;grid-template-columns:repeat(auto-fit,minmax(268px,1fr));gap:24px;margin-top:40px';
      if (scrollHandler) { newsSlider.removeEventListener('scroll', scrollHandler); scrollHandler = null; }
      newsDots.style.display = 'none';
      newsDots.innerHTML = '';
      sliding = false;
    };

    const setup = () => {
      if (sliding) return;
      newsSlider.style.cssText = 'display:flex;margin-top:40px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none';
      const pages = [];
      for (let i = 0; i < cards.length; i += GROUP) pages.push(cards.slice(i, i + GROUP));
      pages.forEach((group) => {
        const page = document.createElement('div');
        page.setAttribute('data-news-page', '');
        page.style.cssText = 'flex:0 0 100%;min-width:0;scroll-snap-align:start;display:flex;flex-direction:column;gap:20px;padding:2px 2px 4px';
        group.forEach((c) => page.appendChild(c));
        newsSlider.appendChild(page);
      });
      newsDots.innerHTML = '';
      newsDots.style.display = 'flex';
      const setActive = (idx) => {
        Array.from(newsDots.children).forEach((d, i) => {
          d.style.background = i === idx ? 'linear-gradient(135deg,#3B82F6,#7C3AED)' : '#E2E8F5';
        });
      };
      pages.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.style.cssText = 'width:8px;height:8px;border-radius:999px;border:none;padding:0;cursor:pointer;transition:background .3s;background:' + (i === 0 ? 'linear-gradient(135deg,#3B82F6,#7C3AED)' : '#E2E8F5');
        dot.addEventListener('click', () => {
          const target = newsSlider.children[i];
          if (target) newsSlider.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
        });
        newsDots.appendChild(dot);
      });
      scrollHandler = () => {
        const idx = Math.max(0, Math.min(pages.length - 1, Math.round(newsSlider.scrollLeft / Math.max(1, newsSlider.clientWidth))));
        setActive(idx);
      };
      newsSlider.addEventListener('scroll', scrollHandler, { passive: true });
      sliding = true;
    };

    const applyNews = () => { if (window.innerWidth < SLIDER_BP) setup(); else teardown(); };
    on(window, 'resize', applyNews);
    applyNews();
  }

  // number count-up: animate data-count elements from 0 to their target once visible
  const counters = Array.from(root.querySelectorAll('[data-count]'));
  if (counters.length) {
    const fmt = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const animateCount = (el) => {
      const target = parseInt(el.getAttribute('data-count'), 10) || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      const dur = 1300;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    counters.forEach((el) => { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });
    if ('IntersectionObserver' in window) {
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          animateCount(en.target);
          io2.unobserve(en.target);
        });
      }, { threshold: 0.4 });
      counters.forEach((el) => io2.observe(el));
      off.push(() => io2.disconnect());
    } else {
      counters.forEach((el) => animateCount(el));
    }
  }

  return () => off.forEach((f) => f());
}
