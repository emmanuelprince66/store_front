interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardPin: string;
}

interface CardPaymentFormProps {
  cardDetails: CardDetails;
  onChange: (details: CardDetails) => void;
  disabled?: boolean;
}

export const CardPaymentForm = ({
  cardDetails,
  onChange,
  disabled = false,
}: CardPaymentFormProps) => {
  const updateField = (field: keyof CardDetails, value: string) => {
    onChange({ ...cardDetails, [field]: value });
  };

  const handleCardNumberChange = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 19);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    updateField("cardNumber", formatted);
  };

  const handleExpiryChange = (value: string) => {
    let clean = value.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 3) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    updateField("expiryDate", clean);
  };

  const handleCvvChange = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 4);
    updateField("cvv", raw);
  };

  const handlePinChange = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 4);
    updateField("cardPin", raw);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-[#f0f0f0] p-5">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Card Number</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={cardDetails.cardNumber}
          onChange={(e) => handleCardNumberChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-mono tracking-wider outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={cardDetails.expiryDate}
            onChange={(e) => handleExpiryChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">CVV</label>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={cardDetails.cvv}
            onChange={(e) => handleCvvChange(e.target.value)}
            disabled={disabled}
            maxLength={4}
            className="w-full rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Card PIN <span className="text-gray-400 font-normal">(4 digits, if required)</span>
        </label>
        <input
          type="password"
          inputMode="numeric"
          placeholder="••••"
          value={cardDetails.cardPin}
          onChange={(e) => handlePinChange(e.target.value)}
          disabled={disabled}
          maxLength={4}
          className="w-full rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-100"
        />
      </div>
    </div>
  );
};
