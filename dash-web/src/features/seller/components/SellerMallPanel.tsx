"use client";

import React, { type FormEvent, useState, useEffect } from "react";
import { Building2, MapPin, Phone, Mail, User, Info, Check, Image as ImageIcon, Trash2, Edit2, LogOut, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  useSellerSetupStatusV2,
  useSellerMallMutations,
  useSellerMall,
} from "../hooks/useSellerManagement";
import { usePublicMalls } from "../hooks/useSellerPanel";
import { StatusTile, Field, text, labelClass, selectClass, inputClass, StatusBadge } from "./SellerHelpers";

export function SellerMallPanel({ setup }: { setup?: any }) {
  const setupQuery = useSellerSetupStatusV2();
  const currentSetup = setup || setupQuery.data;
  const mallMutations = useSellerMallMutations();
  const { data: malls, isLoading: mallsLoading } = usePublicMalls();
  const { data: mallData, isLoading: mallDataLoading } = useSellerMall();

  const [selectedMallId, setSelectedMallId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // Geolocation Coordinate Capture
  const [latVal, setLatVal] = useState("");
  const [lngVal, setLngVal] = useState("");

  // Existing Images management state
  const [existingImages, setExistingImages] = useState<any[]>([]);

  const mallsList = mallData?.malls || [];
  const activeMall = selectedMallId && selectedMallId !== "new" 
    ? mallsList.find((m: any) => m._id === selectedMallId) 
    : null;

  useEffect(() => {
    if (activeMall?.images) {
      setExistingImages(activeMall.images);
    } else {
      setExistingImages([]);
    }
  }, [activeMall]);

  const captureLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatVal(String(position.coords.latitude));
        setLngVal(String(position.coords.longitude));
        setIsLocating(false);
        toast.success("Exact coordinates retrieved successfully!");
      },
      (error) => {
        setIsLocating(false);
        toast.error("Could not fetch exact coordinates. Allow location permission and try again.");
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const submitConnection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mallMutations.requestConnection.mutate({
      mallId: text(form, "mallId"),
      mallUnit: text(form, "mallUnit"),
      mallFloor: text(form, "mallFloor"),
      message: text(form, "message"),
    }, {
      onSuccess: () => {
        setSelectedMallId(null);
      }
    });
  };

  const submitCreation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newFiles = (event.currentTarget.querySelector('input[name="images"]') as HTMLInputElement)?.files;
    const newFilesArray = newFiles ? Array.from(newFiles) : [];

    if (newFilesArray.length < 1) {
      toast.error("Please upload at least 1 image for your mall.");
      return;
    }
    if (newFilesArray.length > 5) {
      toast.error("Please upload a maximum of 5 images.");
      return;
    }

    const logoFile = form.get("logo") as File;
    const coverImageFile = form.get("coverImage") as File;
    const isMobileVisible = (event.currentTarget.querySelector('input[name="isMobileVisible"]') as HTMLInputElement)?.checked;

    mallMutations.requestCreation.mutate({
      name: text(form, "name"),
      description: text(form, "description"),
      address: {
        line1: text(form, "line1"),
        city: text(form, "city"),
        state: text(form, "state"),
        pincode: text(form, "pincode"),
        latitude: latVal ? parseFloat(latVal) : undefined,
        longitude: lngVal ? parseFloat(lngVal) : undefined,
      },
      contact: {
        managerName: text(form, "managerName"),
        email: text(form, "email"),
      },
      logoUrl: text(form, "logoUrl"),
      coverImageUrl: text(form, "coverImageUrl"),
      logo: logoFile && logoFile.size > 0 ? logoFile : undefined,
      coverImage: coverImageFile && coverImageFile.size > 0 ? coverImageFile : undefined,
      newImages: newFilesArray,
      mallUnit: text(form, "newMallUnit"),
      mallFloor: text(form, "newMallFloor"),
      message: text(form, "newMessage"),
      mobileNumber: text(form, "mobileNumber"),
      isMobileVisible,
    }, {
      onSuccess: () => {
        setSelectedMallId(null);
      }
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    if (!activeMall) return;
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newFiles = (event.currentTarget.querySelector('input[name="newImages"]') as HTMLInputElement)?.files;
    const newFilesArray = newFiles ? Array.from(newFiles) : [];

    const totalCount = existingImages.length + newFilesArray.length;
    if (totalCount < 1) {
      toast.error("Please provide at least 1 image for your mall.");
      return;
    }
    if (totalCount > 5) {
      toast.error("Please upload a maximum of 5 images.");
      return;
    }

    const logoFile = form.get("logo") as File;
    const coverImageFile = form.get("coverImage") as File;
    const isMobileVisible = (event.currentTarget.querySelector('input[name="isMobileVisible"]') as HTMLInputElement)?.checked;

    mallMutations.updateMall.mutate({
      id: activeMall._id,
      payload: {
        name: text(form, "name"),
        description: text(form, "description"),
        address: {
          line1: text(form, "line1"),
          city: text(form, "city"),
          state: text(form, "state"),
          pincode: text(form, "pincode"),
          latitude: latVal ? parseFloat(latVal) : undefined,
          longitude: lngVal ? parseFloat(lngVal) : undefined,
        },
        contact: {
          managerName: text(form, "managerName"),
          email: text(form, "email"),
        },
        logoUrl: text(form, "logoUrl"),
        coverImageUrl: text(form, "coverImageUrl"),
        logo: logoFile && logoFile.size > 0 ? logoFile : undefined,
        coverImage: coverImageFile && coverImageFile.size > 0 ? coverImageFile : undefined,
        images: existingImages,
        newImages: newFilesArray,
        mobileNumber: text(form, "mobileNumber"),
        isMobileVisible,
      }
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const startEdit = () => {
    if (activeMall) {
      setLatVal(activeMall.address?.latitude ? String(activeMall.address.latitude) : "");
      setLngVal(activeMall.address?.longitude ? String(activeMall.address.longitude) : "");
      setExistingImages(activeMall.images || []);
    }
    setIsEditing(true);
  };

  const handleDisconnect = (mallId: string) => {
    if (window.confirm("Are you sure you want to delete this mall request/association? This cannot be undone.")) {
      mallMutations.deleteMall.mutate(mallId, {
        onSuccess: () => {
          setSelectedMallId(null);
        }
      });
    }
  };

  if (mallDataLoading) {
    return <div className="py-10 text-center text-sm text-gray-400">Loading Mall Panel...</div>;
  }

  // 1. Grid List of Seller Malls
  if (selectedMallId === null) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="h-6 w-6 text-emerald-300" />
              My Malls
            </h1>
            <p className="text-xs text-gray-400 mt-1">Manage your linked malls and creation requests</p>
          </div>
          <Button onClick={() => setSelectedMallId("new")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
            + Add Mall
          </Button>
        </div>

        {mallsList.length === 0 ? (
          <Card className="border-white/10 bg-[#1c1c1c] p-8 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
              <div className="p-4 rounded-full bg-emerald-950/40 border border-emerald-800/30 text-emerald-400">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">No malls linked or requested yet</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                  To showcase your products in a specific mall or register a new one, connect or request a mall.
                </p>
              </div>
              <Button onClick={() => setSelectedMallId("new")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                Get Started
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mallsList.map((mall: any) => (
              <Card key={mall._id} className="border-white/10 bg-[#1c1c1c] hover:border-emerald-500/30 transition duration-200">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <img 
                      src={mall.logoUrl || "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=100&h=100&fit=crop&q=80"} 
                      className="h-10 w-10 object-cover rounded border border-white/10 bg-white/5" 
                      alt={mall.name} 
                    />
                    <div>
                      <h3 className="font-semibold text-white text-sm line-clamp-1">{mall.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{mall.address?.city || "N/A"}, {mall.address?.state || ""}</p>
                    </div>
                  </div>
                  <StatusBadge label={mall.status || "PENDING"} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-gray-400 line-clamp-2 min-h-8">
                    {mall.description || "No description provided."}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-gray-500">
                      Stores: {mall.totalStores || 0} | Rating: {mall.rating || "4.5"}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedMallId(mall._id)}
                      className="border-white/10 hover:bg-white/5 text-xs text-gray-300 hover:text-white"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. Mall Detail Screen
  if (activeMall && !isEditing) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" className="border-white/10 text-gray-300" onClick={() => setSelectedMallId(null)}>
            ← Back to Malls
          </Button>
        </div>
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
            <div>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-300" />
                {activeMall.name}
              </CardTitle>
              <p className="text-xs text-gray-400 mt-1">{activeMall.description || "No tagline / description available"}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label={activeMall.status || "PENDING"} />
              <Button size="sm" variant="outline" className="border-white/10 text-gray-300 hover:text-white" onClick={startEdit}>
                <Edit2 className="h-4 w-4 mr-1.5" />
                Edit Mall
              </Button>
              <Button size="sm" variant="destructive" className="bg-red-950/40 border border-red-800/30 text-red-200 hover:bg-red-900/40" onClick={() => handleDisconnect(activeMall._id)}>
                <LogOut className="h-4 w-4 mr-1.5" />
                Disconnect
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {activeMall.rejectionReason && activeMall.status === "REJECTED" && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
                <h4 className="font-semibold mb-1">Mall Creation Rejected</h4>
                <p>{activeMall.rejectionReason}</p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Address & Location</h3>
                  <div className="space-y-1 text-sm text-white">
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="h-4 w-4 shrink-0 text-emerald-300" />
                      <span>{activeMall.address?.line1 || "No Address line"}, {activeMall.address?.city || ""}, {activeMall.address?.state || ""} {activeMall.address?.pincode ? `- ${activeMall.address.pincode}` : ""}</span>
                    </div>
                    {activeMall.address?.latitude && activeMall.address?.longitude && (
                      <div className="flex items-center gap-2 text-gray-400 pl-6 pt-1">
                        <Navigation className="h-3.5 w-3.5 text-blue-400" />
                        <span>GPS: {activeMall.address.latitude}, {activeMall.address.longitude}</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${activeMall.address.latitude},${activeMall.address.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 underline hover:text-blue-300 ml-2"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contact Details</h3>
                  <div className="space-y-1 text-sm text-white">
                    {activeMall.contact?.managerName && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <User className="h-4 w-4 text-emerald-300" />
                        <span>Manager: {activeMall.contact.managerName}</span>
                      </div>
                    )}
                    {activeMall.contact?.phone && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="h-4 w-4 text-emerald-300" />
                        <span>Phone: {activeMall.contact.phone}</span>
                      </div>
                    )}
                    {activeMall.contact?.email && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Mail className="h-4 w-4 text-emerald-300" />
                        <span>Email: {activeMall.contact.email}</span>
                      </div>
                    )}
                    {activeMall.mobileNumber && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="h-4 w-4 text-emerald-300" />
                        <span>
                          Mobile: {activeMall.mobileNumber} 
                          <span className="text-[10px] text-gray-500 ml-2">
                            ({activeMall.isMobileVisible !== false ? "Visible on app" : "Hidden on app"})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {currentSetup?.seller && (currentSetup.seller.mallUnit || currentSetup.seller.mallFloor) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Your Shop Location</h3>
                    <p className="text-sm text-white pl-6">
                      Unit: <span className="font-semibold text-emerald-300">{currentSetup.seller.mallUnit || "N/A"}</span> | Floor: <span className="font-semibold text-emerald-300">{currentSetup.seller.mallFloor || "N/A"}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  {activeMall.logoUrl && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Logo</h4>
                      <img src={activeMall.logoUrl} className="h-20 w-20 object-cover rounded-lg border border-white/10" alt="Logo" />
                    </div>
                  )}
                  {activeMall.coverImageUrl && (
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cover</h4>
                      <img src={activeMall.coverImageUrl} className="h-20 w-full object-cover rounded-lg border border-white/10" alt="Cover" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mall Images ({activeMall.images?.length || 0})</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeMall.images && activeMall.images.length > 0 ? (
                      activeMall.images.map((img: any, idx: number) => (
                        <img key={idx} src={img.url} className="h-16 w-16 object-cover rounded-lg border border-white/10" alt="Mall" />
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No gallery images uploaded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Mall Edit Screen
  if (activeMall && isEditing) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" className="border-white/10 text-gray-300" onClick={() => setIsEditing(false)}>
            ← Cancel Edit
          </Button>
        </div>
        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-300" />
              Edit Mall Details
            </CardTitle>
            <p className="text-xs text-amber-300 font-medium">⚠️ Note: Changing any details will reset the mall status to PENDING and require admin re-approval.</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={submitEdit} className="grid gap-4">
              <Field name="name" label="Mall Name" defaultValue={activeMall.name} required />
              <label className={labelClass}>
                <span>Description / Tagline</span>
                <textarea
                  name="description"
                  defaultValue={activeMall.description || ""}
                  placeholder="Tagline / Description"
                  className={inputClass + " h-20 py-2 px-3 rounded-lg border border-white/10 text-sm"}
                />
              </label>

              <div className="border-t border-white/5 pt-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Address</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Field name="line1" label="Address Line 1" defaultValue={activeMall.address?.line1} />
                  <Field name="pincode" label="Pincode" defaultValue={activeMall.address?.pincode} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Field name="city" label="City" defaultValue={activeMall.address?.city} />
                  <Field name="state" label="State" defaultValue={activeMall.address?.state} />
                </div>

                <div className="rounded-lg border border-yellow-800/30 bg-yellow-950/20 p-3 mb-3 text-xs text-yellow-200 flex flex-col gap-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Info className="h-4 w-4 shrink-0 text-yellow-400" />
                    Exact Coordinate Guidelines
                  </span>
                  <p>
                    Please add exact location in lat,long. If you don't know this, go to your mall and tap on <strong>Find My Exact Location</strong> with high accuracy.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={captureLocation}
                    disabled={isLocating}
                    className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold mt-1 self-start"
                  >
                    <Navigation className="h-3.5 w-3.5 mr-1" />
                    {isLocating ? "Locating..." : "Find My Exact Location"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className={labelClass}>
                    <span>Latitude</span>
                    <input
                      type="text"
                      name="latitude"
                      value={latVal}
                      onChange={(e) => setLatVal(e.target.value)}
                      className={inputClass + " h-9 px-2 rounded border border-white/10 text-xs"}
                    />
                  </label>
                  <label className={labelClass}>
                    <span>Longitude</span>
                    <input
                      type="text"
                      name="longitude"
                      value={lngVal}
                      onChange={(e) => setLngVal(e.target.value)}
                      className={inputClass + " h-9 px-2 rounded border border-white/10 text-xs"}
                    />
                  </label>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Contact Info</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Field name="managerName" label="Manager Name" defaultValue={activeMall.contact?.managerName} />
                  <Field name="email" label="Email" type="email" defaultValue={activeMall.contact?.email} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 items-center">
                  <Field name="mobileNumber" label="Mobile Number (required)" defaultValue={activeMall.mobileNumber || ""} required />
                  <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer mt-6">
                    <input
                      type="checkbox"
                      name="isMobileVisible"
                      defaultChecked={activeMall.isMobileVisible !== false}
                      className="h-4 w-4 rounded border-white/10 bg-white/5"
                    />
                    Show Mobile Number in Mall Detail Page
                  </label>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Media & Images</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Field name="logoUrl" label="Logo Image URL" defaultValue={activeMall.logoUrl} />
                  <Field name="coverImageUrl" label="Cover Image URL" defaultValue={activeMall.coverImageUrl} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <label className={labelClass}>
                    <span>Upload Logo File</span>
                    <input type="file" name="logo" accept="image/*" className={inputClass + " py-1 px-2 rounded border border-white/10 text-xs"} />
                  </label>
                  <label className={labelClass}>
                    <span>Upload Cover Image File</span>
                    <input type="file" name="coverImage" accept="image/*" className={inputClass + " py-1 px-2 rounded border border-white/10 text-xs"} />
                  </label>
                </div>

                <div className="space-y-3 pt-2">
                  {existingImages.length > 0 && (
                    <div className="space-y-1">
                      <span className={labelClass}>Current Gallery Images ({existingImages.length})</span>
                      <div className="flex flex-wrap gap-2">
                        {existingImages.map((img, idx) => (
                          <div key={idx} className="relative group border border-white/10 rounded overflow-hidden">
                            <img src={img.url} className="h-16 w-16 object-cover" alt="Mall item" />
                            <button
                              type="button"
                              onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))}
                              className="absolute inset-0 bg-black/75 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150 text-red-400 font-semibold"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className={labelClass}>
                    <span>Upload New Images (Max 5 images total)</span>
                    <input
                      type="file"
                      name="newImages"
                      multiple
                      accept="image/*"
                      className={inputClass + " py-1 px-2 rounded border border-white/10 text-xs"}
                    />
                    <span className="text-[10px] text-gray-500 normal-case">Note: Select multiple files at once. Total images (existing + new) must be between 1 and 5.</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                <Button type="submit" className="flex-1" disabled={mallMutations.updateMall.isPending}>
                  {mallMutations.updateMall.isPending ? "Saving changes..." : "Save Details"}
                </Button>
                <Button type="button" variant="outline" className="border-white/10 text-white" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Connect / Request Mall Forms Screen (when selectedMallId === "new")
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" className="border-white/10 text-gray-300" onClick={() => setSelectedMallId(null)}>
          ← Back to Malls
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/10 bg-[#1c1c1c] xl:col-span-2">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Mall Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
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
            {currentSetup?.seller.mallRequest && (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs font-medium uppercase text-gray-500">Mall Request Status</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {currentSetup.seller.mallRequest.mallName || "New Mall Request"}
                      {currentSetup.seller.mallRequest.mallUnit && ` (Unit: ${currentSetup.seller.mallRequest.mallUnit})`}
                    </div>
                    {currentSetup.seller.mallRequest.rejectionReason && (
                      <div className="text-xs text-red-400 mt-1 font-semibold">
                        Rejection Reason: {currentSetup.seller.mallRequest.rejectionReason}
                      </div>
                    )}
                  </div>
                  <StatusBadge label={currentSetup.seller.mallRequest.status || "PENDING"} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1c1c1c]">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base text-white">Connect Existing Mall</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={submitConnection} className="grid gap-3">
              <label className={labelClass}>
                <span className="flex items-center gap-2">
                  Select Mall
                  <span className="text-[10px] normal-case text-red-300">Required</span>
                </span>
                <select
                  name="mallId"
                  required
                  className={selectClass}
                  disabled={mallsLoading}
                >
                  <option value="">
                    {mallsLoading ? "Loading malls..." : "Choose a Mall..."}
                  </option>
                  {malls?.map((mall: any) => (
                    <option key={mall.id || mall._id} value={mall.id || mall._id}>
                      {mall.name} ({mall.location})
                    </option>
                  ))}
                </select>
              </label>
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
              <label className={labelClass}>
                <span>Description / Tagline</span>
                <textarea
                  name="description"
                  placeholder="Tagline / Description"
                  className={inputClass + " h-20 py-2 px-3 rounded-lg border border-white/10 text-sm"}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Field name="line1" label="Address Line 1" />
                <Field name="pincode" label="Pincode" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field name="city" label="City" />
                <Field name="state" label="State" />
              </div>

              <div className="rounded-lg border border-yellow-800/30 bg-yellow-950/20 p-3 text-xs text-yellow-200 flex flex-col gap-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <Info className="h-4 w-4 shrink-0 text-yellow-400" />
                  Exact Coordinate Guidelines
                </span>
                <p>
                  Please add exact location in lat,long. If you don't know this, go to your mall and tap on <strong>Find My Exact Location</strong> with high accuracy.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={captureLocation}
                  disabled={isLocating}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold mt-1 self-start"
                >
                  <Navigation className="h-3.5 w-3.5 mr-1" />
                  {isLocating ? "Locating..." : "Find My Exact Location"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>
                  <span>Latitude</span>
                  <input
                    type="text"
                    name="latitude"
                    value={latVal}
                    onChange={(e) => setLatVal(e.target.value)}
                    className={inputClass + " h-9 px-2 rounded border border-white/10 text-xs"}
                  />
                </label>
                <label className={labelClass}>
                  <span>Longitude</span>
                  <input
                    type="text"
                    name="longitude"
                    value={lngVal}
                    onChange={(e) => setLngVal(e.target.value)}
                    className={inputClass + " h-9 px-2 rounded border border-white/10 text-xs"}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field name="managerName" label="Manager Name" />
                <Field name="email" label="Email" type="email" />
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <Field name="mobileNumber" label="Mobile Number (required)" required />
                <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer mt-6">
                  <input
                    type="checkbox"
                    name="isMobileVisible"
                    defaultChecked={true}
                    className="h-4 w-4 rounded border-white/10 bg-white/5"
                  />
                  Show Mobile Number in Mall Detail Page
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field name="logoUrl" label="Logo Image URL" />
                <Field name="coverImageUrl" label="Cover Image URL" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>
                  <span>Logo File Upload</span>
                  <input type="file" name="logo" accept="image/*" className={inputClass + " py-1 px-2 rounded border border-white/10 text-xs"} />
                </label>
                <label className={labelClass}>
                  <span>Cover Image File Upload</span>
                  <input type="file" name="coverImage" accept="image/*" className={inputClass + " py-1 px-2 rounded border border-white/10 text-xs"} />
                </label>
              </div>

              <label className={labelClass}>
                <span className="flex items-center gap-2">
                  Upload Mall Photos
                  <span className="text-[10px] normal-case text-red-300">Required (1-5 images)</span>
                </span>
                <input
                  type="file"
                  name="images"
                  multiple
                  required
                  accept="image/*"
                  className={inputClass + " py-1 px-2 rounded border border-white/10 text-xs"}
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <Field name="newMallUnit" label="Unit" />
                <Field name="newMallFloor" label="Floor" />
              </div>
              <Field name="newMessage" label="Message" />
              <Button type="submit" disabled={mallMutations.requestCreation.isPending}>
                <Building2 className="h-4 w-4" />
                {mallMutations.requestCreation.isPending ? "Submitting..." : "Request Mall"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
