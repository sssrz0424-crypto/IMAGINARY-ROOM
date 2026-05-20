/**
 * 橄榄绿门（doorId 1）：叠字 → 成球 → 打散坠地 → 再聚成中央大字。
 */
import {
  buildGreenVoidSphereSlots,
  GREEN_VOID_SPHERE_ORIGIN,
} from "./greenDoorVoidRoomLayout.js";
import { publicUrl } from "./publicUrl.js";

const BODY_CLASS = "doors-ui--green-void";
const OPEN_CLASS = "green-door-void--open";
const EXIT_VISIBLE_CLASS = "green-door-void-exit--visible";

const STILL_THERE_LINE = "Are you still there?";
const STILL_THERE_SOUND_URL = publicUrl("green_door_scene/are_you_still_there.mp3");
const STACK_CLICKS_BEFORE_SPHERE = 3;
const SPHERE_LINE_COUNT = 148;
const SPHERE_RADIUS = 128;
const SPHERE_GATHER_INTERVAL_MS = 38;
const SCATTER_DURATION_MS = 880;
const FALL_STAGGER_MS = 34;
const GIANT_CONVERGE_STAGGER_MS = 20;
const GIANT_CONVERGE_HOLD_MS = 1050;

const CENTER_MERGE_SLOT = {
  tx: 0,
  ty: 0,
  tz: 0,
  rx: 0,
  ry: 0,
  rz: 0,
  sx: 0.12,
  sy: 0.12,
  opacity: 0,
};
const CENTER_FADE_ANIMATION = "greenVoidPromptFade";

const SPHERE_SLOTS = buildGreenVoidSphereSlots(SPHERE_LINE_COUNT, SPHERE_RADIUS);

const greenVoidAssetModules = import.meta.glob("../assets/green_door_scene/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

function findAssetUrlByNeedle(needle) {
  const n = needle.toLowerCase();
  const hit = Object.keys(greenVoidAssetModules).find((key) =>
    key.replaceAll("\\", "/").toLowerCase().includes(n)
  );
  return hit ? greenVoidAssetModules[hit] : null;
}

const STILL_THERE_SOUND_RESOLVED =
  findAssetUrlByNeedle("are_you_still_there") ||
  findAssetUrlByNeedle("still_there") ||
  STILL_THERE_SOUND_URL;

let mounted = false;
let rootEl = null;
let exitBtn = null;
let linesEl = null;
let linesInnerEl = null;
let promptAudio = null;
let stageClickBound = false;

let clickCount = 0;
let sphereForming = false;
let sphereReady = false;
let sphereCollapsed = false;
let giantGathering = false;
let giantRevealed = false;
let sphereBuildTimer = null;
let centerLineEl = null;
let centerFadeEndHandler = null;

function getCanvas() {
  return document.querySelector("#app");
}

function isOpen() {
  return Boolean(rootEl?.classList.contains(OPEN_CLASS));
}

function slotTransform(slot) {
  const sy = slot.sy ?? 1;
  return [
    `translate3d(calc(-50% + ${slot.tx}px), calc(-50% + ${slot.ty}px), ${slot.tz}px)`,
    `rotateX(${slot.rx}deg)`,
    `rotateY(${slot.ry}deg)`,
    `rotateZ(${slot.rz}deg)`,
    `scale(${slot.sx}, ${sy})`,
  ].join(" ");
}

function applyLineSlot(lineEl, slot, { animate = true } = {}) {
  lineEl.style.transform = slotTransform(slot);
  lineEl.style.opacity = String(slot.opacity);
  lineEl.style.zIndex = String(Math.round(1200 + slot.tz));
  if (animate) {
    lineEl.classList.add("green-door-void__line--placed");
  }
}

function createLineElement() {
  const line = document.createElement("p");
  line.className = "green-door-void__line";
  line.textContent = STILL_THERE_LINE;
  return line;
}

function clearSphereBuildTimer() {
  if (sphereBuildTimer != null) {
    clearInterval(sphereBuildTimer);
    sphereBuildTimer = null;
  }
}

function detachCenterFadeListener() {
  if (centerLineEl && centerFadeEndHandler) {
    centerLineEl.removeEventListener("animationend", centerFadeEndHandler);
    centerFadeEndHandler = null;
  }
}

function removeCenterLine() {
  detachCenterFadeListener();
  centerLineEl?.remove();
  centerLineEl = null;
  linesEl?.classList.remove("green-door-void__lines--center");
}

function dismissCenterLine(immediate = false) {
  if (!centerLineEl) return;
  detachCenterFadeListener();
  const line = centerLineEl;
  centerLineEl = null;

  if (immediate) {
    line.remove();
    if (!linesInnerEl?.querySelector(".green-door-void__line")) {
      linesEl?.classList.remove("green-door-void__lines--center");
    }
    return;
  }

  line.classList.add("green-door-void__line--center-out");
  const onEnd = (e) => {
    if (e.target !== line || e.animationName !== CENTER_FADE_ANIMATION) return;
    line.removeEventListener("animationend", onEnd);
    line.remove();
    if (!linesInnerEl?.querySelector(".green-door-void__line")) {
      linesEl?.classList.remove("green-door-void__lines--center");
    }
  };
  line.addEventListener("animationend", onEnd);
}

function onCenterFadeEnd(e) {
  if (e.target !== centerLineEl || e.animationName !== CENTER_FADE_ANIMATION) return;
  detachCenterFadeListener();
  centerLineEl?.remove();
  centerLineEl = null;
  linesEl?.classList.remove("green-door-void__lines--center");
}

function showCenterLine() {
  if (!linesEl || !linesInnerEl) return;
  dismissCenterLine(true);
  linesEl.classList.add("green-door-void__lines--center");

  const line = createLineElement();
  line.classList.add("green-door-void__line--center");
  linesInnerEl.appendChild(line);
  void line.offsetWidth;
  line.classList.add("green-door-void__line--center-fade");

  centerLineEl = line;
  centerFadeEndHandler = onCenterFadeEnd;
  line.addEventListener("animationend", centerFadeEndHandler);
}

function revealTopLine(lineEl) {
  lineEl.classList.add("green-door-void__line--from-top");
  linesInnerEl?.appendChild(lineEl);
  void lineEl.offsetWidth;
  lineEl.classList.add("green-door-void__line--visible");
}

function addTopStackLine() {
  if (!linesEl || !linesInnerEl) return;
  linesEl.classList.add("green-door-void__lines--top-stack");
  revealTopLine(createLineElement());
}

function resetTextStage() {
  clearSphereBuildTimer();
  removeCenterLine();
  clickCount = 0;
  sphereForming = false;
  sphereReady = false;
  sphereCollapsed = false;
  giantGathering = false;
  giantRevealed = false;
  if (linesEl) {
    linesEl.classList.remove(
      "green-door-void__lines--center",
      "green-door-void__lines--top-stack",
      "green-door-void__lines--sphere",
      "green-door-void__lines--sphere-forming",
      "green-door-void__lines--collapse",
      "green-door-void__lines--giant-gather",
      "green-door-void__lines--giant"
    );
  }
  if (linesInnerEl) {
    linesInnerEl.innerHTML = "";
  }
}

function stopStillThereSound() {
  try {
    promptAudio?.pause();
    if (promptAudio) promptAudio.currentTime = 0;
  } catch {
    /* ignore */
  }
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

function speakStillThere() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(STILL_THERE_LINE);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  synth.speak(utterance);
}

function playStillThereSound() {
  try {
    if (!promptAudio) {
      promptAudio = new Audio(STILL_THERE_SOUND_RESOLVED);
      promptAudio.preload = "auto";
    }
    promptAudio.currentTime = 0;
    const playPromise = promptAudio.play();
    if (playPromise) {
      void playPromise.catch(() => {
        speakStillThere();
      });
    }
  } catch {
    speakStillThere();
  }
}

function finishSphereForm() {
  clearSphereBuildTimer();
  sphereForming = false;
  sphereReady = true;
  linesEl?.classList.remove("green-door-void__lines--sphere-forming");
}

function computeScatterSlot(base) {
  const burst = 1.45 + Math.random() * 1.15;
  return {
    tx: base.tx * burst + (Math.random() - 0.5) * 170,
    ty: base.ty * burst + (Math.random() - 0.5) * 150,
    tz: base.tz * 0.32 + (Math.random() - 0.5) * 90,
    rx: base.rx * 0.2 + (Math.random() - 0.5) * 24,
    ry: base.ry * 0.2 + (Math.random() - 0.5) * 24,
    rz: (Math.random() - 0.5) * 52,
    sx: base.sx * (0.88 + Math.random() * 0.28),
    sy: (base.sy ?? base.sx) * (0.88 + Math.random() * 0.28),
    opacity: Math.min(1, base.opacity * (0.92 + Math.random() * 0.12)),
  };
}

function computeFallSlot() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    tx: (Math.random() - 0.5) * vw * 0.94,
    ty: vh * 0.46 - 28 - Math.random() * 52,
    tz: 0,
    rx: 0,
    ry: 0,
    rz: (Math.random() - 0.5) * 40,
    sx: 0.72 + Math.random() * 0.22,
    sy: 0.72 + Math.random() * 0.22,
    opacity: 0.22 + Math.random() * 0.22,
  };
}

function appendSphereLine(index) {
  if (!linesInnerEl || index >= SPHERE_SLOTS.length) return false;

  const line = createLineElement();
  line.dataset.sphereIndex = String(index);
  applyLineSlot(line, GREEN_VOID_SPHERE_ORIGIN, { animate: false });
  linesInnerEl.appendChild(line);

  requestAnimationFrame(() => {
    applyLineSlot(line, SPHERE_SLOTS[index], { animate: true });
  });

  return index + 1 < SPHERE_SLOTS.length;
}

function beginSphereForm() {
  if (!linesEl || !linesInnerEl || sphereForming || sphereReady) return;

  dismissCenterLine(true);
  sphereForming = true;
  linesEl.classList.remove("green-door-void__lines--center", "green-door-void__lines--top-stack");
  linesEl.classList.add("green-door-void__lines--sphere", "green-door-void__lines--sphere-forming");
  linesInnerEl.innerHTML = "";

  let nextIndex = 0;

  sphereBuildTimer = window.setInterval(() => {
    if (!appendSphereLine(nextIndex)) {
      finishSphereForm();
      return;
    }
    nextIndex += 1;
  }, SPHERE_GATHER_INTERVAL_MS);
}

function startSphereCollapse() {
  if (!linesEl || !linesInnerEl || !sphereReady || sphereCollapsed) return;

  sphereCollapsed = true;
  sphereReady = false;
  linesEl.classList.add("green-door-void__lines--collapse");

  const lines = [...linesInnerEl.querySelectorAll(".green-door-void__line")];

  lines.forEach((line) => {
    const idx = Number(line.dataset.sphereIndex);
    const base = SPHERE_SLOTS[Number.isFinite(idx) ? idx : 0] ?? SPHERE_SLOTS[0];
    line.classList.remove("green-door-void__line--falling");
    applyLineSlot(line, computeScatterSlot(base), { animate: true });
  });

  window.setTimeout(() => {
    lines.forEach((line, i) => {
      window.setTimeout(() => {
        line.classList.add("green-door-void__line--falling");
        applyLineSlot(line, computeFallSlot(), { animate: true });
      }, (i % 15) * FALL_STAGGER_MS);
    });
  }, SCATTER_DURATION_MS);
}

function startGiantLineGather() {
  if (!linesEl || !linesInnerEl || !sphereCollapsed || giantGathering || giantRevealed) {
    return;
  }

  const lines = [...linesInnerEl.querySelectorAll(".green-door-void__line")];
  if (!lines.length) return;

  giantGathering = true;
  linesEl.classList.add("green-door-void__lines--giant-gather");

  lines.forEach((line, i) => {
    window.setTimeout(() => {
      line.classList.remove("green-door-void__line--falling");
      applyLineSlot(line, CENTER_MERGE_SLOT, { animate: true });
    }, (i % 16) * GIANT_CONVERGE_STAGGER_MS);
  });

  const waitMs =
    GIANT_CONVERGE_HOLD_MS + Math.min(lines.length, 16) * GIANT_CONVERGE_STAGGER_MS;

  window.setTimeout(() => {
    giantGathering = false;
    giantRevealed = true;
    linesInnerEl.innerHTML = "";
    linesEl.classList.remove(
      "green-door-void__lines--collapse",
      "green-door-void__lines--sphere",
      "green-door-void__lines--giant-gather"
    );
    linesEl.classList.add("green-door-void__lines--giant");

    const giant = createLineElement();
    giant.classList.add("green-door-void__line--giant");
    linesInnerEl.appendChild(giant);
    void giant.offsetWidth;
    giant.classList.add("green-door-void__line--giant-visible");
  }, waitMs);
}

function onStageClick(e) {
  if (!isOpen() || sphereForming) return;
  if (!rootEl?.contains(e.target)) return;
  if (e.target.closest(".green-door-void-exit")) return;
  if (e.target.closest(".layout-panel")) return;

  if (sphereReady) {
    playStillThereSound();
    startSphereCollapse();
    return;
  }

  if (sphereCollapsed) {
    if (!giantGathering && !giantRevealed) {
      playStillThereSound();
      startGiantLineGather();
    }
    return;
  }

  if (giantRevealed || giantGathering) return;

  clickCount += 1;
  playStillThereSound();

  if (clickCount === 1) {
    showCenterLine();
    return;
  }

  if (clickCount === 2) {
    dismissCenterLine(true);
    addTopStackLine();
    return;
  }

  if (clickCount === 3) {
    addTopStackLine();
    return;
  }

  if (clickCount === STACK_CLICKS_BEFORE_SPHERE + 1) {
    beginSphereForm();
  }
}

function hide() {
  rootEl?.classList.remove(OPEN_CLASS);
  exitBtn?.classList.remove(EXIT_VISIBLE_CLASS);
  resetTextStage();
  stopStillThereSound();
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
  rootEl = document.getElementById("green-door-void-root");
  exitBtn = document.getElementById("green-door-void-exit");
  linesEl = rootEl?.querySelector(".green-door-void__lines") ?? null;
  linesInnerEl = linesEl?.querySelector(".green-door-void__lines-inner") ?? null;
}

export function mountGreenDoorVoidScene() {
  if (mounted) return;
  refreshDomRefs();
  if (!rootEl || !exitBtn || !linesEl || !linesInnerEl) {
    console.warn("[greenDoorVoidScene] 缺少 DOM", {
      rootEl: Boolean(rootEl),
      exitBtn: Boolean(exitBtn),
      linesEl: Boolean(linesEl),
      linesInnerEl: Boolean(linesInnerEl),
    });
    return;
  }

  rootEl.classList.remove(OPEN_CLASS);
  exitBtn.classList.remove(EXIT_VISIBLE_CLASS);
  rootEl.hidden = true;
  exitBtn.hidden = true;
  resetTextStage();

  exitBtn.addEventListener("click", onExitActivate, true);
  exitBtn.addEventListener("pointerup", onExitActivate, true);
  window.addEventListener("keydown", onKeydown, true);

  if (!stageClickBound) {
    rootEl.addEventListener("click", onStageClick);
    stageClickBound = true;
  }

  mounted = true;
}

export function showGreenDoorVoidScene() {
  if (!mounted) {
    mountGreenDoorVoidScene();
  }
  refreshDomRefs();
  if (!rootEl || !exitBtn) return;

  resetTextStage();
  stopStillThereSound();

  rootEl.hidden = false;
  rootEl.classList.add(OPEN_CLASS);
  rootEl.setAttribute("aria-hidden", "false");
  exitBtn.hidden = false;
  exitBtn.classList.add(EXIT_VISIBLE_CLASS);
  document.body.classList.add(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) canvas.style.pointerEvents = "none";
}
