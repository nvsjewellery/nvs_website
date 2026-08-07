import { createFileRoute, Link, useNavigate, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { ordersApi, type OrderSummary } from "@/lib/api";
import { formatINR } from "@/lib/store";

export const Route = createFileRoute("/orders")({ component: Orders });

function statusColor(status: string) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800";
    case "Shipped":
    case "Confirmed":
      return "bg-blue-100 text-blue-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-cream text-gold-dark";
  }
}

export function Orders() {
  const navigate = useNavigate();
  const matches = useChildMatches(); // Checks if a child route (like /orders/$orderId) is active
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setLoading(true);
      try {
        const data = await ordersApi.getAll();
        if (isMounted) setOrders(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load orders");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  // If we are on /orders/$orderId, render the child route (OrderDetailPage) via <Outlet />
  if (matches.length > 0) {
    return <Outlet />;
  }

  // Otherwise, render the orders list page
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-serif text-4xl md:text-5xl text-espresso">
          My Orders
        </h1>
        <OrnamentalDivider />

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground">
              Loading your orders...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white border border-border rounded-2xl mt-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white border border-border rounded-2xl mt-6">
            <h2 className="font-serif text-2xl text-espresso">
              No orders yet
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your placed orders will appear here.
            </p>
            <Link to="/gold" className="pill-gold inline-flex mt-6">
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {orders.map((order) => (
              <Link
                key={order.id}
                to="/orders/$orderId"
                params={{ orderId: String(order.id) }}
                className="block bg-white border border-border rounded-2xl p-6 shadow-xs hover:border-gold transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs label-caps text-gold-dark font-semibold">
                      Order #{String(order.id).slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="h-px bg-gold/20 my-4" />

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm text-espresso"
                    >
                      <span className="truncate max-w-xs">
                        {item.name} × {item.qty}
                      </span>
                      <span className="font-medium">
                        {formatINR(item.sellingPrice * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-gold/20 my-4" />

                <div className="flex items-center justify-between">
                  <p className="font-bold text-espresso">
                    Total: {formatINR(order.total)}
                  </p>
                  <span className="text-xs font-semibold text-gold-dark">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}