import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, Clock, RefreshCw, Heart } from "lucide-react";

export const AppFooter: React.FC = () => {
  return (
    <footer className="border-t bg-muted/40 text-foreground transition-colors duration-200 mt-auto">
      {/* Features Bar */}
      <div className="border-b border-border/60">
        <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">20-Min Delivery</h4>
              <p className="text-[11px] text-muted-foreground">Fastest hyper-local delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">100% Genuine</h4>
              <p className="text-[11px] text-muted-foreground">Direct from certified stores</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">Easy Exchange</h4>
              <p className="text-[11px] text-muted-foreground">Instant hassle-free pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">Live GPS Tracking</h4>
              <p className="text-[11px] text-muted-foreground">Real-time rider updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-sm">
              QB
            </div>
            <span className="font-extrabold text-base tracking-tight">QuickBihar</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Bihar&apos;s premier multi-category hyperlocal shopping destination delivering fashion, ethnic wear, certified jewelry, and authentic cuisine straight to your door.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-foreground">Explore Modules</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/clothing" className="hover:text-primary transition-colors">Clothing & Apparel</Link></li>
            <li><Link to="/jewelery" className="hover:text-primary transition-colors">Heritage Jewelry & Gold</Link></li>
            <li><Link to="/food" className="hover:text-primary transition-colors">Food Market & Bihari Cuisine</Link></li>
            <li><Link to="/track-order" className="hover:text-primary transition-colors">Live Rider Tracking</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-foreground">Serving Cities</h4>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            <span className="px-2 py-0.5 rounded bg-background border border-border">Patna</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Gaya</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Muzaffarpur</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Bhagalpur</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Darbhanga</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Buxar</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Purnia</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Ara</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-foreground">Support & Legal</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="#help" className="hover:text-primary transition-colors">24/7 Customer Help</a></li>
            <li><a href="#privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            <li><a href="#terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
            <li><a href="#seller" className="hover:text-primary transition-colors">Become a Seller</a></li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border/60 py-4 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
        <span>© {new Date().getFullYear()} QuickBihar.in. Built with</span>
        <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
        <span>for Bihar.</span>
      </div>
    </footer>
  );
};

export default AppFooter;
