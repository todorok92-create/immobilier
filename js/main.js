/* ==========================================================================
   AZUR IMMOBILIER — JS principal (vanilla, zéro dépendance)
   Sections : loader, header/nav, reveal au scroll, compteurs,
   galerie filtrable, lightbox, modale vidéo, parallax.
   ========================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. LOADER — apparition du hero quand l'image principale est prête
     ------------------------------------------------------------------ */
  (function initLoader() {
    var body = document.body;
    var done = false;
    var revealHero = function () {
      if (done) return;
      done = true;
      body.classList.add("is-loaded");
    };
    // Filet de sécurité : ne jamais laisser le hero invisible
    setTimeout(revealHero, 2200);
    var img = $(".hero-bg img");
    if (img && !img.complete) {
      img.addEventListener("load", revealHero, { once: true });
      img.addEventListener("error", revealHero, { once: true });
    } else {
      revealHero();
    }
  })();

  /* ------------------------------------------------------------------
     2. HEADER + NAVIGATION
     ------------------------------------------------------------------ */
  var header = $("#site-header");
  var burger = $("#burger");
  var nav = $("#main-nav");
  var sections = $$("main section[id]");
  var navLinks = $$(".main-nav a[href^='#']");

  function updateHeader() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle("is-scrolled", y > 40);
    var currentId = "";
    sections.forEach(function (sec) {
      if (sec.getBoundingClientRect().top <= 140) currentId = sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + currentId);
    });
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", updateHeader);
  updateHeader();

  function closeMenu() {
    nav.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }

  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });

  $$(".main-nav a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ------------------------------------------------------------------
     3. REVEAL AU SCROLL (IntersectionObserver)
        [data-reveal] et .gallery-item reçoivent .in-view
     ------------------------------------------------------------------ */
  var galleryItems = $$(".gallery-item");
  var revealEls = $$("[data-reveal]");
  var allReveal = revealEls.concat(galleryItems);

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    allReveal.forEach(function (el) { io.observe(el); });
  } else {
    allReveal.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ------------------------------------------------------------------
     4. COMPTEURS ANIMÉS DU HERO
     ------------------------------------------------------------------ */
  (function initCounters() {
    var counters = $$(".count");
    if (!counters.length) return;

    function animate(el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (reduceMotion) { el.textContent = String(target); return; }
      var start = null;
      var DURATION = 1400;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / DURATION, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { cio.observe(c); });
    } else {
      counters.forEach(animate);
    }
  })();

  /* ------------------------------------------------------------------
     5. GALERIE FILTRABLE
     ------------------------------------------------------------------ */
  (function initGallery() {
    var grid = $("#gallery-grid");
    var btns = $$(".filter-btn");
    if (!grid || !btns.length) return;

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter");
        btns.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", String(active));
        });

        grid.classList.add("is-filtering");

        window.setTimeout(function () {
          galleryItems.forEach(function (item, i) {
            var show = filter === "all" || item.getAttribute("data-cat") === filter;
            item.classList.toggle("is-hidden", !show);
            if (show) {
              item.style.transitionDelay = Math.min(i * 35, 350) + "ms";
              item.classList.add("in-view");
            } else {
              item.style.transitionDelay = "0ms";
            }
          });
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              grid.classList.remove("is-filtering");
            });
          });
        }, 260);
      });
    });

    // Boutons "Voir la galerie" des cartes -> active le filtre correspondant
    $$(".js-see-gallery").forEach(function (link) {
      link.addEventListener("click", function () {
        var f = link.getAttribute("data-filter");
        var target = $$(".filter-btn").filter(function (b) {
          return b.getAttribute("data-filter") === f;
        })[0];
        if (target) target.click();
      });
    });
  })();

  /* ------------------------------------------------------------------
     6. LIGHTBOX PHOTOS
     ------------------------------------------------------------------ */
  (function initLightbox() {
    var lightbox = $("#lightbox");
    var lbImg = $("#lb-img");
    var lbCaption = $("#lb-caption");
    if (!lightbox || !lbImg) return;

    var visible = [];
    var index = 0;
    var lastFocus = null;

    function render() {
      var item = visible[index];
      if (!item) return;
      lbImg.src = item.getAttribute("data-full");
      lbImg.alt = item.getAttribute("data-caption") || "";
      lbCaption.textContent = item.getAttribute("data-caption") || "";
    }

    function open(item) {
      visible = galleryItems.filter(function (it) {
        return !it.classList.contains("is-hidden");
      });
      index = Math.max(0, visible.indexOf(item));
      lastFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(function () { lightbox.classList.add("is-open"); });
      render();
      $(".lb-close", lightbox).focus();
    }

    function close() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        lightbox.hidden = true;
        lbImg.src = "";
      }, 300);
      if (lastFocus) lastFocus.focus();
    }

    function move(step) {
      if (!visible.length) return;
      index = (index + step + visible.length) % visible.length;
      render();
    }

    galleryItems.forEach(function (item) {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.addEventListener("click", function () { open(item); });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(item);
        }
      });
    });

    $$("[data-lb]", lightbox).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-lb");
        if (action === "close") close();
        if (action === "prev") move(-1);
        if (action === "next") move(1);
      });
    });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    });
  })();

  /* ------------------------------------------------------------------
     7. MODALE VIDÉO — chargement à la demande
     ------------------------------------------------------------------ */
  (function initVideoModal() {
    var modal = $("#video-modal");
    var video = $("#vm-video");
    if (!modal || !video) return;
    var lastFocus = null;

    function open(src, poster) {
      lastFocus = document.activeElement;
      video.innerHTML = "";
      video.src = src;
      if (poster) video.poster = poster; else video.removeAttribute("poster");
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(function () {
        modal.classList.add("is-open");
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* lecture bloquée : l'utilisateur lancera */ });
      });
      $(".vm-close", modal).focus();
    }

    function close() {
      video.pause();
      video.removeAttribute("src");
      video.load(); // libère la mémoire / la bande passante
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      window.setTimeout(function () { modal.hidden = true; }, 300);
      if (lastFocus) lastFocus.focus();
    }

    $$(".js-open-video").forEach(function (btn) {
      btn.addEventListener("click", function () {
        open(btn.getAttribute("data-video"), btn.getAttribute("data-poster"));
      });
    });

    $$("[data-vm]", modal).forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!modal.hidden && e.key === "Escape") close();
    });
  })();

  /* ------------------------------------------------------------------
     8. VIGNETTE VIDÉO GRAND LAHOU (carte propriété)
     ------------------------------------------------------------------ */
  (function initLazyCardVideo() {
    var v = $(".js-lazy-video");
    if (!v) return;
    var loaded = false;
    var attach = function () {
      if (loaded) return;
      loaded = true;
      v.src = v.getAttribute("data-src");
      v.load();
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    };
    if ("IntersectionObserver" in window && !reduceMotion) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            attach();
            vio.unobserve(v);
          }
        });
      }, { threshold: 0.4 });
      vio.observe(v);
    }
    // Fallback si pas d'IO : on laisse le poster/image statique
  })();

  /* ------------------------------------------------------------------
     9. PARALLAX DOUX (bandeau CTA)
     ------------------------------------------------------------------ */
  (function initParallax() {
    if (reduceMotion) return;
    var layers = $$("[data-parallax-speed]");
    if (!layers.length) return;
    var ticking = false;

    function update() {
      var vh = window.innerHeight;
      layers.forEach(function (layer) {
        var speed = parseFloat(layer.getAttribute("data-parallax-speed")) || 0.15;
        var rect = layer.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        layer.style.transform = "translate3d(0, " + offset.toFixed(1) + "px, 0)";
      });
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  })();

  /* ------------------------------------------------------------------
     10. FORMULAIRE DE CONTACT (validation + ouverture mailto)
     ------------------------------------------------------------------ */
  (function initForm() {
    var form = $("#contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#f-name");
      var email = $("#f-email");
      var message = $("#f-message");
      var ok = true;

      [name, email, message].forEach(function (field) {
        var valid = field.value.trim().length > 1;
        if (field === email) valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        field.classList.toggle("is-invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) return;

      var property = $("#f-property");
      var subject = encodeURIComponent("Demande depuis le site — " + (property.value || "Contact général"));
      var body = encodeURIComponent(
        "Nom : " + name.value.trim() +
        "\nE-mail : " + email.value.trim() +
        "\nBien concerné : " + (property.value || "—") +
        "\n\n" + message.value.trim()
      );
      window.location.href = "mailto:contact@azur-immobilier.ci?subject=" + subject + "&body=" + body;
    });
  })();

})();
