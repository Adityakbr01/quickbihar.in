"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bike, CheckCircle2, FileUp, Loader2, MapPin, Store, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestOtpRequest, verifyOtpRequest, updateProfileRequest } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import { onboardingApi, OnboardingApplication } from "@/features/onboarding/api/onboarding.api";

type PartnerMode = "SELLER" | "RIDER";
type Phase = "account" | "otp" | "credentials" | "application" | "submitted";
type RiderLocation = { latitude: number; longitude: number };

const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-white/20";
const selectClass = "h-10 rounded-lg border border-white/10 bg-[#181818] px-3 text-sm text-white outline-none focus:border-white/20";
const textareaClass = "min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-white/20";

export default function PartnerRegisterForm({ mode }: { mode: PartnerMode }) {
  const isRider = mode === "RIDER";
  const { user, token, isAuthenticated, setAuth } = useAuthStore();
  
  // Decide which phase to start in based on authentication
  const [phase, setPhase] = useState<Phase>(isAuthenticated ? "application" : "account");
  
  const [phone, setPhone] = useState(user?.phone || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<OnboardingApplication | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);

  const title = isRider ? "Delivery Registration" : "Seller Registration";
  const Icon = isRider ? Bike : Store;
  const activeColorClass = isRider ? "bg-cyan-600 hover:bg-cyan-700" : "bg-emerald-600 hover:bg-emerald-700";

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    onboardingApi.status()
      .then((data) => {
        const app = (isRider ? data.latestRiderApplication : data.latestSellerApplication) || null;
        setStatus(app);
        if (app?.status === "PENDING" || app?.status === "APPROVED") {
          setPhase("submitted");
        } else {
          // If logged in but email setup is not completed, we can direct them to credentials or application
          const isTempEmail = user?.email && user.email.endsWith("@quickbihar.local");
          if (isTempEmail) {
            setPhase("credentials");
          } else {
            setPhase("application");
          }
        }
      })
      .catch(() => undefined);
  }, [isAuthenticated, isRider, token, user]);

  const canSubmitApplication = useMemo(
    () => files.length > 0 && isAuthenticated && (!isRider || Boolean(riderLocation)),
    [files.length, isAuthenticated, isRider, riderLocation],
  );

  // Phase 1: Request Mobile OTP
  const submitAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (fullName.trim().length < 2) {
      toast.error("Please enter a valid name (minimum 2 characters).");
      return;
    }
    
    setIsBusy(true);
    try {
      await requestOtpRequest({ target: cleanPhone, isRegistration: true });
      toast.success("OTP sent to your mobile number");
      setPhase("otp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setIsBusy(false);
    }
  };

  // Phase 2: Verify Mobile OTP
  const submitOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    const cleanPhone = phone.trim().replace(/\D/g, "");
    try {
      const response = await verifyOtpRequest({ target: cleanPhone, phone: cleanPhone, otp });
      const { user: authedUser, accessToken, isNewUser } = response.data;
      
      setAuth(authedUser, accessToken);
      toast.success("Mobile number verified successfully!");
      
      if (isNewUser || (authedUser.email && authedUser.email.endsWith("@quickbihar.local"))) {
        setPhase("credentials");
      } else {
        setPhase("application");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP verification failed");
    } finally {
      setIsBusy(false);
    }
  };

  // Phase 3: Setup Email & Password Credentials
  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    
    setIsBusy(true);
    try {
      const res = await updateProfileRequest({ email: email.trim(), password, fullName: fullName.trim() });
      if (res?.data) {
        setAuth(res.data, token || "");
      }
      toast.success("Email and password credentials configured successfully!");
      setPhase("application");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Credential setup failed");
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

  // Phase 4: Submit Onboarding details
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
              sellerType: (text(form, "sellerType") as "CLOTHING" | "FOOD" | "JEWELERY") || "CLOTHING",
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
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <Input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Mobile Number (Primary Identity)</label>
              <Input
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                placeholder="Enter 10-digit number"
                type="tel"
                maxLength={10}
                required
                className={inputClass}
              />
            </div>
            <Button type="submit" disabled={isBusy} className={`${activeColorClass} font-semibold py-6`}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send Verification OTP
            </Button>
          </form>
        )}

        {phase === "otp" && (
          <form onSubmit={submitOtp} className="grid gap-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-300">Verification Code</label>
              <button
                type="button"
                onClick={() => setPhase("account")}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Change details
              </button>
            </div>
            <Input
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              placeholder="6-digit OTP code"
              maxLength={6}
              required
              className="text-center tracking-widest text-lg font-bold bg-white/5 border-white/10 text-white"
            />
            <Button type="submit" disabled={isBusy || otp.length !== 6} className={`${activeColorClass} font-semibold py-6`}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify Mobile OTP
            </Button>
          </form>
        )}

        {phase === "credentials" && (
          <form onSubmit={submitCredentials} className="grid gap-4">
            <p className="text-sm text-gray-400 text-center mb-2">
              Setup an email and password to log in without needing OTP verification in the future.
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                type="email"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password (minimum 6 characters)"
                type="password"
                minLength={6}
                required
                className={inputClass}
              />
            </div>
            <Button type="submit" disabled={isBusy} className={`${activeColorClass} font-semibold py-6`}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Complete Account Setup
            </Button>
          </form>
        )}

        {phase === "application" && (
          <form onSubmit={submitApplication} className="grid gap-4 animate-in fade-in-50">
            {isRider
              ? <RiderFields location={riderLocation} isLocating={isLocating} onCaptureLocation={captureLocation} />
              : <SellerFields />}
            <CommonApplicationFields onFiles={setFiles} />
            <Button type="submit" disabled={isBusy || !canSubmitApplication} className={`${activeColorClass} font-semibold py-6`}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Submit For Approval
            </Button>
          </form>
        )}

        {phase === "submitted" && (
          <div className="grid gap-4 text-center py-6 animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="text-xl font-bold text-white">{status?.status || "Application received"}</div>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
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
    <div className="grid gap-3 md:grid-cols-3">
      <Input name="businessName" placeholder="Business name" required className={inputClass} />
      <select name="sellerType" required className={selectClass} defaultValue="CLOTHING">
        <option value="CLOTHING">Clothing & Apparel</option>
        <option value="FOOD">Food & Grocery</option>
        <option value="JEWELERY">Jewelry & Luxury</option>
      </select>
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
        <Input name="city" placeholder="City" className={inputClass} required />
        <Input name="state" placeholder="State" className={inputClass} required />
        <Input name="pincode" placeholder="Pincode" className={inputClass} required />
        <Input name="upi" placeholder="UPI (optional)" className={inputClass} />
      </div>
      <textarea name="address" placeholder="Full address" className={textareaClass} required />
      <div className="grid gap-3 md:grid-cols-4">
        <Input name="accountNumber" placeholder="Account number" className={inputClass} required />
        <Input name="ifsc" placeholder="IFSC" className={inputClass} required />
        <Input name="bankName" placeholder="Bank name" className={inputClass} required />
        <Input name="pan" placeholder="PAN" className={inputClass} required />
      </div>
      <Input name="aadhar" placeholder="Aadhar" className={inputClass} required />
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-300">Upload Supporting Documents</label>
        <Input type="file" multiple required onChange={(event) => onFiles(Array.from(event.target.files || []))} className={inputClass} />
      </div>
    </>
  );
}

function phaseLabel(phase: Phase, status: OnboardingApplication | null) {
  if (status?.status === "PENDING") return "Your application is waiting for admin approval";
  if (status?.status === "APPROVED") return "Your partner account is approved";
  if (status?.status === "REJECTED") return "Your previous application needs attention";
  if (phase === "otp") return "Verify your phone number before setting up credentials";
  if (phase === "credentials") return "Configure email and password details for your account";
  if (phase === "application") return "Submit partner details and documents for admin approval";
  return "Verify your mobile number to start onboarding";
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
