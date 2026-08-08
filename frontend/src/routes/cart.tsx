import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { productsApi } from "@/lib/api";
import {
  actions,
  computeBreakdown,
  formatINR,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

// Simple in-memory cache to make page switching instant across views
const productCache: Record<string, any> = {};

function CartPage() {
  const cart = useStore((s) => s.cart);

  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);

  const [productsMap, setProductsMap] =
    useState<Record<string, any>>(productCache);

  const [loading, setLoading] = useState(false);

  const cartKeys = cart
    .map((c: any) => c.productId)
    .join(",");

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

      setLoading(true);

      try {
        const promises = missingIds.map((id: string) =>
          productsApi.getById(id).catch(() => null)
        );

        const results = await Promise.all(promises);

        results.forEach((p) => {
          if (p && p.id) {
            productCache[p.id] = p;
          }
        });

        if (isMounted) {
          setProductsMap({ ...productCache });
        }
      } catch (err) {
        console.error("Failed to fetch cart products:", err);
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

  // Map cart items to fetched product details
  const items = cart
    .map((c: any) => ({
      ...c,
      p: productsMap[c.productId],
    }))
    .filter((c: any) => Boolean(c.p));

  const subtotal = items.reduce((sum: number, item: any) => {
    const weightVal = Number(
      item.p.weight ?? item.p.grossWeight ?? 0
    );

    const breakdown = computeBreakdown(
      weightVal,
      item.p.purity || "22K"
    );

    const itemPrice = breakdown?.total
      ? breakdown.total
      : Number(item.p.price || 0);

    return sum + itemPrice * item.qty;
  }, 0);

  const discount = applied
    ? Math.round(subtotal * 0.1)
    : 0;

  const total = subtotal - discount;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ==================== HEADER ==================== */}

        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">
          Your Cart
        </h1>

        <OrnamentalDivider className="mt-6 mb-8" />

        {/* ==================== CONTENT ==================== */}

        {loading && items.length === 0 ? (
          /* ==================== LOADING ==================== */
          <div className="space-y-4">
            {cart.map((c: any) => (
              <div
                key={c.productId}
                className="h-28 bg-[color:var(--panel)] rounded-2xl animate-pulse border border-[color:var(--border)]"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          /* ==================== EMPTY CART ==================== */
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
          /* ==================== CART ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            {/* ==================== CART ITEMS ==================== */}

            <div className="space-y-4">
              {items.map((item: any) => {
                const weightVal = Number(
                  item.p.weight ??
                    item.p.grossWeight ??
                    0
                );

                const breakdown = computeBreakdown(
                  weightVal,
                  item.p.purity || "22K"
                );

                const itemPrice = breakdown?.total
                  ? breakdown.total
                  : Number(item.p.price || 0);

                return (
                  <div
                    key={item.productId}
                    className="bg-white border border-[color:var(--border)] rounded-2xl p-4 flex gap-4"
                  >
                    {/* Product Image */}
                    <Link
                      to="/product/$id"
                      params={{ id: item.productId }}
                      className="shrink-0 cursor-pointer"
                    >
                      <img
                        src={item.p.image}
                        alt={item.p.name}
                        className="w-24 h-24 rounded-lg object-cover bg-[color:var(--panel)] shrink-0"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to="/product/$id"
                            params={{ id: item.productId }}
                            className="cursor-pointer"
                          >
                            <h3 className="font-serif font-bold text-[color:var(--espresso)] hover:text-[color:var(--gold-dark)] transition-colors">
                              {item.p.name}
                            </h3>
                          </Link>

                          <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                            {item.p.purity} · {weightVal}g
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <div className="font-serif font-bold text-[color:var(--gold-dark)]">
                            {formatINR(
                              itemPrice * item.qty
                            )}
                          </div>

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
                                item.qty - 1
                              )
                            }
                            className="p-2 cursor-pointer hover:bg-[color:var(--panel)] rounded-full transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-7 text-center text-sm font-semibold">
                            {item.qty}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              actions.updateQty(
                                item.productId,
                                item.qty + 1
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
                );
              })}
            </div>

            {/* ==================== ORDER SUMMARY ==================== */}

            <div
              style={{
                backgroundColor: "var(--panel)",
              }}
              className="rounded-2xl p-6 h-fit"
            >
              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">
                Order Summary
              </h3>

              {/* Subtotal */}
              <Row
                l="Subtotal"
                v={formatINR(subtotal)}
              />

              {/* Coupon Discount */}
              {applied && (
                <Row
                  l="Coupon (NVS10)"
                  v={
                    <span className="text-green-700">
                      -{formatINR(discount)}
                    </span>
                  }
                />
              )}

              {/* Coupon Input */}
              <div className="flex gap-2 mt-4">
                <input
                  value={coupon}
                  onChange={(e) =>
                    setCoupon(e.target.value)
                  }
                  placeholder="Coupon (try NVS10)"
                  className="flex-1 border border-[color:var(--border)] rounded-full px-4 py-2 text-sm bg-white outline-none focus:border-[color:var(--gold)]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setApplied(
                      coupon.trim().toUpperCase() ===
                        "NVS10"
                    )
                  }
                  className="pill-gold-outline !py-2 !px-4 text-xs cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-[color:var(--gold)]/30 my-4" />

              {/* Total */}
              <div className="flex justify-between font-bold text-lg text-[color:var(--espresso)]">
                <span>Total</span>

                <span>{formatINR(total)}</span>
              </div>

              {/* Checkout */}
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