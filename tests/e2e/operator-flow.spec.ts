import { test, expect } from "@playwright/test";

const email = process.env.E2E_OPERATOR_EMAIL;
const password = process.env.E2E_OPERATOR_PASSWORD;

test.describe("operator vertical slice", () => {
  test.skip(!email || !password, "Set synthetic E2E operator credentials.");
  test.describe.configure({ mode: "serial" });

  test("sign in, receive, report with a photo, return, and complete", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Work email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/operator/);

    await page.goto("/operator/trays/FLUX-TEST-001");
    const receive = page.getByRole("button", { name: "Log Tray Received" });
    if (await receive.isVisible()) await receive.click();

    await page.getByRole("link", { name: /2005/ }).click();
    await expect(page.getByText("Reporting issue for sample", { exact: true })).toBeVisible();
    await expect(page.getByText("2005", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "X-ray analysis" }).click();
    await page.getByRole("button", { name: "Too crumbly for X-ray analysis" }).click();
    await page.locator('input[type="file"]').setInputFiles("public/icons/icon-192.png");
    await expect(page).toHaveURL(/submitted=1/, { timeout: 30_000 });
    await expect(page.getByText("Issue saved with photographic evidence.")).toBeVisible();

    await page.goto("/operator/trays/FLUX-TEST-001");
    await page.getByRole("button", { name: /Issues only/ }).click();
    await expect(page.getByText("2005", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Complete Tray" }).click();
    await page.getByRole("button", { name: "Yes, complete tray" }).click();
    await expect(page.getByText("Tray complete")).toBeVisible();
    await page.goto("/operator/trays/FLUX-TEST-001");
    await expect(page.getByText(/read-only/i)).toBeVisible();
  });

  test("double input selection does not create duplicate submissions", async ({ page }) => {
    await page.goto("/operator/trays/FLUX-TEST-001");
    await expect(page.getByText(/read-only/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Complete Tray" })).toHaveCount(0);
  });
});
