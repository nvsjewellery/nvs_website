const prisma = require("../lib/prisma");

const {
  createOrder: createShiprocketOrder,
  assignAwb,
  trackOrder,
} = require("../services/shiprocketService");

const {
  createRazorpayOrder,
  verifyPaymentSignature,
} = require("../services/razorpayService");

const {
  computeProductPricing,
} = require("../utils/pricing");

const {
  getCouponByCode,
  getCustomerDiscount,
  getBestSeasonalDiscount,
  calculateVaDiscount,
  discountAppliesToProduct,
} = require("../services/discountService");

const PACKAGING_BUFFER_GRAMS = 50;

/*
|--------------------------------------------------------------------------
| SHIPPING WEIGHT
|--------------------------------------------------------------------------
*/

function calculateShippingWeight(items) {
  const totalItemGrams = items.reduce(
    (sum, item) =>
      sum +
      Number(item.product.grossWeight || 5) *
        Number(item.qty || 0),
    0
  );

  return Math.max(
    (totalItemGrams + PACKAGING_BUFFER_GRAMS) / 1000,
    0.1
  );
}

/*
|--------------------------------------------------------------------------
| GET ACTUAL PRODUCT VA / MAKING CHARGE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| product.va = percentage
|
| Example:
|
| product.va = 10
|
| means:
|
| 10% making charge
|
| We MUST NOT use product.va as a rupee amount.
|
| pricing.making = actual ₹ making charge.
|
|--------------------------------------------------------------------------
*/

function getProductVa(product, pricing) {
  return Number(
    pricing?.making ??
      product?.making ??
      0
  );
}

/*
|--------------------------------------------------------------------------
| CALCULATE PRODUCT-LEVEL DISCOUNT
|--------------------------------------------------------------------------
|
| Handles:
|
| - Seasonal PRODUCT discount
| - Seasonal CATEGORY discount
| - Product/category COUPON
|
| CART coupons are handled separately.
|
| CUSTOMER discounts are handled separately
| at cart level.
|
|--------------------------------------------------------------------------
*/

async function calculateProductDiscount(
  product,
  coupon
) {
  const candidates = [];

  /*
  |--------------------------------------------------------------------------
  | COUPON
  |--------------------------------------------------------------------------
  */

  if (coupon && coupon.target !== "CART") {
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
    await getBestSeasonalDiscount(product);

  if (seasonalDiscount) {
    candidates.push(seasonalDiscount);
  }

  /*
  |--------------------------------------------------------------------------
  | NO DISCOUNT
  |--------------------------------------------------------------------------
  */

  if (candidates.length === 0) {
    return {
      discount: null,
      discountAmount: 0,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | GET ACTUAL VA
  |--------------------------------------------------------------------------
  */

  const pricing =
    await computeProductPricing(product);

  const vaAmount =
    getProductVa(
      product,
      pricing
    );

  /*
  |--------------------------------------------------------------------------
  | STRONGEST PRODUCT-LEVEL DISCOUNT
  |--------------------------------------------------------------------------
  |
  | If both a coupon and seasonal discount
  | apply to the same product, only the stronger
  | one is used.
  |
  |--------------------------------------------------------------------------
  */

  let bestDiscount = null;
  let bestAmount = 0;

  for (const discount of candidates) {
    const amount =
      calculateVaDiscount(
        vaAmount,
        discount.kind,
        discount.value
      );

    if (amount > bestAmount) {
      bestAmount = amount;
      bestDiscount = discount;
    }
  }

  return {
    discount: bestDiscount,
    discountAmount: bestAmount,
  };
}

/*
|--------------------------------------------------------------------------
| CALCULATE COMPLETE CART
|--------------------------------------------------------------------------
|
| Backend is the FINAL source of truth.
|
| Frontend prices/discounts are never trusted.
|
|--------------------------------------------------------------------------
*/

async function calculateCartTotal(
  userId,
  couponCode = null
) {
  /*
  |--------------------------------------------------------------------------
  | GET CART
  |--------------------------------------------------------------------------
  */

  const cartItems =
    await prisma.cart.findMany({
      where: {
        userId,
      },

      include: {
        product: true,
      },
    });

  if (cartItems.length === 0) {
    return {
      cartItems: [],
      calculatedItems: [],
      subTotal: 0,
      totalDiscount: 0,
      total: 0,
      cartVaTotal: 0,
      customerDiscount: null,
      customerDiscountAmount: 0,
      coupon: null,
      cartCouponAmount: 0,
      productDiscountTotal: 0,
      productDiscounts: [],
    };
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATE COUPON
  |--------------------------------------------------------------------------
  */

  let coupon = null;

  if (
    couponCode &&
    String(couponCode).trim()
  ) {
    coupon =
      await getCouponByCode(couponCode);

    if (!coupon) {
      throw new Error(
        "Invalid or expired coupon code"
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | GET CUSTOMER DISCOUNT
  |--------------------------------------------------------------------------
  */

  const customerDiscount =
    await getCustomerDiscount(userId);

  /*
  |--------------------------------------------------------------------------
  | INITIAL VALUES
  |--------------------------------------------------------------------------
  */

  let subTotal = 0;
  let cartVaTotal = 0;
  let productDiscountTotal = 0;

  const calculatedItems = [];
  const productDiscounts = [];

  /*
  |--------------------------------------------------------------------------
  | CALCULATE EVERY PRODUCT
  |--------------------------------------------------------------------------
  */

  for (const item of cartItems) {
    const pricing =
      await computeProductPricing(
        item.product
      );

    /*
     * Original product price including GST.
     */

    const itemPrice = Number(
      pricing?.total || 0
    );

    /*
     * Actual ₹ making charge.
     *
     * NEVER use product.va directly.
     */

    const vaAmount =
      getProductVa(
        item.product,
        pricing
      );

    const qty =
      Number(item.qty || 0);

    /*
     |--------------------------------------------------------------------------
     | ORIGINAL SUBTOTAL
     |--------------------------------------------------------------------------
     */

    const itemSubTotal =
      itemPrice * qty;

    subTotal += itemSubTotal;

    /*
     |--------------------------------------------------------------------------
     | CART VA
     |--------------------------------------------------------------------------
     */

    const itemVaTotal =
      vaAmount * qty;

    cartVaTotal += itemVaTotal;

    /*
     |--------------------------------------------------------------------------
     | PRODUCT-LEVEL DISCOUNT
     |--------------------------------------------------------------------------
     */

    const productDiscount =
      await calculateProductDiscount(
        item.product,
        coupon
      );

    const productDiscountPerUnit =
      Number(
        productDiscount.discountAmount || 0
      );

    const productDiscountTotalForItem =
      productDiscountPerUnit * qty;

    productDiscountTotal +=
      productDiscountTotalForItem;

    /*
     |--------------------------------------------------------------------------
     | STORE CALCULATION
     |--------------------------------------------------------------------------
     */

    calculatedItems.push({
      item,
      pricing,
      vaAmount,
      itemPrice,
      itemSubTotal,
      itemVaTotal,

      productDiscount:
        productDiscount.discount,

      productDiscountPerUnit,

      productDiscountTotal:
        productDiscountTotalForItem,
    });

    /*
     |--------------------------------------------------------------------------
     | DISCOUNT INFORMATION
     |--------------------------------------------------------------------------
     */

    if (
      productDiscount.discount &&
      productDiscountTotalForItem > 0
    ) {
      productDiscounts.push({
        productId: item.productId,

        discount:
          productDiscount.discount,

        discountAmount:
          productDiscountTotalForItem,
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER DISCOUNT
  |--------------------------------------------------------------------------
  |
  | Customer discount applies against TOTAL CART VA.
  |
  |--------------------------------------------------------------------------
  */

  let customerDiscountAmount = 0;

  if (customerDiscount) {
    customerDiscountAmount =
      calculateVaDiscount(
        cartVaTotal,
        customerDiscount.kind,
        customerDiscount.value
      );
  }

  /*
  |--------------------------------------------------------------------------
  | CART COUPON
  |--------------------------------------------------------------------------
  |
  | CART coupon applies ONCE against the
  | total cart VA.
  |
  |--------------------------------------------------------------------------
  */

  let cartCouponAmount = 0;

  if (
    coupon &&
    coupon.target === "CART"
  ) {
    cartCouponAmount =
      calculateVaDiscount(
        cartVaTotal,
        coupon.kind,
        coupon.value
      );
  }

  /*
  |--------------------------------------------------------------------------
  | TOTAL DISCOUNT
  |--------------------------------------------------------------------------
  |
  | Product-level discounts:
  |
  |   product/category coupon
  |   seasonal product/category
  |
  | Cart-level discounts:
  |
  |   customer discount
  |   cart coupon
  |
  |--------------------------------------------------------------------------
  */

  const requestedTotalDiscount =
    productDiscountTotal +
    customerDiscountAmount +
    cartCouponAmount;

  /*
  |--------------------------------------------------------------------------
  | SAFETY LIMIT
  |--------------------------------------------------------------------------
  |
  | Discounts can NEVER exceed the total VA.
  |
  |--------------------------------------------------------------------------
  */

  const totalDiscount =
    Math.min(
      Math.max(
        requestedTotalDiscount,
        0
      ),
      cartVaTotal
    );

  /*
  |--------------------------------------------------------------------------
  | FINAL TOTAL
  |--------------------------------------------------------------------------
  */

  const total =
    Math.max(
      subTotal - totalDiscount,
      0
    );

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {
    cartItems,

    calculatedItems,

    subTotal,

    totalDiscount,

    total,

    cartVaTotal,

    customerDiscount,

    customerDiscountAmount,

    coupon,

    cartCouponAmount,

    productDiscountTotal,

    productDiscounts,
  };
}

/*
|--------------------------------------------------------------------------
| ALLOCATE CART-LEVEL DISCOUNTS TO ORDER ITEMS
|--------------------------------------------------------------------------
|
| Product-level discounts have already been applied
| to individual items.
|
| Customer/cart discounts are cart-level.
|
| To keep:
|
| SUM(order.items.sellingPrice * qty)
|
| consistent with:
|
| order.total
|
| we distribute the remaining cart-level discount
| proportionally across the items based on their
| remaining VA.
|
|--------------------------------------------------------------------------
*/

function buildOrderItems(
  calculatedItems,
  cartLevelDiscount
) {
  const totalRemainingVa =
    calculatedItems.reduce(
      (sum, calculatedItem) => {
        const remainingVaPerUnit =
          Math.max(
            Number(
              calculatedItem.vaAmount || 0
            ) -
              Number(
                calculatedItem
                  .productDiscountPerUnit ||
                  0
              ),
            0
          );

        return (
          sum +
          remainingVaPerUnit *
            Number(
              calculatedItem.item.qty || 0
            )
        );
      },
      0
    );

  let allocatedCartDiscount = 0;

  const orderItemsData =
    calculatedItems.map(
      (calculatedItem) => {
        const {
          item,
          itemPrice,
          productDiscountPerUnit,
          vaAmount,
        } = calculatedItem;

        const qty =
          Number(item.qty || 0);

        /*
         * Price after product-level discount.
         */

        const priceAfterProductDiscount =
          Math.max(
            Number(itemPrice || 0) -
              Number(
                productDiscountPerUnit || 0
              ),
            0
          );

        /*
         * Remaining VA after product-level discount.
         */

        const remainingVaPerUnit =
          Math.max(
            Number(vaAmount || 0) -
              Number(
                productDiscountPerUnit || 0
              ),
            0
          );

        const remainingVaTotal =
          remainingVaPerUnit * qty;

        /*
         * Allocate cart-level discount
         * proportionally.
         */

        let cartDiscountForItem = 0;

        if (
          cartLevelDiscount > 0 &&
          totalRemainingVa > 0
        ) {
          cartDiscountForItem =
            (cartLevelDiscount *
              remainingVaTotal) /
            totalRemainingVa;
        }

        /*
         * Prevent floating-point issues.
         */

        cartDiscountForItem =
          Math.min(
            Math.max(
              cartDiscountForItem,
              0
            ),
            remainingVaTotal
          );

        allocatedCartDiscount +=
          cartDiscountForItem;

        /*
         * Convert item-level cart discount
         * to per-unit discount.
         */

        const cartDiscountPerUnit =
          qty > 0
            ? cartDiscountForItem / qty
            : 0;

        /*
         * Final selling price.
         */

        const finalSellingPrice =
          Math.max(
            priceAfterProductDiscount -
              cartDiscountPerUnit,
            0
          );

        return {
          productId:
            item.productId,

          name:
            item.product.name,

          sku:
            item.product.sku,

          qty,

          sellingPrice:
            Math.round(
              finalSellingPrice
            ),
        };
      }
    );

  /*
  |--------------------------------------------------------------------------
  | ROUNDING RECONCILIATION
  |--------------------------------------------------------------------------
  |
  | Individual item prices are rounded.
  |
  | The final order total is calculated separately.
  |
  | A tiny rounding difference can therefore occur.
  |
  | We do not mutate the calculation here because
  | order.total remains the backend source of truth.
  |
  |--------------------------------------------------------------------------
  */

  return {
    orderItemsData,
    allocatedCartDiscount,
  };
}

/*
|--------------------------------------------------------------------------
| STEP 1
|
| INITIATE RAZORPAY PAYMENT
|--------------------------------------------------------------------------
*/

async function initiatePayment(
  req,
  res
) {
  try {
    const userId =
      req.user.id;

    const {
      couponCode,
    } = req.body || {};

    /*
     |--------------------------------------------------------------------------
     | CALCULATE REAL CART TOTAL
     |--------------------------------------------------------------------------
     */

    const cartData =
      await calculateCartTotal(
        userId,
        couponCode
      );

    if (
      !cartData.cartItems.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cart is empty",
      });
    }

    const {
      subTotal,
      total,
    } = cartData;

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid cart total",
      });
    }

    /*
     |--------------------------------------------------------------------------
     | CREATE RAZORPAY ORDER
     |--------------------------------------------------------------------------
     */

    const rzpOrder =
      await createRazorpayOrder(
        total
      );

    res.json({
      success: true,

      razorpayOrder:
        rzpOrder,

      subTotal,

      discount:
        cartData.totalDiscount,

      total,

      cartVaTotal:
        cartData.cartVaTotal,

      coupon:
        cartData.coupon
          ? {
              id:
                cartData.coupon.id,

              code:
                cartData.coupon.code,

              name:
                cartData.coupon.name,
            }
          : null,
    });
  } catch (err) {
    console.error(
      "Initiate payment error:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to initiate payment",
    });
  }
}

/*
|--------------------------------------------------------------------------
| STEP 2
|
| VERIFY PAYMENT + CREATE ORDER
|--------------------------------------------------------------------------
*/

async function verifyAndPlaceOrder(
  req,
  res
) {
  try {
    const userId =
      req.user.id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,

      addressId,

      customerLastName,

      phone,

      couponCode,
    } = req.body || {};

    /*
     |--------------------------------------------------------------------------
     | BASIC PAYMENT DATA VALIDATION
     |--------------------------------------------------------------------------
     */

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incomplete payment verification data",
      });
    }

    /*
     |--------------------------------------------------------------------------
     | 1. VERIFY RAZORPAY SIGNATURE
     |--------------------------------------------------------------------------
     */

    const isValid =
      verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message:
          "Payment verification failed",
      });
    }

    /*
     |--------------------------------------------------------------------------
     | 2. GET USER + CART + ADDRESS
     |--------------------------------------------------------------------------
     */

    const [
      user,
      cartData,
      address,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: userId,
        },
      }),

      calculateCartTotal(
        userId,
        couponCode
      ),

      prisma.address.findUnique({
        where: {
          id: addressId,
        },
      }),
    ]);

    /*
     |--------------------------------------------------------------------------
     | USER VALIDATION
     |--------------------------------------------------------------------------
     */

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    /*
     |--------------------------------------------------------------------------
     | CART VALIDATION
     |--------------------------------------------------------------------------
     */

    if (
      !cartData.cartItems.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cart is empty",
      });
    }

    /*
     |--------------------------------------------------------------------------
     | ADDRESS VALIDATION
     |--------------------------------------------------------------------------
     */

    if (
      !address ||
      address.userId !== userId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid address",
      });
    }

    /*
     |--------------------------------------------------------------------------
     | FINAL PRICING
     |--------------------------------------------------------------------------
     */

    const {
      subTotal,
      total,
      totalDiscount,
      calculatedItems,
      coupon,
      customerDiscountAmount,
      cartCouponAmount,
      productDiscountTotal,
    } = cartData;

    /*
     |--------------------------------------------------------------------------
     | SHIPPING WEIGHT
     |--------------------------------------------------------------------------
     */

    const weight =
      calculateShippingWeight(
        cartData.cartItems
      );

    /*
     |--------------------------------------------------------------------------
     | CART-LEVEL DISCOUNT
     |--------------------------------------------------------------------------
     |
     | Product-level discount has already been
     | deducted from each product.
     |
     | Remaining discounts:
     |
     | Customer discount
     | +
     | CART coupon
     |
     |--------------------------------------------------------------------------
     */

    const cartLevelDiscount =
      Math.min(
        Math.max(
          Number(
            customerDiscountAmount || 0
          ) +
            Number(
              cartCouponAmount || 0
            ),
          0
        ),
        Math.max(
          Number(
            cartData.cartVaTotal || 0
          ) -
            Number(
              productDiscountTotal || 0
            ),
          0
        )
      );

    /*
     |--------------------------------------------------------------------------
     | BUILD FINAL ORDER ITEMS
     |--------------------------------------------------------------------------
     */

    const {
      orderItemsData,
    } = buildOrderItems(
      calculatedItems,
      cartLevelDiscount
    );

    /*
     |--------------------------------------------------------------------------
     | 3. CREATE ORDER
     |--------------------------------------------------------------------------
     */

    const order =
      await prisma.order.create({
        data: {
          userId,

          customerName:
            user.name,

          customerLastName:
            customerLastName ||
            "NA",

          customerEmail:
            user.email,

          customerPhone:
            phone ||
            user.phone ||
            "",

          address:
            address.addressLine,

          city:
            address.city,

          state:
            address.state ||
            "Andhra Pradesh",

          pincode:
            address.pincode,

          /*
           * Original amount before discounts.
           */

          subTotal,

          /*
           * Final amount actually paid.
           */

          total,

          paymentMethod:
            "Prepaid",

          paymentStatus:
            "Paid",

          status:
            "Placed",

          razorpayOrderId:
            razorpay_order_id,

          razorpayPaymentId:
            razorpay_payment_id,

          items: {
            create:
              orderItemsData,
          },
        },

        include: {
          items: true,
        },
      });

    /*
     |--------------------------------------------------------------------------
     | 4. SHIPROCKET
     |--------------------------------------------------------------------------
     */

    let shiprocketData = null;
    let awbData = null;

    try {
      shiprocketData =
        await createShiprocketOrder({
          order_id:
            order.id,

          order_date:
            order.createdAt
              .toISOString()
              .slice(0, 16)
              .replace(
                "T",
                " "
              ),

          pickup_location:
            "Primary",

          billing_customer_name:
            order.customerName,

          billing_last_name:
            order.customerLastName,

          billing_address:
            order.address,

          billing_city:
            order.city,

          billing_pincode:
            order.pincode,

          billing_state:
            order.state,

          billing_country:
            "India",

          billing_email:
            order.customerEmail,

          billing_phone:
            order.customerPhone,

          shipping_is_billing:
            true,

          order_items:
            order.items.map(
              (item) => ({
                name:
                  item.name,

                sku:
                  item.sku,

                units:
                  item.qty,

                selling_price:
                  item.sellingPrice,
              })
            ),

          payment_method:
            "Prepaid",

          /*
           * Actual amount charged.
           */

          sub_total:
            order.total,

          length: 15,
          breadth: 10,
          height: 5,

          weight,
        });

      /*
       |--------------------------------------------------------------------------
       | ASSIGN AWB
       |--------------------------------------------------------------------------
       */

      if (
        shiprocketData?.shipment_id
      ) {
        awbData =
          await assignAwb(
            shiprocketData.shipment_id
          );
      }
    } catch (srErr) {
      console.error(
        "Shiprocket step failed:",
        srErr.response?.data ||
          srErr.message
      );

      /*
       * Payment is already successful.
       *
       * Order exists in DB.
       *
       * Shiprocket can be retried later.
       */
    }

    /*
     |--------------------------------------------------------------------------
     | 5. UPDATE ORDER WITH SHIPROCKET DETAILS
     |--------------------------------------------------------------------------
     */

    let updatedOrder = order;

    if (shiprocketData) {
      updatedOrder =
        await prisma.order.update({
          where: {
            id: order.id,
          },

          data: {
            srOrderId:
              shiprocketData.order_id
                ? String(
                    shiprocketData.order_id
                  )
                : null,

            srShipmentId:
              shiprocketData.shipment_id
                ? String(
                    shiprocketData.shipment_id
                  )
                : null,

            srAwbCode:
              awbData?.response
                ?.data
                ?.awb_code ||
              null,

            srCourierName:
              awbData?.response
                ?.data
                ?.courier_name ||
              null,

            status:
              "Confirmed",
          },

          include: {
            items: true,
          },
        });
    }

    /*
     |--------------------------------------------------------------------------
     | 6. INCREMENT COUPON USAGE
     |--------------------------------------------------------------------------
     |
     | Coupon usage is incremented only after
     | the order has been successfully created.
     |
     |--------------------------------------------------------------------------
     */

    if (coupon) {
      const usageUpdate =
        await prisma.discount.updateMany({
          where: {
            id: coupon.id,

            isActive: true,

            OR: [
              {
                usageLimit: null,
              },
              {
                usageCount: {
                  lt: coupon.usageLimit,
                },
              },
            ],
          },

          data: {
            usageCount: {
              increment: 1,
            },
          },
        });

      if (
        usageUpdate.count === 0
      ) {
        console.warn(
          `Coupon usage could not be incremented for ${coupon.code}`
        );
      }
    }

    /*
     |--------------------------------------------------------------------------
     | 7. CLEAR CART
     |--------------------------------------------------------------------------
     */

    await prisma.cart.deleteMany({
      where: {
        userId,
      },
    });

    /*
     |--------------------------------------------------------------------------
     | 8. RESPONSE
     |--------------------------------------------------------------------------
     */

    return res.json({
      success: true,

      order:
        updatedOrder,

      pricing: {
        subTotal,

        discount:
          totalDiscount,

        total,

        cartVaTotal:
          cartData.cartVaTotal,

        productDiscount:
          productDiscountTotal,

        customerDiscount:
          customerDiscountAmount,

        cartCoupon:
          cartCouponAmount,
      },

      coupon: coupon
        ? {
            id:
              coupon.id,

            code:
              coupon.code,

            name:
              coupon.name,
          }
        : null,
    });
  } catch (err) {
    console.error(
      "Verify/place order error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to place order",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL ORDERS FOR LOGGED-IN USER
|--------------------------------------------------------------------------
*/

async function getMyOrders(
  req,
  res
) {
  try {
    const userId =
      req.user.id;

    const orders =
      await prisma.order.findMany({
        where: {
          userId,
        },

        include: {
          items: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error(
      "Get my orders error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch orders",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET SINGLE ORDER
|--------------------------------------------------------------------------
|
| A customer can ONLY access their own order.
|--------------------------------------------------------------------------
*/

async function getOrderById(
  req,
  res
) {
  try {
    const userId =
      req.user.id;

    const {
      orderId,
    } = req.params;

    const order =
      await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
        },

        include: {
          items: true,
        },
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    /*
     |--------------------------------------------------------------------------
     | LIVE SHIPROCKET TRACKING
     |--------------------------------------------------------------------------
     */

    let tracking = null;

    if (order.srAwbCode) {
      try {
        tracking =
          await trackOrder(
            order.srAwbCode
          );
      } catch (trackErr) {
        console.error(
          "Tracking fetch failed:",
          trackErr.response
            ?.data ||
            trackErr.message
        );

        /*
         * Tracking failure must not
         * break order details.
         */
      }
    }

    return res.json({
      success: true,

      order,

      tracking,
    });
  } catch (err) {
    console.error(
      "Get order error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch order",
    });
  }
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  initiatePayment,
  verifyAndPlaceOrder,
  getMyOrders,
  getOrderById,
};