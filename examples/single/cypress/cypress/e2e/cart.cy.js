import { qa } from '@qanalyzer/forge-cypress/mocha';
import InventoryPage from '../support/pages/InventoryPage';
import CartPage from '../support/pages/CartPage';

describe('Cart Management', () => {
  beforeEach(() => {
    cy.login();
  });

  it('AUTH-107 User can add product to cart', () => {
    qa.suite('E-commerce\tShopping Cart\tAdd Items');
    qa.parameters({ product: 'Sauce Labs Backpack' });

    qa.step('Verify cart is initially empty', () => {
      cy.get('.shopping_cart_badge').should('not.exist');
    });

    qa.step('Add Sauce Labs Backpack to cart', () => {
      InventoryPage.addToCart('sauce-labs-backpack');
    });

    qa.step('Verify cart badge shows 1 item', () => {
      InventoryPage.getCartBadge().should('have.text', '1');
    });

    qa.step('Navigate to cart', () => {
      InventoryPage.goToCart();
    });

    qa.step('Verify product appears in cart', () => {
      cy.url().should('include', '/cart.html');
      CartPage.getItems().should('have.length', 1);
      CartPage.getItemName().should('contain.text', 'Sauce Labs Backpack');
    });

    qa.comment('Successfully added product to cart');
  });

  it('AUTH-108 User can remove product from cart', () => {
    qa.suite('E-commerce\tShopping Cart\tRemove Items');

    qa.step('Add product to cart', () => {
      InventoryPage.addToCart('sauce-labs-bike-light');
      InventoryPage.getCartBadge().should('have.text', '1');
    });

    qa.step('Navigate to cart', () => {
      InventoryPage.goToCart();
    });

    qa.step('Verify product is in cart', () => {
      CartPage.getItems().should('have.length', 1);
    });

    qa.step('Remove product from cart', () => {
      CartPage.removeItem('sauce-labs-bike-light');
    });

    qa.step('Verify cart is empty', () => {
      CartPage.getItems().should('have.length', 0);
      cy.get('.shopping_cart_badge').should('not.exist');
    });

    qa.comment('Successfully removed product from cart');
  });

  it('AUTH-109 User can add multiple products to cart', () => {
    qa.suite('E-commerce\tShopping Cart\tMultiple Items');

    qa.step('Add first product to cart', () => {
      InventoryPage.addToCart('sauce-labs-backpack');
      InventoryPage.getCartBadge().should('have.text', '1');
    });

    qa.step('Add second product to cart', () => {
      InventoryPage.addToCart('sauce-labs-bolt-t-shirt');
      InventoryPage.getCartBadge().should('have.text', '2');
    });

    qa.step('Navigate to cart and verify both products', () => {
      InventoryPage.goToCart();
      CartPage.getItems().should('have.length', 2);
    });

    qa.comment('Multiple products added successfully');
  });
});
