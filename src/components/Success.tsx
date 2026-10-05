import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { OrderSummary } from "../useCheckoutHook";
import type { StoreData } from "../type";
import useFetchData from "../useFetchDataHook";
import { useStoreTheme } from "../utils/theme";
import { getCustomStoreDomain } from "../utils/storefront";

const Success = ({ path }: { path: string }) => {
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const storeDomain = getCustomStoreDomain();
  const order = (location.state as { order?: OrderSummary } | null)?.order;

  const { data: storeData, isFromCache } = useFetchData<StoreData>({
    store_url: slug || "",
    store_domain: storeDomain,
    limit: 1,
  });
  const { theme, vars: themeVars } = useStoreTheme(
    storeData,
    slug || storeDomain,
    !isFromCache,
  );
  const brandPrimary = theme.primary;
  const currency = order?.currency || storeData?.results?.info?.currency || "₦";

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleGoHome = () =>
    navigate(storeDomain ? path : `${path}/${slug}`);

  const formatAmount = (n: number) =>
    n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-4 py-10"
      style={themeVars}
    >
      <div className="max-w-lg w-full">
        <div
          className={`bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-700 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center border-b border-gray-100">
            <div className="relative inline-block mb-4">
              <svg
                className="w-16 h-16"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill={brandPrimary}
                  style={{
                    transformOrigin: "center",
                    animation: animate
                      ? "scaleIn 0.5s ease-out forwards"
                      : "none",
                  }}
                />
                <path
                  d="M35 60 L52 77 L85 44"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: animate ? 0 : 100,
                    animation: animate
                      ? "drawCheck 0.6s 0.3s ease-out forwards"
                      : "none",
                  }}
                />
              </svg>
            </div>

            <h1 className="font-display text-2xl uppercase tracking-wide text-black mb-1">
              Order Placed Successfully
            </h1>
            <p className="text-sm text-gray-500">
              Thank you — we've received your order.
            </p>

            {order?.reference && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--brand-surface)] px-4 py-1.5">
                <span className="text-xs font-medium text-gray-500">Code</span>
                <span className="text-sm font-bold tracking-wide text-[var(--brand-primary)]">
                  {order.reference}
                </span>
              </div>
            )}
          </div>

          {order && order.items.length > 0 && (
            <>
              {/* Your Items */}
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Your Items ({order.items.length})
                </h2>
                <div className="space-y-3">
                  {order.items.map((item, i) => (
                    <div key={item.id + i} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#f0f0f0] flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-black truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.variationName ? `${item.variationName} · ` : ""}
                          x{item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-black whitespace-nowrap">
                        {currency}
                        {formatAmount(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Transaction Summary
                </h2>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>
                      {currency}
                      {formatAmount(order.subtotal)}
                    </span>
                  </div>
                  {order.shipping > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>
                        {currency}
                        {formatAmount(order.shipping)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 mt-1.5 border-t border-gray-100 font-bold text-black">
                    <span>Total</span>
                    <span className="text-[var(--brand-primary)]">
                      {currency}
                      {formatAmount(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Reassurance message */}
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 leading-relaxed text-center">
              Rest assured, one of our sales representatives will contact you
              shortly. Please check your email for updates on your order
              status.
            </p>
          </div>

          {/* CTA */}
          <div className="px-6 pb-8">
            <button
              onClick={handleGoHome}
              className="w-full bg-[var(--brand-primary)] hover:opacity-90 text-[var(--brand-on-primary)] font-medium py-3.5 rounded-full transition-all"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default Success;
