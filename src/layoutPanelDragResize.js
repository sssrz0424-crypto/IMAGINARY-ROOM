/**
 * 构图面板：标题栏拖动、右下角缩放（CSS resize），位置与尺寸写入 localStorage。
 * @param {HTMLElement} panelRoot aside.layout-panel
 * @param {string} panelId 稳定 id，如 mirrorHud、blueVoid
 * @returns {() => void} 可选卸载时调用以移除监听
 */
const STORAGE_PREFIX = "doors_layout_panel_ui_v1_";

export function attachLayoutPanelDragResize(panelRoot, panelId) {
  const key = `${STORAGE_PREFIX}${panelId}`;
  const header = panelRoot.querySelector(".layout-panel__header");
  if (!header) return () => {};

  function readSaved() {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveRect() {
    if (!panelRoot.classList.contains("layout-panel--floated")) return;
    const r = panelRoot.getBoundingClientRect();
    const payload = {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    };
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }

  function applySaved(s) {
    if (!s || typeof s.left !== "number" || typeof s.width !== "number") return;
    const w = Math.max(200, Math.min(s.width, window.innerWidth - 8));
    const h = Math.max(120, Math.min(s.height, window.innerHeight - 8));
    const left = Math.max(4, Math.min(s.left, window.innerWidth - w - 4));
    const top = Math.max(4, Math.min(s.top, window.innerHeight - h - 4));
    panelRoot.classList.add("layout-panel--floated");
    panelRoot.style.left = `${left}px`;
    panelRoot.style.top = `${top}px`;
    panelRoot.style.width = `${w}px`;
    panelRoot.style.height = `${h}px`;
    panelRoot.style.right = "auto";
    panelRoot.style.bottom = "auto";
    panelRoot.style.maxHeight = "none";
  }

  const saved = readSaved();
  if (saved) applySaved(saved);

  let drag = null;
  let layoutUnlocked = Boolean(saved);

  header.style.cursor = "grab";

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    let nl = drag.l + dx;
    let nt = drag.t + dy;
    const w = panelRoot.offsetWidth;
    const h = panelRoot.offsetHeight;
    nl = Math.max(4, Math.min(nl, window.innerWidth - w - 4));
    nt = Math.max(4, Math.min(nt, window.innerHeight - h - 4));
    panelRoot.style.left = `${nl}px`;
    panelRoot.style.top = `${nt}px`;
    drag.sx = e.clientX;
    drag.sy = e.clientY;
    drag.l = nl;
    drag.t = nt;
  }

  function endDrag(e) {
    if (!drag) return;
    if (e && e.pointerId !== drag.pid) return;
    drag = null;
    header.style.cursor = "grab";
    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerup", onPointerUp, true);
    window.removeEventListener("pointercancel", onPointerUp, true);
    saveRect();
  }

  function onPointerUp(e) {
    endDrag(e);
  }

  function onHeaderPointerDown(e) {
    if (drag) return;
    if (e.button !== 0) return;
    if (e.target.closest("button")) return;
    e.preventDefault();
    layoutUnlocked = true;
    const r = panelRoot.getBoundingClientRect();
    if (!panelRoot.classList.contains("layout-panel--floated")) {
      panelRoot.classList.add("layout-panel--floated");
      panelRoot.style.left = `${r.left}px`;
      panelRoot.style.top = `${r.top}px`;
      panelRoot.style.width = `${r.width}px`;
      panelRoot.style.height = `${Math.min(Math.max(r.height, 160), window.innerHeight - 16)}px`;
      panelRoot.style.right = "auto";
      panelRoot.style.bottom = "auto";
      panelRoot.style.maxHeight = "none";
    }
    drag = {
      pid: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      l: parseFloat(panelRoot.style.left) || r.left,
      t: parseFloat(panelRoot.style.top) || r.top,
    };
    header.style.cursor = "grabbing";
    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerUp, true);
  }

  header.addEventListener("pointerdown", onHeaderPointerDown);

  let roTimer = 0;
  const ro = new ResizeObserver(() => {
    if (!layoutUnlocked || !panelRoot.classList.contains("layout-panel--floated")) return;
    window.clearTimeout(roTimer);
    roTimer = window.setTimeout(saveRect, 140);
  });
  ro.observe(panelRoot);

  header.title = "拖动标题栏移动面板；右下角拖动手柄可缩放";

  return () => {
    ro.disconnect();
    header.removeEventListener("pointerdown", onHeaderPointerDown);
    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerup", onPointerUp, true);
    window.removeEventListener("pointercancel", onPointerUp, true);
  };
}
