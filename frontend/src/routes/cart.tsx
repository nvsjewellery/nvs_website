import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Minus,
  Plus,
  Trash2,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";

import {
  productsApi,
  discountsApi,
  type Discount,
} from "@/lib/api";

import {
  actions,
  computeBreakdown,
  formatINR,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

/* =========================================================
   PRODUCT CACHE
========================================================= */

const productCache: Record<string, any> = {};

/* =========================================================
   CART PAGE
========================================================= */

function CartPage() {
  const cart = useStore((s) => s.cart);

  /* =======================================================
     COUPON STATE
  ======================================================= */

  const [coupon, setCoupon] =
    useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState<Discount | null>(() => {
      if (typeof window === "undefined") {
        return null;
      }

      try {
        const stored = sessionStorage.getItem(
          "nvs-applied-coupon"
        );

        return stored
          ? (JSON.parse(stored) as Discount)
          : null;
      } catch {
        return null;
      }
    });

  const [couponLoading, setCouponLoading] =
    useState(false);

  const [couponError, setCouponError] =
    useState("");

  const [couponSuccess, setCouponSuccess] =
    useState("");

  /* =======================================================
     DISCOUNT STATE
  ======================================================= */

  const [availableDiscounts, setAvailableDiscounts] =
    useState<Discount[]>([]);

  const [discountLoading, setDiscountLoading] =
    useState(false);

  /* =======================================================
     PRODUCT STATE
  ======================================================= */

  const [productsMap, setProductsMap] =
    useState<Record<string, any>>(
      productCache
    );

  const [loading, setLoading] =
    useState(false);

  /* =======================================================
     CART KEY
  ======================================================= */

  const cartKeys = cart
    .map((c: any) => c.productId)
    .join(",");

  /* =======================================================
     LOAD CART PRODUCTS
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    async function loadCartProducts() {
      const missingIds = cart
        .map((c: any) => c.productId)
        .filter(
          (id: string) =>
            !productCache[id]
        );

      if (
        missingIds.length === 0
      ) {
        setProductsMap({
          ...productCache,
        });

        return;
      }

      setLoading(true);

      try {
        const promises =
          missingIds.map(
            (id: string) =>
              productsApi
                .getById(id)
                .catch(() => null)
          );

        const results =
          await Promise.all(
            promises
          );

        results.forEach((p) => {
          if (p && p.id) {
            productCache[p.id] = p;
          }
        });

        if (isMounted) {
          setProductsMap({
            ...productCache,
          });
        }
      } catch (err) {
        console.error(
          "Failed to fetch cart products:",
          err
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCartProducts();

    return () => {
      isMounted = false;
    };
  }, [cartKeys]);

  /* =======================================================
     LOAD AVAILABLE DISCOUNTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadDiscounts() {
      setDiscountLoading(true);

      try {
        const discounts =
          await discountsApi.getAvailable();

        if (!cancelled) {
          setAvailableDiscounts(
            discounts
          );
        }
      } catch (error) {
        console.error(
          "Failed to load discounts:",
          error
        );

        if (!cancelled) {
          setAvailableDiscounts(
            []
          );
        }
      } finally {
        if (!cancelled) {
          setDiscountLoading(false);
        }
      }
    }

    loadDiscounts();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     MAP CART ITEMS TO PRODUCTS
  ======================================================= */

  const items = cart
    .map((c: any) => ({
      ...c,
      p: productsMap[c.productId],
    }))
    .filter((c: any) =>
      Boolean(c.p)
    );

  /* =======================================================
     HELPER:
     GET PRODUCT CATEGORY
  ======================================================= */

  function getProductCategory(
    product: any
  ) {
    return String(
      product?.category ??
        product?.sub ??
        ""
    )
      .trim()
      .toLowerCase();
  }

  /* =======================================================
     HELPER:
     CHECK DISCOUNT APPLIES TO PRODUCT
  ======================================================= */

  function discountAppliesToProduct(
    discount: Discount,
    product: any
  ) {
    if (!discount || !product) {
      return false;
    }

    /* -----------------------------------------------------
       METAL RESTRICTION
    ----------------------------------------------------- */

    if (
      discount.metal &&
      discount.metal !==
        product.metal
    ) {
      return false;
    }

    /* -----------------------------------------------------
       PRODUCT DISCOUNT
    ----------------------------------------------------- */

    if (
      discount.target ===
      "PRODUCT"
    ) {
      return (
        discount.products?.some(
          (discountProduct) =>
            discountProduct.id ===
            product.id
        ) ?? false
      );
    }

    /* -----------------------------------------------------
       CATEGORY DISCOUNT
    ----------------------------------------------------- */

    if (
      discount.target ===
      "CATEGORY"
    ) {
      const productCategory =
        getProductCategory(
          product
        );

      const discountCategory =
        String(
          discount.category ??
            ""
        )
          .trim()
          .toLowerCase();

      return (
        productCategory !== "" &&
        discountCategory !== "" &&
        productCategory ===
          discountCategory
      );
    }

    /* -----------------------------------------------------
       CART DISCOUNT
    ----------------------------------------------------- */

    if (
      discount.target ===
      "CART"
    ) {
      return true;
    }

    return false;
  }

  /* =======================================================
     HELPER:
     CALCULATE VA
  ======================================================= */

  function getProductVa(
    product: any,
    breakdown: any
  ) {
    /*
     * Backend discount service uses product.va.
     *
     * We therefore prefer:
     *
     * 1. product.va
     * 2. product.making
     * 3. breakdown.making
     *
     * This keeps the frontend compatible
     * with the product data already being returned.
     */

    return Number(
      product?.va ??
        product?.making ??
        breakdown?.making ??
        0
    );
  }

  /* =======================================================
     HELPER:
     CALCULATE DISCOUNT AMOUNT
  ======================================================= */

  function calculateDiscountAmount(
    vaAmount: number,
    discount: Discount
  ) {
    const va =
      Number(vaAmount || 0);

    const value =
      Number(
        discount.value || 0
      );

    if (
      va <= 0 ||
      value <= 0
    ) {
      return 0;
    }

    let amount = 0;

    if (
      discount.kind ===
      "percent"
    ) {
      amount =
        (va * value) / 100;
    } else if (
      discount.kind ===
      "flat"
    ) {
      amount = value;
    }

    /*
     * Discount can never exceed VA.
     */

    return Math.min(
      Math.max(amount, 0),
      va
    );
  }

  /* =======================================================
     GET BEST PRODUCT DISCOUNT
  ======================================================= */

  function getBestProductDiscount(
    product: any
  ): Discount | null {
    const candidates: Discount[] =
      [];

    /* -----------------------------------------------------
       SEASONAL DISCOUNTS
    ----------------------------------------------------- */

    const seasonalDiscounts =
      availableDiscounts.filter(
        (discount) => {
          if (
            discount.type !==
            "SEASONAL"
          ) {
            return false;
          }

          return discountAppliesToProduct(
            discount,
            product
          );
        }
      );

    candidates.push(
      ...seasonalDiscounts
    );

    /* -----------------------------------------------------
       APPLIED COUPON
    ----------------------------------------------------- */

    if (
      appliedCoupon &&
      appliedCoupon.type ===
        "COUPON" &&
      (appliedCoupon.target ===
        "PRODUCT" ||
        appliedCoupon.target ===
          "CATEGORY")
    ) {
      if (
        discountAppliesToProduct(
          appliedCoupon,
          product
        )
      ) {
        candidates.push(
          appliedCoupon
        );
      }
    }

    if (
      candidates.length ===
      0
    ) {
      return null;
    }

    /*
     * We cannot simply compare
     * percentage values.
     *
     * Actual VA amount must be compared.
     */

    let bestDiscount:
      | Discount
      | null = null;

    let bestAmount = 0;

    for (
      const discount of candidates
    ) {
      const weightVal =
        Number(
          product?.weight ??
            product?.grossWeight ??
            0
        );

      const breakdown =
        computeBreakdown(
          weightVal,
          product?.purity ||
            "22K"
        );

      const vaAmount =
        getProductVa(
          product,
          breakdown
        );

      const amount =
        calculateDiscountAmount(
          vaAmount,
          discount
        );

      if (
        amount > bestAmount
      ) {
        bestAmount =
          amount;

        bestDiscount =
          discount;
      }
    }

    return bestDiscount;
  }

  /* =======================================================
   REVALIDATE STORED COUPON AFTER CART LOAD
======================================================= */

useEffect(() => {
  if (!appliedCoupon?.code || items.length === 0) {
    return;
  }

  let cancelled = false;

  async function revalidateCoupon() {
    const couponCode = appliedCoupon?.code?.trim();

    if (!couponCode) {
      return;
    }

    try {
      const validated =
        await discountsApi.validateCoupon(
          couponCode
        );

      if (cancelled) {
        return;
      }

      /*
       * Make sure the stored discount
       * is still a valid coupon.
       */

      if (
        !validated ||
        validated.type !== "COUPON"
      ) {
        setAppliedCoupon(null);
        setCoupon("");
        setCouponError(
          "This coupon is no longer valid."
        );
        setCouponSuccess("");
        return;
      }

      /*
       * Make sure the coupon still
       * applies to something in the cart.
       */

      const applies = items.some(
        (item: any) =>
          discountAppliesToProduct(
            validated,
            item.p
          )
      );

      if (!applies) {
        setAppliedCoupon(null);
        setCoupon("");
        setCouponError(
          "This coupon no longer applies to your cart."
        );
        setCouponSuccess("");
        return;
      }

      /*
       * Store the freshly validated
       * coupon returned by backend.
       */

      setAppliedCoupon(validated);

      setCouponSuccess(
        validated.name
          ? `${validated.name} applied successfully.`
          : "Coupon applied successfully."
      );
    } catch (error) {
      if (cancelled) {
        return;
      }

      setAppliedCoupon(null);
      setCoupon("");
      setCouponError(
        "Unable to validate the coupon."
      );
      setCouponSuccess("");
    }
  }

  revalidateCoupon();

  return () => {
    cancelled = true;
  };
}, [appliedCoupon?.code, items]);

  /* =======================================================
     CALCULATE CART ITEMS WITH DISCOUNTS
  ======================================================= */

  const calculatedItems =
    useMemo(() => {
      return items.map(
        (item: any) => {
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
                  item.p.price ||
                    0
                );

          const vaAmount =
            getProductVa(
              item.p,
              breakdown
            );

          const productDiscount =
            getBestProductDiscount(
              item.p
            );

          const discountPerUnit =
            productDiscount
              ? calculateDiscountAmount(
                  vaAmount,
                  productDiscount
                )
              : 0;

          const originalTotal =
            itemPrice *
            item.qty;

          const discountTotal =
            discountPerUnit *
            item.qty;

          const finalTotal =
            Math.max(
              originalTotal -
                discountTotal,
              0
            );

          return {
            ...item,

            weightVal,

            breakdown,

            itemPrice,

            vaAmount,

            productDiscount,

            discountPerUnit,

            originalTotal,

            discountTotal,

            finalTotal,
          };
        }
      );
    }, [
      items,
      availableDiscounts,
      appliedCoupon,
    ]);

  /* =======================================================
     CART SUBTOTAL
  ======================================================= */

  const subtotal =
    calculatedItems.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        item.originalTotal,
      0
    );

  /* =======================================================
     PRODUCT / COUPON DISCOUNT
  ======================================================= */

  const productDiscountTotal =
    calculatedItems.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        item.discountTotal,
      0
    );

  /* =======================================================
     CART VA TOTAL
  ======================================================= */

  const cartVaTotal =
    calculatedItems.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        item.vaAmount *
          item.qty,
      0
    );

  /* =======================================================
     CUSTOMER DISCOUNT
  ======================================================= */

  const customerDiscount =
    availableDiscounts
      .filter(
        (discount) =>
          discount.type ===
            "CUSTOMER" &&
          discount.target ===
            "CUSTOMER"
      )
      .reduce(
        (
          best: Discount | null,
          current
        ) => {
          if (!best) {
            return current;
          }

          /*
           * Compare actual discount
           * amount against the cart VA.
           */

          const bestAmount =
            calculateDiscountAmount(
              cartVaTotal,
              best
            );

          const currentAmount =
            calculateDiscountAmount(
              cartVaTotal,
              current
            );

          return currentAmount >
            bestAmount
            ? current
            : best;
        },
        null
      );

  /* =======================================================
     CUSTOMER DISCOUNT AMOUNT
  ======================================================= */

  const customerDiscountAmount =
    customerDiscount
      ? calculateDiscountAmount(
          cartVaTotal,
          customerDiscount
        )
      : 0;

  /* =======================================================
     CART COUPON

     A CART coupon is applied ONCE against
     the TOTAL cart VA. It is NOT multiplied
     by the number of products.
  ======================================================= */

  const cartCouponAmount =
    appliedCoupon &&
    appliedCoupon.type === "COUPON" &&
    appliedCoupon.target === "CART"
      ? calculateDiscountAmount(
          cartVaTotal,
          appliedCoupon
        )
      : 0;

  /* =======================================================
     TOTAL DISCOUNT
  ======================================================= */

  const requestedTotalDiscount =
    productDiscountTotal +
    customerDiscountAmount +
    cartCouponAmount;

  const totalDiscount =
    Math.min(
      Math.max(requestedTotalDiscount, 0),
      cartVaTotal
    );

  /* =======================================================
     FINAL TOTAL
  ======================================================= */

  const total = Math.max(
    subtotal -
      totalDiscount,
    0
  );

  /* =======================================================
     COUPON APPLY
  ======================================================= */

  async function handleApplyCoupon() {
    const code =
      coupon.trim();

    if (!code) {
      setCouponError(
        "Please enter a coupon code."
      );

      setCouponSuccess("");

      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const validatedCoupon =
        await discountsApi.validateCoupon(
          code
        );

      /*
       * Make sure the validated
       * response is actually a coupon.
       */

      if (
        validatedCoupon.type !==
        "COUPON"
      ) {
        throw new Error(
          "This code is not a valid coupon."
        );
      }

      /*
       * Check whether the coupon
       * applies to at least one
       * product in the cart.
       */

      const applies =
        items.some(
          (item: any) =>
            discountAppliesToProduct(
              validatedCoupon,
              item.p
            )
        );

      if (!applies) {
        throw new Error(
          "This coupon does not apply to the products in your cart."
        );
      }

      setAppliedCoupon(
        validatedCoupon
      );

      sessionStorage.setItem(
        "nvs-applied-coupon",
        JSON.stringify(validatedCoupon)
      );

      setCouponSuccess(
        validatedCoupon.name
          ? `${validatedCoupon.name} applied successfully.`
          : "Coupon applied successfully."
      );
    } catch (error: any) {
      setAppliedCoupon(null);
      sessionStorage.removeItem("nvs-applied-coupon");

      setCouponError(
        error?.message ||
          "Invalid or expired coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  }

  /* =======================================================
     REMOVE COUPON
  ======================================================= */

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    sessionStorage.removeItem("nvs-applied-coupon");
    setCoupon("");
    setCouponError("");
    setCouponSuccess("");
  }

  /* =======================================================
     DISCOUNT LABEL
  ======================================================= */

  function getDiscountLabel(
    discount: Discount
  ) {
    if (
      discount.kind ===
      "percent"
    ) {
      return `${discount.value}% OFF`;
    }

    return `₹${discount.value} OFF`;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">
          Your Cart
        </h1>

        <OrnamentalDivider className="mt-6 mb-8" />

        {/* =================================================
            LOADING
        ================================================= */}

        {loading &&
        calculatedItems.length ===
          0 ? (
          <div className="space-y-4">
            {cart.map(
              (c: any) => (
                <div
                  key={
                    c.productId
                  }
                  className="h-28 bg-[color:var(--panel)] rounded-2xl animate-pulse border border-[color:var(--border)]"
                />
              )
            )}
          </div>
        ) : calculatedItems.length ===
          0 ? (

          /* =================================================
             EMPTY CART
          ================================================= */

          <div className="text-center py-20">

            <p className="text-[color:var(--muted-foreground)]">
              Your cart is empty.
            </p>

            <Link
              to="/gold"
              className="pill-gold mt-6 inline-flex cursor-pointer"
            >
              Browse Collection
            </Link>

          </div>
        ) : (

          /* =================================================
             CART
          ================================================= */

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

            {/* =================================================
                CART ITEMS
            ================================================= */}

            <div className="space-y-4">

              {calculatedItems.map(
                (item: any) => (
                  <div
                    key={
                      item.productId
                    }
                    className="bg-white border border-[color:var(--border)] rounded-2xl p-4 flex gap-4"
                  >

                    {/* Product Image */}

                    <Link
                      to="/product/$id"
                      params={{
                        id: item.productId,
                      }}
                      className="shrink-0 cursor-pointer"
                    >
                      <img
                        src={
                          item.p.image
                        }
                        alt={
                          item.p.name
                        }
                        className="w-24 h-24 rounded-lg object-cover bg-[color:var(--panel)] shrink-0"
                      />
                    </Link>

                    {/* Product Details */}

                    <div className="flex-1 min-w-0 flex flex-col">

                      <div className="flex justify-between gap-3">

                        <div className="min-w-0">

                          <Link
                            to="/product/$id"
                            params={{
                              id: item.productId,
                            }}
                            className="cursor-pointer"
                          >
                            <h3 className="font-serif font-bold text-[color:var(--espresso)] hover:text-[color:var(--gold-dark)] transition-colors">
                              {
                                item
                                  .p
                                  .name
                              }
                            </h3>
                          </Link>

                          <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                            {
                              item
                                .p
                                .purity
                            }{" "}
                            ·{" "}
                            {
                              item.weightVal
                            }
                            g
                          </p>

                          {/* Product Discount */}

                          {item.productDiscount && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700 font-medium">

                              <Tag className="w-3.5 h-3.5" />

                              <span>
                                {
                                  getDiscountLabel(
                                    item.productDiscount
                                  )
                                }{" "}
                                on making charges
                              </span>

                            </div>
                          )}

                        </div>

                        {/* Price */}

                        <div className="text-right shrink-0">

                          {item.discountTotal >
                          0 ? (
                            <>
                              <div className="text-xs text-[color:var(--muted-foreground)] line-through">
                                {formatINR(
                                  item.originalTotal
                                )}
                              </div>

                              <div className="font-serif font-bold text-green-700">
                                {formatINR(
                                  item.finalTotal
                                )}
                              </div>

                              <div className="text-[10px] text-green-700">
                                Saved{" "}
                                {formatINR(
                                  item.discountTotal
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="font-serif font-bold text-[color:var(--gold-dark)]">
                              {formatINR(
                                item.originalTotal
                              )}
                            </div>
                          )}

                          <div className="text-[10px] text-[color:var(--muted-foreground)]">
                            incl. GST
                          </div>

                        </div>
                      </div>

                      {/* Bottom Actions */}

                      <div className="flex items-center justify-between mt-auto pt-3">

                        {/* Quantity */}

                        <div className="flex items-center border border-[color:var(--border)] rounded-full">

                          <button
                            type="button"
                            onClick={() =>
                              actions.updateQty(
                                item.productId,
                                item.qty -
                                  1
                              )
                            }
                            className="p-2 cursor-pointer hover:bg-[color:var(--panel)] rounded-full transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-7 text-center text-sm font-semibold">
                            {
                              item.qty
                            }
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              actions.updateQty(
                                item.productId,
                                item.qty +
                                  1
                              )
                            }
                            className="p-2 cursor-pointer hover:bg-[color:var(--panel)] rounded-full transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                        </div>

                        {/* Remove */}

                        <button
                          type="button"
                          onClick={() =>
                            actions.removeFromCart(
                              item.productId
                            )
                          }
                          className="text-destructive text-xs font-medium inline-flex items-center gap-1 cursor-pointer hover:opacity-75 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />

                          Remove
                        </button>

                      </div>
                    </div>
                  </div>
                )
              )}

            </div>

            {/* =================================================
                ORDER SUMMARY
            ================================================= */}

            <div
              style={{
                backgroundColor:
                  "var(--panel)",
              }}
              className="rounded-2xl p-6 h-fit"
            >

              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">
                Order Summary
              </h3>

              {/* =================================================
                  SUBTOTAL
              ================================================= */}

              <Row
                l="Subtotal"
                v={formatINR(
                  subtotal
                )}
              />

              {/* =================================================
                  CUSTOMER DISCOUNT
              ================================================= */}

              {customerDiscount &&
                customerDiscountAmount >
                  0 && (
                  <Row
                    l={
                      customerDiscount.name ||
                      "Customer Discount"
                    }
                    v={
                      <span className="text-green-700">
                        -
                        {formatINR(
                          customerDiscountAmount
                        )}
                      </span>
                    }
                  />
                )}

              {/* =================================================
                  CART COUPON DISCOUNT
              ================================================= */}

              {appliedCoupon &&
                cartCouponAmount > 0 && (
                <Row
                  l={
                    appliedCoupon.name ||
                    "Coupon Discount"
                  }
                  v={
                    <span className="text-green-700">
                      -{formatINR(
                        cartCouponAmount
                      )}
                    </span>
                  }
                />
              )}

              {/* =================================================
                  PRODUCT / SEASONAL DISCOUNT
              ================================================= */}

              {productDiscountTotal >
                0 && (
                <Row
                  l="Offers & Discounts"
                  v={
                    <span className="text-green-700">
                      -
                      {formatINR(
                        productDiscountTotal
                      )}
                    </span>
                  }
                />
              )}

              {/* =================================================
                  TOTAL SAVINGS
              ================================================= */}

              {totalDiscount >
                0 && (
                <div className="mt-3 rounded-xl bg-green-50 border border-green-100 px-3 py-2">

                  <div className="flex items-center gap-2 text-xs font-medium text-green-700">

                    <Tag className="w-3.5 h-3.5" />

                    <span>
                      You save{" "}
                      {formatINR(
                        totalDiscount
                      )}
                    </span>

                  </div>

                </div>
              )}

              {/* =================================================
                  COUPON
              ================================================= */}

              <div className="mt-4">

                {appliedCoupon ? (

                  <div className="rounded-xl border border-green-200 bg-green-50 p-3">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-xs font-semibold text-green-800">
                          Coupon Applied
                        </p>

                        <p className="text-sm font-medium text-green-700 mt-1">
                          {appliedCoupon.code}
                        </p>

                        {appliedCoupon.name && (
                          <p className="text-[11px] text-green-700 mt-0.5">
                            {
                              appliedCoupon.name
                            }
                          </p>
                        )}

                      </div>

                      <button
                        type="button"
                        onClick={
                          handleRemoveCoupon
                        }
                        className="text-xs font-medium text-green-800 hover:opacity-70 cursor-pointer"
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                ) : (

                  <div className="flex gap-2">

                    <input
                      value={coupon}
                      onChange={(e) => {
                        setCoupon(
                          e.target.value
                        );

                        setCouponError(
                          ""
                        );

                        setCouponSuccess(
                          ""
                        );
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-[color:var(--border)] rounded-full px-4 py-2 text-sm bg-white outline-none focus:border-[color:var(--gold)]"
                    />

                    <button
                      type="button"
                      onClick={
                        handleApplyCoupon
                      }
                      disabled={
                        couponLoading
                      }
                      className="pill-gold-outline !py-2 !px-4 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {couponLoading
                        ? "Checking..."
                        : "Apply"}
                    </button>

                  </div>

                )}

                {/* Coupon Error */}

                {couponError && (
                  <p className="text-xs text-red-600 mt-2">
                    {
                      couponError
                    }
                  </p>
                )}

                {/* Coupon Success */}

                {couponSuccess &&
                  appliedCoupon && (
                    <p className="text-xs text-green-700 mt-2">
                      {
                        couponSuccess
                      }
                    </p>
                  )}

              </div>

              {/* =================================================
                  DISCOUNT DETAILS
              ================================================= */}

              {discountLoading ===
                false &&
                availableDiscounts.some(
                  (discount) =>
                    discount.type ===
                    "SEASONAL"
                ) && (
                  <div className="mt-4">

                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--gold-dark)] mb-2">
                      Active Offers
                    </p>

                    <div className="space-y-1">

                      {availableDiscounts
                        .filter(
                          (discount) =>
                            discount.type ===
                            "SEASONAL"
                        )
                        .slice(0, 3)
                        .map(
                          (
                            discount
                          ) => (
                            <div
                              key={
                                discount.id
                              }
                              className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]"
                            >
                              <Tag className="w-3 h-3 text-[color:var(--gold-dark)]" />

                              <span>
                                {discount.name ||
                                  getDiscountLabel(
                                    discount
                                  )}
                              </span>
                            </div>
                          )
                        )}

                    </div>
                  </div>
                )}

              {/* =================================================
                  DIVIDER
              ================================================= */}

              <div className="h-px bg-[color:var(--gold)]/30 my-4" />

              {/* =================================================
                  TOTAL
              ================================================= */}

              <div className="flex justify-between font-bold text-lg text-[color:var(--espresso)]">

                <span>
                  Total
                </span>

                <span>
                  {formatINR(
                    total
                  )}
                </span>

              </div>

              {/* =================================================
                  CHECKOUT
              ================================================= */}

              <Link
                to="/checkout"
                className="pill-gold w-full justify-center mt-5 flex cursor-pointer"
              >
                Proceed to Checkout
              </Link>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function Row({
  l,
  v,
}: {
  l: string;
  v: React.ReactNode;
}) {
  return (
    <div className="flex justify-between text-sm py-1">

      <span className="text-[color:var(--muted-foreground)]">
        {l}
      </span>

      <span className="text-[color:var(--espresso)]">
        {v}
      </span>

    </div>
  );
}