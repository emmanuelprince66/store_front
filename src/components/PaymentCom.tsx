import {
  FaCheckCircle,
  FaCreditCard,
  FaLock,
  FaUniversity,
} from "react-icons/fa";

const PaymentCom = ({ close, subtotal }: { close: any; subtotal: any }) => {
  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  console.log("subtotal in paymentcom", subtotal);
  return (
    <div className="h-full  flex items-center justify-center p-4 w-full">
      <div className="w-full">
        {/* Header */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-slate-800">Checkout</h1>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="w-5 h-5 text-black" />
              <span className="text-sm text-slate-600">Secure</span>
            </div>
          </div>
          <p className="text-slate-600 text-sm">
            Complete your payment securely
          </p>
        </div>

        {/* Payment Amount */}
        <div className="bg-black p-6 shadow-lg w-full rounded-t-2xl">
          <p className="text-white/70 text-sm mb-1">Amount to Pay</p>
          <p className="text-4xl font-bold text-white mb-1">
            ₦ {formatCurrency(subtotal)}
          </p>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-b-2xl shadow-lg p-6 w-full">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Select Payment Method
          </h2>

          <div className="space-y-3 w-full">
            {/* Card Payment */}

            <div className="w-full">
              <button
                onClick={() =>
                  alert(
                    "Card Payment selected! Redirecting to card payment gateway..."
                  )
                }
                className="w-full group hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-black rounded-2xl p-5 bg-white hover:bg-[#f0f0f0] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center transition-all duration-300">
                    <FaCreditCard className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-black transition-colors">
                      Card Payment
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Pay with debit or credit card
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Visa, Mastercard, Verve accepted
                    </p>
                  </div>
                </div>
              </button>
            </div>
            <div className="w-full">
              {/* Bank Transfer */}
              <button
                onClick={() =>
                  alert("Bank Transfer selected! Generating account details...")
                }
                className="w-full group hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-black rounded-2xl p-5 bg-white hover:bg-[#f0f0f0] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center transition-all duration-300">
                    <FaUniversity className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-black transition-colors">
                      Bank Transfer
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Direct bank account transfer
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Instant confirmation
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={close}
              className="w-full cursor-pointer py-3 px-4 bg-[#f0f0f0] rounded-full text-black hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel Payment
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <FaLock className="w-4 h-4" />
            <span className="text-sm">
              Secured by{" "}
              <span className="font-semibold text-slate-700">
                VFD Microfinance Bank
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Your payment information is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCom;
