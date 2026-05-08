/**
 * 全屏渐隐渐现，在「完全黑」时执行回调（例如 switchScene）。
 */
export function runFadeThroughBlack(onMidOpaque, fadeInMs = 480) {
  const el = document.querySelector("#scene-fade");
  if (!el) {
    onMidOpaque();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    el.classList.remove("scene-fade--visible");
  };

  el.classList.add("scene-fade--visible");

  window.setTimeout(() => {
    try {
      onMidOpaque();
    } finally {
      window.setTimeout(finish, 50);
    }
  }, fadeInMs);
}
