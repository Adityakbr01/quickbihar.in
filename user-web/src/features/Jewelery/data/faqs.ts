/**
 * @file src/features/Jewelery/data/faqs.ts
 * Shared jewellery help topics — single source of truth.
 *
 * Rendered in `HelpSupportSheet` AND emitted as FAQPage JSON-LD
 * (SeoRouter + prerender). Edit answers here once, both update.
 */

import { JEWELERY_MODULE_CONFIG } from '@/src/constants';

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'Is your gold BIS hallmarked?',
    a: 'Yes — every gold piece is BIS hallmarked. The HUID number is on the invoice and the product tag.',
  },
  {
    q: 'How do I find my ring/bangle size?',
    a: "Use our size guide on any product page, or message us and we'll help you measure at home.",
  },
  {
    q: 'What is your return policy?',
    a: `Easy ${JEWELERY_MODULE_CONFIG.returnPolicyDays}-day returns on unworn pieces with tags and invoice intact.`,
  },
  {
    q: 'How long does delivery take?',
    a: "Made-to-order pieces ship in 3–5 days. You'll get live tracking on your order.",
  },
  {
    q: 'Can I exchange for a different size?',
    a: 'Yes, size exchanges are free within the return window. Start one from My Orders.',
  },
  {
    q: 'How is the gold rate applied?',
    a: "Prices follow the day's live gold rate at checkout — the invoice locks your rate.",
  },
  {
    q: 'Where is my order?',
    a: 'Open My Orders → Track for live rider location and delivery OTP.',
  },
];
