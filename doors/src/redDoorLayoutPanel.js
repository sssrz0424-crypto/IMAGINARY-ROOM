/**
 * 红门后 HTML 叠层构图调试：大小、位置、锚点等。
 * 在地址栏加 ?redScene=1 显示面板；调节结果写入 localStorage，并可用「复制 JSON」固化到代码。
 */

import { attachLayoutPanelDragResize } from "./layoutPanelDragResize.js";

const QUERY_KEY = "redScene";
const STORAGE_KEY = "doors_red_scene_layout_v1";

/** 与 style.css 中 .red-door-scene__layers 默认值保持一致 */
export const RED_SCENE_LAYOUT_DEFAULTS = {
  bg: {
    scale: 1,
    txPct: 0,
    tyPct: 0,
    objX: 50,
    objY: 40,
  },
  hero: {
    leftPct: 50,
    bottomVh: 2.5,
    widthVw: 96,
    maxVh: 88,
    maxVw: 92,
    nudgeXPx: 0,
    nudgeYPx: -106,
    scale: 1.04,
    rotateDeg: 0,
  },
  fg: {
    maxVh: 45.5,
    maxVw: 52,
    widthPct: 100,
    bottomVh: 0,
    nudgeXPx: -2,
    nudgeYPx: 84,
    scale: 1,
    opacity: 1,
    objX: 50,
    objY: 100,
  },
  fgAfter: {
    maxVh: 55,
    maxVw: 52,
    widthPct: 100,
    bottomVh: 0,
    nudgeXPx: -2,
    nudgeYPx: 118,
    scale: 1,
    opacity: 1,
    objX: 50,
    objY: 100,
  },
};

export function shouldShowRedSceneLayoutPanel() {
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
    if (!raw) return structuredClone(RED_SCENE_LAYOUT_DEFAULTS);
    const parsed = JSON.parse(raw);
    return deepMerge(RED_SCENE_LAYOUT_DEFAULTS, parsed);
  } catch {
    return structuredClone(RED_SCENE_LAYOUT_DEFAULTS);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function getLayersEl() {
  return document.querySelector(".red-door-scene__layers");
}

export function applyRedSceneLayoutToDom(state) {
  const el = getLayersEl();
  if (!el) return;

  const { bg, hero, fg, fgAfter } = state;

  el.style.setProperty("--rds-bg-scale", String(bg.scale));
  el.style.setProperty("--rds-bg-tx-pct", `${bg.txPct}%`);
  el.style.setProperty("--rds-bg-ty-pct", `${bg.tyPct}%`);
  el.style.setProperty("--rds-bg-obj-x", `${bg.objX}%`);
  el.style.setProperty("--rds-bg-obj-y", `${bg.objY}%`);

  el.style.setProperty("--rds-hero-left-pct", `${hero.leftPct}%`);
  el.style.setProperty("--rds-hero-bottom", `${hero.bottomVh}vh`);
  el.style.setProperty("--rds-hero-width-vw", String(hero.widthVw));
  el.style.setProperty("--rds-hero-max-vh", String(hero.maxVh));
  el.style.setProperty("--rds-hero-max-vw", String(hero.maxVw));
  el.style.setProperty("--rds-hero-nudge-x", `${hero.nudgeXPx}px`);
  el.style.setProperty("--rds-hero-nudge-y", `${hero.nudgeYPx}px`);
  el.style.setProperty("--rds-hero-scale", String(hero.scale));
  el.style.setProperty("--rds-hero-rotate", `${hero.rotateDeg}deg`);

  el.style.setProperty("--rds-fg-max-vh", String(fg.maxVh));
  el.style.setProperty("--rds-fg-max-vw", String(fg.maxVw));
  el.style.setProperty("--rds-fg-width-pct", `${fg.widthPct}%`);
  el.style.setProperty("--rds-fg-bottom", `${fg.bottomVh}vh`);
  el.style.setProperty("--rds-fg-nudge-x", `${fg.nudgeXPx}px`);
  el.style.setProperty("--rds-fg-nudge-y", `${fg.nudgeYPx}px`);
  el.style.setProperty("--rds-fg-scale", String(fg.scale));
  el.style.setProperty("--rds-fg-opacity", String(fg.opacity));
  el.style.setProperty("--rds-fg-obj-x", `${fg.objX}%`);
  el.style.setProperty("--rds-fg-obj-y", `${fg.objY}%`);

  const fa = fgAfter ?? RED_SCENE_LAYOUT_DEFAULTS.fgAfter;
  el.style.setProperty("--rds-fga-max-vh", String(fa.maxVh));
  el.style.setProperty("--rds-fga-max-vw", String(fa.maxVw));
  el.style.setProperty("--rds-fga-width-pct", `${fa.widthPct}%`);
  el.style.setProperty("--rds-fga-bottom", `${fa.bottomVh}vh`);
  el.style.setProperty("--rds-fga-nudge-x", `${fa.nudgeXPx}px`);
  el.style.setProperty("--rds-fga-nudge-y", `${fa.nudgeYPx}px`);
  el.style.setProperty("--rds-fga-scale", String(fa.scale));
  el.style.setProperty("--rds-fga-opacity", String(fa.opacity));
  el.style.setProperty("--rds-fga-obj-x", `${fa.objX}%`);
  el.style.setProperty("--rds-fga-obj-y", `${fa.objY}%`);
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
    state[section][key] = clamped;
    range.value = String(clamped);
    num.value = String(clamped);
    onChange();
  };

  range.addEventListener("input", () => {
    num.value = range.value;
    state[section][key] = read();
    onChange();
  });
  num.addEventListener("change", () => {
    write(Number(num.value));
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

/** 无面板时也应用本机存档，使正式浏览保持上次调节的构图 */
export function initRedSceneLayoutFromStorage() {
  applyRedSceneLayoutToDom(loadState());
}

export function mountRedDoorLayoutPanel() {
  if (!shouldShowRedSceneLayoutPanel()) return null;

  const state = loadState();
  applyRedSceneLayoutToDom(state);

  const root = document.createElement("aside");
  root.className = "layout-panel red-scene-layout-panel";
  root.innerHTML = `
    <div class="layout-panel__header">
      <strong>红门后构图</strong>
      <span class="layout-panel__hint">?redScene=1</span>
      <button type="button" class="layout-panel__collapse" aria-label="收起">−</button>
    </div>
    <div class="layout-panel__body" data-rds-body></div>
  `;
  document.body.appendChild(root);

  const body = root.querySelector("[data-rds-body]");
  const collapseBtn = root.querySelector(".layout-panel__collapse");
  collapseBtn.addEventListener("click", () => {
    root.classList.toggle("layout-panel--collapsed");
    collapseBtn.textContent = root.classList.contains("layout-panel--collapsed")
      ? "+"
      : "−";
  });

  const persist = () => {
    saveState(state);
    applyRedSceneLayoutToDom(state);
  };

  addFieldset(
    body,
    state,
    "背景舞台",
    [
      { path: "bg.scale", label: "缩放", min: 0.5, max: 2.5, step: 0.01 },
      { path: "bg.txPct", label: "水平偏移 %", min: -35, max: 35, step: 0.5 },
      { path: "bg.tyPct", label: "垂直偏移 %", min: -35, max: 35, step: 0.5 },
      { path: "bg.objX", label: "构图锚点 X %", min: 0, max: 100, step: 0.5 },
      { path: "bg.objY", label: "构图锚点 Y %", min: 0, max: 100, step: 0.5 },
    ],
    persist
  );

  addFieldset(
    body,
    state,
    "人物",
    [
      { path: "hero.leftPct", label: "水平位置 %", min: 0, max: 100, step: 0.5 },
      { path: "hero.bottomVh", label: "距底 vh", min: 0, max: 28, step: 0.1 },
      { path: "hero.widthVw", label: "最大宽 vw", min: 24, max: 100, step: 0.5 },
      { path: "hero.maxVh", label: "最大高 vh", min: 20, max: 100, step: 0.5 },
      { path: "hero.maxVw", label: "最大高 vw 上限", min: 20, max: 120, step: 0.5 },
      { path: "hero.nudgeXPx", label: "微调左右 px", min: -220, max: 220, step: 1 },
      { path: "hero.nudgeYPx", label: "微调上下 px", min: -220, max: 220, step: 1 },
      { path: "hero.scale", label: "整体缩放", min: 0.35, max: 2.2, step: 0.01 },
      { path: "hero.rotateDeg", label: "旋转 °", min: -25, max: 25, step: 0.2 },
    ],
    persist
  );

  addFieldset(
    body,
    state,
    "观众前景",
    [
      { path: "fg.maxVh", label: "最大高 vh", min: 8, max: 85, step: 0.5 },
      { path: "fg.maxVw", label: "最大高 vw 上限", min: 20, max: 100, step: 0.5 },
      { path: "fg.widthPct", label: "宽度 %", min: 40, max: 140, step: 0.5 },
      { path: "fg.bottomVh", label: "距底 vh", min: -18, max: 35, step: 0.1 },
      { path: "fg.nudgeXPx", label: "微调左右 px", min: -320, max: 320, step: 1 },
      { path: "fg.nudgeYPx", label: "微调上下 px", min: -280, max: 280, step: 1 },
      { path: "fg.scale", label: "整体缩放", min: 0.4, max: 2.2, step: 0.01 },
      { path: "fg.opacity", label: "透明度", min: 0, max: 1, step: 0.01 },
      { path: "fg.objX", label: "构图锚点 X %", min: 0, max: 100, step: 0.5 },
      { path: "fg.objY", label: "构图锚点 Y %", min: 0, max: 100, step: 0.5 },
    ],
    persist
  );

  addFieldset(
    body,
    state,
    "观众（举手机）",
    [
      { path: "fgAfter.maxVh", label: "最大高 vh", min: 8, max: 85, step: 0.5 },
      { path: "fgAfter.maxVw", label: "最大高 vw 上限", min: 20, max: 100, step: 0.5 },
      { path: "fgAfter.widthPct", label: "宽度 %", min: 40, max: 140, step: 0.5 },
      { path: "fgAfter.bottomVh", label: "距底 vh", min: -18, max: 35, step: 0.1 },
      { path: "fgAfter.nudgeXPx", label: "微调左右 px", min: -320, max: 320, step: 1 },
      { path: "fgAfter.nudgeYPx", label: "微调上下 px", min: -280, max: 280, step: 1 },
      { path: "fgAfter.scale", label: "整体缩放", min: 0.4, max: 2.2, step: 0.01 },
      { path: "fgAfter.opacity", label: "显示时透明度", min: 0, max: 1, step: 0.01 },
      { path: "fgAfter.objX", label: "构图锚点 X %", min: 0, max: 100, step: 0.5 },
      { path: "fgAfter.objY", label: "构图锚点 Y %", min: 0, max: 100, step: 0.5 },
    ],
    persist
  );

  const actions = document.createElement("div");
  actions.className = "layout-panel__actions";
  actions.innerHTML = `
    <button type="button" data-rds="export">复制 JSON</button>
    <button type="button" data-rds="reset">恢复默认</button>
    <button type="button" data-rds="clear">清除存档</button>
  `;
  body.appendChild(actions);

  const help = document.createElement("p");
  help.className = "layout-panel__help";
  help.textContent =
    "请先双击红门进入该页再肉眼看效果。数值自动保存到本机；「复制 JSON」可粘贴到 redDoorLayoutPanel.js 的 RED_SCENE_LAYOUT_DEFAULTS。「观众（举手机）」为双击屏幕后显示的那一层。";
  body.appendChild(help);

  actions.querySelector('[data-rds="export"]').addEventListener("click", async () => {
    const text = JSON.stringify(state, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      window.alert("已复制当前构图 JSON。");
    } catch {
      console.log(text);
      window.alert("复制失败，已打印到控制台。");
    }
  });

  actions.querySelector('[data-rds="reset"]').addEventListener("click", () => {
    const next = structuredClone(RED_SCENE_LAYOUT_DEFAULTS);
    saveState(next);
    applyRedSceneLayoutToDom(next);
    root.remove();
    mountRedDoorLayoutPanel();
  });

  actions.querySelector('[data-rds="clear"]').addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const next = structuredClone(RED_SCENE_LAYOUT_DEFAULTS);
    applyRedSceneLayoutToDom(next);
    root.remove();
    mountRedDoorLayoutPanel();
  });

  attachLayoutPanelDragResize(root, "redScene");

  return { state, root };
}
