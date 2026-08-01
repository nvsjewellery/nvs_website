import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { getProduct } from "@/lib/products";
import { actions, computeBreakdown, formatINR, useStore } from "@/lib/store";

export const Route = createFileRoute("/checkout")({ component: Checkout });

interface Address {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function Checkout() {
  const cart = useStore((s) => s.cart);
  const nav = useNavigate();

  // Address state
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // New address form fallback
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    addressLine: "",
    city: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Fetch saved addresses from backend
  useEffect(() => {
    setLoadingAddresses(true);
    fetch("https://nvs-website-backend.vercel.app/api/addresses", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.addresses) {
          setAddresses(data.addresses);
          const defaultAddr = data.addresses.find((a: Address) => a.isDefault) || data.addresses[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        }
      })
      .catch((err) => console.error("Error loading addresses:", err))
      .finally(() => setLoadingAddresses(false));
  }, []);

  // Cart Items & Total Calculation
  const items = cart.map((c) => ({ ...c, p: getProduct(c.productId)! })).filter((c) => c.p);
  const subtotal = items.reduce((s, i) => s + computeBreakdown(i.p.weight, i.p.purity).total * i.qty, 0);

  // Initiate Payment via Razorpay
  function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedAddressId && !showNewAddressForm) {
      alert("Please select or add a shipping address.");
      return;
    }

    setLoading(true);

    const razorpayKey = "rzp_test_TIZNsDeMd9h0Dx"; // Your Test Key ID

    const options = {
      key: razorpayKey,
      amount: subtotal * 100, // Amount in paise
      currency: "INR",
      name: "NVS Jewellery",
      description: "Order Checkout Payment",
      image: "https://nvsjewellery.com/favicon.ico",
      handler: function (response: any) {
        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
        actions.clearCart();
        nav({ to: "/account" });
      },
      prefill: {
        contact: phone || "9876543210",
        email: "customer@nvsjewellery.com",
      },
      theme: {
        color: "#B8860B", // Gold brand color
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
      // Fallback Demo Payment Modal if Razorpay script hasn't loaded yet
      alert("Opening Razorpay Test Payment Gateway...");
      setTimeout(() => {
        actions.clearCart();
        alert("Demo Payment Complete!");
        nav({ to: "/account" });
      }, 1000);
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">Checkout</h1>
        <OrnamentalDivider />

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-6">
          <div className="space-y-6">
            {/* Phone Verification & Address Lookup */}
            <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-2">1. Phone & Contact Details</h3>
              <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
                Enter your mobile number to load saved addresses and receive order updates.
              </p>
              <Input
                label="Mobile Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {/* Saved Shipping Addresses */}
            <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl text-[color:var(--espresso)]">2. Select Shipping Address</h3>
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="text-xs font-semibold text-[color:var(--gold-dark)] hover:underline"
                >
                  {showNewAddressForm ? "Cancel New Address" : "+ Add New Address"}
                </button>
              </div>

              {loadingAddresses ? (
                <p className="text-xs text-[color:var(--muted-foreground)]">Loading saved addresses...</p>
              ) : addresses.length > 0 && !showNewAddressForm ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`cursor-pointer p-4 rounded-xl border text-sm transition relative ${
                        selectedAddressId === addr.id
                          ? "border-[color:var(--gold)] bg-[color:var(--cream)]/40 text-[color:var(--espresso)]"
                          : "border-[color:var(--border)] hover:border-[color:var(--gold)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs label-caps text-[color:var(--gold-dark)]">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-[color:var(--gold)]/20 text-[color:var(--gold-dark)] px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[color:var(--espresso)] font-medium mt-1">{addr.addressLine}</p>
                      <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                        {addr.city} - {addr.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              ) : showNewAddressForm ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Address Label"
                    placeholder="Home / Office"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  />
                  <Input
                    label="Address Line"
                    full
                    placeholder="House / Street No."
                    value={newAddress.addressLine}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                  />
                  <Input
                    label="City"
                    placeholder="City Name"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  />
                  <Input
                    label="PIN Code"
                    placeholder="6-digit PIN"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  />
                </div>
              ) : (
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  No saved addresses found. Click "+ Add New Address" above.
                </p>
              )}
            </div>

            {/* Payment Method Notice */}
            <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-2">3. Payment Gateway</h3>
              <div className="p-4 rounded-xl bg-[color:var(--cream)]/60 border border-[color:var(--gold)]/30 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-[color:var(--espresso)] block">Razorpay Test Gateway</span>
                  <span className="text-xs text-[color:var(--muted-foreground)]">UPI, Credit/Debit Cards, Netbanking</span>
                </div>
                <span className="text-2xl">💳</span>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div style={{ backgroundColor: "var(--panel)" }} className="rounded-2xl p-6 h-fit border border-[color:var(--border)] shadow-sm">
            <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">Order Summary</h3>

            <div className="space-y-3 text-sm divide-y divide-[color:var(--border)]/60">
              {items.map((i) => {
                const bd = computeBreakdown(i.p.weight, i.p.purity);
                return (
                  <div key={i.productId} className="pt-3 first:pt-0 flex justify-between text-[color:var(--espresso)]">
                    <div>
                      <p className="font-medium text-sm truncate max-w-[180px]">{i.p.name}</p>
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        {i.p.weight}g · {i.p.purity} × {i.qty}
                      </p>
                    </div>
                    <span className="font-semibold">{formatINR(bd.total * i.qty)}</span>
                  </div>
                );
              })}
              {items.length === 0 && <p className="text-[color:var(--muted-foreground)]">Your cart is empty.</p>}
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
              {loading ? "Processing..." : "Proceed to Razorpay"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Input({ label, full, ...rest }: { label: string; full?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs label-caps text-[color:var(--gold-dark)]">{label}</span>
      <input
        {...rest}
        className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm bg-white focus:border-[color:var(--gold)] outline-none"
      />
    </label>
  );
}