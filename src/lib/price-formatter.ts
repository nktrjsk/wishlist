import { env } from "$env/dynamic/public";
import type { ItemPrice } from "$lib/generated/prisma/client";
import { getNumberFormatter } from "svelte-i18n";
import { defaultLang, getLocale } from "./i18n";
import { browser } from "$app/environment";

type ItemWithPrice = {
    price?: string | null;
    itemPrice?: ItemPrice | null;
};

export type LocaleConfig = {
    currencySymbol: string;
    groupSeparator: string;
    decimalSeparator: string;
    prefix: string;
    suffix: string;
};

const getMaximumFractionDigits = (currency: string, locale?: string) => {
    return getFormatter(currency, locale).resolvedOptions().maximumFractionDigits || 2;
};

export const getDefaultCurrency = () => {
    if (!env.PUBLIC_DEFAULT_CURRENCY) {
        return "USD";
    }
    try {
        new Intl.NumberFormat("en-US", { currency: env.PUBLIC_DEFAULT_CURRENCY });
    } catch {
        console.warn("Invalid currency: ", env.PUBLIC_DEFAULT_CURRENCY);
        return "USD";
    }
    return env.PUBLIC_DEFAULT_CURRENCY;
};

export const getFormatter = (currency: string | null, locale?: string) => {
    return getNumberFormatter({
        locale: locale ?? (browser ? getLocale() : defaultLang.code),
        style: "currency",
        currency: currency || getDefaultCurrency(),
        currencyDisplay: "narrowSymbol"
    });
};

export const formatPrice = (item: ItemWithPrice, locale?: string) => {
    if (!item.itemPrice) {
        return item.price;
    }

    return formatNumberAsPrice(item.itemPrice.currency, item.itemPrice.value, locale);
};

export const formatNumberAsPrice = (currency: string, price: number, locale?: string) => {
    const formatter = getFormatter(currency, locale);
    const maxFracDigits = getMaximumFractionDigits(currency, locale);

    const value = price / Math.pow(10, maxFracDigits);
    return formatter.format(value);
};

export const getPriceValue = (item: ItemWithPrice, locale?: string) => {
    if (!item.itemPrice) {
        return null;
    }
    const maxFracDigits = getMaximumFractionDigits(item.itemPrice.currency, locale);
    return item.itemPrice.value / Math.pow(10, maxFracDigits);
};

export const getMinorUnits = (value: number, currency: string, locale?: string) => {
    const maxFracDigits = getMaximumFractionDigits(currency, locale);
    return value * Math.pow(10, maxFracDigits);
};

const defaultConfig: LocaleConfig = {
    currencySymbol: "",
    groupSeparator: "",
    decimalSeparator: "",
    prefix: "",
    suffix: ""
};

export const getLocaleConfig = (formatter: Intl.NumberFormat) => {
    return formatter.formatToParts(1000.1).reduce((prev, curr, i): LocaleConfig => {
        if (curr.type === "currency") {
            if (i === 0) {
                return { ...prev, currencySymbol: curr.value, prefix: curr.value };
            } else {
                return { ...prev, currencySymbol: curr.value, suffix: curr.value };
            }
        }
        if (curr.type === "group") {
            return { ...prev, groupSeparator: curr.value };
        }
        if (curr.type === "decimal") {
            return { ...prev, decimalSeparator: curr.value };
        }

        return prev;
    }, defaultConfig);
};

// Cross-rate conversion in MAJOR currency units. `rates` are units-per-1-base
// (e.g. open.er-api's USD-based map). Returns null when either currency is
// missing from the rate table (the common "no rate for target" fallback path).
export const convertAmount = (
    amount: number,
    from: string,
    to: string,
    rates: Record<string, number>
): number | null => {
    if (from === to) return amount;
    const rFrom = rates[from];
    const rTo = rates[to];
    if (!rFrom || !rTo) return null;
    return amount * (rTo / rFrom);
};

// Formatted converted price for a single item, or null when conversion is
// disabled / not applicable / unavailable. Used to render "(≈ …)".
export const getConvertedPriceString = (
    item: ItemWithPrice,
    fx: FxData | null | undefined,
    locale?: string
): string | null => {
    if (!fx?.enabled || !item.itemPrice) return null;
    const from = item.itemPrice.currency;
    if (from === fx.targetCurrency) return null;
    const amount = getPriceValue(item, locale);
    if (amount === null) return null;
    const converted = convertAmount(amount, from, fx.targetCurrency, fx.rates);
    if (converted === null) return null;
    return getFormatter(fx.targetCurrency, locale).format(converted);
};

// Formatted converted grand total across per-currency subtotals (minor units),
// or null if conversion is disabled or ANY currency is unconvertible (a partial
// sum would be misleading). `totals` come from ListStatistics.
export const getConvertedTotalString = (
    totals: { currency: string; total: number }[],
    fx: FxData | null | undefined,
    locale?: string
): string | null => {
    if (!fx?.enabled) return null;
    let sum = 0;
    for (const { currency, total } of totals) {
        const major = total / Math.pow(10, getMaximumFractionDigits(currency, locale));
        const converted = convertAmount(major, currency, fx.targetCurrency, fx.rates);
        if (converted === null) return null;
        sum += converted;
    }
    return getFormatter(fx.targetCurrency, locale).format(sum);
};
