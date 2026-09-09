export interface BuxarLocation {
  slug: string;
  name: string;
  title: string;
  subdivision: "Buxar Sadar" | "Dumraon";
  block: string;
  pins: string[];
  localities: string[];
  deliveryTime: string;
  isCityHub?: boolean;
  isDistrictHub?: boolean;
  metaDescription: string;
  keywords: string[];
  faqs: { question: string; answer: string }[];
}

export const BUXAR_DISTRICT_HUB: BuxarLocation = {
  slug: "buxar",
  name: "Buxar District",
  title: "Online Fashion Shopping & Fast Clothes Delivery in Buxar, Bihar | QuickBihar",
  subdivision: "Buxar Sadar",
  block: "Buxar District (All 11 Blocks)",
  pins: [
    "802101", "802102", "802103", "802111", "802112", "802113", "802114",
    "802115", "802116", "802117", "802118", "802119", "802120", "802122",
    "802123", "802125", "802126", "802127", "802128", "802129", "802130",
    "802131", "802133", "802134", "802135", "802136"
  ],
  localities: [
    "Buxar City", "Dumraon", "Chausa", "Itarhi", "Rajpur", "Nawanagar",
    "Brahampur", "Kesath", "Chakki", "Chaugain", "Simri", "Civil Lines",
    "Naya Bazar", "Thatheri Bazar", "PP Road", "Ramrekha Ghat", "Purana Bhojpur"
  ],
  deliveryTime: "Same-Day & Express Delivery Across Buxar",
  isDistrictHub: true,
  metaDescription:
    "Shop latest fashion, ethnic wear, sarees, kurtis, jeans & kids clothing online in Buxar with ultra-fast doorstep delivery across all 11 blocks. Cash on Delivery available.",
  keywords: [
    "fashion app Buxar",
    "online shopping Buxar",
    "clothes delivery Buxar",
    "clothing store Buxar",
    "Buxar me kapde online",
    "same day fashion delivery Buxar",
    "online clothes shopping Buxar",
    "women clothing Buxar",
    "saree in Buxar",
    "kurti delivery Buxar",
    "men clothing Buxar",
    "बक्सर में ऑनलाइन कपड़े"
  ],
  faqs: [
    {
      question: "Does QuickBihar deliver clothes across all areas of Buxar district?",
      answer:
        "Yes, QuickBihar serves all 11 blocks of Buxar district including Buxar City, Dumraon, Chausa, Itarhi, Rajpur, Brahampur, and Simri with doorstep delivery."
    },
    {
      question: "Is Cash on Delivery (COD) available in Buxar?",
      answer:
        "Yes, Cash on Delivery (COD) as well as UPI, debit/credit cards, and net banking are accepted on all fashion orders across Buxar."
    },
    {
      question: "How fast is fashion delivery in Buxar city?",
      answer:
        "In Buxar city (PIN 802101, 802102, 802103), express orders are delivered within 60 to 120 minutes from trusted local fashion stores, while standard delivery takes same-day."
    },
    {
      question: "Can I exchange or return clothes if the size does not fit?",
      answer:
        "QuickBihar offers hassle-free easy returns and size exchanges on eligible clothing items across Buxar."
    }
  ]
};

export const BUXAR_LOCATIONS: BuxarLocation[] = [
  {
    slug: "buxar-city",
    name: "Buxar City",
    title: "Fashion Store & Fast Clothes Delivery in Buxar City (802101) | QuickBihar",
    subdivision: "Buxar Sadar",
    block: "Buxar",
    pins: ["802101", "802102", "802103", "802116"],
    localities: [
      "Civil Lines", "Naya Bazar", "Thatheri Bazar", "Ram Bagh", "PP Road",
      "Ramrekha Ghat", "Sohani Patti", "Satyadeo Ganj", "Khalasi Mohalla",
      "Ambedkar Chowk", "Golambar", "Pandeypatti", "Churamanpur", "Ahirauli", "Dalsagar"
    ],
    deliveryTime: "60–120 Minutes Express Delivery",
    isCityHub: true,
    metaDescription:
      "Buy sarees, kurtis, jeans, shirts & kids wear online in Buxar City with 60-120 min fast delivery. Serving Civil Lines, Naya Bazar, Thatheri Bazar, PP Road & Sohani Patti.",
    keywords: [
      "clothing store Buxar city",
      "clothes delivery Buxar 802101",
      "kurti in Buxar",
      "saree delivery Buxar",
      "Civil Lines Buxar shopping",
      "PP Road Buxar clothes",
      "Naya Bazar Buxar fashion",
      "Buxar me online shopping",
      "fast clothes delivery Buxar city"
    ],
    faqs: [
      {
        question: "Which localities in Buxar city are covered for express delivery?",
        answer:
          "We deliver to all major localities including Civil Lines, Naya Bazar, Thatheri Bazar, Ram Bagh, PP Road, Sohani Patti, Golambar, Pandeypatti, and Ramrekha Ghat."
      },
      {
        question: "How long does clothes delivery take in Buxar PIN 802101?",
        answer:
          "Orders within PIN 802101 and 802103 are fulfilled from local partner boutiques and delivered in 60 to 120 minutes."
      },
      {
        question: "Are authentic handloom sarees and ethnic wear available in Buxar?",
        answer:
          "Yes, we have a curated collection of bridal sarees, cotton handloom, festival kurtas, and designer lehengas from verified Buxar merchants."
      }
    ]
  },
  {
    slug: "dumraon",
    name: "Dumraon",
    title: "Online Fashion Shopping & Clothes Delivery in Dumraon (802119) | QuickBihar",
    subdivision: "Dumraon",
    block: "Dumraon",
    pins: ["802119", "802120", "802133", "802136"],
    localities: ["Dumraon Town", "Purana Bhojpur", "Dumraon Textiles", "Ariaon", "Dumari"],
    deliveryTime: "Same-Day Delivery",
    metaDescription:
      "Order stylish women's clothing, men's wear & kids fashion online in Dumraon. Fast delivery to Purana Bhojpur, Dumraon Textiles & nearby areas. Cash on Delivery available.",
    keywords: [
      "online shopping Dumraon",
      "clothes delivery Dumraon",
      "kurti in Dumraon",
      "saree store Dumraon",
      "fashion Dumraon 802119",
      "Dumraon me kapde online",
      "Purana Bhojpur clothes delivery"
    ],
    faqs: [
      {
        question: "Is same-day clothes delivery available in Dumraon?",
        answer:
          "Yes, orders placed in Dumraon town and Purana Bhojpur are delivered on the same day."
      },
      {
        question: "Which PIN codes are served in Dumraon subdivision?",
        answer:
          "We deliver across PIN codes 802119, 802120, 802133, and 802136."
      }
    ]
  },
  {
    slug: "chausa",
    name: "Chausa",
    title: "Online Clothes Shopping & Fast Delivery in Chausa (802114) | QuickBihar",
    subdivision: "Buxar Sadar",
    block: "Chausa",
    pins: ["802114"],
    localities: ["Chausa Bazar", "Akhauripur Gola", "Banarpur", "Rampur"],
    deliveryTime: "Same-Day / Next-Day Delivery",
    metaDescription:
      "Shop trending clothes, shirts, jeans, kurtis & sarees online in Chausa, Buxar. Reliable doorstep delivery in PIN 802114 with Cash on Delivery.",
    keywords: [
      "clothes delivery Chausa",
      "fashion Chausa 802114",
      "online clothes Chausa",
      "women clothing Chausa",
      "men fashion Chausa",
      "Chausa me kapde"
    ],
    faqs: [
      {
        question: "Do you deliver clothes in Chausa Bazar and nearby villages?",
        answer:
          "Yes, we deliver across Chausa block including Chausa Bazar, Akhauripur Gola, and Banarpur under PIN 802114."
      }
    ]
  },
  {
    slug: "itarhi",
    name: "Itarhi",
    title: "Clothes Delivery & Online Fashion Shopping in Itarhi (802123) | QuickBihar",
    subdivision: "Buxar Sadar",
    block: "Itarhi",
    pins: ["802123", "802127"],
    localities: ["Itarhi Bazar", "Murar", "Basantpur", "Kharhana"],
    deliveryTime: "Same-Day Delivery",
    metaDescription:
      "Buy ethnic wear, sarees, casual shirts & kids clothes online in Itarhi, Buxar. Doorstep delivery across PIN 802123 with easy returns & COD.",
    keywords: [
      "fashion Itarhi",
      "clothes delivery Itarhi",
      "online shopping Itarhi 802123",
      "Itarhi me kapde",
      "kurti in Itarhi"
    ],
    faqs: [
      {
        question: "Can I get women's and kids' clothing delivered in Itarhi?",
        answer:
          "Yes, we have extensive collections for women, men, and children delivered directly to your doorstep in Itarhi."
      }
    ]
  },
  {
    slug: "rajpur",
    name: "Rajpur",
    title: "Online Fashion Store & Fast Clothes Delivery in Rajpur, Buxar | QuickBihar",
    subdivision: "Buxar Sadar",
    block: "Rajpur",
    pins: ["802113", "802117", "802122", "802128"],
    localities: ["Barka Rajpur", "Dhansoi", "Hitwa Rajpur", "Deoria", "Manoharpur"],
    deliveryTime: "Same-Day Delivery",
    metaDescription:
      "Online clothes shopping in Rajpur & Dhansoi, Buxar. Sarees, kurtis, jeans, shirts & kids wear delivered to your home. Cash on Delivery available.",
    keywords: [
      "clothes delivery Rajpur Buxar",
      "fashion Rajpur 802113",
      "Dhansoi clothes delivery",
      "online shopping Rajpur Bihar",
      "Rajpur me kapda delivery"
    ],
    faqs: [
      {
        question: "Is delivery available in Dhansoi and Barka Rajpur?",
        answer:
          "Yes, QuickBihar delivers to both Barka Rajpur (PIN 802113) and Dhansoi (PIN 802117)."
      }
    ]
  },
  {
    slug: "nawanagar",
    name: "Nawanagar",
    title: "Fashion & Clothes Delivery in Nawanagar, Buxar (802129) | QuickBihar",
    subdivision: "Dumraon",
    block: "Nawanagar",
    pins: ["802129"],
    localities: ["Nawanagar Town", "Atimi", "Banni"],
    deliveryTime: "Same-Day Delivery",
    metaDescription:
      "Shop ethnic wear, shirts, jeans & sarees online in Nawanagar, Buxar. Fast doorstep delivery in PIN 802129 with Cash on Delivery.",
    keywords: ["online shopping Nawanagar", "clothes delivery Nawanagar", "Nawanagar 802129 fashion"],
    faqs: [
      {
        question: "Do you provide Cash on Delivery in Nawanagar?",
        answer: "Yes, Cash on Delivery is available across all orders in Nawanagar."
      }
    ]
  },
  {
    slug: "brahampur",
    name: "Brahampur",
    title: "Online Clothes Shopping in Brahampur, Buxar (802112) | QuickBihar",
    subdivision: "Dumraon",
    block: "Brahampur",
    pins: ["802112", "802134"],
    localities: ["Brahampur Chaurasta", "Barki Nainijor", "Raghunathpur"],
    deliveryTime: "Same-Day Delivery",
    metaDescription:
      "Buy sarees, kurtis, jeans & shirts online in Brahampur, Buxar. Doorstep delivery across PIN 802112 and 802134.",
    keywords: ["Brahampur clothes delivery", "fashion Brahampur 802112", "online shopping Brahampur Bihar"],
    faqs: [
      {
        question: "Can I order wedding & festival clothing in Brahampur?",
        answer: "Yes, QuickBihar offers festival kurtas, sarees, and suits delivered across Brahampur."
      }
    ]
  },
  {
    slug: "simri",
    name: "Simri",
    title: "Fashion Store & Clothes Delivery in Simri, Buxar (802135) | QuickBihar",
    subdivision: "Dumraon",
    block: "Simri",
    pins: ["802118", "802130", "802131", "802135"],
    localities: ["Simri Market", "Niazipur", "Nimej", "Dullahpur"],
    deliveryTime: "Same-Day Delivery",
    metaDescription:
      "Order clothes online in Simri, Niazipur & Nimej. Ethnic wear, daily wear & kids clothing delivered to your doorstep in Buxar.",
    keywords: ["online shopping Simri", "clothes delivery Simri Buxar", "Simri 802135 fashion"],
    faqs: [
      {
        question: "Are Niazipur and Nimej covered for clothes delivery?",
        answer: "Yes, we deliver across Simri block including Niazipur (802131) and Nimej (802130)."
      }
    ]
  },
  {
    slug: "chaugain",
    name: "Chaugain",
    title: "Online Clothes Delivery in Chaugain, Buxar (802115) | QuickBihar",
    subdivision: "Dumraon",
    block: "Chaugain",
    pins: ["802115", "802126"],
    localities: ["Chaugain Bazar", "Koran Sarai", "Amsari"],
    deliveryTime: "Same-Day Delivery",
    metaDescription:
      "Buy fashion & clothes online in Chaugain & Koran Sarai, Buxar. Reliable delivery with Cash on Delivery and easy returns.",
    keywords: ["clothes delivery Chaugain", "online shopping Chaugain 802115"],
    faqs: [
      {
        question: "Is Koran Sarai covered under Chaugain delivery?",
        answer: "Yes, orders in Koran Sarai (PIN 802126) and Chaugain Bazar are delivered conveniently."
      }
    ]
  },
  {
    slug: "kesath",
    name: "Kesath",
    title: "Fashion & Clothes Delivery in Kesath, Buxar (802125) | QuickBihar",
    subdivision: "Dumraon",
    block: "Kesath",
    pins: ["802125"],
    localities: ["Kesath Town", "Rampur", "Dahina"],
    deliveryTime: "Same-Day Delivery",
    metaDescription:
      "Shop sarees, kurtis, shirts and kids clothes online in Kesath, Buxar. Fast delivery across PIN 802125 with COD.",
    keywords: ["online clothes Kesath", "Kesath 802125 shopping", "clothes delivery Kesath"],
    faqs: [
      {
        question: "How do I pay for my clothes order in Kesath?",
        answer: "You can pay via Cash on Delivery, Google Pay, PhonePe, Paytm, or cards."
      }
    ]
  },
  {
    slug: "chakki",
    name: "Chakki",
    title: "Online Clothes Shopping in Chakki, Buxar (802111) | QuickBihar",
    subdivision: "Dumraon",
    block: "Chakki",
    pins: ["802111"],
    localities: ["Chakki Bazar", "Arak", "Parasia"],
    deliveryTime: "Same-Day Delivery",
    metaDescription:
      "Order quality fashion clothes online in Chakki, Buxar. Doorstep delivery across PIN 802111 with verified local quality.",
    keywords: ["clothes delivery Chakki", "Chakki 802111 online shopping"],
    faqs: [
      {
        question: "What products can I buy in Chakki?",
        answer: "You can shop men's wear, women's ethnic wear, western dresses, and kids clothing."
      }
    ]
  }
];

export const ALL_BUXAR_PAGES: BuxarLocation[] = [BUXAR_DISTRICT_HUB, ...BUXAR_LOCATIONS];
export const BUXAR_BLOCKS = BUXAR_LOCATIONS;
export const BUXAR_DISTRICT = BUXAR_DISTRICT_HUB;
