import { ReactNode, useState } from "react";
import { Truck, MapPin, Navigation, Phone, ShieldCheck, Camera, PenTool, CheckCircle2, AlertTriangle, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useSubOrderArriving,
  useSubOrderReachedStore,
  useSubOrderPickup,
  useSubOrderTransit,
  useSubOrderNearCustomer,
  useSubOrderDeliver,
  useSubOrderCancel,
} from "../hooks/useDeliveryPanel";
import {
  activeStatuses,
  DeliveryStatusBadge,
  EmptyState,
  deliveryStatusLabel,
  formatDate,
  formatAmount,
} from "./DeliveryHelpers";

export function ActiveOrdersPanel({
  orders,
  loading,
  onSelect,
  statusFilter,
  onStatusFilterChange,
  selectedOrderId,
}: {
  orders: any[];
  loading: boolean;
  onSelect: (orderId: string) => void;
  statusFilter: string | "ALL";
  onStatusFilterChange: (status: any | "ALL") => void;
  selectedOrderId: string | null;
}) {
  // Filter active rider jobs
  const activeOrders = orders.filter((o) =>
    ["READY_FOR_PICKUP", "RIDER_ASSIGNED", "RIDER_ARRIVING", "RIDER_REACHED_STORE", "PICKED_UP", "IN_TRANSIT", "NEAR_CUSTOMER"].includes(o.delivery?.status || o.status)
  );

  const selectedActiveOrder = activeOrders.find((order) => order._id === selectedOrderId) || activeOrders[0] || null;

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {/* Header card with status filtering */}
        <Card className="border-white/10 bg-[#1c1c1c] text-white">
          <CardHeader className="flex flex-col gap-3 border-b border-white/10 md:flex-row md:items-center md:justify-between py-4">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Truck className="h-5 w-5 text-cyan-400" />
              Active Delivery Jobs
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Filter status:</span>
              <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Active Jobs</option>
                <option value="RIDER_ASSIGNED">Assigned</option>
                <option value="RIDER_ARRIVING">Arriving</option>
                <option value="RIDER_REACHED_STORE">Reached Store</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="NEAR_CUSTOMER">Near Customer</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading delivery jobs...</div>
            ) : activeOrders.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState label="No active delivery jobs assigned to you." />
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {activeOrders.map((order) => {
                  const currentStatus = order.delivery?.status || order.status;
                  const isSelected = order._id === selectedActiveOrder?._id;
                  return (
                    <div
                      key={order._id}
                      onClick={() => onSelect(order._id)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-white/[0.02] flex items-center justify-between",
                        isSelected && "bg-white/[0.03] border-l-4 border-cyan-400 pl-3"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{order.orderId}</span>
                          <DeliveryStatusBadge status={currentStatus} />
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-red-400" />
                          <span>{order.shippingAddress?.fullName} • {order.shippingAddress?.city}</span>
                        </div>
                        {order.packageDetails?.isCod && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                            <Coins className="h-3 w-3" />
                            COD: Rs. {formatAmount(order.payableAmount)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-cyan-400">Rs. {formatAmount(order.delivery?.payoutAmount || 0)}</div>
                        <div className="text-[10px] text-gray-500">{formatDate(order.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution Card: Interactive Workflows based on status */}
        {selectedActiveOrder && (
          <JobExecutionCard order={selectedActiveOrder} />
        )}
      </div>

      {/* Sidebar Details Panel */}
      <OrderDetailPanel order={selectedActiveOrder} />
    </section>
  );
}

// Active Job Action Controller Card
function JobExecutionCard({ order }: { order: any }) {
  const currentStatus = order.delivery?.status || order.status;
  const subOrderId = order._id;

  const mArriving = useSubOrderArriving();
  const mReachedStore = useSubOrderReachedStore();
  const mPickup = useSubOrderPickup();
  const mTransit = useSubOrderTransit();
  const mNearCustomer = useSubOrderNearCustomer();
  const mDeliver = useSubOrderDeliver();
  const mCancel = useSubOrderCancel();

  // Verification state inputs
  const [pickupOtp, setPickupOtp] = useState("");
  const [pickupPhoto, setPickupPhoto] = useState("");
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [deliveryPhoto, setDeliveryPhoto] = useState("");
  const [signature, setSignature] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelMode, setIsCancelMode] = useState(false);

  const getGeoLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(new Error("Unable to retrieve GPS coordinates. Ensure location permission is granted.")),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const handleAction = async (action: string) => {
    try {
      if (action === "ARRIVING") {
        mArriving.mutate(subOrderId);
      } else if (action === "REACHED_STORE") {
        const coords = await getGeoLocation();
        mReachedStore.mutate({ subOrderId, location: coords });
      } else if (action === "PICKUP") {
        if (!pickupOtp || pickupOtp.length < 4) {
          toast.error("Valid Pickup OTP code is required");
          return;
        }
        mPickup.mutate({
          subOrderId,
          payload: {
            pickupOtp,
            pickupPhoto: pickupPhoto || "https://ik.imagekit.io/k2n57ywshu/products/proof_pickup.jpg",
          },
        });
      } else if (action === "TRANSIT") {
        mTransit.mutate(subOrderId);
      } else if (action === "NEAR_CUSTOMER") {
        const coords = await getGeoLocation();
        mNearCustomer.mutate({ subOrderId, location: coords });
      } else if (action === "DELIVER") {
        if (!deliveryOtp || deliveryOtp.length < 4) {
          toast.error("Valid Delivery OTP code is required");
          return;
        }
        mDeliver.mutate({
          subOrderId,
          payload: {
            deliveryOtp,
            deliveryPhoto: deliveryPhoto || "https://ik.imagekit.io/k2n57ywshu/products/proof_delivery.jpg",
            deliverySignature: signature || "Customer Signed (Touchscreen verified)",
          },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
  };

  const handleCancel = () => {
    if (!cancelReason) {
      toast.error("Please enter a reason for cancellation");
      return;
    }
    mCancel.mutate({ subOrderId, reason: cancelReason }, {
      onSuccess: () => {
        setIsCancelMode(false);
        setCancelReason("");
      }
    });
  };

  const isMutating =
    mArriving.isPending ||
    mReachedStore.isPending ||
    mPickup.isPending ||
    mTransit.isPending ||
    mNearCustomer.isPending ||
    mDeliver.isPending ||
    mCancel.isPending;

  return (
    <Card className="border-white/10 bg-[#1c1c1c] text-white">
      <CardHeader className="border-b border-white/10 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-gray-300">Fulfillment Verification Steps</CardTitle>
        <span className="text-xs text-gray-500 font-mono">ID: {order.orderId}</span>
      </CardHeader>
      <CardContent className="py-6 space-y-6">
        {isCancelMode ? (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-2 text-amber-500 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Cancel Job Offer
            </div>
            <p className="text-xs text-gray-400">
              Are you sure you want to decline this job? The order will be put back into matching pool for other delivery boys.
            </p>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (e.g. Vehicle breakdown, store far away)"
              className="bg-black/30 border-white/10 text-white"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleCancel} disabled={isMutating}>
                Confirm Cancel
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsCancelMode(false)} disabled={isMutating}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status indicators */}
            <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
              <div className="text-xs text-gray-400">Active Job Status</div>
              <div className="text-sm font-bold text-cyan-400">{deliveryStatusLabel(currentStatus)}</div>
            </div>

            {/* Step 1: Assigned -> Arriving */}
            {currentStatus === "RIDER_ASSIGNED" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Step 1: Signal to the seller you are on the way to pick up the package.</p>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={() => handleAction("ARRIVING")} disabled={isMutating}>
                  <Navigation className="h-4 w-4 mr-2" /> Mark Heading to Store
                </Button>
              </div>
            )}

            {/* Step 2: Arriving -> Reached Store */}
            {currentStatus === "RIDER_ARRIVING" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Step 2: Check-in at store. The app verifies your GPS coordinate is within 100 meters boundary.</p>
                <Button className="w-full bg-[#8A2BE2] hover:bg-[#7A1FA2]" onClick={() => handleAction("REACHED_STORE")} disabled={isMutating}>
                  <MapPin className="h-4 w-4 mr-2" /> I Have Reached Store
                </Button>
              </div>
            )}

            {/* Step 3: Reached Store -> Picked Up (OTP & Photo required) */}
            {currentStatus === "RIDER_REACHED_STORE" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Step 3: Verification OTP & Package Photo</h4>
                  <p className="text-[11px] text-gray-500">Ask the merchant for the 6-digit Pickup OTP. Upload a photo of the packed items.</p>
                </div>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Enter Pickup OTP</label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={pickupOtp}
                      onChange={(e) => setPickupOtp(e.target.value)}
                      placeholder="e.g. 123456"
                      className="bg-black/30 border-white/10 text-white font-mono tracking-widest text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 flex items-center justify-between">
                      <span>Proof of Pickup Photo (Optional for simulator)</span>
                      <span className="text-[10px] text-gray-500">Mock photo auto-injected</span>
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={pickupPhoto}
                        onChange={(e) => setPickupPhoto(e.target.value)}
                        placeholder="Image URL"
                        className="bg-black/30 border-white/10 text-xs text-white"
                      />
                      <Button variant="outline" size="icon" className="border-white/10 shrink-0" onClick={() => setPickupPhoto("https://ik.imagekit.io/k2n57ywshu/products/proof_pickup.jpg")}>
                        <Camera className="h-4 w-4 text-cyan-400" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction("PICKUP")} disabled={isMutating}>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Confirm Store Pickup
                </Button>
              </div>
            )}

            {/* Step 4: Picked Up -> In Transit */}
            {currentStatus === "PICKED_UP" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Step 4: Pack details verified. Signal that you are departing for the customer location.</p>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={() => handleAction("TRANSIT")} disabled={isMutating}>
                  <Navigation className="h-4 w-4 mr-2" /> Start Transit / Out for Delivery
                </Button>
              </div>
            )}

            {/* Step 5: In Transit -> Near Customer */}
            {currentStatus === "IN_TRANSIT" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Step 5: Check-in when you arrive at customer address (verifies 100 meters radius).</p>
                <Button className="w-full bg-[#8A2BE2] hover:bg-[#7A1FA2]" onClick={() => handleAction("NEAR_CUSTOMER")} disabled={isMutating}>
                  <MapPin className="h-4 w-4 mr-2" /> I Have Arrived at Customer Location
                </Button>
              </div>
            )}

            {/* Step 6: Near Customer -> Delivered (OTP, photo, signature required) */}
            {currentStatus === "NEAR_CUSTOMER" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Step 6: Delivery Handshake Verification</h4>
                  <p className="text-[11px] text-gray-500">Collect payment (if COD) and get the 6-digit Delivery OTP from the customer.</p>
                </div>
                {order.packageDetails?.isCod && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 flex items-start gap-2">
                    <Coins className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">CASH PAYMENT TO COLLECT: Rs. {formatAmount(order.payableAmount)}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Collect the exact amount before handing over OTP or packages. This creates a cash liability.</div>
                    </div>
                  </div>
                )}
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Enter Delivery OTP (Customer App)</label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={deliveryOtp}
                      onChange={(e) => setDeliveryOtp(e.target.value)}
                      placeholder="e.g. 654321"
                      className="bg-black/30 border-white/10 text-white font-mono tracking-widest text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 flex items-center justify-between">
                      <span>Proof of Delivery Photo (Optional for simulator)</span>
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={deliveryPhoto}
                        onChange={(e) => setDeliveryPhoto(e.target.value)}
                        placeholder="Photo URL"
                        className="bg-black/30 border-white/10 text-xs text-white"
                      />
                      <Button variant="outline" size="icon" className="border-white/10 shrink-0" onClick={() => setDeliveryPhoto("https://ik.imagekit.io/k2n57ywshu/products/proof_delivery.jpg")}>
                        <Camera className="h-4 w-4 text-cyan-400" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Customer Hand Signature Name</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        placeholder="Customer Name or Initials"
                        className="bg-black/30 border-white/10 text-xs text-white"
                      />
                      <Button variant="outline" size="icon" className="border-white/10 shrink-0" onClick={() => setSignature(`${order.shippingAddress?.fullName} (Signed)`)}>
                        <PenTool className="h-4 w-4 text-cyan-400" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction("DELIVER")} disabled={isMutating}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Delivery & Handover
                </Button>
              </div>
            )}

            {/* Cancel trigger */}
            {["RIDER_ASSIGNED", "RIDER_ARRIVING", "RIDER_REACHED_STORE"].includes(currentStatus) && (
              <div className="pt-2 border-t border-white/5 flex justify-end">
                <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 hover:text-red-500" onClick={() => setIsCancelMode(true)}>
                  Decline Job
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Order detail sidebar panel
function OrderDetailPanel({ order }: { order: any | null }) {
  if (!order) {
    return (
      <Card className="border-white/10 bg-[#1c1c1c] text-white">
        <CardContent className="py-10">
          <EmptyState label="Select a delivery job to view specifications." />
        </CardContent>
      </Card>
    );
  }

  const mapHref =
    order.shippingAddress?.latitude && order.shippingAddress?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${order.shippingAddress?.street} ${order.shippingAddress?.city} ${order.shippingAddress?.pincode}`
        )}`;

  return (
    <Card className="border-white/10 bg-[#1c1c1c] text-white self-start">
      <CardHeader className="border-b border-white/10 py-4 flex flex-row items-center gap-2">
        <MapPin className="h-4 w-4 text-cyan-400" />
        <CardTitle className="text-sm font-semibold">Delivery Destinations</CardTitle>
      </CardHeader>
      <CardContent className="py-4 space-y-4 text-xs">
        <div>
          <div className="font-semibold text-white">Store Details</div>
          <div className="text-gray-400 mt-0.5">{order.storeId?.name || "Merchant Store"}</div>
          <div className="text-gray-500">{order.storeId?.address?.line1 || "Store address not populated"}</div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <div className="font-semibold text-white">Drop Destination</div>
          <div className="text-gray-400 mt-0.5">{order.shippingAddress?.fullName}</div>
          <div className="text-gray-500">{order.shippingAddress?.phone}</div>
          <div className="mt-1.5 p-2 bg-black/20 rounded border border-white/5 text-gray-400">
            {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.pincode}
          </div>
        </div>

        <div className="border-t border-white/5 pt-3 flex flex-wrap gap-2">
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10"
          >
            <Navigation className="h-3.5 w-3.5" />
            Navigation Map
          </a>
          <a
            href={`tel:${order.shippingAddress?.phone}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10"
          >
            <Phone className="h-3.5 w-3.5" />
            Call Customer
          </a>
        </div>

        <div className="border-t border-white/5 pt-3">
          <div className="font-semibold text-white mb-2">Package Contents</div>
          <div className="space-y-1.5">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-gray-400">
                <span>{item.title}</span>
                <span>x{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
