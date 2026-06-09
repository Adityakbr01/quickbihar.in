"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  RefreshCcw,
  Ruler,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  TicketPercent,
  Users,
  WalletCards,
  Warehouse,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/features/auth/store/authStore";
import { SellerPayoutMethod, SellerPayoutMethodPayload } from "@/features/seller/api/sellerPanel.api";
import {
  useAddPayoutMethod,
  useRequestMallConnection,
  useRequestMallCreation,
  useRequestSellerPayout,
  useSellerSetupStatus,
  useSetDefaultPayoutMethod,
} from "@/features/seller/hooks/useSellerPanel";
import { cn } from "@/lib/utils";

const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-gray-500";
const selectClass = "h-9 rounded-lg border border-white/10 bg-[#181818] px-2 text-sm text-white outline-none";

const sellerNavigation = [
  {
    title: "Workspace",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "products", label: "Products", icon: <Package className="h-4 w-4" /> },
      { id: "categories", label: "Categories", icon: <Tags className="h-4 w-4" /> },
      { id: "inventory", label: "Inventory", icon: <Warehouse className="h-4 w-4" /> },
      { id: "orders", label: "Orders", icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    title: "Growth",
    items: [
      { id: "coupons", label: "Coupons", icon: <TicketPercent className="h-4 w-4" /> },
      { id: "customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
      { id: "banner", label: "Banner", icon: <ImageIcon className="h-4 w-4" /> },
      { id: "reports", label: "Reports", icon: <ReceiptText className="h-4 w-4" /> },
      { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    ],
  },
  {
    title: "Setup",
    items: [
      { id: "store", label: "Store", icon: <Store className="h-4 w-4" /> },
      { id: "mall", label: "Mall", icon: <Building2 className="h-4 w-4" /> },
      { id: "size-chart", label: "Size Chart", icon: <Ruler className="h-4 w-4" /> },
      { id: "payouts", label: "Payout & Earnings", icon: <WalletCards className="h-4 w-4" /> },
    ],
  },
] as const;

type SellerSection = (typeof sellerNavigation)[number]["items"][number]["id"];

const sectionLabels: Record<SellerSection, string> = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  orders: "Orders",
  coupons: "Coupons",
  customers: "Customers",
  store: "Store",
  mall: "Mall",
  banner: "Banner",
  "size-chart": "Size Chart",
  payouts: "Payout & Earnings",
  reports: "Reports",
  notifications: "Notifications",
};

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<SellerSection>("dashboard");
  const setupQuery = useSellerSetupStatus();

  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
  const isSellerUser = roleName === "SELLER";

  useEffect(() => {
    const persistApi = useAuthStore.persist;

    if (!persistApi) {
      queueMicrotask(() => setHasHydrated(true));
      return;
    }

    if (persistApi.hasHydrated()) {
      queueMicrotask(() => setHasHydrated(true));
      return;
    }

    return persistApi.onFinishHydration(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !isSellerUser) {
      router.replace("/seller/login");
    }
  }, [hasHydrated, isAuthenticated, isSellerUser, router]);

  const setup = setupQuery.data;
  const wallet = setup?.seller.wallet;
  const payoutMethods = setup?.seller.payoutMethods || [];

  if (!hasHydrated || !isAuthenticated || !isSellerUser) {
    return <div className="min-h-screen bg-[#121212]" />;
  }

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <SellerSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-col gap-3 border-b border-white/10 bg-[#121212] px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Seller Panel</h1>
              <p className="text-sm text-gray-400">{sectionLabels[activeSection]}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setupQuery.refetch()}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  clearAuth();
                  router.replace("/seller/login");
                }}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </header>

          <ScrollArea className="h-[calc(100vh-81px)] bg-[#121212]">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6">
              {setupQuery.isLoading && <div className="py-10 text-sm text-gray-400">Loading seller workspace...</div>}

              {!setupQuery.isLoading && setup && activeSection === "dashboard" && (
                <SellerOverview setup={setup.setup} wallet={wallet} payoutMethods={payoutMethods} />
              )}

              {!setupQuery.isLoading && setup && activeSection === "store" && (
                <StoreSetupPanel store={setup.store} missingFields={setup.setup.storeMissingFields} />
              )}

              {!setupQuery.isLoading && setup && activeSection === "mall" && (
                <MallPanel mallName={setup.seller.mallName} mallUnit={setup.seller.mallUnit} mallFloor={setup.seller.mallFloor} />
              )}

              {!setupQuery.isLoading && setup && activeSection === "payouts" && (
                <PayoutPanel wallet={wallet} methods={payoutMethods} />
              )}

              {!setupQuery.isLoading && setup && !["dashboard", "store", "mall", "payouts"].includes(activeSection) && (
                <SellerModulePanel activeSection={activeSection} productsUnlocked={setup.setup.productsUnlocked} />
              )}
            </div>
          </ScrollArea>
        </section>
      </div>
    </main>
  );
}

function SellerSidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: SellerSection;
  onSectionChange: (section: SellerSection) => void;
}) {
  return (
    <aside className="border-b border-white/10 bg-[#101010] lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2 text-white">
            <ShoppingBag className="h-5 w-5 text-emerald-300" />
            <span className="text-lg font-semibold">Fashion Seller</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">QuickBihar Clothing</p>
        </div>

        <ScrollArea className="flex-1">
          <nav className="grid gap-5 p-4">
            {sellerNavigation.map((group) => (
              <div key={group.title}>
                <div className="mb-2 px-2 text-xs font-medium uppercase text-gray-500">{group.title}</div>
                <div className="grid gap-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        "flex min-h-10 items-center gap-2 rounded-lg px-3 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white",
                        activeSection === item.id && "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20",
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}

function SellerOverview({
  setup,
  wallet,
  payoutMethods,
}: {
  setup: {
    sellerApproved: boolean;
    storeExists: boolean;
    storeConfigured: boolean;
    storeActive: boolean;
    hasVerifiedPayoutMethod: boolean;
    productsUnlocked: boolean;
    payoutsUnlocked: boolean;
    mallLinked: boolean;
    mallOptional: boolean;
  };
  wallet?: {
    availableBalance: number;
    pendingPayoutBalance: number;
    lifetimeEarnings: number;
  };
  payoutMethods: SellerPayoutMethod[];
}) {
  const checklist = [
    { label: "Seller approval", done: setup.sellerApproved },
    { label: "Store created", done: setup.storeExists },
    { label: "Store configured", done: setup.storeConfigured },
    { label: "Store active", done: setup.storeActive },
    { label: "Payout verified", done: setup.hasVerifiedPayoutMethod },
    { label: "Products unlocked", done: setup.productsUnlocked },
    { label: "Mall optional", done: setup.mallOptional },
  ];

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric title="Available Balance" value={`Rs. ${formatAmount(wallet?.availableBalance || 0)}`} icon={<WalletCards className="h-4 w-4" />} />
        <Metric title="Pending Payout" value={`Rs. ${formatAmount(wallet?.pendingPayoutBalance || 0)}`} icon={<ReceiptText className="h-4 w-4" />} />
        <Metric title="Payout Methods" value={payoutMethods.length} icon={<Settings className="h-4 w-4" />} />
      </section>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Seller Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <span className="text-sm text-gray-300">{item.label}</span>
              {item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <XCircle className="h-4 w-4 text-red-300" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StoreSetupPanel({ store, missingFields }: { store: { name?: string; isActive?: boolean; isSetupComplete?: boolean } | null; missingFields: string[] }) {
  return (
    <div className="grid gap-4">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Store className="h-4 w-4 text-emerald-300" />
            Store Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <StatusTile title="Store" label={store?.name || "No store"} active={Boolean(store)} />
          <StatusTile title="Configuration" label={store?.isSetupComplete ? "Complete" : "Incomplete"} active={Boolean(store?.isSetupComplete)} />
          <StatusTile title="Availability" label={store?.isActive ? "Active" : "Inactive"} active={Boolean(store?.isActive)} />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Required Configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {missingFields.length ? missingFields.map((field) => (
            <Badge key={field} variant="outline" className="border-amber-400/30 text-amber-300">{field}</Badge>
          )) : <Badge variant="outline" className="border-emerald-400/30 text-emerald-300">Ready for products</Badge>}
        </CardContent>
      </Card>
    </div>
  );
}

function MallPanel({ mallName, mallUnit, mallFloor }: { mallName?: string; mallUnit?: string; mallFloor?: string }) {
  const requestMallConnection = useRequestMallConnection();
  const requestMallCreation = useRequestMallCreation();
  const [existingMallId, setExistingMallId] = useState("");
  const [connectUnit, setConnectUnit] = useState("");
  const [connectFloor, setConnectFloor] = useState("");
  const [connectMessage, setConnectMessage] = useState("");
  const [mallNameInput, setMallNameInput] = useState("");
  const [mallCity, setMallCity] = useState("");
  const [mallState, setMallState] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newFloor, setNewFloor] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const submitConnection = (event: FormEvent) => {
    event.preventDefault();
    requestMallConnection.mutate({
      mallId: existingMallId,
      mallUnit: optionalValue(connectUnit),
      mallFloor: optionalValue(connectFloor),
      message: optionalValue(connectMessage),
    });
  };

  const submitMallCreation = (event: FormEvent) => {
    event.preventDefault();
    requestMallCreation.mutate(
      {
        name: mallNameInput,
        address: {
          city: optionalValue(mallCity),
          state: optionalValue(mallState),
        },
        mallUnit: optionalValue(newUnit),
        mallFloor: optionalValue(newFloor),
        message: optionalValue(newMessage),
      },
      {
        onSuccess: () => {
          setMallNameInput("");
          setMallCity("");
          setMallState("");
          setNewUnit("");
          setNewFloor("");
          setNewMessage("");
        },
      },
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Mall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTile
            title="Current Mall"
            label={mallName ? [mallName, mallUnit, mallFloor].filter(Boolean).join(" / ") : "Independent seller"}
            active={Boolean(mallName)}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Connect Existing Mall</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitConnection} className="grid gap-3">
            <Input value={existingMallId} onChange={(event) => setExistingMallId(event.target.value)} placeholder="Mall ID" required className={inputClass} />
            <div className="grid grid-cols-2 gap-2">
              <Input value={connectUnit} onChange={(event) => setConnectUnit(event.target.value)} placeholder="Unit" className={inputClass} />
              <Input value={connectFloor} onChange={(event) => setConnectFloor(event.target.value)} placeholder="Floor" className={inputClass} />
            </div>
            <Input value={connectMessage} onChange={(event) => setConnectMessage(event.target.value)} placeholder="Message" className={inputClass} />
            <Button type="submit" disabled={requestMallConnection.isPending}>
              <Building2 className="h-4 w-4" />
              Request Link
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c] xl:col-span-2">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Request New Mall</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitMallCreation} className="grid gap-3 md:grid-cols-2">
            <Input value={mallNameInput} onChange={(event) => setMallNameInput(event.target.value)} placeholder="Mall name" required className={inputClass} />
            <Input value={mallCity} onChange={(event) => setMallCity(event.target.value)} placeholder="City" className={inputClass} />
            <Input value={mallState} onChange={(event) => setMallState(event.target.value)} placeholder="State" className={inputClass} />
            <Input value={newUnit} onChange={(event) => setNewUnit(event.target.value)} placeholder="Unit" className={inputClass} />
            <Input value={newFloor} onChange={(event) => setNewFloor(event.target.value)} placeholder="Floor" className={inputClass} />
            <Input value={newMessage} onChange={(event) => setNewMessage(event.target.value)} placeholder="Message" className={inputClass} />
            <div className="md:col-span-2">
              <Button type="submit" disabled={requestMallCreation.isPending}>
                <Building2 className="h-4 w-4" />
                Request Mall
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutPanel({
  wallet,
  methods,
}: {
  wallet?: {
    availableBalance: number;
    pendingPayoutBalance: number;
    lifetimeEarnings: number;
  };
  methods: SellerPayoutMethod[];
}) {
  const addPayoutMethod = useAddPayoutMethod();
  const setDefaultPayoutMethod = useSetDefaultPayoutMethod();
  const requestPayout = useRequestSellerPayout();
  const [methodType, setMethodType] = useState<"UPI" | "BANK">("UPI");
  const [upiId, setUpiId] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [amount, setAmount] = useState("");
  const [payoutMethodId, setPayoutMethodId] = useState("");

  const verifiedMethods = useMemo(() => methods.filter((method) => method.status === "VERIFIED"), [methods]);

  const submitMethod = (event: FormEvent) => {
    event.preventDefault();
    const payload: SellerPayoutMethodPayload =
      methodType === "UPI"
        ? { type: "UPI", upi: { upiId } }
        : { type: "BANK", bank: { accountHolderName, accountNumber, ifsc, bankName } };

    addPayoutMethod.mutate(payload, {
      onSuccess: () => {
        setUpiId("");
        setAccountHolderName("");
        setAccountNumber("");
        setIfsc("");
        setBankName("");
      },
    });
  };

  const submitPayout = (event: FormEvent) => {
    event.preventDefault();
    requestPayout.mutate({ amount: Number(amount), payoutMethodId }, { onSuccess: () => setAmount("") });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Earnings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <StatusTile title="Available" label={`Rs. ${formatAmount(wallet?.availableBalance || 0)}`} active />
          <StatusTile title="Pending" label={`Rs. ${formatAmount(wallet?.pendingPayoutBalance || 0)}`} active={Boolean(wallet?.pendingPayoutBalance)} />
          <StatusTile title="Lifetime" label={`Rs. ${formatAmount(wallet?.lifetimeEarnings || 0)}`} active />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Payout Methods</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {methods.length ? methods.map((method) => (
            <div key={method._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{method.type}</div>
                  <div className="text-xs text-gray-500">{payoutMethodLabel(method)}</div>
                </div>
                <StatusBadge active={method.status === "VERIFIED"} label={method.status} />
              </div>
              {method.status === "VERIFIED" && !method.isDefault && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setDefaultPayoutMethod.mutate(method._id)}
                >
                  Set Default
                </Button>
              )}
            </div>
          )) : <div className="text-sm text-gray-400">No payout methods added.</div>}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Add Payout Method</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitMethod} className="grid gap-3">
            <select value={methodType} onChange={(event) => setMethodType(event.target.value as "UPI" | "BANK")} className={selectClass}>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank</option>
            </select>
            {methodType === "UPI" ? (
              <Input value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="UPI ID" required className={inputClass} />
            ) : (
              <>
                <Input value={accountHolderName} onChange={(event) => setAccountHolderName(event.target.value)} placeholder="Account holder" required className={inputClass} />
                <Input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder="Account number" required className={inputClass} />
                <Input value={ifsc} onChange={(event) => setIfsc(event.target.value)} placeholder="IFSC" required className={inputClass} />
                <Input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Bank name" required className={inputClass} />
              </>
            )}
            <Button type="submit" disabled={addPayoutMethod.isPending}>
              <WalletCards className="h-4 w-4" />
              Submit Method
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#1c1c1c]">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base text-white">Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitPayout} className="grid gap-3">
            <select value={payoutMethodId} onChange={(event) => setPayoutMethodId(event.target.value)} required className={selectClass}>
              <option value="">Verified method</option>
              {verifiedMethods.map((method) => (
                <option key={method._id} value={method._id}>{method.type} - {payoutMethodLabel(method)}</option>
              ))}
            </select>
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" type="number" min="1" required className={inputClass} />
            <Button type="submit" disabled={requestPayout.isPending || !verifiedMethods.length}>
              <WalletCards className="h-4 w-4" />
              Request Payout
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SellerModulePanel({ activeSection, productsUnlocked }: { activeSection: SellerSection; productsUnlocked: boolean }) {
  const modules: Record<SellerSection, Array<{ label: string; active: boolean }>> = {
    dashboard: [],
    products: [
      { label: "Create product", active: productsUnlocked },
      { label: "Edit catalog", active: productsUnlocked },
      { label: "Category assigned", active: productsUnlocked },
    ],
    categories: [
      { label: "Assigned categories", active: productsUnlocked },
      { label: "Fashion subcategories", active: productsUnlocked },
    ],
    inventory: [
      { label: "Stock tracking", active: productsUnlocked },
      { label: "Low stock alerts", active: productsUnlocked },
    ],
    orders: [
      { label: "Order list", active: true },
      { label: "Fulfillment status", active: true },
    ],
    coupons: [
      { label: "Seller coupons", active: true },
      { label: "Discount rules", active: true },
    ],
    customers: [
      { label: "Customer list", active: true },
      { label: "Repeat buyers", active: true },
    ],
    store: [],
    mall: [],
    banner: [
      { label: "Store banners", active: true },
      { label: "Promotional slots", active: true },
    ],
    "size-chart": [
      { label: "Size templates", active: true },
      { label: "Product mapping", active: productsUnlocked },
    ],
    payouts: [],
    reports: [
      { label: "Sales report", active: true },
      { label: "Product performance", active: productsUnlocked },
    ],
    notifications: [
      { label: "Seller alerts", active: true },
      { label: "Order updates", active: true },
    ],
  };

  return (
    <Card className="border-white/10 bg-[#1c1c1c]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-base text-white">{sectionLabels[activeSection]}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules[activeSection].map((item) => (
          <StatusTile key={item.label} title={item.label} label={item.active ? "Available" : "Locked"} active={item.active} />
        ))}
      </CardContent>
    </Card>
  );
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) {
  return (
    <Card className="border-white/10 bg-[#1c1c1c]" size="sm">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2 text-emerald-300">{icon}</div>
      </CardContent>
    </Card>
  );
}

function StatusTile({ title, label, active }: { title: string; label: string; active: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{title}</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white">{label}</div>
        {active ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <XCircle className="h-4 w-4 text-red-300" />}
      </div>
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <Badge variant="outline" className={active ? "border-emerald-400/30 text-emerald-300" : "border-red-400/30 text-red-300"}>
      {label}
    </Badge>
  );
}

function payoutMethodLabel(method: SellerPayoutMethod) {
  if (method.type === "BANK") {
    const account = method.bank?.accountNumber || "";
    return [method.bank?.bankName, account ? `A/C ${account.slice(-4)}` : undefined].filter(Boolean).join(" - ") || "Bank account";
  }

  if (method.type === "UPI") return method.upi?.upiId || "UPI";
  if (method.type === "PAYPAL") return method.paypal?.email || "PayPal";
  return method.stripeConnect?.accountId || "Stripe Connect";
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}
