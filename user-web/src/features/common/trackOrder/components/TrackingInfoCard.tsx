import React, { useState } from "react";
import { ChevronDown, ChevronUp, Clock, MapPin, Phone, ShieldCheck, Star, User } from "lucide-react";
import { formatDistance } from "../utils/geoUtils";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useWindowWidth } from "@/src/utils/responsive";
import { cn } from "@/src/lib/utils";

interface TrackingInfoCardProps {
  status: string;
  eta: number;
  distance: number;
  riderName: string;
  riderPhone: string;
  deliveryOtp?: string;
  timeline?: any[];
  onCancelRequest?: () => void;
  showCancelButton?: boolean;
  cancelButtonLoading?: boolean;
}

export const TrackingInfoCard: React.FC<TrackingInfoCardProps> = ({
  status,
  eta,
  distance,
  riderName,
  riderPhone,
  deliveryOtp,
  timeline,
  onCancelRequest,
  showCancelButton,
  cancelButtonLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme() as any;
  const windowWidth = useWindowWidth();
  const isDark = theme.isDark ?? theme.text === "#ffffff";

  // Brand accents (orange/green/red) read fine on both modes — only
  // surfaces and text adapt. Light branch keeps the original hex values.
  const ink = isDark ? theme.text : "#333";
  const subInk = isDark ? theme.secondaryText : "#666";
  const faintInk = isDark ? theme.tertiaryText : "#999";
  const surface = isDark ? theme.secondaryBackground : "white";
  const chip = isDark ? theme.tertiaryBackground : "#F5F5F5";
  const line = isDark ? theme.border : "#F0F0F0";

  const handleCall = () => {
    if (riderPhone) {
      window.open(`tel:${riderPhone}`);
    }
  };

  const isCancellationRequested = timeline && timeline.length > 0 &&
    (timeline[timeline.length - 1]?.metadata?.message?.includes("requested cancellation") ||
     timeline[timeline.length - 1]?.metadata?.message?.includes("Requested cancellation") || false);

  const formattedStatus = (status || "").replace(/_/g, " ");
  const isFinished = ["DELIVERED", "CANCELLED", "COMPLETED", "REJECTED", "REFUNDED"].includes(
    status?.toUpperCase()
  );
  const isActivelyDelivering = [
    "PICKED_UP",
    "IN_TRANSIT",
    "NEAR_CUSTOMER",
    "OUT_FOR_DELIVERY",
    "RIDER_ASSIGNED",
    "RIDER_ARRIVING",
  ].includes(status?.toUpperCase());
  const canShowRiderPhone = isActivelyDelivering && !isFinished && Boolean(riderPhone);

  return (
    <div
      className="rounded-t-[30px] p-5 pt-2.5 shadow-2xl"
      style={{ backgroundColor: surface, width: windowWidth }}
    >
      {/* Grabber for bottom sheet feel */}
      <div
        className="mx-auto mb-[15px] h-1 w-10 rounded"
        style={{ backgroundColor: isDark ? theme.border : "#EEE" }}
      />

      <div className="overflow-y-auto" style={{ maxHeight: 450 }}>
        <div className="mb-[15px] flex flex-row items-start justify-between">
          <div className="flex-1">
            <p className="mb-1 text-xs font-bold uppercase text-[#FF6B00]">{formattedStatus}</p>
            <p className="text-xl font-bold" style={{ color: ink }}>
              {isFinished
                ? "Order Completed"
                : eta > 0
                  ? `Arriving in ${eta} mins`
                  : "Arriving soon"}
            </p>
          </div>
          <div
            className="flex flex-row items-center rounded-xl px-2.5 py-[5px]"
            style={{ backgroundColor: chip }}
          >
            <MapPin size={14} color={isDark ? theme.secondaryText : "#666"} />
            <span className="ml-1 text-xs font-bold" style={{ color: subInk }}>{formatDistance(distance)}</span>
          </div>
        </div>

        <div className="mt-[5px] mb-[15px] h-[1px]" style={{ backgroundColor: line }} />

        {/* Rider Row: Only shown if active or shows general delivery badge when completed */}
        {!isFinished && (
          <div className="mb-[15px] flex flex-row items-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: chip }}
            >
              <User size={24} color={isDark ? theme.secondaryText : "#666"} />
            </div>
            <div className="ml-[15px] flex-1">
              <p className="text-base font-bold" style={{ color: ink }}>
                {isActivelyDelivering ? (riderName || "Delivery Partner") : "Assigning Rider..."}
              </p>
              <div className="mt-0.5 flex flex-row items-center">
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <span className="ml-1 text-xs" style={{ color: faintInk }}>
                  {isActivelyDelivering ? "4.8 | Verified Partner" : "Securing nearest partner"}
                </span>
              </div>
            </div>
            {canShowRiderPhone ? (
              <button
                type="button"
                onClick={handleCall}
                className="flex flex-row items-center rounded-xl bg-[#00C853] px-[15px] py-2"
              >
                <Phone size={20} color="white" />
                <span className="ml-1.5 font-bold text-white">Call</span>
              </button>
            ) : null}
          </div>
        )}

        {/* Toggle details button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-[15px] flex w-full flex-row items-center justify-center rounded-xl py-2"
          style={{ backgroundColor: isDark ? "rgba(255,107,0,0.16)" : "#FFF0E6" }}
        >
          <span className="mr-1.5 text-[13px] font-bold text-[#FF6B00]">
            {isExpanded ? "Hide Details" : "View Timeline & OTP"}
          </span>
          {isExpanded ? (
            <ChevronUp size={16} color="#FF6B00" />
          ) : (
            <ChevronDown size={16} color="#FF6B00" />
          )}
        </button>

        {isExpanded && (
          <div className="py-[5px]">
            {/* OTP Section */}
            {deliveryOtp && !["DELIVERED", "CANCELLED", "COMPLETED"].includes(status) && (
              <div
                className="mb-[15px] flex flex-col items-center rounded-[15px] border p-[15px]"
                style={{
                  backgroundColor: isDark ? theme.tertiaryBackground : "#FDF9F4",
                  borderColor: isDark ? "rgba(255,107,0,0.35)" : "#FFEEDD",
                }}
              >
                <p
                  className="mb-2.5 text-xs font-bold uppercase"
                  style={{ color: isDark ? "#E8B86D" : "#996633" }}
                >
                  Delivery OTP
                </p>
                <div className="mb-2.5 flex flex-row items-center justify-center">
                  {deliveryOtp.split("").map((digit, index) => (
                    <div
                      key={index}
                      className="mx-1 flex h-11 w-[38px] items-center justify-center rounded-lg border-[1.5px] border-[#FF6B00]"
                      style={{ backgroundColor: surface }}
                    >
                      <span className="text-[22px] font-bold" style={{ color: ink }}>{digit}</span>
                    </div>
                  ))}
                </div>
                <p
                  className="text-center text-[11px] leading-[15px]"
                  style={{ color: isDark ? "#E8B86D" : "#996633" }}
                >
                  Share this OTP with the delivery rider to verify and confirm your delivery.
                </p>
              </div>
            )}

            {/* Timeline Section */}
            {timeline && timeline.length > 0 && (
              <div className="mb-[15px] px-[5px]">
                <p className="mb-3 text-sm font-bold" style={{ color: ink }}>Delivery Timeline</p>
                {timeline.map((event, index) => {
                  const isLast = index === timeline.length - 1;
                  const dateStr = event.timestamp
                    ? new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";
                  const dateDay = event.timestamp
                    ? new Date(event.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })
                    : "";

                  return (
                    <div key={index} className="flex min-h-[50px] flex-row">
                      <div className="flex w-5 flex-col items-center">
                        <div
                          className={cn("mt-1 rounded-full", isLast ? "h-3 w-3 border-2 border-[#FFE0CC] bg-[#FF6B00]" : "h-2.5 w-2.5")}
                          style={isLast ? undefined : { backgroundColor: isDark ? theme.border : "#CCC" }}
                        />
                        {!isLast && (
                          <div
                            className="my-1 w-0.5 flex-1"
                            style={{ backgroundColor: isDark ? theme.border : "#E0E0E0" }}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-[15px] pl-2.5">
                        <div className="mb-0.5 flex flex-row items-center justify-between">
                          <span
                            className="text-xs font-bold capitalize"
                            style={{ color: isLast ? "#FF6B00" : subInk }}
                          >
                            {event.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px]" style={{ color: faintInk }}>
                            {dateDay}, {dateStr}
                          </span>
                        </div>
                        <p className="text-xs leading-4" style={{ color: subInk }}>
                          {event.metadata?.message || `Order status updated to ${event.status.replace(/_/g, " ")}`}
                        </p>
                        {event.metadata?.reason && (
                          <p className="mt-0.5 text-[11px] text-[#DD3333] italic">
                            Reason: {event.metadata.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cancellation Requested Badge */}
            {isCancellationRequested && (
              <div
                className="mb-[15px] flex flex-row items-center rounded-[10px] border p-2.5"
                style={{
                  backgroundColor: isDark ? "rgba(255,159,0,0.14)" : "#FFF9E6",
                  borderColor: isDark ? "rgba(255,159,0,0.35)" : "#FFEBAA",
                }}
              >
                <Clock size={16} color="#FF9F00" />
                <span
                  className="ml-2 text-xs font-semibold"
                  style={{ color: isDark ? "#F5C044" : "#B27D00" }}
                >
                  Cancellation requested. Pending store approval.
                </span>
              </div>
            )}

            {/* Cancel Button */}
            {showCancelButton && !isCancellationRequested && (
              <button
                type="button"
                onClick={onCancelRequest}
                disabled={cancelButtonLoading}
                className="mb-2.5 flex w-full items-center justify-center rounded-xl bg-[#E53935] py-3 disabled:opacity-60"
              >
                {cancelButtonLoading ? (
                  <span
                    className="animate-spin rounded-full"
                    style={{
                      width: 20,
                      height: 20,
                      borderWidth: 2,
                      borderStyle: "solid",
                      borderColor: "white",
                      borderTopColor: "transparent",
                    }}
                  />
                ) : (
                  <span className="text-sm font-bold text-white">Request Cancel Shipment</span>
                )}
              </button>
            )}
          </div>
        )}

        <div className="mt-[5px] mb-[15px] h-[1px]" style={{ backgroundColor: line }} />

        <div
          className="flex flex-row items-center rounded-xl p-2.5"
          style={{ backgroundColor: isDark ? "rgba(0,200,83,0.12)" : "#F0FFF4" }}
        >
          <ShieldCheck size={16} color="#00C853" />
          <span className="ml-2 flex-1 text-[10px] text-[#00C853]">
            Your order is being delivered with contactless safety standards.
          </span>
        </div>
      </div>
    </div>
  );
};
