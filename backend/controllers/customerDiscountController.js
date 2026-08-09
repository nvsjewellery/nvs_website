const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

const {
  getCouponByCode,
  isDiscountCurrentlyValid,
} = require("../services/discountService");

/* =========================================================
   GET AVAILABLE DISCOUNTS
   =========================================================

   GET /api/discounts/available

   Returns discounts currently available to the
   logged-in customer.

   SEASONAL:
   - Available to everyone.
   - Includes CATEGORY and PRODUCT discounts.

   CUSTOMER:
   - Only returned when assigned to the logged-in user.

   COUPON:
   - NOT returned here.
   - Customer must enter the coupon code manually.
========================================================= */

const getAvailableDiscounts = asyncHandler(
  async (req, res) => {
    const userId = req.user.id;

    const now = new Date();

    const discounts =
      await prisma.discount.findMany({
        where: {
          isActive: true,

          AND: [
            /* -----------------------------------------
               START DATE
            ----------------------------------------- */

            {
              OR: [
                {
                  startDate: null,
                },
                {
                  startDate: {
                    lte: now,
                  },
                },
              ],
            },

            /* -----------------------------------------
               END DATE
            ----------------------------------------- */

            {
              OR: [
                {
                  endDate: null,
                },
                {
                  endDate: {
                    gte: now,
                  },
                },
              ],
            },

            /* -----------------------------------------
               CUSTOMER VISIBILITY
            -----------------------------------------

               SEASONAL:
                 Everyone can see.

               CUSTOMER:
                 Only assigned customer.

               COUPON:
                 Not automatically returned.
            ----------------------------------------- */

            {
              OR: [
                {
                  type: "SEASONAL",
                },
                {
                  type: "CUSTOMER",
                  userId,
                },
              ],
            },
          ],
        },

        /* ---------------------------------------------
           RETURN ONLY DATA CUSTOMER NEEDS
        --------------------------------------------- */

        select: {
          id: true,

          name: true,

          type: true,

          target: true,

          kind: true,

          value: true,

          /* -----------------------------------------
             TARGET INFORMATION
          ----------------------------------------- */

          metal: true,

          category: true,

          /* -----------------------------------------
             PRODUCT-SPECIFIC DISCOUNT

             Example:

             target = PRODUCT

             products = [
               { id: "product123" }
             ]
          ----------------------------------------- */

          products: {
            select: {
              id: true,
            },
          },

          /* -----------------------------------------
             CUSTOMER-SPECIFIC DISCOUNT

             We only expose the ID because the
             discount was already filtered using it.
          ----------------------------------------- */

          userId: true,

          /* -----------------------------------------
             VALIDITY
          ----------------------------------------- */

          startDate: true,

          endDate: true,

          /* -----------------------------------------
             USAGE
          ----------------------------------------- */

          usageLimit: true,

          usageCount: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    /* ---------------------------------------------
       FINAL VALIDITY CHECK
    --------------------------------------------- */

    const validDiscounts =
      discounts.filter(
        isDiscountCurrentlyValid
      );

    /* ---------------------------------------------
       RESPONSE
    --------------------------------------------- */

    res.status(200).json({
      success: true,
      discounts: validDiscounts,
    });
  }
);

/* =========================================================
   VALIDATE COUPON
   =========================================================

   POST /api/discounts/validate-coupon

   Body:

   {
     "code": "NVS10"
   }

   Coupon is NOT automatically applied.

   Customer explicitly enters the code.

   Backend checks:

   1. Code exists
   2. Type is COUPON
   3. Active
   4. Start date
   5. End date
   6. Usage limit
========================================================= */

const validateCoupon = asyncHandler(
  async (req, res) => {
    const { code } = req.body;

    /* ---------------------------------------------
       REQUIRED CODE
    --------------------------------------------- */

    if (
      !code ||
      !String(code).trim()
    ) {
      res.status(400);

      throw new Error(
        "Please enter a coupon code"
      );
    }

    /* ---------------------------------------------
       FIND COUPON
    --------------------------------------------- */

    const discount =
      await getCouponByCode(code);

    /* ---------------------------------------------
       INVALID / EXPIRED COUPON
    --------------------------------------------- */

    if (!discount) {
      res.status(404);

      throw new Error(
        "Invalid or expired coupon code"
      );
    }

    /* ---------------------------------------------
       RESPONSE
    --------------------------------------------- */

    res.status(200).json({
      success: true,

      coupon: {
        id: discount.id,

        name: discount.name,

        code: discount.code,

        type: discount.type,

        target: discount.target,

        kind: discount.kind,

        value: discount.value,

        metal: discount.metal,

        category: discount.category,

        /* -----------------------------------------
           PRODUCT TARGET

           This is important for product-specific
           coupons.

           Example:

           products: [
             { id: "abc123" }
           ]
        ----------------------------------------- */

        products:
          discount.products?.map(
            (product) => ({
              id: product.id,
            })
          ) ?? [],

        /* -----------------------------------------
           VALIDITY
        ----------------------------------------- */

        startDate:
          discount.startDate,

        endDate:
          discount.endDate,

        /* -----------------------------------------
           USAGE
        ----------------------------------------- */

        usageLimit:
          discount.usageLimit,

        usageCount:
          discount.usageCount,
      },
    });
  }
);

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getAvailableDiscounts,
  validateCoupon,
};