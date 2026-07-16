const { test, expect } = require('@playwright/test');
const { qa } = require('@qanalyzer/forge-playwright');
const LoginPage = require('./pages/LoginPage');

test.describe('Authentication', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('AUTH-101 User can login with valid credentials', async ({ page }) => {
    qa.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tAuthentication\tLogin');

    await test.step('Navigate to login page', async () => {
      await expect(page).toHaveURL(/saucedemo\.com\/?$/);
    });

    await test.step('Fill in credentials and submit', async () => {
      await loginPage.login('standard_user', 'secret_sauce');
      qa.comment('Using standard_user credentials for successful login test');
    });

    await test.step('Verify successful login', async () => {
      await expect(page).toHaveURL(/.*inventory\.html/);
    });
  });

  test('AUTH-102 User cannot login with invalid password', async ({ page }) => {
    qa.fields({ severity: 'minor', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tAuthentication\tLogin');
    qa.parameters({ username: 'standard_user', password: 'wrong_password' });

    await test.step('Attempt login with invalid password', async () => {
      await loginPage.login('standard_user', 'wrong_password');
    });

    await test.step('Verify error message is displayed', async () => {
      const errorText = await loginPage.getErrorText();
      expect(errorText).toContain('Username and password do not match');
    });
  });

  test('AUTH-103 Locked user cannot login', async ({ page }) => {
    qa.fields({ severity: 'major', priority: 'medium', layer: 'e2e' });
    qa.suite('E-commerce\tAuthentication\tLogin');
    qa.parameters({ username: 'locked_out_user' });

    await test.step('Attempt login with locked user', async () => {
      await loginPage.login('locked_out_user', 'secret_sauce');
    });

    await test.step('Verify locked-out error message', async () => {
      const errorText = await loginPage.getErrorText();
      expect(errorText).toContain('Sorry, this user has been locked out');
    });
  });
});
