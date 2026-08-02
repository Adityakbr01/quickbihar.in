export interface MockOrder {
  id: string;
  date: string;
  status: "Delivered" | "Shipped" | "Processing" | "Cancelled";
  statusColor: string;
  items: { name: string; metal: string; qty: number; price: number; imageKey: string }[];
  total: number;
  address: string;
  trackingId?: string;
}

export interface MockAddress {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface MockCard {
  id: string;
  type: "Visa" | "Mastercard" | "RuPay";
  last4: string;
  holder: string;
  expiry: string;
  isDefault: boolean;
}

export interface SizeProfile {
  ringSize: string;
  bangleSize: string;
  chainLength: string;
  earringStyle: string;
  wristSize: string;
}

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "AAB-20241",
    date: "28 Apr 2026",
    status: "Delivered",
    statusColor: "#27ae60",
    items: [
      {
        name: "Kundan Choker Necklace",
        metal: "22K Gold",
        qty: 1,
        price: 48500,
        imageKey: "product_1",
      },
    ],
    total: 48500,
    address: "Flat 4B, Green Heights, Bandra West, Mumbai",
    trackingId: "BL9834721",
  },
  {
    id: "AAB-20198",
    date: "14 Mar 2026",
    status: "Delivered",
    statusColor: "#27ae60",
    items: [
      {
        name: "Temple Gold Jhumkas",
        metal: "22K Gold",
        qty: 1,
        price: 18200,
        imageKey: "product_2",
      },
      {
        name: "Polki Diamond Ring",
        metal: "18K Gold",
        qty: 1,
        price: 32700,
        imageKey: "product_3",
      },
    ],
    total: 50900,
    address: "Flat 4B, Green Heights, Bandra West, Mumbai",
    trackingId: "BL9701244",
  },
  {
    id: "AAB-20267",
    date: "3 May 2026",
    status: "Shipped",
    statusColor: "#2980b9",
    items: [
      {
        name: "Meenakari Bangles (Set of 4)",
        metal: "22K Gold",
        qty: 1,
        price: 54000,
        imageKey: "product_4",
      },
    ],
    total: 54000,
    address: "Flat 4B, Green Heights, Bandra West, Mumbai",
    trackingId: "BL9901112",
  },
];

export const MOCK_ADDRESSES: MockAddress[] = [
  {
    id: "addr-1",
    label: "Home",
    name: "Priya Sharma",
    line1: "Flat 4B, Green Heights Apartments",
    line2: "Hill Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    phone: "+91 98765 43210",
    isDefault: true,
  },
  {
    id: "addr-2",
    label: "Work",
    name: "Priya Sharma",
    line1: "Level 12, One BKC Tower",
    line2: "Bandra Kurla Complex",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400051",
    phone: "+91 98765 43210",
    isDefault: false,
  },
];

export const MOCK_CARDS: MockCard[] = [
  {
    id: "card-1",
    type: "Visa",
    last4: "4832",
    holder: "PRIYA SHARMA",
    expiry: "08/28",
    isDefault: true,
  },
  {
    id: "card-2",
    type: "Mastercard",
    last4: "9241",
    holder: "PRIYA SHARMA",
    expiry: "02/27",
    isDefault: false,
  },
];

export const MOCK_SIZE_PROFILE: SizeProfile = {
  ringSize: "16",
  bangleSize: "2-6",
  chainLength: "18 inches",
  earringStyle: "Hook / Jhumka",
  wristSize: "6.5 inches",
};

export const MOCK_CREDITS = 750;
