/**
 * 黄门（doorId 3，label yellow）后：全屏黄色背景；
 * 双击显现验证模板；再单击九格填入同一人像。
 */
import {
  applyYellowPortraitLayoutToDom,
  getYellowPortraitLayoutState,
  shouldShowYellowPortraitLayoutPanel,
} from "./yellowDoorPortraitLayoutPanel.js";
const BODY_CLASS = "doors-ui--yellow-scene";
const OPEN_CLASS = "yellow-door-scene--open";
const EXIT_VISIBLE_CLASS = "yellow-door-scene-exit--visible";
const VERIFY_STACK_VISIBLE_CLASS = "yellow-door-scene__verify-stack--visible";
const GRID_VISIBLE_CLASS = "yellow-door-scene__grid--visible";

import { publicUrl } from "./publicUrl.js";

const BACKGROUND_URL_FALLBACK = publicUrl("yellow_door_scene/background.png");
const VERIFY_URL_FALLBACK = publicUrl("yellow_door_scene/验证模板.png");
const PORTRAIT_URL_FALLBACK = publicUrl("yellow_door_scene/人像.png");

const yellowAssetModules = import.meta.glob("../assets/yellow_door_scene/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

function findYellowAssetUrl(filename) {
  const n = filename.toLowerCase();
  const hit = Object.keys(yellowAssetModules).find((key) =>
    key.replaceAll("\\", "/").toLowerCase().endsWith(`/${n}`)
  );
  return hit ? yellowAssetModules[hit] : null;
}

function resolveBackgroundUrl() {
  const named = findYellowAssetUrl("background.png");
  if (named) return named;
  const hit = Object.keys(yellowAssetModules).find((k) => {
    const base = k.replaceAll("\\", "/").split("/").pop()?.toLowerCase() ?? "";
    return base.includes("background");
  });
  return hit ? yellowAssetModules[hit] : BACKGROUND_URL_FALLBACK;
}

function resolveVerifyTemplateUrl() {
  const named = findYellowAssetUrl("验证模板.png");
  if (named) return named;
  const hit = Object.keys(yellowAssetModules).find((k) => {
    const base = k.replaceAll("\\", "/").split("/").pop()?.toLowerCase() ?? "";
    return base.includes("验证") || base.includes("verify");
  });
  return hit ? yellowAssetModules[hit] : VERIFY_URL_FALLBACK;
}

function resolvePortraitUrl() {
  const named = findYellowAssetUrl("人像.png");
  if (named) return named;
  const hit = Object.keys(yellowAssetModules).find((k) => {
    const base = k.replaceAll("\\", "/").split("/").pop()?.toLowerCase() ?? "";
    return base.includes("人像") || base === "人像.png";
  });
  return hit ? yellowAssetModules[hit] : PORTRAIT_URL_FALLBACK;
}

const BACKGROUND_URL = resolveBackgroundUrl();
const VERIFY_TEMPLATE_URL = resolveVerifyTemplateUrl();
const PORTRAIT_URL = resolvePortraitUrl();

let mounted = false;
let rootEl = null;
let exitBtn = null;
let stageEl = null;
let verifyStackEl = null;
let verifyImgEl = null;
let gridEl = null;
let portraitImgEls = [];
let verifyVisible = false;
let portraitsVisible = false;
let dblClickBound = false;
let clickBound = false;

function getCanvas() {
  return document.querySelector("#app");
}

function isOpen() {
  return Boolean(rootEl?.classList.contains(OPEN_CLASS));
}

function setVerifyVisible(visible) {
  verifyVisible = visible;
  if (!verifyStackEl || !verifyImgEl) return;
  verifyStackEl.classList.toggle(VERIFY_STACK_VISIBLE_CLASS, visible);
  verifyStackEl.hidden = !visible;
  verifyImgEl.hidden = !visible;
  if (!visible) {
    setPortraitsVisible(false);
  } else if (shouldShowYellowPortraitLayoutPanel()) {
    setPortraitsVisible(true);
  }
}

function setPortraitsVisible(visible) {
  portraitsVisible = visible;
  if (!gridEl) return;
  gridEl.classList.toggle(GRID_VISIBLE_CLASS, visible);
  gridEl.hidden = !visible;
  gridEl.setAttribute("aria-hidden", visible ? "false" : "true");
  if (visible) {
    refreshDomRefs();
    assignPortraitSources();
    applyYellowPortraitLayoutToDom(getYellowPortraitLayoutState());
  }
}

function applyBgSrc() {
  if (!stageEl) return;
  const u = BACKGROUND_URL.replace(/\\/g, "/");
  stageEl.style.backgroundImage = `url("${u}")`;
}

function assignVerifySrc() {
  if (!verifyImgEl) return;
  verifyImgEl.src = VERIFY_TEMPLATE_URL.replace(/\\/g, "/");
}

function assignPortraitSources() {
  const u = PORTRAIT_URL.replace(/\\/g, "/");
  for (const img of portraitImgEls) {
    img.src = u;
  }
}

function resetInteractionState() {
  setVerifyVisible(false);
  setPortraitsVisible(false);
}

function onStageDblClick(e) {
  if (!isOpen()) return;
  if (!stageEl?.contains(e.target)) return;
  if (e.target.closest(".yellow-door-scene-exit")) return;
  e.preventDefault();
  try {
    window.getSelection()?.removeAllRanges();
  } catch {
    /* ignore */
  }
  if (verifyVisible) return;
  setVerifyVisible(true);
}

function onStageClick(e) {
  if (!isOpen()) return;
  if (!stageEl?.contains(e.target)) return;
  if (e.target.closest(".yellow-door-scene-exit")) return;
  if (portraitsVisible) return;
  if (!verifyVisible) return;
  e.preventDefault();
  setPortraitsVisible(true);
}

function hide() {
  rootEl?.classList.remove(OPEN_CLASS);
  exitBtn?.classList.remove(EXIT_VISIBLE_CLASS);
  resetInteractionState();
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

function refreshDomRefs() {
  rootEl = document.getElementById("yellow-door-scene-root");
  exitBtn = document.getElementById("yellow-door-scene-exit");
  stageEl = rootEl?.querySelector(".yellow-door-scene__stage") ?? null;
  verifyStackEl = rootEl?.querySelector(".yellow-door-scene__verify-stack") ?? null;
  verifyImgEl = rootEl?.querySelector(".yellow-door-scene__verify") ?? null;
  gridEl = rootEl?.querySelector(".yellow-door-scene__grid") ?? null;
  portraitImgEls = Array.from(rootEl?.querySelectorAll(".yellow-door-scene__portrait") ?? []);
}

export function mountYellowDoorScene() {
  if (mounted) return;
  refreshDomRefs();
  if (!rootEl || !exitBtn || !stageEl || !verifyStackEl || !verifyImgEl || !gridEl) {
    console.warn("[yellowDoorScene] 缺少 DOM", {
      rootEl: Boolean(rootEl),
      exitBtn: Boolean(exitBtn),
      stageEl: Boolean(stageEl),
      verifyStackEl: Boolean(verifyStackEl),
      verifyImgEl: Boolean(verifyImgEl),
      gridEl: Boolean(gridEl),
      portraitCount: portraitImgEls.length,
    });
    return;
  }

  rootEl.classList.remove(OPEN_CLASS);
  exitBtn.classList.remove(EXIT_VISIBLE_CLASS);
  rootEl.hidden = true;
  exitBtn.hidden = true;
  applyBgSrc();
  assignVerifySrc();
  assignPortraitSources();
  applyYellowPortraitLayoutToDom(getYellowPortraitLayoutState());
  resetInteractionState();

  exitBtn.addEventListener("click", onExitActivate, true);
  exitBtn.addEventListener("pointerup", onExitActivate, true);
  window.addEventListener("keydown", onKeydown, true);

  if (!dblClickBound) {
    stageEl.addEventListener("dblclick", onStageDblClick);
    dblClickBound = true;
  }
  if (!clickBound) {
    stageEl.addEventListener("click", onStageClick);
    clickBound = true;
  }

  mounted = true;
}

export function showYellowDoorScene() {
  if (!mounted) {
    mountYellowDoorScene();
  }
  refreshDomRefs();
  if (!rootEl || !exitBtn || !stageEl || !verifyStackEl || !verifyImgEl || !gridEl) return;

  applyBgSrc();
  assignVerifySrc();
  assignPortraitSources();
  applyYellowPortraitLayoutToDom(getYellowPortraitLayoutState());
  resetInteractionState();

  rootEl.hidden = false;
  rootEl.classList.add(OPEN_CLASS);
  rootEl.setAttribute("aria-hidden", "false");
  exitBtn.hidden = false;
  exitBtn.classList.add(EXIT_VISIBLE_CLASS);
  document.body.classList.add(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) canvas.style.pointerEvents = "none";
}
