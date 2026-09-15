import { test, expect } from "@playwright/test";

test("desktop: seven acts, working 3D, recipe highlights, brew and launch dialog", async ({
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
  for (const [index, id] of [
    "object",
    "physical",
    "engineering",
    "scan",
    "brew",
    "purpose",
    "launch",
  ].entries()) {
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
    await page.evaluate((progress) => {
      const stage = 3.85 + progress * 0.98;
      window.scrollTo({
        top:
          (stage / 6) * (document.documentElement.scrollHeight - innerHeight),
        behavior: "instant",
      });
    }, progress);
    await expect(page.locator("#brew-volume")).toHaveText(
      `${expectedVolume} / 300`,
    );
    await expect(page.locator("#brew-flow")).toHaveText(expectedFlow);
  }
  await page.evaluate(() =>
    document
      .getElementById("physical")!
      .scrollIntoView({ behavior: "instant" }),
  );
  await expect(page.locator(".app")).toHaveAttribute("data-act", "1");
  await page.getByRole("button", { name: /TEMPERATURE 92/ }).focus();
  await page.getByRole("button", { name: /TEMPERATURE 92/ }).hover();
  expect(errors).toEqual([]);
});

test("mobile: portrait object, all acts fit horizontally and launch remains reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForTimeout(1600);
  for (const [index, id] of [
    "object",
    "physical",
    "engineering",
    "scan",
    "brew",
    "purpose",
    "launch",
  ].entries()) {
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
  await page.getByRole("button", { name: "Act 3: The mechanics" }).click();
  await expect(page.locator(".app")).toHaveAttribute("data-act", "2");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "/private/tmp/first-brew-reduced.png" });
  await page.getByRole("button", { name: "Act 7: Your morning" }).click();
  await expect(
    page.getByRole("button", { name: "GET NOTIFIED AT LAUNCH" }),
  ).toBeVisible();
});
