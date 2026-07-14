/**
 * Checkout page object for saucedemo.com.
 */
class CheckoutPage {
  fillFirstName(name) {
    return cy.get('[data-test="firstName"]').type(name);
  }

  fillLastName(name) {
    return cy.get('[data-test="lastName"]').type(name);
  }

  fillPostalCode(code) {
    return cy.get('[data-test="postalCode"]').type(code);
  }

  fillInfo(first, last, zip) {
    this.fillFirstName(first);
    this.fillLastName(last);
    this.fillPostalCode(zip);
  }

  continue() {
    return cy.get('[data-test="continue"]').click();
  }

  cancel() {
    return cy.get('[data-test="cancel"]').click();
  }

  finish() {
    return cy.get('[data-test="finish"]').click();
  }

  getCompleteHeader() {
    return cy.get('.complete-header');
  }

  getError() {
    return cy.get('[data-test="error"]');
  }

  getTitle() {
    return cy.get('.title');
  }
}

export default new CheckoutPage();
