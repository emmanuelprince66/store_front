import AddressAutocomplete from "../components/AddressAutocomplete";

const Contact = ({
  countryList,
  stateList,
  cityList,
  handleAddressSave,
  setShowAddressModal,
  currentAddressForm,
  handleFormChange,
  applyAddressSuggestion,
  setEditAddress,
}: any) => {
  return (
    <>
      <div className="p-8 w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-2xl uppercase tracking-wide text-[var(--brand-primary)]">Delivery Details</h3>
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
              className="px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
            />
            <input
              type="text"
              placeholder="Last name"
              value={currentAddressForm.lastName}
              onChange={(e) => handleFormChange("lastName", e.target.value)}
              className="px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
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
                className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
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
                className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
              />
            </div>
          </div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email address *
          </label>
          <input
            type="email"
            placeholder="Email address "
            value={currentAddressForm.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
          />

          {/* Search sits above Country/State/City on purpose: picking a
              suggestion fills all three and pins the coordinates we send to
              Shipbubble, so asking for them first makes the buyer do work the
              search would have done. The dropdowns below are for confirming
              or correcting what the search resolved. */}
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-700 mt-4 mb-1">
              Shipping Address *
            </label>
            <AddressAutocomplete
              value={currentAddressForm.shippingAddress}
              countryCode={currentAddressForm.country}
              hasCoordinates={Boolean(
                currentAddressForm.latitude && currentAddressForm.longitude,
              )}
              placeholder="Enter full delivery address"
              onChange={(v: string) =>
                handleFormChange("shippingAddress", v)
              }
              onSelect={applyAddressSuggestion}
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
                className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
              >
                <option value="">Select country</option>
                {countryList.map((c: any) => (
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
                className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
                disabled={!stateList?.length}
              >
                <option value="">Select state</option>
                {stateList.map((s: any) => (
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
              className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
              disabled={!cityList.length}
            >
              <option value="">Select city</option>
              {cityList.map((ct: any) => (
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
              className="flex-1 bg-[#f0f0f0] text-black py-3.5 rounded-full hover:bg-gray-200 transition cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAddressSave({ ...currentAddressForm })}
              className="flex-1 bg-[var(--brand-primary)] text-[var(--brand-on-primary)] py-3.5 rounded-full hover:opacity-90 transition cursor-pointer font-medium"
            >
              Save Address
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
