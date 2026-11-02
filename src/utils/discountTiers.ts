/**
 * Volume ("bulk") discount tiers — discount_thresholds on a product or
 * variation. Once a tier is reached, EVERY unit on the line gets it. With no
 * tiers, the older single threshold applies: `discount` percent off once
 * `discount_threshold` units are bought.
 *
 * calculateProductDiscount mirrors the backend formula so the cart shows the
 * same numbers the invoice will.
 */

export type DiscountTierType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface DiscountThreshold {
  id?: string;
  min_quantity: number;
  max_quantity?: number | null;
  discount_type: DiscountTierType;
  discount_value: number | string;
}

export interface LineDiscountResult {
  unitPrice: number;
  unitDiscount: number;
  discountedUnitPrice: number;
  totalDiscount: number;
  subtotal: number;
  appliedTier: DiscountThreshold | null;
  /** 1-based position of the applied tier. */
  appliedTierNumber: number | null;
  nextTierUpsell: {
    unitsNeeded: number;
    potentialDiscountType: DiscountTierType;
    potentialDiscountValue: number;
  } | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const sortTiers = (tiers: DiscountThreshold[] = []) =>
  [...tiers].sort((a, b) => Number(a.min_quantity) - Number(b.min_quantity));

export function calculateProductDiscount(
  sellingPrice: number,
  quantity: number,
  thresholds: DiscountThreshold[] = [],
  fallbackDiscount = 0,
  fallbackThreshold = 0,
): LineDiscountResult {
  const price = Number(sellingPrice) || 0;
  let unitDiscount = 0;
  let appliedTier: DiscountThreshold | null = null;
  let appliedTierNumber: number | null = null;
  let nextTierUpsell: LineDiscountResult["nextTierUpsell"] = null;

  if (thresholds.length > 0) {
    const sorted = sortTiers(thresholds);
    sorted.some((tier, index) => {
      const minQ = Number(tier.min_quantity);
      const maxQ =
        tier.max_quantity != null ? Number(tier.max_quantity) : Infinity;
      if (quantity >= minQ && quantity <= maxQ) {
        appliedTier = tier;
        appliedTierNumber = index + 1;
        const val = Number(tier.discount_value);
        unitDiscount =
          tier.discount_type === "PERCENTAGE"
            ? round2(price * (val / 100))
            : Math.min(val, price);
        return true;
      }
      return false;
    });

    const nextTier = sorted.find((t) => Number(t.min_quantity) > quantity);
    if (nextTier) {
      nextTierUpsell = {
        unitsNeeded: Number(nextTier.min_quantity) - quantity,
        potentialDiscountType: nextTier.discount_type,
        potentialDiscountValue: Number(nextTier.discount_value),
      };
    }
  } else if (
    fallbackDiscount > 0 &&
    fallbackThreshold > 0 &&
    quantity >= fallbackThreshold
  ) {
    // Capped: some older values were saved as naira, not percent.
    unitDiscount = Math.min(
      price,
      round2(price * (Number(fallbackDiscount) / 100)),
    );
  }

  const totalDiscount = round2(unitDiscount * quantity);
  return {
    unitPrice: price,
    unitDiscount,
    discountedUnitPrice: Math.max(0, round2(price - unitDiscount)),
    totalDiscount,
    subtotal: Math.max(0, round2(price * quantity - totalDiscount)),
    appliedTier,
    appliedTierNumber,
    nextTierUpsell,
  };
}

/** Tiers for a product or the chosen variation (variations don't inherit). */
export const tiersFor = (item: {
  discount_thresholds?: DiscountThreshold[] | null;
}): DiscountThreshold[] => item.discount_thresholds ?? [];

interface Discountable {
  selling_price?: number | null;
  discount?: number | null;
  discount_threshold?: number | null;
  discount_thresholds?: DiscountThreshold[] | null;
}

/** Discount on one cart line. Combos don't take volume discounts. */
export const cartLineDiscount = (item: {
  product: Discountable & { type?: string };
  variation?: Discountable;
  quantity: number;
}): LineDiscountResult => {
  const source = item.variation ?? item.product;
  const price =
    Number(item.variation?.selling_price || item.product.selling_price) || 0;
  if (item.product.type === "COMBO") {
    return calculateProductDiscount(price, item.quantity);
  }
  return calculateProductDiscount(
    price,
    item.quantity,
    tiersFor(source),
    Number(source.discount) || 0,
    Number(source.discount_threshold) || 0,
  );
};

/* ----------------------------------------------------------------- labels */

const naira = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

/** "10% off" or "₦500 off each". */
export const describeDiscount = (
  type: DiscountTierType,
  value: number | string,
) =>
  type === "PERCENTAGE"
    ? `${Number(value)}% off`
    : `${naira(Number(value))} off each`;

/** "5 – 9" or "20+". */
export const tierRangeLabel = (tier: DiscountThreshold) =>
  tier.max_quantity != null
    ? `${Number(tier.min_quantity)} – ${Number(tier.max_quantity)}`
    : `${Number(tier.min_quantity)}+`;
