import { test, expect } from "@playwright/test";
import { acts } from "../src/data/story";

test("join heading uses the story typography at desktop and mobile sizes", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/#preorder");
    const type = await page.evaluate(() => {
      const read = (selector: string) => {
        const style = getComputedStyle(document.querySelector(selector)!);
        return [
          style.fontFamily,
          style.fontSize,
          style.fontWeight,
          style.lineHeight,
          style.letterSpacing,
        ];
      };
      return {
        story: read(".panel-engineering h2"),
        join: read(".join-intro h2"),
      };
    });
    expect(type.join).toEqual(type.story);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);
  }
});

test("development update precedes the team form and fits small screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/#development");
  await expect(page.locator("#development-title")).toContainText(
    "First Brew prototype.",
  );
  await expect(page.locator(".development-progress li")).toHaveCount(3);
  expect(
    await page.evaluate(() => {
      const development = document.getElementById("development")!;
      const join = document.getElementById("preorder")!;
      return development.offsetTop + development.offsetHeight <= join.offsetTop;
    }),
  ).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
});

test("preorder interest form validates and local preview never claims delivery", async ({
  page,
}) => {
  test.skip(
    process.env.TEST_PRODUCTION === "1",
    "Do not submit a production form in this local-preview test",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#preorder");
  const form = page.locator(".join-form");
  await expect(form).toHaveAttribute("name", "preorder-first-brew");
  await page.getByLabel("Full name", { exact: true }).fill("Preview Test");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("preview@example.com");
  await page
    .getByLabel("Questions or notes (optional)")
    .fill("Testing the local preview only.");
  await page
    .getByLabel("I agree to receive email about First Brew preorders.")
    .check();
  let submissions = 0;
  page.on("request", (request) => {
    if (request.method() === "POST") submissions++;
  });
  await page
    .getByRole("button", { name: "REGISTER PREORDER INTEREST" })
    .click();
  await expect(form.getByRole("status")).toContainText("nothing was sent");
  expect(submissions).toBe(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "/private/tmp/first-brew-join-mobile.png" });
});

test("keyboard arrows scroll steadily and release without drifting", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".story")).not.toContainText("FB–01");
  await expect(page.locator(".hero-wordmark")).toHaveCount(0);
  const gap = await page.evaluate(() => {
    const title = document
      .querySelector(".instrument-header")!
      .getBoundingClientRect();
    const copy = document
      .querySelector(".hero-copy .eyebrow")!
      .getBoundingClientRect();
    return copy.top - title.bottom;
  });
  expect(gap).toBeGreaterThanOrEqual(0);
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowDown");
  const position = await page.evaluate(() => scrollY);
  expect(position).toBeGreaterThan(100);
  expect(position).toBeLessThan(600);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(position);
  await page.keyboard.press("ArrowUp");
  expect(await page.evaluate(() => scrollY)).toBeLessThan(position);
  await page.getByRole("button", { name: "GET NOTIFIED AT LAUNCH" }).click();
  const beforeDialogArrow = await page.evaluate(() => scrollY);
  await page.keyboard.press("ArrowDown");
  expect(await page.evaluate(() => scrollY)).toBe(beforeDialogArrow);
});

test("text panels flow continuously without overlapping at act boundaries", async ({
  page,
}) => {
  for (const size of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 375, height: 667 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".instrument-header")).not.toContainText(
      "IN DEVELOPMENT",
    );
    await expect(page.locator(".viewport-footer")).toHaveCount(0);
    await expect(page.locator(".object-caption")).toHaveCount(0);
    for (let index = 0; index < acts.length - 1; index++) {
      const geometry = await page.evaluate((index) => {
        const panels = [
          ...document.querySelectorAll<HTMLElement>(".act-panel"),
        ];
        const next = panels[index + 1].parentElement!;
        window.scrollTo({
          top: next.offsetTop - innerHeight / 2,
          behavior: "instant",
        });
        const current = panels[index].getBoundingClientRect();
        const incoming = panels[index + 1].getBoundingClientRect();
        return { bottom: current.bottom, top: incoming.top };
      }, index);
      expect(geometry.bottom).toBeLessThanOrEqual(geometry.top + 1);
    }
    const collisions = await page.evaluate(() => {
      const failures: string[] = [];
      document
        .querySelectorAll(
          ".editorial, .hero-copy, .brew-hud, .recipe-specs, .pour-rows",
        )
        .forEach((group) => {
          const children = [...group.children].filter(
            (child) => getComputedStyle(child).display !== "none",
          );
          children.forEach((a, i) =>
            children.slice(i + 1).forEach((b) => {
              const x = a.getBoundingClientRect(),
                y = b.getBoundingClientRect();
              if (
                Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 &&
                Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1
              )
                failures.push(
                  `${a.className || a.tagName} / ${b.className || b.tagName}`,
                );
            }),
          );
        });
      return failures;
    });
    expect(collisions).toEqual([]);
  }
});

test("desktop: five acts, working 3D, recipe highlights, brew and launch dialog", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("canvas").first()).toBeVisible();
  await page.waitForTimeout(1800);
  await expect(page.locator(".fallback-note")).not.toBeVisible();
  await page.screenshot({ path: "/private/tmp/first-brew-hero.png" });
  for (const [index, id] of acts.map((act) => act.id).entries()) {
    await page.evaluate(
      (id) =>
        document.getElementById(id)!.scrollIntoView({ behavior: "instant" }),
      id,
    );
    await expect(page.locator(".app")).toHaveAttribute(
      "data-act",
      String(index),
    );
    await page.waitForTimeout(800);
    await expect(page.locator(`.panel-${id}`)).toBeVisible();
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(page.locator(".fallback-note")).not.toBeVisible();
    await page.screenshot({ path: `/private/tmp/first-brew-${id}.png` });
  }
  await page.getByRole("button", { name: "GET NOTIFIED AT LAUNCH" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  // The live UI must follow the same pour schedule as the physical scene.
  for (const [progress, expectedVolume, expectedFlow] of [
    [0.5, "141", "4.8"],
    [0.7, "200", "0.0"],
    [1, "300", "0.0"],
  ] as const) {
    await page.evaluate(
      (stage) => {
        const sections = [...document.querySelectorAll<HTMLElement>(".act")];
        const index = Math.floor(stage);
        window.scrollTo({
          top:
            sections[index].offsetTop +
            sections[index].offsetHeight * (stage - index),
          behavior: "instant",
        });
      },
      1.85 + progress * 0.98,
    );
    await expect(page.locator("#brew-volume")).toHaveText(
      `${expectedVolume} / 300`,
    );
    await expect(page.locator("#brew-flow")).toHaveText(expectedFlow);
  }
  expect(errors).toEqual([]);
});

test("brew buttons and editable parameters are absent", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "SEE HOW IT BREWS" }),
  ).toHaveCount(0);
  await expect(page.locator("#physical")).toHaveCount(0);
  await expect(page.locator(".act")).toHaveCount(5);
  await expect(
    page.getByRole("button", { name: /^(BREW|Press Brew\.)$/ }),
  ).toHaveCount(0);
  await expect(
    page.locator("#pour-path, #pour-radius, #pour-speed, .brew-controls"),
  ).toHaveCount(0);
});

test("mobile: portrait object, all acts fit horizontally and launch remains reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForTimeout(1600);
  for (const [index, id] of acts.map((act) => act.id).entries()) {
    await page.evaluate(
      (id) =>
        document.getElementById(id)!.scrollIntoView({ behavior: "instant" }),
      id,
    );
    await expect(page.locator(".app")).toHaveAttribute(
      "data-act",
      String(index),
    );
    await page.waitForTimeout(700);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(page.locator(".fallback-note")).not.toBeVisible();
    await page.screenshot({ path: `/private/tmp/first-brew-mobile-${id}.png` });
  }
  await page.getByRole("button", { name: "GET NOTIFIED AT LAUNCH" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("reduced motion retains static machine states and keyboard navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator(".app")).toHaveClass(/reduced-motion/);
  await page.getByRole("button", { name: "Act 4: The mechanics" }).click();
  await expect(page.locator(".app")).toHaveAttribute("data-act", "3");
  await page.waitForTimeout(500);
  await expect(page.locator("canvas").first()).toBeVisible();
  await expect(page.locator(".fallback-note")).not.toBeVisible();
  await page.screenshot({ path: "/private/tmp/first-brew-reduced.png" });
  await page.getByRole("button", { name: "Act 5: Your morning" }).click();
  await expect(
    page.getByRole("button", { name: "GET NOTIFIED AT LAUNCH" }),
  ).toBeVisible();
});
