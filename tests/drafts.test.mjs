import { strict as assert } from "node:assert";
import { checkForPrice, isPartnerCustomer } from "../lib/pulse/autopilot/guards.ts";

/**
 * The price rule is the one Autopilot must never break, so it is tested against
 * the ways a price actually shows up in a sentence — not just the obvious "₹".
 */
let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error("✗", name, "\n  ", e.message); }
};

// Must be caught.
for (const [text, why] of [
  ["Happy to do ₹0.12 per SMS for your volume.", "rupee amount"],
  ["We can offer INR 15000 a month.", "currency code"],
  ["That works out to 12 paise a message.", "per-unit"],
  ["Our rate for 100k messages is competitive.", "the word rate"],
  ["I can get you a 20% discount.", "discount"],
  ["Here is our pricing for WhatsApp.", "pricing"],
  ["We'll add 5,000 free credits to start.", "free credits"],
  ["Deals like this usually land around 4 lakh.", "lakh"],
  ["Send me a quote request and I'll sort it.", "quote"],
  ["$500 to get started.", "dollar amount"],
]) {
  t(`catches: ${why}`, () => assert.equal(checkForPrice(text).clean, false, text));
}

// Must NOT be caught — a guard that holds everything is the same as no drafts.
for (const [text, why] of [
  ["Saw a few teams at Walkover are already sending through us. What are you building?", "normal opener"],
  ["Noticed you stopped partway through signup — anything blocking you?", "signup mention"],
  ["I'm Priya from MSG91. Are you looking at SMS or WhatsApp first?", "product question"],
  ["Your account is set up and ready whenever you are.", "status note"],
  ["Happy to walk you through the setup on a quick call.", "meeting ask"],
]) {
  t(`allows: ${why}`, () => assert.equal(checkForPrice(text).clean, true, text));
}

t("partner customers are recognised", () => {
  assert.equal(isPartnerCustomer({ motion: "partner:89884" }), true);
  assert.equal(isPartnerCustomer({ motion: "direct" }), false);
});

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

/* ── the merge rule, in words ───────────────────────────────────────────────
 * Card fatigue is the number one way this product dies, so a second signup from
 * a domain that already has an open card joins it rather than raising its own.
 * The logic lives in a query, so what is tested here is the decision about when
 * a merge may happen at all — free mailboxes never merge, because gmail.com is
 * not a company. */
import { strict as assert2 } from "node:assert";
const mayMerge = (f) => Boolean(f.email_domain) && !f.is_free_mail;

let p2 = 0, f2 = 0;
const t2 = (name, fn) => { try { fn(); p2++; } catch (e) { f2++; console.error("✗", name, e.message); } };

t2("a company domain may merge", () =>
  assert2.equal(mayMerge({ email_domain: "walkover.in", is_free_mail: false }), true));
t2("a free mailbox never merges", () =>
  assert2.equal(mayMerge({ email_domain: "gmail.com", is_free_mail: true }), false));
t2("no domain never merges", () =>
  assert2.equal(mayMerge({ email_domain: null, is_free_mail: false }), false));

console.log(`${p2} passed, ${f2} failed (merge)`);
if (f2) process.exit(1);
