"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bike, CheckCircle2, FileUp, Loader2, MapPin, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerRequest, verifyOtpRequest } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import { onboardingApi, OnboardingApplication } from "@/features/onboarding/api/onboarding.api";

type PartnerMode = "SELLER" | "RIDER";
type Phase = "account" | "otp" | "application" | "submitted";
type RiderLocation = { latitude: number; longitude: number };

const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
const selectClass = "h-10 rounded-lg border border-white/10 bg-[#181818] px-3 text-sm text-white outline-none";
const textareaClass = "min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500";

export default function PartnerRegisterForm({ mode }: { mode: PartnerMode }) {
  const isRider = mode === "RIDER";
  const { user, token, isAuthenticated, setAuth } = useAuthStore();
  const [phase, setPhase] = useState<Phase>(isAuthenticated ? "application" : "account");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [otp, setOtp] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<OnboardingApplication | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);

  const title = isRider ? "Delivery Registration" : "Seller Registration";
  const Icon = isRider ? Bike : Store;
  const iconClass = isRider ? "bg-cyan-400/10 text-cyan-300" : "bg-emerald-400/10 text-emerald-300";

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    onboardingApi.status()
      .then((data) => {
        const app = (isRider ? data.latestRiderApplication : data.latestSellerApplication) || null;
        setStatus(app);
        if (app?.status === "PENDING" || app?.status === "APPROVED") setPhase("submitted");
        else setPhase("application");
      })
      .catch(() => undefined);
  }, [isAuthenticated, isRider, token]);

  const canSubmitApplication = useMemo(
    () => files.length > 0 && isAuthenticated && (!isRider || Boolean(riderLocation)),
    [files.length, isAuthenticated, isRider, riderLocation],
  );

  const submitAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    try {
      await registerRequest({ email, password, fullName });
      toast.success("OTP sent to your email");
      setPhase("otp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsBusy(false);
    }
  };

  const submitOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    try {
      const response = await verifyOtpRequest({ email, otp });
      setAuth(response.data.user, response.data.accessToken);
      toast.success("Email verified");
      setPhase("application");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP verification failed");
    } finally {
      setIsBusy(false);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRiderLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
        toast.success("Rider location added");
      },
      (error) => {
        setIsLocating(false);
        toast.error(error.message || "Location permission failed");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.error("Login required before submitting application");
      return;
    }
    if (!files.length) {
      toast.error("Upload at least one document");
      return;
    }
    if (isRider && !riderLocation) {
      toast.error("Add your rider location");
      return;
    }

    const form = new FormData(event.currentTarget);
    setIsBusy(true);
    try {
      const documents = await onboardingApi.uploadDocuments(files);
      const address = addressPayload(form);
      const bankDetails = bankPayload(form);

      const payload = isRider
        ? {
            type: "RIDER" as const,
            documents,
            details: {
              vehicleType: text(form, "vehicleType"),
              vehicleNumber: text(form, "vehicleNumber"),
              licenseNumber: text(form, "licenseNumber"),
              location: { lat: riderLocation!.latitude, lng: riderLocation!.longitude },
              ...(address ? { address } : {}),
              ...(bankDetails ? { bankDetails } : {}),
            },
          }
        : {
            type: "SELLER" as const,
            documents,
            details: {
              businessName: text(form, "businessName"),
              sellerType: "CLOTHING" as const,
              gstNumber: optionalText(form, "gstNumber"),
              ...(address ? { address } : {}),
              ...(bankDetails ? { bankDetails } : {}),
            },
          };

      const application = await onboardingApi.apply(payload);
      setStatus(application);
      setPhase("submitted");
      toast.success("Application submitted for admin approval");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Application submission failed");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card className="relative z-10 w-full max-w-2xl border-none bg-transparent py-4 shadow-none">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-extrabold tracking-tight text-white">{title}</CardTitle>
        <CardDescription className="text-gray-400">
          {phaseLabel(phase, status)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {phase === "account" && (
          <form onSubmit={submitAccount} className="grid gap-4">
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" required className={inputClass} />
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" required className={inputClass} />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" minLength={6} required className={inputClass} />
            <Button type="submit" disabled={isBusy} className={isRider ? "bg-cyan-600 hover:bg-cyan-700" : "bg-emerald-600 hover:bg-emerald-700"}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send OTP
            </Button>
          </form>
        )}

        {phase === "otp" && (
          <form onSubmit={submitOtp} className="grid gap-4">
            <Input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6 digit OTP" maxLength={6} required className={inputClass} />
            <Button type="submit" disabled={isBusy || otp.length !== 6} className={isRider ? "bg-cyan-600 hover:bg-cyan-700" : "bg-emerald-600 hover:bg-emerald-700"}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify Email
            </Button>
          </form>
        )}

        {phase === "application" && (
          <form onSubmit={submitApplication} className="grid gap-4">
            {isRider
              ? <RiderFields location={riderLocation} isLocating={isLocating} onCaptureLocation={captureLocation} />
              : <SellerFields />}
            <CommonApplicationFields onFiles={setFiles} />
            <Button type="submit" disabled={isBusy || !canSubmitApplication} className={isRider ? "bg-cyan-600 hover:bg-cyan-700" : "bg-emerald-600 hover:bg-emerald-700"}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Submit For Approval
            </Button>
          </form>
        )}

        {phase === "submitted" && (
          <div className="grid gap-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="text-lg font-semibold text-white">{status?.status || "Application received"}</div>
            <p className="text-sm text-gray-400">
              {status?.status === "APPROVED"
                ? "Your application is approved. You can log in to the partner panel."
                : status?.status === "REJECTED"
                  ? status.rejectionReason || "Your application was rejected. Update details and submit again."
                  : "Admin approval is required before panel access is enabled."}
            </p>
            {status?.status === "REJECTED" && (
              <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setPhase("application")}>
                Submit Again
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SellerFields() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Input name="businessName" placeholder="Business name" required className={inputClass} />
      <Input name="gstNumber" placeholder="GST number (optional)" className={inputClass} />
    </div>
  );
}

function RiderFields({
  location,
  isLocating,
  onCaptureLocation,
}: {
  location: RiderLocation | null;
  isLocating: boolean;
  onCaptureLocation: () => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-3">
        <select name="vehicleType" required className={selectClass}>
          <option value="">Vehicle type</option>
          <option value="BIKE">Bike</option>
          <option value="SCOOTER">Scooter</option>
          <option value="CYCLE">Cycle</option>
          <option value="CAR">Car</option>
        </select>
        <Input name="vehicleNumber" placeholder="Vehicle number" required className={inputClass} />
        <Input name="licenseNumber" placeholder="License number" required className={inputClass} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="grid gap-1">
          <span className="text-sm font-medium text-white">Rider location</span>
          <span className="text-xs text-gray-400">
            {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Not added"}
          </span>
        </div>
        <Button type="button" variant="outline" disabled={isLocating} onClick={onCaptureLocation} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          {location ? "Update Location" : "Use Current Location"}
        </Button>
      </div>
    </div>
  );
}

function CommonApplicationFields({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <Input name="city" placeholder="City" className={inputClass} />
        <Input name="state" placeholder="State" className={inputClass} />
        <Input name="pincode" placeholder="Pincode" className={inputClass} />
        <Input name="upi" placeholder="UPI (optional)" className={inputClass} />
      </div>
      <textarea name="address" placeholder="Full address" className={textareaClass} />
      <div className="grid gap-3 md:grid-cols-4">
        <Input name="accountNumber" placeholder="Account number" className={inputClass} />
        <Input name="ifsc" placeholder="IFSC" className={inputClass} />
        <Input name="bankName" placeholder="Bank name" className={inputClass} />
        <Input name="pan" placeholder="PAN" className={inputClass} />
      </div>
      <Input name="aadhar" placeholder="Aadhar" className={inputClass} />
      <Input type="file" multiple required onChange={(event) => onFiles(Array.from(event.target.files || []))} className={inputClass} />
    </>
  );
}

function phaseLabel(phase: Phase, status: OnboardingApplication | null) {
  if (status?.status === "PENDING") return "Your application is waiting for admin approval";
  if (status?.status === "APPROVED") return "Your partner account is approved";
  if (status?.status === "REJECTED") return "Your previous application needs attention";
  if (phase === "otp") return "Verify your email before submitting application details";
  if (phase === "application") return "Submit partner details and documents for admin approval";
  return "Create your account to start partner onboarding";
}

function text(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function optionalText(form: FormData, key: string) {
  const value = text(form, key);
  return value || undefined;
}

function addressPayload(form: FormData) {
  const address = text(form, "address");
  const city = text(form, "city");
  const state = text(form, "state");
  const pincode = text(form, "pincode");
  if (!address && !city && !state && !pincode) return null;
  return { address, city, state, pincode };
}

function bankPayload(form: FormData) {
  const accountNumber = text(form, "accountNumber");
  const ifsc = text(form, "ifsc");
  const bankName = text(form, "bankName");
  const pan = text(form, "pan");
  const aadhar = text(form, "aadhar");
  const upi = optionalText(form, "upi");
  if (!accountNumber || !ifsc || !bankName || !pan || !aadhar) return null;
  return { accountNumber, ifsc, bankName, pan, aadhar, ...(upi ? { upi } : {}) };
}
