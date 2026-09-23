/* =============================================================
   Diego Meléndez — interacciones
   Sin librerías. Todo el contenido ya está en el HTML;
   este archivo solo añade movimiento y detalles.
   ============================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const hasIO = "IntersectionObserver" in window;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* Sombra de la barra superior al bajar */
  function initHeader() {
    const header = $(".site-header");
    if (!header) return;
    let ticking = false;
    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 16);
      ticking = false;
    };
    update();
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* Menú del celular: se cierra al elegir una opción, al tocar fuera o con Escape */
  function initMenu() {
    const menu = $(".nav-menu");
    if (!menu) return;
    const close = () => { menu.open = false; };
    $$(".nav-panel a", menu).forEach((a) => a.addEventListener("click", close));
    document.addEventListener("click", (e) => {
      if (menu.open && !menu.contains(e.target)) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.open) {
        close();
        $("summary", menu).focus();
      }
    });
  }

  /* Aparición suave de los bloques al hacer scroll */
  function initReveals() {
    const els = $$("[data-reveal]");
    if (!els.length) return;
    const show = (el) => el.classList.add("is-revealed");
    if (!hasIO) { els.forEach(show); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });
    els.forEach((el) => io.observe(el));
    // Red de seguridad: a los 6 s se muestra todo lo que ya esté en pantalla
    setTimeout(() => {
      $$("[data-reveal]:not(.is-revealed)").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) show(el);
      });
    }, 6000);
  }

  /* Las ilustraciones solo se animan mientras se ven (ahorra batería en el celular) */
  function initPlayers() {
    const els = $$("[data-play]");
    if (!els.length) return;
    if (!hasIO) { els.forEach((el) => el.classList.add("in-view")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("in-view", entry.isIntersecting));
    }, { threshold: 0.05 });
    els.forEach((el) => io.observe(el));
  }

  /* Reloj con la hora real de Santa Marta (UTC−5 todo el año, sin horario de verano):
     el marcador funciona como la aguja de las horas (12 h) y el sol/luna siguen el día (24 h) */
  function initDial() {
    const dial = $("[data-dial]");
    if (!dial) return;
    const update = () => {
      const now = new Date();
      const hours = ((now.getUTCHours() + 19) % 24) + now.getUTCMinutes() / 60;
      let phase = "noche";
      if (hours >= 5.25 && hours < 7) phase = "amanecer";
      else if (hours >= 7 && hours < 16.75) phase = "dia";
      else if (hours >= 16.75 && hours < 19) phase = "atardecer";
      dial.style.setProperty("--dial-rot", ((hours - 12) * 15).toFixed(2) + "deg");
      dial.style.setProperty("--hand-rot", ((hours % 12) * 30).toFixed(2) + "deg");
      dial.dataset.phase = phase;
    };
    update();
    setInterval(update, 60 * 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) update(); });
  }

  /* Demo: las mesas cambian de estado, como si fuera en tiempo real */
  function initTables() {
    const grid = $("[data-tables]");
    if (!grid) return;
    const tables = $$(".table", grid);
    const player = grid.closest("[data-play]");
    const tick = () => {
      if (document.hidden || (player && !player.classList.contains("in-view"))) return;
      const busy = tables.filter((t) => t.classList.contains("is-busy"));
      const free = tables.filter((t) => !t.classList.contains("is-busy"));
      let pool = tables;
      if (busy.length >= 8) pool = busy;
      else if (busy.length <= 3) pool = free;
      const table = pool[Math.floor(Math.random() * pool.length)];
      table.classList.toggle("is-busy");
      table.classList.add("is-flip");
      setTimeout(() => table.classList.remove("is-flip"), 450);
    };
    setInterval(tick, 1700);
  }

  /* Marca en el menú la sección que se está viendo */
  function initActiveLink() {
    const links = $$(".nav-links a[href^='#']");
    if (!links.length || !hasIO) return;
    const bySection = new Map();
    links.forEach((a) => {
      const section = document.getElementById(a.getAttribute("href").slice(1));
      if (section) bySection.set(section, a);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const current = bySection.get(entry.target);
        links.forEach((a) => a.classList.toggle("is-active", a === current));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    bySection.forEach((_, section) => io.observe(section));
    const hero = document.getElementById("inicio");
    if (hero) io.observe(hero);
  }

  /* Celular: botón fijo de WhatsApp cuando no se ve el de la portada ni el de contacto */
  function initStickyCta() {
    const bar = $("[data-sticky-cta]");
    const heroCta = $("[data-hero-cta]");
    const contact = document.getElementById("contacto");
    if (!bar || !heroCta || !contact || !hasIO) return;
    let heroVisible = true;
    let contactVisible = false;
    const update = () => bar.classList.toggle("is-visible", !heroVisible && !contactVisible);
    new IntersectionObserver((entries) => {
      heroVisible = entries[entries.length - 1].isIntersecting;
      update();
    }).observe(heroCta);
    new IntersectionObserver((entries) => {
      contactVisible = entries[entries.length - 1].isIntersecting;
      update();
    }, { threshold: 0.05 }).observe(contact);
  }

  /* Botones principales: se acercan sutilmente al cursor (solo con mouse) */
  function initMagnetic() {
    if (!finePointer) return;
    $$("[data-magnetic]").forEach((el) => {
      const strength = 0.2;
      const inner = document.createElement("span");
      inner.className = "magnetic-inner";
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add("has-magnetic");

      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      const loop = () => {
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        inner.style.transform = "translate3d(" + cx.toFixed(2) + "px, " + cy.toFixed(2) + "px, 0)";
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : null;
      };
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * strength;
        ty = (e.clientY - r.top - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("mouseleave", () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
  }

  function boot() {
    safe(initHeader, "initHeader");
    safe(initMenu, "initMenu");
    safe(initReveals, "initReveals");
    safe(initPlayers, "initPlayers");
    safe(initDial, "initDial");
    safe(initTables, "initTables");
    safe(initActiveLink, "initActiveLink");
    safe(initStickyCta, "initStickyCta");
    safe(initMagnetic, "initMagnetic");
    root.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
