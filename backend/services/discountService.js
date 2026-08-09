const prisma = require("../lib/prisma");

/*
|--------------------------------------------------------------------------
| CALCULATE VA DISCOUNT
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Discount is ALWAYS applied ONLY to VA / making charges.
|
| Example:
|
| Product total       = ₹50,000
| VA / making charges = ₹5,000
| Discount            = 10%
|
| Discount = ₹500
| Final VA = ₹4,500
|
| The discount NEVER touches the metal value.
|
*/

function calculateVaDiscount(
  vaAmount,
  kind,
  value
) {
  const va = Number(vaAmount || 0);
  const discountValue = Number(value || 0);

  if (
    va <= 0 ||
    discountValue <= 0
  ) {
    return 0;
  }

  let discount = 0;

  if (kind === "percent") {
    discount =
      (va * discountValue) / 100;
  } else if (kind === "flat") {
    discount = discountValue;
  }

  /*
   * Never allow discount to become
   * greater than the VA amount.
   */

  return Math.min(
    Math.max(discount, 0),
    va
  );
}

/*
|--------------------------------------------------------------------------
| CHECK DISCOUNT VALIDITY
|--------------------------------------------------------------------------
*/

function isDiscountCurrentlyValid(
  discount
) {
  if (!discount) {
    return false;
  }

  /*
   * Must be active.
   */

  if (!discount.isActive) {
    return false;
  }

  const now = new Date();

  /*
   * Start date
   */

  if (
    discount.startDate &&
    now < new Date(discount.startDate)
  ) {
    return false;
  }

  /*
   * End date
   */

  if (
    discount.endDate &&
    now > new Date(discount.endDate)
  ) {
    return false;
  }

  /*
   * Usage limit
   */

  if (
    discount.usageLimit !== null &&
    discount.usageLimit !== undefined &&
    Number(discount.usageCount || 0) >=
      Number(discount.usageLimit)
  ) {
    return false;
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| CHECK PRODUCT DISCOUNT
|--------------------------------------------------------------------------
|
| Used for:
|
| SEASONAL + PRODUCT
| SEASONAL + CATEGORY
| COUPON + CART
|
*/

function discountAppliesToProduct(
  discount,
  product
) {
  if (!discount || !product) {
    return false;
  }

  /*
   * Discount must currently be valid.
   */

  if (
    !isDiscountCurrentlyValid(
      discount
    )
  ) {
    return false;
  }

  /*
   * Metal restriction
   *
   * If discount has a metal,
   * product must belong to that metal.
   */

  if (
    discount.metal &&
    discount.metal !== product.metal
  ) {
    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT TARGET
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | Diwali Ring Discount
  | Target = PRODUCT
  |
  | Only that exact product receives
  | the discount.
  |
  */

  if (
    discount.target === "PRODUCT"
  ) {
    if (
      !Array.isArray(
        discount.products
      )
    ) {
      return false;
    }

    return discount.products.some(
      (discountProduct) =>
        discountProduct.id ===
        product.id
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY TARGET
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | Diwali Gold Earrings
  | Target = CATEGORY
  | Category = Earrings
  |
  | Every matching product receives
  | the discount.
  |
  */

  if (
    discount.target === "CATEGORY"
  ) {
    if (!discount.category) {
      return false;
    }

    const productCategory =
      String(
        product.category ||
          product.sub ||
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

  /*
  |--------------------------------------------------------------------------
  | CART TARGET
  |--------------------------------------------------------------------------
  |
  | Coupon discounts are CART based.
  |
  | The coupon itself is validated separately.
  |
  | Metal restriction is still respected.
  |
  */

  if (
    discount.target === "CART"
  ) {
    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER TARGET
  |--------------------------------------------------------------------------
  |
  | Customer discounts are NOT product
  | discounts.
  |
  | They will be handled separately
  | against the customer's cart VA total.
  |
  */

  if (
    discount.target === "CUSTOMER"
  ) {
    return false;
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| GET BEST SEASONAL DISCOUNT
|--------------------------------------------------------------------------
|
| Seasonal discounts:
|
| 1. PRODUCT
| 2. CATEGORY
|
| If multiple discounts apply,
| choose the one giving the highest
| actual VA discount.
|
*/

async function getBestSeasonalDiscount(
  product
) {
  if (!product) {
    return null;
  }

  const discounts =
    await prisma.discount.findMany({
      where: {
        type: "SEASONAL",

        isActive: true,

        OR: [
          {
            metal: null,
          },
          {
            metal: product.metal,
          },
        ],
      },

      include: {
        products: {
          select: {
            id: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const validDiscounts =
    discounts.filter(
      (discount) =>
        discountAppliesToProduct(
          discount,
          product
        )
    );

  if (
    validDiscounts.length === 0
  ) {
    return null;
  }

  /*
   * IMPORTANT:
   *
   * Compare actual discount amount,
   * not just percentage/value.
   */

  const vaAmount = Number(
    product.va || 0
  );

  let bestDiscount = null;
  let bestAmount = 0;

  for (
    const discount of validDiscounts
  ) {
    const amount =
      calculateVaDiscount(
        vaAmount,
        discount.kind,
        discount.value
      );

    if (
      amount > bestAmount
    ) {
      bestAmount = amount;
      bestDiscount = discount;
    }
  }

  return bestDiscount;
}

/*
|--------------------------------------------------------------------------
| GET CUSTOMER DISCOUNT
|--------------------------------------------------------------------------
|
| Customer discounts are assigned to
| one specific user.
|
| IMPORTANT:
|
| We return the discount itself.
|
| The actual amount will later be calculated
| against the TOTAL VA of the customer's cart.
|
*/

async function getCustomerDiscount(
  userId
) {
  if (!userId) {
    return null;
  }

  const discounts =
    await prisma.discount.findMany({
      where: {
        type: "CUSTOMER",

        target: "CUSTOMER",

        userId,

        isActive: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const validDiscounts =
    discounts.filter(
      isDiscountCurrentlyValid
    );

  if (
    validDiscounts.length === 0
  ) {
    return null;
  }

  /*
   * If multiple customer discounts exist,
   * return the strongest one by value.
   *
   * Actual cart VA comparison happens
   * when calculating the cart total.
   */

  return validDiscounts.reduce(
    (best, current) => {
      if (!best) {
        return current;
      }

      if (
        current.kind ===
          "percent" &&
        best.kind === "flat"
      ) {
        return current;
      }

      if (
        current.kind === "flat" &&
        best.kind === "percent"
      ) {
        return best;
      }

      return current.value >
        best.value
        ? current
        : best;
    },
    null
  );
}

/*
|--------------------------------------------------------------------------
| GET COUPON BY CODE
|--------------------------------------------------------------------------
|
| Coupon codes are automatically generated
| by the admin backend.
|
| This function:
|
| 1. Normalizes the code
| 2. Finds it in DB
| 3. Makes sure it is actually a COUPON
| 4. Makes sure it is active
| 5. Makes sure it isn't expired
| 6. Makes sure usage limit isn't reached
|
*/

async function getCouponByCode(
  code
) {
  if (!code) {
    return null;
  }

  const normalizedCode =
    String(code)
      .trim()
      .toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const discount =
    await prisma.discount.findUnique({
      where: {
        code: normalizedCode,
      },

      include: {
        products: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!discount) {
    return null;
  }

  /*
   * Must actually be a coupon.
   */

  if (
    discount.type !== "COUPON"
  ) {
    return null;
  }

  /*
   * Coupon must be valid.
   */

  if (
    !isDiscountCurrentlyValid(
      discount
    )
  ) {
    return null;
  }

  return discount;
}

/*
|--------------------------------------------------------------------------
| GET BEST DISCOUNT FOR ONE PRODUCT
|--------------------------------------------------------------------------
|
| Used when calculating an individual
| product's VA.
|
| Priority:
|
| 1. Coupon
| 2. Customer discount
| 3. Seasonal discount
|
| The strongest actual VA discount wins.
|
| NOTE:
| Customer-specific discounts are handled
| separately at cart level now, so they are
| NOT included here.
|
*/

async function getBestDiscountForProduct({
  userId,
  product,
  coupon = null,
}) {
  if (!product) {
    return null;
  }

  const candidates = [];

  /*
  |--------------------------------------------------------------------------
  | COUPON
  |--------------------------------------------------------------------------
  */

  if (coupon) {
    if (
      discountAppliesToProduct(
        coupon,
        product
      )
    ) {
      candidates.push(coupon);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SEASONAL
  |--------------------------------------------------------------------------
  */

  const seasonalDiscount =
    await getBestSeasonalDiscount(
      product
    );

  if (seasonalDiscount) {
    candidates.push(
      seasonalDiscount
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NO DISCOUNTS
  |--------------------------------------------------------------------------
  */

  if (
    candidates.length === 0
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | CALCULATE ACTUAL VA DISCOUNT
  |--------------------------------------------------------------------------
  */

  const vaAmount = Number(
    product.va || 0
  );

  let bestDiscount = null;
  let bestAmount = 0;

  for (
    const discount of candidates
  ) {
    const amount =
      calculateVaDiscount(
        vaAmount,
        discount.kind,
        discount.value
      );

    if (
      amount > bestAmount
    ) {
      bestAmount = amount;
      bestDiscount = discount;
    }
  }

  if (!bestDiscount) {
    return null;
  }

  return {
    discount:
      bestDiscount,

    vaBeforeDiscount:
      vaAmount,

    discountAmount:
      bestAmount,

    vaAfterDiscount:
      vaAmount - bestAmount,
  };
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  calculateVaDiscount,
  isDiscountCurrentlyValid,
  discountAppliesToProduct,
  getCouponByCode,
  getCustomerDiscount,
  getBestSeasonalDiscount,
  getBestDiscountForProduct,
};