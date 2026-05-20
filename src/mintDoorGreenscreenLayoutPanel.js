/**
 * 薄荷绿门后四素材构图调试：位移、缩放、旋转、透视景深、锚点与层叠等。
 * 地址栏加 ?mintScene=1 显示面板；调节写入 localStorage，「复制 JSON」可粘贴到本文件 MINT_GREENSCREEN_LAYOUT_DEFAULTS。
 */

import { attachLayoutPanelDragResize } from "./layoutPanelDragResize.js";

const QUERY_KEY = "mintScene";
export const STORAGE_KEY = "doors_mint_greenscreen_layout_v1";

const LAYER_LEGENDS = [
  "素材 1（左）· 1.png",
  "素材 2 · 2.png",
  "素材 3 · 3.png",
  "素材 4（右）· 4.png",
];

function layerSlotSelector(index) {
  return `#mint-door-greenscreen-root .mint-door-greenscreen__slot[data-mint-layer-index="${index}"]`;
}

/**
 * 默认构图：由面板调节后固化的正式版（首访与「恢复默认」以此为基准）。
 */
export const MINT_GREENSCREEN_LAYOUT_DEFAULTS = {
  scene: {
    /** 越小透视越强 */
    perspectivePx: 1400,
    perspectiveOriginXPct: 50,
    perspectiveOriginYPct: 50,
    layersGapPx: 10,
    layersPaddingPx: 26,
  },
  l0: {
    nudgeXPx: -1,
    nudgeYPx: -98,
    widthPct: 100,
    scale: 1.61,
    rotXDeg: 0,
    rotYDeg: 0,
    rotZDeg: 13,
    translateZ: 0,
    skewXDeg: 0,
    skewYDeg: 0,
    originXPct: 50,
    originYPct: 50,
    zIndex: 2,
    opacity: 1,
  },
  l1: {
    nudgeXPx: -12,
    nudgeYPx: 106,
    widthPct: 100,
    scale: 1.62,
    rotXDeg: 0,
    rotYDeg: 0,
    rotZDeg: 1,
    translateZ: 0,
    skewXDeg: 0,
    skewYDeg: 0,
    originXPct: 50,
    originYPct: 50,
    zIndex: 3,
    opacity: 1,
  },
  l2: {
    nudgeXPx: 49,
    nudgeYPx: 202,
    widthPct: 100,
    scale: 1.23,
    rotXDeg: 0,
    rotYDeg: 0,
    rotZDeg: -11,
    translateZ: 0,
    skewXDeg: 0,
    skewYDeg: 0,
    originXPct: 50,
    originYPct: 50,
    zIndex: 4,
    opacity: 1,
  },
  l3: {
    nudgeXPx: 33,
    nudgeYPx: -112,
    widthPct: 100,
    scale: 1.93,
    rotXDeg: 2.5,
    rotYDeg: -1.5,
    rotZDeg: -27.5,
    translateZ: 0,
    skewXDeg: 1,
    skewYDeg: 0,
    originXPct: 50,
    originYPct: 50,
    zIndex: 5,
    opacity: 1,
  },
};

export function shouldShowMintGreenscreenLayoutPanel() {
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
    if (!raw) return structuredClone(MINT_GREENSCREEN_LAYOUT_DEFAULTS);
    const parsed = JSON.parse(raw);
    return deepMerge(MINT_GREENSCREEN_LAYOUT_DEFAULTS, parsed);
  } catch {
    return structuredClone(MINT_GREENSCREEN_LAYOUT_DEFAULTS);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getMintGreenscreenLayoutState() {
  return loadState();
}

export function applyMintGreenscreenLayoutToDom(state) {
  const layersEl = document.querySelector("#mint-door-greenscreen-root .mint-door-greenscreen__layers");
  if (!layersEl || !state?.scene) return;

  const sc = state.scene;
  const px = Number(sc.perspectivePx) || 1400;
  const ox = Number(sc.perspectiveOriginXPct);
  const oy = Number(sc.perspectiveOriginYPct);
  layersEl.style.perspective = `${Math.max(200, px)}px`;
  layersEl.style.perspectiveOrigin = `${Number.isFinite(ox) ? ox : 50}% ${Number.isFinite(oy) ? oy : 50}%`;

  const gap = Number(sc.layersGapPx);
  const pad = Number(sc.layersPaddingPx);
  layersEl.style.gap = `${Number.isFinite(gap) ? Math.max(0, gap) : 10}px`;
  layersEl.style.padding = `${Number.isFinite(pad) ? Math.max(0, pad) : 26}px`;

  for (let i = 0; i < 4; i++) {
    const L = state[`l${i}`];
    const slot = document.querySelector(layerSlotSelector(i));
    if (!L || !slot) continue;

    const wrap = slot.querySelector(".mint-door-greenscreen__layer-transform");
    if (!wrap) continue;

    const nx = Number(L.nudgeXPx) || 0;
    const ny = Number(L.nudgeYPx) || 0;
    const w = Number(L.widthPct);
    const scale = Number(L.scale) > 0 ? Number(L.scale) : 1;
    const rx = Number(L.rotXDeg) || 0;
    const ry = Number(L.rotYDeg) || 0;
    const rz = Number(L.rotZDeg) || 0;
    const tz = Number(L.translateZ) || 0;
    const skx = Number(L.skewXDeg) || 0;
    const sky = Number(L.skewYDeg) || 0;
    const oxp = Number(L.originXPct);
    const oyp = Number(L.originYPct);
    const z = Number(L.zIndex);
    const op = Number(L.opacity);

    wrap.style.width = `${Number.isFinite(w) ? Math.min(220, Math.max(18, w)) : 100}%`;
    wrap.style.transformOrigin = `${Number.isFinite(oxp) ? Math.min(100, Math.max(0, oxp)) : 50}% ${
      Number.isFinite(oyp) ? Math.min(100, Math.max(0, oyp)) : 50
    }%`;
    wrap.style.transform = [
      `rotateX(${rx}deg)`,
      `rotateY(${ry}deg)`,
      `rotateZ(${rz}deg)`,
      `skewX(${skx}deg)`,
      `skewY(${sky}deg)`,
      `translateZ(${tz}px)`,
      `scale(${scale})`,
      `translate(${nx}px, ${ny}px)`,
    ].join(" ");

    slot.style.zIndex = String(Number.isFinite(z) ? Math.round(z) : 2 + i);
    slot.style.setProperty(
      "--mint-layout-opacity",
      String(
        Number.isFinite(op) ? Math.min(1, Math.max(0.05, op)) : 1
      )
    );
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

/** 无面板时也应用本机存档 */
export function initMintGreenscreenLayoutFromStorage() {
  applyMintGreenscreenLayoutToDom(loadState());
}

export function mountMintDoorGreenscreenLayoutPanel() {
  if (!shouldShowMintGreenscreenLayoutPanel()) return null;

  const state = loadState();
  applyMintGreenscreenLayoutToDom(state);

  const root = document.createElement("aside");
  root.className = "layout-panel mint-greenscreen-layout-panel";
  root.innerHTML = `
    <div class="layout-panel__header">
      <strong>薄荷绿门后 · 四素材排布</strong>
      <span class="layout-panel__hint">?mintScene=1</span>
      <button type="button" class="layout-panel__collapse" aria-label="收起">−</button>
    </div>
    <div class="layout-panel__body" data-mint-layout-body></div>
  `;
  document.body.appendChild(root);

  const body = root.querySelector("[data-mint-layout-body]");
  const collapse = root.querySelector(".layout-panel__collapse");
  collapse.addEventListener("click", () => {
    root.classList.toggle("layout-panel--collapsed");
    collapse.textContent = root.classList.contains("layout-panel--collapsed") ? "+" : "−";
  });

  const persist = () => {
    saveState(state);
    applyMintGreenscreenLayoutToDom(state);
  };

  addFieldset(
    body,
    state,
    "① 整体透视与安全边距",
    [
      { path: "scene.perspectivePx", label: "透视距离 px（小=更强透视）", min: 480, max: 4000, step: 10 },
      { path: "scene.perspectiveOriginXPct", label: "消失点 水平 %", min: 0, max: 100, step: 0.5 },
      { path: "scene.perspectiveOriginYPct", label: "消失点 垂直 %", min: 0, max: 100, step: 0.5 },
      { path: "scene.layersGapPx", label: "列间距 px", min: 0, max: 48, step: 1 },
      { path: "scene.layersPaddingPx", label: "四周边距 px", min: 0, max: 80, step: 1 },
    ],
    persist
  );

  const layerRows = (idx) => {
    const p = `l${idx}`;
    return [
      { path: `${p}.nudgeXPx`, label: "左右平移 px（列内）", min: -220, max: 220, step: 1 },
      { path: `${p}.nudgeYPx`, label: "上下平移 px", min: -220, max: 220, step: 1 },
      { path: `${p}.widthPct`, label: "列内宽度 %", min: 28, max: 160, step: 1 },
      { path: `${p}.scale`, label: "统一缩放", min: 0.25, max: 2.6, step: 0.01 },
      { path: `${p}.rotXDeg`, label: "俯仰 rotateX °（远/近边）", min: -48, max: 48, step: 0.5 },
      { path: `${p}.rotYDeg`, label: "左右朝向 rotateY °", min: -60, max: 60, step: 0.5 },
      { path: `${p}.rotZDeg`, label: "平面旋转 rotateZ °", min: -45, max: 45, step: 0.5 },
      { path: `${p}.translateZ`, label: "景深 translateZ px（正=靠近镜头）", min: -240, max: 280, step: 2 },
      { path: `${p}.skewXDeg`, label: "水平错切 skewX °", min: -22, max: 22, step: 0.5 },
      { path: `${p}.skewYDeg`, label: "垂直错切 skewY °", min: -22, max: 22, step: 0.5 },
      { path: `${p}.originXPct`, label: "变换锚点 X %", min: 0, max: 100, step: 0.5 },
      { path: `${p}.originYPct`, label: "变换锚点 Y %", min: 0, max: 100, step: 0.5 },
      { path: `${p}.zIndex`, label: "层叠 z（大压小，跨列遮挡时）", min: 1, max: 40, step: 1 },
      { path: `${p}.opacity`, label: "不透明度", min: 0.08, max: 1, step: 0.02 },
    ];
  };

  for (let i = 0; i < 4; i++) {
    addFieldset(body, state, `② ${LAYER_LEGENDS[i]}`, layerRows(i), persist);
  }

  const actions = document.createElement("div");
  actions.className = "layout-panel__actions";
  actions.innerHTML = `
    <button type="button" data-mint-layout="export">复制 JSON</button>
    <button type="button" data-mint-layout="reset">恢复默认</button>
    <button type="button" data-mint-layout="clear">清除存档</button>
  `;
  body.appendChild(actions);

  const help = document.createElement("p");
  help.className = "layout-panel__help";
  help.innerHTML = [
    "<strong>怎么用</strong>：加 <code>?mintScene=1</code> 打开本面板，再<strong>双击薄荷绿门</strong>进入绿幕；在画面上<strong>双击</strong>依次显现四张素材，便于对齐调试。",
    "<strong>透视</strong>：调小「透视距离」边缘发散更明显；配合各素材 <strong>rotateY / translateZ</strong> 可做弧形台面或纵深。",
    "<strong>锚点 %</strong>：旋转与缩放围绕的点，改锚点可纠正「转正」时的漂移。",
    "<strong>层叠 z</strong>：跨列重叠时提高一侧素材的 z。满意后<strong>复制 JSON</strong> 粘贴到本文件 <code>MINT_GREENSCREEN_LAYOUT_DEFAULTS</code>。",
  ].join("<br/>");
  body.appendChild(help);

  actions.querySelector('[data-mint-layout="export"]').addEventListener("click", async () => {
    const json = JSON.stringify(state, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      window.alert("已复制当前构图 JSON。");
    } catch {
      console.log(json);
      window.alert("复制失败，已打印到控制台。");
    }
  });

  actions.querySelector('[data-mint-layout="reset"]').addEventListener("click", () => {
    const next = structuredClone(MINT_GREENSCREEN_LAYOUT_DEFAULTS);
    saveState(next);
    applyMintGreenscreenLayoutToDom(next);
    root.remove();
    mountMintDoorGreenscreenLayoutPanel();
  });

  actions.querySelector('[data-mint-layout="clear"]').addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    applyMintGreenscreenLayoutToDom(structuredClone(MINT_GREENSCREEN_LAYOUT_DEFAULTS));
    root.remove();
    mountMintDoorGreenscreenLayoutPanel();
  });

  attachLayoutPanelDragResize(root, "mintGreenscreen");

  return { state, root };
}
