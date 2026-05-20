/**
 * 白门（doorId 2）打开后的画廊场景：分块素材网格 + 交互。
 */
const BODY_CLASS = "doors-ui--white-gallery";
const GALLERY_OPEN_CLASS = "white-door-gallery--open";
const EXIT_VISIBLE_CLASS = "white-door-gallery--exit-visible";

let mounted = false;
let rootEl = null;
let exitBtn = null;
let galleryInteractionsBound = false;
let sharedAudioCtx = null;

function getCanvas() {
  return document.querySelector("#app");
}

function isGalleryOpen() {
  return Boolean(rootEl?.classList.contains(GALLERY_OPEN_CLASS));
}

/** 机械感短音 + 中文「正在加载」 */
function playLoadingCue() {
  try {
    const ACtx = window.AudioContext || window.webkitAudioContext;
    if (ACtx) {
      if (!sharedAudioCtx) sharedAudioCtx = new ACtx();
      const ctx = sharedAudioCtx;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = "square";
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(165, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
      void ctx.resume?.();
    }
  } catch {
    /* ignore */
  }

  if (typeof window.speechSynthesis !== "undefined") {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("正在加载");
    u.lang = "zh-CN";
    u.rate = 0.88;
    u.pitch = 0.95;
    window.speechSynthesis.speak(u);
  }
}

function bindGalleryInteractions() {
  if (!rootEl || galleryInteractionsBound) return;
  const mosaic = rootEl.querySelector("#wg-mosaic");
  if (!mosaic) return;

  rootEl.querySelectorAll(".wg-screen").forEach((cell) => {
    const inner = cell.querySelector(".wg-frame-inner");
    if (!inner) return;
    cell.addEventListener(
      "mouseenter",
      () => inner.classList.add("wg-frame-inner--hover"),
      { passive: true }
    );
    cell.addEventListener(
      "mouseleave",
      () => inner.classList.remove("wg-frame-inner--hover"),
      { passive: true }
    );
    cell.addEventListener(
      "dblclick",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        playLoadingCue();
      },
      true
    );
  });

  const avatar = rootEl.querySelector(".wg-avatar");
  avatar?.addEventListener(
    "dblclick",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      mosaic.classList.add("wg-mosaic--shuffle-flash");
      window.setTimeout(() => {
        mosaic.classList.toggle("wg-mosaic--shuffled");
        mosaic.classList.remove("wg-mosaic--shuffle-flash");
      }, 220);
    },
    true
  );

  galleryInteractionsBound = true;
}

function hide() {
  rootEl?.classList.remove(GALLERY_OPEN_CLASS);
  exitBtn?.classList.remove(EXIT_VISIBLE_CLASS);
  const mosaic = rootEl?.querySelector("#wg-mosaic");
  mosaic?.classList.remove("wg-mosaic--shuffled", "wg-mosaic--shuffle-flash");
  rootEl?.querySelectorAll(".wg-frame-inner--hover").forEach((el) => {
    el.classList.remove("wg-frame-inner--hover");
  });
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
  const fade = document.querySelector("#scene-fade");
  fade?.classList.remove("scene-fade--visible");
}

function onExitActivate(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!isGalleryOpen()) return;
  hide();
}

function onKeydown(e) {
  if (e.key === "Escape" && isGalleryOpen()) {
    e.preventDefault();
    hide();
  }
}

export function mountWhiteDoorGalleryScene() {
  if (mounted) return;
  rootEl = document.getElementById("white-door-gallery-root");
  exitBtn = document.getElementById("white-door-gallery-exit");
  if (!rootEl || !exitBtn) {
    console.warn("[whiteDoorGalleryScene] 缺少 DOM：画廊根或返回按钮", {
      rootEl: Boolean(rootEl),
      exitBtn: Boolean(exitBtn),
    });
    return;
  }

  rootEl.classList.remove(GALLERY_OPEN_CLASS);
  exitBtn.classList.remove(EXIT_VISIBLE_CLASS);
  rootEl.hidden = true;
  exitBtn.hidden = true;

  bindGalleryInteractions();

  exitBtn.addEventListener("click", onExitActivate, true);
  exitBtn.addEventListener("pointerup", onExitActivate, true);
  window.addEventListener("keydown", onKeydown, true);
  mounted = true;
}

export function showWhiteDoorGalleryScene() {
  if (!mounted) {
    mountWhiteDoorGalleryScene();
  }
  if (!rootEl) rootEl = document.getElementById("white-door-gallery-root");
  if (!exitBtn) exitBtn = document.getElementById("white-door-gallery-exit");
  if (!rootEl || !exitBtn) return;

  bindGalleryInteractions();

  rootEl.hidden = false;
  rootEl.classList.add(GALLERY_OPEN_CLASS);
  rootEl.setAttribute("aria-hidden", "false");
  exitBtn.hidden = false;
  exitBtn.classList.add(EXIT_VISIBLE_CLASS);
  document.body.classList.add(BODY_CLASS);
  const canvas = getCanvas();
  if (canvas) canvas.style.pointerEvents = "none";
}
