/**
 * Volume ("bulk") discount tiers — discount_thresholds on a product or
 * variation. Once a tier is reached, EVERY unit on the line gets it. With no
 * tiers, the older single threshold applies: `discount` percent off once
 * `discount_threshold` units are bought.
 *
 * calculateProductDiscount mirrors the backend formula so the cart shows the
 * same numbers the invoice will.
 */

/** ₦ off is "PRICE"; older data may say "FIXED_AMOUNT". Both read as ₦ off. */
export type DiscountTierType = "PERCENTAGE" | "PRICE" | "FIXED_AMOUNT";

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

interface Discountable {
  selling_price?: number | null;
  discount?: number | string | null;
  discount_threshold?: number | string | null;
  discount_thresholds?: DiscountThreshold[] | null;
}

/**
 * The tiers that apply to a product or the chosen variation (variations don't
 * inherit). The older single discount counts as one open-ended tier: a percent
 * off from its threshold, or ₦ off when over 100, since 100%+ can't be meant.
 */
export const tiersFor = (item: Discountable): DiscountThreshold[] => {
  if (item.discount_thresholds?.length) return item.discount_thresholds;
  const value = Number(item.discount);
  const threshold = Number(item.discount_threshold);
  if (!(value > 0) || !(threshold > 0)) return [];
  return [
    {
      min_quantity: threshold,
      max_quantity: null,
      discount_type: value > 100 ? "PRICE" : "PERCENTAGE",
      discount_value: value,
    },
  ];
};

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
  return calculateProductDiscount(price, item.quantity, tiersFor(source));
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
