import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

(function () {
  "use strict";

  var section = document.getElementById("configurador3d");
  if (!section) return;

  var viewport = section.querySelector(".cfg3d-viewport");
  var canvas = document.getElementById("cfg3d-canvas");
  var loadingEl = section.querySelector("[data-cfg3d-loading]");
  var fallbackEl = section.querySelector("[data-cfg3d-fallback]");

  function showFallback() {
    if (loadingEl) loadingEl.hidden = true;
    if (fallbackEl) fallbackEl.hidden = false;
  }

  var hasWebGL = false;
  try {
    var testCanvas = document.createElement("canvas");
    hasWebGL = !!(window.WebGLRenderingContext &&
      (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl")));
  } catch (e) {
    hasWebGL = false;
  }
  if (!hasWebGL) {
    showFallback();
    return;
  }

  var COLORS = {
    chrome100: 0xf4f5f6,
    chrome300: 0xd7dadd,
    chrome500: 0x9ca2a8,
    chrome700: 0x4a4e54,
    chrome900: 0x1b1d20,
    red: 0xe2231c,
    redDeep: 0x9c140f,
    yellow: 0xffd400
  };

  var WHEEL_R = 0.52;
  var TUBE_R = 0.17;
  var TRACK_HALF = 0.92;
  var WHEELBASE_HALF = 1.35;
  var WHEEL_Y = WHEEL_R;

  var state = {
    paint: "#E2231C",
    spoiler: "none",
    rim: "classic",
    tire: "street",
    rimSize: 100,
    tireWidth: 100
  };
  var wheelsDirty = true;
  var spoilerDirty = true;

  var scene, camera, renderer, controls, carGroup, wheelsGroup, spoilerGroup;
  var paintMaterial, glassMaterial;

  function init() {
    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 100);
    camera.position.set(4.2, 2.6, 4.6);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.6, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 9;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.6;
    controls.addEventListener("start", function () {
      controls.autoRotate = false;
    });
    controls.update();
    controls.saveState();

    var hemi = new THREE.HemisphereLight(0xcfd8e3, 0x12151a, 1.0);
    scene.add(hemi);

    var key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(4, 6, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3.5;
    key.shadow.camera.right = 3.5;
    key.shadow.camera.top = 3.5;
    key.shadow.camera.bottom = -3.5;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    scene.add(key);

    var fill = new THREE.DirectionalLight(0x8fb8ff, 0.6);
    fill.position.set(-4, 3, -3);
    scene.add(fill);

    var floorMat = new THREE.MeshStandardMaterial({ color: COLORS.chrome900, roughness: 0.55, metalness: 0.15 });
    var floor = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    var ringMat = new THREE.LineBasicMaterial({ color: 0x33383f, transparent: true, opacity: 0.6 });
    [2, 3, 4].forEach(function (r) {
      var pts = [];
      for (var i = 0; i <= 64; i++) {
        var a = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0.002, Math.sin(a) * r));
      }
      var ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat);
      scene.add(ring);
    });

    buildCar();

    window.addEventListener("resize", onResize);
    if ("ResizeObserver" in window) {
      new ResizeObserver(onResize).observe(viewport);
    }
    onResize();

    wireUI();

    if (loadingEl) loadingEl.hidden = true;
    renderer.setAnimationLoop(tick);
  }

  function makePaintMaterial() {
    return new THREE.MeshStandardMaterial({ color: new THREE.Color(state.paint), roughness: 0.35, metalness: 0.55 });
  }

  function buildCar() {
    carGroup = new THREE.Group();
    scene.add(carGroup);

    paintMaterial = makePaintMaterial();
    glassMaterial = new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.15, metalness: 0.6 });
    var chromeMat = new THREE.MeshStandardMaterial({ color: COLORS.chrome500, roughness: 0.25, metalness: 0.9 });
    var darkMat = new THREE.MeshStandardMaterial({ color: COLORS.chrome900, roughness: 0.6, metalness: 0.2 });
    var headlightMat = new THREE.MeshStandardMaterial({ color: COLORS.yellow, emissive: 0x554400, roughness: 0.3 });
    var taillightMat = new THREE.MeshStandardMaterial({ color: COLORS.red, emissive: 0x4a0d0a, roughness: 0.3 });

    function addBox(w, h, d, x, y, z, mat, rz) {
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      if (rz) mesh.rotation.z = rz;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      carGroup.add(mesh);
      return mesh;
    }

    addBox(3.2, 0.08, 1.6, 0, 0.46, 0, darkMat);
    addBox(3.3, 0.46, 1.5, 0, 0.72, 0, paintMaterial);
    addBox(1.55, 0.5, 1.2, -0.15, 1.18, 0, paintMaterial);
    addBox(1.3, 0.34, 1.0, -0.15, 1.23, 0, glassMaterial);
    addBox(0.95, 0.26, 1.42, 1.35, 0.95, 0, paintMaterial, -0.12);
    addBox(0.75, 0.22, 1.42, -1.55, 0.9, 0, paintMaterial, 0.1);
    addBox(0.22, 0.32, 1.56, 1.75, 0.62, 0, chromeMat);
    addBox(0.2, 0.28, 1.56, -1.85, 0.58, 0, chromeMat);
    addBox(0.06, 0.12, 0.22, 1.85, 0.85, 0.55, headlightMat);
    addBox(0.06, 0.12, 0.22, 1.85, 0.85, -0.55, headlightMat);
    addBox(0.05, 0.1, 0.2, -1.9, 0.8, 0.55, taillightMat);
    addBox(0.05, 0.1, 0.2, -1.9, 0.8, -0.55, taillightMat);

    wheelsGroup = new THREE.Group();
    carGroup.add(wheelsGroup);

    spoilerGroup = new THREE.Group();
    carGroup.add(spoilerGroup);

    wheelsDirty = true;
    spoilerDirty = true;
  }

  function disposeGroup(group) {
    group.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(function (m) { m.dispose(); });
        else obj.material.dispose();
      }
    });
    while (group.children.length) group.remove(group.children[0]);
  }

  function buildWheelAssembly() {
    var scaleR = state.rimSize / 100;
    var scaleW = state.tireWidth / 100;
    var tireTube = TUBE_R * scaleW;
    var wheel = new THREE.Group();

    var tireColor = state.tire === "slick" ? 0x141414 : 0x0c0c0d;
    var tireMat = new THREE.MeshStandardMaterial({
      color: tireColor,
      roughness: state.tire === "slick" ? 0.35 : 0.85,
      metalness: 0.05
    });
    var tire = new THREE.Mesh(new THREE.TorusGeometry(WHEEL_R, tireTube, 14, 28), tireMat);
    tire.castShadow = true;
    wheel.add(tire);

    if (state.tire === "mt") {
      var lugMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.95 });
      var lugCount = 14;
      for (var i = 0; i < lugCount; i++) {
        var a = (i / lugCount) * Math.PI * 2;
        var lug = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, tireTube * 2.3), lugMat);
        lug.position.set(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R, 0);
        lug.rotation.z = a + Math.PI / 2;
        lug.castShadow = true;
        wheel.add(lug);
      }
    }

    var rimRadius = Math.min(WHEEL_R - tireTube * 0.55, 0.34 * scaleR);
    var rimThickness = tireTube * 2.1;
    var rimGroup = new THREE.Group();

    var hubColor, hubMetalness, hubRoughness, spokeColor, spokeCount, spokeWidth;
    if (state.rim === "chrome") {
      hubColor = COLORS.chrome100; hubMetalness = 0.95; hubRoughness = 0.12;
      spokeColor = COLORS.chrome100; spokeCount = 5; spokeWidth = 0.07;
    } else if (state.rim === "sport") {
      hubColor = COLORS.chrome900; hubMetalness = 0.4; hubRoughness = 0.4;
      spokeColor = COLORS.red; spokeCount = 8; spokeWidth = 0.05;
    } else {
      hubColor = COLORS.chrome700; hubMetalness = 0.5; hubRoughness = 0.45;
      spokeColor = COLORS.chrome500; spokeCount = 5; spokeWidth = 0.09;
    }
    var hubMat = new THREE.MeshStandardMaterial({ color: hubColor, metalness: hubMetalness, roughness: hubRoughness });
    var spokeMat = new THREE.MeshStandardMaterial({ color: spokeColor, metalness: hubMetalness, roughness: hubRoughness });

    var hub = new THREE.Mesh(new THREE.CylinderGeometry(rimRadius * 0.32, rimRadius * 0.32, rimThickness, 20), hubMat);
    hub.rotation.x = Math.PI / 2;
    hub.castShadow = true;
    rimGroup.add(hub);

    for (var s = 0; s < spokeCount; s++) {
      var ang = (s / spokeCount) * Math.PI * 2;
      var spoke = new THREE.Mesh(new THREE.BoxGeometry(rimRadius * 0.68, spokeWidth, rimThickness * 0.85), spokeMat);
      spoke.position.set(Math.cos(ang) * rimRadius * 0.66, Math.sin(ang) * rimRadius * 0.66, 0);
      spoke.rotation.z = ang;
      spoke.castShadow = true;
      rimGroup.add(spoke);
    }
    wheel.add(rimGroup);

    return wheel;
  }

  function rebuildWheels() {
    disposeGroup(wheelsGroup);
    var corners = [
      [WHEELBASE_HALF, TRACK_HALF],
      [WHEELBASE_HALF, -TRACK_HALF],
      [-WHEELBASE_HALF, TRACK_HALF],
      [-WHEELBASE_HALF, -TRACK_HALF]
    ];
    corners.forEach(function (c) {
      var w = buildWheelAssembly();
      w.position.set(c[0], WHEEL_Y, c[1]);
      wheelsGroup.add(w);
    });
    wheelsDirty = false;
  }

  function rebuildSpoiler() {
    disposeGroup(spoilerGroup);
    if (state.spoiler === "gt") {
      var redMat = new THREE.MeshStandardMaterial({ color: COLORS.red, roughness: 0.4, metalness: 0.3 });
      var strutMat = new THREE.MeshStandardMaterial({ color: COLORS.chrome900, roughness: 0.5, metalness: 0.3 });
      var bladeMat = new THREE.MeshStandardMaterial({ color: COLORS.chrome300, roughness: 0.3, metalness: 0.7 });
      var baseX = -1.95, baseY = 0.92;
      [-1, 1].forEach(function (side) {
        var strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.06), strutMat);
        strut.position.set(baseX, baseY + 0.16, side * 0.5);
        strut.castShadow = true;
        spoilerGroup.add(strut);
        var plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.04), redMat);
        plate.position.set(baseX, baseY + 0.14, side * 0.62);
        plate.castShadow = true;
        spoilerGroup.add(plate);
      });
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 1.3), bladeMat);
      blade.position.set(baseX - 0.02, baseY + 0.34, 0);
      blade.castShadow = true;
      spoilerGroup.add(blade);
    } else if (state.spoiler === "lip") {
      var lipMat = paintMaterial;
      var lip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 1.4), lipMat);
      lip.position.set(-2.0, 1.02, 0);
      lip.rotation.z = -0.15;
      lip.castShadow = true;
      spoilerGroup.add(lip);
    }
    spoilerDirty = false;
  }

  function onResize() {
    var w = viewport.clientWidth || 300;
    var h = viewport.clientHeight || 300;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function tick() {
    if (wheelsDirty) rebuildWheels();
    if (spoilerDirty) rebuildSpoiler();
    controls.update();
    renderer.render(scene, camera);
  }

  function setPanel(cat) {
    section.querySelectorAll("[data-cfg-tab]").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-cfg-tab") === cat);
    });
    section.querySelectorAll("[data-cfg-panel]").forEach(function (p) {
      p.hidden = p.getAttribute("data-cfg-panel") !== cat;
    });
  }

  function wireUI() {
    section.querySelectorAll("[data-cfg-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        setPanel(tab.getAttribute("data-cfg-tab"));
      });
    });

    section.querySelectorAll("[data-paint]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.paint = btn.getAttribute("data-paint");
        paintMaterial.color.set(state.paint);
        section.querySelectorAll("[data-paint]").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
      });
    });

    section.querySelectorAll("[data-spoiler]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.spoiler = btn.getAttribute("data-spoiler");
        spoilerDirty = true;
        section.querySelectorAll("[data-spoiler]").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
      });
    });

    section.querySelectorAll("[data-rim]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.rim = btn.getAttribute("data-rim");
        wheelsDirty = true;
        section.querySelectorAll("[data-rim]").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
      });
    });

    section.querySelectorAll("[data-tire]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.tire = btn.getAttribute("data-tire");
        wheelsDirty = true;
        section.querySelectorAll("[data-tire]").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
      });
    });

    var rimSizeCtrl = section.querySelector('[data-cfg-ctrl="rimSize"]');
    if (rimSizeCtrl) {
      rimSizeCtrl.addEventListener("input", function () {
        state.rimSize = parseFloat(rimSizeCtrl.value);
        wheelsDirty = true;
      });
    }
    var tireWidthCtrl = section.querySelector('[data-cfg-ctrl="tireWidth"]');
    if (tireWidthCtrl) {
      tireWidthCtrl.addEventListener("input", function () {
        state.tireWidth = parseFloat(tireWidthCtrl.value);
        wheelsDirty = true;
      });
    }

    var resetBtn = section.querySelector('[data-action="reset-camera"]');
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        controls.reset();
        controls.autoRotate = true;
      });
    }

    var dlBtn = section.querySelector('[data-action="download-3d"]');
    if (dlBtn) {
      dlBtn.addEventListener("click", function () {
        renderer.render(scene, camera);
        canvas.toBlob(function (blob) {
          if (!blob) return;
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "mi-hotwheels-3d.png";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        }, "image/png");
      });
    }
  }

  try {
    init();
  } catch (e) {
    showFallback();
    if (window.console) console.error(e);
  }
})();
