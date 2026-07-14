/**
 * Custom login command for saucedemo.com.
 * Usage: cy.login() or cy.login('locked_out_user', 'secret_sauce')
 */
Cypress.Commands.add('login', (username = 'standard_user', password = 'secret_sauce') => {
  cy.visit('/');
  cy.get('[data-test="username"]').type(username);
  cy.get('[data-test="password"]').type(password);
  cy.get('[data-test="login-button"]').click();
});
