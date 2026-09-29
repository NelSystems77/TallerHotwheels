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

  /* ---------- Hot Wheels customizer ---------- */
  (function () {
    var uploadPanel = document.querySelector("[data-customizer-upload]");
    var editorPanel = document.querySelector("[data-customizer-editor]");
    var fileInput = document.getElementById("customizer-file");
    var dropLabel = document.querySelector(".customizer-drop");
    var stage = document.getElementById("customizer-stage");
    var photo = document.getElementById("customizer-photo");
    var selectedPanel = document.querySelector("[data-customizer-selected]");
    var sizeCtrl = selectedPanel && selectedPanel.querySelector('[data-ctrl="size"]');
    var rotateCtrl = selectedPanel && selectedPanel.querySelector('[data-ctrl="rotate"]');

    if (!stage || !fileInput) return;

    var PARTS = {
      "spoiler-gt": { src: "assets/img/customizer/spoiler-gt.svg", ratio: 260 / 110, size: 34 },
      "spoiler-sport": { src: "assets/img/customizer/spoiler-sport.svg", ratio: 260 / 90, size: 34 },
      "rim-chrome": { src: "assets/img/customizer/rim-chrome.svg", ratio: 1, size: 18 },
      "rim-sport": { src: "assets/img/customizer/rim-sport.svg", ratio: 1, size: 18 },
      "tire-mt": { src: "assets/img/customizer/tire-mt.svg", ratio: 200 / 220, size: 20 },
      "tire-slick": { src: "assets/img/customizer/tire-slick.svg", ratio: 1, size: 18 }
    };

    var stickers = [];
    var selectedId = null;
    var uid = 0;
    var zCounter = 10;
    var photoAspect = 1;

    function readFile(file) {
      if (!file || file.type.indexOf("image/") !== 0) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        photo.onload = function () {
          photoAspect = photo.naturalWidth / photo.naturalHeight || 1;
          uploadPanel.hidden = true;
          editorPanel.hidden = false;
          layoutStage();
          stickers = [];
          selectedId = null;
          renderStickers();
        };
        photo.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function layoutStage() {
      var w = stage.clientWidth || stage.parentElement.clientWidth;
      stage.style.height = (w / photoAspect) + "px";
    }

    fileInput.addEventListener("change", function () {
      readFile(fileInput.files && fileInput.files[0]);
    });
    dropLabel.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });
    ["dragover", "dragenter"].forEach(function (evt) {
      dropLabel.addEventListener(evt, function (e) {
        e.preventDefault();
        dropLabel.classList.add("is-dragover");
      });
    });
    ["dragleave", "dragend"].forEach(function (evt) {
      dropLabel.addEventListener(evt, function () {
        dropLabel.classList.remove("is-dragover");
      });
    });
    dropLabel.addEventListener("drop", function (e) {
      e.preventDefault();
      dropLabel.classList.remove("is-dragover");
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      readFile(file);
    });

    window.addEventListener("resize", function () {
      if (!editorPanel.hidden) layoutStage();
    });

    /* ---- category tabs ---- */
    document.querySelectorAll("[data-cat-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var cat = tab.getAttribute("data-cat-tab");
        document.querySelectorAll("[data-cat-tab]").forEach(function (t) {
          t.classList.toggle("is-active", t === tab);
        });
        document.querySelectorAll("[data-cat-panel]").forEach(function (p) {
          p.hidden = p.getAttribute("data-cat-panel") !== cat;
        });
      });
    });

    /* ---- add part ---- */
    document.querySelectorAll(".cst-part").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addSticker(btn.getAttribute("data-part"));
      });
    });

    function addSticker(partId) {
      var def = PARTS[partId];
      if (!def) return;
      var sticker = {
        id: "s" + (++uid),
        part: partId,
        xPct: 50 + (stickers.length % 3) * 4,
        yPct: 50 + (stickers.length % 3) * 4,
        widthPct: def.size,
        ratio: def.ratio,
        rotate: 0,
        z: ++zCounter
      };
      stickers.push(sticker);
      renderStickers();
      selectSticker(sticker.id);
    }

    function heightPctFor(sticker) {
      return sticker.widthPct * photoAspect / sticker.ratio;
    }

    function renderStickers() {
      stage.querySelectorAll(".cst-sticker").forEach(function (el) {
        el.remove();
      });
      stickers.forEach(function (sticker) {
        var def = PARTS[sticker.part];
        var el = document.createElement("div");
        el.className = "cst-sticker";
        el.dataset.id = sticker.id;
        el.innerHTML = '<img src="' + def.src + '" alt="" draggable="false">' +
          '<button type="button" class="cst-sticker-del" aria-label="Eliminar pieza">×</button>';
        stage.appendChild(el);
        applyStyle(sticker, el);

        el.querySelector(".cst-sticker-del").addEventListener("click", function (e) {
          e.stopPropagation();
          removeSticker(sticker.id);
        });
        el.addEventListener("pointerdown", function (e) {
          if (e.target.classList.contains("cst-sticker-del")) return;
          selectSticker(sticker.id);
          startDrag(sticker, el, e);
        });
      });
      updateSelectedPanel();
    }

    function applyStyle(sticker, el) {
      el = el || stage.querySelector('.cst-sticker[data-id="' + sticker.id + '"]');
      if (!el) return;
      el.style.left = sticker.xPct + "%";
      el.style.top = sticker.yPct + "%";
      el.style.width = sticker.widthPct + "%";
      el.style.height = heightPctFor(sticker) + "%";
      el.style.zIndex = sticker.z;
      el.style.transform = "translate(-50%,-50%) rotate(" + sticker.rotate + "deg)";
      el.classList.toggle("is-selected", sticker.id === selectedId);
    }

    function getSticker(id) {
      for (var i = 0; i < stickers.length; i++) {
        if (stickers[i].id === id) return stickers[i];
      }
      return null;
    }

    function selectSticker(id) {
      selectedId = id;
      stage.querySelectorAll(".cst-sticker").forEach(function (el) {
        el.classList.toggle("is-selected", el.dataset.id === id);
      });
      updateSelectedPanel();
    }

    function updateSelectedPanel() {
      var sticker = getSticker(selectedId);
      if (!selectedPanel) return;
      selectedPanel.hidden = !sticker;
      if (sticker) {
        sizeCtrl.value = sticker.widthPct;
        rotateCtrl.value = sticker.rotate;
      }
    }

    function removeSticker(id) {
      stickers = stickers.filter(function (s) {
        return s.id !== id;
      });
      if (selectedId === id) selectedId = null;
      renderStickers();
    }

    stage.addEventListener("pointerdown", function (e) {
      if (e.target === stage || e.target === photo) selectSticker(null);
    });

    function startDrag(sticker, el, downEvent) {
      var pointerId = downEvent.pointerId;
      el.setPointerCapture(pointerId);
      var rect = stage.getBoundingClientRect();

      function onMove(e) {
        if (e.pointerId !== pointerId) return;
        var xPct = ((e.clientX - rect.left) / rect.width) * 100;
        var yPct = ((e.clientY - rect.top) / rect.height) * 100;
        sticker.xPct = Math.max(0, Math.min(100, xPct));
        sticker.yPct = Math.max(0, Math.min(100, yPct));
        applyStyle(sticker, el);
      }
      function onUp(e) {
        if (e.pointerId !== pointerId) return;
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
      }
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    }

    if (sizeCtrl) {
      sizeCtrl.addEventListener("input", function () {
        var sticker = getSticker(selectedId);
        if (!sticker) return;
        sticker.widthPct = parseFloat(sizeCtrl.value);
        applyStyle(sticker);
      });
    }
    if (rotateCtrl) {
      rotateCtrl.addEventListener("input", function () {
        var sticker = getSticker(selectedId);
        if (!sticker) return;
        sticker.rotate = parseFloat(rotateCtrl.value);
        applyStyle(sticker);
      });
    }

    /* ---- toolbar actions ---- */
    document.querySelectorAll("[data-action]").forEach(function (btn) {
      var action = btn.getAttribute("data-action");
      if (!["undo", "clear", "change-photo", "front", "back", "delete", "download"].includes(action)) return;
      btn.addEventListener("click", function () {
        var sticker;
        switch (action) {
          case "undo":
            stickers.pop();
            renderStickers();
            break;
          case "clear":
            stickers = [];
            selectedId = null;
            renderStickers();
            break;
          case "change-photo":
            stickers = [];
            selectedId = null;
            renderStickers();
            fileInput.value = "";
            editorPanel.hidden = true;
            uploadPanel.hidden = false;
            break;
          case "front":
            sticker = getSticker(selectedId);
            if (sticker) { sticker.z = ++zCounter; applyStyle(sticker); }
            break;
          case "back":
            sticker = getSticker(selectedId);
            if (sticker) { sticker.z = --zCounter; applyStyle(sticker); }
            break;
          case "delete":
            if (selectedId) removeSticker(selectedId);
            break;
          case "download":
            downloadImage();
            break;
        }
      });
    });

    function downloadImage() {
      var maxDim = 1600;
      var w = photo.naturalWidth;
      var h = photo.naturalHeight;
      if (Math.max(w, h) > maxDim) {
        var scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(photo, 0, 0, w, h);

      var ordered = stickers.slice().sort(function (a, b) {
        return a.z - b.z;
      });
      ordered.forEach(function (sticker) {
        var el = stage.querySelector('.cst-sticker[data-id="' + sticker.id + '"] img');
        if (!el) return;
        var widthPx = (sticker.widthPct / 100) * w;
        var heightPx = (heightPctFor(sticker) / 100) * h;
        var cx = (sticker.xPct / 100) * w;
        var cy = (sticker.yPct / 100) * h;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((sticker.rotate * Math.PI) / 180);
        ctx.drawImage(el, -widthPx / 2, -heightPx / 2, widthPx, heightPx);
        ctx.restore();
      });

      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "mi-hotwheels-personalizado.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }, "image/png");
    }
  })();

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
