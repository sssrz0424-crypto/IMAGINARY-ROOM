/**
 * 黄门九宫格人像：?yellowScene=1 时点击选中，拖拽移动，拉动手柄调宽高（仅当前格）。
 */

import {
  applyYellowPortraitLayoutCell,
  shouldShowYellowPortraitLayoutPanel,
} from "./yellowDoorPortraitLayoutPanel.js";

const BODY_CLASS = "yellow-scene-direct-manip";
const SELECTED_CLASS = "yellow-door-scene__cell--selected";
const HANDLES_CLASS = "yellow-portrait-handles";

const EDGE_HANDLES = ["n", "s", "e", "w"];
const CORNER_HANDLES = ["nw", "ne", "sw", "se"];

/**
 * @param {{
 *   state: Record<string, object>,
 *   saveState: (state: Record<string, object>) => void,
 *   onSelectIndex: (index: number) => void,
 *   refreshSliders: () => void,
 * }} options
 */
export function mountYellowPortraitDirectManip(options) {
  if (!shouldShowYellowPortraitLayoutPanel()) return null;

  const { state, saveState, onSelectIndex, refreshSliders } = options;
  let selectedIndex = 0;
  let session = null;
  let mounted = false;
  const teardownFns = [];

  function selectIndex(index) {
    selectedIndex = index;
    for (let i = 0; i < 9; i++) {
      cellEl(i)?.classList.toggle(SELECTED_CLASS, i === index);
    }
    onSelectIndex(index);
  }

  function cellEl(index) {
    return document.querySelector(
      `#yellow-door-scene-root .yellow-door-scene__cell[data-yellow-portrait-index="${index}"]`
    );
  }

  function readCell(index) {
    return state[`p${index}`];
  }

  function persistActiveCell() {
    if (!session) return;
    saveState(state);
    applyYellowPortraitLayoutCell(session.index, state);
    refreshSliders();
  }

  function ensureHandles() {
    for (let i = 0; i < 9; i++) {
      const wrap = cellEl(i)?.querySelector(".yellow-door-scene__portrait-transform");
      if (!wrap || wrap.querySelector(`.${HANDLES_CLASS}`)) continue;

      const layer = document.createElement("div");
      layer.className = HANDLES_CLASS;
      layer.setAttribute("aria-hidden", "true");
      for (const id of [...CORNER_HANDLES, ...EDGE_HANDLES, "scale"]) {
        const h = document.createElement("div");
        h.className = "yellow-portrait-handle";
        h.dataset.handle = id;
        layer.appendChild(h);
      }
      wrap.appendChild(layer);
    }
  }

  function applyResizeFromHandle(id, P, dx, dy) {
    const cw = session.cellW;
    const ch = session.cellH;

    switch (id) {
      case "e":
        P.widthPct = session.widthPct + (dx / cw) * 100;
        break;
      case "w":
        P.widthPct = session.widthPct - (dx / cw) * 100;
        break;
      case "s":
        P.heightPct = session.heightPct + (dy / ch) * 100;
        break;
      case "n":
        P.heightPct = session.heightPct - (dy / ch) * 100;
        break;
      case "ne":
        P.widthPct = session.widthPct + (dx / cw) * 100;
        P.heightPct = session.heightPct - (dy / ch) * 100;
        break;
      case "nw":
        P.widthPct = session.widthPct - (dx / cw) * 100;
        P.heightPct = session.heightPct - (dy / ch) * 100;
        break;
      case "se":
        P.widthPct = session.widthPct + (dx / cw) * 100;
        P.heightPct = session.heightPct + (dy / ch) * 100;
        break;
      case "sw":
        P.widthPct = session.widthPct - (dx / cw) * 100;
        P.heightPct = session.heightPct + (dy / ch) * 100;
        break;
      case "scale": {
        const delta = (dx + dy) * 0.004;
        P.scale = session.scale + delta;
        break;
      }
      default:
        break;
    }
  }

  function onPointerMove(e) {
    if (!session || e.pointerId !== session.pid) return;
    const dx = e.clientX - session.startX;
    const dy = e.clientY - session.startY;
    const P = readCell(session.index);
    if (!P || !session.cellW || !session.cellH) return;

    const id = session.handle;

    if (id === "move") {
      P.offsetXPx = session.ox + dx;
      P.offsetYPx = session.oy + dy;
    } else {
      applyResizeFromHandle(id, P, dx, dy);
    }

    persistActiveCell();
    e.preventDefault();
  }

  function endSession(e) {
    if (!session || e.pointerId !== session.pid) return;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endSession);
    window.removeEventListener("pointercancel", endSession);
    try {
      session.target.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    session = null;
  }

  function startSession(e, index, handle) {
    const cell = cellEl(index);
    if (!cell) return;

    const P = readCell(index);
    if (!P) return;

    selectIndex(index);
    e.preventDefault();
    e.stopPropagation();

    const rect = cell.getBoundingClientRect();
    session = {
      pid: e.pointerId,
      index,
      handle,
      target: e.currentTarget,
      startX: e.clientX,
      startY: e.clientY,
      cellW: rect.width || 1,
      cellH: rect.height || 1,
      ox: Number(P.offsetXPx) || 0,
      oy: Number(P.offsetYPx) || 0,
      scale: Number(P.scale) > 0 ? Number(P.scale) : 1,
      widthPct: Number(P.widthPct) || 100,
      heightPct: Number(P.heightPct) || 100,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endSession);
    window.addEventListener("pointercancel", endSession);
  }

  function onGridPointerDown(e) {
    const grid = document.querySelector("#yellow-door-scene-root .yellow-door-scene__grid");
    if (!grid?.classList.contains("yellow-door-scene__grid--visible")) return;

    const handle = e.target.closest(".yellow-portrait-handle");
    if (handle) {
      const cell = handle.closest("[data-yellow-portrait-index]");
      if (!cell) return;
      const index = Number(cell.dataset.yellowPortraitIndex);
      if (!Number.isFinite(index)) return;
      startSession(e, index, handle.dataset.handle);
      return;
    }

    const wrap = e.target.closest(".yellow-door-scene__portrait-transform");
    const img = e.target.closest(".yellow-door-scene__portrait");
    if (!wrap && !img) {
      const cell = e.target.closest("[data-yellow-portrait-index]");
      if (cell) selectIndex(Number(cell.dataset.yellowPortraitIndex));
      return;
    }

    const cell = (wrap || img).closest("[data-yellow-portrait-index]");
    if (!cell) return;
    startSession(e, Number(cell.dataset.yellowPortraitIndex), "move");
  }

  function mount() {
    if (mounted) return;
    document.body.classList.add(BODY_CLASS);
    ensureHandles();
    selectIndex(0);

    const grid = document.querySelector("#yellow-door-scene-root .yellow-door-scene__grid");
    if (grid) {
      grid.addEventListener("pointerdown", onGridPointerDown);
      teardownFns.push(() => grid.removeEventListener("pointerdown", onGridPointerDown));
    }

    mounted = true;
  }

  function unmount() {
    if (!mounted) return;
    document.body.classList.remove(BODY_CLASS);
    for (let i = 0; i < 9; i++) {
      cellEl(i)?.classList.remove(SELECTED_CLASS);
    }
    teardownFns.forEach((fn) => fn());
    teardownFns.length = 0;
    if (session) {
      endSession({ pointerId: session.pid });
    }
    mounted = false;
  }

  mount();

  return { selectIndex, unmount };
}
