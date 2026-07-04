import { expect, test } from "../fixtures";
import { Toast } from "../modules/toast";
import { ListsPage } from "../pageObjects/lists.page";
import { randomString } from "../util";

test("converted price shows for a non-default currency", async ({ page, userData }) => {
    const listsPage = new ListsPage(page);
    await listsPage.goto();

    const list = await listsPage.getListAt(0);
    const listPage = await list.click();
    await listPage.assertNoItems();

    const itemData = {
        name: randomString(),
        rawPrice: 10
    };
    const createItemPage = await listPage.createItem();
    await createItemPage
        .getForm()
        .then((f) => f.fillName(itemData.name))
        .then((f) => f.fillPrice(itemData.rawPrice, "EUR"));
    await createItemPage.create();

    await listPage.at();
    await new Toast(page).waitForToastWithText("Item created");
    await listPage
        .getItemAt(0)
        .then((item) => item.assertPriceContains("€"))
        .then((item) => item.assertPriceContains("10"))
        .then((item) => item.assertConvertedPrice("$"))
        .then((item) => item.assertConvertedPrice("20"));
});

test("no converted price for a currency without a seeded rate", async ({ page }) => {
    const listsPage = new ListsPage(page);
    await listsPage.goto();

    const list = await listsPage.getListAt(0);
    const listPage = await list.click();
    await listPage.assertNoItems();

    const createItemPage = await listPage.createItem();
    await createItemPage
        .getForm()
        .then((f) => f.fillName(randomString()))
        .then((f) => f.fillPrice(10, "GBP"));
    await createItemPage.create();

    await listPage.at();
    await new Toast(page).waitForToastWithText("Item created");
    // GBP is absent from the seeded rate table (USD/EUR/JPY), so the original
    // price is shown with no "(≈ …)" conversion.
    await listPage
        .getItemAt(0)
        .then((item) => item.assertPriceContains("10"))
        .then((item) => item.assertNoConvertedPrice());
});

test("disabling conversion in settings hides converted prices", async ({ page, adminPage }) => {
    const listsPage = new ListsPage(page);
    await listsPage.goto();

    const list = await listsPage.getListAt(0);
    const listPage = await list.click();
    await listPage.assertNoItems();

    const createItemPage = await listPage.createItem();
    await createItemPage
        .getForm()
        .then((f) => f.fillName(randomString()))
        .then((f) => f.fillPrice(10, "EUR"));
    await createItemPage.create();

    await listPage.at();
    await new Toast(page).waitForToastWithText("Item created");
    // On by default: the EUR item shows a USD-converted value.
    await listPage.getItemAt(0).then((item) => item.assertConvertedPrice("20"));

    try {
        // Admin turns off currency conversion globally.
        await adminPage.goto("/admin/settings#general");
        await adminPage.locator("#currencyConversion").uncheck();
        await adminPage.getByRole("button", { name: "Save" }).click();
        await new Toast(adminPage).waitForToastWithText("Settings saved successfully");

        // The viewer no longer sees the converted value after reloading.
        await page.reload();
        await listPage.getItemAt(0).then((item) => item.assertNoConvertedPrice());
    } finally {
        // Restore the global setting so other tests are unaffected.
        await adminPage.goto("/admin/settings#general");
        await adminPage.locator("#currencyConversion").check();
        await adminPage.getByRole("button", { name: "Save" }).click();
        await new Toast(adminPage).waitForToastWithText("Settings saved successfully");
    }
});
