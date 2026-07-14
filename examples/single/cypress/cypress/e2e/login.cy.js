import { qa } from 'qa-cypress/mocha';
import LoginPage from '../support/pages/LoginPage';
import InventoryPage from '../support/pages/InventoryPage';

describe('Login Scenarios', () => {
  beforeEach(() => {
    LoginPage.visit();
  });

  it('AUTH-101 User can login with valid credentials', () => {
    qa.suite('E-commerce\tAuthentication\tLogin');

    qa.step('Fill in username', () => {
      LoginPage.fillUsername('standard_user');
    });

    qa.step('Fill in password', () => {
      LoginPage.fillPassword('secret_sauce');
    });

    qa.step('Submit login form', () => {
      LoginPage.submit();
    });

    qa.step('Verify successful login', () => {
      cy.url().should('include', '/inventory.html');
      InventoryPage.getTitle().should('have.text', 'Products');
    });

    qa.comment('Login successful');
  });

  it('AUTH-102 User cannot login with invalid password', () => {
    qa.suite('E-commerce\tAuthentication\tLogin');
    qa.parameters({ username: 'standard_user', password: 'wrong_password' });

    qa.step('Attempt login with invalid credentials', () => {
      LoginPage.fillUsername('standard_user');
      LoginPage.fillPassword('wrong_password');
      LoginPage.submit();
    });

    qa.step('Verify error message is shown', () => {
      LoginPage.getError()
        .should('be.visible')
        .and('contain.text', 'Username and password do not match');
    });

    qa.step('Verify still on login page', () => {
      cy.url().should('not.include', '/inventory.html');
    });
  });

  it('AUTH-103 Locked user cannot login', () => {
    qa.suite('E-commerce\tAuthentication\tLogin');
    qa.parameters({ username: 'locked_out_user', password: 'secret_sauce' });

    qa.step('Attempt login with locked user', () => {
      LoginPage.fillUsername('locked_out_user');
      LoginPage.fillPassword('secret_sauce');
      LoginPage.submit();
    });

    qa.step('Verify locked out error message', () => {
      LoginPage.getError()
        .should('be.visible')
        .and('contain.text', 'Sorry, this user has been locked out');
    });

    qa.step('Verify cannot access inventory', () => {
      cy.url().should('not.include', '/inventory.html');
    });
  });
});
