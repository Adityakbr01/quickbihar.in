import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { APP_LINKS } from "@/constants/links";

export const metadata: Metadata = {
  title: "Return & Refund Policy | QuickBihar.in",
  description:
    "QuickBihar.in's return, exchange, and refund policy. Learn how to initiate a return, eligible categories, timelines, and refund modes.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "August 29, 2026";
const EFFECTIVE_DATE = "August 29, 2026";
const COMPANY_NAME = "QuickBihar";
const APP_NAME = "QuickBihar.in";
const CONTACT_EMAIL = APP_LINKS.SUPPORT_EMAIL;
const CONTACT_PHONE = APP_LINKS.SUPPORT_PHONE;
const OFFICE_ADDRESS = APP_LINKS.OFFICE_ADDRESS;
const WEBSITE_URL = "https://quickbihar.in";

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "overview",
    title: "1. Overview",
    body: (
      <>
        <p>
          At <strong>{APP_NAME}</strong>, we want you to love what you order.
          If something doesn&rsquo;t fit or isn&rsquo;t right, this Return &amp;
          Refund Policy explains how returns, exchanges, and refunds work for
          orders placed on our website or mobile app.
        </p>
        <p>
          This policy is part of our{" "}
          <Link
            href="/terms-of-service"
            className="text-primary hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and applies to all purchases made on the Platform.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Last updated:</strong> {LAST_UPDATED}
          <br />
          <strong>Effective date:</strong> {EFFECTIVE_DATE}
        </p>
      </>
    ),
  },
  {
    id: "return-window",
    title: "2. Return Window",
    body: (
      <>
        <p>
          You can request a return or exchange within{" "}
          <strong>7 days</strong> of delivery for most categories. The exact
          window is shown on your order details page and starts from the
          &ldquo;Delivered&rdquo; timestamp recorded by our system.
        </p>
        <p>
          Requests raised after the window has elapsed will be reviewed on a
          case-by-case basis at our sole discretion.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "3. Eligibility for Returns",
    body: (
      <>
        <p>To be eligible for a return, all of the following must be true:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>The item is unworn, unwashed, and unused.</li>
          <li>
            All original tags, labels, and packaging (including branded boxes
            and polybags) are intact.
          </li>
          <li>
            The item is not a final-sale, innerwear, beauty/personal-care,
            customised, or perishables product.
          </li>
          <li>
            The original invoice is available (digital copy is acceptable).
          </li>
          <li>
            The return request is raised within the 7-day window from the
            delivery date.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-4 mb-2">
          Non-returnable items
        </h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Innerwear, lingerie, socks, and swimwear (hygiene reasons).</li>
          <li>Personal-care and beauty products if the seal is broken.</li>
          <li>Customised, monogrammed, or altered products.</li>
          <li>Items marked as &ldquo;Final Sale&rdquo; or &ldquo;No Return&rdquo;.</li>
          <li>Free gifts, samples, and promotional vouchers.</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-to-initiate",
    title: "4. How to Initiate a Return",
    body: (
      <>
        <p>You can raise a return request in either of the following ways:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>In the app:</strong> Go to <em>My Orders</em> &rarr; select
            the order &rarr; tap <em>Return / Exchange</em> &rarr; choose the
            item, reason, and resolution (refund or size exchange).
          </li>
          <li>
            <strong>By email:</strong> Send your order number and a brief
            reason to{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </li>
        </ul>
        <p>
          Once approved, our delivery partner will pick up the item from your
          address within <strong>1&ndash;3 business days</strong>. Pickup is{" "}
          <strong>free</strong> for size-exchange and quality-issue returns.
        </p>
      </>
    ),
  },
  {
    id: "refund-timeline",
    title: "5. Refund Timeline & Mode",
    body: (
      <>
        <p>
          After we receive and inspect the returned item, we will notify you of
          the outcome. If approved, your refund will be processed as follows:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-semibold">
                  Original payment mode
                </th>
                <th className="text-left p-3 font-semibold">Refund mode</th>
                <th className="text-left p-3 font-semibold">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-3">UPI / Cards / Net-banking</td>
                <td className="p-3">Original source</td>
                <td className="p-3">3&ndash;5 business days</td>
              </tr>
              <tr>
                <td className="p-3">QuickBihar Wallet / Store credit</td>
                <td className="p-3">Wallet credit (instant)</td>
                <td className="p-3">Instant</td>
              </tr>
              <tr>
                <td className="p-3">Cash on Delivery (COD)</td>
                <td className="p-3">
                  Bank transfer (NEFT / IMPS) to your registered bank account
                </td>
                <td className="p-3">3&ndash;7 business days</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Delivery charges, if any, are non-refundable except in cases of
          damaged, defective, or incorrect items.
        </p>
      </>
    ),
  },
  {
    id: "exchanges",
    title: "6. Size Exchange",
    body: (
      <p>
        Size exchange is available for apparel categories on most products.
        You can request a different size of the same item (subject to
        availability) at no extra cost. If the requested size is unavailable,
        we will offer a full refund or store credit.
      </p>
    ),
  },
  {
    id: "damaged-defective",
    title: "7. Damaged, Defective, or Incorrect Items",
    body: (
      <>
        <p>
          If you receive a damaged, defective, or incorrect item, please
          contact us within <strong>48 hours</strong> of delivery with:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your order number.</li>
          <li>Photographs or a short video of the issue.</li>
          <li>The original packing slip.</li>
        </ul>
        <p>
          We will arrange a free reverse pick-up and either send a replacement
          (subject to availability) or issue a full refund, including delivery
          charges, within the timelines above.
        </p>
      </>
    ),
  },
  {
    id: "cancellations",
    title: "8. Order Cancellations",
    body: (
      <p>
        Orders can be cancelled from <em>My Orders</em> until they are picked
        up by the delivery rider. Once dispatched, the order cannot be
        cancelled and must follow the standard return process. COD orders
        refused at the door may be subject to a small non-fulfilment fee to
        cover return shipping, applied to future orders at our discretion.
      </p>
    ),
  },
  {
    id: "contact",
    title: "9. Contact Us",
    body: (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-1">
        <p>
          <strong>{COMPANY_NAME}</strong>
          <br />
          {OFFICE_ADDRESS}
          <br />
          Email:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          <br />
          Phone: {CONTACT_PHONE}
          <br />
          Website:{" "}
          <Link href={WEBSITE_URL} className="text-primary hover:underline">
            {WEBSITE_URL}
          </Link>
        </p>
      </div>
    ),
  },
];

export default function ReturnPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Legal
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Return &amp; Refund Policy
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Easy 7-day returns, free size exchanges, and transparent refund
              timelines for every {APP_NAME} order.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              <strong>Last updated:</strong> {LAST_UPDATED} &middot;{" "}
              <strong>Effective:</strong> {EFFECTIVE_DATE}
            </p>
          </div>
        </section>

        {/* Table of contents */}
        <nav
          aria-label="Table of contents"
          className="border-b border-border bg-muted/20"
        >
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              On this page
            </h2>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-sm text-foreground/80 hover:text-primary transition-colors"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Content */}
        <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {s.title}
                </h2>
                <div className="mt-4 space-y-3 text-base leading-relaxed text-foreground/80 [&_ul]:mt-2 [&_table]:mt-4">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          {/* Acknowledgement */}
          <div className="mt-16 rounded-xl border border-primary/20 bg-primary/5 p-6 text-sm text-foreground/80">
            <p className="font-semibold text-foreground">
              By placing an order on {APP_NAME}, you agree to this Return &amp;
              Refund Policy, our{" "}
              <Link
                href="/terms-of-service"
                className="text-primary hover:underline"
              >
                Terms of Service
              </Link>
              , and our{" "}
              <Link
                href="/privacy-policy"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
