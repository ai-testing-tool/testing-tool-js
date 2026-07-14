/**
 * Login page object for saucedemo.com.
 * Wraps cy commands — no async/await; returns cy chains.
 */
class LoginPage {
  visit() {
    return cy.visit('/');
  }

  fillUsername(username) {
    return cy.get('[data-test="username"]').type(username);
  }

  fillPassword(password) {
    return cy.get('[data-test="password"]').type(password);
  }

  submit() {
    return cy.get('[data-test="login-button"]').click();
  }

  login(username, password) {
    this.fillUsername(username);
    this.fillPassword(password);
    this.submit();
  }

  getError() {
    return cy.get('[data-test="error"]');
  }
}

export default new LoginPage();
