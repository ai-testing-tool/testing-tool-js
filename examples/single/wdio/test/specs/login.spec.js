const { qa } = require('qa-forge-wdio');
const LoginPage = require('../pageobjects/LoginPage');

describe('Login Scenarios', () => {
  it('AUTH-101 User can login with valid credentials', async () => {
    qa.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tAuthentication\tLogin');

    await qa.step('Open login page', async () => {
      await LoginPage.open();
      await expect(LoginPage.usernameInput).toBeDisplayed();
    });

    await qa.step('Enter valid credentials and submit', async () => {
      await LoginPage.login('standard_user', 'secret_sauce');
    });

    await qa.step('Verify successful login', async () => {
      await browser.waitUntil(
        async () => (await browser.getUrl()).includes('/inventory.html'),
        { timeout: 5000, timeoutMsg: 'Expected to navigate to inventory page' },
      );
      await expect(browser).toHaveUrl(/\/inventory\.html/);
    });

    qa.comment('Login successful with standard user credentials');
    qa.attach({
      name: 'login-credentials.txt',
      content: 'Username: standard_user\nPassword: secret_sauce',
      type: 'text/plain',
    });
  });

  it('AUTH-102 User cannot login with invalid password', async () => {
    qa.fields({ severity: 'major', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tAuthentication\tLogin');
    qa.parameters({ username: 'standard_user', password: 'wrong_password' });

    await qa.step('Open login page', async () => {
      await LoginPage.open();
    });

    await qa.step('Enter invalid credentials', async () => {
      await LoginPage.login('standard_user', 'wrong_password');
    });

    await qa.step('Verify error message is displayed', async () => {
      await expect(LoginPage.errorMessage).toBeDisplayed();
      await expect(LoginPage.errorMessage).toHaveText(
        /Username and password do not match/,
      );
    });

    qa.comment('Error message correctly displayed for invalid credentials');
  });

  it('AUTH-103 Locked user cannot login', async () => {
    qa.fields({ severity: 'major', priority: 'medium', layer: 'e2e' });
    qa.suite('E-commerce\tAuthentication\tLogin');
    qa.parameters({ username: 'locked_out_user' });

    await qa.step('Open login page', async () => {
      await LoginPage.open();
    });

    await qa.step('Attempt login with locked user', async () => {
      await LoginPage.login('locked_out_user', 'secret_sauce');
    });

    await qa.step('Verify locked user message', async () => {
      await expect(LoginPage.errorMessage).toBeDisplayed();
      await expect(LoginPage.errorMessage).toHaveText(/locked out/);
    });

    qa.comment('System correctly prevents locked users from accessing the application');
  });
});
