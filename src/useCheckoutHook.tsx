import { City, Country, State } from "country-state-city";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getErrorMessage, isAbortError } from "./api/client";
import {
  PAYMENT_PIN_PATTERN,
  checkoutOutstoreLegacy,
  checkoutOutstoreShipbubble,
  confirmPayment,
  createInStoreDraft,
  isPaymentApproved,
  pollPaymentConfirmation,
  validateOtp,
  type CheckoutProduct,
  type DeliveryAddressPayload,
  type InStoreDraftItem,
  type InStoreDraftPayload,
  type InStoreDraftResponse,
  type InStorePaymentType,
  type LegacyOutstoreCheckoutPayload,
  type PaymentMethod,
  type ShipbubbleOutstoreCheckoutPayload,
} from "./api/orders";
import { ApiBase } from "./base-url";
import { CartContext } from "./context/CartContext";
import type { StoreData } from "./type";
import {
  cityCentroid,
  coordinatesPayload,
  resolveCoordinates,
  type GeocodeSuggestion,
} from "./utils/geocode";
import { getPrimaryImage } from "./utils/media";
import { usePersistedState } from "./utils/usePersistedState";
import { getCustomStoreDomain, getStoreSuccessPath } from "./utils/storefront";

// Order endpoints live at the API root (no /store), shared from base-url.ts.
const BaseUrl = ApiBase;

// Persisted under the store slug so a buyer's details survive leaving the
// checkout screen. Card numbers and payment PINs are deliberately absent —
// those stay in memory for the life of the form and nowhere else.
const ADDRESS_STORAGE_KEY = "delivery-address";
const CUSTOMER_STORAGE_KEY = "customer-details";

interface Address {
  firstName: string;
  lastName: string;
  phone: string;
  altPhone: string;
  email: string;
  shippingAddress: string;
  country: string;
  state: string;
  city: string;
  /** Delivery coordinates, kept as strings to match the API's own typing.
   * Set as a pair when the buyer picks an address suggestion; cleared as a
   * pair whenever an address field is edited by hand. */
  latitude?: string;
  longitude?: string;
}

interface CustomerDetails {
  name: string;
  /** Doubles as the Akawopay number when the buyer picks BNPL in-store. */
  phone: string;
  email: string;
  address: string;
}

// Normalized courier returned by /order/fetch_shipment_rate/.
// `location`/`description`/`amount` keep the same keys the UI already renders;
// `service_code`/`courier_id` are what the checkout endpoint needs.
interface ShippingOption {
  id: string;
  location: string; // courier name
  amount: string; // delivery fee (total)
  description: string; // ETA / delivery window
  service_code?: string;
  courier_id?: string;
  image?: string;
  currency?: string;
  rating?: number;
  discountPercentage?: number;
  codAvailable?: boolean;
  visible?: boolean;
}

interface CardDetails {
  card_number: string;
  expiry_date: string;
  cvv: string;
  card_pin: string;
}

interface BankTransferDetails {
  account_number: string;
  account_name: string;
  amount: string;
  bank_name: string;
}

// Snapshot of the just-placed order, handed to the success screen via
// navigation state — the cart is cleared right after checkout, so the
// success page can't re-derive this from live state.
export interface OrderSummaryItem {
  id: string;
  name: string;
  variationName?: string;
  image?: string;
  quantity: number;
  lineTotal: number;
}

export interface OrderSummary {
  reference: string;
  items: OrderSummaryItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
}

// Body for POST /order/fetch_shipment_rate/{business_id}/
interface ShipmentRatePayload {
  products: { product_id: string; quantity: number }[];
  address: DeliveryAddressPayload;
  note?: string;
}

/** Progress of an Akawopay authorization, surfaced to the BNPL overlay. */
export type BnplStage =
  | "idle"
  | "authorizing"
  | "approved"
  | "rejected"
  | "timeout";

interface UseCheckoutHookProps {
  type?: "in-store" | "out-store";
  storeData?: StoreData | null;
  onBack: () => void;
}

export const useCheckoutHook = ({
  type = "out-store",
  storeData,
}: UseCheckoutHookProps) => {
  const { cart, getTotalPrice, updateQuantity, clearCart } =
    useContext(CartContext);
  const subtotal = getTotalPrice();

  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const storeDomain = getCustomStoreDomain();
  const storeKey = slug || storeDomain || storeData?.results?.info?.id;

  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const closePaymentModal = () => setOpenPaymentModal(false);

  // Address state. Persisted per store: <Checkout/> unmounts whenever the
  // buyer taps back to the store or opens a product, and an address that has
  // to be retyped on every return is the single biggest drop-off in the flow.
  const [address, setAddress] = usePersistedState<Address | null>(
    storeKey,
    ADDRESS_STORAGE_KEY,
    null,
  );
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);

  // Delivery or collection. Only ever "PICKUP" when the store offers it —
  // see isPickup, which re-checks the store flag rather than trusting this.
  const [deliveryMode, setDeliveryMode] = useState<"DELIVERY" | "PICKUP">(
    "DELIVERY",
  );

  // Shipping state
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [showShippingModal, setShowShippingModal] = useState(false);

  // Dynamic shipment rates (from /order/fetch_shipment_rate/)
  const [shipmentRates, setShipmentRates] = useState<ShippingOption[]>([]);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [requestToken, setRequestToken] = useState("");
  const [shipmentReference, setShipmentReference] = useState("");

  // Customer state (for in-store) — persisted for the same reason as address.
  const [customerDetails, setCustomerDetails] =
    usePersistedState<CustomerDetails | null>(
      storeKey,
      CUSTOMER_STORAGE_KEY,
      null,
    );
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerDetails | null>(
    null,
  );

  // Other fields
  const [note, setNote] = useState("");
  const [tableRoomNumber, setTableRoomNumber] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment method state (out-store). COD is never chosen here — it's what the
  // payload falls back to when the store has online payment switched off.
  const [paymentMethod, setPaymentMethod] =
    useState<Exclude<PaymentMethod, "COD">>("BANK-TRANSFER");

  // Payment type state (in-store). The endpoint creates a draft either way;
  // this decides whether the buyer pays the cashier, transfers to a virtual
  // account, or finances it through Akawopay.
  const [inStorePaymentType, setInStorePaymentType] =
    useState<InStorePaymentType>("COUNTER");

  // Akawopay transaction PIN, 4–6 digits. Entered on the buyer's own device
  // and never persisted, logged, or included in any order snapshot.
  const [paymentPin, setPaymentPin] = useState("");

  /**
    * The Akawopay number while it has nowhere else to live.
    *
    * It used to be written straight into the delivery address / customer
    * details, which silently dropped every keystroke when those were still
    * null — the buyer typed and the field stayed empty. Held here first, so
    * typing always works, and mirrored into the saved details when they exist.
    * Null means "whatever phone the order already carries".
    */
  const [bnplPhoneDraft, setBnplPhoneDraft] = useState<string | null>(null);

  // BNPL authorization progress, driving the polling overlay.
  const [bnplStage, setBnplStage] = useState<BnplStage>("idle");
  const [bnplMessage, setBnplMessage] = useState("");

  // The in-store draft the buyer takes to the counter. Once set, the checkout
  // screen hands over to the counter pass.
  const [inStoreDraft, setInStoreDraft] = useState<InStoreDraftResponse | null>(
    null,
  );

  /** The number Akawopay is charged against, typed or inherited. */
  const akawopayPhone =
    bnplPhoneDraft ??
    (type === "in-store" ? customerDetails?.phone : address?.phone) ??
    "";

  // Card details state
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    card_number: "",
    expiry_date: "",
    cvv: "",
    card_pin: "",
  });

  // Bank transfer modal state
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [bankTransferDetails, setBankTransferDetails] =
    useState<BankTransferDetails | null>(null);
  const [paymentSuccessOrder, setPaymentSuccessOrder] =
    useState<OrderSummary | null>(null);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);

  // OTP modal state (for card payments)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");

  // Location data
  const [countryList] = useState(() => Country.getAllCountries());
  const [stateList, setStateList] = useState<any[]>([]);
  const [cityList, setCityList] = useState<any[]>([]);

  // When the business has Shipbubble enabled, couriers come from the live
  // rate call; otherwise we fall back to the store's static shipping options.
  const isShipbubble = storeData?.results?.info?.shipbubble === true;

  // Collection is opt-in per merchant. Absent on older API builds, so anything
  // but an explicit true keeps the option hidden — offering collection at a
  // store that doesn't do it sends the buyer to a counter that won't serve.
  const allowsPickup = storeData?.results?.info?.allow_pickup === true;
  const isPickup = allowsPickup && deliveryMode === "PICKUP";

  /** Where to collect. Falls back to the store's own address lines. */
  const pickupAddress =
    storeData?.results?.info?.pickup_address ||
    [
      storeData?.results?.info?.street,
      storeData?.results?.info?.city,
      storeData?.results?.info?.state,
    ]
      .filter(Boolean)
      .join(", ");

  // The backend only reports true when the merchant enabled BNPL *and* passed
  // Tier-3 KYC, so this single flag is enough to gate the option. Older API
  // builds omit the field entirely — anything but an explicit true is off,
  // because offering BNPL a store can't honour fails at submit.
  const isBnplAvailable = storeData?.results?.info?.enable_bnpl === true;

  const allowsOnlinePayment =
    storeData?.results?.info?.allow_online_payment ?? true;

  const resolveInStorePaymentType = (): InStorePaymentType => {
    if (inStorePaymentType === "ONLINE" && !allowsOnlinePayment)
      return "COUNTER";
    if (inStorePaymentType === "BNPL" && !isBnplAvailable) return "COUNTER";
    return inStorePaymentType;
  };

  const staticShippingOptions: ShippingOption[] = (
    storeData?.results?.shipping || []
  )
    .filter((s) => s.visible)
    .map((s) => ({
      id: s.id,
      location: s.location,
      amount: s.amount,
      description: s.description,
    }));

  // Cheapest delivery option first. Copied before sorting so fetched rates aren't mutated.
  const shippingOptions: ShippingOption[] = [
    ...(isShipbubble ? shipmentRates : staticShippingOptions),
  ].sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));

  const emptyAddress: Address = {
    firstName: "",
    lastName: "",
    phone: "",
    altPhone: "",
    email: "",
    shippingAddress: "",
    country: "",
    state: "",
    city: "",
  };

  const emptyCustomer: CustomerDetails = {
    name: "",
    phone: "",
    email: "",
    address: "",
  };

  const currentAddressForm = editAddress || emptyAddress;
  const currentCustomerForm = editCustomer || emptyCustomer;

  // Format currency
  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Calculate total
  // Collection has no courier and no fee, so the basket IS the total.
  const shippingCost =
    type === "out-store" && !isPickup
      ? parseFloat(selectedShipping?.amount || "0")
      : 0;
  const total = subtotal + shippingCost;

  // Editing any of these invalidates a pinned point. Phone/email/name don't —
  // they aren't part of the location.
  const LOCATION_FIELDS: (keyof Address)[] = [
    "shippingAddress",
    "country",
    "state",
    "city",
  ];

  // Handle form changes
  const handleFormChange = (field: keyof Address, value: string) => {
    setEditAddress((prev) => {
      const next = {
        ...(prev || emptyAddress),
        [field]: value,
      };
      // Coordinates describe the address they were resolved from. Once the
      // buyer edits the location by hand they're stale, and stale coordinates
      // are worse than none — they'd send the rider to the previous address.
      // buildAddressPayload falls back to a centroid, so nothing is lost.
      if (LOCATION_FIELDS.includes(field)) {
        next.latitude = "";
        next.longitude = "";
      }
      return next;
    });
  };

  // Applies a picked address suggestion as one atomic update. The form holds
  // ISO codes for country/state, so resolved names are mapped back first.
  const applyAddressSuggestion = (suggestion: GeocodeSuggestion) => {
    setEditAddress((prev) => {
      const base = prev || emptyAddress;

      const countryCode = suggestion.countryCode || base.country;
      const matchedState = countryCode
        ? State.getStatesOfCountry(countryCode).find(
            (s) =>
              s.isoCode === suggestion.stateCode ||
              s.name.toLowerCase() === suggestion.state.toLowerCase(),
          )
        : undefined;

      return {
        ...base,
        shippingAddress: suggestion.address || suggestion.label,
        country: countryCode,
        state: matchedState?.isoCode || base.state,
        city: suggestion.city || base.city,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      };
    });
  };

  const handleCustomerFormChange = (
    field: keyof CustomerDetails,
    value: string,
  ) => {
    setEditCustomer((prev) => ({
      ...(prev || emptyCustomer),
      [field]: value,
    }));
  };

  // Handle card details change
  const handleCardDetailsChange = (field: keyof CardDetails, value: string) => {
    setCardDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle country/state/city changes.
  //
  // These previously blanked the dependent fields on EVERY run, which broke
  // two things: editing a saved address wiped its state/city on open, and an
  // address suggestion (which sets country, state and city together) had its
  // state/city erased a tick later by the country effect. Clearing now only
  // happens on a genuine change away from a previously-set value — which is
  // the case the reset actually exists for (a buyer switching country must
  // not keep a state belonging to the old one).
  const prevCountryRef = useRef<string>("");
  const prevStateRef = useRef<string>("");

  useEffect(() => {
    const country = currentAddressForm.country;
    const prevCountry = prevCountryRef.current;
    prevCountryRef.current = country;

    if (!country) {
      setStateList([]);
      return;
    }

    setStateList(State.getStatesOfCountry(country));

    if (prevCountry && prevCountry !== country) {
      handleFormChange("state", "");
      handleFormChange("city", "");
    }
  }, [currentAddressForm.country]);

  useEffect(() => {
    const { country, state } = currentAddressForm;
    const prevState = prevStateRef.current;
    prevStateRef.current = state;

    if (!country || !state) {
      setCityList([]);
      return;
    }

    setCityList(City.getCitiesOfState(country, state));

    if (prevState && prevState !== state) {
      handleFormChange("city", "");
    }
  }, [currentAddressForm.state, currentAddressForm.country]);

  // Handle address save
  const handleAddressSave = (newAddress: Address) => {
    // Collection needs someone to hand the goods to, not somewhere to send
    // them: name, phone and email only.
    const missingContact =
      !newAddress.firstName || !newAddress.phone || !newAddress.email;
    const missingDestination =
      !isPickup && (!newAddress.country || !newAddress.state);

    if (missingContact || missingDestination) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAddress.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setAddress(newAddress);
    setShowAddressModal(false);
    setEditAddress(null);
    toast.success("Delivery details saved successfully");

  };

  // Handle customer save
  const handleCustomerSave = (details: CustomerDetails) => {
    if (!details.name || !details.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCustomerDetails(details);
    setShowCustomerModal(false);
    setEditCustomer(null);
    toast.success("Customer details saved successfully");
  };

  // Handle shipping select (inline — selection is shown visually)
  const handleShippingSelect = (option: ShippingOption) => {
    setSelectedShipping(option);
  };

  // Handle coupon apply
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    console.log("Apply coupon:", couponCode);
    toast.info("Coupon feature coming soon!");
  };

  /**
   * BNPL needs a PIN and a phone number Akawopay recognises. Checking here
   * keeps the buyer from burning a round-trip (and, on a wrong PIN, an
   * attempt against their Akawopay account) on something we can see is wrong.
   */
  const validateBnpl = (phone: string | undefined): boolean => {
    if (!PAYMENT_PIN_PATTERN.test(paymentPin)) {
      toast.error("Enter your 4 to 6 digit Akawopay PIN");
      return false;
    }
    if (!phone?.trim()) {
      toast.error("A phone number registered with Akawopay is required");
      return false;
    }
    return true;
  };

  // Validate checkout
  const validateCheckout = (): boolean => {
    const allowOnlinePayment =
      storeData?.results?.info?.allow_online_payment ?? true;

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return false;
    }

    if (type === "out-store") {
      if (!address) {
        toast.error("Please add delivery details");
        return false;
      }
      if (!isPickup && !selectedShipping) {
        toast.error("Please select a shipping method");
        return false;
      }

      // Only validate card details if online payment is allowed and payment method is CARD
      if (allowOnlinePayment && paymentMethod === "CARD") {
        if (
          !cardDetails.card_number ||
          !cardDetails.expiry_date ||
          !cardDetails.cvv ||
          !cardDetails.card_pin
        ) {
          toast.error("Please fill in all card details");
          return false;
        }
        // Validate card number length
        if (cardDetails.card_number.length < 15) {
          toast.error("Please enter a valid card number");
          return false;
        }
        // Validate expiry date format (MMYY)
        if (cardDetails.expiry_date.length !== 4) {
          toast.error("Please enter expiry date in MMYY format");
          return false;
        }
        // Validate CVV
        if (cardDetails.cvv.length !== 3) {
          toast.error("Please enter a valid CVV");
          return false;
        }
        // Validate PIN
        if (cardDetails.card_pin.length !== 4) {
          toast.error("Please enter a valid 4-digit PIN");
          return false;
        }
      }

      if (allowOnlinePayment && paymentMethod === "BNPL") {
        if (!validateBnpl(address?.phone)) return false;
      }
    } else {
      if (!customerDetails) {
        toast.error("Please add customer details");
        return false;
      }

      if (resolveInStorePaymentType() === "BNPL") {
        if (!validateBnpl(customerDetails.phone)) return false;
      }
    }

    return true;
  };

  // Build products array for payload
  const buildProductsArray = (): CheckoutProduct[] => {
    return cart.map((item) => {
      const unitPrice =
        item.variation?.selling_price ||
        item.product.selling_price ||
        item.variation?.cost_price ||
        item.product.cost_price ||
        0;

      const discount = item.variation?.discount || item.product.discount || 0;
      const isCombo = item.product.type === "COMBO";

      return {
        product_id: item?.variation ? item.variation.id : item.product.id,
        variation_id: item.variation?.id,
        ...(isCombo ? {} : { quantity: item.quantity }),
        unit_price: unitPrice,
        discount: discount,
      };
    });
  };

  // Snapshot the cart into an order summary for the success screen — must be
  // called before clearCart()/resetCheckoutState() wipes the cart state.
  const buildOrderSummary = (reference: string): OrderSummary => {
    const items: OrderSummaryItem[] = cart.map((item) => {
      const unitPrice =
        item.variation?.selling_price || item.product.selling_price || 0;

      return {
        id: item.variation?.id || item.product.id,
        name: item.product.name,
        variationName: item.variation?.name,
        image: getPrimaryImage(item.product),
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const shipping = parseFloat(selectedShipping?.amount || "0");

    return {
      reference,
      items,
      subtotal,
      shipping,
      total,
      currency: storeData?.results?.info?.currency || "₦",
    };
  };

  // Shipbubble rejects emojis, abbreviations and the symbols (_-+/'#).
  const sanitizeAddressText = (v: string) =>
    (v || "")
      // strip emojis / pictographs / flags
      .replace(
        /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu,
        "",
      )
      // strip disallowed symbols: _ + / ' # and hyphen
      .replace(/[_+/'#-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // Build the delivery address in the shape the API expects.
  // ISO codes from the form (e.g. "NG"/"LA") must be sent as full names.
  const buildAddressPayload = (src: Address): DeliveryAddressPayload => {
    const countryName =
      Country.getCountryByCode(src.country)?.name || src.country || "";
    const stateName =
      State.getStateByCodeAndCountry(src.state, src.country)?.name ||
      src.state ||
      "";

    // Coordinates the buyer pinned via autocomplete, else the city/state
    // centroid derived offline from country-state-city. Kilometre-level
    // accuracy still answers Shipbubble's serviceability and zone questions
    // even though it won't guide the final approach.
    const coords = resolveCoordinates(
      { latitude: src.latitude, longitude: src.longitude },
      cityCentroid(src.country, src.state, src.city),
    );

    return {
      first_name: sanitizeAddressText(src.firstName),
      last_name: sanitizeAddressText(src.lastName),
      phone: src.phone || "",
      alt_phone: src.altPhone || null,
      email: src.email || "",
      country: countryName,
      state: stateName,
      city: src.city ? sanitizeAddressText(src.city) : null,
      shipping_address: sanitizeAddressText(src.shippingAddress),
      ...coordinatesPayload(coords),
    };
  };

  // ---- Shipment rates -------------------------------------------------
  // Maps a Shipbubble courier object to our ShippingOption.
  const normalizeCourier = (c: any, idx: number): ShippingOption => ({
    id: String(c?.service_code ?? c?.courier_id ?? idx),
    location: c?.courier_name ?? "Courier",
    amount: String(c?.total ?? c?.rate_card_amount ?? 0),
    description: c?.delivery_eta ?? "",
    service_code: c?.service_code ?? c?.courier_id,
    courier_id: c?.courier_id,
    image: c?.courier_image,
    currency: c?.currency ?? "NGN",
    rating: typeof c?.ratings === "number" ? c.ratings : undefined,
    discountPercentage: c?.discount?.percentage ?? 0,
    codAvailable: !!c?.is_cod_available,
  });

  /**
   * @param keepServiceCode Re-select this courier if it's still offered, so a
   *   refetch the buyer didn't ask for doesn't make them pick delivery again.
   */
  const fetchShipmentRates = async (
    deliveryAddress: Address,
    keepServiceCode?: string,
  ) => {
    const businessId = storeData?.results?.info?.id;
    if (!businessId) {
      toast.error("Store information not available");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsFetchingRates(true);
    setRatesError(null);
    setShipmentRates([]);
    setSelectedShipping(null);

    const payload: ShipmentRatePayload = {
      products: cart.map((item) => ({
        product_id: item.variation ? item.variation.id : item.product.id,
        quantity: item.quantity,
      })),
      address: buildAddressPayload(deliveryAddress),
      note: note || undefined,
    };

    try {
      const response = await fetch(
        `${BaseUrl}/order/fetch_shipment_rate/${businessId}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Could not fetch delivery rates");
      }

      console.log("shipment rate response:", data);

      // Resilient parsing — couriers/token/reference may be nested under `data`.
      const root = data?.data ?? data ?? {};
      const couriers: any[] =
        root.couriers ?? root.rates ?? root.results ?? root.data ?? [];

      setRequestToken(root.request_token ?? data?.request_token ?? "");
      setShipmentReference(root.reference ?? data?.reference ?? "");

      const normalized = (Array.isArray(couriers) ? couriers : []).map(
        normalizeCourier,
      );
      setShipmentRates(normalized);

      if (keepServiceCode) {
        const kept = normalized.find(
          (option) => option.service_code === keepServiceCode,
        );
        if (kept) setSelectedShipping(kept);
      }

      if (normalized.length === 0) {
        setRatesError("No delivery options available for this address");
      }
    } catch (error: any) {
      console.error("fetch shipment rate error:", error);
      setRatesError(error.message || "Could not fetch delivery rates");
      toast.error(error.message || "Could not fetch delivery rates");
    } finally {
      setIsFetchingRates(false);
    }
  };

  /**
   * Re-quote delivery whenever the address changes.
   *
   * Rates are quoted for one specific address and pinned into a request_token,
   * so any edit — a different street, a corrected phone, or coming back from
   * Store Pick-up — makes the quote we are holding wrong. Driven by an effect
   * rather than the save handler so it covers EVERY route an address can
   * change by, not just the modal.
   *
   * Debounced because the Akawopay phone field writes into the address on each
   * keystroke, and a rate call per character would hammer the endpoint. The
   * signature check keeps a re-render from re-quoting an unchanged address.
   */
  const ratesSignatureRef = useRef("");

  useEffect(() => {
    if (type !== "out-store" || !isShipbubble || isPickup || !address) return;

    const signature = JSON.stringify([
      address.firstName,
      address.lastName,
      address.phone,
      address.email,
      address.shippingAddress,
      address.country,
      address.state,
      address.city,
      address.latitude,
      address.longitude,
    ]);
    if (signature === ratesSignatureRef.current) return;

    const timer = setTimeout(() => {
      ratesSignatureRef.current = signature;
      // Keep the courier they already picked if it survives the re-quote.
      fetchShipmentRates(address, selectedShipping?.service_code);
    }, 700);

    return () => clearTimeout(timer);
  }, [type, isShipbubble, isPickup, address, selectedShipping?.service_code]);

  /**
   * Method-specific credentials, shared by both out-store endpoints.
   *
   * Card and BNPL fields are mutually exclusive — sending a stale card number
   * alongside a BNPL request would push the buyer's PAN to an endpoint that
   * has no business seeing it.
   */
  const buildPaymentFields = (method: PaymentMethod) => {
    if (method === "CARD") {
      return {
        card_number: cardDetails.card_number,
        expiry_date: cardDetails.expiry_date,
        card_pin: cardDetails.card_pin,
        cvv: cardDetails.cvv,
      };
    }
    if (method === "BNPL") {
      return { payment_pin: paymentPin };
    }
    return {};
  };

  /** The method actually sent: a store with online payment off is always COD. */
  const resolvePaymentMethod = (): PaymentMethod => {
    const allowOnlinePayment =
      storeData?.results?.info?.allow_online_payment ?? true;
    return allowOnlinePayment ? paymentMethod : "COD";
  };

  // Build outstore checkout payload (NewOutdoorCheckout — Shipbubble)
  const buildOutstorePayload = (): ShipbubbleOutstoreCheckoutPayload => {
    const method = resolvePaymentMethod();

    return {
      request_token: requestToken,
      service_code: selectedShipping?.service_code || "",
      courier_id: selectedShipping?.courier_id || "",
      payment_method: method,
      ...buildPaymentFields(method),
    };
  };

  // Build legacy outstore payload (static shipping, no Shipbubble)
  const buildLegacyOutstorePayload = (): LegacyOutstoreCheckoutPayload => {
    const method = resolvePaymentMethod();

    return {
      products: buildProductsArray(),
      address: address
        ? buildAddressPayload(
            // Same reason as in-store: BNPL charges the order's phone, so the
            // edited number has to be the one that goes up.
            method === "BNPL" && akawopayPhone
              ? { ...address, phone: akawopayPhone }
              : address,
          )
        : ({} as DeliveryAddressPayload),
      note: note || undefined,
      // Collection declares itself and carries no courier; delivery keeps the
      // shape it has always posted.
      ...(isPickup
        ? { delivery_type: "PICKUP" as const }
        : { shipping_id: selectedShipping?.id || "" }),
      payment_method: method,
      ...buildPaymentFields(method),
    };
  };

  /**
   * Cart lines in the shape the in-store draft endpoint expects.
   *
   * Two differences from the out-store `products` array, both of which the
   * previous payload got wrong and which caused the endpoint to reject it:
   *   - the key is `items`, and quantities are decimal *strings*;
   *   - a variation goes in `variation_id` with its PARENT in `product_id`.
   *     The old code put the variation UUID in `product_id`, so the backend
   *     looked up a product that doesn't exist.
   */
  const buildInStoreItems = (): InStoreDraftItem[] =>
    cart.map((item) => {
      const unitPrice =
        item.variation?.selling_price ??
        item.product.selling_price ??
        item.variation?.cost_price ??
        item.product.cost_price ??
        0;

      const discount = item.variation?.discount ?? item.product.discount ?? 0;

      return {
        product_id: item.product.id,
        // Sent for combos too. The out-store payload omits quantity on combos
        // because that endpoint derives it, but `quantity` is required here —
        // and a buyer who adds three of the same combo means three, not one.
        quantity: item.quantity.toFixed(2),
        variation_id: item.variation?.id ?? null,
        unit_price: unitPrice.toFixed(2),
        discount: discount.toFixed(2),
      };
    });

  // Build instore draft payload
  const buildInStoreDraftPayload = (): InStoreDraftPayload => {
    const paymentType = resolveInStorePaymentType();

    return {
      items: buildInStoreItems(),
      payment_type: paymentType,
      ...(paymentType === "BNPL" ? { payment_pin: paymentPin } : {}),
      customer_name: customerDetails?.name,
      // Akawopay identifies the buyer by this number, so a Pay Later order
      // sends the one typed into the PIN panel rather than the saved contact.
      customer_phone:
        (paymentType === "BNPL" ? akawopayPhone : customerDetails?.phone) ||
        undefined,
      customer_email: customerDetails?.email || undefined,
      customer_address: customerDetails?.address || undefined,
      table_or_room: tableRoomNumber || undefined,
      note: note || undefined,
    };
  };

  // Handle OTP validation
  const handleOtpValidation = async (otp: string) => {
    if (!paymentReference) {
      toast.error("Payment reference not found");
      return;
    }

    setIsProcessing(true);

    try {
      const data = await validateOtp(paymentReference, otp);

      toast.success("Payment verified successfully!");

      // Snapshot the order before resetCheckoutState() wipes the cart.
      const orderSummary = buildOrderSummary(
        data.reference || paymentReference,
      );

      setShowOtpModal(false);
      resetCheckoutState();
      setPaymentSuccessOrder(orderSummary);
      setShowPaymentSuccessModal(true);
    } catch (error: unknown) {
      console.error("OTP validation error:", error);
      toast.error(
        getErrorMessage(error, "Failed to validate OTP. Please try again."),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bank transfer confirmation
  const handleConfirmBankTransfer = async () => {
    if (!paymentReference) {
      toast.error("Payment reference not found");
      return;
    }

    setIsProcessing(true);

    try {
      const confirmation = await confirmPayment(paymentReference);

      // A transfer that has not landed yet is a PENDING value, not an error —
      // the buyer just tapped "I have paid" before the bank settled.
      if (!isPaymentApproved(confirmation.status)) {
        toast.info(
          confirmation.detail ||
            "We haven't seen your transfer yet. Give it a moment and try again.",
        );
        return;
      }

      toast.success("Payment confirmed! Your order is being processed.");

      const orderSummary = buildOrderSummary(
        confirmation.order_reference ||
          confirmation.reference ||
          paymentReference,
      );

      setShowBankTransferModal(false);
      resetCheckoutState();
      setPaymentSuccessOrder(orderSummary);
      setShowPaymentSuccessModal(true);
    } catch (error: unknown) {
      console.error("Payment confirmation error:", error);
      toast.error(
        getErrorMessage(
          error,
          "Unable to confirm payment at this time. Please try again in a few moments.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const closePaymentSuccessModal = () => {
    if (!paymentSuccessOrder) return;

    setShowPaymentSuccessModal(false);
    navigate(getStoreSuccessPath(type, slug), {
      state: { order: paymentSuccessOrder },
    });
  };

  // Reset state after successful order.
  //
  // Deliberately keeps the buyer's saved details. Only the basket and the
  // payment fields are cleared — someone ordering again shouldn't retype their
  // name, phone and address every time, and on a personal phone that is the
  // whole point of saving them. Card numbers and PINs are never persisted, so
  // nothing sensitive outlives the order either way.
  const resetCheckoutState = () => {
    clearCart();
    setSelectedShipping(null);
    setNote("");
    setTableRoomNumber("");
    setCouponCode("");
    setCardDetails({
      card_number: "",
      expiry_date: "",
      cvv: "",
      card_pin: "",
    });
    setPaymentPin("");
    setPaymentReference("");
    setInStoreDraft(null);
    setBnplStage("idle");
    setBnplMessage("");
    setShipmentRates([]);
    setRequestToken("");
    setShipmentReference("");
    setRatesError(null);
  };

  // ---- BNPL -----------------------------------------------------------

  // Lets an unmount cancel an in-flight poll instead of leaving it running
  // for another minute and a half against a screen nobody is looking at.
  const bnplAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => bnplAbortRef.current?.abort(), []);

  /**
   * Waits out an Akawopay decision.
   *
   * The cart is deliberately left intact until approval lands: a declined or
   * timed-out application must leave the buyer able to switch to card or
   * transfer without rebuilding their basket.
   */
  const awaitBnplAuthorization = async (reference: string) => {
    const orderSummary = buildOrderSummary(reference);

    bnplAbortRef.current?.abort();
    const controller = new AbortController();
    bnplAbortRef.current = controller;

    setBnplStage("authorizing");
    setBnplMessage("Securing your installment plan with Akawopay...");

    try {
      const result = await pollPaymentConfirmation(reference, {
        signal: controller.signal,
      });

      if (result.outcome === "APPROVED") {
        setBnplStage("approved");
        toast.success("BNPL order confirmed! Your installment plan is active.");
        resetCheckoutState();
        navigate(getStoreSuccessPath(type, slug), {
          state: { order: orderSummary },
        });
        return;
      }

      if (result.outcome === "REJECTED") {
        setBnplStage("rejected");
        setBnplMessage(
          result.confirmation.detail ||
            "Your BNPL request was declined by Akawopay. Please choose another payment method.",
        );
        return;
      }

      setBnplStage("timeout");
      setBnplMessage(
        "Akawopay is still processing your request. You'll receive an SMS once it completes.",
      );
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      console.error("BNPL polling error:", error);
      setBnplStage("timeout");
      setBnplMessage(
        getErrorMessage(
          error,
          "We couldn't reach Akawopay. You'll receive an SMS once your request completes.",
        ),
      );
    }
  };

  /** Dismisses the BNPL overlay so the buyer can pick another method. */
  const dismissBnpl = () => {
    bnplAbortRef.current?.abort();
    setBnplStage("idle");
    setBnplMessage("");
    setPaymentPin("");
  };

  /**
   * Closes the counter pass once the buyer is done with it.
   *
   * This is the only point at which an in-store basket is cleared for a
   * COUNTER or ONLINE draft: the storefront never learns that the cashier
   * finalized the sale, so the buyer saying "done" is the best signal there
   * is. Until then the cart stays put, in case the draft expires or the
   * authorization is declined and they need to start over.
   */
  const dismissInStoreDraft = () => {
    bnplAbortRef.current?.abort();
    resetCheckoutState();
  };

  /**
   * Leaves an expired counter pass WITHOUT losing the basket.
   *
   * Unlike dismissInStoreDraft this keeps the cart and customer details: the
   * code died, the shopping didn't, and making someone re-add every item
   * because they queued too long would be punishing them for our timeout.
   */
  const reopenInStoreCheckout = () => {
    bnplAbortRef.current?.abort();
    setInStoreDraft(null);
    setBnplStage("idle");
    setBnplMessage("");
    setPaymentPin("");
  };

  // ---- Order placement -------------------------------------------------

  /**
   * In-store: creates a draft and hands the buyer a code for the counter.
   *
   * This endpoint no longer completes a sale. It reserves the basket and
   * returns a code the cashier looks up and finalizes, so the cart is kept
   * until the buyer dismisses the counter pass — except on an approved BNPL
   * charge, which is already a real order.
   */
  const placeInStoreOrder = async (businessId: string) => {
    const draft = await createInStoreDraft(
      businessId,
      buildInStoreDraftPayload(),
    );

    setInStoreDraft(draft);

    if (resolveInStorePaymentType() === "BNPL") {
      toast.info("Authorizing with Akawopay...");
      // Fire-and-forget: the counter pass renders immediately and updates its
      // badge when this resolves, so a slow Akawopay never blocks the screen
      // the buyer needs in front of the cashier.
      void pollInStoreBnpl(draft);
      return;
    }

    toast.success("Order created! Show your code at the counter.");
  };

  /**
   * Tracks an in-store BNPL authorization in the background.
   *
   * The order_code doubles as the payment reference here — confirmed by the
   * backend team: buyer screens poll confirm_payment with it, while cashiers
   * use instore-lookup. If the poll fails anyway the badge falls back to
   * "show the cashier", and the cashier's lookup stays the source of truth.
   */
  const pollInStoreBnpl = async (draft: InStoreDraftResponse) => {
    bnplAbortRef.current?.abort();
    const controller = new AbortController();
    bnplAbortRef.current = controller;

    setBnplStage("authorizing");

    try {
      const result = await pollPaymentConfirmation(draft.order_code, {
        signal: controller.signal,
      });

      if (result.outcome === "APPROVED") {
        setBnplStage("approved");
        setInStoreDraft({
          ...draft,
          status: "BNPL_APPROVED",
          bnpl_status: "APPROVED",
        });
        // Approved means the order exists — the basket has served its purpose.
        clearCart();
        return;
      }

      if (result.outcome === "REJECTED") {
        setBnplStage("rejected");
        setBnplMessage(
          result.confirmation.detail ||
            "Akawopay declined this request. Please pay the cashier instead.",
        );
        setInStoreDraft({
          ...draft,
          status: "BNPL_REJECTED",
          bnpl_status: "REJECTED",
        });
        return;
      }

      setBnplStage("timeout");
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      console.error("In-store BNPL polling error:", error);
      setBnplStage("timeout");
    }
  };

  /** Out-store: submits to whichever checkout endpoint the store is set up for. */
  const placeOutStoreOrder = async (businessId: string) => {
    const allowOnlinePayment =
      storeData?.results?.info?.allow_online_payment ?? true;
    const method = resolvePaymentMethod();

    let data;

    // Collection bypasses couriers for every store, Shipbubble included, so it
    // always goes to the legacy endpoint — there is no rate call to reference.
    if (isShipbubble && !isPickup) {
      // The Shipbubble flow needs the reference from fetch_shipment_rate.
      if (!shipmentReference) {
        toast.error("Please select a delivery option first");
        return;
      }
      data = await checkoutOutstoreShipbubble(
        shipmentReference,
        buildOutstorePayload(),
      );
    } else {
      data = await checkoutOutstoreLegacy(
        businessId,
        buildLegacyOutstorePayload(),
      );
    }

    // BNPL resolves asynchronously via webhook — hand off to the poller.
    if (method === "BNPL") {
      if (!data.reference) {
        throw new Error("Akawopay did not return a payment reference");
      }
      await awaitBnplAuthorization(data.reference);
      return;
    }

    // Store takes payment offline.
    if (!allowOnlinePayment) {
      toast.success(
        "Order placed successfully! The business will reach out to you for payment.",
      );
      const orderSummary = buildOrderSummary(data.reference || "");
      resetCheckoutState();
      setPaymentSuccessOrder(orderSummary);
      setShowPaymentSuccessModal(true);
      return;
    }

    if (method === "BANK-TRANSFER") {
      if (!data.bank_details && !data.account_number) {
        throw new Error("The store did not return transfer details");
      }

      setBankTransferDetails({
        account_number:
          data.account_number || data.bank_details?.account_number || "",
        account_name:
          data.account_name || data.bank_details?.account_name || "",
        amount: data.amount || data.bank_details?.amount || total.toString(),
        bank_name: data.bank_name || data.bank_details?.bank_name || "VFD Bank",
      });

      if (data.reference) setPaymentReference(data.reference);
      setShowBankTransferModal(true);
      toast.success("Order placed! Please complete the bank transfer.");
      return;
    }

    if (method === "CARD") {
      if (data.message === "otp" && data.reference) {
        setPaymentReference(data.reference);
        setShowOtpModal(true);
        toast.info("Please enter the OTP sent to your phone");
        return;
      }

      if (data.message === "success" || data.reference) {
        toast.success("Payment successful!");
        const orderSummary = buildOrderSummary(data.reference || "");
        resetCheckoutState();
        setPaymentSuccessOrder(orderSummary);
        setShowPaymentSuccessModal(true);
        return;
      }

      throw new Error("Unexpected payment response");
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!validateCheckout()) return;

    if (!storeData?.results?.info) {
      toast.error("Store information not available");
      return;
    }

    const businessId = storeData.results.info.id || "";
    setIsProcessing(true);

    try {
      if (type === "in-store") {
        await placeInStoreOrder(businessId);
      } else {
        await placeOutStoreOrder(businessId);
      }
    } catch (error: unknown) {
      console.error("Order error:", error);
      toast.error(
        getErrorMessage(error, "Failed to place order. Please try again."),
      );
      setBnplStage("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle external payment (if still needed for other providers)
  const handleExternalPayment = async () => {
    if (!validateCheckout()) return;

    if (!storeData?.results?.info) {
      toast.error("Store information not available");
      return;
    }

    setOpenPaymentModal(true);
  };

  return {
    // State
    cart,
    subtotal,
    total,
    address,
    selectedShipping,
    customerDetails,
    note,
    tableRoomNumber,
    couponCode,
    isProcessing,
    paymentMethod,
    cardDetails,

    // BNPL
    isBnplAvailable,
    inStorePaymentType,
    setInStorePaymentType,
    paymentPin,
    setPaymentPin,
    bnplStage,
    bnplMessage,
    dismissBnpl,

    // In-store counter pass
    inStoreDraft,
    dismissInStoreDraft,
    reopenInStoreCheckout,

    // Modals
    showAddressModal,
    showShippingModal,
    showCustomerModal,
    showBankTransferModal,
    showPaymentSuccessModal,
    showOtpModal,
    setShowAddressModal,
    setShowShippingModal,
    setShowCustomerModal,
    setShowBankTransferModal,
    setShowOtpModal,

    // Forms
    editAddress,
    editCustomer,
    currentAddressForm,
    currentCustomerForm,
    setEditAddress,
    setEditCustomer,

    // Location data
    countryList,
    stateList,
    cityList,

    // Options
    shippingOptions,
    bankTransferDetails,
    paymentSuccessOrder,
    paymentReference,

    // Delivery vs collection
    allowsPickup,
    isPickup,
    pickupAddress,
    setDeliveryMode,

    // Shipment rates
    isShipbubble,
    isFetchingRates,
    ratesError,
    refetchShipmentRates: () => address && fetchShipmentRates(address),

    // Akawopay phone — see bnplPhoneDraft.
    akawopayPhone,
    updateBnplPhone: (phone: string) => {
      // Kept here first so typing works even with no saved details yet.
      setBnplPhoneDraft(phone);
      // Then mirrored into them when they exist: the API has no separate
      // Akawopay field, it charges whatever phone the order carries.
      if (type === "in-store") {
        setCustomerDetails((prev) => (prev ? { ...prev, phone } : prev));
      } else {
        setAddress((prev) => (prev ? { ...prev, phone } : prev));
      }
    },


    // Setters
    setNote,
    setTableRoomNumber,
    setCouponCode,
    setPaymentMethod,

    // Handlers
    handleFormChange,
    applyAddressSuggestion,
    handleCustomerFormChange,
    handleCardDetailsChange,
    handleAddressSave,
    handleCustomerSave,
    handleShippingSelect,
    handleApplyCoupon,
    handlePlaceOrder,
    handleExternalPayment,
    handleOtpValidation,
    handleConfirmBankTransfer,
    closePaymentSuccessModal,
    updateQuantity,

    // Utilities
    formatCurrency,
    emptyAddress,
    emptyCustomer,

    // Payment
    closePaymentModal,
    openPaymentModal,
  };
};
