/**
 * 粉门后九张贴图 · 一点透视贴合 background.png。
 * 正墙 5（4·3·8·6·5，8 正中）｜左墙 2（2、1）｜右墙 2（7、9）。
 */
import { PINK_ROOM_WIREFRAME } from "./pinkDoorRoomGeometry.js";

export { PINK_ROOM_WIREFRAME };

/** 面板调定后固化的正式构图（?pinkScene=1 → 复制 JSON） */
export const PINK_POSTER_LAYOUT_DEFAULTS = {
  scene: {
    perspectivePx: 1420,
    perspectiveOriginXPct: 50,
    perspectiveOriginYPct: 50,
  },
  posters: {
    "1": {
      cxPct: 8.1,
      cyPct: 50.4,
      wPct: 10.4,
      hPct: 33.8,
      rotXDeg: 0.5,
      rotYDeg: 63.5,
      rotZDeg: 0,
      translateZPx: -14,
      scale: 1.09,
      originXPct: 100,
      originYPct: 100,
      zIndex: 1,
    },
    "2": {
      cxPct: 18,
      cyPct: 49.8,
      wPct: 6.5632,
      hPct: 25.7,
      rotXDeg: -0.5,
      rotYDeg: 54.5,
      rotZDeg: 0,
      translateZPx: -3.52,
      scale: 1.08,
      originXPct: 100,
      originYPct: 50,
      zIndex: 4,
    },
    "3": {
      cxPct: 39.376,
      cyPct: 50,
      wPct: 8.8,
      hPct: 27.79,
      rotXDeg: 0,
      rotYDeg: 0,
      rotZDeg: 0,
      translateZPx: 0,
      scale: 1,
      originXPct: 50,
      originYPct: 50,
      zIndex: 5,
    },
    "4": {
      cxPct: 28.752,
      cyPct: 50,
      wPct: 8.8,
      hPct: 27.79,
      rotXDeg: 0,
      rotYDeg: 0,
      rotZDeg: 0,
      translateZPx: 0,
      scale: 1,
      originXPct: 50,
      originYPct: 50,
      zIndex: 5,
    },
    "5": {
      cxPct: 71.248,
      cyPct: 50,
      wPct: 8.8,
      hPct: 27.79,
      rotXDeg: 0,
      rotYDeg: 0,
      rotZDeg: 0,
      translateZPx: 0,
      scale: 1,
      originXPct: 50,
      originYPct: 50,
      zIndex: 5,
    },
    "6": {
      cxPct: 60.624,
      cyPct: 50,
      wPct: 8.8,
      hPct: 27.79,
      rotXDeg: 0,
      rotYDeg: 0,
      rotZDeg: 0,
      translateZPx: 0,
      scale: 1,
      originXPct: 50,
      originYPct: 50,
      zIndex: 5,
    },
    "7": {
      cxPct: 82.7,
      cyPct: 49.8,
      wPct: 5.7,
      hPct: 24.6,
      rotXDeg: -4.4188,
      rotYDeg: -65,
      rotZDeg: -3,
      translateZPx: -3.52,
      scale: 1.14,
      originXPct: 0,
      originYPct: 50,
      zIndex: 4,
    },
    "8": {
      cxPct: 50,
      cyPct: 50,
      wPct: 11.2,
      hPct: 31.1248,
      rotXDeg: 0,
      rotYDeg: 0,
      rotZDeg: 0,
      translateZPx: 1,
      scale: 1,
      originXPct: 50,
      originYPct: 50,
      zIndex: 8,
    },
    "9": {
      cxPct: 90.1,
      cyPct: 47.3,
      wPct: 7.9696,
      hPct: 40.6941,
      rotXDeg: 3.5,
      rotYDeg: -73,
      rotZDeg: 1.5,
      translateZPx: 16.32,
      scale: 1.39,
      originXPct: 0,
      originYPct: 22.5,
      zIndex: 6,
    },
  },
};

/**
 * @param {typeof PINK_POSTER_LAYOUT_DEFAULTS} state
 */
export function applyPinkPosterLayoutToDom(state) {
  const roomEl = document.querySelector("#pink-door-scene-root .pink-door-scene__room");
  if (!roomEl || !state?.scene) return;

  const sc = state.scene;
  const px = Math.max(320, Number(sc.perspectivePx) || 1420);
  const ox = Number(sc.perspectiveOriginXPct);
  const oy = Number(sc.perspectiveOriginYPct);
  roomEl.style.setProperty("--pink-room-perspective", `${px}px`);
  roomEl.style.perspective = `${px}px`;
  roomEl.style.perspectiveOrigin = `${Number.isFinite(ox) ? ox : 50}% ${
    Number.isFinite(oy) ? oy : 50
  }%`;

  const posters = state.posters ?? {};
  for (const [id, pose] of Object.entries(posters)) {
    const slot = roomEl.querySelector(`[data-poster-id="${id}"]`);
    if (!slot || !pose) continue;

    const wrap = slot.querySelector(".pink-door-scene__poster-transform");
    if (!wrap) continue;

    const cx = Number(pose.cxPct) || 50;
    const cy = Number(pose.cyPct) || 50;
    const w = Math.max(4, Number(pose.wPct) || 10);
    const h = Math.max(4, Number(pose.hPct) || 10);
    const rx = Number(pose.rotXDeg) || 0;
    const ry = Number(pose.rotYDeg) || 0;
    const rz = Number(pose.rotZDeg) || 0;
    const tz = Number(pose.translateZPx) || 0;
    const scale = Number(pose.scale) > 0 ? Number(pose.scale) : 1;
    const oxp = Number(pose.originXPct);
    const oyp = Number(pose.originYPct);
    const z = Number(pose.zIndex);

    slot.style.left = `${cx - w / 2}%`;
    slot.style.top = `${cy - h / 2}%`;
    slot.style.width = `${w}%`;
    slot.style.height = `${h}%`;
    slot.style.zIndex = String(Number.isFinite(z) ? Math.round(z) : 4);

    wrap.style.transformOrigin = `${Number.isFinite(oxp) ? oxp : 50}% ${
      Number.isFinite(oyp) ? oyp : 50
    }%`;
    wrap.style.transform = [
      `translateZ(${tz}px)`,
      `rotateX(${rx}deg)`,
      `rotateY(${ry}deg)`,
      `rotateZ(${rz}deg)`,
      `scale(${scale})`,
    ].join(" ");
  }
}
