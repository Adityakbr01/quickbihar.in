"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bike, CheckCircle2, FileUp, Loader2, MapPin, Store, ArrowLeft, X, FileText, UploadCloud, AlertCircle } from "lucide-react";
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

const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-emerald-500 transition-colors";
const errorInputClass = "border-red-500/60 bg-red-500/5 text-white placeholder:text-gray-500 focus:border-red-500 transition-colors";
const selectClass = "h-10 rounded-lg border border-white/10 bg-[#181818] px-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors w-full";
const textareaClass = "min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-emerald-500 transition-colors w-full";

interface ValidationErrors {
  [key: string]: string;
}

export default function PartnerRegisterForm({ mode }: { mode: PartnerMode }) {
  const router = useRouter();
  const isRider = mode === "RIDER";
  const { user, token, isAuthenticated, setAuth } = useAuthStore();
  
  // Decide initial phase based on authentication state
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
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Form Fields State for Application
  const [formFields, setFormFields] = useState({
    // Seller fields
    businessName: "",
    sellerType: "CLOTHING" as "CLOTHING" | "FOOD" | "JEWELERY",
    gstNumber: "",
    // Rider fields
    vehicleType: "",
    vehicleNumber: "",
    licenseNumber: "",
    // Common Address
    address: "",
    city: "",
    state: "",
    pincode: "",
    // Common Bank
    accountNumber: "",
    ifsc: "",
    bankName: "",
    pan: "",
    aadhar: "",
    upi: "",
  });

  const title = isRider ? "Delivery Registration" : "Seller Registration";
  const Icon = isRider ? Bike : Store;
  const activeColorClass = isRider ? "bg-cyan-600 hover:bg-cyan-700" : "bg-emerald-600 hover:bg-emerald-700";

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    onboardingApi.status()
      .then((data) => {
        const app = (isRider ? data.latestRiderApplication : data.latestSellerApplication) || null;
        setStatus(app);
        if (app?.status === "APPROVED") {
          router.replace(isRider ? "/delivery/dashboard" : "/seller/dashboard");
        } else if (app?.status === "PENDING") {
          setPhase("submitted");
        } else {
          const isTempEmail = user?.email && user.email.endsWith("@quickbihar.local");
          if (isTempEmail) {
            setPhase("credentials");
          } else {
            setPhase("application");
          }
        }
      })
      .catch(() => undefined);
  }, [isAuthenticated, isRider, router, token, user]);

  const updateField = (key: string, value: string) => {
    setFormFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[key];
        return newErr;
      });
    }
  };

  const handleFileAdd = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const added = Array.from(newFiles);
    setFiles((prev) => [...prev, ...added]);
    if (errors.files) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr.files;
        return newErr;
      });
    }
  };

  const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Field validation logic before submitting application
  const validateForm = (): boolean => {
    const errs: ValidationErrors = {};

    if (isRider) {
      if (!formFields.vehicleType) errs.vehicleType = "Vehicle type is required";
      if (!formFields.vehicleNumber.trim()) errs.vehicleNumber = "Vehicle number is required";
      if (!formFields.licenseNumber.trim()) errs.licenseNumber = "License number is required";
      if (!riderLocation) errs.location = "Please click 'Use Current Location' to capture your location";
    } else {
      if (!formFields.businessName.trim() || formFields.businessName.trim().length < 2) {
        errs.businessName = "Business name must be at least 2 characters";
      }
      if (formFields.gstNumber.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(formFields.gstNumber.trim())) {
        errs.gstNumber = "Invalid GST number format (15 characters, e.g. 10ABCDE1234F1Z5)";
      }
    }

    // Address validation
    if (!formFields.city.trim()) errs.city = "City is required";
    if (!formFields.state.trim()) errs.state = "State is required";
    if (!formFields.pincode.trim() || !/^\d{6}$/.test(formFields.pincode.trim())) {
      errs.pincode = "Pincode must be exactly 6 digits";
    }
    if (!formFields.address.trim() || formFields.address.trim().length < 5) {
      errs.address = "Full address must be at least 5 characters";
    }

    // Bank Details validation
    if (!formFields.accountNumber.trim() || !/^\d{9,18}$/.test(formFields.accountNumber.trim())) {
      errs.accountNumber = "Account number must be 9 to 18 digits";
    }
    if (!formFields.ifsc.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formFields.ifsc.trim())) {
      errs.ifsc = "Invalid IFSC code (11 characters, e.g. SBIN0001234)";
    }
    if (!formFields.bankName.trim()) errs.bankName = "Bank name is required";

    // PAN & Aadhaar validation
    if (!formFields.pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formFields.pan.trim())) {
      errs.pan = "Invalid PAN number (10 characters, e.g. ABCDE1234F)";
    }
    if (!formFields.aadhar.trim() || !/^\d{12}$/.test(formFields.aadhar.trim().replace(/\s/g, ""))) {
      errs.aadhar = "Aadhaar number must be exactly 12 digits";
    }

    // File validation
    if (files.length === 0) {
      errs.files = "Please upload at least one required supporting document";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

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
        if (errors.location) {
          setErrors((prev) => {
            const newErr = { ...prev };
            delete newErr.location;
            return newErr;
          });
        }
        toast.success("Rider location captured successfully");
      },
      (error) => {
        setIsLocating(false);
        toast.error(error.message || "Location permission failed");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  // Phase 4: Submit Onboarding details with Zod/state validation
  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix highlighted errors in the form before submitting.");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Login required before submitting application");
      return;
    }

    setIsBusy(true);
    try {
      const documents = await onboardingApi.uploadDocuments(files);
      const address = {
        address: formFields.address.trim(),
        city: formFields.city.trim(),
        state: formFields.state.trim(),
        pincode: formFields.pincode.trim(),
      };
      const bankDetails = {
        accountNumber: formFields.accountNumber.trim(),
        ifsc: formFields.ifsc.trim().toUpperCase(),
        bankName: formFields.bankName.trim(),
        pan: formFields.pan.trim().toUpperCase(),
        aadhar: formFields.aadhar.trim().replace(/\s/g, ""),
        ...(formFields.upi.trim() ? { upi: formFields.upi.trim() } : {}),
      };

      const payload = isRider
        ? {
            type: "RIDER" as const,
            documents,
            details: {
              vehicleType: formFields.vehicleType,
              vehicleNumber: formFields.vehicleNumber.trim().toUpperCase(),
              licenseNumber: formFields.licenseNumber.trim().toUpperCase(),
              location: { lat: riderLocation!.latitude, lng: riderLocation!.longitude },
              address,
              bankDetails,
            },
          }
        : {
            type: "SELLER" as const,
            documents,
            details: {
              businessName: formFields.businessName.trim(),
              sellerType: formFields.sellerType,
              ...(formFields.gstNumber.trim() ? { gstNumber: formFields.gstNumber.trim().toUpperCase() } : {}),
              address,
              bankDetails,
            },
          };

      const application = await onboardingApi.apply(payload);
      setStatus(application);
      setPhase("submitted");
      toast.success("Application submitted for admin approval!");
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
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Complete Account Setup
            </Button>
          </form>
        )}

        {phase === "application" && (
          <form onSubmit={submitApplication} className="grid gap-5 animate-in fade-in-50">
            {/* Step Header */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200 mb-0.5">Please provide accurate verification details</p>
                <p>All information provided below will be verified by the admin team before account activation.</p>
              </div>
            </div>

            {/* Role Specific Fields */}
            {isRider ? (
              <RiderFields
                formFields={formFields}
                updateField={updateField}
                errors={errors}
                location={riderLocation}
                isLocating={isLocating}
                onCaptureLocation={captureLocation}
              />
            ) : (
              <SellerFields formFields={formFields} updateField={updateField} errors={errors} />
            )}

            {/* Common Address & Bank Fields */}
            <CommonApplicationFields
              formFields={formFields}
              updateField={updateField}
              errors={errors}
              files={files}
              onFileAdd={handleFileAdd}
              onFileRemove={handleFileRemove}
              isRider={isRider}
            />

            <Button type="submit" disabled={isBusy} className={`${activeColorClass} font-semibold py-6 text-base shadow-lg transition-all`}>
              {isBusy ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <FileUp className="h-5 w-5 mr-2" />}
              Submit Application For Admin Approval
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
            {status?.status === "APPROVED" && (
              <Button
                type="button"
                className={`${activeColorClass} text-white font-semibold py-6 text-base shadow-lg`}
                onClick={() => router.push(isRider ? "/delivery/dashboard" : "/seller/dashboard")}
              >
                Go to {isRider ? "Rider" : "Seller"} Dashboard →
              </Button>
            )}
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

function SellerFields({
  formFields,
  updateField,
  errors,
}: {
  formFields: any;
  updateField: (key: string, val: string) => void;
  errors: ValidationErrors;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-emerald-400 tracking-wider uppercase">1. Business Profile</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-gray-300 block mb-1">Business Name *</label>
          <Input
            value={formFields.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            placeholder="e.g. Bihar Fashion Hub"
            className={errors.businessName ? errorInputClass : inputClass}
          />
          {errors.businessName && <p className="text-xs text-red-400 mt-1">{errors.businessName}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-300 block mb-1">Business Category *</label>
          <select
            value={formFields.sellerType}
            onChange={(e) => updateField("sellerType", e.target.value)}
            className={selectClass}
          >
            <option value="CLOTHING">Clothing & Apparel</option>
            <option value="FOOD">Food & Grocery</option>
            <option value="JEWELERY">Jewelry & Luxury</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-300 block mb-1">GST Number (Optional)</label>
          <Input
            value={formFields.gstNumber}
            onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
            placeholder="15-digit GSTIN (e.g. 10ABCDE1234F1Z5)"
            maxLength={15}
            className={errors.gstNumber ? errorInputClass : inputClass}
          />
          {errors.gstNumber && <p className="text-xs text-red-400 mt-1">{errors.gstNumber}</p>}
        </div>
      </div>
    </div>
  );
}

function RiderFields({
  formFields,
  updateField,
  errors,
  location,
  isLocating,
  onCaptureLocation,
}: {
  formFields: any;
  updateField: (key: string, val: string) => void;
  errors: ValidationErrors;
  location: RiderLocation | null;
  isLocating: boolean;
  onCaptureLocation: () => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-cyan-400 tracking-wider uppercase">1. Vehicle & Driver Details</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-gray-300 block mb-1">Vehicle Type *</label>
          <select
            value={formFields.vehicleType}
            onChange={(e) => updateField("vehicleType", e.target.value)}
            className={errors.vehicleType ? `${selectClass} border-red-500/60` : selectClass}
          >
            <option value="">Select vehicle type</option>
            <option value="BIKE">Motorcycle / Bike</option>
            <option value="SCOOTER">Scooter</option>
            <option value="CYCLE">Bicycle</option>
            <option value="CAR">Car / Van</option>
          </select>
          {errors.vehicleType && <p className="text-xs text-red-400 mt-1">{errors.vehicleType}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-300 block mb-1">Vehicle Number *</label>
          <Input
            value={formFields.vehicleNumber}
            onChange={(e) => updateField("vehicleNumber", e.target.value.toUpperCase())}
            placeholder="e.g. BR01AB1234"
            className={errors.vehicleNumber ? errorInputClass : inputClass}
          />
          {errors.vehicleNumber && <p className="text-xs text-red-400 mt-1">{errors.vehicleNumber}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-300 block mb-1">Driving License Number *</label>
          <Input
            value={formFields.licenseNumber}
            onChange={(e) => updateField("licenseNumber", e.target.value.toUpperCase())}
            placeholder="e.g. BR0120230001234"
            className={errors.licenseNumber ? errorInputClass : inputClass}
          />
          {errors.licenseNumber && <p className="text-xs text-red-400 mt-1">{errors.licenseNumber}</p>}
        </div>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border ${errors.location ? "border-red-500/60 bg-red-500/5" : "border-white/10 bg-white/[0.03]"} p-3.5`}>
        <div className="grid gap-1">
          <span className="text-sm font-medium text-white">Current Base Location *</span>
          <span className="text-xs text-gray-400">
            {location ? `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}` : "Location not captured yet"}
          </span>
          {errors.location && <p className="text-xs text-red-400">{errors.location}</p>}
        </div>
        <Button type="button" variant="outline" disabled={isLocating} onClick={onCaptureLocation} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <MapPin className="h-4 w-4 mr-1.5 text-cyan-400" />}
          {location ? "Update Location" : "Use Current Location"}
        </Button>
      </div>
    </div>
  );
}

function CommonApplicationFields({
  formFields,
  updateField,
  errors,
  files,
  onFileAdd,
  onFileRemove,
  isRider,
}: {
  formFields: any;
  updateField: (key: string, val: string) => void;
  errors: ValidationErrors;
  files: File[];
  onFileAdd: (files: FileList | null) => void;
  onFileRemove: (index: number) => void;
  isRider: boolean;
}) {
  return (
    <>
      {/* Address Details */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">2. Address & Location</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">City *</label>
            <Input
              value={formFields.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="e.g. Patna"
              className={errors.city ? errorInputClass : inputClass}
            />
            {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">State *</label>
            <Input
              value={formFields.state}
              onChange={(e) => updateField("state", e.target.value)}
              placeholder="e.g. Bihar"
              className={errors.state ? errorInputClass : inputClass}
            />
            {errors.state && <p className="text-xs text-red-400 mt-1">{errors.state}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Pincode *</label>
            <Input
              value={formFields.pincode}
              onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit pincode"
              maxLength={6}
              className={errors.pincode ? errorInputClass : inputClass}
            />
            {errors.pincode && <p className="text-xs text-red-400 mt-1">{errors.pincode}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-300 block mb-1">Full Shop / Residence Address *</label>
          <textarea
            value={formFields.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Enter complete street address, landmark, building name, floor number..."
            className={errors.address ? `${textareaClass} border-red-500/60 bg-red-500/5` : textareaClass}
          />
          {errors.address && <p className="text-xs text-red-400 mt-1">{errors.address}</p>}
        </div>
      </div>

      {/* Bank & Identification Details */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">3. Payout Bank Account & Government ID</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Account Number *</label>
            <Input
              value={formFields.accountNumber}
              onChange={(e) => updateField("accountNumber", e.target.value.replace(/\D/g, ""))}
              placeholder="9 to 18 digit account number"
              className={errors.accountNumber ? errorInputClass : inputClass}
            />
            {errors.accountNumber && <p className="text-xs text-red-400 mt-1">{errors.accountNumber}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">IFSC Code *</label>
            <Input
              value={formFields.ifsc}
              onChange={(e) => updateField("ifsc", e.target.value.toUpperCase())}
              placeholder="e.g. SBIN0001234"
              maxLength={11}
              className={errors.ifsc ? errorInputClass : inputClass}
            />
            {errors.ifsc && <p className="text-xs text-red-400 mt-1">{errors.ifsc}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Bank Name *</label>
            <Input
              value={formFields.bankName}
              onChange={(e) => updateField("bankName", e.target.value)}
              placeholder="e.g. State Bank of India"
              className={errors.bankName ? errorInputClass : inputClass}
            />
            {errors.bankName && <p className="text-xs text-red-400 mt-1">{errors.bankName}</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">PAN Card Number *</label>
            <Input
              value={formFields.pan}
              onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
              placeholder="10-digit PAN (e.g. ABCDE1234F)"
              maxLength={10}
              className={errors.pan ? errorInputClass : inputClass}
            />
            {errors.pan && <p className="text-xs text-red-400 mt-1">{errors.pan}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Aadhaar Card Number *</label>
            <Input
              value={formFields.aadhar}
              onChange={(e) => updateField("aadhar", e.target.value.replace(/\D/g, ""))}
              placeholder="12-digit Aadhaar number"
              maxLength={12}
              className={errors.aadhar ? errorInputClass : inputClass}
            />
            {errors.aadhar && <p className="text-xs text-red-400 mt-1">{errors.aadhar}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">UPI ID (Optional)</label>
            <Input
              value={formFields.upi}
              onChange={(e) => updateField("upi", e.target.value)}
              placeholder="e.g. name@upi or mobile@paytm"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Supporting Documents Upload with Explicit Guide */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">4. Upload Verification Documents</h3>

        {/* Required Documents Instruction Box */}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
          <p className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
            <UploadCloud className="h-4 w-4 text-emerald-400" /> Required Verification Documents Checklist:
          </p>
          <ul className="text-xs text-gray-400 space-y-1 pl-5 list-disc">
            {isRider ? (
              <>
                <li><strong>PAN Card</strong> (Clear photo or PDF)</li>
                <li><strong>Aadhaar Card</strong> (Front & Back photo)</li>
                <li><strong>Driving License (DL)</strong> (Valid copy)</li>
                <li><strong>Vehicle RC Certificate</strong> (Registration copy)</li>
              </>
            ) : (
              <>
                <li><strong>PAN Card</strong> of Proprietor / Business</li>
                <li><strong>Aadhaar Card</strong> (Front & Back photo)</li>
                <li><strong>GST Certificate</strong> (If registered)</li>
                <li><strong>Bank Passbook / Cancelled Cheque</strong> (Showing Account No. & IFSC)</li>
              </>
            )}
          </ul>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-300 block mb-1.5">Select Files to Upload (Images or PDF) *</label>
          <Input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => onFileAdd(e.target.files)}
            className={errors.files ? errorInputClass : inputClass}
          />
          {errors.files && <p className="text-xs text-red-400 mt-1">{errors.files}</p>}
        </div>

        {/* Selected Files List Preview */}
        {files.length > 0 && (
          <div className="space-y-2 mt-2">
            <p className="text-xs font-medium text-gray-400">Attached Documents ({files.length}):</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFileRemove(idx)}
                    className="text-gray-400 hover:text-red-400 p-0.5 rounded transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
