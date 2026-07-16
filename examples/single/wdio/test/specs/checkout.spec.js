const { qa } = require('@qanalyzer/forge-wdio');
const InventoryPage = require('../pageobjects/InventoryPage');
const CartPage = require('../pageobjects/CartPage');
const CheckoutPage = require('../pageobjects/CheckoutPage');
const { loginAsStandardUser } = require('../helpers/auth');

describe('Checkout Flow', () => {
  beforeEach(async () => {
    await loginAsStandardUser();
    await InventoryPage.addToCart('sauce-labs-backpack');
    await InventoryPage.goToCart();
    await CartPage.checkout();
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/checkout-step-one.html'),
      { timeout: 10000 },
    );
  });

  it('AUTH-110 User can complete checkout with valid information', async () => {
    qa.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tCheckout\tComplete Purchase');
    qa.parameters({ firstName: 'John', lastName: 'Doe', postalCode: '12345' });

    await qa.step('Fill checkout information', async (step) => {
      await step.step('Enter first name', async () => {
        await CheckoutPage.firstNameInput.setValue('John');
      });

      await step.step('Enter last name', async () => {
        await CheckoutPage.lastNameInput.setValue('Doe');
      });

      await step.step('Enter postal code', async () => {
        await CheckoutPage.postalCodeInput.setValue('12345');
      });
    });

    await qa.step('Continue to checkout overview', async () => {
      await CheckoutPage.continue();
      await browser.waitUntil(
        async () => (await browser.getUrl()).includes('/checkout-step-two.html'),
        { timeout: 5000 },
      );
    });

    await qa.step('Complete the order', async () => {
      await CheckoutPage.finish();
      await browser.waitUntil(
        async () => (await browser.getUrl()).includes('/checkout-complete.html'),
        { timeout: 5000 },
      );
    });

    await qa.step('Verify order completion', async () => {
      await expect(CheckoutPage.completeHeader).toHaveText(/Thank you/);
    });

    qa.attach({
      name: 'order-complete.txt',
      content: 'Order completed successfully for John Doe at 12345',
      type: 'text/plain',
    });

    qa.comment('Checkout completed successfully with nested step demonstration');
  });

  it('AUTH-111 Checkout fails without required information', async () => {
    qa.fields({ severity: 'major', priority: 'high', layer: 'e2e' });
    qa.suite('E-commerce\tCheckout\tValidation');
    qa.parameters({ scenario: 'missing_first_name' });

    await qa.step('Leave first name empty and continue', async () => {
      await CheckoutPage.lastNameInput.setValue('Doe');
      await CheckoutPage.postalCodeInput.setValue('12345');
      await CheckoutPage.continue();
    });

    await qa.step('Verify error message is shown', async () => {
      await expect(CheckoutPage.errorMessage).toBeDisplayed();
      await expect(CheckoutPage.errorMessage).toHaveText(/First Name is required/);
    });

    qa.comment('Form validation correctly prevents checkout without required fields');
  });

  it('AUTH-112 User can cancel checkout', async () => {
    qa.fields({ severity: 'minor', priority: 'medium', layer: 'e2e' });
    qa.suite('E-commerce\tCheckout\tCancel');

    await qa.step('Fill partial information', async () => {
      await CheckoutPage.fillInfo('John', 'Doe', '12345');
    });

    await qa.step('Click cancel button', async () => {
      await CheckoutPage.cancel();
    });

    await qa.step('Verify return to cart page', async () => {
      await browser.waitUntil(
        async () => (await browser.getUrl()).includes('/cart.html'),
        { timeout: 5000 },
      );
      await expect(browser).toHaveUrl(/\/cart\.html/);
    });

    qa.comment('User can safely cancel checkout and return to cart');
  });

  it('AUTH-113 Demo test that will be ignored in reporting', async () => {
    qa.ignore();
    qa.suite('E-commerce\tCheckout\tIgnore demo');
    await expect(true).toBe(true);
  });
});
