import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { APP_LINKS } from "@/constants/links";


const LAST_UPDATED = "August 29, 2026";
const EFFECTIVE_DATE = "August 29, 2026";
const COMPANY_NAME = "QuickBihar";
const APP_NAME = "QuickBihar.in";
const CONTACT_EMAIL = APP_LINKS.SUPPORT_EMAIL;
const GRIEVANCE_EMAIL = "grievance@quickbihar.in";
const CONTACT_PHONE = APP_LINKS.SUPPORT_PHONE;
const OFFICE_ADDRESS = APP_LINKS.OFFICE_ADDRESS;
const WEBSITE_URL = "https://quickbihar.in";

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "introduction",
    title: "1. Introduction",
    body: (
      <>
        <p>
          Welcome to <strong>{APP_NAME}</strong> (the &ldquo;Platform&rdquo;), an
          online fashion and instant-delivery marketplace operated by{" "}
          <strong>{COMPANY_NAME}</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
          &ldquo;our&rdquo;). This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you visit our website at{" "}
          <Link to={WEBSITE_URL} className="text-primary hover:underline">
            {WEBSITE_URL}
          </Link>
          , use our mobile application, or otherwise interact with our services
          (collectively, the &ldquo;Service&rdquo;).
        </p>
        <p>
          By accessing or using the Service, you agree to the terms of this
          Privacy Policy. If you do not agree with the terms of this policy,
          please do not access the Service.
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
    id: "information-we-collect",
    title: "2. Information We Collect",
    body: (
      <>
        <p>
          We collect information that you voluntarily provide to us, information
          collected automatically when you use the Service, and limited
          information from third parties (such as delivery partners and payment
          providers) necessary to fulfil your orders.
        </p>

        <h3 className="text-lg font-semibold mt-4 mb-2">
          2.1 Information you provide directly
        </h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Account information:</strong> name, mobile number, email
            address, password (stored hashed), and profile picture.
          </li>
          <li>
            <strong>Delivery information:</strong> shipping address, pin code,
            landmark, address label (Home / Work / Other), and any delivery
            instructions.
          </li>
          <li>
            <strong>Order information:</strong> products viewed, items added to
            cart or wishlist, order history, ratings, reviews, and support
            messages.
          </li>
          <li>
            <strong>Payment information:</strong> for Cash on Delivery (COD)
            orders we collect only the amount due; for prepaid orders, payment
            is processed by our PCI-DSS compliant partners and we do not store
            your full card or UPI PIN on our servers.
          </li>
          <li>
            <strong>Identity verification:</strong> in limited cases, government
            ID details may be requested for high-value orders, fraud
            investigation, or to comply with applicable Indian law.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-4 mb-2">
          2.2 Information collected automatically
        </h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Device &amp; log data:</strong> IP address, device model,
            operating system version, unique device identifiers, mobile carrier,
            language, time zone, and crash logs.
          </li>
          <li>
            <strong>Usage data:</strong> pages viewed, products searched,
            features used, referring/exit pages, and the dates and times of
            your visits.
          </li>
          <li>
            <strong>Approximate location:</strong> city / pin-code level
            location inferred from your IP address to show relevant inventory
            and delivery options.
          </li>
          <li>
            <strong>Precise location (with your permission):</strong> GPS
            coordinates, used only at the moment of checkout or live order
            tracking to help our delivery partner reach you. We do not run
            location in the background unless you have an active order.
          </li>
          <li>
            <strong>Cookies and similar technologies:</strong> see the
            <a href="#cookies" className="text-primary hover:underline">
              {" "}
              Cookies{" "}
            </a>
            section below.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    body: (
      <>
        <p>We use the information we collect for the following purposes:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Create, maintain, and secure your account, and authenticate you when
            you sign in.
          </li>
          <li>Process, fulfil, and deliver your orders, including COD.</li>
          <li>
            Send you order updates, delivery notifications, refund status, and
            transactional communications (SMS, push notifications, WhatsApp,
            email).
          </li>
          <li>
            Provide customer support and resolve disputes, refunds, returns, and
            exchanges.
          </li>
          <li>
            Detect, prevent, and address fraud, abuse, security incidents, and
            illegal activity.
          </li>
          <li>
            Personalise the home feed, search results, product recommendations,
            and promotional offers shown to you.
          </li>
          <li>
            Run analytics, measure performance, debug issues, and improve our
            Service.
          </li>
          <li>
            Send you marketing communications about new collections, offers,
            and events &mdash; only if you have opted in or where permitted by
            law. You can opt out at any time.
          </li>
          <li>
            Comply with our legal obligations under the Information Technology
            Act, 2000, the IT (Reasonable Security Practices) Rules, 2011, the
            Digital Personal Data Protection Act, 2023, and other applicable
            laws.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "permissions",
    title: "4. App Permissions We Request",
    body: (
      <>
        <p>
          Our mobile app requests the following Android / iOS permissions. You
          can deny any of these from your device settings at any time, and the
          app will continue to work with reduced functionality.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-semibold">Permission</th>
                <th className="text-left p-3 font-semibold">Purpose</th>
                <th className="text-left p-3 font-semibold">When used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-3">Location (precise &amp; approximate)</td>
                <td className="p-3">Address autocomplete, delivery tracking</td>
                <td className="p-3">Checkout, live order</td>
              </tr>
              <tr>
                <td className="p-3">Camera</td>
                <td className="p-3">Product reviews, profile picture, KYC</td>
                <td className="p-3">When you open the camera in-app</td>
              </tr>
              <tr>
                <td className="p-3">Photo / Media library</td>
                <td className="p-3">Attach review photos, profile picture</td>
                <td className="p-3">When you pick a photo in-app</td>
              </tr>
              <tr>
                <td className="p-3">Notifications</td>
                <td className="p-3">Order updates, offers, delivery alerts</td>
                <td className="p-3">Background + foreground</td>
              </tr>
              <tr>
                <td className="p-3">Storage</td>
                <td className="p-3">Cache product images for offline browsing</td>
                <td className="p-3">Continuous</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "sharing",
    title: "5. Sharing and Disclosure",
    body: (
      <>
        <p>
          We do not sell your personal data. We share information only as
          described below:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Sellers / Brand partners:</strong> order details, delivery
            address, and contact number needed to dispatch your order.
          </li>
          <li>
            <strong>Delivery partners:</strong> your name, mobile number,
            delivery address, and live location (only for the duration of an
            active order) to fulfil the delivery.
          </li>
          <li>
            <strong>Payment partners:</strong> payment metadata with our
            PCI-DSS compliant payment gateway to process prepaid transactions.
          </li>
          <li>
            <strong>Cloud &amp; infrastructure providers:</strong> AWS / GCP
            (hosting), Firebase (auth, push notifications, analytics), and
            Cloudinary (image storage), all bound by data-processing
            agreements.
          </li>
          <li>
            <strong>Analytics &amp; marketing tools:</strong> Google Analytics,
            Firebase Analytics, and Meta Pixel for measuring campaign
            performance &mdash; in aggregated or pseudonymous form wherever
            possible.
          </li>
          <li>
            <strong>Customer support vendors:</strong> for ticketing, chat, and
            call-centre operations.
          </li>
          <li>
            <strong>Legal &amp; regulatory:</strong> when required by a valid
            court order, law-enforcement request, or to enforce our Terms of
            Service and prevent harm.
          </li>
          <li>
            <strong>Business transfers:</strong> in the event of a merger,
            acquisition, or sale of assets, your data may be transferred
            subject to equivalent privacy protections.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "third-party",
    title: "6. Third-Party Services",
    body: (
      <>
        <p>
          Our Service relies on the following third-party providers. Each
          provider has its own privacy policy governing how it uses your data.
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Firebase (Google):</strong> Authentication, Cloud Messaging
            (push), Analytics, Crashlytics.{" "}
            <a
              href="https://firebase.google.com/support/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Policy
            </a>
          </li>
          <li>
            <strong>Razorpay / Cashfree:</strong> Payment gateway for prepaid
            orders.{" "}
            <a
              href="https://razorpay.com/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Policy
            </a>
          </li>
          <li>
            <strong>Google Maps Platform:</strong> Address autocomplete and
            delivery routing.{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Policy
            </a>
          </li>
          <li>
            <strong>Cloudinary:</strong> Image storage and optimisation.{" "}
            <a
              href="https://cloudinary.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Policy
            </a>
          </li>
          <li>
            <strong>Meta (Facebook) Pixel &amp; Conversions API:</strong>{" "}
            Advertising and conversion tracking.{" "}
            <a
              href="https://www.facebook.com/privacy/policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Policy
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "7. Cookies and Similar Technologies",
    body: (
      <>
        <p>
          We use cookies, local storage, and similar technologies to keep you
          signed in, remember your cart, measure performance, and personalise
          content. You can disable cookies in your browser settings, but parts
          of the Service may then not function correctly.
        </p>
        <p>Categories of cookies we use:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Strictly necessary:</strong> session, auth, CSRF token,
            cart.
          </li>
          <li>
            <strong>Functional:</strong> language, pin code, recently viewed
            products.
          </li>
          <li>
            <strong>Analytics:</strong> Firebase Analytics, Google Analytics
            (anonymised IP).
          </li>
          <li>
            <strong>Marketing:</strong> Meta Pixel, Google Ads (only with your
            consent, where required).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    title: "8. Data Retention",
    body: (
      <p>
        We retain your personal data only for as long as necessary to fulfil
        the purposes outlined in this policy, comply with our legal
        obligations, resolve disputes, and enforce our agreements. Specifically:
        order and invoice records are retained for <strong>8 years</strong> as
        required by Indian tax law; account profile data is retained until you
        delete your account; device logs are retained for up to{" "}
        <strong>90 days</strong>. When data is no longer needed, it is securely
        deleted or anonymised.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "9. Your Rights and Choices",
    body: (
      <>
        <p>
          Subject to applicable law (including the Digital Personal Data
          Protection Act, 2023), you have the right to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Access</strong> a copy of the personal data we hold about
            you.
          </li>
          <li>
            <strong>Correct</strong> inaccurate or incomplete data (you can edit
            your profile and addresses in the app at any time).
          </li>
          <li>
            <strong>Delete</strong> your account and personal data (in-app:
            Profile &rarr; Settings &rarr; Delete Account, or by emailing us).
          </li>
          <li>
            <strong>Withdraw consent</strong> for optional processing such as
            marketing communications and analytics.
          </li>
          <li>
            <strong>Opt out of promotional messages</strong> by tapping
            &ldquo;Unsubscribe&rdquo; in any marketing email or replying
            &ldquo;STOP&rdquo; to marketing SMS.
          </li>
          <li>
            <strong>Nominate another individual</strong> to exercise your rights
            in the event of your death or incapacity.
          </li>
          <li>
            <strong>Complain</strong> to the Data Protection Board of India if
            you believe we have violated your rights.
          </li>
        </ul>
        <p>
          To exercise any of these rights, write to us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          . We will respond within <strong>30 days</strong>.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "10. Data Security",
    body: (
      <p>
        We employ industry-standard administrative, physical, and technical
        safeguards designed to protect your information, including HTTPS / TLS
        encryption in transit, AES-256 encryption at rest, role-based access
        controls, two-factor authentication for staff, regular security audits,
        and PCI-DSS compliant payment processing. However, no method of
        transmission over the Internet or electronic storage is 100% secure,
        and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    id: "children",
    title: "11. Children's Privacy",
    body: (
      <p>
        Our Service is not directed to children under the age of{" "}
        <strong>18</strong>, and we do not knowingly collect personal data from
        children. If you believe a child has provided us with personal data,
        please contact us at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-primary hover:underline"
        >
          {CONTACT_EMAIL}
        </a>{" "}
        and we will delete the information promptly.
      </p>
    ),
  },
  {
    id: "international",
    title: "12. International Data Transfers",
    body: (
      <p>
        Your data is primarily stored and processed in India. Some of our
        service providers (such as Firebase, Cloudinary, and our cloud hosting
        provider) may process data in other countries, including the United
        States, the European Economic Area, and Singapore. When we transfer
        your data across borders, we rely on standard contractual clauses,
        adequacy decisions, and vendor data-processing agreements to ensure
        your data remains protected in accordance with this policy.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "13. Grievance Officer",
    body: (
      <>
        <p>
          In accordance with the Information Technology (Intermediary
          Guidelines and Digital Media Ethics Code) Rules, 2021, the name and
          contact details of our Grievance Officer are:
        </p>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-1">
          <p>
            <strong>Grievance Officer</strong>
            <br />
            {COMPANY_NAME}
            <br />
            {OFFICE_ADDRESS}
            <br />
            Email:{" "}
            <a
              href={`mailto:${GRIEVANCE_EMAIL}`}
              className="text-primary hover:underline"
            >
              {GRIEVANCE_EMAIL}
            </a>
            <br />
            Phone: {CONTACT_PHONE}
          </p>
        </div>
        <p>
          Complaints will be acknowledged within <strong>48 hours</strong> and
          resolved within <strong>15 days</strong> of receipt.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "14. Changes to This Privacy Policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time to reflect changes
        to our practices or for legal, operational, or regulatory reasons. When
        we make material changes, we will notify you by email, in-app banner,
        or push notification at least <strong>7 days</strong> before the
        changes take effect, along with a summary of the key changes. The
        &ldquo;Last updated&rdquo; date at the top of this page will reflect
        the latest revision.
      </p>
    ),
  },
  {
    id: "contact",
    title: "15. Contact Us",
    body: (
      <>
        <p>
          If you have questions, comments, or requests regarding this Privacy
          Policy or our handling of your personal data, please contact us:
        </p>
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
            <Link to={WEBSITE_URL} className="text-primary hover:underline">
              {WEBSITE_URL}
            </Link>
          </p>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  useEffect(() => { document.title = "Privacy Policy | QuickBihar Dashboard"; }, []);
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
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your privacy matters. This policy explains what data{" "}
              {APP_NAME} collects, how we use it, and the choices you have.
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
              By using {APP_NAME}, you acknowledge that you have read and
              understood this Privacy Policy.
            </p>
            <p className="mt-2">
              This policy is published in compliance with the Information
              Technology Act, 2000; the Information Technology (Reasonable
              Security Practices and Procedures and Sensitive Personal Data or
              Information) Rules, 2011; the Information Technology
              (Intermediary Guidelines and Digital Media Ethics Code) Rules,
              2021; and the Digital Personal Data Protection Act, 2023.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
