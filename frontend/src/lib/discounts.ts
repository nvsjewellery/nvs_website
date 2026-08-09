import type { Discount, ProductItem } from "@/lib/api";

/* =========================================================
   DISCOUNT RESULT
========================================================= */

export interface DiscountResult {
  originalVA: number;
  discountAmount: number;
  finalVA: number;
  discount: Discount | null;
}

/* =========================================================
   CHECK IF DISCOUNT IS CURRENTLY VALID
========================================================= */

export function isDiscountValid(
  discount: Discount,
  now = new Date()
): boolean {
  if (discount.usageLimit != null) {
    const usageCount =
      discount.usageCount ?? 0;

    if (
      usageCount >=
      discount.usageLimit
    ) {
      return false;
    }
  }

  if (discount.startDate) {
    const start =
      new Date(discount.startDate);

    if (now < start) {
      return false;
    }
  }

  if (discount.endDate) {
    const end =
      new Date(discount.endDate);

    if (now > end) {
      return false;
    }
  }

  return true;
}

/* =========================================================
   CHECK WHETHER DISCOUNT APPLIES TO PRODUCT
========================================================= */

export function discountAppliesToProduct(
  discount: Discount,
  product: ProductItem
): boolean {
  if (
    discount.type !== "SEASONAL"
  ) {
    return false;
  }

  if (
    !isDiscountValid(discount)
  ) {
    return false;
  }

  /* -----------------------------------------------
     Metal
  ----------------------------------------------- */

  if (
    discount.metal &&
    discount.metal !== product.metal
  ) {
    return false;
  }

  /* -----------------------------------------------
     PRODUCT discount
  ----------------------------------------------- */

  if (
    discount.target === "PRODUCT"
  ) {
    /*
     * The public Discount interface currently
     * does not contain productIds.
     *
     * Therefore product-target matching cannot
     * safely be performed from this object yet.
     */
    return false;
  }

  /* -----------------------------------------------
     CATEGORY discount
  ----------------------------------------------- */

  if (
    discount.target === "CATEGORY"
  ) {
    if (!discount.category) {
      return false;
    }

    const productCategory =
      product.category ??
      product.sub ??
      "";

    return (
      productCategory.trim().toLowerCase() ===
      discount.category
        .trim()
        .toLowerCase()
    );
  }

  return false;
}

/* =========================================================
   CALCULATE VA DISCOUNT
========================================================= */

export function calculateVADiscount(
  vaAmount: number,
  discount: Discount
): DiscountResult {
  const safeVA =
    Math.max(0, Number(vaAmount) || 0);

  if (
    !isDiscountValid(discount)
  ) {
    return {
      originalVA: safeVA,
      discountAmount: 0,
      finalVA: safeVA,
      discount: null,
    };
  }

  let discountAmount = 0;

  if (
    discount.kind === "percent"
  ) {
    discountAmount =
      (safeVA * discount.value) /
      100;
  } else {
    discountAmount =
      discount.value;
  }

  /*
   * Discount can never reduce VA
   * below zero.
   */

  discountAmount = Math.min(
    safeVA,
    Math.max(0, discountAmount)
  );

  return {
    originalVA: safeVA,
    discountAmount,
    finalVA:
      safeVA - discountAmount,
    discount,
  };
}

/* =========================================================
   FIND BEST SEASONAL DISCOUNT
========================================================= */

export function findBestSeasonalDiscount(
  product: ProductItem,
  discounts: Discount[]
): Discount | null {
  const applicable =
    discounts.filter(
      (discount) =>
        discountAppliesToProduct(
          discount,
          product
        )
    );

  if (
    applicable.length === 0
  ) {
    return null;
  }

  /*
   * If multiple discounts apply,
   * choose the one producing the
   * largest VA discount.
   */

  const vaAmount =
    Number(
      (product as any).making ??
        (product as any).va ??
        0
    );

  return applicable.reduce(
    (best, current) => {
      const bestResult =
        calculateVADiscount(
          vaAmount,
          best
        );

      const currentResult =
        calculateVADiscount(
          vaAmount,
          current
        );

      return currentResult.discountAmount >
        bestResult.discountAmount
        ? current
        : best;
    }
  );
}