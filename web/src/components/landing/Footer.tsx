import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
  {
    title: "For Sellers",
    links: [
      { label: "Sell on QuickBihar", href: "/seller/register" },
      { label: "Seller Dashboard", href: "/seller/login" },
      { label: "Policies", href: "#" },
      { label: "Resources", href: "#" },
    ],
  },
  {
    title: "For Delivery",
    links: [
      { label: "Partner with us", href: "/delivery/register" },
      { label: "Delivery Dashboard", href: "/delivery/login" },
      { label: "Earnings", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold text-white">
              <span className="text-cyan-400">Quick</span>Bihar
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
              Bihar&apos;s fastest-growing e-commerce platform. Empowering local sellers
              and delivering happiness across the state.
            </p>
            <div className="mt-5 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-600" />
                <span>Patna, Bihar, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-gray-600" />
                <span>support@quickbihar.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-gray-600" />
                <span>+91 12345 67890</span>
              </div>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} QuickBihar. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-gray-600">
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
