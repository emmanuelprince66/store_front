import {
  calculateProductDiscount,
  describeDiscount,
  sortTiers,
  tierRangeLabel,
  type DiscountThreshold,
} from "../utils/discountTiers";

/**
 * "Buy in bulk & save" — every volume tier with its discount and the price
 * per unit it brings, plus how many more of the chosen quantity unlock the
 * next tier. Renders nothing without tiers.
 */
const BulkPricingTable = ({
  tiers,
  price,
  quantity,
  currency = "₦",
}: {
  tiers?: DiscountThreshold[] | null;
  price: number;
  quantity: number;
  currency?: string;
}) => {
  if (!tiers?.length || !(price > 0)) return null;
  const sorted = sortTiers(tiers);
  const current = calculateProductDiscount(price, quantity, sorted);

  return (
    <div className="border-b border-gray-200 py-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900">
        Buy in bulk &amp; save
      </h2>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">Quantity</th>
              <th className="px-3 py-2 font-medium">Discount</th>
              <th className="px-3 py-2 text-right font-medium">Unit price</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tier, index) => {
              const unit = calculateProductDiscount(
                price,
                Number(tier.min_quantity),
                [tier],
              ).discountedUnitPrice;
              const active = current.appliedTierNumber === index + 1;
              return (
                <tr
                  key={tier.id ?? index}
                  className={`border-t border-gray-100 ${
                    active ? "bg-green-50 font-semibold" : ""
                  }`}
                >
                  <td className="px-3 py-2">{tierRangeLabel(tier)} pcs</td>
                  <td className="px-3 py-2 text-green-600">
                    {describeDiscount(tier.discount_type, tier.discount_value)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {currency}
                    {unit.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {current.nextTierUpsell && (
        <p className="mt-2 text-xs text-gray-500">
          Add {current.nextTierUpsell.unitsNeeded} more to unlock{" "}
          <span className="font-semibold text-black">
            {describeDiscount(
              current.nextTierUpsell.potentialDiscountType,
              current.nextTierUpsell.potentialDiscountValue,
            )}
          </span>
        </p>
      )}
    </div>
  );
};

export default BulkPricingTable;
