const { qa } = require('qa-forge-wdio');
const InventoryPage = require('../pageobjects/InventoryPage');
const { loginAsStandardUser } = require('../helpers/auth');

describe('Product Inventory', () => {
  beforeEach(async () => {
    await loginAsStandardUser();
  });

  it('AUTH-104 User can browse all products', async () => {
    qa.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tProduct Catalog\tBrowsing');

    await qa.step('Verify page title', async () => {
      await expect(InventoryPage.pageTitle).toHaveText('Products');
    });

    await qa.step('Count products displayed', async () => {
      const items = await InventoryPage.items;
      expect(items).toHaveLength(6);
    });

    await qa.step('Verify product details are visible', async () => {
      const names = await InventoryPage.itemNames;
      const prices = await InventoryPage.itemPrices;

      expect(await names[0].isDisplayed()).toBe(true);
      expect(await prices[0].isDisplayed()).toBe(true);
      expect(await prices[0].getText()).toMatch(/\$\d+\.\d{2}/);
    });

    qa.comment('All products are correctly displayed with prices and details');

    const productData = {
      totalProducts: 6,
      firstProduct: await (await InventoryPage.itemNames)[0].getText(),
      firstPrice: await (await InventoryPage.itemPrices)[0].getText(),
    };

    qa.attach({
      name: 'product-list.json',
      content: JSON.stringify(productData, null, 2),
      type: 'application/json',
    });
  });

  it('AUTH-105 User can sort products by price', async () => {
    qa.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });
    qa.suite('E-commerce\tProduct Catalog\tSorting');
    qa.parameters({ sortOption: 'lohi' });

    await qa.step('Select sort by price low to high', async () => {
      await InventoryPage.sortBy('lohi');
    });

    await qa.step('Verify products are sorted by ascending price', async () => {
      const prices = await InventoryPage.itemPrices;
      const priceTexts = [];
      for (const p of prices) {
        priceTexts.push(await p.getText());
      }
      const priceValues = priceTexts.map((p) => parseFloat(p.replace('$', '')));

      for (let i = 0; i < priceValues.length - 1; i++) {
        expect(priceValues[i]).toBeLessThanOrEqual(priceValues[i + 1]);
      }
    });

    qa.comment('Products correctly sorted by price in ascending order');
  });

  it('AUTH-106 User can view product details', async () => {
    qa.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });
    qa.suite('E-commerce\tProduct Catalog\tDetails');

    let productName;

    await qa.step('Click on product name', async () => {
      const names = await InventoryPage.itemNames;
      productName = await names[0].getText();
      await names[0].click();
    });

    await qa.step('Verify navigation to product detail page', async () => {
      await browser.waitUntil(
        async () => (await browser.getUrl()).includes('inventory-item.html'),
        { timeout: 5000 },
      );
      expect(await browser.getUrl()).toContain('inventory-item.html');
    });

    qa.comment('Product detail page opened');
    qa.parameters({ productClicked: productName });
  });
});
