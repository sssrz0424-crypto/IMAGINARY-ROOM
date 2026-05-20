/**
 * 蓝门后 HTML 叠层构图调试：五面镜的位置、透视、rotateY 等。
 * 地址栏加 ?blueVoid=1 显示面板；调节结果写入 localStorage，「复制 JSON」可固化到 BLUE_VOID_LAYOUT_DEFAULTS。
 */

import { attachLayoutPanelDragResize } from "./layoutPanelDragResize.js";
import { syncAllMirrorPosterHitAreas } from "./blueMirrorTikTokUi.js";

const QUERY_KEY = "blueVoid";
export const STORAGE_KEY = "doors_blue_void_layout_v6";

const MIRROR_LEGENDS = [
  "镜1 · stage1（左）",
  "镜2 · stage2",
  "镜3 · stage3（中）",
  "镜4 · stage4",
  "镜5 · stage5（右）",
];

/**
 * 默认构图：用户调定的五镜排布（?blueVoid=1 复制 JSON 固化版）。
 */
export const BLUE_VOID_LAYOUT_DEFAULTS = {
  scene: {
    perspectivePx: 0,
    perspectiveOriginXPct: 50,
    perspectiveOriginYPct: 50,
    curtainSideOpacity: 0,
    spotHue: 218,
    spotSaturation: 0,
    spotLightnessMid: 0,
    spotLightnessEdge: 0,
    floorShadeOpacity: 0,
    mirrorGlowBlurPx: 24,
    mirrorGlowOpacity: 0.38,
  },
  m0: {
    leftVw: 11,
    bottomVh: 8.9,
    widthVw: 16,
    heightVh: 78,
    rotYDeg: 0,
    rotXDeg: 0,
    plateOriginXPct: 50,
    plateOriginYPct: 50,
    z: 3,
    translateZ: 0,
    nudgeXPx: 0,
    nudgeYPx: 0,
    scaleMul: 2.27,
  },
  m1: {
    leftVw: 29.4,
    bottomVh: 8.5,
    widthVw: 16,
    heightVh: 78,
    rotYDeg: 0,
    rotXDeg: 0,
    plateOriginXPct: 50,
    plateOriginYPct: 50,
    z: 4,
    translateZ: 0,
    nudgeXPx: 0,
    nudgeYPx: 0,
    scaleMul: 2.21,
  },
  m2: {
    leftVw: 48.6,
    bottomVh: 8.1,
    widthVw: 18,
    heightVh: 82,
    rotYDeg: 0,
    rotXDeg: 0,
    plateOriginXPct: 50,
    plateOriginYPct: 50,
    z: 9,
    translateZ: 0,
    nudgeXPx: 2,
    nudgeYPx: 0,
    scaleMul: 1.7,
  },
  m3: {
    leftVw: 70.6,
    bottomVh: 10.1,
    widthVw: 16,
    heightVh: 78,
    rotYDeg: 0,
    rotXDeg: 0,
    plateOriginXPct: 50,
    plateOriginYPct: 50,
    z: 5,
    translateZ: 0,
    nudgeXPx: 66,
    nudgeYPx: 0,
    scaleMul: 2.28,
  },
  m4: {
    leftVw: 90,
    bottomVh: 8.5,
    widthVw: 16,
    heightVh: 78,
    rotYDeg: -28,
    rotXDeg: 0,
    plateOriginXPct: 50,
    plateOriginYPct: 50,
    z: 7,
    translateZ: 0,
    nudgeXPx: 0,
    nudgeYPx: 0,
    scaleMul: 2.14,
  },
};

/** 调试面板滑块/数字框范围（尽量大，便于把镜框拖出画面再拉回） */
const MIRROR_LAYOUT_RANGES = {
  leftVw: { min: -40, max: 140, step: 0.1 },
  bottomVh: { min: -50, max: 80, step: 0.1 },
  widthVw: { min: 1, max: 120, step: 0.1 },
  heightVh: { min: 4, max: 120, step: 0.1 },
  nudgeXPx: { min: -1200, max: 1200, step: 1 },
  nudgeYPx: { min: -1200, max: 1200, step: 1 },
  scaleMul: { min: 0.12, max: 4, step: 0.01 },
  z: { min: 1, max: 99, step: 1 },
  rotXDeg: { min: -85, max: 85, step: 0.5 },
  rotYDeg: { min: -85, max: 85, step: 0.5 },
  translateZ: { min: -600, max: 600, step: 2 },
  plateOriginXPct: { min: 0, max: 100, step: 0.5 },
  plateOriginYPct: { min: 0, max: 100, step: 0.5 },
};

const SCENE_PERSPECTIVE_RANGES = {
  perspectivePx: { min: 0, max: 6000, step: 10 },
  perspectiveOriginXPct: { min: 0, max: 100, step: 0.5 },
  perspectiveOriginYPct: { min: 0, max: 100, step: 0.5 },
};

function usesFlatLayout(scene, state) {
  const px = Number(scene?.perspectivePx);
  if (Number.isFinite(px) && px > 0) return false;
  for (let i = 0; i < 5; i++) {
    const m = state[`m${i}`];
    if (!m) continue;
    if (Math.abs(Number(m.rotXDeg) || 0) > 0.001) return false;
    if (Math.abs(Number(m.rotYDeg) || 0) > 0.001) return false;
    if (Math.abs(Number(m.translateZ) || 0) > 0.001) return false;
  }
  return true;
}

/** 补全缺字段，不覆盖用户已调的透视/倾斜 */
export function ensureBlueVoidLayoutDefaults(state) {
  if (!state) return structuredClone(BLUE_VOID_LAYOUT_DEFAULTS);
  const base = BLUE_VOID_LAYOUT_DEFAULTS;
  if (!state.scene) state.scene = structuredClone(base.scene);
  const sceneKeys = Object.keys(base.scene);
  for (const k of sceneKeys) {
    if (state.scene[k] === undefined) state.scene[k] = base.scene[k];
  }
  for (let i = 0; i < 5; i++) {
    const key = `m${i}`;
    if (!state[key]) state[key] = structuredClone(base[key]);
    const m = state[key];
    const bm = base[key];
    for (const k of Object.keys(bm)) {
      if (m[k] === undefined) m[k] = bm[k];
    }
  }
  return state;
}

/** @deprecated 保留旧调用名，不再清零倾斜 */
export function enforceFrontFacingLayout(state) {
  return ensureBlueVoidLayoutDefaults(state);
}

export function shouldShowBlueVoidLayoutPanel() {
  return new URLSearchParams(window.location.search).get(QUERY_KEY) === "1";
}

function deepMerge(base, patch) {
  const out = structuredClone(base);
  for (const k of Object.keys(patch)) {
    const v = patch[k];
    if (v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object") {
      out[k] = deepMerge(out[k], v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

function loadState() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ensureBlueVoidLayoutDefaults(structuredClone(BLUE_VOID_LAYOUT_DEFAULTS));
    const parsed = JSON.parse(raw);
    return ensureBlueVoidLayoutDefaults(deepMerge(BLUE_VOID_LAYOUT_DEFAULTS, parsed));
  } catch {
    return ensureBlueVoidLayoutDefaults(structuredClone(BLUE_VOID_LAYOUT_DEFAULTS));
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function mirrorPlateEl(index) {
  return document.querySelector(
    `#blue-door-void-root .blue-door-void__mirror[data-blue-mirror-index="${index}"] .blue-door-void__mirror-plate`
  );
}

function mirrorRootEl(index) {
  return document.querySelector(
    `#blue-door-void-root .blue-door-void__mirror[data-blue-mirror-index="${index}"]`
  );
}

export function applyBlueVoidLayoutToDom(state) {
  const mirrors = document.querySelector(".blue-door-void__mirrors");
  const voidEl = document.querySelector("#blue-door-void-root .blue-door-void__void");
  const stageEl = document.querySelector("#blue-door-void-root .blue-door-void__stage");
  const root = document.getElementById("blue-door-void-root");
  if (!mirrors || !state?.scene) return;

  const { scene } = state;
  const flat = usesFlatLayout(scene, state);
  root?.classList.toggle("blue-door-void--flat", flat);
  root?.classList.remove("blue-door-void--front-facing");

  const perspPx = Number(scene.perspectivePx);
  if (flat || !Number.isFinite(perspPx) || perspPx <= 0) {
    mirrors.style.perspective = "none";
    mirrors.style.perspectiveOrigin = "";
  } else {
    mirrors.style.perspective = `${perspPx}px`;
    mirrors.style.perspectiveOrigin = `${Number(scene.perspectiveOriginXPct) || 50}% ${Number(scene.perspectiveOriginYPct) || 50}%`;
  }

  const glowBlur = Number(scene.mirrorGlowBlurPx ?? 26);
  const glowA = Number(scene.mirrorGlowOpacity ?? 0.45);

  if (voidEl) {
    voidEl.style.background = "#000";
  }
  if (stageEl) {
    stageEl.style.setProperty("--bdv-floor-opacity", "0");
  }
  if (root) {
    root.style.setProperty("--bdv-img-glow-blur", `${Math.max(0, glowBlur)}px`);
    root.style.setProperty("--bdv-img-glow-a", String(Math.min(1, Math.max(0, glowA))));
  }

  for (let i = 0; i < 5; i++) {
    const m = state[`m${i}`];
    if (!m) continue;
    const mirrorRoot = mirrorRootEl(i);
    const plate = mirrorPlateEl(i);
    if (!mirrorRoot || !plate) continue;
    mirrorRoot.style.left = `${m.leftVw}vw`;
    mirrorRoot.style.bottom = `${m.bottomVh}vh`;
    mirrorRoot.style.width = `${m.widthVw}vw`;
    mirrorRoot.style.height = `${m.heightVh}vh`;
    mirrorRoot.style.zIndex = String(Math.round(m.z));
    mirrorRoot.style.setProperty("--bdv-mx", String(Number(m.nudgeXPx) || 0));
    mirrorRoot.style.setProperty("--bdv-my", String(Number(m.nudgeYPx) || 0));
    mirrorRoot.style.setProperty("--bdv-mz", String(flat ? 0 : Number(m.translateZ) || 0));
    mirrorRoot.style.setProperty("--bdv-ms", String(Number(m.scaleMul) > 0 ? m.scaleMul : 1));
    plate.style.opacity = "1";
    const ox = Number(m.plateOriginXPct);
    const oy = Number(m.plateOriginYPct);
    plate.style.transformOrigin = `${Number.isFinite(ox) ? ox : 50}% ${Number.isFinite(oy) ? oy : 50}%`;
    const rotX = Number(m.rotXDeg) || 0;
    const rotY = Number(m.rotYDeg) || 0;
    plate.style.transform =
      rotX === 0 && rotY === 0 ? "none" : `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }
  requestAnimationFrame(() => syncAllMirrorPosterHitAreas());
}

function bindRow(root, state, path, spec, onChange) {
  const parts = path.split(".");
  const key = parts.pop();
  const section = parts.join(".");
  const wrap = document.createElement("label");
  wrap.className = "layout-panel__row";
  wrap.innerHTML = `
    <span>${spec.label}</span>
    <input type="range" data-path="${path}" min="${spec.min}" max="${spec.max}" step="${spec.step}" />
    <input type="number" data-path="${path}" data-num="1" step="${spec.step}" />
  `;
  root.appendChild(wrap);

  const range = wrap.querySelector('input[type="range"]');
  const num = wrap.querySelector('input[type="number"]');

  const clamp = (v) => Math.min(spec.max, Math.max(spec.min, v));
  const syncUi = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    state[section][key] = n;
    range.value = String(clamp(n));
    num.value = String(n);
    onChange();
  };

  range.addEventListener("input", () => {
    syncUi(range.value);
  });
  num.addEventListener("change", () => {
    syncUi(num.value);
  });

  range.value = String(state[section][key]);
  num.value = String(state[section][key]);
}

function addFieldset(root, state, legend, rows, onChange) {
  const fs = document.createElement("fieldset");
  fs.className = "layout-panel__fieldset";
  const lg = document.createElement("legend");
  lg.textContent = legend;
  fs.appendChild(lg);
  rows.forEach((row) => bindRow(fs, state, row.path, row, onChange));
  root.appendChild(fs);
}

export function getBlueVoidLayoutState() {
  return loadState();
}

/** 无面板时也应用本机存档 */
export function initBlueVoidLayoutFromStorage() {
  const state = loadState();
  applyBlueVoidLayoutToDom(state);
}

export function mountBlueDoorVoidLayoutPanel() {
  if (!shouldShowBlueVoidLayoutPanel()) return null;

  const state = loadState();
  applyBlueVoidLayoutToDom(state);

  const root = document.createElement("aside");
  root.className = "layout-panel blue-void-layout-panel";
  root.innerHTML = `
    <div class="layout-panel__header">
      <strong>蓝门后 · 五镜排布与透视</strong>
      <span class="layout-panel__hint">?blueVoid=1</span>
      <button type="button" class="layout-panel__collapse" aria-label="收起">−</button>
    </div>
    <div class="layout-panel__body" data-bdv-body></div>
  `;
  document.body.appendChild(root);

  const body = root.querySelector("[data-bdv-body]");
  const collapse = root.querySelector(".layout-panel__collapse");
  collapse.addEventListener("click", () => {
    root.classList.toggle("layout-panel--collapsed");
    collapse.textContent = root.classList.contains("layout-panel--collapsed") ? "+" : "−";
  });

  const persist = () => {
    ensureBlueVoidLayoutDefaults(state);
    saveState(state);
    applyBlueVoidLayoutToDom(state);
  };

  ensureBlueVoidLayoutDefaults(state);

  const P = SCENE_PERSPECTIVE_RANGES;
  addFieldset(body, state, "① 场景透视（全局）", [
    {
      path: "scene.perspectivePx",
      label: "透视距离 px（0=关闭；小=更强）",
      ...P.perspectivePx,
    },
    { path: "scene.perspectiveOriginXPct", label: "消失点 水平 %", ...P.perspectiveOriginXPct },
    { path: "scene.perspectiveOriginYPct", label: "消失点 垂直 %", ...P.perspectiveOriginYPct },
  ], persist);

  addFieldset(body, state, "② 镜面发光", [
    { path: "scene.mirrorGlowBlurPx", label: "镜面外发光模糊 px", min: 0, max: 72, step: 1 },
    { path: "scene.mirrorGlowOpacity", label: "镜面外发光透明度", min: 0, max: 1, step: 0.02 },
  ], persist);

  const mirrorLayoutRows = (idx) => {
    const p = `m${idx}`;
    const R = MIRROR_LAYOUT_RANGES;
    return [
      {
        path: `${p}.leftVw`,
        label: "水平位置 vw（锚点居中，可负值）",
        ...R.leftVw,
      },
      {
        path: `${p}.bottomVh`,
        label: "距底 vh（越大越靠上）",
        ...R.bottomVh,
      },
      { path: `${p}.widthVw`, label: "宽度 vw", ...R.widthVw },
      { path: `${p}.heightVh`, label: "高度 vh", ...R.heightVh },
      { path: `${p}.nudgeXPx`, label: "左右微调 px", ...R.nudgeXPx },
      { path: `${p}.nudgeYPx`, label: "上下微调 px", ...R.nudgeYPx },
      { path: `${p}.scaleMul`, label: "整体缩放倍率", ...R.scaleMul },
      { path: `${p}.z`, label: "层序 z（大压小）", ...R.z },
    ];
  };

  const mirrorTiltRows = (idx) => {
    const p = `m${idx}`;
    const R = MIRROR_LAYOUT_RANGES;
    return [
      {
        path: `${p}.rotXDeg`,
        label: "俯仰 rotateX °（上边远/近）",
        ...R.rotXDeg,
      },
      {
        path: `${p}.rotYDeg`,
        label: "左右 rotateY °（左侧远/近）",
        ...R.rotYDeg,
      },
      {
        path: `${p}.translateZ`,
        label: "景深 translateZ px（需①透视>0）",
        ...R.translateZ,
      },
      {
        path: `${p}.plateOriginXPct`,
        label: "倾斜枢轴 水平 %",
        ...R.plateOriginXPct,
      },
      {
        path: `${p}.plateOriginYPct`,
        label: "倾斜枢轴 垂直 %",
        ...R.plateOriginYPct,
      },
    ];
  };

  for (let i = 0; i < 5; i++) {
    addFieldset(
      body,
      state,
      `③ 镜 ${i + 1} · ${MIRROR_LEGENDS[i]} · 位置`,
      mirrorLayoutRows(i),
      persist
    );
    addFieldset(body, state, `④ 镜 ${i + 1} · 透视倾斜`, mirrorTiltRows(i), persist);
  }

  const actions = document.createElement("div");
  actions.className = "layout-panel__actions";
  actions.innerHTML = `
    <button type="button" data-bdv="export">复制 JSON</button>
    <button type="button" data-bdv="reset">恢复默认</button>
    <button type="button" data-bdv="clear">清除存档</button>
  `;
  const tiltActions = document.createElement("div");
  tiltActions.className = "layout-panel__actions layout-panel__actions--compact";
  tiltActions.innerHTML = `
    <button type="button" data-bdv="tilt-zero-all">五镜倾斜归零</button>
    <button type="button" data-bdv="persp-default">透视恢复默认（1400px）</button>
  `;
  body.appendChild(tiltActions);

  tiltActions.querySelector('[data-bdv="tilt-zero-all"]').addEventListener("click", () => {
    for (let i = 0; i < 5; i++) {
      const m = state[`m${i}`];
      if (!m) continue;
      m.rotXDeg = 0;
      m.rotYDeg = 0;
      m.translateZ = 0;
    }
    persist();
    root.remove();
    mountBlueDoorVoidLayoutPanel();
  });

  tiltActions.querySelector('[data-bdv="persp-default"]').addEventListener("click", () => {
    state.scene.perspectivePx = BLUE_VOID_LAYOUT_DEFAULTS.scene.perspectivePx;
    state.scene.perspectiveOriginXPct = BLUE_VOID_LAYOUT_DEFAULTS.scene.perspectiveOriginXPct;
    state.scene.perspectiveOriginYPct = BLUE_VOID_LAYOUT_DEFAULTS.scene.perspectiveOriginYPct;
    persist();
    root.remove();
    mountBlueDoorVoidLayoutPanel();
  });

  body.appendChild(actions);

  const help = document.createElement("p");
  help.className = "layout-panel__help";
  help.innerHTML = [
    "<strong>怎么用</strong>：先<code>?blueVoid=1</code>打开本面板，再<strong>双击蓝门</strong>进入场景；在<strong>空白处双击</strong>依次出现五面镜。",
    "<strong>标题栏</strong>可拖动、<strong>右下角</strong>可缩放面板，避免挡画面；位置记在本地。",
    "<strong>①</strong>场景透视：先设 <strong>perspectivePx</strong>（建议 1200～2000），再调各镜 <strong>translateZ</strong> 才有纵深。",
    "<strong>③④</strong>位置与大小；<strong>rotateX</strong> 俯仰、<strong>rotateY</strong> 左右转向，TikTok 叠层随镜板同转。",
    "枢轴 % 控制绕哪一点倾斜（默认 50,50）。全部倾斜为 0 且透视为 0 时为纯平面模式。",
    "调满意后点<strong>复制 JSON</strong>，把内容粘到 <code>blueDoorVoidLayoutPanel.js</code> 里的 <code>BLUE_VOID_LAYOUT_DEFAULTS</code>。镜面图标叠层请用 <code>?mirrorHud=1</code> 另开面板调。",
  ].join("<br/>");
  body.appendChild(help);

  actions.querySelector('[data-bdv="export"]').addEventListener("click", async () => {
    const json = JSON.stringify(state, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      window.alert("已复制当前构图 JSON。");
    } catch {
      console.log(json);
      window.alert("复制失败，已打印到控制台。");
    }
  });

  actions.querySelector('[data-bdv="reset"]').addEventListener("click", () => {
    const next = ensureBlueVoidLayoutDefaults(structuredClone(BLUE_VOID_LAYOUT_DEFAULTS));
    saveState(next);
    applyBlueVoidLayoutToDom(next);
    root.remove();
    mountBlueDoorVoidLayoutPanel();
  });

  actions.querySelector('[data-bdv="clear"]').addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    applyBlueVoidLayoutToDom(
      ensureBlueVoidLayoutDefaults(structuredClone(BLUE_VOID_LAYOUT_DEFAULTS))
    );
    root.remove();
    mountBlueDoorVoidLayoutPanel();
  });

  attachLayoutPanelDragResize(root, "blueVoid");

  return { state, root };
}
