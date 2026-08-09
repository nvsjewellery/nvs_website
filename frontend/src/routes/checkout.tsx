import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";

import {
  api,
  addressesApi,
  productsApi,
  discountsApi,
  type ProductItem,
  type Discount,
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

type BackendCoupon = {
  id: string;
  code: string;
  name?: string | null;
  type?: string;
  target?: string;
  kind?: "percent" | "flat";
  value?: number;
};

type InitiatePaymentResponse = {
  success: boolean;
  message?: string;

  razorpayOrder?: RazorpayOrder;

  subTotal?: number;

  /*
   * Backend total discount.
   *
   * This can contain:
   * - seasonal
   * - customer
   * - coupon
   */
  discount?: number;

  total?: number;

  coupon?: BackendCoupon | null;
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

  coupon?: BackendCoupon | null;
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
   RAZORPAY GLOBAL
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
   HELPERS
========================================================= */

function calculateDiscountAmount(
  vaAmount: number,
  discount: Discount
): number {
  const va = Math.max(
    Number(vaAmount || 0),
    0
  );

  const value = Math.max(
    Number(discount.value || 0),
    0
  );

  if (va <= 0 || value <= 0) {
    return 0;
  }

  if (discount.kind === "percent") {
    return Math.min(
      (va * value) / 100,
      va
    );
  }

  return Math.min(
    value,
    va
  );
}

function isDiscountValid(
  discount: Discount
): boolean {
  if (!discount) {
    return false;
  }

  const now = new Date();

  if (
    discount.startDate &&
    now < new Date(discount.startDate)
  ) {
    return false;
  }

  if (
    discount.endDate &&
    now > new Date(discount.endDate)
  ) {
    return false;
  }

  if (
    discount.usageLimit !== null &&
    discount.usageLimit !== undefined &&
    Number(
      discount.usageCount || 0
    ) >= Number(
      discount.usageLimit
    )
  ) {
    return false;
  }

  return true;
}

function discountAppliesToProduct(
  discount: Discount,
  product: ProductItem
): boolean {
  if (!discount || !product) {
    return false;
  }

  if (!isDiscountValid(discount)) {
    return false;
  }

  /* -----------------------------------------
     METAL
  ----------------------------------------- */

  if (
    discount.metal &&
    discount.metal !== product.metal
  ) {
    return false;
  }

  /* -----------------------------------------
     PRODUCT
  ----------------------------------------- */

  if (
    discount.target === "PRODUCT"
  ) {
    return (
      Array.isArray(
        discount.products
      ) &&
      discount.products.some(
        (discountProduct) =>
          discountProduct.id ===
          product.id
      )
    );
  }

  /* -----------------------------------------
     CATEGORY
  ----------------------------------------- */

  if (
    discount.target === "CATEGORY"
  ) {
    if (!discount.category) {
      return false;
    }

    const productCategory =
      String(
        product.category ??
          product.sub ??
          ""
      )
        .trim()
        .toLowerCase();

    const discountCategory =
      String(
        discount.category
      )
        .trim()
        .toLowerCase();

    return (
      productCategory ===
      discountCategory
    );
  }

  return false;
}

/* =========================================================
   CHECKOUT
========================================================= */

export function Checkout() {
  const user = useStore(
    (s) => s.user
  );

  const cart = useStore(
    (s) => s.cart
  );

  const navigate =
    useNavigate();

  /* =======================================================
     CONTACT
  ======================================================= */

  const [phone, setPhone] =
    useState(
      user?.phone || ""
    );

  /* =======================================================
     APPLIED COUPON
  ======================================================= */

  /*
   * Coupon is entered in Cart.
   *
   * Checkout DOES NOT provide a coupon input.
   *
   * The backend tells us about the coupon when
   * payment is initiated.
   */
  const [
    appliedCoupon,
    setAppliedCoupon,
  ] = useState<
    BackendCoupon | null
  >(null);

  /* =======================================================
     BACKEND PRICING
  ======================================================= */

  const [
    backendSubtotal,
    setBackendSubtotal,
  ] = useState<number | null>(
    null
  );

  const [
    backendTotal,
    setBackendTotal,
  ] = useState<number | null>(
    null
  );

  const [
    backendDiscount,
    setBackendDiscount,
  ] = useState(0);

  /* =======================================================
     AVAILABLE DISCOUNTS
  ======================================================= */

  const [
    availableDiscounts,
    setAvailableDiscounts,
  ] = useState<Discount[]>(
    []
  );

  const [
    loadingDiscounts,
    setLoadingDiscounts,
  ] = useState(false);

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [
    productsMap,
    setProductsMap,
  ] = useState<
    Record<string, ProductItem>
  >(productCache);

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(false);

  /* =======================================================
     ADDRESSES
  ======================================================= */

  const [
    addresses,
    setAddresses,
  ] = useState<Address[]>(
    []
  );

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState("");

  const [
    loadingAddresses,
    setLoadingAddresses,
  ] = useState(false);

  /* =======================================================
     NEW ADDRESS
  ======================================================= */

  const [
    showAddForm,
    setShowAddForm,
  ] = useState(false);

  const [
    label,
    setLabel,
  ] = useState("Home");

  const [
    addressLine,
    setAddressLine,
  ] = useState("");

  const [
    city,
    setCity,
  ] = useState("");

  const [
    state,
    setState,
  ] = useState("");

  const [
    pincode,
    setPincode,
  ] = useState("");

  /* =======================================================
     PAYMENT
  ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(false);

  /* =======================================================
     PHONE SYNC
  ======================================================= */

  useEffect(() => {
    if (
      user?.phone &&
      !phone
    ) {
      setPhone(user.phone);
    }
  }, [user, phone]);

  /* =======================================================
     LOAD AVAILABLE DISCOUNTS
  ======================================================= */

  useEffect(() => {
    if (!user) {
      setAvailableDiscounts([]);
      return;
    }

    let mounted = true;

    async function loadDiscounts() {
      setLoadingDiscounts(true);

      try {
        const discounts =
          await discountsApi.getAvailable();

        if (!mounted) {
          return;
        }

        setAvailableDiscounts(
          Array.isArray(discounts)
            ? discounts
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load available discounts:",
          error
        );

        if (mounted) {
          setAvailableDiscounts([]);
        }
      } finally {
        if (mounted) {
          setLoadingDiscounts(false);
        }
      }
    }

    loadDiscounts();

    return () => {
      mounted = false;
    };
  }, [user]);

  /* =======================================================
     LOAD RAZORPAY
  ======================================================= */

  useEffect(() => {
    if (
      typeof window !==
        "undefined" &&
      typeof window.Razorpay ===
        "function"
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
      document.createElement(
        "script"
      );

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

    document.body.appendChild(
      script
    );
  }, []);

  /* =======================================================
     CART PRODUCT IDS
  ======================================================= */

  const cartKeys = cart
    .map(
      (item) =>
        item.productId
    )
    .join(",");

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      const missingIds =
        cart
          .map(
            (item) =>
              item.productId
          )
          .filter(
            (id) =>
              !productCache[id]
          );

      if (
        missingIds.length === 0
      ) {
        if (mounted) {
          setProductsMap({
            ...productCache,
          });
        }

        return;
      }

      setLoadingProducts(true);

      try {
        const results =
          await Promise.all(
            missingIds.map(
              (id) =>
                productsApi
                  .getById(id)
                  .catch(
                    () => null
                  )
            )
          );

        results.forEach(
          (product) => {
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

                va: Number(
                  product.va ??
                    product.making ??
                    0
                ),

                making: Number(
                  product.making ??
                    product.va ??
                    0
                ),
              };
            }
          }
        );

        if (mounted) {
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
        if (mounted) {
          setLoadingProducts(
            false
          );
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [cartKeys]);

  /* =======================================================
     LOAD ADDRESSES
  ======================================================= */

  useEffect(() => {
    if (!user) {
      return;
    }

    let mounted = true;

    async function loadAddresses() {
      setLoadingAddresses(true);

      try {
        const data =
          await addressesApi.getAll();

        if (!mounted) {
          return;
        }

        setAddresses(data);

        if (data.length > 0) {
          const defaultAddress =
            data.find(
              (address) =>
                address.isDefault ===
                true
            );

          setSelectedAddressId(
            defaultAddress?.id ??
              data[0].id
          );
        }
      } catch (error) {
        console.error(
          "Failed to load addresses:",
          error
        );
      } finally {
        if (mounted) {
          setLoadingAddresses(
            false
          );
        }
      }
    }

    loadAddresses();

    return () => {
      mounted = false;
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

      setAddresses(
        (previous) => [
          ...previous,
          newAddress,
        ]
      );

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
     BUILD ITEMS
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
     FRONTEND SUBTOTAL
  ======================================================= */

  const calculatedSubtotal =
    items.reduce(
      (sum, item) => {
        const weight =
          Number(
            item.p.weight ??
              item.p.grossWeight ??
              0
          );

        const breakdown =
          computeBreakdown(
            weight,
            item.p.purity ||
              "22K"
          );

        const price =
          breakdown?.total
            ? breakdown.total
            : Number(
                item.p.price || 0
              );

        return (
          sum +
          price *
            item.qty
        );
      },
      0
    );

  /* =======================================================
     CART VA
  ======================================================= */

  const cartVaTotal =
    items.reduce(
      (sum, item) => {
        const va =
          Number(
            item.p.va ??
              item.p.making ??
              0
          );

        return (
          sum +
          va *
            item.qty
        );
      },
      0
    );

  /* =======================================================
     DISPLAY METAL + VA
  ======================================================= */

  const displayVaTotal =
    cartVaTotal;

  const displayMetalTotal =
    Math.max(
      calculatedSubtotal -
        displayVaTotal,
      0
    );

  /* =======================================================
     BEST SEASONAL / PRODUCT DISCOUNTS
  ======================================================= */

  const productDiscountApplications =
    useMemo(() => {
      const applications: Array<{
        discount: Discount;
        product: ProductItem;
        amount: number;
        qty: number;
      }> = [];

      for (const item of items) {
        const applicable =
          availableDiscounts.filter(
            (discount) =>
              discount.type ===
                "SEASONAL" &&
              (
                discount.target ===
                  "PRODUCT" ||
                discount.target ===
                  "CATEGORY"
              ) &&
              discountAppliesToProduct(
                discount,
                item.p
              )
          );

        if (
          applicable.length ===
          0
        ) {
          continue;
        }

        let best:
          | {
              discount: Discount;
              amount: number;
            }
          | null = null;

        for (const discount of applicable) {
          const va =
            Number(
              item.p.va ??
                item.p.making ??
                0
            );

          const amount =
            calculateDiscountAmount(
              va,
              discount
            );

          if (
            amount > 0 &&
            (
              !best ||
              amount >
                best.amount
            )
          ) {
            best = {
              discount,
              amount,
            };
          }
        }

        if (best) {
          applications.push({
            discount:
              best.discount,

            product: item.p,

            amount:
              best.amount *
              item.qty,

            qty: item.qty,
          });
        }
      }

      return applications;
    }, [
      availableDiscounts,
      items,
    ]);

  /* =======================================================
     SEASONAL DISCOUNT TOTAL
  ======================================================= */

  const seasonalDiscountAmount =
    productDiscountApplications.reduce(
      (
        sum,
        application
      ) =>
        sum +
        application.amount,
      0
    );

  /* =======================================================
     GROUP SEASONAL DISCOUNTS
  ======================================================= */

  const seasonalDiscountGroups =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            discount: Discount;
            amount: number;
            products: string[];
          }
        >();

      for (
        const application of
          productDiscountApplications
      ) {
        const id =
          application.discount
            .id;

        const existing =
          map.get(id);

        if (existing) {
          existing.amount +=
            application.amount;

          existing.products.push(
            application.product.name
          );
        } else {
          map.set(id, {
            discount:
              application.discount,

            amount:
              application.amount,

            products: [
              application.product
                .name,
            ],
          });
        }
      }

      return Array.from(
        map.values()
      );
    }, [
      productDiscountApplications,
    ]);

  /* =======================================================
     CUSTOMER DISCOUNT
  ======================================================= */

  const customerDiscount =
    availableDiscounts.find(
      (discount) =>
        discount.type ===
          "CUSTOMER" &&
        discount.target ===
          "CUSTOMER"
    ) ?? null;

  const customerDiscountAmount =
    customerDiscount &&
    cartVaTotal > 0
      ? calculateDiscountAmount(
          cartVaTotal,
          customerDiscount
        )
      : 0;

  /* =======================================================
     FRONTEND ESTIMATED TOTAL
  ======================================================= */

  /*
   * Important:
   *
   * Seasonal/product discounts and customer discounts
   * are shown separately.
   *
   * The backend remains the final authority.
   */

  const estimatedDiscount =
    seasonalDiscountAmount +
    customerDiscountAmount;

  const estimatedTotal =
    Math.max(
      calculatedSubtotal -
        estimatedDiscount,
      0
    );

  const displaySubtotal =
    backendSubtotal ??
    calculatedSubtotal;

  const displayTotal =
    backendTotal ??
    estimatedTotal;

  /* =======================================================
     DISPLAY DISCOUNT TOTAL
  ======================================================= */

  const displayDiscount =
    backendTotal !== null
      ? Math.max(
          displaySubtotal -
            displayTotal,
          0
        )
      : estimatedDiscount;

  /* =======================================================
     PLACE ORDER
  ======================================================= */

  async function handlePlaceOrder(
    event: FormEvent
  ) {
    event.preventDefault();

    /* -----------------------------------------
       PHONE
    ----------------------------------------- */

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

    /* -----------------------------------------
       ADDRESS
    ----------------------------------------- */

    if (!selectedAddressId) {
      alert(
        "Please select a shipping address."
      );

      return;
    }

    /* -----------------------------------------
       CART
    ----------------------------------------- */

    if (items.length === 0) {
      alert(
        "Your cart is empty."
      );

      return;
    }

    if (
      calculatedSubtotal <= 0
    ) {
      alert(
        "Unable to calculate order total."
      );

      return;
    }

    setLoading(true);

    try {
      /* =======================================
         SAVE PHONE
      ======================================= */

      await api.updateProfile({
        phone: phone.trim(),
      });

      /* =======================================
         REFRESH AUTH
      ======================================= */

      if (
        typeof actions.checkAuth ===
        "function"
      ) {
        await actions.checkAuth();
      }

      /* =======================================
         INITIATE PAYMENT
      ======================================= */

      /*
       * IMPORTANT:
       *
       * Checkout does NOT ask for a coupon.
       *
       * The backend decides the final pricing.
       *
       * If the Cart has an applied coupon and your
       * backend stores/reads it, the response will
       * contain paymentResponse.coupon.
       */

      const paymentResponse =
        (await api.post(
          "/orders/initiate-payment",
          {}
        )) as InitiatePaymentResponse;

      if (
        !paymentResponse.success
      ) {
        throw new Error(
          paymentResponse.message ||
            "Unable to initiate payment."
        );
      }

      /* =======================================
         RAZORPAY ORDER
      ======================================= */

      const razorpayOrder =
        paymentResponse.razorpayOrder;

      if (!razorpayOrder) {
        throw new Error(
          "Unable to create Razorpay payment order."
        );
      }

      /* =======================================
         BACKEND PRICING
      ======================================= */

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
        setBackendDiscount(
          paymentResponse.discount
        );
      }

      /* =======================================
         BACKEND COUPON
      ======================================= */

      if (
        paymentResponse.coupon
      ) {
        setAppliedCoupon(
          paymentResponse.coupon
        );
      }

      /* =======================================
         RAZORPAY SDK
      ======================================= */

      if (
        typeof window.Razorpay !==
        "function"
      ) {
        throw new Error(
          "Payment gateway is still loading. Please wait a moment and try again."
        );
      }

      /* =======================================
         RAZORPAY OPTIONS
      ======================================= */

      const options: RazorpayOptions =
        {
          key:
            "rzp_test_TIZNsDeMd9h0Dx",

          /*
           * NEVER calculate this amount
           * manually on frontend.
           *
           * Use backend Razorpay amount.
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
            "Jewellery Purchase Checkout",

          image:
            "/favicon.ico",

          /* ===================================
             PAYMENT SUCCESS
          =================================== */

          handler:
            async function (
              response
            ) {
              try {
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

                /*
                 * We intentionally do not send
                 * a coupon from Checkout because
                 * coupon application happens in Cart.
                 *
                 * Backend should derive/validate
                 * the applied coupon.
                 */

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

                /* ==============================
                   CLEAR CART
                ============================== */

                actions.clearCart();

                /* ==============================
                   ACCOUNT
                ============================== */

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

          /* ===================================
             PREFILL
          =================================== */

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

          /* ===================================
             THEME
          =================================== */

          theme: {
            color:
              "#B8860B",
          },

          /* ===================================
             MODAL
          =================================== */

          modal: {
            ondismiss:
              () => {
                setLoading(false);
              },
          },
        };

      /* =======================================
         OPEN RAZORPAY
      ======================================= */

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

        {/* =========================================
            HEADER
        ========================================= */}

        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">
          Checkout
        </h1>

        <OrnamentalDivider />

        {/* =========================================
            LOADING / EMPTY
        ========================================= */}

        {loadingProducts &&
        items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Loading your product
              details...
            </p>
          </div>
        ) : items.length === 0 ? (
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

          /* =========================================
             CHECKOUT FORM
          ========================================= */

          <form
            onSubmit={
              handlePlaceOrder
            }
            className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-6"
          >

            {/* =======================================
                LEFT SIDE
            ======================================= */}

            <div className="space-y-6">

              {/* ===================================
                  PRODUCTS
              =================================== */}

              <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-xs">

                <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">
                  Items to Purchase
                </h3>

                <div className="space-y-4 divide-y divide-[color:var(--border)]/60">

                  {items.map(
                    (item) => {
                      const weight =
                        Number(
                          item.p.weight ??
                            item.p.grossWeight ??
                            0
                        );

                      const breakdown =
                        computeBreakdown(
                          weight,
                          item.p.purity ||
                            "22K"
                        );

                      const price =
                        breakdown?.total
                          ? breakdown.total
                          : Number(
                              item.p.price ||
                                0
                            );

                      return (
                        <div
                          key={
                            item.productId
                          }
                          className="pt-4 first:pt-0 flex items-center justify-between gap-4"
                        >

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
                                  {weight}
                                  g
                                </span>

                                {" · "}

                                Purity:{" "}
                                <span className="font-semibold text-[color:var(--espresso)]">
                                  {
                                    item.p
                                      .purity
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

                          <div className="text-right shrink-0">

                            <p className="font-bold text-base text-[color:var(--espresso)]">
                              {formatINR(
                                price *
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

              {/* ===================================
                  CONTACT
              =================================== */}

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
                        event.target.value
                      )
                    }
                    className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm bg-white focus:border-[color:var(--gold)] outline-none"
                    required
                  />

                </label>

              </div>

              {/* ===================================
                  ADDRESS
              =================================== */}

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

                  <div className="space-y-3 pt-2 border-t border-[color:var(--border)]">

                    <div className="flex gap-2">

                      {[
                        "Home",
                        "Work",
                        "Other",
                      ].map(
                        (
                          addressLabel
                        ) => (
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
                            event.target.value
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

                ) : addresses.length >
                  0 ? (

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
                RIGHT SIDE
            ============================================= */}

            <div className="bg-[color:var(--panel)] rounded-2xl p-6 h-fit border border-[color:var(--border)] shadow-xs">

              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">
                Order Summary
              </h3>

              {/* =========================================
                  ITEMS
              ========================================= */}

              <div className="space-y-3 text-sm divide-y divide-[color:var(--border)]/60">

                {items.map(
                  (item) => {
                    const weight =
                      Number(
                        item.p.weight ??
                          item.p.grossWeight ??
                          0
                      );

                    const breakdown =
                      computeBreakdown(
                        weight,
                        item.p.purity ||
                          "22K"
                      );

                    const price =
                      breakdown?.total
                        ? breakdown.total
                        : Number(
                            item.p.price ||
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
                              weight
                            }g ·{" "}
                            {
                              item.p
                                .purity
                            }{" "}
                            ×{" "}
                            {
                              item.qty
                            }
                          </p>

                        </div>

                        <span className="font-semibold shrink-0">
                          {formatINR(
                            price *
                              item.qty
                          )}
                        </span>

                      </div>
                    );
                  }
                )}

              </div>

              <div className="h-px bg-[color:var(--gold)]/30 my-4" />

              {/* =========================================
                  PRICE BREAKDOWN
              ========================================= */}

              <div className="space-y-2">

                <div className="flex justify-between text-sm">

                  <span className="text-[color:var(--muted-foreground)]">
                    Cost of Metal
                  </span>

                  <span className="text-[color:var(--espresso)]">
                    {formatINR(
                      displayMetalTotal
                    )}
                  </span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-[color:var(--muted-foreground)]">
                    VA / Making Charges
                  </span>

                  <span className="text-[color:var(--espresso)]">
                    {formatINR(
                      displayVaTotal
                    )}
                  </span>

                </div>

                <div className="flex justify-between text-sm pt-1">

                  <span className="text-[color:var(--muted-foreground)]">
                    Subtotal
                  </span>

                  <span className="text-[color:var(--espresso)]">
                    {formatINR(
                      displaySubtotal
                    )}
                  </span>

                </div>

              </div>

              {/* =========================================
                  CUSTOMER DISCOUNT
              ========================================= */}

              {customerDiscount &&
                customerDiscountAmount >
                  0 && (

                  <div className="mt-3 rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--cream)]/40 p-3">

                    <div className="flex items-center justify-between gap-3">

                      <div>

                        <p className="text-xs font-semibold text-[color:var(--gold-dark)]">
                          Customer Discount
                        </p>

                        <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                          {
                            customerDiscount.name ||
                            "Special customer offer"
                          }
                        </p>

                      </div>

                      <span className="text-sm font-bold text-green-700 whitespace-nowrap">

                        {customerDiscount.kind ===
                        "percent"
                          ? `${customerDiscount.value}% OFF`
                          : `${formatINR(
                              Number(
                                customerDiscount.value
                              )
                            )} OFF`}

                      </span>

                    </div>

                    <div className="flex justify-between text-sm mt-2">

                      <span className="text-green-700">
                        Customer discount
                      </span>

                      <span className="text-green-700 font-medium">
                        -{formatINR(
                          customerDiscountAmount
                        )}
                      </span>

                    </div>

                    <p className="text-[10px] text-[color:var(--muted-foreground)] mt-1">
                      Applied to making /
                      VA charges.
                    </p>

                  </div>
                )}

              {/* =========================================
                  SEASONAL / PRODUCT DISCOUNTS
              ========================================= */}

              {seasonalDiscountGroups.map(
                (group) => (

                  <div
                    key={
                      group.discount.id
                    }
                    className="mt-3 rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--cream)]/40 p-3"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <div>

                        <p className="text-xs font-semibold text-[color:var(--gold-dark)]">
                          {group.discount.target ===
                          "PRODUCT"
                            ? "Product Discount"
                            : "Seasonal Discount"}
                        </p>

                        <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
                          {
                            group.discount.name ||
                            "Special offer"
                          }
                        </p>

                      </div>

                      <span className="text-sm font-bold text-green-700 whitespace-nowrap">

                        {group.discount.kind ===
                        "percent"
                          ? `${group.discount.value}% OFF`
                          : `${formatINR(
                              Number(
                                group.discount.value
                              )
                            )} OFF`}

                      </span>

                    </div>

                    <div className="flex justify-between text-sm mt-2">

                      <span className="text-green-700">
                        {group.discount.target ===
                        "PRODUCT"
                          ? "Product discount"
                          : "Seasonal discount"}
                      </span>

                      <span className="text-green-700 font-medium">
                        -{formatINR(
                          group.amount
                        )}
                      </span>

                    </div>

                    <p className="text-[10px] text-[color:var(--muted-foreground)] mt-1">
                      Applied to making /
                      VA charges.
                    </p>

                    {group.products.length >
                      0 && (
                      <p className="text-[10px] text-[color:var(--muted-foreground)] mt-1">
                        Applies to:{" "}
                        {group.products.join(
                          ", "
                        )}
                      </p>
                    )}

                  </div>

                )
              )}

              {/* =========================================
                  COUPON APPLIED
              ========================================= */}

              {appliedCoupon && (

                <div className="mt-3 rounded-xl border border-green-200 bg-green-50/60 p-3">

                  <div className="flex items-center justify-between gap-3">

                    <div>

                      <p className="text-xs font-semibold text-green-700">
                        Coupon Applied
                      </p>

                      <p className="text-sm font-semibold text-[color:var(--espresso)] mt-0.5">
                        {
                          appliedCoupon.code
                        }
                      </p>

                      {appliedCoupon.name && (
                        <p className="text-[10px] text-[color:var(--muted-foreground)] mt-0.5">
                          {
                            appliedCoupon.name
                          }
                        </p>
                      )}

                    </div>

                    <span className="text-xs font-semibold text-green-700">
                      Applied from cart
                    </span>

                  </div>

                </div>

              )}

              {/* =========================================
                  BACKEND DISCOUNT FALLBACK
              ========================================= */}

              {backendTotal !==
                null &&
                backendDiscount >
                  0 &&
                !customerDiscount &&
                seasonalDiscountGroups.length ===
                  0 && (

                  <div className="mt-3 flex justify-between text-sm">

                    <span className="text-green-700">
                      Offers & Discounts
                    </span>

                    <span className="text-green-700 font-medium">
                      -{formatINR(
                        backendDiscount
                      )}
                    </span>

                  </div>
                )}

              {/* =========================================
                  TOTAL
              ========================================= */}

              <div className="flex justify-between font-bold text-lg text-[color:var(--espresso)] pt-4 mt-3 border-t border-[color:var(--gold)]/30">

                <span>
                  Total Payable
                </span>

                <span>
                  {formatINR(
                    displayTotal
                  )}
                </span>

              </div>

              {/* =========================================
                  DISCOUNT SAVING
              ========================================= */}

              {displayDiscount >
                0 && (

                <div className="mt-3 rounded-xl bg-green-50 border border-green-100 px-3 py-2">

                  <div className="flex justify-between text-sm">

                    <span className="text-green-700 font-medium">
                      You Save
                    </span>

                    <span className="text-green-700 font-bold">
                      {formatINR(
                        displayDiscount
                      )}
                    </span>

                  </div>

                </div>
              )}

              {/* =========================================
                  DISCOUNT LOADING
              ========================================= */}

              {loadingDiscounts && (
                <p className="text-[10px] text-[color:var(--muted-foreground)] mt-3">
                  Checking available
                  offers...
                </p>
              )}

              {/* =========================================
                  PAYMENT
              ========================================= */}

              <button
                type="submit"
                disabled={
                  loading ||
                  items.length ===
                    0
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