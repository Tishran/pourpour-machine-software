import { useLayoutEffect, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { acts, brewAt, brewProgress, keyframe, story } from "../data/story";
gsap.registerPlugin(ScrollTrigger);
export function useStory(root: RefObject<HTMLElement | null>) {
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
    let last = -1;
    const panels = [...el.querySelectorAll<HTMLElement>(".act-panel")];
    const update = () => {
      const s = story.stage;
      const index = Math.min(6, Math.floor(s + 0.22));
      if (last !== index) {
        last = index;
        setActive(index);
      }
      story.light = keyframe([0, 1, 1, 0.94, 0, 0.15, 1], reduced ? index : s);
      el.style.setProperty("--light", String(story.light));
      el.style.setProperty("--progress", String(s / 6));
      const bg = [23, 24, 21].map((v, i) =>
        Math.round(v + ([242, 237, 227][i] - v) * story.light),
      );
      const fg = [242, 237, 227].map((v, i) =>
        Math.round(v + ([23, 24, 21][i] - v) * story.light),
      );
      el.style.setProperty("--bg", `rgb(${bg.join(",")})`);
      el.style.setProperty("--fg", `rgb(${fg.join(",")})`);
      panels.forEach((panel, i) => {
        const visible = i === index,
          d = s - i;
        const opacity = reduced
          ? Number(visible)
          : Math.max(0, Math.min(1, (d + 0.22) / 0.18, (0.82 - d) / 0.18));
        panel.style.opacity = String(
          i === 0 && s < 0.1
            ? 1
            : i === 6
              ? Math.min(1, Math.max(0, (s - 5.78) / 0.18))
              : opacity,
        );
        panel.style.visibility = visible ? "visible" : "hidden";
        panel.style.transform = reduced
          ? "none"
          : `translate3d(0,${Math.max(-15, Math.min(15, -d * 16))}px,0)`;
        panel.inert = !visible;
        panel.setAttribute("aria-hidden", String(!visible));
      });
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
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".story",
            start: "top top",
            end: "bottom bottom",
            scrub: reduced ? true : 0.65,
            invalidateOnRefresh: true,
          },
          onUpdate: update,
        })
        .fromTo(story, { stage: 0 }, { stage: 6, duration: 6, ease: "none" });
    }, el);
    update();
    return () => ctx.revert();
  }, [root, reduced]);
  return { active, reduced };
}
export function goToAct(index: number) {
  document
    .getElementById(acts[index].id)
    ?.scrollIntoView({ behavior: story.reduced ? "instant" : "smooth" });
}
