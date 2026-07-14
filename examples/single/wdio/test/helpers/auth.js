const LoginPage = require('../pageobjects/LoginPage');
const InventoryPage = require('../pageobjects/InventoryPage');

async function loginAsStandardUser() {
  await LoginPage.open();
  await LoginPage.login('standard_user', 'secret_sauce');
  await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/inventory.html'),
    { timeout: 10000, timeoutMsg: 'Expected inventory URL after login' },
  );
  await expect(InventoryPage.pageTitle).toHaveText('Products');
  await $('[data-test="add-to-cart-sauce-labs-backpack"]').waitForExist({
    timeout: 10000,
  });
}

module.exports = { loginAsStandardUser };
