/**
 * 蓝门后：每面镜上 TikTok 式叠层（图标列 + 左下角文案）的位置与缩放。
 * 地址栏 ?mirrorHud=1 打开面板；结果写入 localStorage，可复制 JSON 固化到 BLUE_MIRROR_HUD_LAYOUT_DEFAULTS。
 */

import { attachLayoutPanelDragResize } from "./layoutPanelDragResize.js";

const QUERY_KEY = "mirrorHud";
export const STORAGE_KEY = "doors_blue_mirror_hud_layout_v2";

const MIRROR_LEGENDS = [
  "镜1 · 右侧图标列与左下角文案",
  "镜2 · 右侧图标列与左下角文案",
  "镜3 · 右侧图标列与左下角文案",
  "镜4 · 右侧图标列与左下角文案",
  "镜5 · 右侧图标列与左下角文案",
];

/** 与 CSS 中 var(--mh-*) 默认值一致；复制 JSON 可粘回此对象 */
export const BLUE_MIRROR_HUD_LAYOUT_DEFAULTS = {
  m0: {
    railRightPct: 28,
    railBottomPct: 39.2,
    railScale: 0.34,
    railNudgeXPx: -19,
    railNudgeYPx: -39,
    metaLeftPct: 4.5,
    metaBottomPct: 8,
    metaScale: 0.4,
    metaNudgeXPx: 86,
    metaNudgeYPx: -183,
  },
  m1: {
    railRightPct: 28,
    railBottomPct: 28.2,
    railScale: 0.34,
    railNudgeXPx: -26,
    railNudgeYPx: -121,
    metaLeftPct: 0,
    metaBottomPct: 8,
    metaScale: 0.46,
    metaNudgeXPx: 104,
    metaNudgeYPx: -218,
  },
  m2: {
    railRightPct: 3.5,
    railBottomPct: 14,
    railScale: 0.5,
    railNudgeXPx: -65,
    railNudgeYPx: -182,
    metaLeftPct: 25.2,
    metaBottomPct: 8,
    metaScale: 0.76,
    metaNudgeXPx: 5,
    metaNudgeYPx: -103,
  },
  m3: {
    railRightPct: 47,
    railBottomPct: 41.2,
    railScale: 0.38,
    railNudgeXPx: 0,
    railNudgeYPx: 0,
    metaLeftPct: 4.5,
    metaBottomPct: 8,
    metaScale: 0.48,
    metaNudgeXPx: 43,
    metaNudgeYPx: -160,
  },
  m4: {
    railRightPct: 30.2,
    railBottomPct: 14,
    railScale: 0.42,
    railNudgeXPx: 0,
    railNudgeYPx: -185,
    metaLeftPct: 4.5,
    metaBottomPct: 8,
    metaScale: 0.68,
    metaNudgeXPx: 76,
    metaNudgeYPx: -155,
  },
};

export function shouldShowMirrorHudLayoutPanel() {
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
    if (!raw) return structuredClone(BLUE_MIRROR_HUD_LAYOUT_DEFAULTS);
    const parsed = JSON.parse(raw);
    return deepMerge(BLUE_MIRROR_HUD_LAYOUT_DEFAULTS, parsed);
  } catch {
    return structuredClone(BLUE_MIRROR_HUD_LAYOUT_DEFAULTS);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function mirrorShellEl(index) {
  return document.querySelector(
    `#blue-door-void-root .blue-door-void__mirror[data-blue-mirror-index="${index}"]`
  );
}

export function applyMirrorHudLayoutToDom(state) {
  for (let i = 0; i < 5; i++) {
    const m = state[`m${i}`];
    const el = mirrorShellEl(i);
    if (!m || !el) continue;
    const rr = Number(m.railRightPct);
    const rb = Number(m.railBottomPct);
    const rs = Math.max(0.08, Math.min(6, Number(m.railScale) || 1));
    const rnx = Number(m.railNudgeXPx) || 0;
    const rny = Number(m.railNudgeYPx) || 0;
    const ml = Number(m.metaLeftPct);
    const mb = Number(m.metaBottomPct);
    const ms = Math.max(0.08, Math.min(6, Number(m.metaScale) || 1));
    const mnx = Number(m.metaNudgeXPx) || 0;
    const mny = Number(m.metaNudgeYPx) || 0;

    el.style.setProperty("--mh-rail-right", `${Number.isFinite(rr) ? rr : 3.5}%`);
    el.style.setProperty("--mh-rail-bottom", `${Number.isFinite(rb) ? rb : 14}%`);
    el.style.setProperty("--mh-rail-scale", String(rs));
    el.style.setProperty("--mh-rail-nudge-x", `${rnx}px`);
    el.style.setProperty("--mh-rail-nudge-y", `${rny}px`);
    el.style.setProperty("--mh-meta-left", `${Number.isFinite(ml) ? ml : 4.5}%`);
    el.style.setProperty("--mh-meta-bottom", `${Number.isFinite(mb) ? mb : 8}%`);
    el.style.setProperty("--mh-meta-scale", String(ms));
    el.style.setProperty("--mh-meta-nudge-x", `${mnx}px`);
    el.style.setProperty("--mh-meta-nudge-y", `${mny}px`);
  }
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

export function getBlueMirrorHudLayoutState() {
  return loadState();
}

export function initMirrorHudLayoutFromStorage() {
  applyMirrorHudLayoutToDom(loadState());
}

export function mountBlueMirrorHudLayoutPanel() {
  if (!shouldShowMirrorHudLayoutPanel()) return null;

  const state = loadState();
  applyMirrorHudLayoutToDom(state);

  const root = document.createElement("aside");
  root.className = "layout-panel mirror-hud-layout-panel";
  root.innerHTML = `
    <div class="layout-panel__header">
      <strong>镜面叠层 · 图标位置与大小</strong>
      <span class="layout-panel__hint">?mirrorHud=1</span>
      <button type="button" class="layout-panel__collapse" aria-label="收起">−</button>
    </div>
    <div class="layout-panel__body" data-mmh-body></div>
  `;
  document.body.appendChild(root);

  const body = root.querySelector("[data-mmh-body]");
  const collapse = root.querySelector(".layout-panel__collapse");
  collapse.addEventListener("click", () => {
    root.classList.toggle("layout-panel--collapsed");
    collapse.textContent = root.classList.contains("layout-panel--collapsed") ? "+" : "−";
  });

  const persist = () => {
    saveState(state);
    applyMirrorHudLayoutToDom(state);
  };

  const hudRows = (idx) => {
    const p = `m${idx}`;
    return [
      { path: `${p}.railRightPct`, label: "图标列距右缘 %", min: 0, max: 55, step: 0.2 },
      { path: `${p}.railBottomPct`, label: "图标列距底 %", min: 0, max: 70, step: 0.2 },
      { path: `${p}.railScale`, label: "图标列整体缩放", min: 0.08, max: 6, step: 0.02 },
      { path: `${p}.railNudgeXPx`, label: "图标列左右微调 px", min: -300, max: 300, step: 1 },
      { path: `${p}.railNudgeYPx`, label: "图标列上下微调 px", min: -300, max: 300, step: 1 },
      { path: `${p}.metaLeftPct`, label: "文案区距左 %", min: 0, max: 70, step: 0.2 },
      { path: `${p}.metaBottomPct`, label: "文案区距底 %", min: 0, max: 75, step: 0.2 },
      { path: `${p}.metaScale`, label: "文案区整体缩放", min: 0.08, max: 6, step: 0.02 },
      { path: `${p}.metaNudgeXPx`, label: "文案区左右微调 px", min: -400, max: 400, step: 1 },
      { path: `${p}.metaNudgeYPx`, label: "文案区上下微调 px", min: -400, max: 400, step: 1 },
    ];
  };

  for (let i = 0; i < 5; i++) {
    addFieldset(body, state, MIRROR_LEGENDS[i], hudRows(i), persist);
  }

  const actions = document.createElement("div");
  actions.className = "layout-panel__actions";
  actions.innerHTML = `
    <button type="button" data-mmh="export">复制 JSON</button>
    <button type="button" data-mmh="reset">恢复默认</button>
    <button type="button" data-mmh="clear">清除存档</button>
  `;
  body.appendChild(actions);

  const help = document.createElement("p");
  help.className = "layout-panel__help";
  help.innerHTML = [
    "<strong>怎么用</strong>：地址栏加 <code>?mirrorHud=1</code> 后刷新；建议同时 <code>?blueVoid=1</code> 调镜位。",
    "<strong>标题栏</strong>可拖动面板，<strong>右下角</strong>拖动手柄可缩放；位置与大小会记在浏览器本地。",
    "<strong>图标列</strong>：右侧爱心/评论等；<strong>railScale</strong> 一次放大整列（含头像与唱片）。",
    "<strong>文案区</strong>：左下角用户名与说明文案；<strong>metaScale</strong> 控制字号与区域整体比例。",
    "调好后点<strong>复制 JSON</strong>，粘到 <code>blueMirrorHudLayoutPanel.js</code> 的 <code>BLUE_MIRROR_HUD_LAYOUT_DEFAULTS</code>。",
  ].join("<br/>");
  body.appendChild(help);

  actions.querySelector('[data-mmh="export"]').addEventListener("click", async () => {
    const json = JSON.stringify(state, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      window.alert("已复制当前镜面叠层 JSON。");
    } catch {
      console.log(json);
      window.alert("复制失败，已打印到控制台。");
    }
  });

  actions.querySelector('[data-mmh="reset"]').addEventListener("click", () => {
    const next = structuredClone(BLUE_MIRROR_HUD_LAYOUT_DEFAULTS);
    saveState(next);
    applyMirrorHudLayoutToDom(next);
    root.remove();
    mountBlueMirrorHudLayoutPanel();
  });

  actions.querySelector('[data-mmh="clear"]').addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    applyMirrorHudLayoutToDom(structuredClone(BLUE_MIRROR_HUD_LAYOUT_DEFAULTS));
    root.remove();
    mountBlueMirrorHudLayoutPanel();
  });

  attachLayoutPanelDragResize(root, "mirrorHud");

  return { state, root };
}
