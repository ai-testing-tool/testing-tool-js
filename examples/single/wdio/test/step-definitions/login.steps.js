const { Given, Then } = require('@wdio/cucumber-framework');
const LoginPage = require('../pageobjects/LoginPage');

Given('I open the login page', async () => {
  await LoginPage.open();
});

Then('the username field is displayed', async () => {
  await expect(LoginPage.usernameInput).toBeDisplayed();
});
