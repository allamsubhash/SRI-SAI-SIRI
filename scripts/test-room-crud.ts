import { chromium } from 'playwright';

async function testRoomCrud() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('dialog', async dialog => {
    console.log('DIALOG ALERT:', dialog.message());
    await dialog.dismiss();
  });
  page.on('response', res => {
    if (res.url().includes('/api/rooms')) {
      console.log('API ROOMS RESPONSE STATUS:', res.status());
      res.json().then(data => console.log('API ROOMS RESPONSE BODY:', JSON.stringify(data))).catch(() => {});
    }
  });

  // 1. Login
  await page.goto('https://srisaisiri.vercel.app/login', { waitUntil: 'networkidle' });
  const signInTab = page.locator('button:has-text("SIGN IN")').first();
  if (await signInTab.isVisible()) {
    await signInTab.click();
    await page.waitForTimeout(500);
  }

  await page.fill('input[type="email"]', 'owner@srisaisiri.com');
  await page.fill('input[type="password"]', 'Owner@12345');
  const submitBtn = page.locator('form button[type="submit"]').first();
  await submitBtn.click();
  await page.waitForTimeout(3000);

  const welcomeOverlayBtn = page.locator('button:has-text("ENTER MANAGEMENT PORTAL"), button:has-text("ENTER PORTAL"), button:has-text("ENTER MY PORTAL")').first();
  if (await welcomeOverlayBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await welcomeOverlayBtn.click();
    await page.waitForTimeout(2000);
  }

  // 2. Go to /owner/buildings
  await page.goto('https://srisaisiri.vercel.app/owner/buildings', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Test Room Addition
  const addRoomBtn = page.locator('button:has-text("+ Add Room"), button:has-text("+ Add First Room"), button:has-text("Add Room")').first();
  if (await addRoomBtn.isVisible()) {
    console.log('Found Add Room button, clicking...');
    await addRoomBtn.click();
    await page.waitForTimeout(1000);

    const submitRoom = page.locator('button:has-text("Generate Room & Beds")').first();
    if (await submitRoom.isVisible()) {
      console.log('Clicking "Generate Room & Beds" button...');
      await submitRoom.click();
      await page.waitForTimeout(4000);
    }
  }

  await browser.close();
}

testRoomCrud().catch(console.error);
