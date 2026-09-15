import { useLayoutEffect, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useArrowScroll } from "./useArrowScroll";
import { themeAt } from "../data/theme";
import {
  acts,
  brewAt,
  brewProgress,
  stageToScrollProgress,
  story,
} from "../data/story";
gsap.registerPlugin(ScrollTrigger);
export function useStory(root: RefObject<HTMLElement | null>) {
  useArrowScroll();
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useLayoutEffect(() => {
    story.reduced = reduced;
    const el = root.current;
    if (!el) return;
    let heights = acts.map(
      (act) => document.getElementById(act.id)!.offsetHeight,
    );
    let last = -1;
    const update = () => {
      const s = story.stage;
      const index = Math.min(acts.length - 1, Math.floor(s + 0.22));
      if (last !== index) {
        last = index;
        setActive(index);
      }
      story.light = 0;
      el.style.setProperty("--light", String(story.light));
      el.style.setProperty(
        "--progress",
        String(stageToScrollProgress(s, heights)),
      );
      const { background: bg, foreground: fg } = themeAt(story.light);
      el.style.setProperty("--bg", `rgb(${bg.join(",")})`);
      el.style.setProperty("--fg", `rgb(${fg.join(",")})`);
      // Text stays in document flow: sticky panels leave with their section,
      // so adjacent acts never crossfade or occupy the same text area.
      const brew = brewAt(brewProgress(s));
      for (const [id, text] of [
        [
          "brew-volume",
          `${Math.round(brew.volume).toString().padStart(3, "0")} / 300`,
        ],
        ["brew-flow", brew.flow.toFixed(1)],
        ["brew-phase", brew.phase],
      ]) {
        const node = document.getElementById(id);
        if (node) node.textContent = text;
      }
      const seconds = Math.round(brewProgress(s) * 166),
        timer = document.getElementById("brew-timer");
      if (timer)
        timer.textContent = `${Math.floor(seconds / 60)
          .toString()
          .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
      window.dispatchEvent(new Event("firstbrew:frame"));
    };
    let rebuild: () => void = () => {};
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".story",
          start: "top top",
          end: () => `+=${document.getElementById("launch")!.offsetTop}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
        onUpdate: update,
      });
      rebuild = () => {
        heights = acts.map(
          (act) => document.getElementById(act.id)!.offsetHeight,
        );
        timeline.clear();
        acts.slice(0, -1).forEach((act, index) => {
          timeline.fromTo(
            story,
            { stage: index },
            {
              stage: index + 1,
              duration: heights[index],
              ease: "none",
              immediateRender: index === 0,
            },
          );
        });
      };
      rebuild();
    }, el);
    ScrollTrigger.addEventListener("refreshInit", rebuild);
    let disposed = false;
    document.fonts.ready.then(() => {
      if (!disposed) ScrollTrigger.refresh();
    });
    update();
    return () => {
      disposed = true;
      ScrollTrigger.removeEventListener("refreshInit", rebuild);
      ctx.revert();
    };
  }, [root, reduced]);
  return { active, reduced };
}
export function goToAct(index: number) {
  document
    .getElementById(acts[index].id)
    ?.scrollIntoView({ behavior: story.reduced ? "instant" : "smooth" });
}
