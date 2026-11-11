import { getServiceImage, type StoreServiceItem } from "../api/services";
import { ProductImageWithPlaceholder } from "./ImagePlaceHolder";

interface ServiceCardProps {
  service: StoreServiceItem;
  currency: string;
  onBook: (service: StoreServiceItem) => void;
}

export const ServiceCard = ({ service, currency, onBook }: ServiceCardProps) => {
  const price = parseFloat(service.amount) || 0;
  const formatAmount = (value: number) =>
    `${currency}${value.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  // Customers choose their own deposit (at least the minimum), so the badge
  // shows the minimum as a starting point rather than a fixed amount.
  const minDeposit = parseFloat(
    service.min_deposit_amount || service.deposit_amount || "",
  );
  const showDepositBadge =
    (service.payment_requirement === "DEPOSIT" ||
      service.payment_requirement === "ANY") &&
    Number.isFinite(minDeposit);

  const image = getServiceImage(service);
  const photoCount = (service.media ?? []).filter((item) => item.file).length;

  return (
    <div
      onClick={() => onBook(service)}
      className="group cursor-pointer flex flex-col"
    >
      {/* Media Container matching ProductCard */}
      <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-[#f0f0f0]">
        <div className="absolute inset-0 p-4 sm:p-6 transition-transform duration-500 group-hover:scale-105">
          {image ? (
            <ProductImageWithPlaceholder
              product={{ image, name: service.name }}
              className="w-full h-full"
              objectFit="contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700">
              <span className="font-display text-4xl sm:text-5xl font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                {service.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-[11px] font-medium text-gray-500 mt-2">
                Service
              </span>
            </div>
          )}
        </div>

        {/* Top-left badges: Duration & Category */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10 pointer-events-none">
          <span className="bg-black text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            ◷ {service.duration_display || `${service.duration} mins`}
          </span>
          {service.category && (
            <span className="bg-white text-black text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
              {service.category}
            </span>
          )}
        </div>

        {/* Top-right badges: Deposit info */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
          {photoCount > 1 && (
            <span className="bg-black/60 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {photoCount} photos
            </span>
          )}
          {showDepositBadge && (
            <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              Deposit from {formatAmount(minDeposit)}
            </span>
          )}
        </div>

      </div>

      {/* Info section matching ProductCard */}
      <div className="pt-3 sm:pt-4 px-1 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className="font-bold text-sm sm:text-base text-black truncate mb-1"
            title={service.name}
          >
            {service.name}
          </h3>

          {service.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <span className="text-base sm:text-lg font-bold text-[var(--brand-primary)]">
            {formatAmount(price)}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBook(service);
            }}
            className="min-h-9 text-xs font-semibold px-4 py-2 rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] cursor-pointer"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};
