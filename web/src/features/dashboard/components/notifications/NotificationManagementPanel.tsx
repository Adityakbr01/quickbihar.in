"use client";

import React, { useState } from "react";
import {
  Plus,
  Bell,
  Send,
  User as UserIcon,
  ShieldAlert,
  Link as LinkIcon,
  Image as ImageIcon,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminNotifications,
  useSendNotification,
  useManagedPeople,
} from "../../hooks/useAdminManagement";
import {
  useAdminCategories,
  useAdminProducts,
} from "../../hooks/useCatalogManagement";
import {
  ManagementToolbar,
  LoadingState,
  EmptyState,
} from "../shared/TableHelpers";
import {
  selectClass,
  inputClass,
  textareaClass,
  formatDate,
} from "../../utils";

export function NotificationManagementPanel() {
  const [search, setSearch] = useState("");
  const [isSendOpen, setIsSendOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("general");
  const [deliveryType, setDeliveryType] = useState("BOTH");
  const [targetType, setTargetType] = useState("ALL");
  const [targetRole, setTargetRole] = useState("USER");
  const [targetUser, setTargetUser] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Image inputs
  const [imageType, setImageType] = useState<"url" | "file">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Redirection inputs
  const [redirectType, setRedirectType] = useState("none");
  const [redirectId, setRedirectId] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [redirectSearch, setRedirectSearch] = useState("");

  const notificationsQuery = useAdminNotifications();
  const sendMutation = useSendNotification();

  // Queries for autocomplete
  const categoriesQuery = useAdminCategories({
    page: 1,
    limit: 100,
    sortBy: "title",
    sortOrder: "asc",
  });
  const productsQuery = useAdminProducts({
    page: 1,
    limit: 100,
    sortBy: "title",
    sortOrder: "asc",
  });
  const peopleQuery = useManagedPeople({ search: userSearch || undefined });

  const categories = categoriesQuery.data?.data || [];
  const products = productsQuery.data?.data || [];
  const candidates = peopleQuery.data || [];

  const history = notificationsQuery.data || [];
  const filteredHistory = history.filter(
    (item) =>
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.channel?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("channel", channel);
    formData.append("deliveryType", deliveryType);
    formData.append("targetType", targetType);
    formData.append("redirectType", redirectType);

    if (targetType === "ROLE") {
      formData.append("targetRole", targetRole);
    } else if (targetType === "SPECIFIC" && targetUser) {
      formData.append("targetUser", targetUser);
    }

    if (redirectType === "product" || redirectType === "category") {
      formData.append("redirectId", redirectId);
    } else if (redirectType === "external" && externalUrl) {
      formData.append("externalUrl", externalUrl.trim());
    }

    if (imageType === "file" && imageFile) {
      formData.append("image", imageFile);
    } else if (imageType === "url" && imageUrl.trim()) {
      formData.append("imageUrl", imageUrl.trim());
    }

    sendMutation.mutate(formData, {
      onSuccess: () => {
        setIsSendOpen(false);
        // Reset form
        setTitle("");
        setDescription("");
        setChannel("general");
        setDeliveryType("BOTH");
        setTargetType("ALL");
        setTargetRole("USER");
        setTargetUser("");
        setUserSearch("");
        setImageType("url");
        setImageUrl("");
        setImageFile(null);
        setRedirectType("none");
        setRedirectId("");
        setExternalUrl("");
        setRedirectSearch("");
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
      case "PROCESSING":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/25";
      case "FAILED":
        return "bg-red-500/15 text-red-400 border-red-500/25";
      default:
        return "bg-gray-500/15 text-gray-400 border-gray-500/25";
    }
  };

  // Filter products or categories based on search input
  const filteredRedirectTargets = () => {
    if (redirectType === "product") {
      return products.filter((p: any) =>
        p.title?.toLowerCase().includes(redirectSearch.toLowerCase()),
      );
    }
    if (redirectType === "category") {
      return categories.filter((c: any) =>
        c.title?.toLowerCase().includes(redirectSearch.toLowerCase()),
      );
    }
    return [];
  };

  return (
    <div className="grid gap-4">
      <ManagementToolbar
        title="Notification Campaigns"
        search={search}
        onSearch={setSearch}
        status="all"
        statuses={[{ value: "all", label: "All Channels" }]}
        onStatus={() => {}}
        sortBy="createdAt"
        sortOptions={[{ value: "createdAt", label: "Date Sent" }]}
        onSortBy={() => {}}
        sortOrder="desc"
        onSortOrder={() => {}}
        onRefresh={() => notificationsQuery.refetch()}
        extraAction={
          <Button
            onClick={() => setIsSendOpen(true)}
            className="bg-primary hover:bg-primary/95 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Send Notification
          </Button>
        }
      />

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardContent className="px-0">
          {notificationsQuery.isLoading && (
            <LoadingState label="Loading notification history..." />
          )}
          {!notificationsQuery.isLoading && !filteredHistory.length && (
            <EmptyState label="No notification history found." />
          )}
          {!notificationsQuery.isLoading && Boolean(filteredHistory.length) && (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-4 text-gray-400 w-[20%]">
                    Details
                  </TableHead>
                  <TableHead className="text-gray-400 w-[30%]">
                    Message
                  </TableHead>
                  <TableHead className="text-gray-400 w-[15%]">
                    Audience / Target
                  </TableHead>
                  <TableHead className="text-gray-400 w-[15%]">
                    Redirection (Backlink)
                  </TableHead>
                  <TableHead className="text-gray-400 w-[8%]">
                    Delivery
                  </TableHead>
                  <TableHead className="text-gray-400 w-[8%]">Status</TableHead>
                  <TableHead className="text-gray-400 w-[8%]">
                    Sent At
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow
                    key={item._id}
                    className="border-white/10 hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-10 w-10 rounded object-cover border border-white/10"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-white/5 border border-white/10 text-gray-400">
                            <Bell className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate max-w-[150px]">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Channel: {item.channel}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-300 break-words line-clamp-2">
                        {item.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant="outline"
                          className="border-white/10 text-gray-300 bg-white/5 text-[11px]"
                        >
                          {item.targetType}
                        </Badge>
                        {item.targetType === "ROLE" && (
                          <span className="text-xs text-primary font-medium">
                            {item.targetRole}
                          </span>
                        )}
                        {item.targetType === "SPECIFIC" && item.targetUser && (
                          <span className="text-xs text-primary font-medium truncate max-w-[120px]">
                            {item.targetUser.fullName || item.targetUser.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant="outline"
                          className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-[11px] capitalize"
                        >
                          {item.redirectType}
                        </Badge>
                        {item.redirectType !== "none" && (
                          <span className="text-xs text-gray-400 truncate max-w-[150px]">
                            {item.redirectType === "external"
                              ? item.externalUrl
                              : item.redirectId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-blue-500/20 text-blue-400 bg-blue-500/5 text-[11px]"
                      >
                        {item.deliveryType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(item.status)} text-[10px]`}
                        >
                          {item.status}
                        </Badge>
                        {item.error && (
                          <span
                            className="text-[9px] text-red-500 max-w-[100px] truncate"
                            title={item.error}
                          >
                            {item.error}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {formatDate(item.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="border-white/10 bg-[#181818] text-white sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Send className="h-5 w-5 text-primary" />
              Compose Campaign
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">
                  Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className={`${selectClass} w-full`}
                >
                  <option value="general">General (default)</option>
                  <option value="promotions">Promotions & Marketing</option>
                  <option value="orders">Orders & Logistics</option>
                  <option value="system">System Alerts</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">
                Description (Body)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter notification message description..."
                className={`${textareaClass} w-full resize-none`}
                rows={3}
                required
              />
            </div>

            {/* Image Source Mode Selector */}
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400 font-medium">
                  Image Attachment
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageType("url")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      imageType === "url"
                        ? "bg-primary text-white"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageType("file")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      imageType === "file"
                        ? "bg-primary text-white"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {imageType === "url" ? (
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className={inputClass}
                />
              ) : (
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="border-white/10 bg-white/5 text-white file:bg-white/10 file:text-white file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 text-xs"
                  />
                  {imageFile && (
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Selected:{" "}
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Redirection Link (Backlink) Configuration */}
            <div className="space-y-2 border-t border-white/5 pt-3">
              <label className="text-xs text-gray-400 font-medium">
                Redirection Link (Backlink)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <select
                    value={redirectType}
                    onChange={(e) => {
                      setRedirectType(e.target.value);
                      setRedirectId("");
                      setExternalUrl("");
                      setRedirectSearch("");
                    }}
                    className={`${selectClass} w-full`}
                  >
                    <option value="none">No Link</option>
                    <option value="product">Product Page</option>
                    <option value="category">Category Page</option>
                    <option value="external">External Link</option>
                  </select>
                </div>

                <div className="col-span-2">
                  {redirectType === "external" && (
                    <Input
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://example.com"
                      className={inputClass}
                    />
                  )}

                  {(redirectType === "product" ||
                    redirectType === "category") && (
                    <div className="space-y-1">
                      <Input
                        value={redirectSearch}
                        onChange={(e) => setRedirectSearch(e.target.value)}
                        placeholder={`Search ${redirectType}...`}
                        className={inputClass}
                      />
                      {redirectSearch.trim().length > 0 && !redirectId && (
                        <div className="absolute z-55 left-4 right-4 max-h-[120px] overflow-y-auto rounded-lg border border-white/10 bg-[#121212] divide-y divide-white/5 shadow-2xl">
                          {filteredRedirectTargets().length === 0 && (
                            <p className="text-xs text-gray-500 p-2">
                              No items found
                            </p>
                          )}
                          {filteredRedirectTargets().map((item: any) => (
                            <button
                              key={item._id}
                              type="button"
                              onClick={() => {
                                setRedirectId(item._id);
                                setRedirectSearch(item.title);
                              }}
                              className="flex w-full items-center justify-between p-2.5 text-left text-xs text-gray-300 hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt=""
                                    className="h-6 w-6 rounded object-cover"
                                  />
                                )}
                                <span className="font-semibold text-white">
                                  {item.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500">
                                {item._id.slice(-6)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {redirectType === "none" && (
                    <div className="text-xs text-gray-500 py-1.5 px-2 bg-white/5 rounded italic">
                      No redirection link attached to this campaign.
                    </div>
                  )}
                </div>
              </div>
              {redirectId && (
                <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-2 text-xs flex items-center gap-1.5 text-cyan-400">
                  <LinkIcon className="h-3.5 w-3.5" />
                  Redirection Link set:{" "}
                  <span className="font-bold">{redirectSearch}</span> (
                  {redirectId})
                </div>
              )}
            </div>

            {/* Audience Section */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">
                  Delivery Mode
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className={`${selectClass} w-full`}
                >
                  <option value="BOTH">In-App & Push (FCM)</option>
                  <option value="IN_APP">In-App Only</option>
                  <option value="FCM">Push (FCM) Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">
                  Target Audience
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className={`${selectClass} w-full`}
                >
                  <option value="ALL">All Users</option>
                  <option value="ROLE">Role Based</option>
                  <option value="SPECIFIC">Particular User</option>
                </select>
              </div>
            </div>

            {/* Target Options Conditionally Rendered */}
            {targetType === "ROLE" && (
              <div className="space-y-1 animate-in-fade-slide">
                <label className="text-xs text-gray-400 font-medium">
                  Select Target Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className={`${selectClass} w-full`}
                >
                  <option value="USER">Customer (USER)</option>
                  <option value="SELLER">Seller (SELLER)</option>
                  <option value="DELIVERY">Rider (DELIVERY)</option>
                  <option value="ADMIN">Staff (ADMIN)</option>
                </select>
              </div>
            )}

            {targetType === "SPECIFIC" && (
              <div className="space-y-2 animate-in-fade-slide">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium">
                    Search User (Name/Email/Phone)
                  </label>
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search query..."
                    className={inputClass}
                  />
                </div>
                {userSearch.trim().length > 0 && !targetUser && (
                  <div className="absolute z-50 left-4 right-4 max-h-[120px] overflow-y-auto rounded-lg border border-white/10 bg-[#121212] divide-y divide-white/5 shadow-2xl">
                    {peopleQuery.isLoading && (
                      <p className="text-xs text-gray-500 p-2">Searching...</p>
                    )}
                    {!peopleQuery.isLoading && candidates.length === 0 && (
                      <p className="text-xs text-gray-500 p-2">
                        No users found
                      </p>
                    )}
                    {candidates.map((person: any) => (
                      <button
                        key={person._id}
                        type="button"
                        onClick={() => {
                          setTargetUser(person._id);
                          setUserSearch(`${person.fullName} (${person.email})`);
                        }}
                        className={`flex w-full items-center justify-between p-2.5 text-left text-xs text-gray-300 hover:bg-white/5 transition-colors ${
                          targetUser === person._id
                            ? "bg-primary/20 border-l-2 border-primary"
                            : ""
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {person.fullName}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {person.email} · {person.phone || "No phone"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-white/10 text-gray-400 text-[10px]"
                        >
                          {person.role}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
                {targetUser && (
                  <div className="rounded border border-primary/20 bg-primary/5 p-2 text-xs flex items-center gap-1.5 text-primary">
                    <UserIcon className="h-3.5 w-3.5" />
                    Target User Selected:{" "}
                    <span className="font-bold">{userSearch}</span> (
                    {targetUser})
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="border-t border-white/5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSendOpen(false)}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  sendMutation.isPending ||
                  (targetType === "SPECIFIC" && !targetUser) ||
                  (imageType === "file" && !imageFile)
                }
                className="bg-secondary  text-white"
              >
                {sendMutation.isPending ? "Sending..." : "Send Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
