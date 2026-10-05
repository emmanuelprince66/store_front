import { useState } from "react";
import { useParams } from "react-router-dom";
import { BnplActivation } from "../components/BnplActivation";
import { BnplStatusOverlay } from "../components/BnplStatusOverlay";
import { Modal } from "../components/Modal";
import PaymentCom from "../components/PaymentCom";
import {
  ICON_CARD,
  ICON_CLOCK,
  ICON_COUNTER,
  PaymentOptionGrid,
  type PaymentOption,
} from "../components/PaymentOptionGrid";
import { PaymentPinField } from "../components/PaymentPinField";
import { PaymentSuccessModal } from "../components/PaymentSuccessModal";
import type { StoreData } from "../type";
import { useCheckoutHook } from "../useCheckoutHook";
import { isValidAkawopayPhone } from "../utils/akawopay";
import { getPrimaryImage } from "../utils/media";
import { getCustomStoreDomain } from "../utils/storefront";
import { usePersistedState } from "../utils/usePersistedState";

import BankTransfer from "./BankTransfer";
import Contact from "./Contact";
import Customer from "./Customer";
import { InStoreCounterPass } from "./InStoreCounterPass";
import OtpModal from "./OtpModal";
import CourierOptions from "./Shipping";

interface CheckoutProps {
  onBack: () => void;
  type?: "in-store" | "out-store";
  storeData?: StoreData | null;
}

/** Shown under a greyed-out method so the buyer knows it isn't a glitch. */
const NO_BNPL_REASON = "Not offered here";
const NO_ONLINE_REASON = "Not offered here";

export const Checkout: React.FC<CheckoutProps> = ({
  onBack,
  type = "out-store",
  storeData,
}) => {
  const {
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
    showAddressModal,
    showCustomerModal,
    showBankTransferModal,
    showPaymentSuccessModal,
    showOtpModal,
    setShowAddressModal,
    setShowCustomerModal,
    setShowBankTransferModal,
    setShowOtpModal,
    currentAddressForm,
    currentCustomerForm,
    closePaymentModal,
    openPaymentModal,
    setEditAddress,
    setEditCustomer,
    countryList,
    stateList,
    cityList,
    shippingOptions,
    setNote,
    setTableRoomNumber,
    setCouponCode,
    handleFormChange,
    applyAddressSuggestion,
    handleCustomerFormChange,
    handleAddressSave,
    handleCustomerSave,
    handleShippingSelect,
    handleApplyCoupon,
    handlePlaceOrder,
    handleOtpValidation,
    handleConfirmBankTransfer,
    updateQuantity,
    formatCurrency,
    emptyAddress,
    emptyCustomer,
    paymentMethod,
    setPaymentMethod,
    cardDetails,
    handleCardDetailsChange,
    bankTransferDetails,
    paymentSuccessOrder,
    closePaymentSuccessModal,
    allowsPickup,
    isPickup,
    pickupAddress,
    setDeliveryMode,
    isShipbubble,
    isFetchingRates,
    ratesError,
    refetchShipmentRates,
    isBnplAvailable,
    inStorePaymentType,
    setInStorePaymentType,
    paymentPin,
    setPaymentPin,
    bnplStage,
    bnplMessage,
    dismissBnpl,
    inStoreDraft,
    dismissInStoreDraft,
    reopenInStoreCheckout,
    akawopayPhone,
    updateBnplPhone,
  } = useCheckoutHook({ type, storeData, onBack });

  const { slug } = useParams<{ slug: string }>();
  const storeKey =
    slug || getCustomStoreDomain() || storeData?.results?.info?.id;

  // BNPL fails at submit without a verified AkawoPay account, and the API's
  // "Invalid PIN" reads as a typo rather than a missing account. Explaining it
  // when Pay Later is first picked turns that dead end into a signup. Stored
  // per store so a returning buyer isn't stopped on every order.
  const [hasSeenBnplInfo, setHasSeenBnplInfo] = usePersistedState<boolean>(
    storeKey,
    "bnpl-activation-seen",
    false,
  );
  const [showBnplActivation, setShowBnplActivation] = useState(false);

  const announceBnplIfNew = (value: string) => {
    if (value === "BNPL" && !hasSeenBnplInfo) setShowBnplActivation(true);
  };

  const handleInStoreSelect = (value: "COUNTER" | "ONLINE" | "BNPL") => {
    setInStorePaymentType(value);
    announceBnplIfNew(value);
  };

  const handleOutStoreSelect = (value: "BANK-TRANSFER" | "CARD" | "BNPL") => {
    setPaymentMethod(value);
    announceBnplIfNew(value);
  };

  console.log("total", total);
  console.log("subtotal", subtotal);
  console.log("storeData", storeData);
  console.log("cart", cart);

  const allowOnlinePayment =
    storeData?.results?.info?.allow_online_payment ?? true;

  // Check if customer pays transaction charges
  // pay_transaction_charges = false means customer pays the fee
  const customerPaysTransactionFee =
    storeData?.results?.info?.pay_transaction_charges === false;

  // Transaction fee structure per payment method (percentage, floor and cap in
  // Naira). BNPL is deliberately absent: its 1.5%/₦1,000 fee is deducted from
  // the merchant's settlement by Akawopay, not added to what the buyer pays.
  const TRANSACTION_FEES = {
    CARD: { rate: 0.015, min: 100, cap: 1500 },
    "BANK-TRANSFER": { rate: 0.015, min: 100, cap: 1000 },
  } as const;

  // Calculate transaction fee based on payment method
  const getTransactionFee = () => {
    if (!customerPaysTransactionFee || !allowOnlinePayment) return 0;

    const fee =
      TRANSACTION_FEES[paymentMethod as keyof typeof TRANSACTION_FEES];
    if (!fee) return 0;

    const baseAmount =
      type === "out-store"
        ? subtotal + parseFloat(selectedShipping?.amount || "0")
        : subtotal;

    if (baseAmount <= 0) return 0;

    return Math.min(Math.max(baseAmount * fee.rate, fee.min), fee.cap);
  };

  // Unavailable methods stay on screen but disabled. BNPL needs the backend to
  // confirm the merchant is both enabled and Tier-3 verified — clicking it
  // otherwise would fail at submit, so it's greyed rather than live.
  const outStorePaymentOptions: PaymentOption<
    "BANK-TRANSFER" | "CARD" | "BNPL"
  >[] = [
    { value: "BANK-TRANSFER", label: "Bank Transfer", icon: ICON_CARD },
    { value: "CARD", label: "Card Payment", icon: ICON_CARD },
    {
      value: "BNPL",
      label: "Buy Now Pay Later",
      icon: ICON_CLOCK,
      disabled: !isBnplAvailable,
      reason: NO_BNPL_REASON,
    },
  ];

  // In-store always creates a draft; this picks how it gets settled. ONLINE
  // issues a virtual account to transfer into, so it's disabled when the store
  // doesn't take online payment — otherwise the buyer would be sent to an
  // account the merchant isn't collecting on.
  const inStorePaymentOptions: PaymentOption<"COUNTER" | "ONLINE" | "BNPL">[] =
    [
      { value: "COUNTER", label: "Pay at Counter", icon: ICON_COUNTER },
      {
        value: "ONLINE",
        label: "Bank Transfer",
        icon: ICON_CARD,
        disabled: !allowOnlinePayment,
        reason: NO_ONLINE_REASON,
      },
      {
        value: "BNPL",
        label: "Buy Now Pay Later",
        icon: ICON_CLOCK,
        disabled: !isBnplAvailable,
        reason: NO_BNPL_REASON,
      },
    ];

  // Gating for the submit button. Previously this expression was written out
  // twice — once for `disabled`, once for the class — which is exactly the
  // kind of duplication that drifts when a payment method is added.
  const isPinIncomplete = paymentPin.length < 4;

  // BNPL can't go without a usable Akawopay phone — it's the account identity.
  const isBnplDetailsIncomplete =
    isPinIncomplete || !isValidAkawopayPhone(akawopayPhone);

  const isCardIncomplete =
    allowOnlinePayment &&
    paymentMethod === "CARD" &&
    (!cardDetails.card_number ||
      !cardDetails.expiry_date ||
      !cardDetails.cvv ||
      !cardDetails.card_pin);

  const isCheckoutIncomplete =
    type === "out-store"
      ? !address ||
        (!isPickup && !selectedShipping) ||
        isCardIncomplete ||
        (allowOnlinePayment && paymentMethod === "BNPL" && isBnplDetailsIncomplete)
      : !customerDetails || (inStorePaymentType === "BNPL" && isBnplDetailsIncomplete);

  const isPlaceOrderDisabled = isProcessing || isCheckoutIncomplete;

  const placeOrderLabel = isProcessing
    ? "Processing..."
    : type === "in-store"
      ? inStorePaymentType === "BNPL"
        ? "Request Pay Later"
        : "Get Order Code"
      : !allowOnlinePayment
        ? "Place Order"
        : paymentMethod === "CARD"
          ? "Pay with Card"
          : paymentMethod === "BNPL"
            ? "Pay Later with Akawopay"
            : "Place Order";

  const transactionFee = getTransactionFee();

  console.log("transactionFee", transactionFee);
  const finalTotal =
    customerPaysTransactionFee && allowOnlinePayment
      ? total + transactionFee
      : total;

  console.log("finalTotal", finalTotal);

  // Once an in-store draft exists the checkout form has done its job — the
  // buyer needs the code, not the basket they just submitted.
  if (inStoreDraft) {
    return (
      <InStoreCounterPass
        // A new code is a new countdown — remount so the deadline is re-read.
        key={inStoreDraft.order_code}
        draft={inStoreDraft}
        bnplStage={bnplStage}
        bnplMessage={bnplMessage}
        formatCurrency={formatCurrency}
        onDone={() => {
          dismissInStoreDraft();
          onBack();
        }}
        onRestart={reopenInStoreCheckout}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f0f0] py-2 pl-3 pr-4 text-sm font-semibold text-black cursor-pointer transition-colors hover:bg-gray-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Store
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Customer/Delivery Details */}
        <div className="space-y-6">
          {type === "in-store" ? (
            /* In-Store Customer Details */
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
              <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-[var(--brand-primary)] mb-4">
                Customer Details
              </h2>
              {!customerDetails ? (
                <button
                  onClick={() => {
                    setEditCustomer(emptyCustomer);
                    setShowCustomerModal(true);
                  }}
                  className="w-full border border-2 border-dashed border-gray-300 text-[var(--brand-primary)] rounded-full px-4 py-3 hover:bg-gray-50 transition font-medium"
                >
                  Add customer details
                </button>
              ) : (
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">
                        {customerDetails.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {customerDetails.phone}
                      </p>
                      {customerDetails.address && (
                        <p className="text-xs text-gray-600">
                          {customerDetails.address}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditCustomer(customerDetails);
                        setShowCustomerModal(true);
                      }}
                      className="text-[var(--brand-primary)] text-sm font-medium hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              <div className="my-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Table/Room Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., Table 5 or Room 201"
                  value={tableRoomNumber}
                  onChange={(e) => setTableRoomNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#f0f0f0] border-0 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none placeholder-gray-500 text-sm"
                  rows={2}
                  placeholder="Add any special instructions..."
                />
              </div>
            </div>
          ) : (
            /* Out-Store Delivery Details */
            <>
              {allowsPickup && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                  <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-[var(--brand-primary)] mb-4">
                    How would you like to get it?
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { value: "DELIVERY", label: "Deliver to me" },
                        { value: "PICKUP", label: "Pick up at store" },
                      ] as const
                    ).map((option) => {
                      const selected =
                        (option.value === "PICKUP") === isPickup;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDeliveryMode(option.value)}
                          className={`rounded-2xl border-2 py-3 px-4 text-sm font-medium transition cursor-pointer ${
                            selected
                              ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-[var(--brand-on-primary)]"
                              : "border-gray-300 text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {isPickup && (
                    <p className="mt-3 rounded-xl bg-[#f0f0f0] p-3 text-xs leading-relaxed text-gray-600">
                      Your order will be prepared for in-store pickup
                      {pickupAddress ? ` at ${pickupAddress}` : ""}. There is no
                      delivery fee.
                    </p>
                  )}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-[var(--brand-primary)] mb-4">
                  {isPickup ? "Your Details" : "Delivery Details"}
                </h2>
                {!address ? (
                  <button
                    onClick={() => {
                      setEditAddress(emptyAddress);
                      setShowAddressModal(true);
                    }}
                    className="w-full border border-2 border-dashed border-gray-300 text-[var(--brand-primary)] rounded-full px-4 py-3 hover:bg-gray-50 transition font-medium"
                  >
                    {isPickup ? "Add your details" : "Add delivery details"}
                  </button>
                ) : (
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">
                          {address.firstName} {address.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{address.email}</p>
                        <p className="text-xs text-gray-600">
                          {address.phone}{" "}
                          {address.altPhone && `, ${address.altPhone}`}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditAddress(address);
                          setShowAddressModal(true);
                        }}
                        className="text-[var(--brand-primary)] text-sm font-medium hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {address.shippingAddress}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city && `${address.city}, `}
                      {address.state}, {address.country}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-[#f0f0f0] border-0 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none placeholder-gray-500 text-sm"
                    rows={2}
                    placeholder="Add delivery instructions..."
                  />
                </div>
              </div>

              {/* Delivery Method — no courier to choose when collecting. */}
              {!isPickup && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-[var(--brand-primary)] mb-4">
                  Delivery Method
                </h2>
                {isShipbubble && !address ? (
                  <p className="text-sm text-gray-500">
                    Add your delivery details above to see available delivery
                    options.
                  </p>
                ) : (
                  <CourierOptions
                    shippingOptions={shippingOptions}
                    selectedShipping={selectedShipping}
                    handleShippingSelect={handleShippingSelect}
                    isFetchingRates={isFetchingRates}
                    ratesError={ratesError}
                    refetchShipmentRates={refetchShipmentRates}
                  />
                )}
              </div>
              )}
            </>
          )}
        </div>

        {/* Right Column - Order Summary & Payment */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-[var(--brand-primary)] mb-4">
              Your Order
            </h2>
            <div className="space-y-4 mb-6">
              {cart.map((item) => {
                const itemPrice =
                  item.variation?.selling_price ||
                  item.product.selling_price ||
                  0;

                const maxQuantity =
                  item.variation?.quantity || item.product.quantity || 0;

                const cartItemKey = item.variation
                  ? `${item.product.id}-${item.variation.id}`
                  : item.product.id;

                return (
                  <div key={cartItemKey} className="flex items-start space-x-4">
                    <img
                      src={
                        getPrimaryImage(item.product) ||
                        "/placeholder-image.jpg"
                      }
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {item.product.name}
                      </h4>

                      {item.variation && (
                        <p className="text-xs text-black font-medium mt-0.5">
                          {item.variation.name}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        ₦{itemPrice.toFixed(2)} each
                      </p>

                      <div className="flex items-center space-x-2 mt-1">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.variation?.id,
                            )
                          }
                          className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center text-xs hover:bg-gray-100 transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-sm min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.variation?.id,
                            )
                          }
                          disabled={item.quantity >= maxQuantity}
                          className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center text-xs hover:bg-gray-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <span className="font-semibold text-sm flex-shrink-0">
                      ₦{formatCurrency(itemPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Payment Section */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₦{formatCurrency(subtotal)}</span>
              </div>
              {type === "out-store" && (
                <div className="flex justify-between text-sm">
                  <span>{isPickup ? "Store pick-up" : "Shipping"}</span>
                  <span>
                    ₦
                    {formatCurrency(
                      parseFloat(selectedShipping?.amount || "0"),
                    )}
                  </span>
                </div>
              )}

              {/* Transaction Fee Display */}
              {customerPaysTransactionFee &&
                allowOnlinePayment &&
                transactionFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Transaction Fee (1.5%, min ₦100, max ₦
                      {paymentMethod === "CARD" ? "1,500" : "1,000"})
                    </span>
                    <span>₦{formatCurrency(transactionFee)}</span>
                  </div>
                )}

              {/* Coupon Code */}
              <div className="flex items-center space-x-2 gap-3 pt-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-black/20 text-sm placeholder-gray-500"
                />
                <button
                  disabled={true}
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-[var(--brand-primary)] text-[var(--brand-on-primary)] rounded-full hover:opacity-90 transition text-sm cursor-pointer whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-6 mt-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-[var(--brand-primary)]">
                  ₦{formatCurrency(finalTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-[var(--brand-primary)] mb-4">
              Payment
            </h2>

            {type === "in-store" && (
              <>
                <PaymentOptionGrid
                  label="How would you like to pay?"
                  options={inStorePaymentOptions}
                  selected={inStorePaymentType}
                  onSelect={handleInStoreSelect}
                />

                {inStorePaymentType === "BNPL" && (
                  <PaymentPinField
                    value={paymentPin}
                    onChange={setPaymentPin}
                    phone={akawopayPhone}
                  onPhoneChange={updateBnplPhone}
                  flow="in-store"
                  />
                )}

                {/* Sets expectations before the buyer commits: this creates a
                    code for the counter, it does not complete the sale. */}
                <div className="mb-6 p-3 border border-gray-200 rounded-xl bg-[#f0f0f0]">
                  <p className="text-xs text-black">
                    You'll get an order code and QR to show the cashier. They'll
                    check your items and
                    {inStorePaymentType === "COUNTER"
                      ? " take payment at the counter."
                      : " hand them over once payment is confirmed."}
                  </p>
                </div>
              </>
            )}

            {type === "out-store" && allowOnlinePayment && (
              <>
                {/* Payment Method Selection */}
                <PaymentOptionGrid
                  label="Select Payment Method"
                  options={outStorePaymentOptions}
                  selected={paymentMethod}
                  onSelect={handleOutStoreSelect}
                />

                {/* Akawopay PIN — only asked for once BNPL is chosen */}
                {paymentMethod === "BNPL" && (
                  <PaymentPinField
                    value={paymentPin}
                    onChange={setPaymentPin}
                    phone={akawopayPhone}
                    onPhoneChange={updateBnplPhone}
                  flow="out-store"
                  />
                )}

                {/* Transaction Fee Notice — BNPL carries no buyer-facing fee */}
                {customerPaysTransactionFee && paymentMethod !== "BNPL" && (
                  <div className="mb-4 p-3 border border-gray-200 rounded-xl bg-[#f0f0f0]">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-black flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-xs text-black">
                        A transaction fee of{" "}
                        <span className="font-semibold">
                          1.5% (minimum ₦100, capped at{" "}
                          {paymentMethod === "CARD" ? "₦1,500" : "₦1,000"})
                        </span>{" "}
                        will be added to your total for{" "}
                        {paymentMethod === "CARD"
                          ? "card payments"
                          : "bank transfers"}
                        .
                      </p>
                    </div>
                  </div>
                )}

                {/* Card Details Form - Shows when CARD is selected */}
                {paymentMethod === "CARD" && (
                  <div className="mb-6 p-4 cursor-pointer border-2 border-gray-200 rounded-xl bg-[#f0f0f0] space-y-4 animate-fadeIn">
                    <h3 className="font-semibold text-sm text-gray-800 mb-3">
                      Card Details
                    </h3>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardDetails.card_number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, "");
                          if (value.length <= 16 && /^\d*$/.test(value)) {
                            handleCardDetailsChange("card_number", value);
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 text-sm placeholder-gray-500"
                        maxLength={19}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Expiry (YYMM) *
                        </label>
                        <input
                          type="text"
                          placeholder="0125"
                          value={cardDetails.expiry_date}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 4 && /^\d*$/.test(value)) {
                              handleCardDetailsChange("expiry_date", value);
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 text-sm placeholder-gray-500"
                          maxLength={4}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          CVV *
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 3 && /^\d*$/.test(value)) {
                              handleCardDetailsChange("cvv", value);
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 text-sm placeholder-gray-500"
                          maxLength={3}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          PIN *
                        </label>
                        <input
                          type="password"
                          placeholder="****"
                          value={cardDetails.card_pin}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 4 && /^\d*$/.test(value)) {
                              handleCardDetailsChange("card_pin", value);
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 text-sm placeholder-gray-500"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 flex items-start gap-2 mt-2">
                      <svg
                        className="w-4 h-4 text-black flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Your card information is encrypted and secure
                    </p>
                  </div>
                )}
              </>
            )}

            {type === "out-store" && !allowOnlinePayment && (
              <div className="mb-6 p-4 border-2 border-gray-200 rounded-xl bg-[#f0f0f0]">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-800 mb-1">
                      Payment on Confirmation
                    </h3>
                    <p className="text-xs text-gray-600">
                      The business will reach out to you for payment
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 flex flex-col gap-3">
              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlaceOrderDisabled}
                className={`w-full py-3.5 rounded-full font-medium transition flex items-center justify-center gap-2 ${
                  isPlaceOrderDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] hover:opacity-90 cursor-pointer"
                }`}
              >
                {placeOrderLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setEditCustomer(null);
        }}
      >
        <Customer
          currentCustomerForm={currentCustomerForm}
          handleCustomerFormChange={handleCustomerFormChange}
          setShowCustomerModal={setShowCustomerModal}
          setEditCustomer={setEditCustomer}
          handleCustomerSave={handleCustomerSave}
        />
      </Modal>

      {/* Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setEditAddress(null);
        }}
      >
        <Contact
          setShowAddressModal={setShowAddressModal}
          currentAddressForm={currentAddressForm}
          handleFormChange={handleFormChange}
          applyAddressSuggestion={applyAddressSuggestion}
          setEditAddress={setEditAddress}
          countryList={countryList}
          stateList={stateList}
          cityList={cityList}
          handleAddressSave={handleAddressSave}
        />
      </Modal>

      {/* OTP Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => !isProcessing && setShowOtpModal(false)}
      >
        <OtpModal
          onSubmit={handleOtpValidation}
          onClose={() => setShowOtpModal(false)}
          isProcessing={isProcessing}
        />
      </Modal>

      {/* Bank Transfer Details Modal */}
      <Modal
        isOpen={showBankTransferModal}
        onClose={() => setShowBankTransferModal(false)}
      >
        <BankTransfer
          total={finalTotal}
          formatCurrency={formatCurrency}
          bankTransferDetails={bankTransferDetails}
          onConfirmPayment={handleConfirmBankTransfer}
        />
      </Modal>

      <Modal
        isOpen={showPaymentSuccessModal}
        onClose={closePaymentSuccessModal}
      >
        {paymentSuccessOrder && (
          <PaymentSuccessModal
            order={paymentSuccessOrder}
            onContinue={closePaymentSuccessModal}
          />
        )}
      </Modal>

      {/* Akawopay account requirement — shown before the PIN is asked for */}
      <Modal
        isOpen={showBnplActivation}
        onClose={() => setShowBnplActivation(false)}
      >
        <BnplActivation
          onProceed={() => {
            setHasSeenBnplInfo(true);
            setShowBnplActivation(false);
          }}
        />
      </Modal>

      {/* Payment Modal (for external payment if needed) */}
      <Modal isOpen={openPaymentModal} onClose={closePaymentModal}>
        <PaymentCom close={closePaymentModal} subtotal={subtotal} />
      </Modal>

      {/* BNPL authorization — out-store only; in-store shows its status on the
          counter pass instead, so the buyer isn't stuck behind an overlay
          while walking to the till. */}
      {type === "out-store" && (
        <BnplStatusOverlay
          stage={bnplStage}
          message={bnplMessage}
          onDismiss={dismissBnpl}
        />
      )}
    </div>
  );
};
