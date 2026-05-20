/**
 * 门交互与漂浮的全局可调参数（?layout=1 面板会读写此对象）
 */
export const doorMotion = {
  /**
   * 漂浮幅度：相对「该门深度处」相机可见垂直范围的比例（0.02 ≈ 屏高 2%）。
   * 若用固定世界单位，在相机很远时几乎看不出动。
   */
  floatAmplitude: 0.02,
  /** 漂浮角频率（与 time 相乘，越大越快） */
  floatFrequency: 0.95,
  /** 悬停时相对基础缩放的倍数 */
  hoverScaleMul: 1.1,
  /** 缩放趋近目标的速度（越大越快，约 6～14） */
  hoverLerpSpeed: 10,
};
