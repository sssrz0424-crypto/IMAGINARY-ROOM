/**
 * 黄门后九宫格人像排布：每格独立调节位置、缩放、宽高。
 * 地址栏加 ?yellowScene=1 显示面板。
 */

import { attachLayoutPanelDragResize } from "./layoutPanelDragResize.js";
import { mountYellowPortraitDirectManip } from "./yellowDoorPortraitDirectManip.js";

const QUERY_KEY = "yellowScene";
export const STORAGE_KEY = "doors_yellow_portrait_layout_v1";

const PORTRAIT_FILE = "人像.png";

/** 滑块范围（与 apply 内 clamp 一致） */
const LIMITS = {
  offsetXPx: { label: "左右 px", min: -200, max: 200, step: 1 },
  offsetYPx: { label: "上下 px", min: -200, max: 200, step: 1 },
  scale: { label: "大小", min: 0.05, max: 8, step: 0.01 },
  widthPct: { label: "宽度 %", min: 5, max: 500, step: 1 },
  heightPct: { label: "高度 %", min: 5, max: 500, step: 1 },
};

const CELL_FIELDS = Object.entries(LIMITS).map(([field, spec]) => ({ field, ...spec }));

function clampField(field, value, fallback) {
  const { min, max } = LIMITS[field];
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (field === "scale") return Math.min(max, Math.max(min, n > 0 ? n : 1));
  return Math.min(max, Math.max(min, n));
}

function defaultPortrait() {
  return {
    offsetXPx: 0,
    offsetYPx: 0,
    scale: 1,
    widthPct: 100,
    heightPct: 100,
  };
}

function defaultContainer() {
  return {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 100,
    heightPct: 100,
    objXPct: 50,
    objYPct: 50,
  };
}

/** 正式构图（由面板导出固化） */
export const YELLOW_PORTRAIT_LAYOUT_DEFAULTS = {
  p0: {
    offsetXPx: 119,
    offsetYPx: 72,
    scale: 0.54,
    widthPct: 231.64667732994718,
    heightPct: 202.89433084164105,
  },
  p1: {
    offsetXPx: 36,
    offsetYPx: 72.00006103515625,
    scale: 0.8,
    widthPct: 78.75478504110009,
    heightPct: 68.38043057405048,
  },
  p2: {
    offsetXPx: -47.9998779296875,
    offsetYPx: 72,
    scale: 1,
    widthPct: 62.94580824455767,
    heightPct: 54.54686188267137,
  },
  p3: {
    offsetXPx: 118.33331298828125,
    offsetYPx: -33.33343505859375,
    scale: 1,
    widthPct: 63.1914017570887,
    heightPct: 54.052802223251504,
  },
  p4: {
    offsetXPx: 36.6666259765625,
    offsetYPx: -33.3333740234375,
    scale: 1,
    widthPct: 62.69733435426272,
    heightPct: 54.2998377069824,
  },
  p5: {
    offsetXPx: -47,
    offsetYPx: -34,
    scale: 1,
    widthPct: 63.686892079666514,
    heightPct: 54.299826398940475,
  },
  p6: {
    offsetXPx: 119,
    offsetYPx: -139,
    scale: 1,
    widthPct: 63.68549177687062,
    heightPct: 54.29981509089856,
  },
  p7: {
    offsetXPx: 37,
    offsetYPx: -139,
    scale: 1,
    widthPct: 62.94437936415368,
    heightPct: 54.29981509089856,
  },
  p8: {
    offsetXPx: -45,
    offsetYPx: -140,
    scale: 1,
    widthPct: 63.933927563397404,
    heightPct: 55.534969893469196,
  },
  grid: {
    insetTopPct: 8.8,
    insetRightPct: 4,
    insetBottomPct: 15,
    insetLeftPct: 4,
    gapPx: 2.5,
  },
  c0: {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 50,
    heightPct: 100,
    objXPct: 39,
    objYPct: 50,
  },
  c1: {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 100,
    heightPct: 100,
    objXPct: 50,
    objYPct: 35,
  },
  c2: {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 100,
    heightPct: 100,
    objXPct: 50,
    objYPct: 35,
  },
  c3: {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 100,
    heightPct: 100,
    objXPct: 50,
    objYPct: 35,
  },
  c4: {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 100,
    heightPct: 100,
    objXPct: 50,
    objYPct: 35,
  },
  c5: {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 100,
    heightPct: 100,
    objXPct: 50,
    objYPct: 35,
  },
  c6: {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 100,
    heightPct: 100,
    objXPct: 50,
    objYPct: 35,
  },
  c7: {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 100,
    heightPct: 100,
    objXPct: 50,
    objYPct: 35,
  },
  c8: {
    nudgeXPx: 0,
    nudgeYPx: 0,
    widthPct: 100,
    heightPct: 100,
    objXPct: 50,
    objYPct: 35,
  },
};

export function shouldShowYellowPortraitLayoutPanel() {
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

function ensureStateShape(raw) {
  const state = deepMerge(structuredClone(YELLOW_PORTRAIT_LAYOUT_DEFAULTS), raw ?? {});
  for (let i = 0; i < 9; i++) {
    if (!state[`p${i}`]) state[`p${i}`] = defaultPortrait();
    if (!state[`c${i}`]) state[`c${i}`] = defaultContainer();
  }
  if (!state.grid) state.grid = structuredClone(YELLOW_PORTRAIT_LAYOUT_DEFAULTS.grid);
  return state;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(YELLOW_PORTRAIT_LAYOUT_DEFAULTS);
    return ensureStateShape(JSON.parse(raw));
  } catch {
    return structuredClone(YELLOW_PORTRAIT_LAYOUT_DEFAULTS);
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getYellowPortraitLayoutState() {
  return loadState();
}

function cellSelector(index) {
  return `#yellow-door-scene-root .yellow-door-scene__cell[data-yellow-portrait-index="${index}"]`;
}

function normalizePortrait(P) {
  const offsetXPx = clampField("offsetXPx", P.offsetXPx, 0);
  const offsetYPx = clampField("offsetYPx", P.offsetYPx, 0);
  const scale = clampField("scale", P.scale, 1);
  const widthPct = clampField("widthPct", P.widthPct, 100);
  const heightPct = clampField("heightPct", P.heightPct, 100);
  const scaleX = scale * (widthPct / 100);
  const scaleY = scale * (heightPct / 100);
  return { offsetXPx, offsetYPx, scale, widthPct, heightPct, scaleX, scaleY };
}

function normalizeContainer(C) {
  const nudgeXPx = Math.min(200, Math.max(-200, Number(C.nudgeXPx) || 0));
  const nudgeYPx = Math.min(200, Math.max(-200, Number(C.nudgeYPx) || 0));
  const widthPct = Math.min(500, Math.max(5, Number(C.widthPct) || 100));
  const heightPct = Math.min(500, Math.max(5, Number(C.heightPct) || 100));
  const objXPct = Math.min(100, Math.max(0, Number(C.objXPct) || 50));
  const objYPct = Math.min(100, Math.max(0, Number(C.objYPct) || 50));
  return { nudgeXPx, nudgeYPx, widthPct, heightPct, objXPct, objYPct };
}

function applyYellowPortraitGrid(grid) {
  const el = document.querySelector("#yellow-door-scene-root .yellow-door-scene__grid");
  if (!el || !grid) return;
  const top = Number(grid.insetTopPct);
  const right = Number(grid.insetRightPct);
  const bottom = Number(grid.insetBottomPct);
  const left = Number(grid.insetLeftPct);
  const gap = Number(grid.gapPx);
  el.style.top = `${Number.isFinite(top) ? top : 8.8}%`;
  el.style.right = `${Number.isFinite(right) ? right : 4}%`;
  el.style.bottom = `${Number.isFinite(bottom) ? bottom : 15}%`;
  el.style.left = `${Number.isFinite(left) ? left : 4}%`;
  el.style.gap = `${Number.isFinite(gap) ? Math.max(0, gap) : 0}px`;
}

export function applyYellowPortraitLayoutCell(index, state) {
  const P = state[`p${index}`];
  if (!P) return;

  const C = normalizeContainer(state[`c${index}`] ?? defaultContainer());
  if (state[`c${index}`]) Object.assign(state[`c${index}`], C);

  const cell = document.querySelector(cellSelector(index));
  const wrap = cell?.querySelector(".yellow-door-scene__portrait-transform");
  const img = cell?.querySelector(".yellow-door-scene__portrait");
  if (!cell || !wrap) return;

  cell.style.width = `${C.widthPct}%`;
  cell.style.height = `${C.heightPct}%`;
  cell.style.margin = "auto";
  cell.style.alignSelf = "center";
  cell.style.justifySelf = "center";
  cell.style.transform = `translate(${C.nudgeXPx}px, ${C.nudgeYPx}px)`;

  const L = normalizePortrait(P);
  Object.assign(P, {
    offsetXPx: L.offsetXPx,
    offsetYPx: L.offsetYPx,
    scale: L.scale,
    widthPct: L.widthPct,
    heightPct: L.heightPct,
  });

  wrap.style.width = "100%";
  wrap.style.height = "100%";
  wrap.style.transform = `translate(${L.offsetXPx}px, ${L.offsetYPx}px) scale(${L.scaleX}, ${L.scaleY})`;

  if (img) {
    img.style.objectPosition = `${C.objXPct}% ${C.objYPct}%`;
  }
}

export function applyYellowPortraitLayoutToDom(state) {
  const s = ensureStateShape(state);
  applyYellowPortraitGrid(s.grid);
  for (let i = 0; i < 9; i++) {
    applyYellowPortraitLayoutCell(i, s);
  }
}

export function initYellowPortraitLayoutFromStorage() {
  applyYellowPortraitLayoutToDom(loadState());
}

export function mountYellowDoorPortraitLayoutPanel() {
  if (!shouldShowYellowPortraitLayoutPanel()) return null;

  const state = loadState();
  applyYellowPortraitLayoutToDom(state);

  let activeIndex = 0;
  const activeKey = () => `p${activeIndex}`;

  const root = document.createElement("aside");
  root.className = "layout-panel yellow-portrait-layout-panel";
  root.innerHTML = `
    <div class="layout-panel__header">
      <strong>黄门后 · 九格人像</strong>
      <span class="layout-panel__hint">?yellowScene=1</span>
      <button type="button" class="layout-panel__collapse" aria-label="收起">−</button>
    </div>
    <div class="layout-panel__body" data-yellow-portrait-body>
      <label class="layout-panel__row">
        <span>当前格</span>
        <select data-yellow-portrait-select></select>
      </label>
      <p class="layout-panel__help layout-panel__help--compact">
        双击出验证模板后会自动显示人像。点击选中当前格；拖动移动；左右/上下边调宽高；角点同时调宽高；右下角圆点调整体大小。仅影响当前格。
      </p>
      <fieldset class="layout-panel__fieldset" data-yellow-portrait-sliders>
        <legend data-yellow-portrait-legend></legend>
      </fieldset>
      <div class="layout-panel__actions">
        <button type="button" data-yellow-portrait="export">复制 JSON</button>
        <button type="button" data-yellow-portrait="reset">恢复默认</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const collapse = root.querySelector(".layout-panel__collapse");
  collapse.addEventListener("click", () => {
    root.classList.toggle("layout-panel--collapsed");
    collapse.textContent = root.classList.contains("layout-panel--collapsed") ? "+" : "−";
  });

  const selectEl = root.querySelector("[data-yellow-portrait-select]");
  const sliderFs = root.querySelector("[data-yellow-portrait-sliders]");
  const legendEl = root.querySelector("[data-yellow-portrait-legend]");

  for (let i = 0; i < 9; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `格 ${i + 1} · ${PORTRAIT_FILE}`;
    selectEl.appendChild(opt);
  }

  const persistAll = () => {
    saveState(state);
    applyYellowPortraitLayoutToDom(state);
  };

  const persistActiveCell = () => {
    saveState(state);
    applyYellowPortraitLayoutCell(activeIndex, state);
  };

  const controls = [];

  for (const spec of CELL_FIELDS) {
    const row = document.createElement("label");
    row.className = "layout-panel__row";
    row.innerHTML = `
      <span>${spec.label}</span>
      <input type="range" data-field="${spec.field}" min="${spec.min}" max="${spec.max}" step="${spec.step}" />
      <input type="number" data-field="${spec.field}" data-num="1" min="${spec.min}" max="${spec.max}" step="${spec.step}" />
    `;
    sliderFs.appendChild(row);

    const range = row.querySelector('input[type="range"]');
    const num = row.querySelector('input[type="number"]');

    const write = (v) => {
      const clamped = Math.min(spec.max, Math.max(spec.min, v));
      state[activeKey()][spec.field] = clamped;
      range.value = String(clamped);
      num.value = String(clamped);
      persistActiveCell();
    };

    range.addEventListener("input", () => {
      num.value = range.value;
      state[activeKey()][spec.field] = Number(range.value);
      persistActiveCell();
    });
    num.addEventListener("change", () => {
      write(Number(num.value));
    });

    controls.push({ spec, range, num });
  }

  const refreshLegend = () => {
    legendEl.textContent = `人像 · 格 ${activeIndex + 1} · ${PORTRAIT_FILE}`;
  };

  const refreshSliders = () => {
    const P = state[activeKey()];
    for (const { spec, range, num } of controls) {
      const v = P[spec.field];
      range.value = String(v);
      num.value = String(v);
    }
    refreshLegend();
  };

  selectEl.addEventListener("change", () => {
    activeIndex = Number(selectEl.value);
    refreshSliders();
  });

  refreshSliders();

  root.querySelector('[data-yellow-portrait="export"]').addEventListener("click", async () => {
    const json = JSON.stringify(state, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      window.alert("已复制当前 JSON。");
    } catch {
      console.log(json);
      window.alert("复制失败，已打印到控制台。");
    }
  });

  root.querySelector('[data-yellow-portrait="reset"]').addEventListener("click", () => {
    const next = structuredClone(YELLOW_PORTRAIT_LAYOUT_DEFAULTS);
    Object.assign(state, next);
    saveState(state);
    applyYellowPortraitLayoutToDom(state);
    root.remove();
    mountYellowDoorPortraitLayoutPanel();
  });

  attachLayoutPanelDragResize(root, "yellowPortrait");

  mountYellowPortraitDirectManip({
    state,
    saveState,
    onSelectIndex: (index) => {
      activeIndex = index;
      selectEl.value = String(index);
      refreshSliders();
    },
    refreshSliders,
  });

  return { state, root };
}
