/**
 * 粉门空间线框几何（background.png 1672×941）。
 * 左/右墙为四边形 ABCD（A 靠观众外角，B/C 靠中墙内角），贴图 UV 用双线性插值求屏上位置与透视。
 */

export const PINK_ROOM_WIREFRAME = {
  backWallLeftPct: 23.44,
  backWallRightPct: 76.56,
  backWallTopPct: 22.21,
  backWallBottomPct: 77.79,
  vanishingXPct: 50,
  vanishingYPct: 50,
};

const BW = PINK_ROOM_WIREFRAME;

/** @typedef {{ x: number, y: number }} Pt */

/** 左墙：A 外上 → B 内上 → C 内下 → D 外下 */
export const LEFT_WALL_QUAD = /** @type {[Pt, Pt, Pt, Pt]} */ ([
  { x: 0, y: 0 },
  { x: BW.backWallLeftPct, y: BW.backWallTopPct },
  { x: BW.backWallLeftPct, y: BW.backWallBottomPct },
  { x: 0, y: 100 },
]);

/** 右墙：A 外上 → B 内上 → C 内下 → D 外下 */
export const RIGHT_WALL_QUAD = /** @type {[Pt, Pt, Pt, Pt]} */ ([
  { x: 100, y: 0 },
  { x: BW.backWallRightPct, y: BW.backWallTopPct },
  { x: BW.backWallRightPct, y: BW.backWallBottomPct },
  { x: 100, y: 100 },
]);

/**
 * @param {[Pt, Pt, Pt, Pt]} quad
 * @param {number} u 0=外缘（观众侧） 1=内缘（中墙缝）
 * @param {number} v 0=上 1=下
 */
export function bilinearWall(quad, u, v) {
  const [A, B, C, D] = quad;
  return {
    x: (1 - u) * (1 - v) * A.x + u * (1 - v) * B.x + u * v * C.x + (1 - u) * v * D.x,
    y: (1 - u) * (1 - v) * A.y + u * (1 - v) * B.y + u * v * C.y + (1 - u) * v * D.y,
  };
}

/**
 * 在墙四边形上放置轴对齐 UV 矩形贴图，返回屏空间位姿。
 * @param {[Pt, Pt, Pt, Pt]} quad
 * @param {number} rotYSign 左墙 +1，右墙 -1
 */
export function poseOnSideWall(quad, u, v, halfU, halfV, rotYSign) {
  const tl = bilinearWall(quad, u - halfU, v - halfV);
  const tr = bilinearWall(quad, u + halfU, v - halfV);
  const br = bilinearWall(quad, u + halfU, v + halfV);
  const bl = bilinearWall(quad, u - halfU, v + halfV);

  const xs = [tl.x, tr.x, br.x, bl.x];
  const ys = [tl.y, tr.y, br.y, bl.y];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const wPct = maxX - minX;
  const hPct = maxY - minY;

  const topDx = tr.x - tl.x;
  const topDy = tr.y - tl.y;
  const botDx = br.x - bl.x;
  const botDy = br.y - bl.y;
  const topLen = Math.hypot(topDx, topDy) || 0.001;
  const botLen = Math.hypot(botDx, botDy) || 0.001;

  /** 顶/底边相对水平线的倾角 → rotateX，贴合天地线 */
  const topSlant = Math.atan2(topDy, topDx) * (180 / Math.PI);
  const botSlant = Math.atan2(botDy, botDx) * (180 / Math.PI);
  const rotXDeg = ((topSlant + botSlant) / 2) * 0.38;

  /** 内缘 u→1 透视更强；由墙深宽比估算 rotateY */
  const innerness = u;
  const rotYDeg = rotYSign * (48.5 + innerness * 13.5);

  const originXPct = rotYSign > 0 ? 100 : 0;
  const translateZPx = rotYSign > 0 ? (1 - u) * 32 - 8 : (1 - u) * 32 - 8;

  return {
    cxPct: cx,
    cyPct: cy,
    wPct,
    hPct,
    rotXDeg,
    rotYDeg,
    rotZDeg: 0,
    translateZPx,
    scale: 1,
    originXPct,
    originYPct: 50,
    zIndex: u > 0.55 ? 4 : 6,
  };
}

/** 正墙五列中心（fraction 为墙宽 0~1） */
export function backWallColumnCenter(fraction) {
  const w = BW.backWallRightPct - BW.backWallLeftPct;
  return BW.backWallLeftPct + w * fraction;
}

const BACK_CY = (BW.backWallTopPct + BW.backWallBottomPct) / 2;
const BACK_H = BW.backWallBottomPct - BW.backWallTopPct;

/**
 * @param {number} fraction 0~1 沿正墙宽度
 * @param {boolean} isCenter 正中主图略大
 */
export function poseOnBackWall(fraction, isCenter = false) {
  return {
    cxPct: backWallColumnCenter(fraction),
    cyPct: BACK_CY,
    wPct: isCenter ? 11.2 : 8.8,
    hPct: isCenter ? BACK_H * 0.56 : BACK_H * 0.5,
    rotXDeg: 0,
    rotYDeg: 0,
    rotZDeg: 0,
    translateZPx: isCenter ? 1 : 0,
    scale: 1,
    originXPct: 50,
    originYPct: 50,
    zIndex: isCenter ? 8 : 5,
  };
}

/** 由几何生成九张贴图默认位姿 */
export function buildPinkPosterLayoutFromGeometry() {
  return {
    scene: {
      perspectivePx: 1420,
      perspectiveOriginXPct: BW.vanishingXPct,
      perspectiveOriginYPct: BW.vanishingYPct,
    },
    posters: {
      /* 左墙 ×2：2 靠角（u 大），1 靠观众（u 小） */
      "2": poseOnSideWall(LEFT_WALL_QUAD, 0.86, 0.38, 0.14, 0.175, 1),
      "1": poseOnSideWall(LEFT_WALL_QUAD, 0.24, 0.6, 0.17, 0.21, 1),
      /* 正墙 ×5 */
      "4": poseOnBackWall(0.1),
      "3": poseOnBackWall(0.3),
      "8": poseOnBackWall(0.5, true),
      "6": poseOnBackWall(0.7),
      "5": poseOnBackWall(0.9),
      /* 右墙 ×2 */
      "7": poseOnSideWall(RIGHT_WALL_QUAD, 0.86, 0.38, 0.14, 0.175, -1),
      "9": poseOnSideWall(RIGHT_WALL_QUAD, 0.24, 0.6, 0.17, 0.21, -1),
    },
  };
}
