import { City, Country, State } from "country-state-city";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CartContext } from "./context/CartContext";
import type { StoreData } from "./type";
const BaseUrl = "https://www.staging-api.sync360.africa/api/v1";

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
}

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
}

interface ShippingOption {
  id: string;
  location: string;
  amount: string;
  description: string;
  visible: boolean;
}

interface CheckoutProduct {
  product_id: string;
  quantity: number;
  unit_price?: number;
  discount?: number;
}

interface CheckoutPayload {
  products: CheckoutProduct[];
  payment_method?: string | null;
  amount_paid?: string;
  bank?: string;
  note?: string;
  shipping_method?: string;
  shipping_fee?: string;
  tax?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  table_or_room?: string;
  address?: {
    first_name: string;
    last_name: string;
    phone: string;
    alt_phone?: string | null;
    email: string;
    country: string;
    state: string;
    city?: string | null;
  };
}

interface UseCheckoutHookProps {
  type?: "in-store" | "out-store";
  storeData?: StoreData | null;
  onBack: () => void;
}

export const useCheckoutHook = ({
  type = "out-store",
  storeData,
}: // onBack,
UseCheckoutHookProps) => {
  const { cart, getTotalPrice, updateQuantity, clearCart } =
    useContext(CartContext);
  const subtotal = getTotalPrice();
  const navigate = useNavigate();
  const location = useLocation();
  const slug = location.search.substring(6) || "";

  // Address state
  const [address, setAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);

  // Shipping state
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [showShippingModal, setShowShippingModal] = useState(false);

  // Customer state (for in-store)
  const [customerDetails, setCustomerDetails] =
    useState<CustomerDetails | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerDetails | null>(
    null
  );

  // Other fields
  const [note, setNote] = useState("");
  const [tableRoomNumber, setTableRoomNumber] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"internal" | "external">(
    "internal"
  );

  // Location data
  const [countryList] = useState(() => Country.getAllCountries());
  const [stateList, setStateList] = useState<any[]>([]);
  const [cityList, setCityList] = useState<any[]>([]);

  // Get shipping options from storeData
  const shippingOptions: ShippingOption[] =
    storeData?.results?.shipping?.filter((s) => s.visible) || [];

  console.log("shippingOptions", shippingOptions);

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
  const total =
    type === "out-store"
      ? subtotal + parseFloat(selectedShipping?.amount || "0")
      : subtotal;

  // Handle form changes
  const handleFormChange = (field: keyof Address, value: string) => {
    setEditAddress((prev) => ({
      ...(prev || emptyAddress),
      [field]: value,
    }));
  };

  const handleCustomerFormChange = (
    field: keyof CustomerDetails,
    value: string
  ) => {
    setEditCustomer((prev) => ({
      ...(prev || emptyCustomer),
      [field]: value,
    }));
  };

  // Handle country/state/city changes
  useEffect(() => {
    if (currentAddressForm.country) {
      const states = State.getStatesOfCountry(currentAddressForm.country);
      setStateList(states);
      handleFormChange("state", "");
      handleFormChange("city", "");
    } else {
      setStateList([]);
    }
  }, [currentAddressForm.country]);

  useEffect(() => {
    if (currentAddressForm.country && currentAddressForm.state) {
      const cities = City.getCitiesOfState(
        currentAddressForm.country,
        currentAddressForm.state
      );
      setCityList(cities);
      handleFormChange("city", "");
    } else {
      setCityList([]);
    }
  }, [currentAddressForm.state, currentAddressForm.country]);

  // Handle address save
  const handleAddressSave = (newAddress: Address) => {
    if (
      !newAddress.firstName ||
      !newAddress.phone ||
      !newAddress.email ||
      !newAddress.country ||
      !newAddress.state
    ) {
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
    if (!details.name || !details.phone || !details.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCustomerDetails(details);
    setShowCustomerModal(false);
    setEditCustomer(null);
    toast.success("Customer details saved successfully");
  };

  // Handle shipping select
  const handleShippingSelect = (option: ShippingOption) => {
    setSelectedShipping(option);
    setShowShippingModal(false);
    toast.success(`Shipping method: ${option.location} selected`);
  };

  // Handle coupon apply
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    // TODO: Implement coupon validation API call
    console.log("Apply coupon:", couponCode);
    toast.info("Coupon feature coming soon!");
  };

  // Validate checkout
  const validateCheckout = (): boolean => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return false;
    }

    if (type === "out-store") {
      if (!address) {
        toast.error("Please add delivery details");
        return false;
      }
      if (!selectedShipping) {
        toast.error("Please select a shipping method");
        return false;
      }
    } else {
      if (!customerDetails) {
        toast.error("Please add customer details");
        return false;
      }
    }

    return true;
  };

  // Build checkout payload
  const buildCheckoutPayload = (): CheckoutPayload => {
    const products: CheckoutProduct[] = cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price:
        typeof item.product.selling_price === "number"
          ? item.product.selling_price
          : typeof item.product.cost_price === "number"
          ? item.product.cost_price
          : undefined,
      discount: item?.product?.discount || 0,
    }));

    const payload: CheckoutPayload = {
      products,
      payment_method: null, // Will be set based on payment flow
      amount_paid: total.toFixed(2),
      note: note || undefined,
      // shipping_method: type === "out-store" ? "Delivery" : undefined,
      shipping_fee:
        type === "out-store" ? selectedShipping?.amount || "0.00" : "0.00",
      tax: "0.00",
    };

    if (type === "in-store") {
      payload.customer_name = customerDetails?.name;
      payload.customer_phone = customerDetails?.phone;
      payload.customer_address = customerDetails?.address;
      payload.table_or_room = tableRoomNumber || undefined;
    } else {
      payload.customer_name = `${address?.firstName} ${address?.lastName}`;
      payload.customer_phone = address?.phone;
      payload.customer_address = address?.shippingAddress;
      payload.address = {
        first_name: address?.firstName || "",
        last_name: address?.lastName || "",
        phone: address?.phone || "",
        alt_phone: address?.altPhone || null,
        email: address?.email || "",
        country: address?.country || "",
        state: address?.state || "",
        city: address?.city || null,
      };
    }

    return payload;
  };

  // Handle place order (internal payment)
  const handlePlaceOrder = async () => {
    if (!validateCheckout()) return;

    if (!storeData?.results?.info) {
      toast.error("Store information not available");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = buildCheckoutPayload();

      payload.payment_method = "cash"; // Or other internal payment method
      const businessId = storeData.results.info.id || "";
      const endpoint =
        type === "in-store"
          ? `${BaseUrl}/order/business/${businessId}/instore-checkout/`
          : `${BaseUrl}/order/business/${businessId}/outstore-checkout/`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to place order");
      }

      // toast.success("Order placed successfully!");
      clearCart();

      // Reset all states
      setAddress(null);
      setCustomerDetails(null);
      setSelectedShipping(null);
      setNote("");
      setTableRoomNumber("");
      setCouponCode("");

      // Navigate back after short delay

      type === "out-store"
        ? navigate("/out-store/success?slug=" + slug)
        : navigate("/in-store/success?slug=" + slug);

      // setTimeout(() => {
      //   onBack();
      // }, 1500);
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle external payment (Paystack, etc.)
  const handleExternalPayment = async () => {
    if (!validateCheckout()) return;

    if (!storeData?.results?.info) {
      toast.error("Store information not available");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = buildCheckoutPayload();
      payload.payment_method = "paystack"; // Or other external payment gateway

      // TODO: Implement Paystack integration
      // 1. Initialize payment with Paystack
      // 2. Get payment reference
      // 3. Create order with payment reference
      // 4. Redirect to Paystack checkout

      toast.info("External payment integration coming soon!");
      console.log("Payment payload:", payload);
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(
        error.message || "Failed to initialize payment. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
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

    // Modals
    showAddressModal,
    showShippingModal,
    showCustomerModal,
    setShowAddressModal,
    setShowShippingModal,
    setShowCustomerModal,

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

    // Setters
    setNote,
    setTableRoomNumber,
    setCouponCode,
    setPaymentMethod,

    // Handlers
    handleFormChange,
    handleCustomerFormChange,
    handleAddressSave,
    handleCustomerSave,
    handleShippingSelect,
    handleApplyCoupon,
    handlePlaceOrder,
    handleExternalPayment,
    updateQuantity,

    // Utilities
    formatCurrency,
    emptyAddress,
    emptyCustomer,
  };
};
