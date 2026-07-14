/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Log in to saucedemo.com (default: standard_user / secret_sauce).
     */
    login(username?: string, password?: string): Chainable<void>;
  }
}
