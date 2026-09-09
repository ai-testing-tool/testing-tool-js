import { qa } from '@ai-testing-tool/forge-cypress/mocha';
import InventoryPage from '../support/pages/InventoryPage';
import CartPage from '../support/pages/CartPage';
import CheckoutPage from '../support/pages/CheckoutPage';

describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.login();
    InventoryPage.addToCart('sauce-labs-backpack');
    InventoryPage.goToCart();
    CartPage.checkout();
  });

  it('AUTH-110 User can complete checkout with valid information', () => {
    qa.suite('E-commerce\tCheckout\tComplete Flow');
    qa.parameters({ firstName: 'John', lastName: 'Doe', postalCode: '12345' });

    qa.step('Verify on checkout information page', () => {
      cy.url().should('include', '/checkout-step-one.html');
      CheckoutPage.getTitle().should('have.text', 'Checkout: Your Information');
    });

    qa.step('Fill in checkout information', () => {
      CheckoutPage.fillInfo('John', 'Doe', '12345');
    });

    qa.step('Continue to overview', () => {
      CheckoutPage.continue();
    });

    qa.step('Verify on checkout overview page', () => {
      cy.url().should('include', '/checkout-step-two.html');
      CheckoutPage.getTitle().should('have.text', 'Checkout: Overview');
    });

    qa.step('Verify order details are correct', () => {
      cy.get('.cart_item').should('have.length', 1);
      cy.get('[data-test="inventory-item-name"]').should(
        'contain.text',
        'Sauce Labs Backpack',
      );
      cy.get('.summary_total_label').should('be.visible');
    });

    qa.step('Complete the order', () => {
      CheckoutPage.finish();
    });

    qa.step('Verify order completion', () => {
      cy.url().should('include', '/checkout-complete.html');
      CheckoutPage.getCompleteHeader().should('have.text', 'Thank you for your order!');
    });

    qa.comment('Checkout completed successfully');
  });

  it('AUTH-111 Checkout fails without required information', () => {
    qa.suite('E-commerce\tCheckout\tValidation');
    qa.parameters({ scenario: 'missing_first_name' });

    qa.step('Verify on checkout information page', () => {
      cy.url().should('include', '/checkout-step-one.html');
    });

    qa.step('Fill only last name and postal code', () => {
      CheckoutPage.fillLastName('Smith');
      CheckoutPage.fillPostalCode('54321');
    });

    qa.step('Attempt to continue without first name', () => {
      CheckoutPage.continue();
    });

    qa.step('Verify error message is displayed', () => {
      CheckoutPage.getError()
        .should('be.visible')
        .and('contain.text', 'Error: First Name is required');
    });

    qa.step('Verify still on information page', () => {
      cy.url().should('include', '/checkout-step-one.html');
    });

    qa.comment('Validation working correctly');
  });

  it('AUTH-112 User can cancel checkout', () => {
    qa.suite('E-commerce\tCheckout\tNavigation');

    qa.step('Verify on checkout information page', () => {
      cy.url().should('include', '/checkout-step-one.html');
    });

    qa.step('Click cancel button', () => {
      CheckoutPage.cancel();
    });

    qa.step('Verify returned to cart page', () => {
      cy.url().should('include', '/cart.html');
      CartPage.getTitle().should('have.text', 'Your Cart');
    });

    qa.step('Verify product still in cart', () => {
      CartPage.getItems().should('have.length', 1);
    });

    qa.comment('Cancel navigation works correctly');
  });

  it('AUTH-113 Demo test that will be ignored in reporting', () => {
    qa.ignore();
    qa.suite('E-commerce\tCheckout\tDemo');

    // Runs locally; meta.qa.ignore marks it for reporters that honor ignore.
    cy.log('This test is marked ignore for reporting demos');
    cy.url().should('include', '/checkout-step-one.html');

    qa.comment('Intentionally ignored for demonstration');
  });
});
