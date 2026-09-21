import { NewsletterSubscriber } from "./newsletter.model";

/**
 * Subscribes an email to the newsletter. Idempotent — re-subscribing an
 * existing email succeeds without duplicating (unique index guards races).
 */
export async function subscribe(email: string, vertical: string, source: string) {
    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
        return { alreadySubscribed: true as const, subscriber: existing };
    }
    const subscriber = await NewsletterSubscriber.create({ email, vertical, source });
    return { alreadySubscribed: false as const, subscriber };
}
