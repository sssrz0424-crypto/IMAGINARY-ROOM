/**
 * 紫门后模特七步走位调试（1212121：模特_1 / 模特_2 交替）。
 * 地址栏加 ?purpleScene=1 显示面板。
 */

import { attachLayoutPanelDragResize } from "./layoutPanelDragResize.js";

const QUERY_KEY = "purpleScene";
export const STORAGE_KEY = "doors_purple_model_layout_v1";
export const WALK_STEP_COUNT = 7;

const STEP_LEGENDS = [
  "第 1 步 · 模特_1（入画目标位）",
  "第 2 步 · 模特_2",
  "第 3 步 · 模特_1",
  "第 4 步 · 模特_2",
  "第 5 步 · 模特_1",
  "第 6 步 · 模特_2",
  "第 7 步 · 模特_1（出画）",
];

export const PURPLE_MODEL_LAYOUT_DEFAULTS = {
  zone: {
    leftPct: 5.2,
    rightPct: 5.2,
    topPct: 9.5,
    bottomPct: 11.5,
  },
  model: {
    maxHeightPct: 100,
  },
  walk: {
    transitionSec: 0.48,
  },
  /** 第一次单击前：轨道停在画面左侧外，再滑到第 1 步 */
  enter: {
    translateXPct: -42,
    translateYPct: 0,
    scale: 1,
    originXPct: 50,
    originYPct: 100,
  },
  s1: { translateXPct: -28, translateYPct: 0, scale: 1, originXPct: 50, originYPct: 100 },
  s2: { translateXPct: 2, translateYPct: 0, scale: 1, originXPct: 50, originYPct: 100 },
  s3: { translateXPct: 32, translateYPct: 0, scale: 1, originXPct: 50, originYPct: 100 },
  s4: { translateXPct: 52, translateYPct: 0, scale: 1, originXPct: 50, originYPct: 100 },
  s5: { translateXPct: 72, translateYPct: 0, scale: 1, originXPct: 50, originYPct: 100 },
  s6: { translateXPct: 92, translateYPct: 0, scale: 1, originXPct: 50, originYPct: 100 },
  s7: { translateXPct: 112, translateYPct: 0, scale: 1, originXPct: 50, originYPct: 100 },
};

export function shouldShowPurpleModelLayoutPanel() {
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(PURPLE_MODEL_LAYOUT_DEFAULTS);
    return deepMerge(PURPLE_MODEL_LAYOUT_DEFAULTS, JSON.parse(raw));
  } catch {
    return structuredClone(PURPLE_MODEL_LAYOUT_DEFAULTS);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getPurpleModelLayoutState() {
  return loadState();
}

function applyZoneAndModelSize(state) {
  const zone = document.querySelector(".purple-door-scene__model-zone");
  const models = document.querySelectorAll(
    ".purple-door-scene__model, .purple-door-scene__model-ghost-img"
  );
  if (zone && state.zone) {
    const z = state.zone;
    zone.style.left = `${z.leftPct}%`;
    zone.style.right = `${z.rightPct}%`;
    zone.style.top = `${z.topPct}%`;
    zone.style.bottom = `${z.bottomPct}%`;
  }
  const maxH = Number(state.model?.maxHeightPct);
  const mh = Number.isFinite(maxH) ? Math.min(100, Math.max(20, maxH)) : 100;
  models.forEach((img) => {
    img.style.maxHeight = `${mh}%`;
  });
}

function getTransitionCss(state, enabled) {
  const dur = Number(state.walk?.transitionSec);
  const transitionSec = Number.isFinite(dur) ? Math.min(2, Math.max(0, dur)) : 0.48;
  if (!enabled || transitionSec <= 0) return "none";
  return `left ${transitionSec}s ease-out, transform ${transitionSec}s ease-out`;
}

/** @param {object} layout sN 或 enter 条目 */
export function applyTrackLayout(state, track, layout, { animate = true } = {}) {
  if (!track || !layout) return;
  track.style.transition = getTransitionCss(state, animate);
  const tx = Number(layout.translateXPct) || 0;
  const ty = Number(layout.translateYPct) || 0;
  const scale = Number(layout.scale) > 0 ? Number(layout.scale) : 1;
  const ox = Number.isFinite(Number(layout.originXPct)) ? layout.originXPct : 50;
  const oy = Number.isFinite(Number(layout.originYPct)) ? layout.originYPct : 100;
  track.style.left = `${tx}%`;
  track.style.transformOrigin = `${ox}% ${oy}%`;
  track.style.transform = `translateY(${ty}%) scale(${scale})`;
}

/**
 * @param {typeof PURPLE_MODEL_LAYOUT_DEFAULTS} state
 * @param {number} walkStep 0=复位；1–7=对应步
 */
export function applyPurpleModelLayoutToDom(state, walkStep = 0) {
  const track = document.querySelector(".purple-door-scene__model-track");
  applyZoneAndModelSize(state);

  if (!track || walkStep < 1 || walkStep > WALK_STEP_COUNT) {
    if (track) {
      track.style.transition = "none";
      track.style.left = "0";
      track.style.transform = "translateY(0) scale(1)";
    }
    return;
  }

  const s = state[`s${walkStep}`];
  if (!s) return;
  applyTrackLayout(state, track, s, { animate: true });
}

/** 第一次入画：无过渡，置于 enter 起点 */
export function applyPurpleModelEnterStart(state) {
  const track = document.querySelector(".purple-door-scene__model-track");
  applyZoneAndModelSize(state);
  const enter = state.enter ?? PURPLE_MODEL_LAYOUT_DEFAULTS.enter;
  if (track) applyTrackLayout(state, track, enter, { animate: false });
}

export const WALK_FRAME_PATTERN = ["a", "b", "a", "b", "a", "b", "a"];

export function clearPurpleModelWalkGhosts(zone) {
  zone?.querySelector(".purple-door-scene__model-ghosts")?.remove();
}

/** 在模特区内叠显七步走位人影（1212121）。 */
export function mountPurpleModelWalkGhosts(zone, state, { showLabels = false } = {}) {
  if (!zone) return false;

  const modelA = zone.querySelector(".purple-door-scene__model--a");
  const modelB = zone.querySelector(".purple-door-scene__model--b");
  if (!modelA?.src || !modelB?.src) return false;

  applyZoneAndModelSize(state);
  clearPurpleModelWalkGhosts(zone);

  const ghostsRoot = document.createElement("div");
  ghostsRoot.className = "purple-door-scene__model-ghosts";
  const maxH = modelA.style.maxHeight;

  for (let i = 1; i <= WALK_STEP_COUNT; i += 1) {
    const layout = state[`s${i}`];
    if (!layout) continue;

    const ghost = document.createElement("div");
    ghost.className = "purple-door-scene__model-ghost";
    ghost.dataset.step = String(i);

    const track = document.createElement("div");
    track.className = "purple-door-scene__model-ghost-track";

    const img = document.createElement("img");
    img.className = "purple-door-scene__model purple-door-scene__model-ghost-img";
    img.src = WALK_FRAME_PATTERN[i - 1] === "a" ? modelA.src : modelB.src;
    img.alt = "";
    img.decoding = "async";
    if (maxH) img.style.maxHeight = maxH;

    applyTrackLayout(state, track, layout, { animate: false });

    if (showLabels) {
      const label = document.createElement("span");
      label.className = "purple-door-scene__model-ghost-label";
      label.textContent = `${i} · ${WALK_FRAME_PATTERN[i - 1] === "a" ? "模特_1" : "模特_2"}`;
      track.appendChild(label);
    }

    track.appendChild(img);
    ghost.appendChild(track);
    ghostsRoot.appendChild(ghost);
  }

  zone.appendChild(ghostsRoot);
  modelA.classList.remove("purple-door-scene__model--active");
  modelB.classList.remove("purple-door-scene__model--active");

  return true;
}

/**
 * 仅 ?purpleScene=1：七步 1212121 模特同时叠显，便于调各步水平距离。
 */
export function previewPurpleModelWalkAllSteps() {
  if (!shouldShowPurpleModelLayoutPanel()) return false;

  const sceneRoot = document.getElementById("purple-door-scene-root");
  const zone = document.querySelector(".purple-door-scene__model-zone");
  if (!sceneRoot || !zone) return false;

  const state = loadState();
  const modelA = zone.querySelector(".purple-door-scene__model--a");
  const modelB = zone.querySelector(".purple-door-scene__model--b");
  if (!modelA?.src || !modelB?.src) return false;

  sceneRoot.hidden = false;
  sceneRoot.classList.add("purple-door-scene--open");
  sceneRoot.classList.add("purple-door-scene--screen-lit");
  sceneRoot.classList.add("purple-door-scene--layout-preview");
  sceneRoot.classList.add("purple-door-scene--layout-preview-all-steps");

  applyZoneAndModelSize(state);
  zone.classList.add(
    "purple-door-scene__model-zone--preview",
    "purple-door-scene__model-zone--preview-all-steps"
  );
  zone.setAttribute("aria-hidden", "false");

  let ghostsRoot = zone.querySelector(".purple-door-scene__model-ghosts");
  if (!ghostsRoot) {
    ghostsRoot = document.createElement("div");
    ghostsRoot.className = "purple-door-scene__model-ghosts";
    zone.appendChild(ghostsRoot);
  }
  ghostsRoot.replaceChildren();

  const maxH = modelA.style.maxHeight;

  for (let i = 1; i <= WALK_STEP_COUNT; i += 1) {
    const layout = state[`s${i}`];
    if (!layout) continue;

    const ghost = document.createElement("div");
    ghost.className = "purple-door-scene__model-ghost";
    ghost.dataset.step = String(i);

    const label = document.createElement("span");
    label.className = "purple-door-scene__model-ghost-label";
    label.textContent = `${i} · ${WALK_FRAME_PATTERN[i - 1] === "a" ? "模特_1" : "模特_2"}`;

    const track = document.createElement("div");
    track.className = "purple-door-scene__model-ghost-track";

    const img = document.createElement("img");
    img.className = "purple-door-scene__model purple-door-scene__model-ghost-img";
    img.src = WALK_FRAME_PATTERN[i - 1] === "a" ? modelA.src : modelB.src;
    img.alt = "";
    img.decoding = "async";
    if (maxH) img.style.maxHeight = maxH;

    applyTrackLayout(state, track, layout, { animate: false });

    track.appendChild(label);
    track.appendChild(img);
    ghost.appendChild(track);
    ghostsRoot.appendChild(ghost);
  }

  modelA.classList.remove("purple-door-scene__model--active");
  modelB.classList.remove("purple-door-scene__model--active");

  return true;
}

export function clearPurpleModelLayoutPreview() {
  const sceneRoot = document.getElementById("purple-door-scene-root");
  const zone = document.querySelector(".purple-door-scene__model-zone");
  sceneRoot?.classList.remove("purple-door-scene--layout-preview");
  sceneRoot?.classList.remove("purple-door-scene--layout-preview-all-steps");
  zone?.classList.remove(
    "purple-door-scene__model-zone--preview",
    "purple-door-scene__model-zone--preview-all-steps"
  );
  zone?.querySelector(".purple-door-scene__model-ghosts")?.remove();
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

  const read = () => Number(range.value);
  const write = (v) => {
    const clamped = Math.min(spec.max, Math.max(spec.min, v));
    if (section) {
      state[section][key] = clamped;
    } else {
      state[key] = clamped;
    }
    range.value = String(clamped);
    num.value = String(clamped);
    onChange();
  };

  range.addEventListener("input", () => {
    num.value = range.value;
    if (section) {
      state[section][key] = read();
    } else {
      state[key] = read();
    }
    onChange();
  });
  num.addEventListener("change", () => {
    write(Number(num.value));
  });

  const val = section ? state[section][key] : state[key];
  range.value = String(val);
  num.value = String(val);
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

export function initPurpleModelLayoutFromStorage() {
  applyPurpleModelLayoutToDom(loadState(), 0);
}

export function mountPurpleDoorModelLayoutPanel() {
  if (!shouldShowPurpleModelLayoutPanel()) return null;

  const state = loadState();

  const root = document.createElement("aside");
  root.className = "layout-panel purple-model-layout-panel";
  root.innerHTML = `
    <div class="layout-panel__header">
      <strong>紫门后 · 模特走位（1212121）</strong>
      <span class="layout-panel__hint">?purpleScene=1</span>
      <button type="button" class="layout-panel__collapse" aria-label="收起">−</button>
    </div>
    <div class="layout-panel__body" data-pds-body></div>
  `;
  document.body.appendChild(root);

  const body = root.querySelector("[data-pds-body]");
  const collapse = root.querySelector(".layout-panel__collapse");
  collapse.addEventListener("click", () => {
    root.classList.toggle("layout-panel--collapsed");
    collapse.textContent = root.classList.contains("layout-panel--collapsed") ? "+" : "−";
  });

  const persistPreview = () => {
    saveState(state);
    previewPurpleModelWalkAllSteps();
  };

  const persistStep = () => {
    saveState(state);
    previewPurpleModelWalkAllSteps();
  };

  addFieldset(
    body,
    state,
    "① 入画起点（第 1 次单击前）",
    [
      { path: "enter.translateXPct", label: "起点水平 %（通常在画面左侧外）", min: -120, max: 40, step: 1 },
      { path: "enter.translateYPct", label: "起点垂直微调 %", min: -40, max: 40, step: 0.5 },
      { path: "enter.scale", label: "起点缩放", min: 0.4, max: 2.2, step: 0.01 },
    ],
    persistPreview
  );

  addFieldset(
    body,
    state,
    "② 活动区域与行走",
    [
      { path: "zone.leftPct", label: "左边距 %", min: 0, max: 40, step: 0.2 },
      { path: "zone.rightPct", label: "右边距 %", min: 0, max: 40, step: 0.2 },
      { path: "zone.topPct", label: "上边距 %", min: 0, max: 40, step: 0.2 },
      { path: "zone.bottomPct", label: "下边距 %", min: 0, max: 40, step: 0.2 },
      { path: "model.maxHeightPct", label: "模特最大高度（区内 %）", min: 30, max: 100, step: 1 },
      { path: "walk.transitionSec", label: "行走过渡 秒", min: 0, max: 1.5, step: 0.05 },
    ],
    persistPreview
  );

  const stepRows = (n) => {
    const p = `s${n}`;
    return [
      { path: `${p}.translateXPct`, label: "水平位置 %（相对窗框宽）", min: -80, max: 120, step: 1 },
      { path: `${p}.translateYPct`, label: "垂直微调 %", min: -40, max: 40, step: 0.5 },
      { path: `${p}.scale`, label: "缩放", min: 0.4, max: 2.2, step: 0.01 },
      { path: `${p}.originXPct`, label: "锚点 X %", min: 0, max: 100, step: 1 },
      { path: `${p}.originYPct`, label: "锚点 Y %（100=脚底）", min: 0, max: 100, step: 1 },
    ];
  };

  for (let i = 1; i <= WALK_STEP_COUNT; i += 1) {
    addFieldset(body, state, `③ ${STEP_LEGENDS[i - 1]}`, stepRows(i), persistStep);
  }

  const previewNote = document.createElement("p");
  previewNote.className = "layout-panel__help layout-panel__help--compact";
  previewNote.innerHTML =
    "画面上会<strong>同时显示 7 个走位</strong>（1212121）。请先双击紫门进入场景；拖任一步滑块会实时更新全部叠影。正式游玩（无 <code>?purpleScene=1</code>）仍一次只出现一名模特。";
  body.appendChild(previewNote);

  const actions = document.createElement("div");
  actions.className = "layout-panel__actions";
  actions.innerHTML = `
    <button type="button" data-pds="export">复制 JSON</button>
    <button type="button" data-pds="reset">恢复默认</button>
    <button type="button" data-pds="clear">清除存档</button>
  `;
  body.appendChild(actions);

  const help = document.createElement("p");
  help.className = "layout-panel__help";
  help.innerHTML = [
    "<strong>怎么用</strong>：加 <code>?purpleScene=1</code> 刷新；双击开窗帘 → <strong>单击</strong>点亮紫屏 → 再单击 7 次（1212121）走过。",
    "第 1 次单击从「入画起点」滑到第 1 步位置；第 2–7 步依次向右。满意后<strong>复制 JSON</strong> 粘贴到 <code>PURPLE_MODEL_LAYOUT_DEFAULTS</code>。",
  ].join("<br/>");
  body.appendChild(help);

  actions.querySelector('[data-pds="export"]').addEventListener("click", async () => {
    const json = JSON.stringify(state, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      window.alert("已复制当前走位 JSON。");
    } catch {
      console.log(json);
      window.alert("复制失败，已打印到控制台。");
    }
  });

  actions.querySelector('[data-pds="reset"]').addEventListener("click", () => {
    saveState(structuredClone(PURPLE_MODEL_LAYOUT_DEFAULTS));
    root.remove();
    mountPurpleDoorModelLayoutPanel();
  });

  actions.querySelector('[data-pds="clear"]').addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    root.remove();
    mountPurpleDoorModelLayoutPanel();
  });

  attachLayoutPanelDragResize(root, "purpleModel");
  previewPurpleModelWalkAllSteps();

  return { state, root };
}
