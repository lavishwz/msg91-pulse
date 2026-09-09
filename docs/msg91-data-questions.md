# For the MSG91 tech team — four things Pulse needs

Pulse reads `test_betatest` read-only and writes nothing to it. Everything below
is either a question about meaning, or a small grant. None of it changes your
data.

The first one is the important one: **Pulse is already showing numbers based on
an assumption we made ourselves, and we would rather be corrected now than
later.**

---

## 1. `ms_trans` — which rows are a genuine customer payment?

This blocks every money figure in the product.

Here is what the last twelve months actually contain:

| `trans_type` | `payment_mode` | rows | sum(`trans_amt`) | sum(`trans_sms`) |
|---|---|---|---|---|
| 1 | 2 | 1,391 | 11,489,420 | 9,939,744 |
| 1 | 1 | 691 | 3,674,400 | 4,198,386 |
| 2 | 1 | 299 | −3,490,769 | −3,181,488 |
| 2 | 2 | 11 | 11 | 11 |

**What we currently assume**, from reading `trans_desc`:

- **`type 1, mode 2` = real customer money.** These carry gateway references —
  *"Online payment done through cashfree : txn-id — 2180786"*, razorpay, mamopay.
  This is what Pulse counts as revenue today.
- **`type 1, mode 1` = an admin or reseller crediting a wallet.** These say
  *"by admin/reseller vipin@walkover.in"*. We exclude them, on the assumption
  that this is an internal movement rather than money the customer paid MSG91.
- **`type 2` = consumption.** Negative amounts, no description.

**Please confirm or correct:**

1. Is `type 1, mode 2` the right definition of "the customer paid us"? Anything
   in there that is *not* real revenue — refunds, reversals, test transactions?
2. `type 1, mode 1` — when a reseller credits a sub-account, has money reached
   MSG91 at some earlier point? If so, counting it as zero understates partner
   revenue, and we would rather show it correctly.
3. `type 2, mode 2` is 11 rows where amt and sms are both exactly 11. Is that a
   data artefact we should ignore?
4. **`trans_amt` vs `trans_sms`** — a ₹10,800 payment appears as 10,000 credits.
   Is the difference tax, or a rate conversion? Pulse never adds these two
   together, but we would like to label them correctly.
5. **`fund_transfer_type`** has eight distinct values in the last year —
   1 (2,063 rows), 8 (268), and single digits of 2, 3, 4, 5, 6, 7. What are
   they? Any of them we should be excluding?

A one-line answer per point is plenty. If there is an existing document, that is
even better.

---

## 2. An index on `ms_trans`

```sql
CREATE INDEX ix_trans_user_date ON ms_trans (trans_tuserid, trans_date);
```

`ms_trans` has about a million rows and only a primary key, so every question
about an account's spend is a full scan. This currently caps Pulse's health
scoring at a few dozen accounts per request. Read-only, costs nothing to query
behaviour, and would remove the limit entirely.

---

## 3. A schema Pulse can write to

Pulse keeps its own records — the decisions its AI made, the messages it drafted
and held for a person, the rules in force and their version history. **None of
this belongs in your tables**, and nothing we write would ever touch them.

We need one schema — call it `pulse_store` — on any MySQL instance, with a user
that has rights to that schema only. Nine tables, a few megabytes.

It does not have to be your production server. If it is easier to point us at a
separate instance, that works identically — the two connections are already
separate in our code.

---

## 4. Whitelisting for the deployed app

`mysql.test.txtapi.com` accepts connections only from whitelisted IPs, which is
right. Pulse runs from a developer laptop today and works.

The deployed instance — `msg91-pulse.app.embarko.ai` — cannot connect, so every
data screen returns an error. We will send you the outbound IP once we have it
from the host, and would like it added.

---

## Why the first one matters most

Pulse already scores signups partly on what a company's domain has spent, and
that scoring decides who a salesperson calls. **It is doing that today using our
own reading of `trans_type` and `payment_mode`**, taken from transaction
descriptions rather than from anyone who knows.

If we have it wrong, the mistake does not look like a bug. It looks like a
confident number in a meeting, and nobody catches it. That is the one failure
mode worth a few minutes of somebody's time now.
