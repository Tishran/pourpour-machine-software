import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173";
const quality = process.env.QUALITY || "";
if (quality && !["high", "medium", "low"].includes(quality))
  throw new Error("QUALITY must be high, medium or low");
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader"],
});
const results = [];
try {
  // Run sequentially: concurrent pages would invalidate the comparison.
  for (const mobile of process.env.DESKTOP_ONLY === "1"
    ? [false]
    : [false, true]) {
    const page = await browser.newPage({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1920, height: 1080 },
      deviceScaleFactor: mobile ? 2 : 1,
    });
    await page.goto(
      baseURL + "/?view=classic" + (quality ? "&quality=" + quality : ""),
    );
    await page.locator("canvas").first().waitFor();
    // Let initial compilation and the automatic quality decision settle.
    await page.waitForTimeout(quality ? 4000 : 18000);
    for (const stage of [0, 2.35, 3]) {
      await page.evaluate((stage) => {
        const sections = [...document.querySelectorAll(".act")];
        const i = Math.floor(stage);
        scrollTo({
          top: sections[i].offsetTop + sections[i].offsetHeight * (stage - i),
          behavior: "instant",
        });
      }, stage);
      await page.waitForTimeout(1500);
      const frame = await page.evaluate(async () => {
        const canvas = document.querySelector("canvas");
        const gl = canvas.getContext("webgl2");
        const extension = gl.getExtension("WEBGL_debug_renderer_info");
        const times = [];
        let previous = performance.now();
        await new Promise((resolve) => {
          const sample = (time) => {
            times.push(time - previous);
            previous = time;
            if (times.length < 90) requestAnimationFrame(sample);
            else resolve();
          };
          requestAnimationFrame(sample);
        });
        times.shift();
        times.sort((a, b) => a - b);
        return {
          fps: 1000 / (times.reduce((a, b) => a + b, 0) / times.length),
          medianMs: times[Math.floor(times.length * 0.5)],
          p95Ms: times[Math.floor(times.length * 0.95)],
          renderer: extension
            ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
            : "unknown",
          pixels: [canvas.width, canvas.height],
          quality: canvas.dataset.quality || "baseline",
        };
      });
      const result = { mobile, stage, ...frame };
      results.push(result);
      console.log(JSON.stringify(result));
    }
    await page.close();
  }
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/benchmark-" + (quality || "auto") + ".json",
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
}
