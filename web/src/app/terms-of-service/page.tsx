import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { APP_LINKS } from "@/constants/links";

export const metadata: Metadata = {
  title: "Terms of Service | QuickBihar.in",
  description:
    "Terms and conditions for using the QuickBihar.in website and mobile application, including buyer, seller, and delivery-partner obligations.",
  robots: { index: true, follow: true },
};

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
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: (
      <>
        <p>
          Welcome to <strong>{APP_NAME}</strong>, an online fashion and
          instant-delivery marketplace operated by <strong>{COMPANY_NAME}</strong>{" "}
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By
          accessing or using our website at{" "}
          <Link href={WEBSITE_URL} className="text-primary hover:underline">
            {WEBSITE_URL}
          </Link>
          , our mobile application, or any related services (collectively, the
          &ldquo;Platform&rdquo;), you agree to be bound by these Terms of
          Service (&ldquo;Terms&rdquo;).
        </p>
        <p>
          If you do not agree to these Terms, you must not access or use the
          Platform. By creating an account, placing an order, or otherwise
          using the Platform, you confirm that you are at least 18 years of
          age and legally capable of entering into a binding contract under
          the Indian Contract Act, 1872.
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
    id: "accounts",
    title: "2. Account Registration",
    body: (
      <>
        <p>
          To access most features, you must create an account. When you
          register, you agree to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Provide accurate, current, and complete information during
            registration and keep it updated.
          </li>
          <li>
            Maintain the security of your password and identification. You are
            solely responsible for all activity on your account.
          </li>
          <li>
            Notify us immediately of any unauthorised use of your account at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </li>
          <li>
            Not share your account credentials with any third party or allow
            another person to use your account.
          </li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that contain
          inaccurate information or are involved in fraudulent, abusive, or
          illegal activity.
        </p>
      </>
    ),
  },
  {
    id: "use-of-platform",
    title: "3. Use of the Platform",
    body: (
      <>
        <p>You agree not to, and not to authorise any person to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Use the Platform for any unlawful purpose or in violation of any
            applicable local, state, national, or international law.
          </li>
          <li>
            Reproduce, distribute, modify, create derivative works of, publicly
            display, or commercially exploit any content on the Platform
            without our prior written consent.
          </li>
          <li>
            Use any robot, spider, scraper, or other automated means to access
            the Platform for any purpose without our express written permission.
          </li>
          <li>
            Interfere with or disrupt the Platform, its servers, or any
            networks connected to the Platform.
          </li>
          <li>
            Upload viruses, malware, or any other code designed to interrupt,
            destroy, or limit the functionality of the Platform.
          </li>
          <li>
            Impersonate any person or entity, or falsely state or otherwise
            misrepresent your affiliation with a person or entity.
          </li>
          <li>
            Post or transmit any content that is defamatory, obscene,
            threatening, harassing, hateful, or otherwise objectionable.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "orders-pricing",
    title: "4. Orders, Pricing & Payment",
    body: (
      <>
        <h3 className="text-lg font-semibold mt-2 mb-2">4.1 Placing orders</h3>
        <p>
          Orders are confirmed only after we send an order-acceptance
          notification (via SMS, push notification, or email). We may refuse
          or cancel any order, including for reasons of suspected fraud, stock
          unavailability, incorrect pricing, or delivery-address restrictions.
        </p>

        <h3 className="text-lg font-semibold mt-4 mb-2">4.2 Pricing</h3>
        <p>
          All prices are listed in Indian Rupees (INR) and are inclusive of GST
          as applicable. Delivery charges, if any, are shown at checkout before
          you confirm your order. Prices and availability are subject to change
          without notice.
        </p>

        <h3 className="text-lg font-semibold mt-4 mb-2">4.3 Payment methods</h3>
        <p>We accept:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Cash on Delivery (COD):</strong> pay in cash to our
            delivery partner at the time of delivery. COD may not be available
            for certain pin codes or high-value orders.
          </li>
          <li>
            <strong>Prepaid options:</strong> UPI, credit / debit cards, net
            banking, and supported wallets, processed via our PCI-DSS compliant
            payment gateway.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "delivery",
    title: "5. Delivery",
    body: (
      <>
        <p>
          We aim to deliver orders within the estimated delivery window shown
          at checkout. Delivery timeframes are indicative and may be affected
          by factors outside our control, including weather, traffic, rider
          availability, or remote locations. Title and risk of loss for items
          pass to you upon delivery to the address you provided.
        </p>
        <p>
          You agree to provide a complete and accurate delivery address,
          including pin code and landmark, and to be available (or have an
          authorised person available) at the address during the delivery
          window. We are not responsible for failed deliveries due to
          incorrect addresses, recipient unavailability, or refusal to accept
          the order.
        </p>
      </>
    ),
  },
  {
    id: "returns-refunds",
    title: "6. Returns, Exchanges & Refunds",
    body: (
      <p>
        Our return, exchange, and refund policy is available at{" "}
        <Link
          href="/return-policy"
          className="text-primary hover:underline"
        >
          {WEBSITE_URL}/return-policy
        </Link>{" "}
        and forms part of these Terms. To initiate a return, raise a request
        from <em>My Orders</em> in the app within the applicable return
        window, or contact us at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-primary hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    body: (
      <p>
        All content on the Platform &mdash; including text, graphics, logos,
        icons, images, audio clips, video, software, and the compilation
        thereof &mdash; is the property of {COMPANY_NAME} or its licensors
        and is protected by Indian and international copyright, trademark, and
        other intellectual-property laws. The {APP_NAME} name and logo are
        trademarks of {COMPANY_NAME}. You may not use them without our prior
        written consent.
      </p>
    ),
  },
  {
    id: "user-content",
    title: "8. User-Generated Content",
    body: (
      <>
        <p>
          You may post reviews, ratings, photos, comments, and other content
          (&ldquo;User Content&rdquo;) on the Platform. You retain ownership of
          your User Content but grant {COMPANY_NAME} a worldwide, royalty-free,
          perpetual, irrevocable, and sublicensable right to use, reproduce,
          modify, publish, translate, distribute, and display such User Content
          in any media in connection with operating and promoting the
          Platform.
        </p>
        <p>
          You represent that you own or have the necessary rights to post your
          User Content and that it does not violate the rights of any third
          party or any law.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "9. Suspension and Termination",
    body: (
      <p>
        We may, at our sole discretion, suspend or terminate your account or
        access to the Platform at any time, with or without notice, for
        conduct that we believe violates these Terms, is harmful to other
        users, or is otherwise unlawful. Upon termination, your right to use
        the Platform will cease immediately, but sections that by their nature
        should survive termination will survive.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "10. Disclaimers and Limitation of Liability",
    body: (
      <>
        <p>
          The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis without warranties of any kind, express or
          implied, including warranties of merchantability, fitness for a
          particular purpose, and non-infringement. We do not warrant that the
          Platform will be uninterrupted, error-free, or secure.
        </p>
        <p>
          To the maximum extent permitted by law, {COMPANY_NAME}, its
          directors, employees, partners, and agents shall not be liable for
          any indirect, incidental, special, consequential, or punitive
          damages, including loss of profits, data, or goodwill, arising out of
          or in connection with your use of the Platform. Our total liability
          for any claim arising under these Terms shall not exceed the amount
          you paid, if any, for the relevant order.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    title: "11. Indemnification",
    body: (
      <p>
        You agree to indemnify, defend, and hold harmless {COMPANY_NAME} and
        its officers, directors, employees, and agents from any claim, demand,
        loss, liability, damage, or expense (including reasonable legal fees)
        arising out of or related to your use of the Platform, your violation
        of these Terms, or your violation of any third-party right.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "12. Governing Law and Dispute Resolution",
    body: (
      <>
        <p>
          These Terms are governed by and construed in accordance with the laws
          of India. Any dispute, claim, or controversy arising out of or
          relating to these Terms, including the breach, termination,
          enforcement, interpretation, or validity thereof, shall be resolved
          as follows:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Step 1 &mdash; Grievance Officer:</strong> first write to
            our Grievance Officer (details below) so we can attempt to resolve
            the issue amicably within 15 days.
          </li>
          <li>
            <strong>Step 2 &mdash; Mediation:</strong> if unresolved, the
            dispute shall be referred to mediation before a mutually agreed
            mediator.
          </li>
          <li>
            <strong>Step 3 &mdash; Arbitration:</strong> failing mediation, the
            dispute shall be referred to and finally resolved by arbitration
            under the Arbitration and Conciliation Act, 1996. The seat and
            venue of arbitration shall be Patna, Bihar, and the proceedings
            shall be conducted in English or Hindi.
          </li>
        </ul>
        <p>
          Nothing in this clause prevents either party from seeking interim or
          injunctive relief from a competent court in Patna, Bihar.
        </p>
      </>
    ),
  },
  {
    id: "grievance",
    title: "13. Grievance Officer",
    body: (
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
    ),
  },
  {
    id: "changes",
    title: "14. Changes to These Terms",
    body: (
      <p>
        We may update these Terms from time to time. When we make material
        changes, we will notify you by email, in-app banner, or push
        notification at least <strong>7 days</strong> before the changes take
        effect. The &ldquo;Last updated&rdquo; date at the top of this page
        will reflect the latest revision. Your continued use of the Platform
        after the effective date constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "15. Contact Us",
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

export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              The rules that govern your use of {APP_NAME}, including buyer,
              seller, and delivery-partner obligations.
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
              By using {APP_NAME}, you confirm that you have read, understood,
              and agreed to these Terms of Service and our{" "}
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
