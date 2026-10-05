import { qa } from '@ai-testing-tool/forge-cypress/mocha';
import InventoryPage from '../support/pages/InventoryPage';

describe('Product Inventory', () => {
  beforeEach(() => {
    cy.login();
    cy.url().should('include', '/inventory.html');
  });

  it('User can browse all products', () => {
    qa.issueKeys(['AUTH-104']);

    qa.fields({ severity: 'normal', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tInventory\tBrowsing');

    qa.step('Verify Products page title', () => {
      InventoryPage.getTitle().should('have.text', 'Products');
    });

    qa.step('Count inventory items', () => {
      InventoryPage.getItems().should('have.length', 6);
    });

    qa.step('Verify product names are visible', () => {
      InventoryPage.getItemNames().each(($name) => {
        cy.wrap($name).should('be.visible');
      });
    });

    qa.step('Verify product prices are visible', () => {
      InventoryPage.getItemPrices().each(($price) => {
        cy.wrap($price).should('be.visible').and('contain.text', '$');
      });
    });

    qa.comment('Successfully browsed all 6 products on inventory page');
  });

  it('User can sort products by price', () => {
    qa.issueKeys(['AUTH-105']);

    qa.fields({ severity: 'minor', priority: 'medium', layer: 'e2e' });
    qa.suite('E-commerce\tInventory\tSorting');
    qa.parameters({ sortOption: 'lohi' });

    qa.step('Select sort by price low to high', () => {
      InventoryPage.sortBy('lohi');
    });

    qa.step('Verify prices are in ascending order', () => {
      const prices = [];
      InventoryPage.getItemPrices()
        .each(($price) => {
          const priceText = $price.text().replace('$', '');
          prices.push(parseFloat(priceText));
        })
        .then(() => {
          const sortedPrices = [...prices].sort((a, b) => a - b);
          expect(prices).to.deep.equal(sortedPrices);
        });
    });

    qa.comment('Products sorted correctly by price');
  });

  it('User can view product details', () => {
    qa.issueKeys(['AUTH-106']);

    qa.fields({ severity: 'major', priority: 'low', layer: 'e2e' });
    qa.suite('E-commerce\tInventory\tProduct Details');

    qa.step('Click on first product name', () => {
      InventoryPage.getItemNames().first().click();
    });

    qa.step('Verify product detail page loads', () => {
      cy.url().should('include', '/inventory-item.html');
      cy.get('.inventory_details_name').should('be.visible');
      cy.get('.inventory_details_desc').should('be.visible');
      cy.get('.inventory_details_price').should('be.visible');
    });

    qa.step('Verify back to products button is present', () => {
      cy.get('[data-test="back-to-products"]').should('be.visible');
    });
  });
});
