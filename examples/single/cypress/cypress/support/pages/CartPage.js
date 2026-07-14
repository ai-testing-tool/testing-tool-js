/**
 * Cart page object for saucedemo.com.
 */
class CartPage {
  getItems() {
    return cy.get('.cart_item');
  }

  getItemName() {
    return cy.get('[data-test="inventory-item-name"]');
  }

  removeItem(productSlug) {
    return cy.get(`[data-test="remove-${productSlug}"]`).click();
  }

  checkout() {
    return cy.get('[data-test="checkout"]').click();
  }

  continueShopping() {
    return cy.get('[data-test="continue-shopping"]').click();
  }

  getTitle() {
    return cy.get('.title');
  }
}

export default new CartPage();
