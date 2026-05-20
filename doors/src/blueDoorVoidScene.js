/**
 * 蓝门（doorId 8）后：黑虚空 → 点击镜外虚空依次显现五面镜；镜内为 TikTok 式交互区。
 */
import {
  applyBlueVoidLayoutToDom,
  getBlueVoidLayoutState,
} from "./blueDoorVoidLayoutPanel.js";
import { MIRROR_TIKTOK_CONFIG } from "./blueMirrorTikTokConfig.js";
import {
  isPointOnMirrorHudInteraction,
  mountMirrorHudInMirror,
  resetMirrorHudInMirror,
  syncAllMirrorPosterHitAreas,
} from "./blueMirrorTikTokUi.js";
import { applyMirrorHudLayoutToDom, getBlueMirrorHudLayoutState } from "./blueMirrorHudLayoutPanel.js";

const BODY_CLASS = "doors-ui--blue-void";
const OPEN_CLASS = "blue-door-void--open";
const EXIT_VISIBLE_CLASS = "blue-door-void-exit--visible";
const MIRROR_VISIBLE_CLASS = "blue-door-void__mirror--visible";

const stageTextureModules = import.meta.glob("../assets/blue_void_scene/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

function findAssetUrlByNeedle(needle) {
  const n = needle.toLowerCase();
  const hit = Object.keys(stageTextureModules).find((key) =>
    key.replaceAll("\\", "/").toLowerCase().includes(n)
  );
  return hit ? stageTextureModules[hit] : null;
}

function resolveContentUrl(stageNeedle) {
  const n = stageNeedle.toLowerCase();
  return (
    findAssetUrlByNeedle(n) ||
    findAssetUrlByNeedle(n.replace("stage ", "stage_")) ||
    findAssetUrlByNeedle(n.replace("stage ", "stage")) ||
    `/blue_void_scene/${n.replace(/\s+/g, "")}.png`
  );
}

let mounted = false;
let rootEl = null;
let exitBtn = null;
let mirrorEls = [];
let visibleMirrorCount = 0;
let mirrorHudMounted = false;

function getCanvas() {
  return document.querySelector("#app");
}

function isOpen() {
  return Boolean(rootEl?.classList.contains(OPEN_CLASS));
}

function ensureMirrorHuds() {
  if (mirrorHudMounted) return;
  mirrorEls.forEach((mirrorEl, i) => {
    const config = MIRROR_TIKTOK_CONFIG[i];
    if (!config) return;
    mountMirrorHudInMirror(mirrorEl, config, resolveContentUrl(config.stageNeedle));
  });
  mirrorHudMounted = true;
}

function setVisibleMirrorCount(n) {
  visibleMirrorCount = Math.max(0, Math.min(5, n));
  mirrorEls.forEach((el, i) => {
    el.classList.toggle(MIRROR_VISIBLE_CLASS, i < visibleMirrorCount);
  });
  requestAnimationFrame(() => syncAllMirrorPosterHitAreas());
}

function onRevealClick(e) {
  if (!isOpen() || visibleMirrorCount >= 5) return;
  if (e.target.closest(".blue-door-void-exit")) return;
  if (e.target.closest(".layout-panel")) return;
  if (isPointOnMirrorHudInteraction(e.clientX, e.clientY)) return;
  if (e.target.closest(".blue-door-void__mirror:not(.blue-door-void__mirror--visible)")) {
    return;
  }
  setVisibleMirrorCount(visibleMirrorCount + 1);
}

function bindRevealClick() {
  if (!rootEl || rootEl.dataset.bdvRevealBound === "1") return;
  rootEl.addEventListener("click", onRevealClick, false);
  rootEl.dataset.bdvRevealBound = "1";
}

function hide() {
  rootEl?.classList.remove(OPEN_CLASS);
  exitBtn?.classList.remove(EXIT_VISIBLE_CLASS);
  mirrorEls.forEach(resetMirrorHudInMirror);
  setVisibleMirrorCount(0);
  if (rootEl) {
    rootEl.hidden = true;
    rootEl.setAttribute("aria-hidden", "true");
  }
  if (exitBtn) {
    exitBtn.hidden = true;
  }
  document.body.classList.remove(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) {
    canvas.style.pointerEvents = "";
    canvas.style.visibility = "";
  }
  document.querySelector("#scene-fade")?.classList.remove("scene-fade--visible");
  document.getElementById("bdv-tiktok-toast")?.classList.remove("bdv-tiktok-toast--visible");
}

function onExitActivate(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!isOpen()) return;
  hide();
}

function onKeydown(e) {
  if (e.key === "Escape" && isOpen()) {
    e.preventDefault();
    hide();
  }
}

export function mountBlueDoorVoidScene() {
  if (mounted) return;
  rootEl = document.getElementById("blue-door-void-root");
  exitBtn = document.getElementById("blue-door-void-exit");
  if (!rootEl || !exitBtn) {
    console.warn("[blueDoorVoidScene] 缺少 DOM", {
      rootEl: Boolean(rootEl),
      exitBtn: Boolean(exitBtn),
    });
    return;
  }

  mirrorEls = Array.from(rootEl.querySelectorAll("[data-blue-mirror-index]")).sort(
    (a, b) => Number(a.dataset.blueMirrorIndex) - Number(b.dataset.blueMirrorIndex)
  );

  rootEl.classList.remove(OPEN_CLASS);
  exitBtn.classList.remove(EXIT_VISIBLE_CLASS);
  rootEl.hidden = true;
  exitBtn.hidden = true;
  setVisibleMirrorCount(0);
  ensureMirrorHuds();

  bindRevealClick();
  exitBtn.addEventListener("click", onExitActivate, true);
  exitBtn.addEventListener("pointerup", onExitActivate, true);
  window.addEventListener("keydown", onKeydown, true);
  mounted = true;
}

export function showBlueDoorVoidScene() {
  if (!mounted) {
    mountBlueDoorVoidScene();
  }
  if (!rootEl) rootEl = document.getElementById("blue-door-void-root");
  if (!exitBtn) exitBtn = document.getElementById("blue-door-void-exit");
  if (!rootEl || !exitBtn) return;

  mirrorEls = Array.from(rootEl.querySelectorAll("[data-blue-mirror-index]")).sort(
    (a, b) => Number(a.dataset.blueMirrorIndex) - Number(b.dataset.blueMirrorIndex)
  );
  ensureMirrorHuds();
  mirrorEls.forEach(resetMirrorHudInMirror);

  rootEl.hidden = false;
  rootEl.classList.add(OPEN_CLASS);
  rootEl.setAttribute("aria-hidden", "false");
  exitBtn.hidden = false;
  exitBtn.classList.add(EXIT_VISIBLE_CLASS);
  setVisibleMirrorCount(0);
  bindRevealClick();
  applyBlueVoidLayoutToDom(getBlueVoidLayoutState());
  applyMirrorHudLayoutToDom(getBlueMirrorHudLayoutState());
  document.body.classList.add(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) canvas.style.pointerEvents = "none";
}
