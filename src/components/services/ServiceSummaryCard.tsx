import type { StoreServiceItem } from "../../api/services";
import { getServiceImage } from "../../api/services";
import type { ProductMedia } from "../../type";
import { ProductImageWithPlaceholder } from "../ImagePlaceHolder";
import { ProductGallery } from "../ProductGallery";

interface ServiceSummaryCardProps {
  service: StoreServiceItem;
  price: string;
  /** Show every picture (swipe + thumbnails) instead of a small cover image. */
  showGallery?: boolean;
}

/** The service's gallery in the shape the product gallery reads (types upper-cased). */
const toGalleryMedia = (service: StoreServiceItem): ProductMedia[] =>
  (service.media ?? [])
    .filter((item) => item.file)
    .map((item) => ({
      id: item.id,
      file: item.file,
      type: (item.type ?? "IMAGE").toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE",
    })) as ProductMedia[];

const Details = ({ service, price }: { service: StoreServiceItem; price: string }) => (
  <div className="min-w-0 flex-1">
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-black px-2.5 py-0.5 text-[10px] font-semibold text-white">
        ◷ {service.duration_display || `${service.duration} mins`}
      </span>
      {service.category && (
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-700">
          {service.category}
        </span>
      )}
    </div>
    <h3 className="mt-1.5 truncate text-base font-bold text-gray-900 sm:text-lg" title={service.name}>
      {service.name}
    </h3>
    {service.description && (
      <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-gray-500">{service.description}</p>
    )}
    <p className="mt-1.5 text-base font-extrabold text-[var(--brand-primary)]">{price}</p>
  </div>
);

/** The service being booked: pictures, name, description, duration and price. */
export const ServiceSummaryCard = ({ service, price, showGallery = false }: ServiceSummaryCardProps) => {
  const image = getServiceImage(service);
  const media = toGalleryMedia(service);

  if (showGallery && (media.length > 0 || image)) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="aspect-[4/3] w-full bg-[#f0f0f0] sm:aspect-video">
          <ProductGallery
            product={{ name: service.name, image: image ?? undefined, media }}
            variant="full"
            className="h-full w-full"
          />
        </div>
        <div className="p-4 sm:p-5">
          <Details service={service} price={price} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f0f0f0] sm:h-24 sm:w-24">
        {image ? (
          <ProductImageWithPlaceholder
            product={{ image, name: service.name }}
            className="h-full w-full"
            objectFit="cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold uppercase text-[var(--brand-primary)]">
            {service.name.slice(0, 2)}
          </div>
        )}
      </div>
      <Details service={service} price={price} />
    </div>
  );
};
