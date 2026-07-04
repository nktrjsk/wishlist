import { client } from "$lib/server/prisma";
import { env } from "$env/dynamic/private";
import { logger } from "./logger";

const RATE_TTL_MS = 1000 * 60 * 60 * 24; // 24h
let isRefreshing = false;

export async function getRates(): Promise<{
    base: string;
    rates: Record<string, number>;
    ratesDate: string;
    fetchedAt: Date;
} | null> {
    const row = await client.exchangeRates.findUnique({ where: { id: "global" } });

    if (!row || Date.now() - row.fetchedAt.getTime() > RATE_TTL_MS) {
        void refreshRates();
    }

    if (!row) {
        return null;
    }

    try {
        const rates = JSON.parse(row.rates);
        return { base: row.base, rates, ratesDate: row.ratesDate, fetchedAt: row.fetchedAt };
    } catch (err) {
        logger.error({ err }, "FX: failed to parse stored rates");
        return null;
    }
}

export async function refreshRates(): Promise<void> {
    if (isRefreshing) return;
    isRefreshing = true;

    try {
        const existing = await client.exchangeRates.findUnique({ where: { id: "global" } });
        if (existing && Date.now() - existing.fetchedAt.getTime() <= RATE_TTL_MS) {
            return;
        }

        const url = env.FX_PROVIDER_URL || "https://open.er-api.com/v6/latest/USD";
        const options: RequestInit = env.FX_API_KEY ? { headers: { Authorization: `Bearer ${env.FX_API_KEY}` } } : {};

        const response = await fetch(url, options);
        if (!response.ok) {
            logger.warn({ status: response.status }, "FX refresh: provider returned non-OK status");
            return;
        }

        const data = await response.json();
        if (
            data?.result !== "success" ||
            typeof data?.base_code !== "string" ||
            typeof data?.rates !== "object" ||
            data.rates === null
        ) {
            logger.warn("FX refresh: unexpected provider response");
            return;
        }

        await client.exchangeRates.upsert({
            where: { id: "global" },
            create: {
                id: "global",
                base: data.base_code,
                rates: JSON.stringify(data.rates),
                ratesDate: data.time_last_update_utc ?? "",
                fetchedAt: new Date()
            },
            update: {
                base: data.base_code,
                rates: JSON.stringify(data.rates),
                ratesDate: data.time_last_update_utc ?? "",
                fetchedAt: new Date()
            }
        });
    } catch (err) {
        logger.error({ err }, "FX refresh failed");
    } finally {
        isRefreshing = false;
    }
}

export async function getFxData(user: LocalUser | null, config: Config): Promise<FxData> {
    const targetCurrency = user?.defaultCurrency ?? config.defaultCurrency;

    if (!config.currencyConversion) {
        return { enabled: false, targetCurrency, base: null, rates: {}, ratesDate: null };
    }

    const r = await getRates();
    return {
        enabled: true,
        targetCurrency,
        base: r?.base ?? null,
        rates: r?.rates ?? {},
        ratesDate: r?.ratesDate ?? null
    };
}
