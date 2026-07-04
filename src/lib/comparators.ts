import type { ItemOnListDTO } from "./dtos/item-dto";
import { convertAmount, getPriceValue } from "$lib/price-formatter";

interface SortOptions {
    sort: string | null;
    dir: string | null;
    userId?: string | null;
    listOwnerId: string;
    fx?: FxData | null;
}

export function itemSorter(opts: SortOptions) {
    return (a: ItemOnListDTO, b: ItemOnListDTO) => {
        // Don't perform claim status sorting if on your own list
        if (opts.listOwnerId !== opts.userId) {
            const claimStatus = compareClaimStatus(a, b, opts.userId);
            if (claimStatus != 0) return claimStatus;
        }

        if (opts.sort === "price") {
            const reversed = opts.dir === "desc";
            const price = comparePrice(a, b, { reversed, nullsLast: reversed, fx: opts.fx });
            if (price !== 0) return price;
        }

        return compareDisplayOrder(a, b);
    };
}

export function comparePrice(
    a: ItemOnListDTO,
    b: ItemOnListDTO,
    opts?: { reversed?: boolean; nullsLast?: boolean; fx?: FxData | null }
) {
    const priceOf = (item: ItemOnListDTO): number | null => {
        if (item.itemPrice === null) return null;
        const major = getPriceValue(item);
        if (major === null) return null;
        if (opts?.fx?.enabled) {
            // Convert to the viewer's currency; null (unconvertible) sorts like no price.
            return convertAmount(major, item.itemPrice.currency, opts.fx.targetCurrency, opts.fx.rates);
        }
        // FX disabled/absent: legacy currency-naive comparison on raw minor units.
        return item.itemPrice.value;
    };

    const pa = priceOf(a);
    const pb = priceOf(b);
    if (pa === null && pb === null) return 0;
    if (pa === null) return opts?.reversed && !opts?.nullsLast ? -1 : 1;
    if (pb === null) return opts?.reversed && !opts?.nullsLast ? 1 : -1;
    const comp = pa - pb;
    return opts?.reversed ? -comp : comp;
}

export function compareDisplayOrder(a: ItemOnListDTO, b: ItemOnListDTO) {
    return (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity);
}

export function compareClaimStatus(a: ItemOnListDTO, b: ItemOnListDTO, userId?: string | null) {
    const userHasClaimedA = a.claims.find((c) => userId && c.claimedBy?.id === userId);
    const userHasClaimedB = b.claims.find((c) => userId && c.claimedBy?.id === userId);
    if (a.isClaimable && !userHasClaimedA && !(b.isClaimable && !userHasClaimedB)) {
        return -1;
    } else if (!(a.isClaimable && !userHasClaimedA) && b.isClaimable && !userHasClaimedB) {
        return 1;
    } else {
        return 0;
    }
}
