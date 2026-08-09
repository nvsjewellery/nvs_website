import {
  createFileRoute,
  Link,
  notFound,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Heart,
  Minus,
  Plus,
  Tag,
} from "lucide-react";

import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";

import { metalSlug } from "@/lib/products";

import {
  productsApi,
  discountsApi,
  type Discount,
} from "@/lib/api";

import {
  actions,
  formatINR,
  useStore,
} from "@/lib/store";

/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute(
  "/product/$id"
)({
  component: ProductPage,

  loader: async ({ params }) => {
    try {
      const p =
        await productsApi.getById(
          params.id
        );

      if (!p) {
        throw notFound();
      }

      return p;
    } catch {
      throw notFound();
    }
  },
});

/* =========================================================
   PRODUCT PAGE
========================================================= */

function ProductPage() {
  const rawData =
    Route.useLoaderData() as any;

  const p =
    rawData?.product ||
    rawData ||
    {};

  const [qty, setQty] =
    useState(1);

  const [
    selectedImg,
    setSelectedImg,
  ] = useState<string | null>(
    null
  );

  const [
    discount,
    setDiscount,
  ] = useState<Discount | null>(
    null
  );

  const wishlist =
    useStore((s) => s.wishlist);

  const saved =
    wishlist.includes(p?.id);

  /* =======================================================
     RESET IMAGE SELECTION WHEN PRODUCT CHANGES
  ======================================================= */

  useEffect(() => {
    setSelectedImg(null);
    setQty(1);
  }, [p.id]);

  /* =======================================================
     PRODUCT IMAGES
  ======================================================= */

  const productImages =
    useMemo<string[]>(() => {
      const images: string[] = [];

      /*
       * NEW PRODUCT GALLERY
       *
       * Product.images is the new
       * gallery field from Prisma.
       */
      if (
        Array.isArray(
          p?.images
        )
      ) {
        for (const image of p.images) {
          if (
            typeof image ===
              "string" &&
            image.trim()
          ) {
            images.push(
              image.trim()
            );
          }
        }
      }

      /*
       * BACKWARD COMPATIBILITY
       *
       * Older products may still
       * have only the primary image.
       */
      if (
        images.length === 0 &&
        typeof p?.image ===
          "string" &&
        p.image.trim()
      ) {
        images.push(
          p.image.trim()
        );
      }

      /*
       * Remove duplicate URLs.
       */
      return Array.from(
        new Set(images)
      );
    }, [p]);

  /*
   * Make sure selectedImg belongs
   * to the current product.
   */
  const currentImage =
    selectedImg &&
    productImages.includes(
      selectedImg
    )
      ? selectedImg
      : productImages[0] || "";

  /* =======================================================
     BASIC PRODUCT DATA
  ======================================================= */

  const weightVal =
    Number(
      p?.weight ??
        p?.grossWeight ??
        0
    );

  /*
   * Product price is calculated
   * by the backend and returned
   * as `price`.
   */
  const total =
    Number(
      p?.price ?? 0
    );

  const metalValue =
    Number(
      p?.metalValue ?? 0
    );

  const making =
    Number(
      p?.making ??
        p?.va ??
        0
    );

  const gst =
    Number(
      p?.gst ?? 0
    );

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const rawDesc =
    String(
      p?.description ||
        p?.desc ||
        p?.details ||
        p?.summary ||
        ""
    ).trim();

  /* =======================================================
     LOAD SEASONAL PRODUCT DISCOUNT
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadDiscount() {
      try {
        const discounts =
          await discountsApi.getAvailable();

        if (cancelled) {
          return;
        }

        /*
         * Only SEASONAL discounts
         * are displayed directly
         * on the product page.
         *
         * CUSTOMER discounts:
         * handled at cart level.
         *
         * COUPONS:
         * handled at cart level.
         */

        const applicable =
          discounts.filter(
            (item) => {
              /* -------------------------------------------
                 ONLY SEASONAL
              ------------------------------------------- */

              if (
                item.type !==
                "SEASONAL"
              ) {
                return false;
              }

              /* -------------------------------------------
                 METAL RESTRICTION
              ------------------------------------------- */

              if (
                item.metal &&
                item.metal !==
                  p.metal
              ) {
                return false;
              }

              /* -------------------------------------------
                 PRODUCT-SPECIFIC DISCOUNT
              ------------------------------------------- */

              if (
                item.target ===
                "PRODUCT"
              ) {
                if (
                  !Array.isArray(
                    item.products
                  )
                ) {
                  return false;
                }

                return item.products.some(
                  (
                    discountProduct
                  ) =>
                    discountProduct.id ===
                    p.id
                );
              }

              /* -------------------------------------------
                 CATEGORY DISCOUNT
              ------------------------------------------- */

              if (
                item.target ===
                "CATEGORY"
              ) {
                const productCategory =
                  String(
                    p.category ??
                      p.sub ??
                      ""
                  )
                    .trim()
                    .toLowerCase();

                const discountCategory =
                  String(
                    item.category ??
                      ""
                  )
                    .trim()
                    .toLowerCase();

                if (
                  !productCategory ||
                  !discountCategory
                ) {
                  return false;
                }

                return (
                  productCategory ===
                  discountCategory
                );
              }

              /*
               * CART and CUSTOMER
               * discounts are not
               * displayed here.
               */

              return false;
            }
          );

        /* -----------------------------------------------
           NO APPLICABLE DISCOUNT
        ----------------------------------------------- */

        if (
          applicable.length === 0
        ) {
          setDiscount(null);
          return;
        }

        /* -----------------------------------------------
           FIND STRONGEST DISCOUNT
        ----------------------------------------------- */

        const best =
          applicable.reduce(
            (
              current,
              next
            ) => {
              if (!current) {
                return next;
              }

              return next.value >
                current.value
                ? next
                : current;
            },
            null as
              | Discount
              | null
          );

        setDiscount(best);
      } catch (error) {
        /*
         * Discount loading should
         * never break the product page.
         */

        console.error(
          "Failed to load product discount:",
          error
        );

        if (!cancelled) {
          setDiscount(null);
        }
      }
    }

    loadDiscount();

    return () => {
      cancelled = true;
    };
  }, [
    p.id,
    p.metal,
    p.category,
    p.sub,
  ]);

  /* =======================================================
     DISCOUNT LABEL
  ======================================================= */

  const discountLabel =
    discount
      ? discount.kind ===
        "percent"
        ? `${discount.value}% OFF`
        : `₹${discount.value} OFF`
      : null;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Layout>

      {/* =================================================
          BREADCRUMB
      ================================================= */}

      <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-[color:var(--muted-foreground)]">

        <Link
          to="/"
          className="cursor-pointer hover:text-[color:var(--gold-dark)] transition-colors"
        >
          Home
        </Link>

        <span> / </span>

        <Link
          to={
            `/${metalSlug(
              p.metal ||
                "Gold"
            )}` as string
          }
          className="cursor-pointer hover:text-[color:var(--gold-dark)] transition-colors"
        >
          {p.metal ||
            "Gold"}
        </Link>

        <span> / </span>

        <span className="text-[color:var(--espresso)]">
          {p.name}
        </span>

      </div>

      {/* =================================================
          PRODUCT SECTION
      ================================================= */}

      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* =================================================
            PRODUCT IMAGES
        ================================================= */}

        <div>

          {/* MAIN IMAGE */}

          <div className="aspect-square bg-[color:var(--panel)] rounded-2xl overflow-hidden border border-[color:var(--border)]">

            {currentImage ? (
              <img
                src={currentImage}
                alt={
                  p.name ||
                  "Product image"
                }
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-sm text-[color:var(--muted-foreground)]">
                No image available
              </div>
            )}

          </div>

          {/* THUMBNAILS */}

          {productImages.length >
            1 && (
            <div className="grid grid-cols-4 gap-3 mt-3">

              {productImages.map(
                (
                  imgUrl,
                  i
                ) => (
                  <button
                    key={`${imgUrl}-${i}`}
                    type="button"
                    onClick={() =>
                      setSelectedImg(
                        imgUrl
                      )
                    }
                    className={`aspect-square bg-[color:var(--panel)] rounded-lg overflow-hidden border cursor-pointer transition-colors ${
                      currentImage ===
                      imgUrl
                        ? "border-[color:var(--gold)] ring-1 ring-[color:var(--gold)]"
                        : "border-[color:var(--border)] hover:border-[color:var(--gold)]"
                    }`}
                    aria-label={`View product image ${
                      i + 1
                    }`}
                  >

                    <img
                      src={imgUrl}
                      alt={`${p.name || "Product"} image ${
                        i + 1
                      }`}
                      className="w-full h-full object-cover"
                    />

                  </button>
                )
              )}

            </div>
          )}

        </div>

        {/* =================================================
            PRODUCT DETAILS
        ================================================= */}

        <div>

          {/* METAL + CATEGORY */}

          <p className="label-caps text-[color:var(--gold-dark)] text-xs">
            {p.metal} ·{" "}
            {p.sub ||
              p.category}
          </p>

          {/* PRODUCT NAME */}

          <h1 className="font-serif text-4xl md:text-5xl mt-2 text-[color:var(--espresso)]">
            {p.name}
          </h1>

          {/* =================================================
              SEASONAL DISCOUNT
          ================================================= */}

          {discountLabel && (
            <div className="mt-4">

              <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--gold)] text-white px-3 py-1.5 text-xs font-semibold shadow-sm">

                <Tag className="w-3.5 h-3.5" />

                {discountLabel}

              </div>

              <p className="text-xs text-green-700 font-medium mt-2">
                {discount?.kind ===
                "percent"
                  ? `${discount.value}% off making charges`
                  : `₹${discount?.value} off making charges`}
              </p>

            </div>
          )}

          {/* =================================================
              PURITY + WEIGHT
          ================================================= */}

          <div className="flex items-center gap-3 mt-4">

            <span className="pill-gold-outline !py-1 !px-3 text-xs">
              {p.purity}
            </span>

            <span className="text-sm text-[color:var(--muted-foreground)]">
              {weightVal} g
            </span>

          </div>

          {/* =================================================
              PRICE
          ================================================= */}

          <div className="mt-6">

            <div className="text-4xl font-serif text-[color:var(--gold-dark)] font-bold">
              {formatINR(
                total
              )}
            </div>

            <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
              Inclusive of GST ·
              Includes making
              charges
            </p>

          </div>

          {/* =================================================
              PRICE BREAKDOWN
          ================================================= */}

          <div
            style={{
              backgroundColor:
                "var(--panel)",
            }}
            className="rounded-2xl p-5 mt-6"
          >

            <p className="label-caps text-[color:var(--gold-dark)] text-[10px] mb-3">
              Live Price Breakdown
            </p>

            <BreakdownRow
              l={`Metal value (${weightVal}g @ ${p.purity})`}
              v={
                metalValue
              }
            />

            <BreakdownRow
              l="Making charges"
              v={making}
            />

            <BreakdownRow
              l="GST (3%)"
              v={gst}
            />

            <div className="h-px bg-[color:var(--gold)]/30 my-3" />

            <BreakdownRow
              l="Total"
              v={total}
              bold
            />

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex items-center gap-3 mt-6 flex-wrap">

            {/* QUANTITY */}

            <div className="flex items-center border border-[color:var(--border)] rounded-full">

              <button
                type="button"
                onClick={() =>
                  setQty(
                    (
                      current
                    ) =>
                      Math.max(
                        1,
                        current -
                          1
                      )
                  )
                }
                className="p-2.5 cursor-pointer hover:bg-[color:var(--panel)] rounded-full transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-8 text-center font-semibold">
                {qty}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQty(
                    (
                      current
                    ) =>
                      current +
                      1
                  )
                }
                className="p-2.5 cursor-pointer hover:bg-[color:var(--panel)] rounded-full transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>

            </div>

            {/* ADD TO CART */}

            <button
              type="button"
              onClick={() =>
                actions.addToCart(
                  p.id,
                  qty
                )
              }
              className="pill-gold cursor-pointer"
            >
              Add to Cart
            </button>

            {/* BUY NOW */}

            <Link
              to="/checkout"
              onClick={() =>
                actions.addToCart(
                  p.id,
                  qty
                )
              }
              className="pill-gold-outline cursor-pointer"
            >
              Buy Now
            </Link>

            {/* WISHLIST */}

            <button
              type="button"
              onClick={() =>
                actions.toggleWishlist(
                  p.id
                )
              }
              className="w-11 h-11 rounded-full border border-[color:var(--gold)] grid place-items-center cursor-pointer hover:bg-[color:var(--panel)] transition-colors"
              aria-label={
                saved
                  ? "Remove from wishlist"
                  : "Add to wishlist"
              }
            >

              <Heart
                className={`w-4 h-4 ${
                  saved
                    ? "fill-[color:var(--gold)] text-[color:var(--gold)]"
                    : "text-[color:var(--gold-dark)]"
                }`}
              />

            </button>

          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="mt-8 pt-6 border-t border-[color:var(--border)]">

            <p className="text-sm text-[color:var(--muted-foreground)] leading-relaxed whitespace-pre-line">

              {rawDesc.length >
              0
                ? rawDesc
                : `${p.name} — crafted in ${
                    p.purity
                  } ${p.metal?.toLowerCase()} weighing ${weightVal}g. Traditional hand-finishing with heritage techniques.`}

            </p>

          </div>

        </div>

      </section>

      <OrnamentalDivider className="mt-16" />

    </Layout>
  );
}

/* =========================================================
   PRICE BREAKDOWN ROW
========================================================= */

function BreakdownRow({
  l,
  v,
  bold,
}: {
  l: string;
  v: number;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between text-sm py-1 ${
        bold
          ? "font-bold text-[color:var(--espresso)] text-base"
          : "text-[color:var(--muted-foreground)]"
      }`}
    >

      <span>
        {l}
      </span>

      <span>
        {formatINR(v)}
      </span>

    </div>
  );
}