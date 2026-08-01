import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { getProduct } from "@/lib/products";
import { actions, computeBreakdown, formatINR, useStore } from "@/lib/store";
import { addressesApi } from "@/lib/api";

export const Route = createFileRoute("/checkout")({ component: Checkout });

type Address = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  pincode: string;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function Checkout() {
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const nav = useNavigate();

  // Contact details state
  const [phone, setPhone] = useState("");

  // Address states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // New Address form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [loading, setLoading] = useState(false);

  // Load Razorpay Script dynamically on page mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Fetch saved addresses from backend using your addressesApi helper
  useEffect(() => {
    if (!user) return;

    async function loadAddresses() {
      setLoadingAddresses(true);
      try {
        const data = await addressesApi.getAll();
        setAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load saved addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    }

    loadAddresses();
  }, [user]);

  // Handle saving a new address inline on the checkout page
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine || !city || !pincode) return;

    try {
      const newAddress = await addressesApi.create({
        label,
        addressLine,
        city,
        pincode,
      });

      setAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
      
      setLabel("Home");
      setAddressLine("");
      setCity("");
      setPincode("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save address");
    }
  };

  // Cart calculation using computeBreakdown
  const items = cart
    .map((c) => ({ ...c, p: getProduct(c.productId)! }))
    .filter((c) => c.p);

  const subtotal = items.reduce(
    (s, i) => s + computeBreakdown(i.p.weight, i.p.purity).total * i.qty,
    0
  );

  // Trigger Razorpay Test Gateway payment
  function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!phone) {
      alert("Please enter your mobile phone number.");
      return;
    }

    if (!selectedAddressId && !showAddForm) {
      alert("Please select a shipping address.");
      return;
    }

    setLoading(true);

    const razorpayKey = "rzp_test_TIZNsDeMd9h0Dx"; // Test Key ID

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);

    const options = {
      key: razorpayKey,
      amount: subtotal * 100, // Amount in paise
      currency: "INR",
      name: "NVS Jewellery",
      description: "Jewellery Order Checkout",
      image: "url?id=0favicon.ico",
      handler: function (response: any) {
        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
        actions.clearCart();
        nav({ to: "/account" });
      },
      prefill: {
        name: user?.name || "Customer",
        email: user?.email || "customer@nvsjewellery.com",
        contact: phone,
      },
      notes: {
        shipping_address: selectedAddr
          ? `${selectedAddr.addressLine}, ${selectedAddr.city} - ${selectedAddr.pincode}`
          : "N/A",
      },
      theme: {
        color: "#B8860B",
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        },
      },
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Fallback timeout mock if script is blocked
      alert("Redirecting to Razorpay Test Gateway...");
      setTimeout(() => {
        actions.clearCart();
        alert("Demo Payment Completed Successfully!");
        nav({ to: "/account" });
      }, 1000);
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">
          Checkout
        </h1>
        <OrnamentalDivider />

        <form
          onSubmit={handlePlaceOrder}
          className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-6"
        >
          <div className="space-y-6">
            {/* Step 1: Phone & Contact Details */}
            <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-2">
                1. Phone & Contact Number
              </h3>
              <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
                Enter your active mobile number to receive order updates and tracking links.
              </p>
              <label className="block">
                <span className="text-xs label-caps text-[color:var(--gold-dark)] font-semibold">
                  Mobile Number
                </span>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm bg-white focus:border-[color:var(--gold)] outline-none"
                  required
                />
              </label>
            </div>

            {/* Step 2: Saved Shipping Addresses */}
            <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl text-[color:var(--espresso)]">
                  2. Select Shipping Address
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs font-semibold text-[color:var(--gold-dark)] hover:underline"
                >
                  {showAddForm ? "Select From Saved" : "+ Add New Address"}
                </button>
              </div>

              {loadingAddresses ? (
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  Loading saved addresses from your account...
                </p>
              ) : showAddForm ? (
                /* Add New Address Sub-form */
                <div className="space-y-3 pt-2 border-t border-[color:var(--border)]">
                  <div className="flex gap-2">
                    {["Home", "Work", "Other"].map((lbl) => (
                      <button
                        type="button"
                        key={lbl}
                        onClick={() => setLabel(lbl)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          label === lbl
                            ? "bg-[color:var(--gold)] text-white border-[color:var(--gold)]"
                            : "border-[color:var(--border)] text-[color:var(--espresso)]"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Street / House No. / Area"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className="pill-gold !py-1.5 !px-3 text-xs"
                    >
                      Save & Select Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs text-[color:var(--muted-foreground)] px-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : addresses.length > 0 ? (
                /* Grid of Backend Addresses */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAddressId(a.id)}
                      className={`cursor-pointer p-4 rounded-xl border text-sm transition relative ${
                        selectedAddressId === a.id
                          ? "border-[color:var(--gold)] bg-[color:var(--cream)]/40 text-[color:var(--espresso)] font-medium shadow-xs"
                          : "border-[color:var(--border)] hover:border-[color:var(--gold)] text-[color:var(--espresso)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[10px] label-caps text-[color:var(--gold-dark)]">
                          {a.label}
                        </span>
                        {selectedAddressId === a.id && (
                          <span className="text-[10px] bg-[color:var(--gold)] text-white px-2 py-0.5 rounded-full font-medium">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[color:var(--espresso)] mt-1">
                        {a.addressLine}
                      </p>
                      <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                        {a.city} — {a.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  No saved addresses found in your account. Click "+ Add New Address" above.
                </p>
              )}
            </div>

            {/* Step 3: Payment Method Details */}
            <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-2">
                3. Payment Method
              </h3>
              <div className="p-4 rounded-xl bg-[color:var(--cream)]/60 border border-[color:var(--gold)]/30 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-[color:var(--espresso)] block">
                    Razorpay Test Gateway
                  </span>
                  <span className="text-xs text-[color:var(--muted-foreground)]">
                    Supports UPI, Debit/Credit Cards, and Netbanking
                  </span>
                </div>
                <span className="text-2xl">💳</span>
              </div>
            </div>
          </div>

          {/* Sidebar: Summary & Place Order Button */}
          <div
            style={{ backgroundColor: "var(--panel)" }}
            className="rounded-2xl p-6 h-fit border border-[color:var(--border)] shadow-sm"
          >
            <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">
              Order Summary
            </h3>

            <div className="space-y-3 text-sm divide-y divide-[color:var(--border)]/60">
              {items.map((i) => {
                const bd = computeBreakdown(i.p.weight, i.p.purity);
                return (
                  <div
                    key={i.productId}
                    className="pt-3 first:pt-0 flex justify-between text-[color:var(--espresso)]"
                  >
                    <div>
                      <p className="font-medium text-sm truncate max-w-[180px]">
                        {i.p.name}
                      </p>
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        {i.p.weight}g · {i.p.purity} × {i.qty}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatINR(bd.total * i.qty)}
                    </span>
                  </div>
                );
              })}
              {items.length === 0 && (
                <p className="text-[color:var(--muted-foreground)]">
                  Your cart is empty.
                </p>
              )}
            </div>

            <div className="h-px bg-[color:var(--gold)]/30 my-4" />

            <div className="flex justify-between font-bold text-lg text-[color:var(--espresso)]">
              <span>Total Payable</span>
              <span>{formatINR(subtotal)}</span>
            </div>

            <button
              type="submit"
              disabled={items.length === 0 || loading}
              className="pill-gold w-full justify-center mt-5 flex py-3 text-sm font-semibold tracking-wider uppercase transition disabled:opacity-50"
            >
              {loading ? "Opening Gateway..." : "Place Order"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}