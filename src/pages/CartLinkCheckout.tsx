import { useNavigate } from "react-router-dom";
import { HeaderSkeleton } from "../components/CardSkeleton";
import type { CartLinkIssue } from "../useCartLinkHook";
import { useCartLink } from "../useCartLinkHook";
import { useStoreTheme } from "../utils/theme";
import { getStorefrontPath } from "../utils/storefront";
import { Checkout } from "./Checkout";

const issueText = (issue: CartLinkIssue) => {
  const name = issue.name ?? "An item in this link";
  switch (issue.kind) {
    case "missing":
      return `${name} is no longer available in this store.`;
    case "out-of-stock":
      return `${name} is out of stock.`;
    case "has-options":
      return `${name} has options (like size or colour) — pick one on its page.`;
    case "reduced":
      return `Only ${issue.added} of ${name} could be added (you were sent ${issue.requested}).`;
  }
};

function IssueList({ issues }: { issues: CartLinkIssue[] }) {
  return (
    <ul className="mt-2 space-y-1 text-sm leading-6">
      {issues.map((issue) => (
        <li key={issue.productId}>• {issueText(issue)}</li>
      ))}
    </ul>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Preparing your checkout">
      <HeaderSkeleton />
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
        <div className="mb-8 h-9 w-36 rounded-full bg-[#f0f0f0]" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="h-6 w-48 rounded bg-[#f0f0f0]" />
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-12 rounded-xl bg-[#f0f0f0]" />
            ))}
          </div>
          <div className="space-y-3 rounded-2xl bg-[#fafafa] p-5">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-[#f0f0f0]" />
                <div className="h-4 flex-1 rounded bg-[#f0f0f0]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({ title, children, action, actionLabel }: { title: string; children: React.ReactNode; action: () => void; actionLabel: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="max-w-md text-center">
        <h2 className="font-display mb-2 text-2xl uppercase tracking-wide text-black sm:text-3xl">{title}</h2>
        <div className="mb-6 text-gray-600">{children}</div>
        <button onClick={action} className="rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * /o/:slug/checkout?items=<id>:<qty>,… (and /out/checkout on a custom domain):
 * the checkout link a merchant sends. Fills the cart and opens checkout directly.
 */
export default function CartLinkCheckout() {
  const navigate = useNavigate();
  const { state, retry, requestedCount, slug, storeKey } = useCartLink();
  const storeData = state.status === "ready" ? state.storeData : null;
  const { vars: themeVars } = useStoreTheme(storeData, storeKey, state.status === "ready");
  const storeHome = getStorefrontPath("out-store", slug);
  const goToStore = () => navigate(storeHome);

  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") {
    return <Message title="Couldn’t open checkout" action={retry} actionLabel="Try again">{state.message}</Message>;
  }
  if (requestedCount === 0) {
    return <Message title="This link is empty" action={goToStore} actionLabel="Browse the store">It doesn’t include any products. Ask the store for a new link, or shop the store directly.</Message>;
  }
  if (state.added === 0) {
    return (
      <div style={themeVars}>
        <Message title="These items aren’t available" action={goToStore} actionLabel="Browse the store">
          <IssueList issues={state.issues} />
        </Message>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={themeVars}>
      {state.issues.length > 0 && (
        <div role="status" className="mx-auto max-w-6xl px-4 pt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-semibold">Some items in your link need attention</p>
            <IssueList issues={state.issues} />
          </div>
        </div>
      )}
      <Checkout storeData={storeData} type="out-store" onBack={goToStore} />
    </div>
  );
}
