import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import Features from "@/components/landing/Features";
import AppDownloadSection from "@/components/landing/AppDownloadSection";
import Audiences from "@/components/landing/Audiences";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "QuickBihar.in | Bihar's #1 Fashion & Instant Delivery App",
  description:
    "Shop trending fashion, clothes, ethnic wear and footwear from top local boutiques across Patna, Gaya, Muzaffarpur and 20+ Bihar districts. Get 30-min doorstep delivery with Cash on Delivery & 7-day size exchange.",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-16">
        <Hero />
        <Stats />
        <Features />
        <AppDownloadSection />
        <Audiences />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
