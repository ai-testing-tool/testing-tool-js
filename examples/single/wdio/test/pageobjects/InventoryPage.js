class InventoryPage {
  get items() {
    return $$('.inventory_item');
  }
  get itemNames() {
    return $$('[data-test="inventory-item-name"]');
  }
  get itemPrices() {
    return $$('[data-test="inventory-item-price"]');
  }
  get sortDropdown() {
    return $('.product_sort_container');
  }
  get cartBadge() {
    return $('.shopping_cart_badge');
  }
  get cartLink() {
    return $('#shopping_cart_container a');
  }
  get pageTitle() {
    return $('.title');
  }

  async addToCart(productSlug) {
    const btn = $(`[data-test="add-to-cart-${productSlug}"]`);
    await btn.waitForExist({ timeout: 10000 });
    await btn.waitForDisplayed({ timeout: 10000 });
    await btn.click();
  }

  async removeFromCart(productSlug) {
    await $(`[data-test="remove-${productSlug}"]`).click();
  }

  async goToCart() {
    await this.cartLink.click();
  }

  async sortBy(value) {
    await this.sortDropdown.selectByAttribute('value', value);
  }
}

module.exports = new InventoryPage();
