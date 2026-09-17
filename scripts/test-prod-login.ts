import { chromium } from 'playwright';

async function testProdLogin() {
  console.log('--- TESTING REAL VERCEL PRODUCTION WEBSITE LOGIN & DASHBOARD ---');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to https://srisaisiri.vercel.app/login...');
  await page.goto('https://srisaisiri.vercel.app/login');
  await page.waitForLoadState('networkidle');

  console.log('Filling owner email & password...');
  await page.fill('input[type="email"]', 'owner@srisaisiri.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  try {
    const enterBtn = page.locator('button', { hasText: 'ENTER MANAGEMENT PORTAL' });
    await enterBtn.waitFor({ state: 'visible', timeout: 5000 });
    await enterBtn.click();
  } catch (e) {}

  await page.waitForURL('**/owner/**', { timeout: 15000 });
  console.log('✓ SUCCESS: Redirected to Production Portal URL:', page.url());

  await browser.close();
}

testProdLogin().then(() => process.exit(0)).catch(e => { console.error('PROD LOGIN ERROR:', e); process.exit(1); });
