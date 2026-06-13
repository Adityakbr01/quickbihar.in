"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Bell,
  Send,
  User as UserIcon,
  ShieldAlert,
  Link as LinkIcon,
  Image as ImageIcon,
  Globe,
  Edit3,
  Trash2,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Activity,
  BarChart2,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useUpdateAdminNotification,
  useDeleteAdminNotification,
  useResendAdminNotification,
  useNotificationAnalytics,
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
import { getWebSocket } from "@/lib/socket";

export function NotificationManagementPanel() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  // Dialog open controls
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active notification for details / edit / delete
  const [activeNotification, setActiveNotification] = useState<any>(null);

  // Form State (Compose / Edit)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("general");
  const [deliveryChannel, setDeliveryChannel] = useState("BOTH");
  const [deliveryType, setDeliveryType] = useState("ALERT");
  const [targetType, setTargetType] = useState("ALL");
  const [targetRole, setTargetRole] = useState("USER");
  const [targetUser, setTargetUser] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Rich Notification image fields
  const [notificationType, setNotificationType] = useState("NORMAL");
  const [imageType, setImageType] = useState<"url" | "file">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Redirection / Deep Link fields
  const [redirectType, setRedirectType] = useState("none");
  const [redirectId, setRedirectId] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [redirectSearch, setRedirectSearch] = useState("");
  const [actionButtonText, setActionButtonText] = useState("");

  // Scheduling fields
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  // React Query Hooks
  const notificationsQuery = useAdminNotifications({
    search: search || undefined,
    status: filterStatus === "all" ? undefined : filterStatus,
    priority: filterPriority === "all" ? undefined : filterPriority,
    notificationType: filterType === "all" ? undefined : filterType,
    sortBy: "createdAt",
    sortOrder: sortOrder,
  });

  const analyticsQuery = useNotificationAnalytics();
  const sendMutation = useSendNotification();
  const updateMutation = useUpdateAdminNotification();
  const deleteMutation = useDeleteAdminNotification();
  const resendMutation = useResendAdminNotification();

  // Autocomplete Queries
  const categoriesQuery = useAdminCategories({ page: 1, limit: 100, sortBy: "title", sortOrder: "asc" });
  const productsQuery = useAdminProducts({ page: 1, limit: 100, sortBy: "title", sortOrder: "asc" });
  const peopleQuery = useManagedPeople({ search: userSearch || undefined });

  const categories = categoriesQuery.data?.data || [];
  const products = productsQuery.data?.data || [];
  const candidates = peopleQuery.data || [];

  const history = notificationsQuery.data || [];
  const analytics = analyticsQuery.data || {
    totalCampaigns: 0,
    sentCount: 0,
    deliveryCount: 0,
    openCount: 0,
    failedCount: 0,
    deliveryRate: 0,
    openRate: 0,
    statusBreakdown: {},
  };

  // Setup WebSocket real-time updates listener
  useEffect(() => {
    const socket = getWebSocket();
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      console.log("[Socket] Received notification status update:", data);
      notificationsQuery.refetch();
      analyticsQuery.refetch();
    };

    const handleNotificationUpdated = (data: any) => {
      console.log("[Socket] Received notification field update:", data);
      notificationsQuery.refetch();
      analyticsQuery.refetch();
    };

    socket.on("notification_status_update", handleStatusUpdate);
    socket.on("notification_updated", handleNotificationUpdated);

    return () => {
      socket.off("notification_status_update", handleStatusUpdate);
      socket.off("notification_updated", handleNotificationUpdated);
    };
  }, [notificationsQuery, analyticsQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
      // Show file preview by reading as DataURL
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Open Compose Modal
  const openCompose = () => {
    // Reset Form
    setTitle("");
    setDescription("");
    setBody("");
    setChannel("general");
    setDeliveryChannel("BOTH");
    setDeliveryType("ALERT");
    setTargetType("ALL");
    setTargetRole("USER");
    setTargetUser("");
    setUserSearch("");
    setNotificationType("NORMAL");
    setImageType("url");
    setImageUrl("");
    setImageFile(null);
    setRedirectType("none");
    setRedirectId("");
    setExternalUrl("");
    setDeepLink("");
    setRedirectSearch("");
    setScheduledAt("");
    setExpiresAt("");
    setActionButtonText("");

    setIsSendOpen(true);
  };

  // Open Edit Modal
  const openEdit = (notification: any) => {
    setActiveNotification(notification);
    
    setTitle(notification.title || "");
    setDescription(notification.description || "");
    setBody(notification.body || notification.description || "");
    setChannel(notification.channel || "general");
    setDeliveryChannel(notification.deliveryChannel || "BOTH");
    setDeliveryType(notification.deliveryType || "ALERT");
    setTargetType(notification.targetType || "ALL");
    setTargetRole(notification.targetRole || "USER");
    setTargetUser(notification.targetUser?._id || notification.targetUser || "");
    setUserSearch(notification.targetUser ? `${notification.targetUser.fullName || ""} (${notification.targetUser.email || ""})` : "");
    setNotificationType(notification.notificationType || "NORMAL");
    setImageUrl(notification.imageUrl || notification.richContent?.image || "");
    setImageType(notification.imageUrl ? "url" : "url");
    setImageFile(null);
    setRedirectType(notification.redirectType || "none");
    setRedirectId(notification.redirectId || "");
    setExternalUrl(notification.externalUrl || "");
    setDeepLink(notification.deepLink || "");
    setEditStatus(notification.status || "");
    setActionButtonText(notification.actionButtonText || "");
    
    // Convert Dates for datetime-local input fields
    setScheduledAt(notification.scheduledAt ? new Date(notification.scheduledAt).toISOString().slice(0, 16) : "");
    setExpiresAt(notification.expiresAt ? new Date(notification.expiresAt).toISOString().slice(0, 16) : "");

    // Setup redirect search box name
    if (notification.redirectType === "product") {
      const prod = products.find((p: any) => p._id === notification.redirectId);
      setRedirectSearch(prod?.title || notification.redirectId || "");
    } else if (notification.redirectType === "category") {
      const cat = categories.find((c: any) => c._id === notification.redirectId);
      setRedirectSearch(cat?.title || notification.redirectId || "");
    } else {
      setRedirectSearch("");
    }

    setIsEditOpen(true);
  };

  // Open Details Modal
  const openDetails = (notification: any) => {
    setActiveNotification(notification);
    setIsDetailsOpen(true);
  };

  // Open Delete Confirm Modal
  const openDelete = (notification: any) => {
    setActiveNotification(notification);
    setIsDeleteOpen(true);
  };

  // Create Campaign Submit
  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("body", body.trim() || description.trim());
    formData.append("channel", channel);
    formData.append("deliveryChannel", deliveryChannel);
    formData.append("deliveryType", deliveryType);
    formData.append("targetType", targetType);
    formData.append("redirectType", redirectType);
    formData.append("notificationType", notificationType);

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
    if (actionButtonText.trim()) {
      formData.append("actionButtonText", actionButtonText.trim());
    }
    if (deepLink.trim()) {
      formData.append("deepLink", deepLink.trim());
    }

    if (scheduledAt) {
      formData.append("scheduledAt", new Date(scheduledAt).toISOString());
    }

    if (expiresAt) {
      formData.append("expiresAt", new Date(expiresAt).toISOString());
    }

    if (notificationType === "RICH") {
      if (imageType === "file" && imageFile) {
        formData.append("image", imageFile);
      } else if (imageType === "url" && imageUrl.trim()) {
        formData.append("imageUrl", imageUrl.trim());
      }
    }

    sendMutation.mutate(formData, {
      onSuccess: () => {
        setIsSendOpen(false);
        analyticsQuery.refetch();
      },
    });
  };

  // Edit Campaign Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotification) return;

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("body", body.trim() || description.trim());
    formData.append("channel", channel);
    formData.append("deliveryChannel", deliveryChannel);
    formData.append("deliveryType", deliveryType);
    formData.append("targetType", targetType);
    formData.append("redirectType", redirectType);
    formData.append("notificationType", notificationType);

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

    if (deepLink.trim()) {
      formData.append("deepLink", deepLink.trim());
    }
    if (actionButtonText.trim()) {
      formData.append("actionButtonText", actionButtonText.trim());
    }
    formData.append("scheduledAt", scheduledAt ? new Date(scheduledAt).toISOString() : "");
    formData.append("expiresAt", expiresAt ? new Date(expiresAt).toISOString() : "");
    formData.append("status", editStatus);

    if (notificationType === "RICH") {
      if (imageType === "file" && imageFile) {
        formData.append("image", imageFile);
      } else if (imageType === "url" && imageUrl.trim()) {
        formData.append("imageUrl", imageUrl.trim());
      }
    }

    updateMutation.mutate(
      { id: activeNotification._id, payload: formData },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setActiveNotification(null);
          analyticsQuery.refetch();
        },
      }
    );
  };

  // Delete Campaign Submit
  const handleDeleteSubmit = () => {
    if (!activeNotification) return;
    deleteMutation.mutate(activeNotification._id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setActiveNotification(null);
        analyticsQuery.refetch();
      },
    });
  };

  // Re-send Campaign Submit
  const handleResend = (notification: any) => {
    resendMutation.mutate(notification._id, {
      onSuccess: () => {
        analyticsQuery.refetch();
      },
    });
  };

  // Filter products or categories based on search input
  const filteredRedirectTargets = () => {
    if (redirectType === "product") {
      return products.filter((p: any) =>
        p.title?.toLowerCase().includes(redirectSearch.toLowerCase())
      );
    }
    if (redirectType === "category") {
      return categories.filter((c: any) =>
        c.title?.toLowerCase().includes(redirectSearch.toLowerCase())
      );
    }
    return [];
  };

  // Stylings
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
      case "COMPLETED":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
      case "DELIVERED":
        return "bg-teal-500/15 text-teal-400 border-teal-500/25";
      case "OPENED":
        return "bg-blue-500/15 text-blue-400 border-blue-500/25";
      case "PROCESSING":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/25";
      case "FAILED":
        return "bg-red-500/15 text-red-400 border-red-500/25";
      case "PENDING":
      default:
        return "bg-amber-500/15 text-amber-400 border-amber-500/25";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-rose-500/15 text-rose-400 border-rose-500/25 font-bold";
      case "LOW":
        return "bg-gray-500/15 text-gray-400 border-gray-500/25";
      case "MEDIUM":
      default:
        return "bg-blue-500/15 text-blue-400 border-blue-500/25";
    }
  };

  return (
    <div className="grid gap-6">
      {/* 📊 Analytics Dashboard Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/5 bg-[#171717]/85 backdrop-blur shadow-xl text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Total Campaigns
            </CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCampaigns}</div>
            <p className="text-[10px] text-gray-500 mt-1">Dispatched notification runs</p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#171717]/85 backdrop-blur shadow-xl text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Total Dispatched
            </CardTitle>
            <Activity className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.sentCount}</div>
            <p className="text-[10px] text-emerald-400 mt-1">
              {analytics.failedCount} failed dispatches
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#171717]/85 backdrop-blur shadow-xl text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Delivery Rate
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.deliveryRate}%</div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${analytics.deliveryRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#171717]/85 backdrop-blur shadow-xl text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Open / Click Rate
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.openRate}%</div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${analytics.openRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar filters */}
      <div className="bg-[#121212] border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="bg-[#1c1c1c] border-white/10 text-white placeholder-gray-500 h-9"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-400 font-medium">Filters:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#1c1c1c] border border-white/10 text-xs text-gray-300 rounded px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="OPENED">Opened</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#1c1c1c] border border-white/10 text-xs text-gray-300 rounded px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#1c1c1c] border border-white/10 text-xs text-gray-300 rounded px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="NORMAL">Normal</option>
            <option value="RICH">Rich</option>
          </select>

          <Button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            variant="outline"
            className="border-white/10 bg-[#1c1c1c] hover:bg-white/5 text-gray-300 text-xs h-9 px-3"
          >
            Sort: {sortOrder === "desc" ? "Newest" : "Oldest"}
          </Button>

          <Button
            onClick={() => {
              notificationsQuery.refetch();
              analyticsQuery.refetch();
            }}
            variant="outline"
            className="border-white/10 bg-[#1c1c1c] hover:bg-white/5 text-gray-300 h-9 w-9 p-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          <Button
            onClick={openCompose}
            className="bg-primary hover:bg-primary/95 text-white h-9"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Notification
          </Button>
        </div>
      </div>

      {/* Campaigns Table */}
      <Card className="border-white/5 bg-[#171717]/90 text-white shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {notificationsQuery.isLoading && (
            <LoadingState label="Fetching campaigns history..." />
          )}
          {!notificationsQuery.isLoading && !history.length && (
            <EmptyState label="No notification campaigns found." />
          )}
          {!notificationsQuery.isLoading && Boolean(history.length) && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="px-4 text-gray-400 font-semibold text-xs">Details</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-xs">Message</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-xs">Delivery Channel</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-xs">Target & Priority</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-xs">Delivery Progress</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-xs text-center">Status</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-xs">Dates</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-xs text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => {
                    const deliveryPct = item.sentCount > 0 ? Math.round((item.deliveryCount / item.sentCount) * 100) : 0;
                    const openPct = item.deliveryCount > 0 ? Math.round((item.openCount / item.deliveryCount) * 100) : 0;
                    const isSilent = item.deliveryType === "SILENT";

                    return (
                      <TableRow
                        key={item._id}
                        className="border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell className="px-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl || item.richContent?.image ? (
                              <img
                                src={item.imageUrl || item.richContent?.image}
                                alt={item.title}
                                className="h-10 w-10 rounded object-cover border border-white/10"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-white/5 border border-white/10 text-gray-400">
                                {isSilent ? <VolumeX className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm truncate max-w-[150px]" title={item.title}>
                                {item.title}
                              </div>
                              <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <Badge variant="outline" className="text-[9px] border-white/5 py-0 px-1 bg-white/5 scale-90 -ml-1">
                                  {item.notificationType}
                                </Badge>
                                <span>· {item.channel}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-gray-300 line-clamp-2 break-all max-w-[200px]" title={item.description}>
                            {item.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-semibold text-gray-300">
                              {item.deliveryChannel === "BOTH" ? "Push & In-App" : item.deliveryChannel === "FCM" ? "Push Only" : "In-App Only"}
                            </span>
                            <span className="text-[10px] text-cyan-400 italic">
                              Type: {item.deliveryType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant="outline" className={`${getPriorityColor(item.priority)} text-[9px] py-0`}>
                              {item.priority}
                            </Badge>
                            <span className="text-[10px] text-gray-400">
                              Target: {item.targetType} {item.targetRole ? `(${item.targetRole})` : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-[120px] flex flex-col gap-1 text-[10px]">
                            <div className="flex justify-between text-gray-400">
                              <span>Delivered:</span>
                              <span className="font-semibold">{item.deliveryCount}/{item.sentCount} ({deliveryPct}%)</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${deliveryPct}%` }} />
                            </div>
                            <div className="flex justify-between text-gray-400 mt-0.5">
                              <span>Opened:</span>
                              <span className="font-semibold">{item.openCount} ({openPct}%)</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className={`${getStatusColor(item.status)} text-[10px] py-0.5`}>
                              {item.status}
                            </Badge>
                            {item.error && (
                              <span className="text-[8px] text-red-400 block max-w-[90px] truncate" title={item.error}>
                                {item.error}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {item.scheduledAt ? (
                            <div className="flex items-center gap-1 text-amber-400" title={`Scheduled for ${formatDate(item.scheduledAt)}`}>
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(item.scheduledAt)}</span>
                            </div>
                          ) : (
                            <div>{formatDate(item.createdAt)}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => openDetails(item)}
                              variant="outline"
                              className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 h-7 w-7 p-0"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            
                            <Button
                              onClick={() => openEdit(item)}
                              variant="outline"
                              className="border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 h-7 w-7 p-0"
                              title="Edit campaign"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>

                            {item.status !== "PENDING" && (
                              <Button
                                onClick={() => handleResend(item)}
                                variant="outline"
                                className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15 h-7 w-7 p-0"
                                title="Resend Notification"
                                disabled={resendMutation.isPending}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <Button
                              onClick={() => openDelete(item)}
                              variant="outline"
                              className="border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 h-7 w-7 p-0"
                              title="Delete campaign"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compose Campaign Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="border-white/10 bg-[#161616] text-white sm:max-w-[600px] max-h-[85vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <Send className="h-5 w-5 text-primary" />
              Compose Notification Campaign
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleComposeSubmit} className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter alert title"
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className={`${selectClass} w-full`}
                >
                  <option value="general">General Broadcast</option>
                  <option value="promotions">Promotions & Marketing</option>
                  <option value="orders">Orders & Logistics</option>
                  <option value="system">System Alerts</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold">Summary / Description (Short)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Alert description (shown in push drawer)..."
                className={`${textareaClass} w-full resize-none`}
                rows={2}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold">Message Body (Full HTML/Markdown text)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Detailed message content (shown in user inbox)..."
                className={`${textareaClass} w-full resize-none`}
                rows={3}
              />
            </div>

            {/* Notification Type Toggle (Normal vs Rich) */}
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400 font-semibold">Notification Type</label>
                <div className="flex gap-2 bg-white/5 p-0.5 rounded border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationType("NORMAL");
                      setImageUrl("");
                      setImageFile(null);
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      notificationType === "NORMAL" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationType("RICH")}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      notificationType === "RICH" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Rich (Image attachment)
                  </button>
                </div>
              </div>

              {notificationType === "RICH" && (
                <div className="space-y-2.5 bg-white/5 p-3 rounded-lg border border-white/5 animate-in-fade-slide">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-400">Image Source</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImageType("url")}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          imageType === "url" ? "bg-primary text-white" : "bg-white/5 text-gray-400"
                        }`}
                      >
                        Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageType("file")}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          imageType === "file" ? "bg-primary text-white" : "bg-white/5 text-gray-400"
                        }`}
                      >
                        Upload Local
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
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="border-white/10 bg-white/5 text-white file:bg-white/10 file:text-white file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 text-xs h-9"
                      />
                    </div>
                  )}

                  {/* Image Live Preview */}
                  {imageUrl && (
                    <div className="mt-2.5 border border-white/10 rounded-lg overflow-hidden max-h-[140px] flex justify-center bg-black/30">
                      <img src={imageUrl} alt="Preview" className="h-full object-contain max-h-[140px]" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery type alert, silent, live activity */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Delivery Type</label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className={`${selectClass} w-full`}
                >
                  <option value="ALERT">Alert Notification (Immediate visual/sound)</option>
                  <option value="SILENT">Silent Notification (Background data sync)</option>
                  <option value="LIVE_ACTIVITY">Live Activity / Live Update</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Delivery Medium</label>
                <select
                  value={deliveryChannel}
                  onChange={(e) => setDeliveryChannel(e.target.value)}
                  className={`${selectClass} w-full`}
                >
                  <option value="BOTH">In-App Inbox & Push Notification</option>
                  <option value="IN_APP">In-App Inbox Only</option>
                  <option value="FCM">Push Notification Only</option>
                </select>
              </div>
            </div>

            {/* Priority & Deep Link */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`${selectClass} w-full`}
                >
                  <option value="MEDIUM">Medium Priority (Standard)</option>
                  <option value="HIGH">High Priority (Immediate delivery)</option>
                  <option value="LOW">Low Priority (Non-urgent)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Deep Link / Navigation Route</label>
                <Input
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  placeholder="e.g. /profile/settings or app://chat"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Action Button & Redirection Targets */}
            <div className="space-y-3 border-t border-white/5 pt-3">
              <label className="text-xs text-gray-400 font-semibold">Action Button & Redirection</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <select
                    value={redirectType}
                    onChange={(e) => {
                      setRedirectType(e.target.value);
                      setRedirectId("");
                      setExternalUrl("");
                      setRedirectSearch("");
                      if (e.target.value === "none") {
                        setActionButtonText("");
                      } else if (e.target.value === "product") {
                        setActionButtonText("Buy Now");
                      } else if (e.target.value === "category") {
                        setActionButtonText("Shop Now");
                      } else if (e.target.value === "external") {
                        setActionButtonText("View Details");
                      }
                    }}
                    className={`${selectClass} w-full`}
                  >
                    <option value="none">No Button / No Link</option>
                    <option value="product">"Buy Now" Button (Product Page)</option>
                    <option value="category">"Shop Now" Button (Category Page)</option>
                    <option value="external">"View Details" Button (External Website)</option>
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

                  {(redirectType === "product" || redirectType === "category") && (
                    <div className="relative">
                      <Input
                        value={redirectSearch}
                        onChange={(e) => setRedirectSearch(e.target.value)}
                        placeholder={`Search ${redirectType}...`}
                        className={inputClass}
                      />
                      {redirectSearch.trim().length > 0 && !redirectId && (
                        <div className="absolute z-50 left-0 right-0 max-h-[140px] overflow-y-auto rounded border border-white/10 bg-[#121212] divide-y divide-white/5 shadow-2xl">
                          {filteredRedirectTargets().length === 0 && (
                            <p className="text-xs text-gray-500 p-2">No items found</p>
                          )}
                          {filteredRedirectTargets().map((item: any) => (
                            <button
                              key={item._id}
                              type="button"
                              onClick={() => {
                                setRedirectId(item._id);
                                setRedirectSearch(item.title);
                              }}
                              className="flex w-full items-center justify-between p-2 text-left text-xs text-gray-300 hover:bg-white/5 transition-colors"
                            >
                              <span>{item.title}</span>
                              <span className="text-[10px] text-gray-500">{item._id.slice(-6)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {redirectType !== "none" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Custom Action Button Text</label>
                  <Input
                    value={actionButtonText}
                    onChange={(e) => setActionButtonText(e.target.value)}
                    placeholder="Enter button text (e.g. Buy Now, Shop Now, Get Coupon)"
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Target Audience Selectors */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Target Audience</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className={`${selectClass} w-full`}
                >
                  <option value="ALL">All Active Users</option>
                  <option value="ROLE">Role Based</option>
                  <option value="SPECIFIC">Single Specific User</option>
                </select>
              </div>

              {targetType === "ROLE" && (
                <div className="space-y-1 animate-in-fade-slide">
                  <label className="text-xs text-gray-400 font-semibold">Target User Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className={`${selectClass} w-full`}
                  >
                    <option value="USER">Customer (USER)</option>
                    <option value="SELLER">Merchant (SELLER)</option>
                    <option value="DELIVERY">Delivery Rider (DELIVERY)</option>
                    <option value="ADMIN">Staff (ADMIN)</option>
                  </select>
                </div>
              )}

              {targetType === "SPECIFIC" && (
                <div className="space-y-1 animate-in-fade-slide relative">
                  <label className="text-xs text-gray-400 font-semibold">User Search (Name/Email/Phone)</label>
                  <Input
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      if (targetUser) setTargetUser("");
                    }}
                    placeholder="Search name/email/phone..."
                    className={inputClass}
                  />
                  {userSearch.trim().length > 0 && !targetUser && (
                    <div className="absolute z-50 left-0 right-0 max-h-[140px] overflow-y-auto rounded border border-white/10 bg-[#121212] divide-y divide-white/5 shadow-2xl">
                      {peopleQuery.isLoading && <p className="text-xs text-gray-500 p-2">Searching...</p>}
                      {!peopleQuery.isLoading && candidates.length === 0 && (
                        <p className="text-xs text-gray-500 p-2">No users found</p>
                      )}
                      {candidates.map((person: any) => (
                        <button
                          key={person._id}
                          type="button"
                          onClick={() => {
                            setTargetUser(person._id);
                            setUserSearch(`${person.fullName} (${person.email})`);
                          }}
                          className="flex w-full flex-col p-2 text-left text-xs text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          <span className="font-semibold text-white">{person.fullName}</span>
                          <span className="text-[10px] text-gray-500">{person.email} · {person.role}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scheduled Deliveries */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Scheduled Time (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Expiration Time (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

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
                disabled={
                  sendMutation.isPending ||
                  (targetType === "SPECIFIC" && !targetUser) ||
                  (notificationType === "RICH" && imageType === "file" && !imageFile)
                }
                className="bg-primary hover:bg-primary/95 text-white"
              >
                {sendMutation.isPending ? "Queuing..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-white/10 bg-[#161616] text-white sm:max-w-[600px] max-h-[85vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <Edit3 className="h-5 w-5 text-cyan-400" />
              Edit Campaign Details
            </DialogTitle>
          </DialogHeader>

          {activeNotification && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-3">
              {activeNotification.status !== "PENDING" && (
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Campaign Dispatched</span>
                    <span>
                      This campaign is currently in status <strong>{activeNotification.status}</strong>. Edits will update the user's In-App Inbox. Push notifications cannot be recalled.
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter alert title"
                    className={inputClass}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className={`${selectClass} w-full`}
                    disabled={activeNotification.status !== "PENDING"}
                  >
                    <option value="general">General Broadcast</option>
                    <option value="promotions">Promotions & Marketing</option>
                    <option value="orders">Orders & Logistics</option>
                    <option value="system">System Alerts</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Summary / Description (Short)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${textareaClass} w-full resize-none`}
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Message Body (Full inbox content)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className={`${textareaClass} w-full resize-none`}
                  rows={3}
                />
              </div>

              {/* Rich Toggle */}
              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400 font-semibold">Notification Type</label>
                  <div className="flex gap-2 bg-white/5 p-0.5 rounded border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationType("NORMAL");
                        setImageUrl("");
                      }}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        notificationType === "NORMAL" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                      }`}
                      disabled={activeNotification.status !== "PENDING"}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationType("RICH")}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        notificationType === "RICH" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                      }`}
                      disabled={activeNotification.status !== "PENDING"}
                    >
                      Rich
                    </button>
                  </div>
                </div>

                {notificationType === "RICH" && (
                  <div className="space-y-2 bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-[11px] text-gray-400">Image Source (URL)</span>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.png"
                      className={inputClass}
                      disabled={activeNotification.status !== "PENDING"}
                    />
                    {imageUrl && (
                      <div className="mt-2 border border-white/10 rounded-lg overflow-hidden max-h-[140px] flex justify-center bg-black/30">
                        <img src={imageUrl} alt="Preview" className="h-full object-contain max-h-[140px]" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery channels */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Delivery Type</label>
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className={`${selectClass} w-full`}
                    disabled={activeNotification.status !== "PENDING"}
                  >
                    <option value="ALERT">Alert Notification</option>
                    <option value="SILENT">Silent Notification</option>
                    <option value="LIVE_ACTIVITY">Live Activity</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Delivery Medium</label>
                  <select
                    value={deliveryChannel}
                    onChange={(e) => setDeliveryChannel(e.target.value)}
                    className={`${selectClass} w-full`}
                    disabled={activeNotification.status !== "PENDING"}
                  >
                    <option value="BOTH">Push & In-App</option>
                    <option value="IN_APP">In-App Inbox Only</option>
                    <option value="FCM">Push Only</option>
                  </select>
                </div>
              </div>

              {/* Priority & Route */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={`${selectClass} w-full`}
                    disabled={activeNotification.status !== "PENDING"}
                  >
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Deep Link</label>
                  <Input
                    value={deepLink}
                    onChange={(e) => setDeepLink(e.target.value)}
                    placeholder="Route link..."
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Scheduled date edit */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Scheduled Date</label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className={inputClass}
                    disabled={activeNotification.status !== "PENDING"}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Expiration Date</label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className={inputClass}
                    disabled={activeNotification.status !== "PENDING"}
                  />
                </div>
              </div>

              {/* Live Status Selector for non-pending */}
              {activeNotification.status !== "PENDING" && (
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs text-gray-400 font-semibold">Campaign Status (Live Update)</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className={`${selectClass} w-full`}
                    >
                      <option value="SENT">Sent</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="OPENED">Opened</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                </div>
              )}

              <DialogFooter className="border-t border-white/5 pt-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-white/10 bg-white/5 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-primary hover:bg-primary/95 text-white"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="border-white/10 bg-[#161616] text-white sm:max-w-[550px] shadow-2xl">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <FileText className="h-5 w-5 text-primary" />
              Campaign Details
            </DialogTitle>
          </DialogHeader>

          {activeNotification && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-lg break-all">{activeNotification.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">Channel: {activeNotification.channel} · Type: {activeNotification.notificationType}</p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(activeNotification.status)} py-0.5 text-xs font-semibold`}>
                  {activeNotification.status}
                </Badge>
              </div>

              <div className="border border-white/5 bg-white/5 rounded-lg p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Alert description</span>
                <p className="text-gray-200 text-xs break-all">{activeNotification.description}</p>
              </div>

              {activeNotification.body && activeNotification.body !== activeNotification.description && (
                <div className="border border-white/5 bg-white/5 rounded-lg p-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Inbox full body</span>
                  <p className="text-gray-200 text-xs break-all whitespace-pre-wrap">{activeNotification.body}</p>
                </div>
              )}

              {activeNotification.imageUrl && (
                <div className="border border-white/5 rounded-lg overflow-hidden max-h-[160px] flex justify-center bg-black/40">
                  <img src={activeNotification.imageUrl} alt="" className="object-contain max-h-[160px]" />
                </div>
              )}

              {/* Grid information */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Delivery Mode:</span>
                  <span className="text-white font-semibold">
                    {activeNotification.deliveryChannel === "BOTH" ? "Push & In-App" : activeNotification.deliveryChannel === "FCM" ? "Push Only" : "In-App Only"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Priority:</span>
                  <Badge variant="outline" className={`${getPriorityColor(activeNotification.priority)} text-[10px] py-0 mt-0.5`}>
                    {activeNotification.priority}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Target Audience:</span>
                  <span className="text-white font-semibold">
                    {activeNotification.targetType} {activeNotification.targetRole ? `(${activeNotification.targetRole})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Deep Link:</span>
                  <span className="text-cyan-400 font-semibold break-all">{activeNotification.deepLink || "None"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Scheduled delivery:</span>
                  <span className="text-white">{activeNotification.scheduledAt ? formatDate(activeNotification.scheduledAt) : "Immediate"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Expiration date:</span>
                  <span className="text-white">{activeNotification.expiresAt ? formatDate(activeNotification.expiresAt) : "Never"}</span>
                </div>
              </div>

              {/* Delivery stats */}
              <div className="border-t border-white/5 pt-3 space-y-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Real-time statistics</span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white/5 rounded p-2 border border-white/5">
                    <span className="text-xs text-gray-400 block">Sent</span>
                    <span className="text-sm font-bold text-white">{activeNotification.sentCount}</span>
                  </div>
                  <div className="bg-white/5 rounded p-2 border border-white/5">
                    <span className="text-xs text-gray-400 block">Delivered</span>
                    <span className="text-sm font-bold text-teal-400">{activeNotification.deliveryCount}</span>
                  </div>
                  <div className="bg-white/5 rounded p-2 border border-white/5">
                    <span className="text-xs text-gray-400 block">Opened</span>
                    <span className="text-sm font-bold text-blue-400">{activeNotification.openCount}</span>
                  </div>
                  <div className="bg-white/5 rounded p-2 border border-white/5">
                    <span className="text-xs text-gray-400 block">Failed</span>
                    <span className="text-sm font-bold text-rose-400">{activeNotification.failedCount}</span>
                  </div>
                </div>
              </div>

              {activeNotification.error && (
                <div className="border border-rose-500/20 bg-rose-500/5 rounded-lg p-3 text-xs text-rose-400 flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Delivery Error:</span>
                    <span className="break-all">{activeNotification.error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-white/5 pt-3">
            <Button
              onClick={() => setIsDetailsOpen(false)}
              className="bg-primary hover:bg-primary/95 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="border-white/10 bg-[#161616] text-white max-w-sm shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <Trash2 className="h-5 w-5" />
              Delete Campaign?
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-300">
            Are you sure you want to delete this notification campaign? Any scheduled BullMQ jobs will be cancelled. This action cannot be undone.
          </div>
          <DialogFooter className="pt-2">
            <Button
              onClick={() => setIsDeleteOpen(false)}
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSubmit}
              disabled={deleteMutation.isPending}
              variant="destructive"
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
