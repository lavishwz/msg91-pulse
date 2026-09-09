/**
 * The controls that must hold whatever the model does.
 *
 * Deliberately dependency-free: no database, no gateway, no agent types. A rule
 * this important should be testable in isolation and readable in one screen,
 * and nothing here can fail for a reason unrelated to the rule itself.
 *
 * These are enforced twice — once in Agent 3's prompt, and again wherever a
 * draft crosses a boundary (written, released). A prompt is guidance a model
 * usually follows; this is a control that always holds.
 */

/**
 * Anything a reader could take as what MSG91 charges.
 *
 * Deliberately broad. A false positive costs a person ten seconds of reading; a
 * false negative sends a price MSG91 never agreed to. That asymmetry decides
 * every judgement call below: when unsure, hold.
 */
const PRICE_PATTERNS: Array<[RegExp, string]> = [
  [/[₹$€£¥]\s?\d/, "a currency symbol followed by a number"],
  [/\b(?:INR|USD|AED|SGD|GBP|EUR)\s?\d/i, "a currency code followed by a number"],
  [/\b\d+(?:\.\d+)?\s?(?:paise|paisa|cents?)\b/i, "a per-unit price"],
  [/\bper\s+(?:sms|message|msg|credit)\b/i, "a per-message rate"],
  [/\b(?:price|pricing|rate|rates|quote|discount|tariff)\b/i, "the word price, rate, quote or discount"],
  [/\b\d+(?:\.\d+)?\s?(?:%|percent)\s?(?:off|discount)/i, "a discount"],
  [/\b(?:free|complimentary)\s+(?:credits?|messages?|sms)\b/i, "an offer of free credits"],
  [/\b\d[\d,]*\s?(?:k|lakh|lac|cr|crore)\b/i, "a large money figure"],
];

export type PriceCheck = { clean: boolean; reason: string | null };

/** Does this text contain anything that reads as a commercial commitment? */
export function checkForPrice(text: string): PriceCheck {
  for (const [re, what] of PRICE_PATTERNS) {
    if (re.test(text)) return { clean: false, reason: `mentions a price — ${what}` };
  }
  return { clean: true, reason: null };
}

/**
 * A reseller's customer. MSG91 never contacts them directly — the manifest is
 * explicit, and unlike the price rule there is no version of this a person
 * should be able to release.
 */
export function isPartnerCustomer(facts: { motion: string }): boolean {
  return typeof facts.motion === "string" && facts.motion.startsWith("partner");
}
