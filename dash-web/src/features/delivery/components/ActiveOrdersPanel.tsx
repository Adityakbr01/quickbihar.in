import { ReactNode, useState, useRef, useEffect } from "react";
import { Truck, MapPin, Navigation, Phone, ShieldCheck, Camera, PenTool, CheckCircle2, AlertTriangle, Coins, Loader2, Check, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { deliveryApi } from "../api/delivery.api";
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
  // Filter active rider jobs. Orders expose the canonical `delivery.status`
  // (DeliveryStatus) — compare against the shared canonical active set, not the
  // internal SubOrderStatus (`RIDER_*`) strings the server stores on `status`.
  const activeOrders = orders.filter((o) =>
    activeStatuses.includes(o.delivery?.status || o.status)
  );

  const selectedActiveOrder = activeOrders.find((order) => order._id === selectedOrderId) || activeOrders[0] || null;

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {/* Header card with status filtering */}
        <Card className="border-border bg-card text-foreground">
          <CardHeader className="flex flex-col gap-3 border-b border-border md:flex-row md:items-center md:justify-between py-4">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Truck className="h-5 w-5 text-cyan-400" />
              Active Delivery Jobs
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filter status:</span>
              <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value)}
                className="bg-muted border border-border rounded-lg px-2.5 py-1 text-xs text-foreground outline-none focus:border-cyan-500"
              >
                {/* Values are sent to the server as `?status=` and matched against
                    SubOrder.status (SubOrderStatus), so they stay in the RIDER_* vocabulary. */}
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
              <div className="p-8 text-center text-sm text-muted-foreground">Loading delivery jobs...</div>
            ) : activeOrders.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState label="No active delivery jobs assigned to you." />
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {activeOrders.map((order) => {
                  const currentStatus = order.delivery?.status || order.status;
                  const isSelected = order._id === selectedActiveOrder?._id;
                  return (
                    <div
                      key={order._id}
                      onClick={() => onSelect(order._id)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-muted flex items-center justify-between",
                        isSelected && "bg-muted border-l-4 border-cyan-400 pl-3"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{order.orderId}</span>
                          <DeliveryStatusBadge status={currentStatus} />
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
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
                        <div className="text-[10px] text-muted-foreground">{formatDate(order.createdAt)}</div>
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

  // Verification state inputs. Photo/signature values are hosted ImageKit URLs
  // returned by the proof-upload endpoint (set by the capture widgets below),
  // not hand-typed strings.
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
        if (!pickupPhoto) {
          toast.error("Capture a proof-of-pickup photo before confirming");
          return;
        }
        mPickup.mutate({
          subOrderId,
          payload: {
            pickupOtp,
            pickupPhoto,
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
        if (!deliveryPhoto) {
          toast.error("Capture a proof-of-delivery photo before completing");
          return;
        }
        mDeliver.mutate({
          subOrderId,
          payload: {
            deliveryOtp,
            deliveryPhoto,
            ...(signature ? { deliverySignature: signature } : {}),
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
    <Card className="border-border bg-card text-foreground">
      <CardHeader className="border-b border-border py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-muted-foreground">Fulfillment Verification Steps</CardTitle>
        <span className="text-xs text-muted-foreground font-mono">ID: {order.orderId}</span>
      </CardHeader>
      <CardContent className="py-6 space-y-6">
        {isCancelMode ? (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-2 text-amber-500 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Cancel Job Offer
            </div>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to decline this job? The order will be put back into matching pool for other delivery boys.
            </p>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (e.g. Vehicle breakdown, store far away)"
              className="bg-muted border-border text-foreground"
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
            <div className="flex items-center justify-between bg-muted p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Active Job Status</div>
              <div className="text-sm font-bold text-cyan-400">{deliveryStatusLabel(currentStatus)}</div>
            </div>

            {/* Step 1: Assigned -> Arriving */}
            {currentStatus === "ASSIGNED" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Step 1: Signal to the seller you are on the way to pick up the package.</p>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={() => handleAction("ARRIVING")} disabled={isMutating}>
                  <Navigation className="h-4 w-4 mr-2" /> Mark Heading to Store
                </Button>
              </div>
            )}

            {/* Step 2: Arriving -> Reached Store */}
            {currentStatus === "ARRIVING_AT_STORE" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Step 2: Check-in at store. The app verifies your GPS coordinate is within 100 meters boundary.</p>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => handleAction("REACHED_STORE")} disabled={isMutating}>
                  <MapPin className="h-4 w-4 mr-2" /> I Have Reached Store
                </Button>
              </div>
            )}

            {/* Step 3: Reached Store -> Picked Up (OTP & Photo required) */}
            {currentStatus === "REACHED_STORE" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 3: Verification OTP & Package Photo</h4>
                  <p className="text-[11px] text-muted-foreground">Ask the merchant for the 6-digit Pickup OTP. Upload a photo of the packed items.</p>
                </div>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Enter Pickup OTP</label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={pickupOtp}
                      onChange={(e) => setPickupOtp(e.target.value)}
                      placeholder="e.g. 123456"
                      className="bg-muted border-border text-foreground font-mono tracking-widest text-center"
                    />
                  </div>
                  <ProofPhotoInput
                    kind="pickup"
                    label="Proof of Pickup Photo"
                    hint="Take/upload a photo of the packed items."
                    value={pickupPhoto}
                    onChange={setPickupPhoto}
                  />
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction("PICKUP")} disabled={isMutating}>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Confirm Store Pickup
                </Button>
              </div>
            )}

            {/* Step 4: Picked Up -> In Transit */}
            {currentStatus === "PICKED_UP" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Step 4: Pack details verified. Signal that you are departing for the customer location.</p>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={() => handleAction("TRANSIT")} disabled={isMutating}>
                  <Navigation className="h-4 w-4 mr-2" /> Start Transit / Out for Delivery
                </Button>
              </div>
            )}

            {/* Step 5: In Transit -> Near Customer */}
            {currentStatus === "IN_TRANSIT" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Step 5: Check-in when you arrive at customer address (verifies 100 meters radius).</p>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => handleAction("NEAR_CUSTOMER")} disabled={isMutating}>
                  <MapPin className="h-4 w-4 mr-2" /> I Have Arrived at Customer Location
                </Button>
              </div>
            )}

            {/* Step 6: Near Customer -> Delivered (OTP, photo, signature required) */}
            {currentStatus === "NEAR_CUSTOMER" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 6: Delivery Handshake Verification</h4>
                  <p className="text-[11px] text-muted-foreground">Collect payment (if COD) and get the 6-digit Delivery OTP from the customer.</p>
                </div>
                {order.packageDetails?.isCod && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 flex items-start gap-2">
                    <Coins className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">CASH PAYMENT TO COLLECT: Rs. {formatAmount(order.payableAmount)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Collect the exact amount before handing over OTP or packages. This creates a cash liability.</div>
                    </div>
                  </div>
                )}
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Enter Delivery OTP (Customer App)</label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={deliveryOtp}
                      onChange={(e) => setDeliveryOtp(e.target.value)}
                      placeholder="e.g. 654321"
                      className="bg-muted border-border text-foreground font-mono tracking-widest text-center"
                    />
                  </div>
                  <ProofPhotoInput
                    kind="delivery"
                    label="Proof of Delivery Photo"
                    hint="Photo of the handed-over package at the doorstep."
                    value={deliveryPhoto}
                    onChange={setDeliveryPhoto}
                  />
                  <SignaturePad
                    value={signature}
                    onChange={setSignature}
                    customerName={order.shippingAddress?.fullName}
                  />
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction("DELIVER")} disabled={isMutating}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Delivery & Handover
                </Button>
              </div>
            )}

            {/* Cancel trigger */}
            {["ASSIGNED", "ARRIVING_AT_STORE", "REACHED_STORE"].includes(currentStatus) && (
              <div className="pt-2 border-t border-border flex justify-end">
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
      <Card className="border-border bg-card text-foreground">
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
    <Card className="border-border bg-card text-foreground self-start">
      <CardHeader className="border-b border-border py-4 flex flex-row items-center gap-2">
        <MapPin className="h-4 w-4 text-cyan-400" />
        <CardTitle className="text-sm font-semibold">Delivery Destinations</CardTitle>
      </CardHeader>
      <CardContent className="py-4 space-y-4 text-xs">
        <div>
          <div className="font-semibold text-foreground">Store Details</div>
          <div className="text-muted-foreground mt-0.5">{order.storeId?.name || "Merchant Store"}</div>
          <div className="text-muted-foreground">{order.storeId?.address?.line1 || "Store address not populated"}</div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="font-semibold text-foreground">Drop Destination</div>
          <div className="text-muted-foreground mt-0.5">{order.shippingAddress?.fullName}</div>
          <div className="text-muted-foreground">{order.shippingAddress?.phone}</div>
          <div className="mt-1.5 p-2 bg-muted rounded border border-border text-muted-foreground">
            {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.pincode}
          </div>
        </div>

        <div className="border-t border-border pt-3 flex flex-wrap gap-2">
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted px-3 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Navigation className="h-3.5 w-3.5" />
            Navigation Map
          </a>
          <a
            href={`tel:${order.shippingAddress?.phone}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted px-3 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Phone className="h-3.5 w-3.5" />
            Call Customer
          </a>
        </div>

        <div className="border-t border-border pt-3">
          <div className="font-semibold text-foreground mb-2">Package Contents</div>
          <div className="space-y-1.5">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-muted-foreground">
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

// Captures a proof photo: pick/shoot a file, upload it to ImageKit via the
// server, and surface the hosted URL (plus a thumbnail) to the parent. Replaces
// the old "paste an image URL / auto-inject a mock" stub.
function ProofPhotoInput({
  kind,
  label,
  hint,
  value,
  onChange,
}: {
  kind: "pickup" | "delivery";
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await deliveryApi.uploadProof(file, kind, file.name);
      onChange(url);
      toast.success(`${label} uploaded`);
    } catch (err: any) {
      toast.error(err?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <p className="text-[11px] text-muted-foreground mb-1.5">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-border gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : <Camera className="h-4 w-4 text-cyan-400" />}
          {value ? "Retake / Replace" : "Take / Upload Photo"}
        </Button>
        {value && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Captured
          </span>
        )}
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={`${label} preview`} className="mt-2 h-24 w-24 rounded-md object-cover border border-border" />
      )}
    </div>
  );
}

// Draws a customer signature on a canvas, exports it as a PNG, uploads it via
// the proof endpoint, and hands the hosted URL to the parent. Replaces the old
// free-text "type the customer's name" signature stub. Optional — delivery can
// complete on OTP + photo alone.
function SignaturePad({
  value,
  onChange,
  customerName,
}: {
  value: string;
  onChange: (url: string) => void;
  customerName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointFromEvent(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasStrokes.current = true;
    if (!dirty) setDirty(true);
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    setDirty(false);
    onChange("");
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes.current) {
      toast.error("Please capture the customer's signature first");
      return;
    }
    setUploading(true);
    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) throw new Error("Could not read the signature");
      const fileName = `signature_${(customerName || "customer").replace(/\s+/g, "_")}.png`;
      const { url } = await deliveryApi.uploadProof(blob, "signature", fileName);
      onChange(url);
      setDirty(false);
      toast.success("Signature captured");
    } catch (err: any) {
      toast.error(err?.message || "Signature upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1 flex items-center justify-between">
        <span>Customer Signature (optional)</span>
        {value && !dirty && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </label>
      <canvas
        ref={canvasRef}
        width={320}
        height={120}
        className="w-full h-[120px] rounded-md border border-border bg-background touch-none cursor-crosshair"
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" size="sm" className="border-border gap-2" onClick={save} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : <PenTool className="h-4 w-4 text-cyan-400" />}
          Save Signature
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={clear} disabled={uploading}>
          <Eraser className="h-4 w-4" /> Clear
        </Button>
      </div>
    </div>
  );
}
