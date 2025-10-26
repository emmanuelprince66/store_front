import { City, Country, State } from "country-state-city";
import { useContext, useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import { CartContext } from "../context/CartContext";

interface Address {
  firstName: string;
  lastName: string;
  phone: string;
  altPhone: string;
  email: string;
  shippingAddress: string;
  country: string; // use ISO code or name (we’ll use ISO code)
  state: string; // ISO code or name
  city: string;
}

interface ShippingOption {
  name: string;
  price: number;
}

interface CheckoutProps {
  onBack: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ onBack }) => {
  const { cart, getTotalPrice, updateQuantity } = useContext(CartContext);
  const subtotal = getTotalPrice();

  const [address, setAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const shippingOptions: ShippingOption[] = [
    { name: "FLAT RATE", price: 1000 },
    { name: "Customer Pick-up", price: 0 },
    { name: "Akur", price: 7778 },
    { name: "Apata, Akala express, John road.", price: 500 },
  ];

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleAddressSave = (newAddress: Address) => {
    setAddress(newAddress);
    setShowAddressModal(false);
    setEditAddress(null);
  };

  const handleShippingSelect = (option: ShippingOption) => {
    setSelectedShipping(option);
    setShowShippingModal(false);
  };

  const handlePlaceOrder = () => {
    if (!address) {
      alert("Please add delivery details.");
      return;
    }
    if (!selectedShipping) {
      alert("Please select a shipping method.");
      return;
    }
    console.log("Initiate Paystack payment for order");
    alert("Order placed successfully! (Simulated Paystack payment)");
    onBack();
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      alert("Please enter a coupon code.");
      return;
    }
    console.log("Apply coupon:", couponCode);
    alert("Coupon applied! (Simulated)");
  };

  const total = subtotal + (selectedShipping?.price || 0);

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

  const currentAddressForm = editAddress || emptyAddress;

  const handleFormChange = (field: keyof Address, value: string) => {
    setEditAddress((prev) => ({
      ...(prev || emptyAddress),
      [field]: value,
    }));
  };

  // For dropdown options
  const [countryList] = useState(() => Country.getAllCountries());
  const [stateList, setStateList] = useState(() => [] as any[]);
  const [cityList, setCityList] = useState(() => [] as any[]);

  // When country changes, load states
  useEffect(() => {
    if (currentAddressForm.country) {
      const states = State.getStatesOfCountry(currentAddressForm.country);
      setStateList(states);
    } else {
      setStateList([]);
    }
    // Reset downstream
    handleFormChange("state", "");
    handleFormChange("city", "");
  }, [currentAddressForm.country]);

  // When state changes, load cities
  useEffect(() => {
    if (currentAddressForm.country && currentAddressForm.state) {
      const cities = City.getCitiesOfState(
        currentAddressForm.country,
        currentAddressForm.state
      );
      setCityList(cities);
    } else {
      setCityList([]);
    }
    handleFormChange("city", "");
  }, [currentAddressForm.state, currentAddressForm.country]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
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
        {/* Left: Delivery & Shipping */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Delivery Details</h2>
            {!address ? (
              <>
                <button
                  onClick={() => {
                    setEditAddress(emptyAddress);
                    setShowAddressModal(true);
                  }}
                  className="w-full border border-red-300 text-red-600 rounded-lg px-4 py-3 hover:bg-red-50 transition"
                >
                  Add delivery details
                </button>
                {/* no error message by default */}
              </>
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
                placeholder="Note (Optional)"
              />
            </div>
          </div>

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
                <p className="font-semibold text-sm">{selectedShipping.name}</p>
                <p className="text-green-600 text-sm">
                  ₦{formatCurrency(selectedShipping.price)}
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
        </div>

        {/* Right: Order & Payment */}
        <div className="space-y-6">
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
                      item?.product?.cost_price || 0 * item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₦{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>₦{formatCurrency(selectedShipping?.price || 0)}</span>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm cursor-pointer whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="border-t pt-6 mt-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-green-600">₦{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="space-y-4 flex flex-col gap-4">
              {/* Replace radio with button for paystack */}
              <button className="w-full py-3 rounded-lg max-w-[100px] font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                PayStack
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={!address || !selectedShipping}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  !address || !selectedShipping
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                }`}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setEditAddress(null);
        }}
      >
        <div className="p-8  w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">
              {editAddress ? "Edit Address" : "Delivery Details"}
            </h3>
            <button
              onClick={() => {
                setShowAddressModal(false);
                setEditAddress(null);
              }}
              className="text-gray-500 text-xl cursor-pointer"
            >
              ×
            </button>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First name *"
                value={currentAddressForm.firstName}
                onChange={(e) => handleFormChange("firstName", e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
                  required
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
              required
            />

            {/* <input
              type="text"
              placeholder="Street / Address *"
              value={currentAddressForm.shippingAddress}
              onChange={(e) =>
                handleFormChange("shippingAddress", e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            /> */}

            {/* Country / State / City selects */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  value={currentAddressForm.country}
                  onChange={(e) => handleFormChange("country", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
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
                  required
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
                onClick={() => setEditAddress(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const newAddr = { ...currentAddressForm };
                  handleAddressSave(newAddr);
                }}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition cursor-pointer font-semibold"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Shipping Modal */}
      <Modal
        isOpen={showShippingModal}
        onClose={() => setShowShippingModal(false)}
      >
        <div className="p-8  w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Select Shipping</h3>
            <button
              onClick={() => setShowShippingModal(false)}
              className="text-gray-500 text-xl cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            {shippingOptions.map((option) => (
              <label
                key={option.name}
                className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex gap-3 items-center space-x-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={selectedShipping?.name === option.name}
                    onChange={() => handleShippingSelect(option)}
                    className="h-5 w-5 text-blue-600 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{option.name}</span>
                </div>
                <span className="font-semibold text-sm">
                  ₦{formatCurrency(option.price)}
                </span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
