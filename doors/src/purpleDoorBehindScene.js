/**
 * 紫门（doorId 7）后：开窗帘 → 单击亮紫屏 → 七步走过 → 人消失 → 七影再现 → 关窗帘。
 */
const BODY_CLASS = "doors-ui--purple-scene";
const OPEN_CLASS = "purple-door-scene--open";
const EXIT_VISIBLE_CLASS = "purple-door-scene-exit--visible";

import purpleBackgroundUrl from "../assets/purple_door_scene/background.png?url";
import curtainHalfUrl from "../assets/purple_door_scene/curtain_half.png?url";
import curtainFullUrl from "../assets/purple_door_scene/curtain_full.png?url";
import screenBgPurpleUrl from "../assets/purple_door_scene/screen_bg_purple.png?url";
import curtainMatteUrl from "../assets/purple_door_scene/curtain_matte.png?url";
import model1Url from "../assets/purple_door_scene/model_1.png?url";
import model2Url from "../assets/purple_door_scene/model_2.png?url";
import heelsSoundUrl from "../assets/purple_door_scene/heels.wav?url";
import {
  applyPurpleModelEnterStart,
  applyPurpleModelLayoutToDom,
  clearPurpleModelLayoutPreview,
  clearPurpleModelWalkGhosts,
  getPurpleModelLayoutState,
  mountPurpleModelWalkGhosts,
  WALK_FRAME_PATTERN,
  WALK_STEP_COUNT,
} from "./purpleDoorModelLayoutPanel.js";

const BACKGROUND_URL = purpleBackgroundUrl;
const CURTAIN_HALF_URL = curtainHalfUrl;
const CURTAIN_FULL_URL = curtainFullUrl;
/** 屏幕亮起后窗内背景（源 assets_紫门后场景/背景_紫） */
const SCREEN_BG_PURPLE_URL = screenBgPurpleUrl;
const CURTAIN_MATTE_URL = curtainMatteUrl;
const MODEL_1_URL = model1Url;
const MODEL_2_URL = model2Url;
const HEELS_SOUND_URL = heelsSoundUrl;

const HINT_CURTAIN = "· 双击尝试打开窗帘。";
const HINT_LIGHT_SCREEN = "· 单击点亮屏幕。";

let curtainState = 0;
let curtainTransitionLocked = false;
let screenLit = false;
/** 0 未起步；1–7 为当前站位（只增不减） */
let walkStep = 0;
let walkAnimating = false;
/** 走完七步后：0 待命 → 1 人已消失 → 2 七影再现 */
let epiloguePhase = 0;

let mounted = false;
let rootEl = null;
let exitBtn = null;
let stageEl = null;
let bgImgEl = null;
let curtainHalfEl = null;
let curtainFullEl = null;
let screenBgEl = null;
let curtainMatteEl = null;
let hintEl = null;
let modelZoneEl = null;
let modelTrackEl = null;
let modelAEl = null;
let modelBEl = null;
let dblClickBound = false;
let clickBound = false;
let heelsWalkAudio = null;

function ensureHeelsWalkAudio() {
  if (!heelsWalkAudio) {
    heelsWalkAudio = new Audio(HEELS_SOUND_URL);
    heelsWalkAudio.preload = "auto";
    heelsWalkAudio.volume = 0.82;
  }
  return heelsWalkAudio;
}

function stopHeelsWalkSound() {
  try {
    heelsWalkAudio?.pause();
    if (heelsWalkAudio) heelsWalkAudio.currentTime = 0;
  } catch {
    /* ignore */
  }
}

/** 模特出场（第一步）时从头播放高跟鞋走路音效 */
function startHeelsWalkSound() {
  try {
    const audio = ensureHeelsWalkAudio();
    audio.loop = false;
    audio.currentTime = 0;
    void audio.play();
  } catch {
    /* ignore */
  }
}

export function getPurpleDoorWalkStep() {
  return walkStep;
}

function getCanvas() {
  return document.querySelector("#app");
}

function isOpen() {
  return Boolean(rootEl?.classList.contains(OPEN_CLASS));
}

function normalizeUrl(url) {
  return url.replace(/\\/g, "/");
}

function waitForImageReady(img) {
  if (!img) return Promise.resolve();
  if (img.complete && img.naturalWidth > 0) {
    return typeof img.decode === "function"
      ? img.decode().catch(() => undefined)
      : Promise.resolve();
  }
  return new Promise((resolve) => {
    const done = () => {
      const afterLoad =
        typeof img.decode === "function"
          ? img.decode().catch(() => undefined)
          : Promise.resolve();
      afterLoad.finally(resolve);
    };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", resolve, { once: true });
  });
}

async function ensureCurtainImagesReady() {
  await Promise.all([
    waitForImageReady(curtainHalfEl),
    waitForImageReady(curtainFullEl),
    waitForImageReady(screenBgEl),
    waitForImageReady(curtainMatteEl),
  ]);
}

async function ensureModelImagesReady() {
  await Promise.all([waitForImageReady(modelAEl), waitForImageReady(modelBEl)]);
}

function applyLayerSources() {
  if (bgImgEl) bgImgEl.src = normalizeUrl(BACKGROUND_URL);
  if (curtainHalfEl) curtainHalfEl.src = normalizeUrl(CURTAIN_HALF_URL);
  if (curtainFullEl) curtainFullEl.src = normalizeUrl(CURTAIN_FULL_URL);
  if (screenBgEl) screenBgEl.src = normalizeUrl(SCREEN_BG_PURPLE_URL);
  if (curtainMatteEl) curtainMatteEl.src = normalizeUrl(CURTAIN_MATTE_URL);
  if (modelAEl) modelAEl.src = normalizeUrl(MODEL_1_URL);
  if (modelBEl) modelBEl.src = normalizeUrl(MODEL_2_URL);
  void ensureCurtainImagesReady();
  void ensureModelImagesReady();
}

function syncScreenLit() {
  rootEl?.classList.toggle("purple-door-scene--screen-lit", screenLit);
  syncHint();
}

function resetScreenLit() {
  screenLit = false;
  syncScreenLit();
}

function syncHint() {
  if (!hintEl) return;
  if (curtainState < 2) {
    hintEl.textContent = HINT_CURTAIN;
    return;
  }
  if (!screenLit) {
    hintEl.textContent = HINT_LIGHT_SCREEN;
    return;
  }
  if (walkStep < WALK_STEP_COUNT) {
    hintEl.textContent = HINT_CURTAIN;
    return;
  }
  if (epiloguePhase === 0) {
    hintEl.textContent = "· 单击让人消失。";
    return;
  }
  if (epiloguePhase === 1) {
    hintEl.textContent = "· 单击再现七道人影。";
    return;
  }
  if (epiloguePhase === 2) {
    hintEl.textContent = "· 单击关上窗帘。";
    return;
  }
  hintEl.textContent = HINT_CURTAIN;
}

async function activateScreenLit() {
  if (screenLit || curtainState < 2) return false;
  await waitForImageReady(screenBgEl);
  screenLit = true;
  syncScreenLit();
  return true;
}

function syncCurtainVisual() {
  if (!rootEl) return;
  rootEl.classList.toggle("purple-door-scene--curtain-half", curtainState >= 1);
  rootEl.classList.toggle("purple-door-scene--curtain-full", curtainState >= 2);
  if (curtainState < 2) {
    resetScreenLit();
  }
  syncHint();
}

function prepareWalkingUi() {
  if (!modelZoneEl) return;
  clearPurpleModelLayoutPreview();
  modelZoneEl.classList.remove("purple-door-scene__model-zone--preview");
  modelZoneEl.classList.add("purple-door-scene__model-zone--walking");
  modelZoneEl.setAttribute("aria-hidden", "false");
}

function setActiveWalkFrame(step) {
  const frame = WALK_FRAME_PATTERN[step - 1];
  modelAEl?.classList.toggle("purple-door-scene__model--active", frame === "a");
  modelBEl?.classList.toggle("purple-door-scene__model--active", frame === "b");
}

function getWalkTransitionMs(state) {
  const dur = Number(state.walk?.transitionSec);
  const sec = Number.isFinite(dur) ? Math.min(2, Math.max(0, dur)) : 0.48;
  return Math.round(sec * 1000);
}

function waitFrames(n = 2) {
  return new Promise((resolve) => {
    let left = n;
    const tick = () => {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function syncEpilogueClasses() {
  rootEl?.classList.toggle(
    "purple-door-scene--epilogue-ready",
    screenLit && curtainState >= 2 && walkStep >= WALK_STEP_COUNT && epiloguePhase === 0
  );
}

function resetEpilogueState() {
  epiloguePhase = 0;
  rootEl?.classList.remove("purple-door-scene--models-hidden");
  rootEl?.classList.remove("purple-door-scene--epilogue-ghosts");
  clearPurpleModelWalkGhosts(modelZoneEl);
  syncEpilogueClasses();
}

function hideModelsCompletely() {
  if (!modelZoneEl) return;
  epiloguePhase = 1;
  rootEl?.classList.remove("purple-door-scene--epilogue-ghosts");
  clearPurpleModelWalkGhosts(modelZoneEl);
  rootEl?.classList.add("purple-door-scene--models-hidden");
  modelZoneEl.classList.remove("purple-door-scene__model-zone--walking");
  modelAEl?.classList.remove("purple-door-scene__model--active");
  modelBEl?.classList.remove("purple-door-scene__model--active");
  modelZoneEl.setAttribute("aria-hidden", "true");
  syncEpilogueClasses();
  syncHint();
}

async function showSevenWalkGhosts() {
  if (!modelZoneEl) return;
  await ensureModelImagesReady();
  epiloguePhase = 2;
  rootEl?.classList.remove("purple-door-scene--models-hidden");
  rootEl?.classList.add("purple-door-scene--epilogue-ghosts");
  mountPurpleModelWalkGhosts(modelZoneEl, getPurpleModelLayoutState(), {
    showLabels: false,
  });
  modelZoneEl.setAttribute("aria-hidden", "false");
  syncEpilogueClasses();
  syncHint();
}

function closeCurtainsAndReset() {
  resetEpilogueState();
  resetWalkState();
  resetScreenLit();
  setCurtainState(0);
  syncHint();
}

function syncWalkVisual() {
  if (!modelZoneEl || !modelTrackEl || !modelAEl || !modelBEl) return;

  if (epiloguePhase === 1) {
    modelZoneEl.classList.remove("purple-door-scene__model-zone--walking");
    return;
  }

  if (epiloguePhase === 2) {
    modelZoneEl.classList.remove("purple-door-scene__model-zone--walking");
    return;
  }

  const walking = screenLit && walkStep > 0;
  if (walking) {
    modelZoneEl.classList.remove("purple-door-scene__model-zone--preview");
    rootEl?.classList.remove("purple-door-scene--layout-preview");
  }

  modelZoneEl.classList.toggle("purple-door-scene__model-zone--walking", walking);
  modelZoneEl.setAttribute("aria-hidden", walking ? "false" : "true");

  if (!walking) {
    modelAEl.classList.remove("purple-door-scene__model--active");
    modelBEl.classList.remove("purple-door-scene__model--active");
    applyPurpleModelLayoutToDom(getPurpleModelLayoutState(), 0);
    return;
  }

  setActiveWalkFrame(walkStep);
  applyPurpleModelLayoutToDom(getPurpleModelLayoutState(), walkStep);
}

function setCurtainState(next) {
  curtainState = Math.max(0, Math.min(2, next));
  syncCurtainVisual();
}

function resetCurtainState() {
  curtainTransitionLocked = false;
  resetScreenLit();
  setCurtainState(0);
}

function resetWalkState() {
  walkStep = 0;
  walkAnimating = false;
  stopHeelsWalkSound();
  resetEpilogueState();
  syncWalkVisual();
}

async function advanceCurtainState() {
  if (curtainTransitionLocked || curtainState >= 2) return;

  if (curtainState === 1) {
    curtainTransitionLocked = true;
    try {
      await ensureCurtainImagesReady();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      setCurtainState(2);
    } finally {
      window.setTimeout(() => {
        curtainTransitionLocked = false;
      }, 650);
    }
    return;
  }

  setCurtainState(curtainState + 1);
}

async function advanceWalkState() {
  if (!screenLit || curtainState < 2 || walkStep >= WALK_STEP_COUNT || walkAnimating) {
    return;
  }

  await ensureModelImagesReady();
  const state = getPurpleModelLayoutState();
  const nextStep = walkStep + 1;

  if (walkStep === 0) {
    walkAnimating = true;
    walkStep = 1;
    prepareWalkingUi();
    setActiveWalkFrame(1);
    startHeelsWalkSound();

    applyPurpleModelEnterStart(state);
    if (modelTrackEl) void modelTrackEl.offsetWidth;

    await waitFrames(2);
    applyPurpleModelLayoutToDom(state, 1);

    window.setTimeout(() => {
      walkAnimating = false;
      if (walkStep >= WALK_STEP_COUNT) {
        syncEpilogueClasses();
        syncHint();
      }
    }, getWalkTransitionMs(state) + 40);
    return;
  }

  walkStep = nextStep;
  prepareWalkingUi();
  setActiveWalkFrame(walkStep);
  applyPurpleModelLayoutToDom(state, walkStep);
  if (walkStep >= WALK_STEP_COUNT) {
    syncEpilogueClasses();
    syncHint();
  }
}

function onStageClick(e) {
  if (!isOpen()) return;
  if (!stageEl?.contains(e.target)) return;
  if (e.target.closest(".purple-door-scene-exit")) return;
  if (e.target.closest(".layout-panel")) return;

  if (curtainState >= 2 && !screenLit) {
    void activateScreenLit();
    return;
  }

  if (
    screenLit &&
    curtainState >= 2 &&
    !walkAnimating &&
    walkStep >= WALK_STEP_COUNT
  ) {
    if (epiloguePhase === 0) {
      hideModelsCompletely();
      return;
    }
    if (epiloguePhase === 1) {
      void showSevenWalkGhosts();
      return;
    }
    if (epiloguePhase === 2) {
      closeCurtainsAndReset();
      return;
    }
  }

  if (!screenLit || curtainState < 2 || walkStep >= WALK_STEP_COUNT || walkAnimating) return;

  advanceWalkState();
}

function onStageDblClick(e) {
  if (!isOpen()) return;
  if (!stageEl?.contains(e.target)) return;
  if (e.target.closest(".purple-door-scene-exit")) return;
  if (e.target.closest(".layout-panel")) return;
  e.preventDefault();
  try {
    window.getSelection()?.removeAllRanges();
  } catch {
    /* ignore */
  }
  void advanceCurtainState();
}

function hide() {
  clearPurpleModelLayoutPreview();
  rootEl?.classList.remove(OPEN_CLASS);
  exitBtn?.classList.remove(EXIT_VISIBLE_CLASS);
  resetCurtainState();
  resetWalkState();
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
  rootEl = document.getElementById("purple-door-scene-root");
  exitBtn = document.getElementById("purple-door-scene-exit");
  stageEl = rootEl?.querySelector(".purple-door-scene__stage") ?? null;
  bgImgEl = rootEl?.querySelector(".purple-door-scene__bg") ?? null;
  curtainHalfEl =
    rootEl?.querySelector(".purple-door-scene__curtain--half") ?? null;
  curtainFullEl =
    rootEl?.querySelector(".purple-door-scene__curtain--full") ?? null;
  screenBgEl = rootEl?.querySelector(".purple-door-scene__screen-bg") ?? null;
  curtainMatteEl =
    rootEl?.querySelector(".purple-door-scene__curtain--matte") ?? null;
  modelZoneEl = rootEl?.querySelector(".purple-door-scene__model-zone") ?? null;
  modelTrackEl = rootEl?.querySelector(".purple-door-scene__model-track") ?? null;
  modelAEl = rootEl?.querySelector(".purple-door-scene__model--a") ?? null;
  modelBEl = rootEl?.querySelector(".purple-door-scene__model--b") ?? null;
  hintEl = rootEl?.querySelector(".purple-door-scene__hint") ?? null;
}

export function mountPurpleDoorBehindScene() {
  if (mounted) return;
  refreshDomRefs();
  if (
    !rootEl ||
    !exitBtn ||
    !stageEl ||
    !bgImgEl ||
    !curtainHalfEl ||
    !curtainFullEl ||
    !screenBgEl ||
    !curtainMatteEl ||
    !modelZoneEl ||
    !modelTrackEl ||
    !modelAEl ||
    !modelBEl
  ) {
    console.warn("[purpleDoorBehindScene] 缺少 DOM", {
      rootEl: Boolean(rootEl),
      exitBtn: Boolean(exitBtn),
      stageEl: Boolean(stageEl),
      bgImgEl: Boolean(bgImgEl),
      curtainHalfEl: Boolean(curtainHalfEl),
      curtainFullEl: Boolean(curtainFullEl),
      screenBgEl: Boolean(screenBgEl),
      curtainMatteEl: Boolean(curtainMatteEl),
      modelZoneEl: Boolean(modelZoneEl),
      modelTrackEl: Boolean(modelTrackEl),
      modelAEl: Boolean(modelAEl),
      modelBEl: Boolean(modelBEl),
    });
    return;
  }

  rootEl.classList.remove(OPEN_CLASS);
  exitBtn.classList.remove(EXIT_VISIBLE_CLASS);
  rootEl.hidden = true;
  exitBtn.hidden = true;
  applyLayerSources();
  ensureHeelsWalkAudio();
  resetCurtainState();
  resetWalkState();
  syncHint();

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

export function showPurpleDoorBehindScene() {
  if (!mounted) {
    mountPurpleDoorBehindScene();
  }
  refreshDomRefs();
  if (
    !rootEl ||
    !exitBtn ||
    !stageEl ||
    !bgImgEl ||
    !curtainHalfEl ||
    !curtainFullEl ||
    !screenBgEl ||
    !curtainMatteEl ||
    !modelZoneEl ||
    !modelTrackEl ||
    !modelAEl ||
    !modelBEl
  ) {
    return;
  }

  applyLayerSources();
  resetCurtainState();
  resetWalkState();
  applyPurpleModelLayoutToDom(getPurpleModelLayoutState(), 0);
  syncHint();

  rootEl.hidden = false;
  rootEl.classList.add(OPEN_CLASS);
  rootEl.setAttribute("aria-hidden", "false");
  exitBtn.hidden = false;
  exitBtn.classList.add(EXIT_VISIBLE_CLASS);
  document.body.classList.add(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) canvas.style.pointerEvents = "none";
}
