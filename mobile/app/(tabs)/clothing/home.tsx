
import HomeScreen from "@/src/features/clothing/home/screens/HomeScreen";
import React from "react";
import { SeoHead } from "@/src/components/seo/SeoHead";
import { staticPageMeta } from "@/src/lib/seo";

const HOME_META = staticPageMeta({
  title: "QuickBihar | Shop Fashion Online in Bihar — Local Stores, Fast Delivery",
  description:
    "Shop trending fashion, ethnic wear and daily essentials from trusted local stores across Bihar with fast doorstep delivery, COD and easy returns.",
  path: "/",
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
