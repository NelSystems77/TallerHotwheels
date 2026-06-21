(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var closeBtn = document.querySelector(".nav-close");
  var links = document.querySelector(".nav-links");
  var scrim = document.querySelector(".nav-scrim");
  var navAnchors = document.querySelectorAll(".nav-links a");

  function openNav() {
    links.classList.add("is-open");
    scrim.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeNav() {
    links.classList.remove("is-open");
    scrim.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (toggle) toggle.addEventListener("click", openNav);
  if (closeBtn) closeBtn.addEventListener("click", closeNav);
  if (scrim) scrim.addEventListener("click", closeNav);
  navAnchors.forEach(function (a) {
    a.addEventListener("click", closeNav);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* ---------- Sticky header shadow on scroll (purely cosmetic) ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.style.boxShadow = window.scrollY > 8
        ? "0 6px 18px rgba(0,0,0,.25)"
        : "0 4px 14px rgba(0,0,0,.18)";
    };
    document.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Before / After compare slider ---------- */
  document.querySelectorAll(".compare").forEach(function (el) {
    var beforeWrap = el.querySelector(".before-wrap");
    var handle = el.querySelector(".compare-handle");
    var range = el.querySelector(".compare-range");

    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      beforeWrap.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
      handle.style.left = pct + "%";
      if (range) range.value = pct;
    }

    if (range) {
      range.addEventListener("input", function () {
        setPos(parseFloat(range.value));
      });
    }

    // Pointer drag directly on the image for nicer touch feel
    var dragging = false;
    function pctFromClientX(clientX) {
      var rect = el.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }
    el.addEventListener("pointerdown", function (e) {
      dragging = true;
      setPos(pctFromClientX(e.clientX));
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      setPos(pctFromClientX(e.clientX));
    });
    window.addEventListener("pointerup", function () {
      dragging = false;
    });

    setPos(50);
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
