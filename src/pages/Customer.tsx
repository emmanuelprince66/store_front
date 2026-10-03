const Customer = ({
  handleCustomerSave,
  currentCustomerForm,
  handleCustomerFormChange,
  setShowCustomerModal,
  setEditCustomer,
}: any) => {
  return (
    <>
      <div className="p-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-2xl uppercase tracking-wide text-[var(--brand-primary)]">Customer Details</h3>
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
              onChange={(e) => handleCustomerFormChange("name", e.target.value)}
              className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
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
              className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              placeholder="Email address"
              value={currentCustomerForm.email}
              onChange={(e) =>
                handleCustomerFormChange("email", e.target.value)
              }
              className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Address (Optional)
            </label>
            <input
              type="text"
              placeholder="Customer address"
              value={currentCustomerForm.address}
              onChange={(e) =>
                handleCustomerFormChange("address", e.target.value)
              }
              className="w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
            />
          </div>

          <div className="flex space-x-4 gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCustomerModal(false);
                setEditCustomer(null);
              }}
              className="flex-1 bg-[#f0f0f0] text-black py-3.5 rounded-full hover:bg-gray-200 transition cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleCustomerSave({ ...currentCustomerForm })}
              className="flex-1 bg-[var(--brand-primary)] text-[var(--brand-on-primary)] py-3.5 rounded-full hover:opacity-90 transition cursor-pointer font-medium"
            >
              Save Details
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Customer;
