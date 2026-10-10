import { expect, test, type Page } from "@playwright/test";

const current = (page: Page) => page.locator('nav[aria-label="Cars"] button[aria-current="true"]');

test("the gate paints the wordmark and both ways in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Arcade", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter the showroom" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter without sound" })).toBeVisible();
  await expect(page.getByText("A concept. Every listing is fiction; the cars and their specifications are real.")).toBeVisible();
});

test("keyboard path: enter, step through the row, open and close the Index", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter without sound" }).click();
  await expect(page.locator(".gate")).toBeHidden();

  const frames = page.locator("[data-frame]");
  await expect(frames).toHaveCount(13);
  await expect(frames.first()).toHaveAccessibleName("1975 Datsun 240K GT (C110), $38,500");
  await expect(current(page)).toHaveAccessibleName(/^01,/);

  await page.keyboard.press("ArrowRight");
  await expect(current(page)).toHaveAccessibleName(/^02, 1972 Triumph TR6/);

  await page.keyboard.press("i");
  const index = page.getByRole("dialog", { name: "Index" });
  await expect(index).toBeVisible();
  await expect(index.getByRole("link")).toHaveCount(13);
  await page.keyboard.press("Escape");
  await expect(index).toBeHidden();
});

test("reduced motion still steps between cars", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await page.keyboard.press("Enter");
  await expect(page.locator(".gate")).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(current(page)).toHaveAccessibleName(/^02,/);
  await context.close();
});

test("a deep link opens its car, and Esc returns to the showroom with it centred", async ({ page }) => {
  await page.goto("/cars/bmw-m5-e39");
  await expect(page).toHaveTitle("2002 BMW M5 · Arcade");
  await page.getByRole("button", { name: "Enter without sound" }).click();
  await expect(page.getByRole("heading", { name: "BMW M5", level: 1 })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL("/");
  await expect(current(page)).toHaveAccessibleName(/^11,/);
  await expect(page.locator("[data-frame]").nth(10)).toBeFocused();
});

test("the detail page steps through its sections by keyboard and shows the spec bar", async ({ page }) => {
  await page.goto("/cars/porsche-930");
  await page.getByRole("button", { name: "Enter without sound" }).click();
  await expect(page.locator(".gate")).toBeHidden();
  const detail = page.locator("[data-detail]");
  await expect(detail).toHaveAttribute("data-section", "hero");
  await expect(page.getByText("Price as listed")).toBeVisible();
  await page.keyboard.press("End");
  await expect(detail).toHaveAttribute("data-section", "enquiry", { timeout: 15_000 });
  await page.keyboard.press("Home");
  await expect(detail).toHaveAttribute("data-section", "hero", { timeout: 15_000 });
  await page.getByRole("button", { name: "Jump to specs" }).click();
  await expect(detail).toHaveAttribute("data-section", "specs", { timeout: 15_000 });
});

test("unknown cars, the asset studio and the lighting lab are 404s in production", async ({ request }) => {
  expect((await request.get("/cars/ferrari-f40")).status()).toBe(404);
  expect((await request.get("/studio/honda-nsx-na1")).status()).toBe(404);
  expect((await request.get("/lab/porsche-930")).status()).toBe(404);
});
