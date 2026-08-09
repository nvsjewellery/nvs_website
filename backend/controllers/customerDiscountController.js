const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

const {
  getCouponByCode,
  isDiscountCurrentlyValid,
} = require("../services/discountService");

/*
|--------------------------------------------------------------------------
| GET AVAILABLE DISCOUNTS
|--------------------------------------------------------------------------
|
| GET /api/discounts/available
|
| Returns discounts currently available to the customer.
|
| SEASONAL:
|   Available to everyone.
|   Includes PRODUCT and CATEGORY discounts.
|
| CUSTOMER:
|   Returned only when assigned to the logged-in customer.
|
| COUPON:
|   NOT returned here.
|   Customer must manually enter the coupon code.
|
|--------------------------------------------------------------------------
*/

const getAvailableDiscounts = asyncHandler(
  async (req, res) => {
    /*
    |--------------------------------------------------------------------------
    | CUSTOMER ID
    |--------------------------------------------------------------------------
    |
    | Seasonal discounts are public.
    |
    | Therefore this endpoint should not crash if req.user
    | is unavailable.
    |
    */

    const userId = req.user?.id || null;

    const now = new Date();

    /*
    |--------------------------------------------------------------------------
    | BUILD DISCOUNT QUERY
    |--------------------------------------------------------------------------
    */

    const discounts =
      await prisma.discount.findMany({
        where: {
          /*
          |--------------------------------------------------------------------------
          | ACTIVE
          |--------------------------------------------------------------------------
          */

          isActive: true,

          /*
          |--------------------------------------------------------------------------
          | DATE VALIDITY
          |--------------------------------------------------------------------------
          */

          AND: [
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

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER VISIBILITY
            |--------------------------------------------------------------------------
            |
            | SEASONAL:
            |   Everyone can receive it.
            |
            | CUSTOMER:
            |   Only the assigned customer.
            |
            | COUPON:
            |   Never automatically returned.
            |
            */

            {
              OR: [
                {
                  type: "SEASONAL",
                },

                /*
                 * Only include CUSTOMER discounts when
                 * a logged-in customer exists.
                 */
                ...(userId
                  ? [
                      {
                        type: "CUSTOMER",
                        userId,
                      },
                    ]
                  : []),
              ],
            },
          ],
        },

        /*
        |--------------------------------------------------------------------------
        | RETURN CUSTOMER-SAFE DATA
        |--------------------------------------------------------------------------
        */

        select: {
          id: true,

          name: true,

          type: true,

          target: true,

          kind: true,

          value: true,

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT FIX
          |--------------------------------------------------------------------------
          |
          | isDiscountCurrentlyValid() checks isActive.
          |
          | Previously this field was missing from SELECT,
          | which caused:
          |
          | discount.isActive === undefined
          |
          | and therefore every discount was considered invalid.
          |
          */

          isActive: true,

          /*
          |--------------------------------------------------------------------------
          | TARGET RESTRICTIONS
          |--------------------------------------------------------------------------
          */

          metal: true,

          category: true,

          /*
          |--------------------------------------------------------------------------
          | PRODUCT TARGET
          |--------------------------------------------------------------------------
          */

          products: {
            select: {
              id: true,
            },
          },

          /*
          |--------------------------------------------------------------------------
          | CUSTOMER TARGET
          |--------------------------------------------------------------------------
          */

          userId: true,

          /*
          |--------------------------------------------------------------------------
          | VALIDITY
          |--------------------------------------------------------------------------
          */

          startDate: true,

          endDate: true,

          /*
          |--------------------------------------------------------------------------
          | USAGE
          |--------------------------------------------------------------------------
          */

          usageLimit: true,

          usageCount: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    /*
    |--------------------------------------------------------------------------
    | FINAL VALIDITY CHECK
    |--------------------------------------------------------------------------
    |
    | Prisma already checks:
    |   - active
    |   - start date
    |   - end date
    |
    | We still run the common validation helper so the
    | customer endpoint follows the same rules as the
    | rest of the backend.
    |
    */

    const validDiscounts =
      discounts.filter(
        isDiscountCurrentlyValid
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      discounts: validDiscounts,
    });
  }
);

/*
|--------------------------------------------------------------------------
| POST /api/discounts/validate-coupon
|--------------------------------------------------------------------------
|
| Customer manually enters a coupon code.
|
| Body:
|
| {
|   "code": "NVS10"
| }
|
| Backend validates:
|
| 1. Code exists
| 2. Type is COUPON
| 3. Active
| 4. Start date
| 5. End date
| 6. Usage limit
|
|--------------------------------------------------------------------------
*/

const validateCoupon = asyncHandler(
  async (req, res) => {
    const { code } = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | REQUIRED CODE
    |--------------------------------------------------------------------------
    */

    if (
      !code ||
      !String(code).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a coupon code",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FIND + VALIDATE COUPON
    |--------------------------------------------------------------------------
    |
    | getCouponByCode() already:
    |
    | - normalizes the code
    | - searches Prisma
    | - checks type === COUPON
    | - checks active status
    | - checks dates
    | - checks usage limit
    |
    */

    const discount =
      await getCouponByCode(code);

    /*
    |--------------------------------------------------------------------------
    | INVALID / EXPIRED COUPON
    |--------------------------------------------------------------------------
    */

    if (!discount) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid or expired coupon code",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | EXTRA SAFETY
    |--------------------------------------------------------------------------
    */

    if (
      discount.type !== "COUPON"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid or expired coupon code",
      });
    }

    if (
      !isDiscountCurrentlyValid(
        discount
      )
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid or expired coupon code",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      coupon: {
        id: discount.id,

        name: discount.name,

        code: discount.code,

        type: discount.type,

        target: discount.target,

        kind: discount.kind,

        value: discount.value,

        /*
        |--------------------------------------------------------------------------
        | TARGET RESTRICTIONS
        |--------------------------------------------------------------------------
        */

        metal: discount.metal,

        category:
          discount.category,

        /*
        |--------------------------------------------------------------------------
        | PRODUCT TARGET
        |--------------------------------------------------------------------------
        */

        products:
          Array.isArray(
            discount.products
          )
            ? discount.products.map(
                (product) => ({
                  id: product.id,
                })
              )
            : [],

        /*
        |--------------------------------------------------------------------------
        | VALIDITY
        |--------------------------------------------------------------------------
        */

        startDate:
          discount.startDate,

        endDate:
          discount.endDate,

        /*
        |--------------------------------------------------------------------------
        | USAGE
        |--------------------------------------------------------------------------
        */

        usageLimit:
          discount.usageLimit,

        usageCount:
          discount.usageCount,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getAvailableDiscounts,
  validateCoupon,
};