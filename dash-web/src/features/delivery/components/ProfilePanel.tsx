import { FormEvent } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DeliveryDashboardResponse } from "@/features/delivery/api/delivery.api";
import { inputClass, textareaClass, optionalText } from "./DeliveryHelpers";

export function ProfilePanel({
  profile,
  onSubmit,
  isPending,
}: {
  profile: DeliveryDashboardResponse["profile"] | undefined;
  onSubmit: (payload: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      phone: optionalText(form, "phone"),
      vehicleType: optionalText(form, "vehicleType"),
      vehicleNumber: optionalText(form, "vehicleNumber"),
      licenseNumber: optionalText(form, "licenseNumber"),
      address: {
        address: optionalText(form, "address") || "",
        city: optionalText(form, "city") || "",
        state: optionalText(form, "state") || "",
        pincode: optionalText(form, "pincode") || "",
      },
      bankDetails: {
        accountNumber: optionalText(form, "accountNumber") || "",
        ifsc: optionalText(form, "ifsc") || "",
        bankName: optionalText(form, "bankName") || "",
        pan: optionalText(form, "pan") || "",
        upi: optionalText(form, "upi") || "",
        aadhar: optionalText(form, "aadhar") || "",
      },
    });
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <UserRound className="h-4 w-4 text-cyan-300" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <section className="grid gap-3 md:grid-cols-3">
            <Input name="phone" defaultValue={profile?.phone || ""} placeholder="Phone" className={inputClass} />
            <Input name="vehicleType" defaultValue={profile?.vehicleType || ""} placeholder="Vehicle type" className={inputClass} />
            <Input name="vehicleNumber" defaultValue={profile?.vehicleNumber || ""} placeholder="Vehicle number" className={inputClass} />
            <Input name="licenseNumber" defaultValue={profile?.licenseNumber || ""} placeholder="License number" className={inputClass} />
            <Input name="city" defaultValue={profile?.address?.city || ""} placeholder="City" className={inputClass} />
            <Input name="state" defaultValue={profile?.address?.state || ""} placeholder="State" className={inputClass} />
            <Input name="pincode" defaultValue={profile?.address?.pincode || ""} placeholder="Pincode" className={inputClass} />
            <Input name="upi" defaultValue={profile?.bankDetails?.upi || ""} placeholder="UPI" className={inputClass} />
          </section>
          <textarea name="address" defaultValue={profile?.address?.address || ""} placeholder="Address" className={textareaClass} />
          <section className="grid gap-3 md:grid-cols-4">
            <Input name="accountNumber" defaultValue={profile?.bankDetails?.accountNumber || ""} placeholder="Account number" className={inputClass} />
            <Input name="ifsc" defaultValue={profile?.bankDetails?.ifsc || ""} placeholder="IFSC" className={inputClass} />
            <Input name="bankName" defaultValue={profile?.bankDetails?.bankName || ""} placeholder="Bank name" className={inputClass} />
            <Input name="pan" defaultValue={profile?.bankDetails?.pan || ""} placeholder="PAN" className={inputClass} />
            <Input name="aadhar" defaultValue={profile?.bankDetails?.aadhar || ""} placeholder="Aadhar" className={inputClass} />
          </section>
          <Button type="submit" disabled={isPending} className="w-fit bg-cyan-600 hover:bg-cyan-700">
            <UserRound className="h-4 w-4" />
            Save Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
