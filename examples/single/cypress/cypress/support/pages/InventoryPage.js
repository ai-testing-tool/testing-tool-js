/**
 * Inventory page object for saucedemo.com.
 */
class InventoryPage {
  getItems() {
    return cy.get('.inventory_item');
  }

  getItemNames() {
    return cy.get('[data-test="inventory-item-name"]');
  }

  getItemPrices() {
    return cy.get('[data-test="inventory-item-price"]');
  }

  addToCart(productSlug) {
    return cy.get(`[data-test="add-to-cart-${productSlug}"]`).click();
  }

  removeFromCart(productSlug) {
    return cy.get(`[data-test="remove-${productSlug}"]`).click();
  }

  getCartBadge() {
    return cy.get('.shopping_cart_badge');
  }

  goToCart() {
    return cy.get('#shopping_cart_container a').click();
  }

  sortBy(value) {
    return cy.get('.product_sort_container').select(value);
  }

  getTitle() {
    return cy.get('.title');
  }
}

export default new InventoryPage();
