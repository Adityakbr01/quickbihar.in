
import HomeScreen from "@/src/features/clothing/home/screens/HomeScreen";
import React from "react";
import { SeoHead } from "@/src/components/seo/SeoHead";
import { staticPageMeta } from "@/src/lib/seo";

const HOME_META = staticPageMeta({
  title: "QuickBihar | Shop Fashion & Clothing Online in Bihar | Fastest Delivery",
  description:
    "Shop the latest fashion, ethnic wear, sarees, kurtas, and apparel from trusted local stores and shopping malls across Bihar. Super-fast doorstep delivery.",
  path: "/clothing/home",
  keywords:
    "QuickBihar, Quick Bihar, online shopping Bihar, clothing store Patna, ethnic wear Bihar, sarees Bihar, men clothing Bihar, women fashion Bihar, kids clothing Bihar, kurta pajama Bihar, buy clothes Buxar, local store delivery Bihar, fastest delivery app Bihar, Bihar ecommerce, same day delivery Bihar, Aditya Fashion Mall",
  image: "https://quickbihar.in/assets/images/icons/splash-icon.png",
});

const Home = () => {
  return (
    <>
      <SeoHead meta={HOME_META} />
      <HomeScreen rootSlug="clothing" />
    </>
  );
};

export default Home;
