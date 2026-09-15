import { useEffect } from "react";

// Keyboard input shares the native scroll position and the scene's master
// timeline. Holding an arrow runs at a steady speed, independent of OS repeat.
export function useArrowScroll() {
  useEffect(() => {
    let direction = 0;
    let frame = 0;
    let previous = 0;
    const stop = () => {
      direction = 0;
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const tick = (time: number) => {
      const elapsed = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      window.scrollBy({ top: direction * 720 * elapsed, behavior: "instant" });
      if (direction) frame = requestAnimationFrame(tick);
    };
    const keydown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const target = event.target;
      if (
        document.querySelector("dialog[open]") ||
        (target instanceof Element &&
          target.closest(
            "input, textarea, select, button, [contenteditable]:not([contenteditable=false]), [role=slider], [role=listbox]",
          ))
      )
        return;
      event.preventDefault();
      if (event.repeat) return;
      stop();
      direction = event.key === "ArrowDown" ? 1 : -1;
      window.scrollBy({ top: direction * 64, behavior: "instant" });
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const keyup = (event: KeyboardEvent) => {
      if (
        (event.key === "ArrowDown" && direction === 1) ||
        (event.key === "ArrowUp" && direction === -1)
      )
        stop();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", stop);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("pointerdown", stop);
    return () => {
      stop();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", stop);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("pointerdown", stop);
    };
  }, []);
}
