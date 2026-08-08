import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { api, addressesApi, productsApi } from "@/lib/api";
import {
  actions,
  computeBreakdown,
  formatINR,
  useStore,
  type Product,
} from "@/lib/store";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
});

type Address = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

// In-memory cache shared across navigations
const productCache: Record<string, Product> = {};

export function Checkout() {
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const nav = useNavigate();

  // Contact State
  const [phone, setPhone] = useState(user?.phone || "");

  useEffect(() => {
    if (user?.phone && !phone) {
      setPhone(user.phone);
    }
  }, [user, phone]);

  // Product Loading States
  const [productsMap, setProductsMap] =
    useState<Record<string, Product>>(productCache);

  const [loadingProducts, setLoadingProducts] = useState(false);

  // Address States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // New Address Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [loading, setLoading] = useState(false);

  // Load Razorpay SDK
  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      console.log("Razorpay SDK loaded");
    };

    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
    };

    document.body.appendChild(script);

    return () => {
      // Do not remove the script here because checkout navigation
      // can happen multiple times during the session.
    };
  }, []);

  // Fetch full details for all products in cart
  const cartKeys = cart.map((c: any) => c.productId).join(",");

  useEffect(() => {
    let isMounted = true;

    async function loadCartProducts() {
      const missingIds = cart
        .map((c: any) => c.productId)
        .filter((id: string) => !productCache[id]);

      if (missingIds.length === 0) {
        setProductsMap({ ...productCache });
        return;
      }

      setLoadingProducts(true);

      try {
        const promises = missingIds.map((id: string) =>
          productsApi.getById(id).catch(() => null)
        );

        const results = await Promise.all(promises);

        results.forEach((p: any) => {
          if (p && p.id) {
            productCache[p.id] = {
              ...p,
              weight: Number(p.weight ?? p.grossWeight ?? 0),
            };
          }
        });

        if (isMounted) {
          setProductsMap({ ...productCache });
        }
      } catch (err) {
        console.error("Failed to load checkout products:", err);
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    }

    loadCartProducts();

    return () => {
      isMounted = false;
    };
  }, [cartKeys]);

  // Fetch Saved Addresses
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function loadAddresses() {
      setLoadingAddresses(true);

      try {
        const data = await addressesApi.getAll();

        if (isMounted) {
          setAddresses(data);

          if (data.length > 0) {
            setSelectedAddressId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        if (isMounted) {
          setLoadingAddresses(false);
        }
      }
    }

    loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle Inline Add New Address
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressLine || !city || !state || !pincode) {
      return;
    }

    try {
      const newAddress = await addressesApi.create({
        label,
        addressLine,
        city,
        state,
        pincode,
      });

      setAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);

      setLabel("Home");
      setAddressLine("");
      setCity("");
      setState("");
      setPincode("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save address");
    }
  };

  // Build Cart Items
  const items = cart
    .map((c: any) => ({
      ...c,
      p: productsMap[c.productId],
    }))
    .filter((c: any) => Boolean(c.p));

  // Compute Total Price
  const total = items.reduce((s: number, i: any) => {
    const weightVal = Number(i.p.weight ?? i.p.grossWeight ?? 0);
    const bd = computeBreakdown(weightVal, i.p.purity || "22K");
    const itemPrice = bd?.total ? bd.total : Number(i.p.price || 0);

    return s + itemPrice * i.qty;
  }, 0);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!phone) {
      alert("Please enter your mobile phone number.");
      return;
    }

    if (!selectedAddressId) {
      alert("Please select a shipping address.");
      return;
    }

    setLoading(true);

    try {
      // Save phone number to profile first
      await api.updateProfile({ phone });

      if (actions.checkAuth) {
        await actions.checkAuth();
      }

      // Step 1 — ask backend to create Razorpay order
      const paymentResponse = (await api.post(
        "/orders/initiate-payment",
        {}
      )) as {
        razorpayOrder: RazorpayOrder;
      };

      const { razorpayOrder } = paymentResponse;

      // Make sure the SDK has loaded
      if (!window.Razorpay) {
        alert(
          "Payment gateway is still loading. Please wait a moment and try again."
        );
        setLoading(false);
        return;
      }

      const options: RazorpayOptions = {
        key: "rzp_test_TIZNsDeMd9h0Dx",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: "NVS Jewellery",
        description: "Jewellery Purchase Checkout",
        image: "/favicon.ico",

        handler: async function (response: RazorpayResponse) {
          try {
            // Step 2 — verify signature + place order on backend
            await api.post("/orders/verify-and-place", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              addressId: selectedAddressId,
              phone,
            });

            actions.clearCart();
            nav({ to: "/account" });
          } catch (err: any) {
            alert(
              err?.message ||
                "Payment verification failed. Please contact support."
            );
          } finally {
            setLoading(false);
          }
        },

        prefill: {
          name: user?.name || "Customer",
          email: user?.email || "customer@nvsjewellery.com",
          contact: phone,
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

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);

      alert(
        err?.message ||
          "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-serif text-4xl md:text-5xl text-espresso">
          Checkout
        </h1>

        <OrnamentalDivider />

        {loadingProducts && items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground">
              Loading your product details...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white border border-border rounded-2xl mt-6">
            <h2 className="font-serif text-2xl text-espresso">
              Your cart is empty
            </h2>

            <p className="text-sm text-muted-foreground mt-2">
              Please select a product to proceed with checkout.
            </p>

            <Link
              to="/gold"
              className="pill-gold inline-flex mt-6"
            >
              Browse Collection
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handlePlaceOrder}
            className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-6"
          >
            <div className="space-y-6">

              {/* Product Details */}
              <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
                <h3 className="font-serif text-xl text-espresso mb-4">
                  Items to Purchase
                </h3>

                <div className="space-y-4 divide-y divide-border/60">
                  {items.map((i: any) => {
                    const weightVal = Number(
                      i.p.weight ?? i.p.grossWeight ?? 0
                    );

                    const bd = computeBreakdown(
                      weightVal,
                      i.p.purity || "22K"
                    );

                    const itemPrice = bd?.total
                      ? bd.total
                      : Number(i.p.price || 0);

                    return (
                      <div
                        key={i.productId}
                        className="pt-4 first:pt-0 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {i.p.image && (
                            <img
                              src={i.p.image}
                              alt={i.p.name}
                              className="w-16 h-16 object-cover rounded-xl border border-border bg-panel shrink-0"
                            />
                          )}

                          <div className="min-w-0">
                            <h4 className="font-serif font-bold text-base text-espresso truncate">
                              {i.p.name}
                            </h4>

                            <p className="text-xs text-muted-foreground mt-0.5">
                              Weight:{" "}
                              <span className="font-semibold text-espresso">
                                {weightVal}g
                              </span>{" "}
                              · Purity:{" "}
                              <span className="font-semibold text-espresso">
                                {i.p.purity || "22K"}
                              </span>
                            </p>

                            <p className="text-xs text-gold-dark font-semibold mt-1">
                              Qty: {i.qty}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-base text-espresso">
                            {formatINR(itemPrice * i.qty)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Number */}
              <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
                <h3 className="font-serif text-xl text-espresso mb-2">
                  1. Contact Number
                </h3>

                <p className="text-xs text-muted-foreground mb-4">
                  Enter your mobile phone number for order updates & tracking.
                </p>

                <label className="block">
                  <span className="text-xs label-caps text-gold-dark font-semibold">
                    Mobile Phone Number
                  </span>

                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:border-gold outline-none"
                    required
                  />
                </label>
              </div>

              {/* Shipping Address */}
              <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-xl text-espresso">
                    2. Select Shipping Address
                  </h3>

                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="text-xs font-semibold text-gold-dark hover:underline"
                  >
                    {showAddForm
                      ? "Select From Saved"
                      : "+ Add New Address"}
                  </button>
                </div>

                {loadingAddresses ? (
                  <p className="text-xs text-muted-foreground">
                    Loading saved addresses...
                  </p>
                ) : showAddForm ? (
                  <div className="space-y-3 pt-2 border-t border-border">

                    <div className="flex gap-2">
                      {["Home", "Work", "Other"].map((lbl) => (
                        <button
                          type="button"
                          key={lbl}
                          onClick={() => setLabel(lbl)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            label === lbl
                              ? "bg-gold text-white border-gold"
                              : "border-border text-espresso"
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
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-white"
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-white"
                      />

                      <input
                        type="text"
                        placeholder="State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-white"
                      />

                      <input
                        type="text"
                        placeholder="Pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-white"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAddNewAddress}
                        className="pill-gold py-1.5! px-3! text-xs"
                      >
                        Save & Select Address
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="text-xs text-muted-foreground px-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAddressId(a.id)}
                        className={`cursor-pointer p-4 rounded-xl border text-sm transition relative ${
                          selectedAddressId === a.id
                            ? "border-gold bg-cream/40 text-espresso font-medium shadow-xs"
                            : "border-border hover:border-gold text-espresso"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[10px] label-caps text-gold-dark">
                            {a.label}
                          </span>

                          {selectedAddressId === a.id && (
                            <span className="text-[10px] bg-gold text-white px-2 py-0.5 rounded-full font-medium">
                              Selected
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-espresso mt-1">
                          {a.addressLine}
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.city}, {a.state} — {a.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No saved addresses found. Click "+ Add New Address" above.
                  </p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-panel rounded-2xl p-6 h-fit border border-border shadow-xs">
              <h3 className="font-serif text-xl text-espresso mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm divide-y divide-border/60">
                {items.map((i: any) => {
                  const weightVal = Number(
                    i.p.weight ?? i.p.grossWeight ?? 0
                  );

                  const bd = computeBreakdown(
                    weightVal,
                    i.p.purity || "22K"
                  );

                  const itemPrice = bd?.total
                    ? bd.total
                    : Number(i.p.price || 0);

                  return (
                    <div
                      key={i.productId}
                      className="pt-3 first:pt-0 flex justify-between text-espresso"
                    >
                      <div>
                        <p className="font-medium text-sm truncate max-w-45">
                          {i.p.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {weightVal}g · {i.p.purity || "22K"} × {i.qty}
                        </p>
                      </div>

                      <span className="font-semibold">
                        {formatINR(itemPrice * i.qty)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-gold/30 my-4" />

              <div className="flex justify-between font-bold text-lg text-espresso">
                <span>Total Payable</span>
                <span>{formatINR(total)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="pill-gold w-full justify-center mt-5 flex py-3 text-sm font-semibold tracking-wider uppercase transition disabled:opacity-50"
              >
                {loading
                  ? "Opening Razorpay..."
                  : "Pay & Place Order"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}