"use client";

import { type FormEvent, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Save,
  Store,
} from "lucide-react";
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
  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Building2 className="h-4 w-4 text-emerald-300" />
          Top 10 In App
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!malls.length && (
          <div className="py-6 text-sm text-gray-400">
            No malls are marked for app display.
          </div>
        )}
        {malls.map((mall, index) => (
          <div
            key={mall._id}
            className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0"
          >
            <div>
              <div className="text-sm font-medium text-white">
                {index + 1}. {mall.name}
              </div>
              <div className="text-xs text-gray-500">
                {mall.address?.city || "Fashion mall"}
              </div>
            </div>
            <Badge variant="outline" className="border-white/10 text-gray-300">
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
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [totalStores, setTotalStores] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createMall.mutate(
      {
        name,
        address: {
          line1: optionalValue(line1),
          city: optionalValue(city),
          state: optionalValue(state),
          pincode: optionalValue(pincode),
        },
        contact: {
          managerName: optionalValue(managerName),
          phone: optionalValue(phone),
          email: optionalValue(email),
        },
        totalStores: totalStores ? Number(totalStores) : undefined,
      },
      {
        onSuccess: () => {
          setName("");
          setCity("");
          setState("");
          setLine1("");
          setPincode("");
          setManagerName("");
          setPhone("");
          setEmail("");
          setTotalStores("");
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
        <form onSubmit={submit} className="grid gap-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mall name"
            required
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
          <Input
            value={managerName}
            onChange={(event) => setManagerName(event.target.value)}
            placeholder="Manager"
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone"
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

  const save = () => {
    updateMall.mutate({
      mallId: mall._id,
      updates: {
        name,
        address: { ...mall.address, city: optionalValue(city) },
        totalStores: totalStores ? Number(totalStores) : 0,
        isFeatured,
        featuredRank:
          isFeatured && featuredRank ? Number(featuredRank) : undefined,
        rating: rating ? Number(rating) : undefined,
      },
    });
  };

  return (
    <TableRow className="border-white/10 hover:bg-white/[0.03]">
      <TableCell className="px-4">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={cn(inputClass, "h-8 min-w-44")}
        />
        <div className="mt-1 text-xs text-gray-500">{mall.slug}</div>
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
