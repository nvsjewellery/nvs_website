import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";

import {
  api,
  addressesApi,
  productsApi,
  type ProductItem,
} from "@/lib/api";

import {
  actions,
  computeBreakdown,
  formatINR,
  useStore,
} from "@/lib/store";

/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute("/checkout")({
  component: Checkout,
});

/* =========================================================
   TYPES
========================================================= */

type Address = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
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

type InitiatePaymentResponse = {
  success: boolean;
  message?: string;
  razorpayOrder?: RazorpayOrder;
  subTotal?: number;
  discount?: number;
  total?: number;
  coupon?: {
    id: string;
    code: string;
    name?: string;
  } | null;
};

type VerifyOrderResponse = {
  success: boolean;
  message?: string;
  order?: unknown;
  pricing?: {
    subTotal: number;
    discount: number;
    total: number;
  };
  coupon?: {
    id: string;
    code: string;
    name?: string;
  } | null;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;

  handler: (
    response: RazorpayResponse
  ) => Promise<void>;

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

/* =========================================================
   RAZORPAY GLOBAL TYPE
========================================================= */

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => {
      open: () => void;
    };
  }
}

/* =========================================================
   PRODUCT CACHE
========================================================= */

const productCache: Record<
  string,
  ProductItem
> = {};

/* =========================================================
   CHECKOUT
========================================================= */

export function Checkout() {
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);

  const navigate = useNavigate();

  /* =======================================================
     CONTACT
  ======================================================= */

  const [phone, setPhone] = useState(
    user?.phone || ""
  );

  /* =======================================================
     COUPON
  ======================================================= */

  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<string | null>(null);

  const [couponDiscount, setCouponDiscount] =
    useState(0);

  const [backendSubtotal, setBackendSubtotal] =
    useState<number | null>(null);

  const [backendTotal, setBackendTotal] =
    useState<number | null>(null);

  const [couponError, setCouponError] =
    useState("");

  /* =======================================================
     PRODUCT STATES
  ======================================================= */

  const [productsMap, setProductsMap] =
    useState<Record<string, ProductItem>>(
      productCache
    );

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  /* =======================================================
     ADDRESS STATES
  ======================================================= */

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  const [loadingAddresses, setLoadingAddresses] =
    useState(false);

  /* =======================================================
     NEW ADDRESS
  ======================================================= */

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [label, setLabel] =
    useState("Home");

  const [addressLine, setAddressLine] =
    useState("");

  const [city, setCity] =
    useState("");

  const [state, setState] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  /* =======================================================
     PAYMENT
  ======================================================= */

  const [loading, setLoading] =
    useState(false);

  /* =======================================================
     USER PHONE SYNC
  ======================================================= */

  useEffect(() => {
    if (user?.phone && !phone) {
      setPhone(user.phone);
    }
  }, [user, phone]);

  /* =======================================================
     LOAD RAZORPAY SDK
  ======================================================= */

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.Razorpay === "function"
    ) {
      return;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existingScript) {
      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      console.log(
        "Razorpay SDK loaded"
      );
    };

    script.onerror = () => {
      console.error(
        "Failed to load Razorpay SDK"
      );
    };

    document.body.appendChild(script);
  }, []);

  /* =======================================================
     CART PRODUCT IDS
  ======================================================= */

  const cartKeys = cart
    .map((item) => item.productId)
    .join(",");

  /* =======================================================
     LOAD CART PRODUCTS
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    async function loadCartProducts() {
      const missingIds = cart
        .map((item) => item.productId)
        .filter(
          (id) => !productCache[id]
        );

      if (missingIds.length === 0) {
        if (isMounted) {
          setProductsMap({
            ...productCache,
          });
        }

        return;
      }

      setLoadingProducts(true);

      try {
        const promises =
          missingIds.map((id) =>
            productsApi
              .getById(id)
              .catch(() => null)
          );

        const results =
          await Promise.all(
            promises
          );

        results.forEach(
          (product: ProductItem | null) => {
            if (
              product &&
              product.id
            ) {
              productCache[
                product.id
              ] = {
                ...product,

                weight: Number(
                  product.weight ??
                    product.grossWeight ??
                    0
                ),
              };
            }
          }
        );

        if (isMounted) {
          setProductsMap({
            ...productCache,
          });
        }
      } catch (error) {
        console.error(
          "Failed to load checkout products:",
          error
        );
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

  /* =======================================================
     LOAD SAVED ADDRESSES
  ======================================================= */

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    async function loadAddresses() {
      setLoadingAddresses(true);

      try {
        const data =
          await addressesApi.getAll();

        if (!isMounted) {
          return;
        }

        setAddresses(data);

        if (data.length > 0) {
          const defaultAddress =
            data.find(
              (address) =>
                address.isDefault === true
            );

          setSelectedAddressId(
            defaultAddress?.id ||
              data[0].id
          );
        }
      } catch (error) {
        console.error(
          "Failed to load addresses:",
          error
        );
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

  /* =======================================================
     ADD NEW ADDRESS
  ======================================================= */

  async function handleAddNewAddress(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !addressLine.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {
      alert(
        "Please fill all address fields."
      );

      return;
    }

    if (
      !/^\d{6}$/.test(
        pincode.trim()
      )
    ) {
      alert(
        "Please enter a valid 6-digit pincode."
      );

      return;
    }

    try {
      const newAddress =
        await addressesApi.create({
          label,
          addressLine:
            addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode:
            pincode.trim(),
        });

      setAddresses((previous) => [
        ...previous,
        newAddress,
      ]);

      setSelectedAddressId(
        newAddress.id
      );

      setLabel("Home");
      setAddressLine("");
      setCity("");
      setState("");
      setPincode("");

      setShowAddForm(false);
    } catch (error) {
      console.error(
        "Failed to save address:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save address."
      );
    }
  }

  /* =======================================================
     BUILD CART ITEMS
  ======================================================= */

  const items = cart.flatMap(
    (cartItem) => {
      const product =
        productsMap[
          cartItem.productId
        ];

      if (!product) {
        return [];
      }

      return [
        {
          ...cartItem,
          p: product,
        },
      ];
    }
  );

  /* =======================================================
     FRONTEND DISPLAY SUBTOTAL
  ======================================================= */

  const calculatedSubtotal =
    items.reduce(
      (sum, item) => {
        const weightVal =
          Number(
            item.p.weight ??
              item.p.grossWeight ??
              0
          );

        const breakdown =
          computeBreakdown(
            weightVal,
            item.p.purity ||
              "22K"
          );

        const itemPrice =
          breakdown?.total
            ? breakdown.total
            : Number(
                item.p.price || 0
              );

        return (
          sum +
          itemPrice *
            item.qty
        );
      },
      0
    );

  /*
   * Backend is the source of truth after
   * payment initiation.
   *
   * Until then, show the calculated
   * frontend subtotal.
   */

  const displaySubtotal =
    backendSubtotal ??
    calculatedSubtotal;

  const displayTotal =
    backendTotal ??
    calculatedSubtotal;

  /* =======================================================
     CLEAR APPLIED COUPON
  ======================================================= */

  function clearCoupon() {
    setCoupon("");
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setBackendSubtotal(null);
    setBackendTotal(null);
    setCouponError("");
  }

  /* =======================================================
     INITIATE PAYMENT
  ======================================================= */

  async function handlePlaceOrder(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!phone.trim()) {
      alert(
        "Please enter your mobile phone number."
      );

      return;
    }

    if (
      !/^[+]?[0-9\s-]{10,15}$/.test(
        phone.trim()
      )
    ) {
      alert(
        "Please enter a valid mobile phone number."
      );

      return;
    }

    if (!selectedAddressId) {
      alert(
        "Please select a shipping address."
      );

      return;
    }

    if (items.length === 0) {
      alert(
        "Your cart is empty."
      );

      return;
    }

    if (calculatedSubtotal <= 0) {
      alert(
        "Unable to calculate order total."
      );

      return;
    }

    setLoading(true);
    setCouponError("");

    try {
      /* ===================================================
         SAVE PHONE
      =================================================== */

      await api.updateProfile({
        phone: phone.trim(),
      });

      /* ===================================================
         REFRESH AUTH USER
      =================================================== */

      if (
        typeof actions.checkAuth ===
        "function"
      ) {
        await actions.checkAuth();
      }

      /*
       * Normalize coupon once.
       *
       * Empty coupon = null.
       */

      const couponCode =
        coupon.trim()
          ? coupon.trim().toUpperCase()
          : undefined;

      /*
       * Remember the coupon that was actually
       * submitted to the backend.
       */

      if (couponCode) {
        setAppliedCoupon(
          couponCode
        );
      }

      /* ===================================================
         STEP 1
         BACKEND CALCULATES REAL TOTAL
      =================================================== */

      const paymentResponse =
        (await api.post(
          "/orders/initiate-payment",
          couponCode
            ? {
                couponCode,
              }
            : {}
        )) as InitiatePaymentResponse;

      if (
        !paymentResponse.success
      ) {
        throw new Error(
          paymentResponse.message ||
            "Unable to initiate payment."
        );
      }

      const razorpayOrder =
        paymentResponse.razorpayOrder;

      if (!razorpayOrder) {
        throw new Error(
          "Unable to create Razorpay payment order."
        );
      }

      /*
       * IMPORTANT:
       *
       * Backend is now the source of truth.
       */

      if (
        typeof paymentResponse.subTotal ===
        "number"
      ) {
        setBackendSubtotal(
          paymentResponse.subTotal
        );
      }

      if (
        typeof paymentResponse.total ===
        "number"
      ) {
        setBackendTotal(
          paymentResponse.total
        );
      }

      if (
        typeof paymentResponse.discount ===
        "number"
      ) {
        setCouponDiscount(
          paymentResponse.discount
        );
      }

      if (
        paymentResponse.coupon
      ) {
        setAppliedCoupon(
          paymentResponse.coupon.code
        );
      } else if (!couponCode) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }

      /* ===================================================
         CHECK RAZORPAY SDK
      =================================================== */

      if (
        typeof window.Razorpay !==
        "function"
      ) {
        throw new Error(
          "Payment gateway is still loading. Please wait a moment and try again."
        );
      }

      /* ===================================================
         RAZORPAY OPTIONS
      =================================================== */

      const options: RazorpayOptions = {
        /*
         * TEST KEY.
         *
         * Replace with your live key when
         * production payments are enabled.
         */

        key:
          "rzp_test_TIZNsDeMd9h0Dx",

        /*
         * IMPORTANT:
         *
         * This amount comes directly from
         * backend Razorpay order.
         */

        amount:
          razorpayOrder.amount,

        currency:
          razorpayOrder.currency,

        order_id:
          razorpayOrder.id,

        name:
          "NVS Jewellery",

        description:
          appliedCoupon
            ? `Jewellery Purchase - ${appliedCoupon}`
            : "Jewellery Purchase Checkout",

        image:
          "/favicon.ico",

        /* ===============================================
           PAYMENT SUCCESS
        =============================================== */

        handler:
          async function (
            response
          ) {
            try {
              /*
               * IMPORTANT:
               *
               * Send the same coupon to backend
               * during verification.
               */

              const verifyPayload: Record<
                string,
                unknown
              > = {
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,

                addressId:
                  selectedAddressId,

                phone:
                  phone.trim(),
              };

              if (couponCode) {
                verifyPayload.couponCode =
                  couponCode;
              }

              /* =========================================
                 STEP 2
                 VERIFY + PLACE ORDER
              ========================================= */

              const result =
                (await api.post(
                  "/orders/verify-and-place",
                  verifyPayload
                )) as VerifyOrderResponse;

              if (
                !result.success
              ) {
                throw new Error(
                  result.message ||
                    "Order placement failed."
                );
              }

              /* =========================================
                 CLEAR LOCAL CART
              ========================================= */

              actions.clearCart();

              /* =========================================
                 GO TO ACCOUNT
              ========================================= */

              navigate({
                to: "/account",
              });
            } catch (error) {
              console.error(
                "Payment verification/order placement failed:",
                error
              );

              alert(
                error instanceof Error
                  ? error.message
                  : "Payment verification failed. Please contact support."
              );
            } finally {
              setLoading(false);
            }
          },

        /* ===============================================
           PREFILL
        =============================================== */

        prefill: {
          name:
            user?.name ||
            "Customer",

          email:
            user?.email ||
            "customer@nvsjewellery.com",

          contact:
            phone.trim(),
        },

        /* ===============================================
           THEME
        =============================================== */

        theme: {
          color:
            "#B8860B",
        },

        /* ===============================================
           MODAL
        =============================================== */

        modal: {
          ondismiss:
            function () {
              setLoading(false);
            },
        },
      };

      /* =================================================
         OPEN RAZORPAY
      ================================================= */

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.open();
    } catch (error) {
      console.error(
        "Checkout/payment initiation failed:",
        error
      );

      /*
       * If the backend rejected the coupon,
       * display the error clearly.
       */

      if (
        error instanceof Error &&
        error.message
          .toLowerCase()
          .includes("coupon")
      ) {
        setCouponError(
          error.message
        );
      }

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">
          Checkout
        </h1>

        <OrnamentalDivider />

        {/* =================================================
            LOADING PRODUCTS
        ================================================= */}

        {loadingProducts &&
        items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Loading your product
              details...
            </p>
          </div>
        ) : items.length === 0 ? (
          /* =================================================
             EMPTY CART
          ================================================= */

          <div className="text-center py-20 bg-white border border-[color:var(--border)] rounded-2xl mt-6">

            <h2 className="font-serif text-2xl text-[color:var(--espresso)]">
              Your cart is empty
            </h2>

            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              Please select a product
              to proceed with checkout.
            </p>

            <Link
              to="/gold"
              className="pill-gold inline-flex mt-6"
            >
              Browse Collection
            </Link>
          </div>
        ) : (
          /* =================================================
             CHECKOUT FORM
          ================================================= */

          <form
            onSubmit={
              handlePlaceOrder
            }
            className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-6"
          >

            {/* =============================================
               LEFT SIDE
            ============================================= */}

            <div className="space-y-6">

              {/* =========================================
                 PRODUCT DETAILS
              ========================================= */}

              <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-xs">

                <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">
                  Items to Purchase
                </h3>

                <div className="space-y-4 divide-y divide-[color:var(--border)]/60">

                  {items.map(
                    (item) => {
                      const weightVal =
                        Number(
                          item.p
                            .weight ??
                            item.p
                              .grossWeight ??
                            0
                        );

                      const breakdown =
                        computeBreakdown(
                          weightVal,
                          item.p
                            .purity ||
                            "22K"
                        );

                      const itemPrice =
                        breakdown?.total
                          ? breakdown.total
                          : Number(
                              item.p
                                .price ||
                                0
                            );

                      return (
                        <div
                          key={
                            item.productId
                          }
                          className="pt-4 first:pt-0 flex items-center justify-between gap-4"
                        >

                          {/* Product */}

                          <div className="flex items-center gap-4 min-w-0">

                            {item.p.image ? (
                              <img
                                src={
                                  item.p
                                    .image
                                }
                                alt={
                                  item.p
                                    .name
                                }
                                className="w-16 h-16 object-cover rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] shrink-0 grid place-items-center text-[10px] text-[color:var(--muted-foreground)]">
                                No image
                              </div>
                            )}

                            <div className="min-w-0">

                              <h4 className="font-serif font-bold text-base text-[color:var(--espresso)] truncate">
                                {
                                  item.p
                                    .name
                                }
                              </h4>

                              <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                                Weight:{" "}
                                <span className="font-semibold text-[color:var(--espresso)]">
                                  {
                                    weightVal
                                  }
                                  g
                                </span>

                                {" · "}

                                Purity:{" "}
                                <span className="font-semibold text-[color:var(--espresso)]">
                                  {
                                    item
                                      .p
                                      .purity ||
                                    "22K"
                                  }
                                </span>
                              </p>

                              <p className="text-xs text-[color:var(--gold-dark)] font-semibold mt-1">
                                Qty:{" "}
                                {
                                  item.qty
                                }
                              </p>

                            </div>
                          </div>

                          {/* Item Price */}

                          <div className="text-right shrink-0">

                            <p className="font-bold text-base text-[color:var(--espresso)]">
                              {formatINR(
                                itemPrice *
                                  item.qty
                              )}
                            </p>

                          </div>
                        </div>
                      );
                    }
                  )}

                </div>
              </div>

              {/* =========================================
                 CONTACT NUMBER
              ========================================= */}

              <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-xs">

                <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-2">
                  1. Contact Number
                </h3>

                <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
                  Enter your mobile phone
                  number for order updates
                  & tracking.
                </p>

                <label className="block">

                  <span className="text-xs label-caps text-[color:var(--gold-dark)] font-semibold">
                    Mobile Phone Number
                  </span>

                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target
                          .value
                      )
                    }
                    className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm bg-white focus:border-[color:var(--gold)] outline-none"
                    required
                  />

                </label>
              </div>

              {/* =========================================
                 SHIPPING ADDRESS
              ========================================= */}

              <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-xs">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="font-serif text-xl text-[color:var(--espresso)]">
                    2. Select Shipping
                    Address
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAddForm(
                        (current) =>
                          !current
                      )
                    }
                    className="text-xs font-semibold text-[color:var(--gold-dark)] hover:underline cursor-pointer"
                  >
                    {showAddForm
                      ? "Select From Saved"
                      : "+ Add New Address"}
                  </button>

                </div>

                {loadingAddresses ? (
                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    Loading saved
                    addresses...
                  </p>
                ) : showAddForm ? (

                  /* =======================================
                     ADD ADDRESS FORM
                  ======================================= */

                  <div className="space-y-3 pt-2 border-t border-[color:var(--border)]">

                    <div className="flex gap-2">

                      {[
                        "Home",
                        "Work",
                        "Other",
                      ].map(
                        (addressLabel) => (
                          <button
                            type="button"
                            key={
                              addressLabel
                            }
                            onClick={() =>
                              setLabel(
                                addressLabel
                              )
                            }
                            className={`px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                              label ===
                              addressLabel
                                ? "bg-[color:var(--gold)] text-white border-[color:var(--gold)]"
                                : "border-[color:var(--border)] text-[color:var(--espresso)]"
                            }`}
                          >
                            {
                              addressLabel
                            }
                          </button>
                        )
                      )}

                    </div>

                    <input
                      type="text"
                      placeholder="Street / House No. / Area"
                      value={
                        addressLine
                      }
                      onChange={(
                        event
                      ) =>
                        setAddressLine(
                          event.target
                            .value
                        )
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white outline-none focus:border-[color:var(--gold)]"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                      <input
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(
                          event
                        ) =>
                          setCity(
                            event.target
                              .value
                          )
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white outline-none focus:border-[color:var(--gold)]"
                      />

                      <input
                        type="text"
                        placeholder="State"
                        value={state}
                        onChange={(
                          event
                        ) =>
                          setState(
                            event.target
                              .value
                          )
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white outline-none focus:border-[color:var(--gold)]"
                      />

                      <input
                        type="text"
                        placeholder="Pincode"
                        value={
                          pincode
                        }
                        maxLength={6}
                        onChange={(
                          event
                        ) => {
                          const value =
                            event.target
                              .value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                6
                              );

                          setPincode(
                            value
                          );
                        }}
                        className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white outline-none focus:border-[color:var(--gold)]"
                      />

                    </div>

                    <div className="flex gap-2 pt-1">

                      <button
                        type="button"
                        onClick={
                          handleAddNewAddress
                        }
                        className="pill-gold !py-1.5 !px-3 text-xs cursor-pointer"
                      >
                        Save & Select
                        Address
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setShowAddForm(
                            false
                          )
                        }
                        className="text-xs text-[color:var(--muted-foreground)] px-2 cursor-pointer"
                      >
                        Cancel
                      </button>

                    </div>
                  </div>
                ) : addresses.length > 0 ? (

                  /* =======================================
                     SAVED ADDRESSES
                  ======================================= */

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {addresses.map(
                      (address) => (
                        <div
                          key={
                            address.id
                          }
                          onClick={() =>
                            setSelectedAddressId(
                              address.id
                            )
                          }
                          className={`cursor-pointer p-4 rounded-xl border text-sm transition relative ${
                            selectedAddressId ===
                            address.id
                              ? "border-[color:var(--gold)] bg-[color:var(--cream)]/40 text-[color:var(--espresso)] font-medium shadow-xs"
                              : "border-[color:var(--border)] hover:border-[color:var(--gold)] text-[color:var(--espresso)]"
                          }`}
                        >

                          <div className="flex items-center justify-between mb-1">

                            <span className="font-bold text-[10px] label-caps text-[color:var(--gold-dark)]">
                              {
                                address.label
                              }
                            </span>

                            {selectedAddressId ===
                              address.id && (
                              <span className="text-[10px] bg-[color:var(--gold)] text-white px-2 py-0.5 rounded-full font-medium">
                                Selected
                              </span>
                            )}

                          </div>

                          <p className="text-xs text-[color:var(--espresso)] mt-1">
                            {
                              address.addressLine
                            }
                          </p>

                          <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                            {
                              address.city
                            }
                            ,{" "}
                            {
                              address.state
                            }{" "}
                            —{" "}
                            {
                              address.pincode
                            }
                          </p>

                        </div>
                      )
                    )}

                  </div>
                ) : (

                  /* =======================================
                     NO ADDRESSES
                  ======================================= */

                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    No saved addresses
                    found. Click
                    "+ Add New Address"
                    above.
                  </p>
                )}

              </div>
            </div>

            {/* =============================================
               RIGHT SIDE — ORDER SUMMARY
            ============================================= */}

            <div className="bg-[color:var(--panel)] rounded-2xl p-6 h-fit border border-[color:var(--border)] shadow-xs">

              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm divide-y divide-[color:var(--border)]/60">

                {items.map(
                  (item) => {
                    const weightVal =
                      Number(
                        item.p
                          .weight ??
                          item.p
                            .grossWeight ??
                          0
                      );

                    const breakdown =
                      computeBreakdown(
                        weightVal,
                        item.p
                          .purity ||
                          "22K"
                      );

                    const itemPrice =
                      breakdown?.total
                        ? breakdown.total
                        : Number(
                            item.p
                              .price ||
                              0
                          );

                    return (
                      <div
                        key={
                          item.productId
                        }
                        className="pt-3 first:pt-0 flex justify-between text-[color:var(--espresso)]"
                      >

                        <div className="min-w-0 pr-3">

                          <p className="font-medium text-sm truncate max-w-[180px]">
                            {
                              item.p
                                .name
                            }
                          </p>

                          <p className="text-xs text-[color:var(--muted-foreground)]">
                            {
                              weightVal
                            }g ·{" "}
                            {
                              item.p
                                .purity ||
                              "22K"
                            }{" "}
                            ×{" "}
                            {
                              item.qty
                            }
                          </p>

                        </div>

                        <span className="font-semibold shrink-0">
                          {formatINR(
                            itemPrice *
                              item.qty
                          )}
                        </span>

                      </div>
                    );
                  }
                )}

              </div>

              {/* =========================================
                  PRICING
              ========================================= */}

              <div className="h-px bg-[color:var(--gold)]/30 my-4" />

              <div className="space-y-1">

                <div className="flex justify-between text-sm">
                  <span className="text-[color:var(--muted-foreground)]">
                    Subtotal
                  </span>

                  <span className="text-[color:var(--espresso)]">
                    {formatINR(
                      displaySubtotal
                    )}
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">
                      Discount
                    </span>

                    <span className="text-green-700 font-medium">
                      -{formatINR(
                        couponDiscount
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg text-[color:var(--espresso)] pt-2">
                  <span>
                    Total Payable
                  </span>

                  <span>
                    {formatINR(
                      displayTotal
                    )}
                  </span>
                </div>

              </div>

              {/* =========================================
                  COUPON
              ========================================= */}

              <div className="mt-5">

                <label className="text-xs label-caps text-[color:var(--gold-dark)] font-semibold">
                  Coupon Code
                </label>

                <div className="flex gap-2 mt-1">

                  <input
                    type="text"
                    value={coupon}
                    disabled={loading}
                    onChange={(event) => {
                      setCoupon(
                        event.target.value.toUpperCase()
                      );

                      /*
                       * If user changes the coupon,
                       * previous backend pricing is no
                       * longer valid.
                       */

                      setAppliedCoupon(
                        null
                      );

                      setCouponDiscount(
                        0
                      );

                      setBackendSubtotal(
                        null
                      );

                      setBackendTotal(
                        null
                      );

                      setCouponError("");
                    }}
                    placeholder="Enter coupon"
                    className="flex-1 min-w-0 border border-[color:var(--border)] rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[color:var(--gold)]"
                  />

                  {coupon && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={
                        clearCoupon
                      }
                      className="px-3 py-2 text-xs rounded-lg border border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:border-[color:var(--gold)] cursor-pointer disabled:opacity-50"
                    >
                      Clear
                    </button>
                  )}

                </div>

                {appliedCoupon &&
                  couponDiscount > 0 && (
                    <p className="text-xs text-green-700 font-medium mt-2">
                      Coupon{" "}
                      <strong>
                        {
                          appliedCoupon
                        }
                      </strong>{" "}
                      applied successfully.
                    </p>
                  )}

                {couponError && (
                  <p className="text-xs text-red-600 font-medium mt-2">
                    {couponError}
                  </p>
                )}

                <p className="text-[10px] text-[color:var(--muted-foreground)] mt-2">
                  Discount eligibility is
                  verified securely at
                  payment.
                </p>

              </div>

              {/* =========================================
                  PAYMENT BUTTON
              ========================================= */}

              <button
                type="submit"
                disabled={
                  loading ||
                  items.length === 0
                }
                className="pill-gold w-full justify-center mt-5 flex py-3 text-sm font-semibold tracking-wider uppercase transition disabled:opacity-50 cursor-pointer"
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