import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_BASE = "https://quickbihar.in/api/v1";

interface SubCatDef {
  parentSlug: string;
  title: string;
  image: string;
  imagePublicId?: string;
  description: string;
  priority: number;
}

const SUBCATEGORIES: SubCatDef[] = [
  // Men's Wear
  {
    parentSlug: "mens-wear",
    title: "Men's Shirts",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_shirts_1788922051615_1RaJ7S1RR.jpg",
    description: "Casual, formal, and linen shirts for men from local Bihar shops.",
    priority: 1,
  },
  {
    parentSlug: "mens-wear",
    title: "Men's T-Shirts",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_shirts_1788922051615_1RaJ7S1RR.jpg",
    description: "Trendy round-neck, polo, and graphic t-shirts for men.",
    priority: 2,
  },
  {
    parentSlug: "mens-wear",
    title: "Men's Jeans & Trousers",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_jeans_1788922048395_77zqwZLqPL.jpg",
    description: "Slim-fit denim, chinos, and formal trousers for men.",
    priority: 3,
  },
  {
    parentSlug: "mens-wear",
    title: "Men's Kurtas & Ethnic",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_ethnic_1788922053317_PQHX1OLt6i.jpg",
    description: "Festive silk kurtas, pajama sets, and royal sherwanis for men.",
    priority: 4,
  },

  // Women's Wear
  {
    parentSlug: "womens-wear",
    title: "Sarees & Drapes",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_sarees_1788922045431_vJtX43DyH.jpg",
    description: "Banarasi, silk, chiffon, and daily-wear sarees from Bihar boutiques.",
    priority: 1,
  },
  {
    parentSlug: "womens-wear",
    title: "Kurtis & Kurta Sets",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_kurtis_1788922050008_WQbZimlZV.jpg",
    description: "Straight kurtis, Anarkali partywear suits, and palazzo sets.",
    priority: 2,
  },
  {
    parentSlug: "womens-wear",
    title: "Women's Jeans & Bottoms",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_jeans_1788922048395_77zqwZLqPL.jpg",
    description: "High-waist jeans, leggings, palazzos, and casual pants.",
    priority: 3,
  },
  {
    parentSlug: "womens-wear",
    title: "Western Dresses & Tops",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_womens_wear_2YPyqyU0d.jpg",
    description: "Casual tops, midi dresses, and western evening wear.",
    priority: 4,
  },

  // Kids Wear
  {
    parentSlug: "kids-wear",
    title: "Boys Clothing",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_kids_lGTMRoeGg.jpg",
    description: "T-shirts, shorts, denim jeans, and ethnic sets for boys.",
    priority: 1,
  },
  {
    parentSlug: "kids-wear",
    title: "Girls Clothing",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_kids_lGTMRoeGg.jpg",
    description: "Frocks, dresses, tops, skirts, and ethnic lehengas for girls.",
    priority: 2,
  },
  {
    parentSlug: "kids-wear",
    title: "Baby & Infant Wear",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_kids_lGTMRoeGg.jpg",
    description: "Soft organic cotton onesies, rompers, and infant sets.",
    priority: 3,
  },

  // Sarees
  {
    parentSlug: "sarees",
    title: "Banarasi Silk Sarees",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_sarees_1788922045431_vJtX43DyH.jpg",
    description: "Authentic heavy zari Banarasi sarees for weddings and festivals.",
    priority: 1,
  },
  {
    parentSlug: "sarees",
    title: "Cotton & Handloom Sarees",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_sarees_1788922045431_vJtX43DyH.jpg",
    description: "Breathable daily cotton and handloom sarees from Bihar weavers.",
    priority: 2,
  },

  // Jeans
  {
    parentSlug: "jeans",
    title: "Men's Slim Fit Jeans",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_jeans_1788922048395_77zqwZLqPL.jpg",
    description: "Modern stretchable slim fit denim jeans for men.",
    priority: 1,
  },
  {
    parentSlug: "jeans",
    title: "Women's High Rise Jeans",
    image: "https://ik.imagekit.io/k2n57ywshu/categories/category_jeans_1788922048395_77zqwZLqPL.jpg",
    description: "High-waist, mom fit, and wide-leg denim jeans for women.",
    priority: 2,
  },
];

async function main() {
  console.log("──────────────────────────────────────────────────");
  console.log("QuickBihar — Inserting Subcategories via Admin API");
  console.log("──────────────────────────────────────────────────");

  console.log("1. Authenticating admin...");
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || "admin@quickbihar.in",
      password: process.env.ADMIN_PASSWORD || "admin123",
    }),
  });

  const loginJson = (await loginRes.json()) as any;
  if (!loginRes.ok || !loginJson?.data?.accessToken) {
    console.error("Admin login failed:", loginJson);
    process.exit(1);
  }

  const token = loginJson.data.accessToken;
  console.log("Admin authenticated successfully.");

  // Fetch current categories
  const existingRes = await fetch(`${API_BASE}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const existingJson = (await existingRes.json()) as any;
  const existingList: any[] = Array.isArray(existingJson?.data) ? existingJson.data : [];
  console.log(`Found ${existingList.length} existing categories in database.`);

  // Build parent map by slug
  const parentMap = new Map<string, any>();
  for (const cat of existingList) {
    if (cat.slug) parentMap.set(cat.slug.toLowerCase(), cat);
  }

  let createdCount = 0;
  for (const sub of SUBCATEGORIES) {
    const parent = parentMap.get(sub.parentSlug.toLowerCase());
    if (!parent) {
      console.warn(`Parent category with slug "${sub.parentSlug}" not found! Skipping "${sub.title}"`);
      continue;
    }

    const existing = existingList.find(
      (c) => c.title?.toLowerCase() === sub.title.toLowerCase()
    );

    const form = new FormData();
    form.append("title", sub.title);
    form.append("image", sub.image);
    form.append("imagePublicId", "url_provided");
    form.append("description", sub.description);
    form.append("parentId", parent._id);
    form.append("priority", String(sub.priority));
    form.append("isActive", "true");
    form.append("isFeatured", "false");
    form.append("vertical", "CLOTHING");
    form.append("seo", JSON.stringify({
      metaTitle: `${sub.title} Online in Bihar | ${parent.title} | QuickBihar`,
      metaDescription: sub.description,
      keywords: [sub.title.toLowerCase(), parent.title.toLowerCase(), "buy online bihar"],
    }));

    if (existing) {
      console.log(`\nSubcategory "${sub.title}" already exists (id: ${existing._id}). Updating parentId to ${parent.title}...`);
      const updateRes = await fetch(`${API_BASE}/categories/${existing._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const updateJson = (await updateRes.json()) as any;
      console.log(`Update response (${updateRes.status}):`, updateJson?.message || updateJson);
    } else {
      console.log(`\nCreating subcategory "${sub.title}" under "${parent.title}"...`);
      const createRes = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const createJson = (await createRes.json()) as any;
      console.log(`Create response (${createRes.status}):`, createJson?.message || createJson);
      if (createRes.ok) createdCount++;
    }
  }

  console.log(`\nDone! Successfully processed ${SUBCATEGORIES.length} subcategories (${createdCount} newly created).`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
