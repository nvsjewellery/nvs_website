import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { ordersApi, type OrderDetail } from "@/lib/api";
import { formatINR } from "@/lib/store";

export const Route = createFileRoute("/orders/$orderId")({ component: OrderDetailPage });

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

export function OrderDetailPage() {
    const { orderId } = useParams({ from: "/orders/$orderId" });
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [tracking, setTracking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadOrder() {
            setLoading(true);
            try {
                const data = await ordersApi.getById(orderId);
                if (isMounted) {
                    setOrder(data.order);
                    setTracking(data.tracking);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message || "Failed to load order");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadOrder();
        return () => {
            isMounted = false;
        };
    }, [orderId]);

    const trackData = tracking?.tracking_data?.shipment_track?.[0];

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-10">
                <Link
                    to="/orders"
                    className="text-xs font-semibold text-gold-dark hover:underline"
                >
                    ← Back to My Orders
                </Link>

                <h1 className="font-serif text-4xl md:text-5xl text-espresso mt-3">
                    Order Details
                </h1>
                <OrnamentalDivider />

                {loading ? (
                    <div className="py-20 text-center">
                        <p className="text-sm text-muted-foreground">Loading order...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-white border border-border rounded-2xl mt-6">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                ) : order ? (
                    <div className="space-y-6 mt-6">
                        {/* Order Summary */}
                        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
                            <div className="flex items-start justify-between flex-wrap gap-4">
                                <div>
                                    <p className="text-xs label-caps text-gold-dark font-semibold">
                                        Order #{order.id.slice(-8).toUpperCase()}
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
                        </div>

                        {/* Tracking */}
                        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
                            <h3 className="font-serif text-xl text-espresso mb-4">
                                Shipment Tracking
                            </h3>

                            {!order.srAwbCode ? (
                                <p className="text-sm text-muted-foreground">
                                    Your shipment is being prepared. Tracking details will appear
                                    here once your order is dispatched.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs label-caps text-gold-dark font-semibold">
                                                AWB Number
                                            </p>
                                            <p className="text-espresso mt-1">{order.srAwbCode}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs label-caps text-gold-dark font-semibold">
                                                Courier
                                            </p>
                                            <p className="text-espresso mt-1">
                                                {order.srCourierName || "—"}
                                            </p>
                                        </div>
                                        {trackData?.current_status && (
                                            <div>
                                                <p className="text-xs label-caps text-gold-dark font-semibold">
                                                    Current Status
                                                </p>
                                                <p className="text-espresso mt-1">
                                                    {trackData.current_status}
                                                </p>
                                            </div>
                                        )}
                                        {trackData?.edd && (
                                            <div>
                                                <p className="text-xs label-caps text-gold-dark font-semibold">
                                                    Expected Delivery
                                                </p>
                                                <p className="text-espresso mt-1">
                                                    {new Date(trackData.edd).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        {trackData?.origin && (
                                            <div>
                                                <p className="text-xs label-caps text-gold-dark font-semibold">
                                                    Origin
                                                </p>
                                                <p className="text-espresso mt-1">{trackData.origin}</p>
                                            </div>
                                        )}
                                        {trackData?.destination && (
                                            <div>
                                                <p className="text-xs label-caps text-gold-dark font-semibold">
                                                    Destination
                                                </p>
                                                <p className="text-espresso mt-1">
                                                    {trackData.destination}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {tracking?.tracking_data?.track_url && (
                                        <a
                                            href={tracking.tracking_data.track_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="pill-gold inline-flex text-xs mt-2"
                                        >
                                            Track on Courier Site →
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
                            <h3 className="font-serif text-xl text-espresso mb-4">
                                Items
                            </h3>
                            <div className="space-y-3 divide-y divide-border/60">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="pt-3 first:pt-0 flex justify-between text-sm text-espresso"
                                    >
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                SKU: {item.sku} · Qty: {item.qty}
                                            </p>
                                        </div>
                                        <span className="font-semibold">
                                            {formatINR(item.sellingPrice * item.qty)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gold/30 my-4" />

                            <div className="flex justify-between font-bold text-lg text-espresso">
                                <span>Total Paid</span>
                                <span>{formatINR(order.total)}</span>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
                            <h3 className="font-serif text-xl text-espresso mb-4">
                                Shipping Address
                            </h3>
                            <p className="text-sm text-espresso">
                                {order.customerName}{" "}
                                {order.customerLastName !== "NA" ? order.customerLastName : ""}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {order.address}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {order.city}, {order.state} — {order.pincode}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Phone: {order.customerPhone}
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </Layout>
    );
}