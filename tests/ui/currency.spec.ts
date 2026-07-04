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
