import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getCustomStoreDomain } from "../utils/storefront";
import { useThemeSnapshot } from "../utils/theme";

type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  initials: string;
  color: string;
};

type PaymentMethod = "CARD" | "BANK-TRANSFER" | "BNPL";

const SERVICES: Service[] = [
  {
    id: "haircut",
    name: "Haircut",
    description: "Classic haircut and styling for all hair types",
    duration: 45,
    price: 5000,
    initials: "HA",
    color: "#83e9a9",
  },
  {
    id: "beard-trim",
    name: "Beard Trim",
    description: "Professional beard shaping and grooming",
    duration: 30,
    price: 3000,
    initials: "BE",
    color: "#91c2fb",
  },
  {
    id: "haircut-beard",
    name: "Haircut + Beard",
    description: "Complete grooming package — hair and beard",
    duration: 60,
    price: 7000,
    initials: "HA",
    color: "#c5b3fb",
  },
];

const TIME_SLOTS = [
  "9:00 AM",
  "9:45 AM",
  "10:30 AM",
  "11:15 AM",
  "2:00 PM",
  "2:45 PM",
  "3:30 PM",
  "4:15 PM",
];

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "CARD",
    label: "Card",
    description: "Pay securely with your debit or credit card",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    value: "BANK-TRANSFER",
    label: "Bank transfer",
    description: "Transfer directly to the business account",
    icon: "M3 10h18M5 10V7l7-4 7 4v3M5 10v10m4-10v10m6-10v10m4-10v10M3 20h18",
  },
  {
    value: "BNPL",
    label: "Buy Now, Pay Later",
    description: "Book now and pay in installments",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

const formatCurrency = (amount: number, currency: string) => {
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(amount);

  return /^[A-Z]{3}$/.test(currency)
    ? new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount)
    : `${currency}${formattedAmount}`;
};

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const StepIcon = ({ path }: { path: string }) => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d={path}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

const Services = () => {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(localDateKey(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("CARD");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const storeDomain = getCustomStoreDomain();
  const { vars: themeVars } = useThemeSnapshot(slug || storeDomain);
  const storeName = "Tobi's Grooming Lounge";
  const storeLocation = "Lagos, Nigeria";
  const currency = "₦";

  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        return date;
      }),
    [],
  );

  const dateLabel = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-NG", options).format(new Date(`${value}T12:00:00`));

  const updateCustomer = (field: keyof typeof customer, value: string) => {
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const startBooking = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(localDateKey(new Date()));
    setSelectedTime(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canContinueToDetails = Boolean(selectedDate && selectedTime);
  const canContinueToPayment =
    customer.name.trim().length > 0 &&
    customer.phone.trim().length > 0 &&
    customer.email.trim().length > 0;

  const pageTitle = [
    "Our Services",
    `Book ${selectedService?.name ?? "a service"}`,
    "Your Details",
    "Complete Booking",
    "Booking Confirmed",
  ][step];

  const summary = selectedService && (
    <div className="rounded-2xl border border-[#e7ece8] bg-white p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-[#102d20]"
          style={{ backgroundColor: selectedService.color }}
        >
          {selectedService.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#16231c]">
            {selectedService.name}
          </p>
          <p className="text-xs text-[#77827b]">
            {selectedService.duration} minutes
          </p>
        </div>
        <p className="font-extrabold text-[#278e5b]">
          {formatCurrency(selectedService.price, currency)}
        </p>
      </div>
      {step >= 2 && (
        <div className="mt-4 space-y-2 border-t border-[#edf0ee] pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-[#77827b]">Date</span>
            <span className="text-right font-medium text-[#26322b]">
              {dateLabel(selectedDate, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#77827b]">Time</span>
            <span className="font-medium text-[#26322b]">{selectedTime}</span>
          </div>
        </div>
      )}
    </div>
  );

  const handlePayment = () => {
    goToStep(4);
  };

  return (
    <div
      className="min-h-screen bg-[#f3f7f4] text-[#17221b]"
      style={themeVars}
    >
      {step === 0 ? (
        <>
          <header className="bg-[#173d2b] text-white">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4 sm:px-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2d9765] text-sm font-extrabold">
                TG
              </span>
              <div>
                <h1 className="font-bold">{storeName}</h1>
                <p className="text-xs text-white/75">
                  {storeLocation} <span className="ml-1 text-amber-300">★★★★★</span>
                  <span className="ml-1">4.9</span>
                </p>
              </div>
            </div>
          </header>

          <div className="border-b border-[#e7ece8] bg-white">
            <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
              <p className="text-sm text-[#66736b]">
                Premium grooming and barbershop services for men.
              </p>
              <p className="mt-1 text-xs font-medium text-[#278e5b]">
                ◉ sync360.africa/store/{slug}
              </p>
            </div>
          </div>

          <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-10">
            <section className="mx-auto max-w-3xl">
              <h2 className="mb-5 text-lg font-extrabold">Our Services</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SERVICES.map((service) => (
                  <article
                    key={service.id}
                    className="overflow-hidden rounded-2xl border border-[#e7ece8] bg-white shadow-sm"
                  >
                    <div
                      className="relative flex h-28 items-center justify-center"
                      style={{ backgroundColor: service.color }}
                    >
                      <span className="absolute right-2 top-2 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-medium text-[#4c5951]">
                        ◷ {service.duration >= 60 ? `${service.duration / 60} hour${service.duration > 60 ? "s" : ""}` : `${service.duration} minutes`}
                      </span>
                      <span className="text-2xl font-extrabold tracking-wide text-[#102d20]">
                        {service.initials}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold">{service.name}</h3>
                      <p className="mt-1 min-h-9 text-xs leading-5 text-[#77827b]">
                        {service.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="font-extrabold text-[#278e5b]">
                          {formatCurrency(service.price, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => startBooking(service)}
                          className="rounded-lg bg-[#2d9765] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#247e53]"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-[#8a948e]">
              Preview booking flow — services, appointments, and payments shown
              here are sample data.
            </p>
          </main>
        </>
      ) : (
        <>
          <header className="border-b border-[#e7ece8] bg-white">
            <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-5 sm:px-8">
              {step < 4 && (
                <button
                  type="button"
                  onClick={() => goToStep(step === 1 ? 0 : step - 1)}
                  aria-label="Go back"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d5ddd7] text-[#59675f] hover:bg-[#f3f7f4]"
                >
                  ←
                </button>
              )}
              <div>
                <h1 className="text-xl font-extrabold sm:text-2xl">{pageTitle}</h1>
                <p className="mt-1 text-xs text-[#77827b]">{storeName} · {storeLocation}</p>
              </div>
            </div>
          </header>

          <main className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0 space-y-4">
              {step === 1 && (
                <>
                  {summary}
                  <div className="rounded-2xl border border-[#e7ece8] bg-white p-4 sm:p-5">
                    <h2 className="mb-4 text-sm font-bold">Choose a Date</h2>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {dates.map((date) => {
                        const key = localDateKey(date);
                        const isSelected = selectedDate === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedDate(key)}
                            aria-pressed={isSelected}
                            className={`rounded-xl border px-1 py-3 text-center transition ${
                              isSelected
                                ? "border-[#2d9765] bg-[#2d9765] text-white"
                                : "border-[#d8dfda] text-[#46534b] hover:border-[#2d9765]"
                            }`}
                          >
                            <span className="block text-[10px] font-semibold uppercase">
                              {new Intl.DateTimeFormat("en", { weekday: "short" }).format(date)}
                            </span>
                            <span className="mt-1 block text-base font-extrabold">
                              {date.getDate()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e7ece8] bg-white p-4 sm:p-5">
                    <h2 className="mb-4 text-sm font-bold">Choose a Time</h2>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {TIME_SLOTS.map((time, index) => {
                        const isSelected = selectedTime === time;
                        const isUnavailable = index === TIME_SLOTS.length - 1;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isUnavailable}
                            onClick={() => setSelectedTime(time)}
                            aria-pressed={isSelected}
                            className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                              isUnavailable
                                ? "cursor-not-allowed border-[#e0e4e1] bg-[#f3f4f3] text-[#a9b0ab] line-through"
                                : isSelected
                                  ? "border-[#2d9765] bg-[#e9f6ed] text-[#237a4f]"
                                  : "border-[#d8dfda] bg-white hover:border-[#2d9765]"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canContinueToDetails}
                    onClick={() => goToStep(2)}
                    className="w-full rounded-lg bg-[#2d9765] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#247e53] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue <span aria-hidden="true">→</span>
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <form
                    id="customer-details"
                    className="space-y-4 rounded-2xl border border-[#e7ece8] bg-white p-5 sm:p-6"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (canContinueToPayment) goToStep(3);
                    }}
                  >
                    {(
                      [
                        ["name", "Full Name", "e.g. Adaeze Okonkwo", "text"],
                        ["phone", "Phone Number", "e.g. 0803 123 4567", "tel"],
                        ["email", "Email Address", "e.g. adaeze@gmail.com", "email"],
                      ] as const
                    ).map(([field, label, placeholder, type]) => (
                      <label key={field} className="block text-xs font-medium text-[#344139]">
                        {label}
                        <input
                          required
                          type={type}
                          value={customer[field]}
                          onChange={(event) => updateCustomer(field, event.target.value)}
                          placeholder={placeholder}
                          className="mt-1.5 w-full rounded-lg border border-[#d2dad4] px-3 py-2.5 text-sm outline-none placeholder:text-[#a0aaa3] focus:border-[#2d9765] focus:ring-2 focus:ring-[#2d9765]/15"
                        />
                      </label>
                    ))}
                    <label className="block text-xs font-medium text-[#344139]">
                      Notes (Optional)
                      <textarea
                        rows={3}
                        value={customer.notes}
                        onChange={(event) => updateCustomer("notes", event.target.value)}
                        placeholder="e.g. Please keep my usual haircut style."
                        className="mt-1.5 w-full resize-y rounded-lg border border-[#d2dad4] px-3 py-2.5 text-sm outline-none placeholder:text-[#a0aaa3] focus:border-[#2d9765] focus:ring-2 focus:ring-[#2d9765]/15"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={!canContinueToPayment}
                      className="w-full rounded-lg bg-[#2d9765] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#247e53] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue to Payment <span aria-hidden="true">→</span>
                    </button>
                  </form>
                  <div className="lg:hidden">{summary}</div>
                </>
              )}

              {step === 3 && selectedService && (
                <>
                  <div className="rounded-2xl border border-[#e7ece8] border-t-4 border-t-[#2d9765] bg-white p-5">
                    <div className="flex items-center gap-3 border-b border-[#edf0ee] pb-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6ed] text-xs font-extrabold text-[#278e5b]">
                        TG
                      </span>
                      <div>
                        <p className="text-sm font-bold">{storeName}</p>
                        <p className="text-xs text-[#77827b]">{storeLocation}</p>
                      </div>
                    </div>
                    <div className="space-y-3 py-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-[#77827b]">Service</span>
                        <span className="font-semibold">{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#77827b]">Date</span>
                        <span className="text-right font-semibold">
                          {dateLabel(selectedDate, {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#77827b]">Time</span>
                        <span className="font-semibold">
                          {selectedTime} ({selectedService.duration} minutes)
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#77827b]">Customer</span>
                        <span className="font-semibold">{customer.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-[#edf0ee] pt-4">
                      <span className="font-bold">Total</span>
                      <span className="text-lg font-extrabold text-[#278e5b]">
                        {formatCurrency(selectedService.price, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e7ece8] bg-white p-5">
                    <h2 className="mb-1 text-sm font-bold">Pay Securely</h2>
                    <p className="mb-4 text-xs text-[#77827b]">
                      Choose how you’d like to pay. This is a preview; no payment will be processed.
                    </p>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = selectedPayment === method.value;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setSelectedPayment(method.value)}
                            aria-pressed={isSelected}
                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                              isSelected
                                ? "border-[#2d9765] bg-[#f1faf4] ring-1 ring-[#2d9765]"
                                : "border-[#dce3de] hover:border-[#9ebbaa]"
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#278e5b]">
                              <StepIcon path={method.icon} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold">{method.label}</span>
                              <span className="block text-xs text-[#77827b]">
                                {method.description}
                              </span>
                            </span>
                            <span
                              className={`h-4 w-4 shrink-0 rounded-full border ${
                                isSelected
                                  ? "border-[5px] border-[#2d9765]"
                                  : "border-[#cbd5ce]"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {selectedPayment === "CARD" && (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#f5f8f6] p-4">
                        <div>
                          <p className="text-sm font-semibold text-[#344139]">
                            Secure card checkout
                          </p>
                          <p className="mt-1 text-xs text-[#77827b]">
                            Card details are entered securely with the payment provider.
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-extrabold tracking-wide text-[#526653]">
                          VISA · Verve
                        </span>
                      </div>
                    )}

                    {selectedPayment === "BANK-TRANSFER" && (
                      <div className="mt-4 overflow-hidden rounded-xl border border-[#dce3de] text-sm">
                        {[
                          ["Bank", "VFD MicroFinance Bank"],
                          ["Account No.", "1040800190"],
                          ["Account Name", storeName],
                          ["Amount", formatCurrency(selectedService.price, currency)],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex justify-between gap-3 border-b border-[#e5eae6] bg-[#fbfcfb] px-3 py-3 last:border-0"
                          >
                            <span className="text-xs text-[#77827b]">{label}</span>
                            <span className="text-right text-xs font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedPayment === "BNPL" && (
                      <div className="mt-4 rounded-xl bg-[#edf7e5] p-4 text-sm">
                        <p className="font-bold text-[#294a32]">Pay in installments</p>
                        <p className="mt-1 text-xs leading-5 text-[#526653]">
                          Buy Now, Pay Later lets you reserve your appointment now and split your payment over time.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handlePayment}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d9765] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#247e53]"
                  >
                    <span aria-hidden="true">✓</span>
                    {selectedPayment === "BNPL"
                      ? `Continue with Pay Later`
                      : `Pay ${formatCurrency(selectedService.price, currency)} & Book`}
                  </button>
                  <p className="text-center text-xs text-[#8a948e]">
                    Preview only · Your appointment is not actually booked or charged.
                  </p>
                </>
              )}

              {step === 4 && selectedService && (
                <div className="rounded-2xl border border-[#e7ece8] bg-white p-6 text-center sm:p-8">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f6ed] text-2xl font-bold text-[#278e5b]">
                    ✓
                  </span>
                  <h2 className="mt-4 text-xl font-extrabold">Booking Preview Complete</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#77827b]">
                    Your sample {selectedService.name.toLowerCase()} appointment is ready to review. No payment was processed and no booking was saved.
                  </p>
                  <div className="mt-6 text-left">{summary}</div>
                  <p className="mt-4 text-sm font-semibold text-[#278e5b]">
                    Payment method: {PAYMENT_METHODS.find(({ value }) => value === selectedPayment)?.label}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(null);
                      setSelectedTime(null);
                      setCustomer({ name: "", phone: "", email: "", notes: "" });
                      goToStep(0);
                    }}
                    className="mt-6 w-full rounded-lg bg-[#2d9765] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#247e53]"
                  >
                    Back to Services
                  </button>
                </div>
              )}
            </section>

            {step !== 4 && (
              <aside className="hidden space-y-3 lg:block">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-[#909a94]">
                  Booking Summary
                </p>
                {summary}
                <p className="rounded-xl bg-[#eaf5e1] p-3 text-xs leading-5 text-[#526653]">
                  Preview mode: this booking is sample data and won’t be submitted.
                </p>
              </aside>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default Services;
