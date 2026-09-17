"use client";

import { type FormEvent, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Save,
  Store,
  Navigation,
  Info,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { inputClass, selectClass } from "./types";
import { optionalValue, formatDate } from "./utils";
import { StatusBadge } from "./badges";
import { SellerManagementPanel } from "@/features/dashboard/components/sellers/SellerManagementPanel";
import {
  useCreateMall,
  useUpdateMall,
  useDeactivateMall,
  useReviewMallRequest,
  useReviewMallCreation,
  useAssignSellerMall,
} from "@/features/dashboard/hooks/useAdminManagement";
import type {
  Mall,
  ManagedPerson,
  SellerMallRequest,
} from "@/features/dashboard/api/adminManagement.api";

export function SellerMallSection({
  sellers,
  sellersLoading,
  malls,
  mallsLoading,
  mallRequests,
  mallRequestsLoading,
  mallCreationRequests,
  mallCreationRequestsLoading,
  topMalls,
}: {
  sellers: ManagedPerson[];
  sellersLoading: boolean;
  malls: Mall[];
  mallsLoading: boolean;
  mallRequests: SellerMallRequest[];
  mallRequestsLoading: boolean;
  mallCreationRequests: Mall[];
  mallCreationRequestsLoading: boolean;
  topMalls: Mall[];
}) {
  const [tab, setTab] = useState<"directory" | "sellers">("directory");

  return (
    <div className="space-y-4 col-span-full">
      <div className="flex border-b border-white/10 pb-px gap-2">
        <button
          onClick={() => setTab("directory")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            tab === "directory"
              ? "border-emerald-500 text-emerald-400 font-semibold"
              : "border-transparent text-gray-400 hover:text-white",
          )}
        >
          Malls & Assignments
        </button>
        <button
          onClick={() => setTab("sellers")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            tab === "sellers"
              ? "border-emerald-500 text-emerald-400 font-semibold"
              : "border-transparent text-gray-400 hover:text-white",
          )}
        >
          Seller Accounts CRUD
        </button>
      </div>

      {tab === "directory" ? (
        <div className="animate-in-fade-slide grid gap-4 xl:grid-cols-[380px_1fr]">
          <MallCreatePanel />
          <MallRequestsPanel
            requests={mallRequests}
            isLoading={mallRequestsLoading}
          />
          <MallCreationRequestsPanel
            requests={mallCreationRequests}
            isLoading={mallCreationRequestsLoading}
          />
          <TopMallsPanel malls={topMalls} />
          <MallDirectory malls={malls} isLoading={mallsLoading} />
          <SellerMallAssignments
            sellers={sellers}
            malls={malls}
            isLoading={sellersLoading}
          />
        </div>
      ) : (
        <div className="animate-in-fade-slide">
          <SellerManagementPanel />
        </div>
      )}
    </div>
  );
}

function MallRequestsPanel({
  requests,
  isLoading,
}: {
  requests: SellerMallRequest[];
  isLoading: boolean;
}) {
  const reviewMallRequest = useReviewMallRequest();

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          Mall Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && (
          <div className="px-4 py-10 text-sm text-gray-400">
            Loading mall requests...
          </div>
        )}
        {!isLoading && !requests.length && (
          <div className="px-4 py-10 text-sm text-gray-400">
            No pending mall requests.
          </div>
        )}
        {!isLoading && Boolean(requests.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Partner</TableHead>
                <TableHead className="text-gray-400">Requested Mall</TableHead>
                <TableHead className="text-gray-400">Unit</TableHead>
                <TableHead className="text-right text-gray-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((item) => (
                <TableRow
                  key={item._id}
                  className="border-white/10 hover:bg-white/[0.03]"
                >
                  <TableCell className="px-4">
                    <div className="font-medium text-white">
                      {item.businessName || item.fullName || "Seller"}
                    </div>
                    <div className="text-xs text-gray-500">{item.email}</div>
                    {item.request.message && (
                      <div className="mt-1 max-w-52 text-xs text-gray-400">
                        {item.request.message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">
                      {item.request.mallName || "Mall"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(item.request.requestedAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {[item.request.mallUnit, item.request.mallFloor]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() =>
                          reviewMallRequest.mutate({
                            sellerId: item.sellerId,
                            status: "APPROVED",
                          })
                        }
                        disabled={reviewMallRequest.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          reviewMallRequest.mutate({
                            sellerId: item.sellerId,
                            status: "REJECTED",
                          })
                        }
                        disabled={reviewMallRequest.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MallCreationRequestsPanel({
  requests,
  isLoading,
}: {
  requests: Mall[];
  isLoading: boolean;
}) {
  const reviewMallCreation = useReviewMallCreation();

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Building2 className="h-4 w-4 text-emerald-300" />
          New Mall Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && (
          <div className="px-4 py-10 text-sm text-gray-400">
            Loading new mall requests...
          </div>
        )}
        {!isLoading && !requests.length && (
          <div className="px-4 py-10 text-sm text-gray-400">
            No pending mall creation requests.
          </div>
        )}
        {!isLoading && Boolean(requests.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Mall</TableHead>
                <TableHead className="text-gray-400">Seller</TableHead>
                <TableHead className="text-gray-400">Unit</TableHead>
                <TableHead className="text-right text-gray-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((mall) => (
                <TableRow
                  key={mall._id}
                  className="border-white/10 hover:bg-white/[0.03]"
                >
                  <TableCell className="px-4">
                    <div className="font-medium text-white">{mall.name}</div>
                    <div className="text-xs text-gray-500">
                      {mall.address?.city || "Fashion mall"}
                    </div>
                    {mall.request?.message && (
                      <div className="mt-1 max-w-52 text-xs text-gray-400">
                        {mall.request.message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white">
                      {mall.requestedBy?.fullName || "Seller"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {mall.requestedBy?.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {[mall.request?.mallUnit, mall.request?.mallFloor]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() =>
                          reviewMallCreation.mutate({
                            mallId: mall._id,
                            status: "APPROVED",
                          })
                        }
                        disabled={reviewMallCreation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          reviewMallCreation.mutate({
                            mallId: mall._id,
                            status: "REJECTED",
                          })
                        }
                        disabled={reviewMallCreation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TopMallsPanel({ malls }: { malls: Mall[] }) {
  const DEFAULT_MALL_IMAGE =
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=100&h=100&fit=crop&q=80";
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Building2 className="h-4 w-4 text-emerald-300" />
          Top 10 In App
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        {!malls.length && (
          <div className="py-6 text-sm text-gray-400">
            No malls are marked for app display.
          </div>
        )}
        {malls.map((mall, index) => (
          <div
            key={mall._id}
            className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0"
          >
            <img
              src={mall.logoUrl || mall.coverImageUrl || DEFAULT_MALL_IMAGE}
              alt={mall.name}
              className="h-10 w-10 rounded-md object-cover border border-white/10 bg-white/5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {index + 1}. {mall.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{mall.address?.city || "Fashion mall"}</span>
                <span>•</span>
                <span className="text-amber-400">
                  ★ {mall.rating || "4.5"} ({mall.reviewCount || 0})
                </span>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-white/10 text-gray-300 shrink-0"
            >
              {mall.sellerCount || 0} sellers
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MallCreatePanel() {
  const createMall = useCreateMall();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [line1, setLine1] = useState("");
  const [pincode, setPincode] = useState("");
  const [managerName, setManagerName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isMobileVisible, setIsMobileVisible] = useState(true);
  const [totalStores, setTotalStores] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  // Geolocation & Photos states
  const [latVal, setLatVal] = useState("");
  const [lngVal, setLngVal] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [images, setImages] = useState<File[]>([]);

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
        toast.error(
          "Could not fetch exact coordinates. Allow location permission.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (images.length < 1) {
      toast.error("Please select at least 1 image for the mall.");
      return;
    }
    if (images.length > 5) {
      toast.error("Please upload a maximum of 5 images.");
      return;
    }

    createMall.mutate(
      {
        name,
        description: optionalValue(description),
        address: {
          line1: optionalValue(line1),
          city: optionalValue(city),
          state: optionalValue(state),
          pincode: optionalValue(pincode),
          latitude: latVal ? Number(latVal) : undefined,
          longitude: lngVal ? Number(lngVal) : undefined,
        },
        contact: {
          managerName: optionalValue(managerName),
          email: optionalValue(email),
        },
        mobileNumber: optionalValue(mobileNumber),
        isMobileVisible,
        totalStores: totalStores ? Number(totalStores) : undefined,
        logoUrl: optionalValue(logoUrl),
        coverImageUrl: optionalValue(coverImageUrl),
        logo: logo || undefined,
        coverImage: coverImage || undefined,
        newImages: images,
      },
      {
        onSuccess: () => {
          setName("");
          setCity("");
          setState("");
          setLine1("");
          setPincode("");
          setManagerName("");
          setEmail("");
          setMobileNumber("");
          setIsMobileVisible(true);
          setTotalStores("");
          setDescription("");
          setLogoUrl("");
          setCoverImageUrl("");
          setLogo(null);
          setCoverImage(null);
          setLatVal("");
          setLngVal("");
          setImages([]);
        },
      },
    );
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Building2 className="h-4 w-4 text-emerald-300" />
          Add Mall
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 pt-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mall name"
            required
            className={inputClass}
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tagline / Description"
            className={inputClass}
          />
          <Input
            value={line1}
            onChange={(event) => setLine1(event.target.value)}
            placeholder="Address"
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City"
              className={inputClass}
            />
            <Input
              value={state}
              onChange={(event) => setState(event.target.value)}
              placeholder="State"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={pincode}
              onChange={(event) => setPincode(event.target.value)}
              placeholder="Pincode"
              className={inputClass}
            />
            <Input
              value={totalStores}
              onChange={(event) => setTotalStores(event.target.value)}
              placeholder="Stores"
              type="number"
              min="0"
              className={inputClass}
            />
          </div>

          <div className="rounded-lg border border-yellow-800/30 bg-yellow-950/20 p-3 text-xs text-yellow-200 flex flex-col gap-2">
            <span className="font-semibold flex items-center gap-1.5">
              <Info className="h-4 w-4 shrink-0 text-yellow-400" />
              Exact Coordinate Guidelines
            </span>
            <p>
              Please add exact location in lat,long. If you don't know this, go
              to your mall and tap on <strong>Find My Exact Location</strong>{" "}
              with high accuracy.
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
            <Input
              value={latVal}
              onChange={(e) => setLatVal(e.target.value)}
              placeholder="Latitude (e.g. 25.611)"
              className={inputClass}
            />
            <Input
              value={lngVal}
              onChange={(e) => setLngVal(e.target.value)}
              placeholder="Longitude (e.g. 85.144)"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              value={managerName}
              onChange={(event) => setManagerName(event.target.value)}
              placeholder="Manager"
              className={inputClass}
            />
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 items-center">
            <Input
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value)}
              placeholder="Mobile Number (required)"
              className={inputClass}
              required
            />
            <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={isMobileVisible}
                onChange={(event) => setIsMobileVisible(event.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-white/5"
              />
              Mobile Visible on App
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="Logo URL"
              className={inputClass}
            />
            <Input
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              placeholder="Cover Image URL"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>
              <label className="block mb-1 font-medium text-gray-300">
                Upload Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white file:hidden"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-300">
                Upload Cover
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white file:hidden"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-xs text-gray-300">
              Upload Mall Photos (Required, 1-5 images)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              required
              onChange={(e) =>
                setImages(e.target.files ? Array.from(e.target.files) : [])
              }
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs file:hidden"
            />
            {images.length > 0 && (
              <span className="text-[10px] text-gray-400 mt-1 block">
                Selected {images.length} file(s)
              </span>
            )}
          </div>
          <Button type="submit" disabled={createMall.isPending}>
            <Building2 className="h-4 w-4" />
            Create Mall
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MallDirectory({
  malls,
  isLoading,
}: {
  malls: Mall[];
  isLoading: boolean;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">Mall Directory</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && (
          <div className="px-4 py-10 text-sm text-gray-400">
            Loading malls...
          </div>
        )}
        {!isLoading && !malls.length && (
          <div className="px-4 py-10 text-sm text-gray-400">
            No malls found.
          </div>
        )}
        {!isLoading && Boolean(malls.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Mall</TableHead>
                <TableHead className="text-gray-400">City</TableHead>
                <TableHead className="text-gray-400">Stores</TableHead>
                <TableHead className="text-gray-400">Sellers</TableHead>
                <TableHead className="text-gray-400">App Top</TableHead>
                <TableHead className="text-gray-400">Rank</TableHead>
                <TableHead className="text-gray-400">Rating</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-right text-gray-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {malls.map((mall) => (
                <MallRow
                  key={`${mall._id}-${mall.name}-${mall.address?.city || ""}-${mall.totalStores || 0}-${mall.isActive}-${mall.isFeatured}-${mall.featuredRank || ""}-${mall.rating || ""}`}
                  mall={mall}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MallRow({ mall }: { mall: Mall }) {
  const updateMall = useUpdateMall();
  const deactivateMall = useDeactivateMall();
  const [name, setName] = useState(mall.name);
  const [city, setCity] = useState(mall.address?.city || "");
  const [totalStores, setTotalStores] = useState(
    String(mall.totalStores || ""),
  );
  const [isFeatured, setIsFeatured] = useState(Boolean(mall.isFeatured));
  const [featuredRank, setFeaturedRank] = useState(
    String(mall.featuredRank || ""),
  );
  const [rating, setRating] = useState(String(mall.rating || 4.5));
  const [isExpanded, setIsExpanded] = useState(false);

  // Expanded details fields
  const [description, setDescription] = useState(mall.description || "");
  const [line1, setLine1] = useState(mall.address?.line1 || "");
  const [stateVal, setStateVal] = useState(mall.address?.state || "");
  const [pincode, setPincode] = useState(mall.address?.pincode || "");
  const [managerName, setManagerName] = useState(
    mall.contact?.managerName || "",
  );
  const [email, setEmail] = useState(mall.contact?.email || "");
  const [mobileNumber, setMobileNumber] = useState(mall.mobileNumber || "");
  const [isMobileVisible, setIsMobileVisible] = useState(
    mall.isMobileVisible !== false,
  );
  const [logoUrl, setLogoUrl] = useState(mall.logoUrl || "");
  const [coverImageUrl, setCoverImageUrl] = useState(mall.coverImageUrl || "");
  const [logo, setLogo] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  // Geolocation & Photos states
  const [latVal, setLatVal] = useState(
    mall.address?.latitude ? String(mall.address.latitude) : "",
  );
  const [lngVal, setLngVal] = useState(
    mall.address?.longitude ? String(mall.address.longitude) : "",
  );
  const [isLocating, setIsLocating] = useState(false);
  const [existingImages, setExistingImages] = useState<any[]>(
    mall.images || [],
  );
  const [newImages, setNewImages] = useState<File[]>([]);

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
        toast.error("Could not fetch coordinates. Allow location permission.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const save = () => {
    const totalCount = existingImages.length + newImages.length;
    if (totalCount < 1) {
      toast.error("Mall must have at least 1 image.");
      return;
    }
    if (totalCount > 5) {
      toast.error("Mall must have at most 5 images.");
      return;
    }
    updateMall.mutate(
      {
        mallId: mall._id,
        updates: {
          name,
          description: optionalValue(description),
          address: {
            line1: optionalValue(line1),
            city: optionalValue(city),
            state: optionalValue(stateVal),
            pincode: optionalValue(pincode),
            latitude: latVal ? Number(latVal) : undefined,
            longitude: lngVal ? Number(lngVal) : undefined,
          },
          contact: {
            managerName: optionalValue(managerName),
            email: optionalValue(email),
          },
          mobileNumber: optionalValue(mobileNumber),
          isMobileVisible,
          totalStores: totalStores ? Number(totalStores) : 0,
          isFeatured,
          featuredRank:
            isFeatured && featuredRank ? Number(featuredRank) : undefined,
          rating: rating ? Number(rating) : undefined,
          logoUrl: optionalValue(logoUrl),
          coverImageUrl: optionalValue(coverImageUrl),
          logo: logo || undefined,
          coverImage: coverImage || undefined,
          images: existingImages,
          newImages: newImages,
        },
      },
      {
        onSuccess: () => {
          setNewImages([]);
        },
      },
    );
  };

  const DEFAULT_MALL_IMAGE =
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=100&h=100&fit=crop&q=80";

  return (
    <>
      <TableRow className="border-white/10 hover:bg-white/[0.03]">
        <TableCell className="px-4">
          <div className="flex items-center gap-3">
            <img
              src={mall.logoUrl || mall.coverImageUrl || DEFAULT_MALL_IMAGE}
              alt={mall.name}
              className="h-10 w-10 rounded object-cover border border-white/10 shrink-0 bg-white/5"
            />
            <div className="flex-1 min-w-0">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={cn(inputClass, "h-8 min-w-44")}
              />
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span className="truncate">{mall.slug}</span>
                <span>•</span>
                <span className="text-gray-400">
                  Reviews: {mall.reviewCount || 0}
                </span>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className={cn(inputClass, "h-8 min-w-28")}
          />
        </TableCell>
        <TableCell>
          <Input
            value={totalStores}
            onChange={(event) => setTotalStores(event.target.value)}
            type="number"
            min="0"
            className={cn(inputClass, "h-8 w-20")}
          />
        </TableCell>
        <TableCell className="text-white">{mall.sellerCount || 0}</TableCell>
        <TableCell>
          <label className="inline-flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-white/5"
            />
            Show
          </label>
        </TableCell>
        <TableCell>
          <Input
            value={featuredRank}
            onChange={(event) => setFeaturedRank(event.target.value)}
            type="number"
            min="1"
            max="10"
            placeholder="1-10"
            className={cn(inputClass, "h-8 w-20")}
          />
        </TableCell>
        <TableCell>
          <Input
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            type="number"
            min="0"
            max="5"
            step="0.1"
            className={cn(inputClass, "h-8 w-20")}
          />
        </TableCell>
        <TableCell>
          <StatusBadge
            active={mall.isActive}
            label={mall.isActive ? "Active" : "Inactive"}
          />
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide Detail" : "Show Detail"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={save}
              disabled={updateMall.isPending}
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
            {mall.isActive ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deactivateMall.mutate(mall._id)}
                disabled={deactivateMall.isPending}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() =>
                  updateMall.mutate({
                    mallId: mall._id,
                    updates: { isActive: true },
                  })
                }
                disabled={updateMall.isPending}
              >
                Activate
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="border-white/10 bg-white/[0.01] hover:bg-white/[0.01]">
          <TableCell colSpan={9} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Address details */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Address Details
                </h4>
                <Input
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Address Line 1"
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    placeholder="State"
                    className={inputClass}
                  />
                  <Input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className={inputClass}
                  />
                </div>

                {/* Coordinates & Warning */}
                <div className="rounded-lg border border-yellow-800/30 bg-yellow-950/20 p-2.5 text-[10px] text-yellow-200 flex flex-col gap-1.5 mt-2">
                  <span className="font-semibold flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                    Exact Coordinates Guideline
                  </span>
                  <p>
                    Please add exact location in lat,long. If you don't know
                    this, tap on the button below with high accuracy.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={captureLocation}
                    disabled={isLocating}
                    className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold mt-1 self-start px-2 py-0.5 h-6 text-[10px]"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    {isLocating ? "Locating..." : "Find My Location"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    value={latVal}
                    onChange={(e) => setLatVal(e.target.value)}
                    placeholder="Latitude"
                    className={inputClass}
                  />
                  <Input
                    value={lngVal}
                    onChange={(e) => setLngVal(e.target.value)}
                    placeholder="Longitude"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Contact details */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Contact Info
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Manager Name"
                    className={inputClass}
                  />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <Input
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Mobile Number (required)"
                    className={inputClass}
                    required
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMobileVisible}
                      onChange={(e) => setIsMobileVisible(e.target.checked)}
                      className="h-4 w-4 rounded border-white/10 bg-white/5"
                    />
                    Mobile Visible on App
                  </label>
                </div>
              </div>

              {/* Merchandising & Media */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Merchandising & Media
                </h4>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tagline / Description"
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Logo URL"
                    className={inputClass}
                  />
                  <Input
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="Cover Image URL"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div>
                    <label className="block mb-0.5">Upload Logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogo(e.target.files?.[0] || null)}
                      className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white file:hidden"
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5">Upload Cover</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCoverImage(e.target.files?.[0] || null)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white file:hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {existingImages.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-[10px] text-gray-400 font-semibold uppercase">
                        Existing Photos ({existingImages.length})
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {existingImages.map((img: any, idx: number) => (
                          <div
                            key={idx}
                            className="relative group border border-white/10 rounded overflow-hidden"
                          >
                            <img
                              src={img.url}
                              className="h-10 w-10 object-cover"
                              alt="Mall item"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setExistingImages(
                                  existingImages.filter((_, i) => i !== idx),
                                )
                              }
                              className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-100 text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] text-gray-400 font-semibold uppercase">
                      Upload New Photos (1-5 Total)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        setNewImages(
                          e.target.files ? Array.from(e.target.files) : [],
                        )
                      }
                      className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white text-xs file:hidden"
                    />
                    {newImages.length > 0 && (
                      <span className="text-[9px] text-gray-400 block mt-0.5">
                        Selected {newImages.length} file(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function SellerMallAssignments({
  sellers,
  malls,
  isLoading,
}: {
  sellers: ManagedPerson[];
  malls: Mall[];
  isLoading: boolean;
}) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c] xl:col-span-2">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Store className="h-4 w-4 text-emerald-300" />
          Seller Mall Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && (
          <div className="px-4 py-10 text-sm text-gray-400">
            Loading sellers...
          </div>
        )}
        {!isLoading && !sellers.length && (
          <div className="px-4 py-10 text-sm text-gray-400">
            No seller profiles found.
          </div>
        )}
        {!isLoading && Boolean(sellers.length) && (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-gray-400">Seller</TableHead>
                <TableHead className="text-gray-400">Business</TableHead>
                <TableHead className="text-gray-400">Mall</TableHead>
                <TableHead className="text-gray-400">Unit</TableHead>
                <TableHead className="text-gray-400">Floor</TableHead>
                <TableHead className="text-right text-gray-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((seller) => (
                <SellerMallRow
                  key={`${seller._id}-${seller.sellerProfile?.mallId || ""}-${seller.sellerProfile?.mallUnit || ""}-${seller.sellerProfile?.mallFloor || ""}`}
                  seller={seller}
                  malls={malls}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SellerMallRow({
  seller,
  malls,
}: {
  seller: ManagedPerson;
  malls: Mall[];
}) {
  const assignSellerMall = useAssignSellerMall();
  const [mallId, setMallId] = useState(seller.sellerProfile?.mallId || "");
  const [mallUnit, setMallUnit] = useState(
    seller.sellerProfile?.mallUnit || "",
  );
  const [mallFloor, setMallFloor] = useState(
    seller.sellerProfile?.mallFloor || "",
  );

  const save = () => {
    assignSellerMall.mutate({
      sellerId: seller._id,
      mallId: mallId || null,
      mallUnit: mallUnit.trim(),
      mallFloor: mallFloor.trim(),
    });
  };

  return (
    <TableRow className="border-white/10 hover:bg-white/[0.03]">
      <TableCell className="px-4">
        <div className="font-medium text-white">{seller.fullName}</div>
        <div className="text-xs text-gray-500">{seller.email}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-white">
          {seller.sellerProfile?.businessName || "Seller"}
        </div>
        <div className="text-xs text-gray-500">
          {seller.sellerProfile?.sellerType || "CLOTHING"}
        </div>
      </TableCell>
      <TableCell>
        <select
          value={mallId}
          onChange={(event) => setMallId(event.target.value)}
          className={cn(selectClass, "min-w-48")}
        >
          <option value="">No mall</option>
          {malls.map((mall) => (
            <option key={mall._id} value={mall._id}>
              {mall.name}
              {mall.isActive ? "" : " (Inactive)"}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCell>
        <Input
          value={mallUnit}
          onChange={(event) => setMallUnit(event.target.value)}
          placeholder="Unit"
          className={cn(inputClass, "h-8 w-24")}
        />
      </TableCell>
      <TableCell>
        <Input
          value={mallFloor}
          onChange={(event) => setMallFloor(event.target.value)}
          placeholder="Floor"
          className={cn(inputClass, "h-8 w-24")}
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={save}
            disabled={assignSellerMall.isPending}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
