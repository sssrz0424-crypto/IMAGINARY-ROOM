/**
 * 粉门后九张贴图构图调试：位置、透视、旋转、锚点等。
 * 地址栏加 ?pinkScene=1 显示面板；调节写入 localStorage，「复制 JSON」可固化到 PINK_POSTER_LAYOUT_DEFAULTS。
 */

import { attachLayoutPanelDragResize } from "./layoutPanelDragResize.js";
import {
  PINK_POSTER_LAYOUT_DEFAULTS,
  applyPinkPosterLayoutToDom,
} from "./pinkDoorPosterLayout.js";

const QUERY_KEY = "pinkScene";
export const STORAGE_KEY = "doors_pink_poster_layout_v2";

const POSTER_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const POSTER_LEGENDS = {
  "1": "左墙 · 1（靠观众）",
  "2": "左墙 · 2（靠后角）",
  "3": "正墙 · 3",
  "4": "正墙 · 4（左）",
  "5": "正墙 · 5（右）",
  "6": "正墙 · 6",
  "7": "右墙 · 7（靠后角）",
  "8": "正墙 · 8（正中）",
  "9": "右墙 · 9（靠观众）",
};

const SCENE_RANGES = {
  perspectivePx: { min: 320, max: 4000, step: 10 },
  perspectiveOriginXPct: { min: 0, max: 100, step: 0.5 },
  perspectiveOriginYPct: { min: 0, max: 100, step: 0.5 },
};

const POSTER_RANGES = {
  cxPct: { min: -20, max: 120, step: 0.1 },
  cyPct: { min: -20, max: 120, step: 0.1 },
  wPct: { min: 2, max: 40, step: 0.1 },
  hPct: { min: 2, max: 50, step: 0.1 },
  rotXDeg: { min: -75, max: 75, step: 0.5 },
  rotYDeg: { min: -85, max: 85, step: 0.5 },
  rotZDeg: { min: -45, max: 45, step: 0.5 },
  translateZPx: { min: -200, max: 200, step: 1 },
  scale: { min: 0.2, max: 2.5, step: 0.01 },
  originXPct: { min: 0, max: 100, step: 0.5 },
  originYPct: { min: 0, max: 100, step: 0.5 },
  zIndex: { min: 1, max: 40, step: 1 },
};

export function shouldShowPinkPosterLayoutPanel() {
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

export function ensurePinkPosterLayoutDefaults(state) {
  if (!state) return structuredClone(PINK_POSTER_LAYOUT_DEFAULTS);
  const base = PINK_POSTER_LAYOUT_DEFAULTS;
  if (!state.scene) state.scene = structuredClone(base.scene);
  for (const k of Object.keys(base.scene)) {
    if (state.scene[k] === undefined) state.scene[k] = base.scene[k];
  }
  if (!state.posters) state.posters = {};
  for (const id of POSTER_IDS) {
    if (!state.posters[id]) state.posters[id] = structuredClone(base.posters[id]);
    const p = state.posters[id];
    const bp = base.posters[id];
    for (const key of Object.keys(bp)) {
      if (p[key] === undefined) p[key] = bp[key];
    }
  }
  return state;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ensurePinkPosterLayoutDefaults(structuredClone(PINK_POSTER_LAYOUT_DEFAULTS));
    return ensurePinkPosterLayoutDefaults(deepMerge(PINK_POSTER_LAYOUT_DEFAULTS, JSON.parse(raw)));
  } catch {
    return ensurePinkPosterLayoutDefaults(structuredClone(PINK_POSTER_LAYOUT_DEFAULTS));
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getPinkPosterLayoutState() {
  return loadState();
}

export function initPinkPosterLayoutFromStorage() {
  applyPinkPosterLayoutToDom(loadState());
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
    <input type="number" data-path="${path}" data-num="1" min="${spec.min}" max="${spec.max}" step="${spec.step}" />
  `;
  root.appendChild(wrap);

  const range = wrap.querySelector('input[type="range"]');
  const num = wrap.querySelector('input[type="number"]');

  const getParent = () => {
    if (!section) return state;
    return section.split(".").reduce((o, p) => o[p], state);
  };

  const clamp = (v) => Math.min(spec.max, Math.max(spec.min, v));
  const syncUi = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    getParent()[key] = n;
    range.value = String(clamp(n));
    num.value = String(n);
    onChange();
  };

  range.addEventListener("input", () => syncUi(range.value));
  num.addEventListener("change", () => syncUi(num.value));

  const cur = getParent()[key];
  range.value = String(cur);
  num.value = String(cur);
}

function bindPosterRow(root, state, posterId, fieldKey, spec, onChange) {
  const path = `posters.${posterId}.${fieldKey}`;
  bindRow(root, state, path, spec, onChange);
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

function posterRows(posterId) {
  const R = POSTER_RANGES;
  return [
    { key: "cxPct", label: "中心 X（视口 %）", ...R.cxPct },
    { key: "cyPct", label: "中心 Y（视口 %）", ...R.cyPct },
    { key: "wPct", label: "宽度 %", ...R.wPct },
    { key: "hPct", label: "高度 %", ...R.hPct },
    { key: "rotXDeg", label: "俯仰 rotateX °（贴天地线）", ...R.rotXDeg },
    { key: "rotYDeg", label: "左右 rotateY °（侧墙朝向）", ...R.rotYDeg },
    { key: "rotZDeg", label: "平面旋转 rotateZ °", ...R.rotZDeg },
    { key: "translateZPx", label: "景深 translateZ px", ...R.translateZPx },
    { key: "scale", label: "缩放倍率", ...R.scale },
    { key: "originXPct", label: "变换锚点 X %", ...R.originXPct },
    { key: "originYPct", label: "变换锚点 Y %", ...R.originYPct },
    { key: "zIndex", label: "层叠 z（大压小）", ...R.zIndex },
  ].map((row) => ({ ...row, posterId }));
}

function addPosterFieldset(body, state, posterId, onChange) {
  const fs = document.createElement("fieldset");
  fs.className = "layout-panel__fieldset";
  const lg = document.createElement("legend");
  lg.textContent = POSTER_LEGENDS[posterId] ?? `贴图 ${posterId}`;
  fs.appendChild(lg);
  posterRows(posterId).forEach((row) => {
    bindPosterRow(fs, state, posterId, row.key, row, onChange);
  });
  body.appendChild(fs);
}

export { applyPinkPosterLayoutToDom };

export function mountPinkDoorPosterLayoutPanel() {
  if (!shouldShowPinkPosterLayoutPanel()) return null;

  const state = loadState();
  applyPinkPosterLayoutToDom(state);

  const root = document.createElement("aside");
  root.className = "layout-panel pink-poster-layout-panel";
  root.innerHTML = `
    <div class="layout-panel__header">
      <strong>粉门后 · 九张贴图排布与透视</strong>
      <span class="layout-panel__hint">?pinkScene=1</span>
      <button type="button" class="layout-panel__collapse" aria-label="收起">−</button>
    </div>
    <div class="layout-panel__body" data-pink-layout-body></div>
  `;
  document.body.appendChild(root);

  const body = root.querySelector("[data-pink-layout-body]");
  const collapse = root.querySelector(".layout-panel__collapse");
  collapse.addEventListener("click", () => {
    root.classList.toggle("layout-panel--collapsed");
    collapse.textContent = root.classList.contains("layout-panel--collapsed") ? "+" : "−";
  });

  const persist = () => {
    ensurePinkPosterLayoutDefaults(state);
    saveState(state);
    applyPinkPosterLayoutToDom(state);
  };

  ensurePinkPosterLayoutDefaults(state);

  const P = SCENE_RANGES;
  addFieldset(
    body,
    state,
    "① 场景透视（全局，对齐线框灭点）",
    [
      { path: "scene.perspectivePx", label: "透视距离 px（小=更强）", ...P.perspectivePx },
      { path: "scene.perspectiveOriginXPct", label: "消失点 水平 %", ...P.perspectiveOriginXPct },
      { path: "scene.perspectiveOriginYPct", label: "消失点 垂直 %", ...P.perspectiveOriginYPct },
    ],
    persist
  );

  addPosterFieldset(body, state, "4", persist);
  addPosterFieldset(body, state, "3", persist);
  addPosterFieldset(body, state, "8", persist);
  addPosterFieldset(body, state, "6", persist);
  addPosterFieldset(body, state, "5", persist);
  addPosterFieldset(body, state, "2", persist);
  addPosterFieldset(body, state, "1", persist);
  addPosterFieldset(body, state, "7", persist);
  addPosterFieldset(body, state, "9", persist);

  const tiltActions = document.createElement("div");
  tiltActions.className = "layout-panel__actions layout-panel__actions--compact";
  tiltActions.innerHTML = `
    <button type="button" data-pink="side-tilt-zero">侧墙 1·2·7·9 倾斜归零</button>
    <button type="button" data-pink="back-flat">正墙 3·4·5·6·8 摆正（无旋转）</button>
    <button type="button" data-pink="persp-default">透视恢复默认（1420px）</button>
  `;
  body.appendChild(tiltActions);

  tiltActions.querySelector('[data-pink="side-tilt-zero"]').addEventListener("click", () => {
    for (const id of ["1", "2", "7", "9"]) {
      const p = state.posters[id];
      if (!p) continue;
      p.rotXDeg = 0;
      p.rotYDeg = 0;
      p.translateZPx = 0;
    }
    persist();
    root.remove();
    mountPinkDoorPosterLayoutPanel();
  });

  tiltActions.querySelector('[data-pink="back-flat"]').addEventListener("click", () => {
    for (const id of ["3", "4", "5", "6", "8"]) {
      const p = state.posters[id];
      if (!p) continue;
      p.rotXDeg = 0;
      p.rotYDeg = 0;
      p.rotZDeg = 0;
      p.translateZPx = 0;
    }
    persist();
    root.remove();
    mountPinkDoorPosterLayoutPanel();
  });

  tiltActions.querySelector('[data-pink="persp-default"]').addEventListener("click", () => {
    state.scene.perspectivePx = PINK_POSTER_LAYOUT_DEFAULTS.scene.perspectivePx;
    state.scene.perspectiveOriginXPct = PINK_POSTER_LAYOUT_DEFAULTS.scene.perspectiveOriginXPct;
    state.scene.perspectiveOriginYPct = PINK_POSTER_LAYOUT_DEFAULTS.scene.perspectiveOriginYPct;
    persist();
    root.remove();
    mountPinkDoorPosterLayoutPanel();
  });

  const actions = document.createElement("div");
  actions.className = "layout-panel__actions";
  actions.innerHTML = `
    <button type="button" data-pink="export">复制 JSON</button>
    <button type="button" data-pink="reset">恢复默认</button>
    <button type="button" data-pink="clear">清除存档</button>
  `;
  body.appendChild(actions);

  const help = document.createElement("p");
  help.className = "layout-panel__help";
  help.innerHTML = [
    "<strong>怎么用</strong>：加 <code>?pinkScene=1</code> 刷新，再<strong>双击粉门</strong>进入场景。",
    "<strong>标题栏</strong>可拖动、<strong>右下角</strong>可缩放面板；位置记在本地。",
    "<strong>①</strong> 场景透视：灭点建议约 <strong>50%, 50%</strong>，与 background 线框一致；先调透视距离，再调各贴图 <strong>translateZ</strong>。",
    "<strong>正墙</strong> 4·3·8·6·5（8 正中）宜保持 rotateY≈0；<strong>侧墙</strong> 用 rotateY 贴合墙面，锚点靠中缝（左墙 100%、右墙 0%）。",
    "满意后<strong>复制 JSON</strong>，粘贴到 <code>pinkDoorPosterLayout.js</code> 的 <code>PINK_POSTER_LAYOUT_DEFAULTS</code>。",
  ].join("<br/>");
  body.appendChild(help);

  actions.querySelector('[data-pink="export"]').addEventListener("click", async () => {
    const json = JSON.stringify(state, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      window.alert("已复制当前构图 JSON。");
    } catch {
      console.log(json);
      window.alert("复制失败，已打印到控制台。");
    }
  });

  actions.querySelector('[data-pink="reset"]').addEventListener("click", () => {
    const next = ensurePinkPosterLayoutDefaults(structuredClone(PINK_POSTER_LAYOUT_DEFAULTS));
    saveState(next);
    applyPinkPosterLayoutToDom(next);
    root.remove();
    mountPinkDoorPosterLayoutPanel();
  });

  actions.querySelector('[data-pink="clear"]').addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    applyPinkPosterLayoutToDom(
      ensurePinkPosterLayoutDefaults(structuredClone(PINK_POSTER_LAYOUT_DEFAULTS))
    );
    root.remove();
    mountPinkDoorPosterLayoutPanel();
  });

  attachLayoutPanelDragResize(root, "pinkPoster");

  return { state, root };
}
