"use client";

import React, { type FormEvent } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SellerSetupStatus } from "@/features/seller/api/sellerPanel.api";
import {
  useSellerSetupStatusV2,
  useSellerMallMutations,
} from "../hooks/useSellerManagement";
import { StatusTile, Field, text } from "./SellerHelpers";

export function SellerMallPanel({ setup }: { setup?: SellerSetupStatus }) {
  const setupQuery = useSellerSetupStatusV2();
  const currentSetup = setup || setupQuery.data;
  const mallMutations = useSellerMallMutations();

  const submitConnection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mallMutations.requestConnection.mutate({
      mallId: text(form, "mallId"),
      mallUnit: text(form, "mallUnit"),
      mallFloor: text(form, "mallFloor"),
      message: text(form, "message"),
    });
  };

  const submitCreation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mallMutations.requestCreation.mutate({
      name: text(form, "name"),
      address: {
        city: text(form, "city"),
        state: text(form, "state"),
      },
      mallUnit: text(form, "newMallUnit"),
      mallFloor: text(form, "newMallFloor"),
      message: text(form, "newMessage"),
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-white/10 bg-[#1c1c1c] xl:col-span-2">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Mall Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <StatusTile
            title="Current Mall"
            label={
              currentSetup?.seller.mallName
                ? [
                    currentSetup.seller.mallName,
                    currentSetup.seller.mallUnit,
                    currentSetup.seller.mallFloor,
                  ]
                    .filter(Boolean)
                    .join(" / ")
                : "Independent seller"
            }
            active={Boolean(currentSetup?.seller.mallName)}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Connect Existing Mall</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={submitConnection} className="grid gap-3">
            <Field name="mallId" label="Mall ID" required />
            <Field name="mallUnit" label="Unit" />
            <Field name="mallFloor" label="Floor" />
            <Field name="message" label="Message" />
            <Button type="submit">
              <Building2 className="h-4 w-4" />
              Request Link
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Request New Mall</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={submitCreation} className="grid gap-3">
            <Field name="name" label="Mall Name" required />
            <Field name="city" label="City" />
            <Field name="state" label="State" />
            <Field name="newMallUnit" label="Unit" />
            <Field name="newMallFloor" label="Floor" />
            <Field name="newMessage" label="Message" />
            <Button type="submit">
              <Building2 className="h-4 w-4" />
              Request Mall
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
