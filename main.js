/**
 * Shared site behaviour: floating nav (shrink/hide + active link), mobile
 * menu, scroll-reveal, animated counters, testimonial slider, gallery
 * filter + lightbox. Every page includes this file; each block silently
 * no-ops if its markup isn't present on that page.
 */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initMobileMenu();
  initReveal();
  initCounters();
  initTestimonials();
  initGalleryFilter();
  initLightbox();
  initRipple();
  initHeroParallax();
  initDecoScrollParallax();
});

/* ---------------- NAV: shrink + hide-on-scroll-down + scrollspy ---------------- */
function initNav() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 40);

    if (y > lastY && y > 160) {
      header.classList.add("nav-hidden");
    } else {
      header.classList.remove("nav-hidden");
    }
    lastY = y;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  const sections = [...document.querySelectorAll("main [id], body > section[id]")];
  const navLinks = [...document.querySelectorAll(".nav-menu a[href*='#']")];
  if (!sections.length || !navLinks.length) return;

  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        const match = link.getAttribute("href").endsWith("#" + id);
        link.classList.toggle("active-link", match);
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  sections.forEach(section => spy.observe(section));
}

/* ---------------- MOBILE MENU ---------------- */
function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  const container = document.querySelector(".nav-container");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.classList.remove("open");
    menu.classList.remove("open");
    container?.classList.remove("menu-open");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.classList.toggle("open");
    menu.classList.toggle("open", isOpen);
    container?.classList.toggle("menu-open", isOpen);
  });

  document.addEventListener("click", e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) closeMenu();
  });

  menu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
}

/* ---------------- SCROLL REVEAL ---------------- */
function initReveal() {
  const targets = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
  if (!targets.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  targets.forEach(el => observer.observe(el));
}

/* ---------------- ANIMATED COUNTERS ---------------- */
function initCounters() {
  const counters = document.querySelectorAll("[data-count-to]");
  if (!counters.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  counters.forEach(el => observer.observe(el));

  function animateCount(el) {
    const target = parseFloat(el.dataset.countTo);
    const suffixEl = el.querySelector(".suffix");
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.firstChild.nodeType === Node.TEXT_NODE
        ? (el.firstChild.textContent = value)
        : el.prepend(document.createTextNode(value));
      if (progress < 1) requestAnimationFrame(tick);
      else if (el.firstChild.nodeType === Node.TEXT_NODE) el.firstChild.textContent = target;
    }
    requestAnimationFrame(tick);
    if (suffixEl) el.appendChild(suffixEl);
  }
}

/* ---------------- TESTIMONIAL SLIDER ---------------- */
function initTestimonials() {
  const wrap = document.querySelector(".testi-wrap");
  if (!wrap) return;

  const slides = [...wrap.querySelectorAll(".testi-slide")];
  const dotsWrap = wrap.querySelector(".testi-controls");
  const prevBtn = wrap.querySelector(".testi-prev");
  const nextBtn = wrap.querySelector(".testi-next");
  if (!slides.length) return;

  let index = 0;
  let timer = null;

  if (dotsWrap) {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "testi-dot" + (i === 0 ? " active" : "");
      dot.type = "button";
      dot.setAttribute("aria-label", "Testimonial " + (i + 1));
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  prevBtn?.addEventListener("click", () => goTo(index - 1));
  nextBtn?.addEventListener("click", () => goTo(index + 1));
  wrap.addEventListener("mouseenter", stop);
  wrap.addEventListener("mouseleave", start);

  function goTo(newIndex) {
    slides[index].classList.remove("active");
    index = (newIndex + slides.length) % slides.length;
    slides[index].classList.add("active");
    if (dotsWrap) [...dotsWrap.children].forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function start() { timer = setInterval(() => goTo(index + 1), 6000); }
  function stop() { clearInterval(timer); }
  start();
}

/* ---------------- GALLERY FILTER ---------------- */
function initGalleryFilter() {
  const filters = document.querySelectorAll(".gfilter");
  const tiles = document.querySelectorAll(".g-tile");
  if (!filters.length || !tiles.length) return;

  filters.forEach(btn => {
    btn.addEventListener("click", () => {
      filters.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.filter;

      tiles.forEach(tile => {
        const cats = (tile.dataset.category || "").split(" ");
        const show = cat === "all" || cats.includes(cat);
        tile.classList.toggle("hidden-item", !show);
      });
    });
  });
}

/* ---------------- LIGHTBOX ---------------- */
function initLightbox() {
  const overlay = document.getElementById("lightbox");
  if (!overlay) return;

  const stage = document.getElementById("lb-stage");
  const closeBtn = document.getElementById("lb-close");

  document.querySelectorAll(".g-tile[data-full], .lb-trigger").forEach(tile => {
    tile.addEventListener("click", () => {
      const full = tile.dataset.full || tile.querySelector("img,video")?.getAttribute("src");
      const isVideo = tile.dataset.type === "video";
      const alt = tile.querySelector("img")?.alt || "";

      stage.innerHTML = isVideo
        ? `<video src="${full}" controls autoplay playsinline></video>`
        : `<img src="${full}" alt="${alt}">`;

      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });

  function closeLb() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    stage.innerHTML = "";
  }

  closeBtn?.addEventListener("click", closeLb);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeLb(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeLb(); });
}

/* ---------------- BUTTON RIPPLE (touch/click feedback) ---------------- */
function initRipple() {
  document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("pointerdown", e => {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty("--rx", (e.clientX - rect.left) + "px");
      btn.style.setProperty("--ry", (e.clientY - rect.top) + "px");
    });
  });
}

/* ---------------- HERO MOUSE PARALLAX ---------------- */
function initHeroParallax() {
  const hero = document.querySelector(".hero");
  const visual = document.getElementById("heroVisual");
  if (!hero || !visual) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  hero.addEventListener("mousemove", e => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    visual.style.transform = `translate(${px * -12}px, ${py * -10}px) rotate(${px * 1.1}deg)`;
  });

  hero.addEventListener("mouseleave", () => {
    visual.style.transform = "";
  });
}

/* ---------------- SELECTED DECORATIVE ELEMENTS: SCROLL PARALLAX ----------------
 * A very gentle, cheap scroll-linked drift for the hero's two orbit rings —
 * only these two elements, only while the hero is on screen (IntersectionObserver
 * gates the scroll listener), and rAF-throttled so it never fires more than
 * once per frame. Everything else's motion comes from the CSS float
 * animation, which is free (GPU-composited, no JS per frame). */
function initDecoScrollParallax() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const targets = [
    { el: document.getElementById("heroOrbitA"), speed: 0.05 },
    { el: document.getElementById("heroOrbitB"), speed: -0.04 }
  ].filter(t => t.el);
  if (!targets.length) return;

  let active = false;
  let ticking = false;

  const observer = new IntersectionObserver(entries => {
    active = entries[0].isIntersecting;
    if (active) onScroll();
  }, { threshold: 0 });
  observer.observe(targets[0].el.closest(".hero"));

  function onScroll() {
    if (!active || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      targets.forEach(t => {
        t.el.style.setProperty("--deco-scroll-y", (y * t.speed).toFixed(1) + "px");
      });
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
}
