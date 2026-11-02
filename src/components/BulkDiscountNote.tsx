import { describeDiscount, type LineDiscountResult } from "../utils/discountTiers";

/**
 * Under a cart line: the volume tier now applied, and how many more units
 * reach the next one ("Add 3 more to unlock 10% off").
 */
const BulkDiscountNote = ({
  discount,
  className = "",
}: {
  discount: LineDiscountResult;
  className?: string;
}) => {
  const { appliedTier, appliedTierNumber, nextTierUpsell } = discount;
  if (!appliedTier && !nextTierUpsell) return null;

  return (
    <div className={`mt-1 space-y-0.5 text-[11px] ${className}`}>
      {appliedTier && appliedTierNumber && (
        <p className="font-semibold text-green-600">
          Bulk price: {describeDiscount(appliedTier.discount_type, appliedTier.discount_value)}{" "}
          applied
        </p>
      )}
      {nextTierUpsell && (
        <p className="text-gray-500">
          Add {nextTierUpsell.unitsNeeded} more to unlock{" "}
          <span className="font-semibold text-black">
            {describeDiscount(
              nextTierUpsell.potentialDiscountType,
              nextTierUpsell.potentialDiscountValue,
            )}
          </span>
        </p>
      )}
    </div>
  );
};

export default BulkDiscountNote;
