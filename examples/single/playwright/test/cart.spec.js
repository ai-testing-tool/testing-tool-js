const { test, expect } = require('@playwright/test');
const { qa } = require('@ai-testing-tool/forge-playwright');
const LoginPage = require('./pages/LoginPage');
const InventoryPage = require('./pages/InventoryPage');
const CartPage = require('./pages/CartPage');

test.describe('Shopping Cart', () => {
  let loginPage;
  let inventoryPage;
  let cartPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/.*inventory\.html/);
  });

  test('AUTH-107 User can add product to cart', async ({ page }) => {
    qa.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tShopping Cart\tAdd Items');
    qa.parameters({ product: 'Sauce Labs Backpack' });

    await test.step('Add product to cart', async () => {
      await inventoryPage.addToCart('sauce-labs-backpack');
    });

    await test.step('Verify cart badge shows 1 item', async () => {
      const cartBadge = await page.locator(inventoryPage.cartBadge).textContent();
      expect(cartBadge).toBe('1');
    });

    await test.step('Navigate to cart and verify product', async () => {
      await inventoryPage.goToCart();
      await expect(page).toHaveURL(/.*cart\.html/);

      const itemCount = await cartPage.getItemCount();
      expect(itemCount).toBe(1);

      // Metadata-only attach stub (binary upload deferred — FR119)
      qa.attach({
        name: 'cart-state.json',
        contentType: 'application/json',
      });
    });
  });

  test('AUTH-108 User can remove product from cart', async ({ page }) => {
    qa.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });
    qa.suite('E-commerce\tShopping Cart\tRemove Items');

    await test.step('Add product to cart', async () => {
      await inventoryPage.addToCart('sauce-labs-backpack');
    });

    await test.step('Navigate to cart', async () => {
      await inventoryPage.goToCart();
      await expect(page).toHaveURL(/.*cart\.html/);
    });

    await test.step('Remove product from cart', async () => {
      await cartPage.removeItem('sauce-labs-backpack');
    });

    await test.step('Verify cart is empty', async () => {
      const itemCount = await cartPage.getItemCount();
      expect(itemCount).toBe(0);

      const cartBadge = page.locator(inventoryPage.cartBadge);
      await expect(cartBadge).not.toBeVisible();
    });
  });

  test('AUTH-109 User can add multiple products to cart', async ({ page }) => {
    qa.fields({ severity: 'major', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tShopping Cart\tMultiple Items');

    await test.step('Add first product', async () => {
      await inventoryPage.addToCart('sauce-labs-backpack');
    });

    await test.step('Add second product', async () => {
      await inventoryPage.addToCart('sauce-labs-bike-light');
    });

    await test.step('Verify cart badge shows 2 items', async () => {
      const cartBadge = await page.locator(inventoryPage.cartBadge).textContent();
      expect(cartBadge).toBe('2');
    });
  });
});
