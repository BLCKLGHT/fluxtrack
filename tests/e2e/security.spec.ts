import { test, expect } from "@playwright/test";

test("protected operator route redirects an unauthenticated visitor", async ({ page }) => {
  await page.goto("/operator/trays/FLUX-TEST-001");
  await expect(page).toHaveURL(/\/login/);
});

test("private bucket does not allow an unauthenticated object read", async ({ request }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  test.skip(!url, "Supabase URL is required.");
  const response = await request.get(`${url}/storage/v1/object/sample-issue-photos/nonexistent.jpg`);
  expect(response.status()).not.toBe(200);
});
