import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getErrorMessage } from "../api/client";
import type {
  AvailableSlot,
  BookingHoldDetails,
  BookingPaymentChannel,
  BookingPaymentOption,
  BookingVirtualAccount,
  CreateBookingHoldPayload,
  ServiceDetailResponse,
  StoreBusinessInfo,
  StoreServiceItem,
  StoreTarget,
} from "../api/services";
import {
  calculateServiceCharges,
  createBookingHold,
  fetchServiceDetail,
  fetchStoreServices,
  pollBookingPaymentVerification,
  verifyBookingPayment,
} from "../api/services";
import { ProductCardSkeleton } from "../components/CardSkeleton";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { ServiceCard } from "../components/ServiceCard";
import { BankTransferPaymentView } from "../components/services/BankTransferPaymentView";
import { BookingHoldTimer } from "../components/services/BookingHoldTimer";
import { CardPaymentForm } from "../components/services/CardPaymentForm";
import { ServiceSelfServicePortal } from "../components/services/ServiceSelfServicePortal";
import { ThreeDsRedirectModal } from "../components/services/ThreeDsRedirectModal";
import { PaymentPinField } from "../components/PaymentPinField";
import { WhatsAppButton } from "../components/WhatsAppButton";
import type { Category, StoreData } from "../type";
import useFetchData from "../useFetchDataHook";
import { getCustomStoreDomain } from "../utils/storefront";
import { useStoreTheme } from "../utils/theme";
import { isValidAkawopayPhone } from "../utils/akawopay";
import OtpModal from "./OtpModal";

const formatCurrency = (amount: number | string, currency = "₦") => {
  const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "NGN",
    maximumFractionDigits: 2,
  })
    .format(num)
    .replace("NGN", currency.trim() || "₦");
};

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

export const Services = () => {
  const navigate = useNavigate();
  const { slug, serviceId: urlServiceId, reference: urlReference } = useParams<{
    slug?: string;
    serviceId?: string;
    reference?: string;
  }>();

  const location = useLocation();

  // Dual URL resolution
  const storeDomain = getCustomStoreDomain();
  const storeUrlParam = new URLSearchParams(location.search).get("store_url");
  const effectiveSlug = slug || storeUrlParam || undefined;

  const target: StoreTarget = useMemo(
    () => ({
      storeDomain,
      storeSlug: storeDomain ? undefined : effectiveSlug,
    }),
    [storeDomain, effectiveSlug],
  );

  // Fetch core store info to synchronize brand theme, logo, banner, and footer
  const { data: storeData, isFromCache } = useFetchData<StoreData>({
    store_url: effectiveSlug,
    store_domain: storeDomain,
  });

  const storeThemeKey = effectiveSlug || storeDomain;
  const { vars: themeVars } = useStoreTheme(storeData, storeThemeKey, !isFromCache);

  // View state
  const [activeTab, setActiveTab] = useState<"book" | "lookup">(
    urlReference ? "lookup" : "book",
  );
  const [step, setStep] = useState(0); // 0: Catalog, 1: Date & Slot, 2: Customer, 3: Payment, 4: Transfer Hold, 5: Confirmed

  // Catalog state
  const [businessInfo, setBusinessInfo] = useState<StoreBusinessInfo | null>(null);
  const [services, setServices] = useState<StoreServiceItem[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
  // Holds the category id (sent to the API as category_id), not its name.
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [servicesRefreshKey, setServicesRefreshKey] = useState(0);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Banner loading state matching Outstore.tsx
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [loadedBannerImage, setLoadedBannerImage] = useState("");
  const [bannerImage, setBannerImage] = useState<string>("");

  // Selected Service & Dynamic Slots state
  const [selectedService, setSelectedService] = useState<StoreServiceItem | null>(null);
  const [serviceDetail, setServiceDetail] = useState<ServiceDetailResponse | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState(localDateKey(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  // Customer Details
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  // Payment Options & Method
  const [paymentOption, setPaymentOption] = useState<BookingPaymentOption>("FULL_PAYMENT");
  const [paymentMethod, setPaymentMethod] = useState<BookingPaymentChannel>("CARD");
  // Raw text of the customer's deposit input (only used for "DEPOSIT").
  const [depositInput, setDepositInput] = useState("");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardPin: "",
  });
  const [akawopayPin, setAkawopayPin] = useState("");

  // Booking Hold & Payment Execution state
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingHold, setBookingHold] = useState<BookingHoldDetails | null>(null);
  const [virtualAccounts, setVirtualAccounts] = useState<BookingVirtualAccount[]>([]);
  const [isHoldExpired, setIsHoldExpired] = useState(false);

  // Modals
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showThreeDsModal, setShowThreeDsModal] = useState(false);
  const [threeDsRedirectHtml, setThreeDsRedirectHtml] = useState<string | undefined>();

  // Initialize banner image
  useEffect(() => {
    const storeBanner = storeData?.results?.info?.banner || "";
    if (storeBanner) {
      setBannerImage(storeBanner);
    } else if (!bannerImage) {
      setBannerImage(
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=75",
      );
    }
  }, [storeData?.results?.info?.banner, bannerImage]);

  // Fetch Services List
  useEffect(() => {
    let isMounted = true;
    const loadServices = async () => {
      setIsLoadingServices(true);
      try {
        const data = await fetchStoreServices(target, {
          category_id: selectedCategory,
          search: searchQuery,
        });
        if (isMounted) {
          setBusinessInfo(data.business);
          setServices(data.services || []);
          // Service categories come from this endpoint, separate from the
          // product categories on the main store response.
          if (data.categories) {
            setServiceCategories(
              data.categories.filter((c) => c.type === "SERVICE"),
            );
          }
        }
      } catch (err) {
        if (isMounted) {
          toast.error(
            getErrorMessage(err, "Failed to load services for this store."),
          );
          setServices([]);
        }
      } finally {
        if (isMounted) setIsLoadingServices(false);
      }
    };

    loadServices();
    return () => {
      isMounted = false;
    };
  }, [target, selectedCategory, searchQuery, servicesRefreshKey]);

  // Handle direct url serviceId param if present
  useEffect(() => {
    if (urlServiceId && services.length > 0 && !selectedService) {
      const match = services.find((s) => s.id === urlServiceId);
      if (match) {
        startBooking(match);
      }
    }
  }, [urlServiceId, services, selectedService]);

  // Re-fetch service slot details when the selected service or date changes.
  useEffect(() => {
    if (!selectedService) return;

    let isMounted = true;
    const loadSlotDetails = async () => {
      setIsLoadingSlots(true);
      try {
        const detail = await fetchServiceDetail(target, selectedService.id, {
          date: selectedDate,
        });
        if (isMounted) {
          setServiceDetail(detail);
          setSelectedSlot(null);

          if (detail.payment_options) {
            const options = detail.payment_options;
            setPaymentOption((current) => {
              if (
                (current === "FULL_PAYMENT" && options.allow_full_payment) ||
                (current === "DEPOSIT" && options.allow_deposit) ||
                (current === "PAY_AT_BUSINESS" && options.allow_pay_at_business)
              ) {
                return current;
              }
              if (options.allow_full_payment) return "FULL_PAYMENT";
              if (options.allow_deposit) return "DEPOSIT";
              return "PAY_AT_BUSINESS";
            });

            const channels = options.channels?.filter(
              (channel): channel is "CARD" | "BANK-TRANSFER" | "BNPL" =>
                channel === "CARD" ||
                channel === "BANK-TRANSFER" ||
                channel === "BNPL",
            );
            if (channels?.length) {
              setPaymentMethod((current) =>
                channels.includes(current as "CARD" | "BANK-TRANSFER" | "BNPL")
                  ? current
                  : channels[0],
              );
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          toast.error(getErrorMessage(err, "Failed to load appointment slots."));
        }
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    };

    loadSlotDetails();
    return () => {
      isMounted = false;
    };
  }, [target, selectedService, selectedDate]);

  const selectedCategoryName = serviceCategories.find(
    (c) => c.id === selectedCategory,
  )?.name;

  // Calendar dates list (up to max_advance_days, defaults to 14 days)
  const maxAdvance = serviceDetail?.booking_rules?.max_advance_days || 14;
  const calendarDates = useMemo(() => {
    return Array.from({ length: Math.min(maxAdvance, 30) }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [maxAdvance]);

  // Determine if a calendar date is closed per operating_schedule
  const isDateClosed = (date: Date) => {
    if (!serviceDetail?.operating_schedule) return false;
    const jsDay = date.getDay(); // 0 is Sunday
    const djangoDay = (jsDay + 6) % 7;
    const dayConfig = serviceDetail.operating_schedule.find(
      (s) => s.day_of_week === djangoDay,
    );
    return dayConfig?.is_closed ?? false;
  };

  const startBooking = (service: StoreServiceItem) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setSelectedDate(localDateKey(new Date()));
    setIsHoldExpired(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const returnToCatalog = () => {
    setSelectedService(null);
    setServiceDetail(null);
    setSelectedSlot(null);
    setSelectedDate(localDateKey(new Date()));
    setCustomer({ name: "", phone: "", email: "", notes: "" });
    setPaymentOption("FULL_PAYMENT");
    setPaymentMethod("CARD");
    setDepositInput("");
    setCardDetails({ cardNumber: "", expiryDate: "", cvv: "", cardPin: "" });
    setAkawopayPin("");
    setBookingHold(null);
    setVirtualAccounts([]);
    setIsHoldExpired(false);
    setShowOtpModal(false);
    setShowThreeDsModal(false);
    setThreeDsRedirectHtml(undefined);
    setSelectedCategory(null);
    setSearchQuery("");
    setServicesRefreshKey((current) => current + 1);
    setActiveTab("book");
    setStep(0);

    const storePath = slug
      ? `${location.pathname.startsWith("/o/") ? "/o" : "/i"}/${encodeURIComponent(slug)}/services`
      : "/services";
    navigate(`${storePath}${location.search}`, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Financial calculations
  const currencySymbol =
    businessInfo?.currency === "NGN"
      ? "₦"
      : businessInfo?.currency || storeData?.results?.info?.currency || "₦";

  const baseServicePrice = selectedService ? parseFloat(selectedService.amount) || 0 : 0;

  // Minimum deposit set by the business. The customer may pay more, up to
  // the full service price.
  const configuredMinDeposit = Number.parseFloat(
    serviceDetail?.payment_options?.min_deposit_amount ??
      serviceDetail?.payment_options?.effective_deposit_amount ??
      serviceDetail?.payment_options?.deposit_amount ??
      selectedService?.min_deposit_amount ??
      selectedService?.deposit_amount ??
      "",
  );
  const minDepositAmount = Number.isFinite(configuredMinDeposit)
    ? configuredMinDeposit
    : baseServicePrice / 2;
  const minDepositPercentage =
    serviceDetail?.payment_options?.min_deposit_percentage ??
    selectedService?.min_deposit_percentage ??
    null;

  const enteredDeposit = Number.parseFloat(depositInput);
  // Compare in kobo so 3000 vs "3000.00" or float noise never fails validation.
  const toMinor = (value: number) => Math.round(value * 100);
  const depositError =
    paymentOption !== "DEPOSIT"
      ? null
      : !Number.isFinite(enteredDeposit)
        ? "Enter the amount you want to deposit."
        : toMinor(enteredDeposit) < toMinor(minDepositAmount)
          ? `Deposit must be at least ${formatCurrency(minDepositAmount, currencySymbol)}.`
          : toMinor(enteredDeposit) > toMinor(baseServicePrice)
            ? `Deposit can't be more than the service price (${formatCurrency(baseServicePrice, currencySymbol)}).`
            : null;
  const depositPrice =
    paymentOption === "DEPOSIT"
      ? Number.isFinite(enteredDeposit)
        ? enteredDeposit
        : minDepositAmount
      : 0;

  // Pre-fill the deposit input with the minimum for the selected service.
  useEffect(() => {
    if (!selectedService) return;
    setDepositInput(String(minDepositAmount));
  }, [selectedService?.id, minDepositAmount]);

  const paymentChannels: ("CARD" | "BANK-TRANSFER" | "BNPL")[] = serviceDetail?.payment_options?.channels
    ? serviceDetail.payment_options.channels.filter(
        (channel): channel is "CARD" | "BANK-TRANSFER" | "BNPL" =>
            channel === "CARD" ||
            channel === "BANK-TRANSFER" ||
            channel === "BNPL",
      )
    : (["CARD", "BANK-TRANSFER", "BNPL"] as const);
  const paymentOptions = serviceDetail?.payment_options;
  const hasEnabledPaymentOption = Boolean(
    paymentOptions?.allow_full_payment ||
      paymentOptions?.allow_deposit ||
      paymentOptions?.allow_pay_at_business,
  );
  const hasAvailablePaymentMethod =
    paymentOption === "PAY_AT_BUSINESS" || paymentChannels.length > 0;

  const payableOnlineBase =
    paymentOption === "FULL_PAYMENT"
      ? baseServicePrice
      : paymentOption === "DEPOSIT"
        ? depositPrice
        : 0;

  const balanceDueLater =
    paymentOption === "PAY_AT_BUSINESS"
      ? baseServicePrice
      : paymentOption === "DEPOSIT"
        ? Math.max(0, baseServicePrice - depositPrice)
        : 0;

  const businessAbsorbsCharges =
    businessInfo?.pay_transaction_charges === true ||
    storeData?.results?.info?.pay_transaction_charges === true;

  const { charges: estimatedCharges, totalPayable: estimatedTotalPayable } = useMemo(() => {
    return calculateServiceCharges(
      payableOnlineBase,
      paymentOption === "PAY_AT_BUSINESS" ? "PAY_AT_BUSINESS" : paymentMethod,
      businessAbsorbsCharges,
    );
  }, [payableOnlineBase, paymentOption, paymentMethod, businessAbsorbsCharges]);

  // Form validations
  const canContinueToCustomer = Boolean(selectedSlot && selectedDate);
  const canContinueToPayment = Boolean(
    customer.name.trim().length > 1 &&
      (customer.phone.trim().length >= 8 || customer.email.trim().includes("@")),
  );

  // Booking Hold & Payment Submission
  const handleProceedBookingHold = async () => {
    if (!selectedService || !selectedSlot) return;

    const paymentOptions = serviceDetail?.payment_options;
    if (
      !paymentOptions ||
      (paymentOption === "FULL_PAYMENT" && !paymentOptions.allow_full_payment) ||
      (paymentOption === "DEPOSIT" && !paymentOptions.allow_deposit) ||
      (paymentOption === "PAY_AT_BUSINESS" &&
        !paymentOptions.allow_pay_at_business)
    ) {
      toast.error("This payment option is not available for this service.");
      return;
    }

    if (depositError) {
      toast.warn(depositError);
      return;
    }

    if (
      paymentOption !== "PAY_AT_BUSINESS" &&
      !paymentChannels.includes(paymentMethod as "CARD" | "BANK-TRANSFER" | "BNPL")
    ) {
      toast.error("This payment method is not available for this service.");
      return;
    }

    if (
      paymentOption !== "PAY_AT_BUSINESS" &&
      paymentMethod === "CARD" &&
      (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv)
    ) {
      toast.warn("Please enter all required card details.");
      return;
    }

    if (
      paymentOption !== "PAY_AT_BUSINESS" &&
      paymentMethod === "BNPL" &&
      (!akawopayPin ||
        akawopayPin.length < 4 ||
        !isValidAkawopayPhone(customer.phone))
    ) {
      toast.warn("Enter a valid Akawopay phone number and 4 to 6 digit PIN.");
      return;
    }

    setIsSubmittingBooking(true);
    setIsHoldExpired(false);

    const payload: CreateBookingHoldPayload = {
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim() || undefined,
      customer_email: customer.email.trim() || undefined,
      booking_date: selectedDate,
      start_time: selectedSlot.start_time,
      payment_option: paymentOption,
      deposit_amount:
        paymentOption === "DEPOSIT"
          ? toMinor(enteredDeposit) / 100
          : undefined,
      payment_method: paymentOption === "PAY_AT_BUSINESS" ? undefined : paymentMethod,
      notes: customer.notes.trim() || undefined,
    };

    if (paymentOption !== "PAY_AT_BUSINESS") {
      if (paymentMethod === "CARD") {
        payload.card_number = cardDetails.cardNumber.replace(/\s/g, "");
        payload.expiry_date = cardDetails.expiryDate;
        payload.cvv = cardDetails.cvv;
        if (cardDetails.cardPin) payload.card_pin = cardDetails.cardPin;
      } else if (paymentMethod === "BNPL") {
        payload.payment_pin = akawopayPin;
      }
    }

    try {
      const response = await createBookingHold(target, selectedService.id, payload);
      setBookingHold(response.booking);

      const accounts =
        response.payment?.bank_accounts || response.bank_accounts || [];
      setVirtualAccounts(accounts);

      if (
        paymentOption === "PAY_AT_BUSINESS" ||
        response.booking.status === "CONFIRMED" ||
        response.payment?.status === "CONFIRMED"
      ) {
        toast.success(response.message || "Booking reserved successfully!");
        goToStep(5);
      } else if (response.payment?.method === "BANK-TRANSFER") {
        toast.info("Booking slot reserved. Transfer funds to confirm.");
        goToStep(4);
      } else if (response.payment?.status === "OTP_REQUIRED") {
        setShowOtpModal(true);
      } else if (
        response.payment?.status === "REDIRECT_REQUIRED" &&
        response.payment?.redirect_html
      ) {
        setThreeDsRedirectHtml(response.payment.redirect_html);
        setShowThreeDsModal(true);
      } else if (response.payment?.method === "BNPL") {
        toast.info("Authorizing Buy Now, Pay Later with Akawopay...");
        const pollResult = await pollBookingPaymentVerification(
          target,
          response.booking.reference,
          { timeoutMs: 90_000 },
        );
        if (pollResult.outcome === "CONFIRMED") {
          toast.success("BNPL Payment approved! Booking confirmed.");
          goToStep(5);
        } else if (pollResult.outcome === "EXPIRED") {
          toast.error("Booking hold expired before authorization completed.");
          setIsHoldExpired(true);
        } else if (pollResult.outcome === "FAILED") {
          toast.error(
            pollResult.response?.message || "BNPL authorization was declined.",
          );
        } else {
          toast.error("BNPL authorization timed out. Please try again.");
        }
      } else {
        toast.info(response.message || "Booking hold created.");
        goToStep(4);
      }
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to reserve appointment. Please try again.",
        ),
      );
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // OTP Verification for Card Charges
  const handleVerifyOtp = async (otp: string) => {
    if (!bookingHold) return;
    setIsVerifyingOtp(true);
    try {
      const res = await verifyBookingPayment(target, bookingHold.reference, { otp });
      if (res.status === "CONFIRMED") {
        setShowOtpModal(false);
        toast.success("Card payment verified successfully!");
        goToStep(5);
      } else if (res.status === "EXPIRED") {
        setShowOtpModal(false);
        toast.error("Booking hold expired before OTP verification.");
        setIsHoldExpired(true);
      } else {
        toast.error(res.message || "Invalid OTP code. Please try again.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "OTP verification failed."));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white" style={themeVars}>
      {/* Universal Navbar */}
      <Navbar
        storeData={storeData}
        categories={serviceCategories}
        selectedCategoryId={selectedCategory}
        onCategoryChange={(catId) => {
          setSelectedCategory(catId);
          setActiveTab("book");
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCheckout={() => {}}
      />

      {/* Sub-navigation bar with Services Catalog & Lookup My Booking */}
      <div className="border-b border-gray-100 bg-white/95 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-13">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (step !== 0 || activeTab !== "book") {
                  returnToCatalog();
                } else {
                  setActiveTab("book");
                }
              }}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                activeTab === "book"
                  ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-sm"
                  : "text-gray-600 hover:text-black hover:bg-gray-100"
              }`}
            >
              {step > 0 && activeTab === "book" ? "← Back to Catalog" : "Services Catalog"}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab("lookup");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition shadow-xs ${
                activeTab === "lookup"
                  ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-sm"
                  : "border border-gray-300 bg-white text-gray-700 hover:text-black hover:border-black"
              }`}
            >
              <svg
                className="w-3.5 h-3.5 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Lookup My Booking</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === "lookup" ? (
        /* Customer Self-Service Portal */
        <main className="flex-1 bg-[#f9faf9] py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ServiceSelfServicePortal
              target={target}
              initialReference={urlReference || ""}
              currencySymbol={currencySymbol}
              onBackToBooking={returnToCatalog}
            />
          </div>
        </main>
      ) : step === 0 ? (
        /* Catalog View with Hero Banner */
        <>
          {/* Hero Banner matching Outstore.tsx */}
          <div className="relative text-white overflow-hidden">
            <div className="absolute inset-0">
              {(!bannerLoaded || loadedBannerImage !== bannerImage) && (
                <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
              )}

              {bannerImage && (
                <img
                  key={bannerImage}
                  src={bannerImage}
                  alt="Services background"
                  fetchPriority="high"
                  decoding="async"
                  className={`w-full h-full object-cover transition-opacity duration-700 ${
                    bannerLoaded && loadedBannerImage === bannerImage
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                  onLoad={() => {
                    setLoadedBannerImage(bannerImage);
                    setBannerLoaded(true);
                  }}
                />
              )}
              <div className="absolute inset-0 bg-black/55" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
              <div className="max-w-3xl">
                <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl uppercase leading-[1.05] mb-5 text-white">
                  Discover Our Services
                </h1>
                <p className="text-base sm:text-lg text-white/90 max-w-xl">
                  {storeData?.results?.info.description ||
                    "                    Browse our services, choose an available appointment slot, and book online."}
                </p>
              </div>
            </div>

            {/* Stats Strip matching Outstore.tsx */}
            <div className="relative bg-[var(--brand-primary)] border-t border-white/10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <div className="grid grid-cols-3 gap-2 sm:gap-8 divide-x divide-white/15">
                  <div className="text-center sm:text-left sm:pl-2">
                    <p className="font-display text-xl sm:text-4xl text-[var(--brand-on-primary)]">
                      {services.length}+
                    </p>
                    <p className="text-[10px] sm:text-sm text-[var(--brand-on-primary)]/80 mt-0.5">
                      Services Available
                    </p>
                  </div>
                  <div className="text-center sm:text-left pl-2 sm:pl-6">
                    <p className="font-display text-xl sm:text-4xl text-[var(--brand-on-primary)]">
                      {serviceCategories.length > 0
                        ? `${serviceCategories.length}+`
                        : "All"}
                    </p>
                    <p className="text-[10px] sm:text-sm text-[var(--brand-on-primary)]/80 mt-0.5">
                      Categories
                    </p>
                  </div>
                  <div className="text-center sm:text-left pl-2 sm:pl-6">
                    <p className="font-display text-xl sm:text-4xl text-[var(--brand-on-primary)]">
                      24/7
                    </p>
                    <p className="text-[10px] sm:text-sm text-[var(--brand-on-primary)]/80 mt-0.5">
                      Online Booking
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Catalog Section matching ProductList layout */}
          <main id="services-catalog" className="flex-1 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 sm:space-y-12">
              {/* Section Title & Lookup Action */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-gray-100">
                <div>
                  <h2 className="font-display text-3xl sm:text-5xl text-[var(--brand-primary)] uppercase tracking-wide mb-1">
                    {selectedCategoryName || "Available Services"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {services.length > 0
                      ? `Showing ${services.length} ${services.length === 1 ? "service" : "services"} ready for booking`
                      : "Discover our services"}
                    {searchQuery && (
                      <span className="ml-1 text-gray-400">· "{searchQuery}"</span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("lookup");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:text-black hover:border-black cursor-pointer shadow-xs transition"
                >
                  <svg
                    className="w-4 h-4 text-gray-500 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Lookup My Booking</span>
                </button>
              </div>

              {/* Category Pills - responsive horizontal scroll on mobile, centered flex-wrap on desktop */}
              {serviceCategories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:flex-wrap sm:justify-center">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition ${
                      selectedCategory === null
                        ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Services
                  </button>
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition ${
                        selectedCategory === cat.id
                          ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid matching ProductList */}
              {isLoadingServices ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8">
                  {[...Array(8)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center max-w-lg mx-auto">
                  <p className="font-display text-2xl uppercase tracking-wide text-gray-700">
                    No Services Found
                  </p>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    {searchQuery || selectedCategory
                      ? "Try searching for a different keyword or resetting your category filter."
                      : "This store currently has no active services listed for booking."}
                  </p>
                  {(searchQuery || selectedCategory) && (
                    <button
                      type="button"
                      onClick={returnToCatalog}
                      className="mt-4 px-6 py-2.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-gray-800 transition"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      currency={currencySymbol}
                      onBook={startBooking}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </>
      ) : (
        /* Booking Steps 1 to 5 */
        <main className="flex-1 bg-[#f9faf9] py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="space-y-6">
                {/* Header with Back button */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    {step > 1 && step < 5 && (
                      <button
                        type="button"
                        onClick={() => goToStep(step - 1)}
                        className="rounded-full border border-gray-300 p-2 text-xs text-gray-700 hover:bg-gray-100 transition"
                      >
                        ← Back
                      </button>
                    )}
                    {step === 1 && (
                      <button
                        type="button"
                        onClick={returnToCatalog}
                        className="rounded-full border border-gray-300 p-2 text-xs text-gray-700 hover:bg-gray-100 transition"
                      >
                        ← All Services
                      </button>
                    )}
                    <div>
                      <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-gray-900">
                        {step === 1 && "Select Appointment Slot"}
                        {step === 2 && "Customer Information"}
                        {step === 3 && "Payment & Review"}
                        {step === 4 && "Bank Transfer Payment"}
                        {step === 5 && "Appointment Confirmed"}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {step < 5
                          ? `Step ${step} of 4 · ${selectedService?.name}`
                          : "Your booking reservation is complete"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 1: Date & Dynamic Slots Picker */}
                {step === 1 && selectedService && (
                  <div className="space-y-6">
                    {/* Date Picker */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                          Select Date
                        </h3>
                        <span className="text-xs font-semibold text-[var(--brand-primary)]">
                          {new Intl.DateTimeFormat("en-NG", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(`${selectedDate}T12:00:00`))}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                        {calendarDates.map((date) => {
                          const key = localDateKey(date);
                          const isSelected = selectedDate === key;
                          const closed = isDateClosed(date);

                          return (
                            <button
                              key={key}
                              type="button"
                              disabled={closed}
                              onClick={() => setSelectedDate(key)}
                              className={`flex flex-col items-center justify-center rounded-2xl border py-3 transition text-xs font-semibold ${
                                closed
                                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-60"
                                  : isSelected
                                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-md"
                                    : "border-gray-200 bg-white hover:border-[var(--brand-primary)] text-gray-800"
                              }`}
                            >
                              <span className="text-[10px] uppercase">
                                {new Intl.DateTimeFormat("en", { weekday: "short" }).format(date)}
                              </span>
                              <span className="text-base font-extrabold mt-0.5">
                                {date.getDate()}
                              </span>
                              {closed && (
                                <span className="text-[9px] text-red-500 font-bold mt-0.5">
                                  Closed
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Available Time Slots */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Available Slots
                      </h3>

                      {isLoadingSlots ? (
                        <div className="py-10 text-center text-xs text-gray-500 animate-pulse">
                          Fetching available slots from calendar...
                        </div>
                      ) : !serviceDetail?.available_slots ||
                        serviceDetail.available_slots.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
                          No available slots for this date. Please select a different date.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {serviceDetail.available_slots.map((slot) => {
                            const isSelected = selectedSlot?.start_time === slot.start_time;
                            const isFull = slot.remaining_capacity === 0;

                            return (
                              <button
                                key={slot.start_time}
                                type="button"
                                disabled={isFull}
                                onClick={() => setSelectedSlot(slot)}
                                className={`rounded-2xl border p-3 text-center transition text-xs font-semibold ${
                                  isFull
                                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                                    : isSelected
                                      ? "border-[var(--brand-primary)] bg-[var(--brand-surface)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)] shadow-sm"
                                      : "border-gray-200 bg-white hover:border-[var(--brand-primary)] text-gray-800"
                                }`}
                              >
                                <div className="text-sm font-bold">
                                  {slot.display || slot.start_time}
                                </div>
                                <div className="text-[10px] font-normal text-gray-500 mt-0.5">
                                  {isFull
                                    ? "Fully Booked"
                                    : `${slot.remaining_capacity} spot${slot.remaining_capacity > 1 ? "s" : ""} left`}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Policy Banner */}
                    {serviceDetail?.booking_rules?.cancellation_policy_text && (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                        <strong>Policy:</strong> {serviceDetail.booking_rules.cancellation_policy_text}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!canContinueToCustomer}
                      onClick={() => goToStep(2)}
                      className="w-full rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] py-4 text-sm font-semibold shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Details →
                    </button>
                  </div>
                )}

                {/* Step 2: Customer Details */}
                {step === 2 && (
                  <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Your Contact Details</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Your appointment confirmation and reminder will be delivered here.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Adaeze Okonkwo"
                          value={customer.name}
                          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                          className="w-full rounded-full border border-gray-300 bg-[#f0f0f0] px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. 0803 123 4567"
                            value={customer.phone}
                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                            className="w-full rounded-full border border-gray-300 bg-[#f0f0f0] px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. adaeze@example.com"
                            value={customer.email}
                            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                            className="w-full rounded-full border border-gray-300 bg-[#f0f0f0] px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Special Requests or Notes (Optional)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Tell your specialist any preferences or styling requests..."
                          value={customer.notes}
                          onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                          className="w-full rounded-2xl border border-gray-300 bg-[#f0f0f0] p-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canContinueToPayment}
                      onClick={() => goToStep(3)}
                      className="w-full rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] py-4 text-sm font-semibold shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Proceed to Payment →
                    </button>
                  </div>
                )}

                {/* Step 3: Payment Selection & Breakdown */}
                {step === 3 && selectedService && (
                  <div className="space-y-6">
                    {/* Payment Option Selector */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Payment Option
                      </h3>

                      <div className="grid gap-2.5 sm:grid-cols-3">
                        {serviceDetail?.payment_options?.allow_full_payment && (
                          <button
                            type="button"
                            onClick={() => setPaymentOption("FULL_PAYMENT")}
                            className={`rounded-2xl border p-3.5 text-left transition text-xs font-semibold ${
                              paymentOption === "FULL_PAYMENT"
                                ? "border-[var(--brand-primary)] bg-[var(--brand-surface)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]"
                                : "border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            <div className="font-bold text-sm">Full Payment</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {formatCurrency(baseServicePrice, currencySymbol)}
                            </div>
                          </button>
                        )}

                        {serviceDetail?.payment_options?.allow_deposit && (
                          <button
                            type="button"
                            onClick={() => setPaymentOption("DEPOSIT")}
                            className={`rounded-2xl border p-3.5 text-left transition text-xs font-semibold ${
                              paymentOption === "DEPOSIT"
                                ? "border-[var(--brand-primary)] bg-[var(--brand-surface)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]"
                                : "border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            <div className="font-bold text-sm">Pay Deposit</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              From {formatCurrency(minDepositAmount, currencySymbol)} now
                            </div>
                          </button>
                        )}

                        {serviceDetail?.payment_options?.allow_pay_at_business && (
                          <button
                            type="button"
                            onClick={() => setPaymentOption("PAY_AT_BUSINESS")}
                            className={`rounded-2xl border p-3.5 text-left transition text-xs font-semibold ${
                              paymentOption === "PAY_AT_BUSINESS"
                                ? "border-[var(--brand-primary)] bg-[var(--brand-surface)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]"
                                : "border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            <div className="font-bold text-sm">Pay at Business</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              ₦0 online (pay at venue)
                            </div>
                          </button>
                        )}
                      </div>
                      {!hasEnabledPaymentOption && (
                        <p className="text-xs text-amber-700">
                          No payment options are currently available for this service. Please contact the business.
                        </p>
                      )}

                      {/* Custom deposit amount (min deposit ≤ amount ≤ service price) */}
                      {paymentOption === "DEPOSIT" && (
                        <div className="rounded-xl bg-[var(--brand-surface)] border border-gray-200 p-4 space-y-2">
                          <p className="text-xs font-semibold text-gray-800">
                            Minimum deposit required:{" "}
                            {minDepositPercentage != null &&
                              `${minDepositPercentage}% `}
                            ({formatCurrency(minDepositAmount, currencySymbol)})
                          </p>
                          <label
                            htmlFor="deposit-amount"
                            className="block text-[11px] text-gray-500"
                          >
                            How much would you like to deposit? (up to{" "}
                            {formatCurrency(baseServicePrice, currencySymbol)})
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                              {currencySymbol}
                            </span>
                            <input
                              id="deposit-amount"
                              type="number"
                              inputMode="decimal"
                              min={minDepositAmount}
                              max={baseServicePrice}
                              step="0.01"
                              value={depositInput}
                              onChange={(e) => setDepositInput(e.target.value)}
                              disabled={isSubmittingBooking}
                              aria-invalid={Boolean(depositError)}
                              className={`w-full rounded-full border bg-white pl-9 pr-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:ring-2 ${
                                depositError
                                  ? "border-red-400 focus:ring-red-200"
                                  : "border-gray-300 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
                              }`}
                            />
                          </div>
                          {depositError && (
                            <p className="text-[11px] text-red-600">{depositError}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Payment Channels (If not Pay at Business) */}
                    {paymentOption !== "PAY_AT_BUSINESS" && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                          Payment Method
                        </h3>

                        <div className="grid gap-2.5 sm:grid-cols-3">
                          {paymentChannels.map((channel) => {
                            const label =
                              channel === "CARD"
                                ? "Card"
                                : channel === "BANK-TRANSFER"
                                  ? "Bank Transfer"
                                  : "Pay Later";
                            const description =
                              channel === "CARD"
                                ? "Debit or Credit Card"
                                : channel === "BANK-TRANSFER"
                                  ? "Virtual Account"
                                  : "Akawopay BNPL";
                            return (
                              <button
                                key={channel}
                                type="button"
                                onClick={() => setPaymentMethod(channel)}
                                className={`rounded-2xl border p-3.5 text-left transition text-xs font-semibold ${
                                  paymentMethod === channel
                                    ? "border-[var(--brand-primary)] bg-[var(--brand-surface)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]"
                                    : "border-gray-200 hover:border-gray-400"
                                }`}
                              >
                                <div className="font-bold">{label}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  {description}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {paymentChannels.length === 0 && (
                          <p className="text-xs text-amber-700">
                            No online payment methods are currently available for this service.
                          </p>
                        )}

                        {paymentMethod === "CARD" && (
                          <CardPaymentForm
                            cardDetails={cardDetails}
                            onChange={setCardDetails}
                            disabled={
                              isSubmittingBooking ||
                              !hasEnabledPaymentOption ||
                              !hasAvailablePaymentMethod
                            }
                          />
                        )}

                        {paymentMethod === "BNPL" && (
                          <PaymentPinField
                            value={akawopayPin}
                            onChange={setAkawopayPin}
                            phone={customer.phone}
                            onPhoneChange={(phone) =>
                              setCustomer((current) => ({ ...current, phone }))
                            }
                            flow="in-store"
                          />
                        )}
                      </div>
                    )}

                    {/* Transparent Financial Breakdown */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Financial Breakdown
                      </h3>

                      <div className="space-y-2 text-xs divide-y divide-gray-100">
                        <div className="flex justify-between py-1.5 text-gray-600">
                          <span>Service Price</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(baseServicePrice, currencySymbol)}
                          </span>
                        </div>

                        {paymentOption === "DEPOSIT" && (
                          <div className="flex justify-between py-1.5 text-gray-600">
                            <span>Deposit Amount</span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(depositPrice, currencySymbol)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between py-1.5 text-gray-600">
                          <span>Payment Processing Fee</span>
                          <span className="font-semibold text-gray-900">
                            {businessAbsorbsCharges
                              ? "₦0.00 (Absorbed by business)"
                              : estimatedCharges > 0
                                ? formatCurrency(estimatedCharges, currencySymbol)
                                : "₦0.00"}
                          </span>
                        </div>

                        {balanceDueLater > 0 && (
                          <div className="flex justify-between py-1.5 text-gray-600">
                            <span>Balance Due at Venue</span>
                            <span className="font-semibold text-amber-700">
                              {formatCurrency(balanceDueLater, currencySymbol)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between pt-2.5 text-base font-extrabold text-[var(--brand-primary)]">
                          <span>Payable Now</span>
                          <span>{formatCurrency(estimatedTotalPayable, currencySymbol)}</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500 leading-relaxed border border-gray-100">
                        <strong>Policy:</strong> Gateway processing fees are non-refundable. If
                        cancelled, the refundable amount to the customer is strictly the service
                        deposit/price.
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmittingBooking || Boolean(depositError)}
                      onClick={handleProceedBookingHold}
                      className="w-full rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] py-4 text-sm font-semibold shadow hover:opacity-90 transition disabled:opacity-50"
                    >
                      {isSubmittingBooking
                        ? "Reserving Slot..."
                        : paymentOption === "PAY_AT_BUSINESS"
                          ? "Confirm Reservation (Pay at Venue)"
                          : `Pay ${formatCurrency(estimatedTotalPayable, currencySymbol)} & Book`}
                    </button>
                  </div>
                )}

                {/* Step 4: Bank Transfer Dynamic Hold Screen */}
                {step === 4 && bookingHold && (
                  <div className="space-y-4">
                    {bookingHold.expires_at && (
                      <BookingHoldTimer
                        expiresAt={bookingHold.expires_at}
                        onExpire={() => setIsHoldExpired(true)}
                      />
                    )}

                    {isHoldExpired ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
                        <h3 className="text-base font-bold text-red-900">
                          Hold Window Expired
                        </h3>
                        <p className="text-xs text-red-700">
                          Your reservation hold expired before payment verification. Please pick a new
                          slot to book.
                        </p>
                        <button
                          type="button"
                          onClick={() => goToStep(1)}
                          className="rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition"
                        >
                          Pick New Slot
                        </button>
                      </div>
                    ) : (
                      <BankTransferPaymentView
                        target={target}
                        reference={bookingHold.reference}
                        accounts={virtualAccounts}
                        amountDue={bookingHold.amount_due_now}
                        currencySymbol={currencySymbol}
                        onVerified={() => goToStep(5)}
                        onExpired={() => setIsHoldExpired(true)}
                      />
                    )}
                  </div>
                )}

                {/* Step 5: Confirmed Screen */}
                {step === 5 && bookingHold && (
                  <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center space-y-6 shadow-sm">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-700">
                      ✓
                    </span>

                    <div>
                      <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-gray-900">
                        Appointment Confirmed!
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Confirmation sent to {customer.phone || customer.email}.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left space-y-2.5 text-xs">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-500">Booking Reference</span>
                        <span className="font-mono text-sm font-bold text-gray-900">
                          {bookingHold.reference}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Service</span>
                        <span className="font-semibold text-gray-900">{bookingHold.service_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date & Time</span>
                        <span className="font-semibold text-gray-900">
                          {bookingHold.booking_date} at {bookingHold.start_time} - {bookingHold.end_time}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
                        <span className="text-gray-700">Balance Due at Venue</span>
                        <span className="text-[var(--brand-primary)]">
                          {formatCurrency(bookingHold.balance_due_later, currencySymbol)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("lookup");
                        }}
                        className="flex-1 rounded-full bg-black py-3.5 text-xs font-bold text-white hover:bg-gray-800 transition"
                      >
                        View in My Bookings
                      </button>
                      <button
                        type="button"
                        onClick={returnToCatalog}
                        className="flex-1 rounded-full border border-gray-300 py-3.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                      >
                        Book Another Service
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Sidebar Booking Summary */}
              {selectedService && step < 5 && (
                <aside className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Summary
                    </h3>

                    <div className="border-b border-gray-100 pb-3">
                      <h4 className="font-bold text-gray-900">{selectedService.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Duration: {selectedService.duration_display || `${selectedService.duration} mins`}
                      </p>
                      <p className="mt-1.5 text-base font-extrabold text-[var(--brand-primary)]">
                        {formatCurrency(selectedService.amount, currencySymbol)}
                      </p>
                    </div>

                    {selectedDate && (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Date:</span>
                          <span className="font-semibold text-gray-900">{selectedDate}</span>
                        </div>
                        {selectedSlot && (
                          <div className="flex justify-between text-gray-600">
                            <span>Time:</span>
                            <span className="font-semibold text-gray-900">
                              {selectedSlot.display || selectedSlot.start_time}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <span>Payment Option: </span>
                      <span className="font-semibold text-gray-900">
                        {paymentOption.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Floating WhatsApp contact button */}
      <WhatsAppButton
        storeName={businessInfo?.name || storeData?.results?.info?.name}
        storeData={storeData}
        storeSlug={storeThemeKey}
      />

      {/* Footer matching Outstore.tsx */}
      <Footer storeData={storeData} />

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <OtpModal
              isProcessing={isVerifyingOtp}
              onSubmit={handleVerifyOtp}
              onClose={() => setShowOtpModal(false)}
            />
          </div>
        </div>
      )}

      {/* 3D-Secure Modal */}
      {showThreeDsModal && bookingHold && (
        <ThreeDsRedirectModal
          target={target}
          reference={bookingHold.reference}
          redirectHtml={threeDsRedirectHtml}
          onSuccess={() => {
            setShowThreeDsModal(false);
            goToStep(5);
          }}
          onClose={() => setShowThreeDsModal(false)}
        />
      )}
    </div>
  );
};

export default Services;
