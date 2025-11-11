import { Modal } from "../components/Modal";
import type { StoreData } from "../type";
import { useCheckoutHook } from "../useCheckoutHook";

interface CheckoutProps {
  onBack: () => void;
  type?: "in-store" | "out-store";
  storeData?: StoreData | null;
}

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
    showShippingModal,
    showCustomerModal,
    setShowAddressModal,
    setShowShippingModal,
    setShowCustomerModal,
    editAddress,
    editCustomer,
    currentAddressForm,
    currentCustomerForm,
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
    handleCustomerFormChange,
    handleAddressSave,
    handleCustomerSave,
    handleShippingSelect,
    handleApplyCoupon,
    handlePlaceOrder,
    handleExternalPayment,
    updateQuantity,
    formatCurrency,
    emptyAddress,
    emptyCustomer,
  } = useCheckoutHook({ type, storeData, onBack });

  console.log("storeData", storeData);
  console.log("cart", cart);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
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
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Customer Details</h2>
              {!customerDetails ? (
                <button
                  onClick={() => {
                    setEditCustomer(emptyCustomer);
                    setShowCustomerModal(true);
                  }}
                  className="w-full border border-red-300 text-red-600 rounded-lg px-4 py-3 hover:bg-red-50 transition"
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
                      <p className="text-xs text-gray-600">
                        {customerDetails.address}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditCustomer(customerDetails);
                        setShowCustomerModal(true);
                      }}
                      className="text-green-600 text-sm hover:underline cursor-pointer"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Add any special instructions..."
                />
              </div>
            </div>
          ) : (
            /* Out-Store Delivery Details */
            <>
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">Delivery Details</h2>
                {!address ? (
                  <button
                    onClick={() => {
                      setEditAddress(emptyAddress);
                      setShowAddressModal(true);
                    }}
                    className="w-full border border-red-300 text-red-600 rounded-lg px-4 py-3 hover:bg-red-50 transition"
                  >
                    Add delivery details
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
                        className="text-green-600 text-sm hover:underline cursor-pointer"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Add delivery instructions..."
                  />
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Method</h2>
                {!selectedShipping ? (
                  <>
                    <p className="text-gray-600 mb-3">
                      Click the button below to choose a shipping method
                    </p>
                    <button
                      onClick={() => setShowShippingModal(true)}
                      className="w-full border border-red-300 text-red-600 rounded-lg px-4 py-3 hover:bg-red-50 transition"
                    >
                      SELECT A SHIPPING METHOD
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 mb-4">
                    <p className="font-semibold text-sm">
                      {selectedShipping.location}
                    </p>
                    <p className="text-xs text-gray-600">
                      {selectedShipping.description}
                    </p>
                    <p className="text-green-600 text-sm">
                      ₦{formatCurrency(parseFloat(selectedShipping.amount))}
                    </p>
                    <button
                      onClick={() => setShowShippingModal(true)}
                      className="text-blue-600 text-sm hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column - Order Summary & Payment */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Your Order</h2>
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-start space-x-4"
                >
                  <img
                    src={item.product.image || "/placeholder-image.jpg"}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
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
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center text-xs hover:bg-gray-100 transition cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="font-semibold text-sm flex-shrink-0">
                    ₦
                    {formatCurrency(
                      (item?.product?.selling_price ||
                        item?.product?.cost_price ||
                        0) * item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₦{formatCurrency(subtotal)}</span>
              </div>
              {type === "out-store" && (
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    ₦
                    {formatCurrency(
                      parseFloat(selectedShipping?.amount || "0")
                    )}
                  </span>
                </div>
              )}

              {/* Coupon Code */}
              <div className="flex items-center space-x-2 gap-3 pt-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  disabled={true}
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm cursor-pointer whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-6 mt-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-green-600">₦{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Payment</h2>
            <div className="space-y-3 flex flex-col gap-4">
              {/* External Payment Button (Paystack - for future) */}
              <button
                onClick={handleExternalPayment}
                disabled={true}
                className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {"Pay with Paystack"}
              </button>

              {/* Internal Payment Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={
                  isProcessing ||
                  (type === "out-store"
                    ? !address || !selectedShipping
                    : !customerDetails)
                }
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  isProcessing ||
                  (type === "out-store"
                    ? !address || !selectedShipping
                    : !customerDetails)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                }`}
              >
                {isProcessing ? "Placing Order..." : "Place Order"}
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
        <div className="p-8 w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Customer Details</h3>
            <button
              onClick={() => {
                setShowCustomerModal(false);
                setEditCustomer(null);
              }}
              className="text-gray-500 text-xl cursor-pointer hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                placeholder="Customer name"
                value={currentCustomerForm.name}
                onChange={(e) =>
                  handleCustomerFormChange("name", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                placeholder="Phone number"
                value={currentCustomerForm.phone}
                onChange={(e) =>
                  handleCustomerFormChange("phone", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                placeholder="Customer address"
                value={currentCustomerForm.address}
                onChange={(e) =>
                  handleCustomerFormChange("address", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-4 gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCustomerModal(false);
                  setEditCustomer(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCustomerSave({ ...currentCustomerForm })}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition cursor-pointer font-semibold"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setEditAddress(null);
        }}
      >
        <div className="p-8 w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Delivery Details</h3>
            <button
              onClick={() => {
                setShowAddressModal(false);
                setEditAddress(null);
              }}
              className="text-gray-500 text-xl cursor-pointer hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First name *"
                value={currentAddressForm.firstName}
                onChange={(e) => handleFormChange("firstName", e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Last name"
                value={currentAddressForm.lastName}
                onChange={(e) => handleFormChange("lastName", e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone number *
                </label>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={currentAddressForm.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Alternative Phone
                </label>
                <input
                  type="tel"
                  placeholder="Alternative Phone"
                  value={currentAddressForm.altPhone}
                  onChange={(e) => handleFormChange("altPhone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <input
              type="email"
              placeholder="Email address *"
              value={currentAddressForm.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mt-4 mb-1">
                Shipping Address *
              </label>
              <textarea
                placeholder="Enter full delivery address"
                value={currentAddressForm.shippingAddress}
                onChange={(e) =>
                  handleFormChange("shippingAddress", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  value={currentAddressForm.country}
                  onChange={(e) => handleFormChange("country", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select country</option>
                  {countryList.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  State / Region *
                </label>
                <select
                  value={currentAddressForm.state}
                  onChange={(e) => handleFormChange("state", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!stateList.length}
                >
                  <option value="">Select state</option>
                  {stateList.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                City (Optional)
              </label>
              <select
                value={currentAddressForm.city}
                onChange={(e) => handleFormChange("city", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!cityList.length}
              >
                <option value="">Select city</option>
                {cityList.map((ct) => (
                  <option key={ct.name} value={ct.name}>
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4 gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  setEditAddress(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddressSave({ ...currentAddressForm })}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition cursor-pointer font-semibold"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Shipping Modal */}
      <Modal
        isOpen={showShippingModal}
        onClose={() => setShowShippingModal(false)}
      >
        <div className="p-8 w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Select Shipping</h3>
            <button
              onClick={() => setShowShippingModal(false)}
              className="text-gray-500 text-xl cursor-pointer hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            {shippingOptions.length > 0 ? (
              shippingOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex gap-3 items-center space-x-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping?.id === option.id}
                      onChange={() => handleShippingSelect(option)}
                      className="h-5 w-5 text-blue-600 border-gray-300"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {option.location}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">
                    ₦{option.amount}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No shipping options available
              </p>
            )}
          </div>
        </div>
      </Modal>
      {/* Suuccess Modal */}
      <Modal
        isOpen={showShippingModal}
        onClose={() => setShowShippingModal(false)}
      >
        <div className="p-8 w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Select Shipping</h3>
            <button
              onClick={() => setShowShippingModal(false)}
              className="text-gray-500 text-xl cursor-pointer hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            {shippingOptions.length > 0 ? (
              shippingOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex gap-3 items-center space-x-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping?.id === option.id}
                      onChange={() => handleShippingSelect(option)}
                      className="h-5 w-5 text-blue-600 border-gray-300"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {option.location}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">
                    ₦{option.amount}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No shipping options available
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
