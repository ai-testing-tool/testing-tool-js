const { qa } = require('qa-forge-wdio');
const InventoryPage = require('../pageobjects/InventoryPage');
const CartPage = require('../pageobjects/CartPage');
const { loginAsStandardUser } = require('../helpers/auth');

describe('Cart Management', () => {
  beforeEach(async () => {
    await loginAsStandardUser();
  });

  it('AUTH-107 User can add product to cart', async () => {
    qa.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tCart\tAdd Items');
    qa.parameters({ product: 'Sauce Labs Backpack' });

    await qa.step('Add product to cart', async () => {
      await InventoryPage.addToCart('sauce-labs-backpack');
    });

    await qa.step('Verify cart badge shows item count', async () => {
      await expect(InventoryPage.cartBadge).toHaveText('1');
    });

    await qa.step('Navigate to cart page', async () => {
      await InventoryPage.goToCart();
      await browser.waitUntil(
        async () => (await browser.getUrl()).includes('/cart.html'),
        { timeout: 5000 },
      );
    });

    await qa.step('Verify product is in cart', async () => {
      await expect(CartPage.pageTitle).toHaveText('Your Cart');
      await expect(CartPage.itemName).toHaveText(/Backpack/);
    });

    qa.attach({
      name: 'cart-state.json',
      content: JSON.stringify({ itemCount: 1, productAdded: 'Sauce Labs Backpack' }, null, 2),
      type: 'application/json',
    });

    qa.comment('Product successfully added to cart and visible on cart page');
  });

  it('AUTH-108 User can remove product from cart', async () => {
    qa.fields({ severity: 'major', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tCart\tRemove Items');

    await qa.step('Add product to cart', async () => {
      await InventoryPage.addToCart('sauce-labs-backpack');
      await expect(InventoryPage.cartBadge).toHaveText('1');
    });

    await qa.step('Navigate to cart', async () => {
      await InventoryPage.goToCart();
    });

    await qa.step('Remove product from cart', async () => {
      await CartPage.removeItem('sauce-labs-backpack');
    });

    await qa.step('Verify cart is empty', async () => {
      const items = await CartPage.items;
      expect(items).toHaveLength(0);
    });

    qa.comment('Product successfully removed from cart');
  });

  it('AUTH-109 User can add multiple products to cart', async () => {
    qa.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });
    qa.suite('E-commerce\tCart\tMultiple Items');

    await qa.step('Add first product', async () => {
      await InventoryPage.addToCart('sauce-labs-backpack');
    });

    await qa.step('Add second product', async () => {
      await InventoryPage.addToCart('sauce-labs-bike-light');
    });

    await qa.step('Add third product', async () => {
      await InventoryPage.addToCart('sauce-labs-bolt-t-shirt');
    });

    await qa.step('Verify cart badge shows correct count', async () => {
      await expect(InventoryPage.cartBadge).toHaveText('3');
    });

    await qa.step('Navigate to cart and verify all items', async () => {
      await InventoryPage.goToCart();
      const items = await CartPage.items;
      expect(items).toHaveLength(3);
    });

    qa.comment('Multiple products can be added and are tracked correctly');
  });
});
