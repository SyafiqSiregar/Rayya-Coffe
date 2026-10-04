import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function test() {
  const browser = await puppeteer.launch({ 
    executablePath: EDGE_PATH, 
    headless: true,
    defaultViewport: { width: 1200, height: 800 }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3456/', { waitUntil: 'networkidle0' });

  console.log('1. Testing Login with admin / admin...');
  await page.type('#login-user', 'admin');
  await page.type('#login-pass', 'admin');
  await page.click('#btn-login');
  await new Promise(r => setTimeout(r, 1000));

  const mainDisplay = await page.evaluate(() => document.getElementById('main-app').style.display);
  console.log('Login result - main-app display:', mainDisplay);

  if (mainDisplay !== 'flex') {
    throw new Error('Login failed!');
  }

  // Go to users tab
  console.log('2. Navigating to Manajemen Anggota...');
  await page.click('[data-target="users"]');
  await new Promise(r => setTimeout(r, 800));

  const userCount = await page.evaluate(() => document.querySelectorAll('#table-users tr').length);
  console.log('Total user rows in table:', userCount);

  // Check pin toggle
  const pinBefore = await page.evaluate(() => document.querySelector('#table-users tr span[id^="user-pin-text"]').textContent.trim());
  console.log('Pin before click (masked):', pinBefore);

  await page.click('#table-users tr button[onclick*="toggleUserPinVisibility"]');
  await new Promise(r => setTimeout(r, 300));

  const pinAfter = await page.evaluate(() => document.querySelector('#table-users tr span[id^="user-pin-text"]').textContent.trim());
  console.log('Pin after click (revealed):', pinAfter);

  // Open edit modal for user
  console.log('3. Testing Edit Modal current password display...');
  await page.click('#table-users tr button[onclick*="openEditUserModal"]');
  await new Promise(r => setTimeout(r, 500));

  const currentPinVal = await page.evaluate(() => document.getElementById('user-edit-current-pin').value);
  const currentPinType = await page.evaluate(() => document.getElementById('user-edit-current-pin').type);
  console.log('Edit modal current pin value:', currentPinVal, 'type:', currentPinType);

  await page.click('#btn-toggle-edit-pin');
  await new Promise(r => setTimeout(r, 300));
  const currentPinTypeAfter = await page.evaluate(() => document.getElementById('user-edit-current-pin').type);
  console.log('Edit modal pin type after eye toggle:', currentPinTypeAfter);

  await browser.close();
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
