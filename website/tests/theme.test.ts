import test from "node:test";
import assert from "node:assert/strict";
import { themeAt, contrast } from "../src/data/theme";

test("text never fades into its background during a theme transition", () => {
  for (let i = 0; i <= 1000; i++) {
    const { background, foreground } = themeAt(i / 1000);
    assert(contrast(background, foreground) >= 4.5);
  }
});
test("dark theme retains the opening palette", () => {
  assert.deepEqual(themeAt(0), {
    background: [23, 24, 21],
    foreground: [242, 237, 227],
  });
});
