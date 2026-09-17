import { useEffect } from "react";
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


export default function Home() {
  useEffect(() => { document.title = "QuickBihar.in | Bihar's #1 Fashion & Instant Delivery App"; }, []);
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
