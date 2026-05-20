import { formatTikTokCount } from "./blueMirrorTikTokConfig.js";

const ICONS = {
  heart: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 41.5S4 28.5 4 16.5C4 10 8.5 6 14 6c3.2 0 6.2 1.5 8 4 1.8-2.5 4.8-4 8-4 5.5 0 10 4 10 10.5 0 12-20 25-20 25z"/></svg>`,
  comment: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 8h32v24H18l-10 8V8z"/></svg>`,
  bookmark: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 6h24v36l-12-8-12 8V6z"/></svg>`,
  share: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M36 8l8 8-8 8v-6H22v-4h14V8zM12 20h14v4H12v10H8V20h4z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
};

function showToast(message) {
  let el = document.getElementById("bdv-tiktok-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "bdv-tiktok-toast";
    el.className = "bdv-tiktok-toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("bdv-tiktok-toast--visible");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => {
    el.classList.remove("bdv-tiktok-toast--visible");
  }, 1600);
}

/** object-fit:contain 后镜图在视口中的实际矩形（非 img 元素盒） */
function getPosterImageRect(poster) {
  if (!(poster instanceof HTMLImageElement)) return null;
  const rect = poster.getBoundingClientRect();
  const nw = poster.naturalWidth;
  const nh = poster.naturalHeight;
  if (!nw || !nh) return null;
  const boxRatio = rect.width / rect.height;
  const imageRatio = nw / nh;
  let rw;
  let rh;
  let rx;
  let ry;
  if (imageRatio > boxRatio) {
    rw = rect.width;
    rh = rect.width / imageRatio;
    rx = rect.left;
    ry = rect.top + (rect.height - rh) / 2;
  } else {
    rh = rect.height;
    rw = rect.height * imageRatio;
    rx = rect.left + (rect.width - rw) / 2;
    ry = rect.top;
  }
  return { left: rx, top: ry, width: rw, height: rh };
}

/** 将可点击层缩到真实镜图区域，避免镜框留白误触点赞 */
export function syncPosterHitArea(poster, hitEl) {
  if (!(poster instanceof HTMLImageElement) || !hitEl) return;
  const media = poster.closest(".mirror-hud__media");
  if (!media) return;
  const img = getPosterImageRect(poster);
  if (!img) {
    hitEl.style.pointerEvents = "none";
    hitEl.style.width = "0";
    hitEl.style.height = "0";
    return;
  }
  const mediaRect = media.getBoundingClientRect();
  hitEl.style.pointerEvents = "auto";
  hitEl.style.left = `${img.left - mediaRect.left}px`;
  hitEl.style.top = `${img.top - mediaRect.top}px`;
  hitEl.style.width = `${img.width}px`;
  hitEl.style.height = `${img.height}px`;
}

export function syncAllMirrorPosterHitAreas() {
  document
    .querySelectorAll("#blue-door-void-root .blue-door-void__mirror--visible [data-tk-poster]")
    .forEach((poster) => {
      const hit = poster
        .closest("[data-mirror-hud]")
        ?.querySelector("[data-tk-poster-hit]");
      syncPosterHitArea(poster, hit);
    });
}

function spawnFloatingHearts(container, clientX, clientY) {
  const rect = container.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement("span");
    heart.className = "mirror-hud__float-heart";
    heart.textContent = "❤";
    heart.style.left = `${x + (Math.random() - 0.5) * 36}px`;
    heart.style.top = `${y}px`;
    heart.style.setProperty("--tk-drift", `${(Math.random() - 0.5) * 48}px`);
    heart.style.animationDelay = `${i * 0.06}s`;
    container.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove(), { once: true });
  }
}

function flashButton(btn) {
  btn.classList.remove("mirror-hud__action--flash");
  void btn.offsetWidth;
  btn.classList.add("mirror-hud__action--flash");
  window.setTimeout(() => btn.classList.remove("mirror-hud__action--flash"), 320);
}

/** 无手机外框：控件直接叠在镜面素材上 */
function buildMirrorHudHtml(config) {
  const { username, dateLabel, caption, likes, comments, saves } = config;
  return `
    <div class="mirror-hud" data-mirror-hud>
      <div class="mirror-hud__media" data-tk-media>
        <img class="mirror-hud__poster" data-tk-poster alt="" decoding="async" />
        <div
          class="mirror-hud__poster-hit"
          data-tk-poster-hit
          role="button"
          tabindex="0"
          aria-label="镜面内容，快速点两下点赞"
        ></div>
        <div class="mirror-hud__hearts" aria-hidden="true"></div>
      </div>
      <aside class="mirror-hud__rail">
        <div class="mirror-hud__avatar-wrap">
          <div class="mirror-hud__avatar"></div>
          <button type="button" class="mirror-hud__follow" data-tk-follow aria-label="关注">${ICONS.plus}</button>
        </div>
        <button type="button" class="mirror-hud__action" data-tk-like aria-label="点赞">
          <span class="mirror-hud__icon mirror-hud__icon--heart">${ICONS.heart}</span>
          <span class="mirror-hud__count" data-tk-like-count>${formatTikTokCount(likes)}</span>
        </button>
        <button type="button" class="mirror-hud__action" data-tk-comment aria-label="评论">
          <span class="mirror-hud__icon">${ICONS.comment}</span>
          <span class="mirror-hud__count">${formatTikTokCount(comments)}</span>
        </button>
        <button type="button" class="mirror-hud__action" data-tk-save aria-label="收藏">
          <span class="mirror-hud__icon mirror-hud__icon--bookmark">${ICONS.bookmark}</span>
          <span class="mirror-hud__count" data-tk-save-count>${formatTikTokCount(saves)}</span>
        </button>
        <button type="button" class="mirror-hud__action" data-tk-share aria-label="分享">
          <span class="mirror-hud__icon mirror-hud__icon--share">${ICONS.share}</span>
          <span class="mirror-hud__count">分享</span>
        </button>
        <div class="mirror-hud__disc" aria-hidden="true">
          <div class="mirror-hud__disc-inner"></div>
        </div>
      </aside>
      <div class="mirror-hud__meta">
        <p class="mirror-hud__user">${username} · ${dateLabel}</p>
        <p class="mirror-hud__caption">${caption}</p>
      </div>
    </div>
  `;
}

function bindMirrorHudInteractions(hudEl, config) {
  const state = {
    liked: false,
    followed: false,
    saved: false,
    likeCount: Number(config.likes) || 0,
    saveCount: Number(config.saves) || 0,
  };

  const likeBtn = hudEl.querySelector("[data-tk-like]");
  const likeCountEl = hudEl.querySelector("[data-tk-like-count]");
  const saveBtn = hudEl.querySelector("[data-tk-save]");
  const saveCountEl = hudEl.querySelector("[data-tk-save-count]");
  const followBtn = hudEl.querySelector("[data-tk-follow]");
  const posterEl = hudEl.querySelector("[data-tk-poster]");
  const posterHitEl = hudEl.querySelector("[data-tk-poster-hit]");
  const heartsEl = hudEl.querySelector(".mirror-hud__hearts");

  const setLikeUi = () => {
    likeBtn?.classList.toggle("mirror-hud__action--liked", state.liked);
    if (likeCountEl) likeCountEl.textContent = formatTikTokCount(state.likeCount);
  };

  const setSaveUi = () => {
    saveBtn?.classList.toggle("mirror-hud__action--saved", state.saved);
    if (saveCountEl) saveCountEl.textContent = formatTikTokCount(state.saveCount);
    saveBtn?.setAttribute("aria-label", state.saved ? "已收藏" : "收藏");
  };

  const triggerLike = (pop = true) => {
    if (!state.liked) {
      state.liked = true;
      state.likeCount += 1;
      setLikeUi();
      if (pop && likeBtn) {
        likeBtn.classList.remove("mirror-hud__action--pop");
        void likeBtn.offsetWidth;
        likeBtn.classList.add("mirror-hud__action--pop");
      }
    }
  };

  likeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.liked) {
      state.liked = false;
      state.likeCount = Math.max(0, state.likeCount - 1);
    } else {
      state.liked = true;
      state.likeCount += 1;
      likeBtn.classList.remove("mirror-hud__action--pop");
      void likeBtn.offsetWidth;
      likeBtn.classList.add("mirror-hud__action--pop");
    }
    setLikeUi();
  });

  hudEl.querySelector("[data-tk-comment]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    flashButton(e.currentTarget);
    showToast("评论功能仅为展示");
  });
  saveBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.saved) {
      state.saved = false;
      state.saveCount = Math.max(0, state.saveCount - 1);
    } else {
      state.saved = true;
      state.saveCount += 1;
    }
    saveBtn.classList.remove("mirror-hud__action--pop");
    void saveBtn.offsetWidth;
    saveBtn.classList.add("mirror-hud__action--pop");
    setSaveUi();
  });
  hudEl.querySelector("[data-tk-share]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    flashButton(e.currentTarget);
    showToast("分享功能仅为展示");
  });

  followBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.followed = !state.followed;
    followBtn.classList.toggle("mirror-hud__follow--done", state.followed);
    followBtn.setAttribute("aria-label", state.followed ? "已关注" : "关注");
  });

  const syncHit = () => syncPosterHitArea(posterEl, posterHitEl);
  posterEl?.addEventListener("load", syncHit);
  if (posterEl?.complete) syncHit();
  hudEl._syncPosterHit = syncHit;

  let lastTapMs = 0;
  posterHitEl?.addEventListener("click", (e) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapMs < 320) {
      e.preventDefault();
      if (heartsEl) {
        spawnFloatingHearts(heartsEl, e.clientX, e.clientY);
      }
      triggerLike(true);
      lastTapMs = 0;
      return;
    }
    lastTapMs = now;
  });

  posterHitEl?.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  hudEl._mirrorHudReset = () => {
    state.liked = false;
    state.followed = false;
    state.saved = false;
    state.likeCount = Number(config.likes) || 0;
    state.saveCount = Number(config.saves) || 0;
    setLikeUi();
    setSaveUi();
    followBtn?.classList.remove("mirror-hud__follow--done");
    followBtn?.setAttribute("aria-label", "关注");
    hudEl.querySelector(".mirror-hud__hearts")?.replaceChildren();
  };

  return hudEl;
}

export function isMirrorHudInteractiveTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("[data-tk-poster-hit]") || target.closest(".mirror-hud__rail")
  );
}

/** 按屏幕坐标判断是否在已显示镜子的可交互区域（镜图热区 / 图标列） */
export function isPointOnMirrorHudInteraction(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!(el instanceof Element)) return false;
  if (!el.closest(".blue-door-void__mirror--visible")) return false;
  return isMirrorHudInteractiveTarget(el);
}

/**
 * 在镜面内挂载叠层 UI（无手机框，与镜面一体）。
 */
export function mountMirrorHudInMirror(mirrorEl, config, posterUrl) {
  const plate = mirrorEl.querySelector(".blue-door-void__mirror-plate");
  if (!plate) return null;

  plate.innerHTML = buildMirrorHudHtml(config);
  const hud = plate.querySelector("[data-mirror-hud]");
  if (!hud) return null;

  const poster = hud.querySelector(".mirror-hud__poster");
  if (poster && posterUrl) poster.src = posterUrl;

  bindMirrorHudInteractions(hud, config);
  hud._syncPosterHit?.();
  mirrorEl._mirrorHud = hud;
  return hud;
}

export function resetMirrorHudInMirror(mirrorEl) {
  mirrorEl._mirrorHud?._mirrorHudReset?.();
}
