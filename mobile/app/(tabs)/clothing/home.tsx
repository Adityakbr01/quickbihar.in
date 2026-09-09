
import HomeScreen from "@/src/features/clothing/home/screens/HomeScreen";
import React from "react";
import { SeoHead } from "@/src/components/seo/SeoHead";
import { staticPageMeta } from "@/src/lib/seo";

const HOME_META = staticPageMeta({
  title: "QuickBihar | Shop Fashion & Clothing Online in Bihar",
  description:
    "Shop the latest fashion, ethnic wear, and daily essentials from trusted local stores in Bihar. Ultra-fast doorstep delivery.",
  path: "/",
  keywords:
    "QuickBihar, online shopping Bihar, clothing store Patna, ethnic wear Bihar, sarees Bihar, men clothing, women clothing, Bihar fast delivery, local stores Bihar",
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
