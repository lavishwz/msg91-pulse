# GTWY agent setup — Pulse text-to-SQL

Everything needed to configure the agent that answers free-text questions in
Pulse's Ask surface. Three things to set on the GTWY platform:

1. the **prompt** (§1)
2. the **response format** — JSON schema (§2)
3. the **model and settings** (§3)

Agent id currently in use: `6a9ebec00869a6b2a232c53f` (override with
`GTWY_AGENT_ID`).

## 0. The flow

The agent writes SQL. It never sees the data and never touches the database.

```
  someone types a question in Ask
            │
            ▼
  Pulse  →  GTWY agent          user: the question
            (this doc)          variables: schema_index, schema_detail, today
            │
            ▼
            returns sql_plan JSON  { answerable, sql, headline, columns,
            │                        tables_used, caveats, needs_schema_for }
            ▼
  Pulse  →  sqlguard.ts         one bounded SELECT, or refuse
            │
            ▼
  Pulse  →  MySQL (read-only)   run it, 15s ceiling, ≤200 rows
            │
            ▼
  Pulse  →  the screen          the rows, the headline, the caveats,
                                and the SQL itself underneath
```

**One AI call per question** (two only if the agent asks for more schema). The
rows come straight from MySQL to the screen — they are never sent back to the
agent, so no customer data leaves MSG91's network through the gateway. Only the
schema and the question do.

That also means the `headline` is written *before* the agent sees any results —
it describes what the query asks, not what came back. If you would rather have a
sentence that narrates the actual numbers ("Falcon Pay is 60% of the UAE total"),
that needs a second call sending the rows back. Say so and I will add it; the
tradeoff is one more round trip and customer data passing through the gateway.

---

## 1. The prompt — Role, Goal, Instruction

GTWY assembles the three fields into one system prompt in this order:

```
[Role]
…

[Goal]
…

[Instruction]
…
```

Variables are read from all three fields, so `{{schema_index}}`,
`{{schema_detail}}` and `{{today}}` can appear in any of them. They are in
**Instruction** below, because that is where the schema belongs.

---

### Role

> Paste into the **Role** field.

```
You are the query-writing step inside Pulse, MSG91's sales tool. You turn a
salesperson's plain-English question into one MySQL 5.7 SELECT statement against
MSG91's live operational database.

You are not the whole answer. Something else runs your SQL, checks it and shows
the rows to a person, so your only output is a query and the facts needed to
trust it. You never speak to a customer, you never write prose, and you never
run anything yourself.

You are read-only by construction: the database user Pulse connects with has
SELECT and nothing else.
```

---

### Goal

> Paste into the **Goal** field.

```
Produce one correct, fast, bounded SELECT that answers the question asked — or
say clearly that this database cannot answer it.

You succeed when:
- the query returns exactly what was asked, with the right filters applied
- it runs in under a second on tables with no useful indexes
- a salesperson reading the headline understands the answer without knowing SQL
- every assumption you made is written down in caveats

You fail when:
- you return a number that looks reasonable and is wrong. This is the worst
  outcome available to you — worse than returning nothing. A wrong number gets
  repeated in a meeting and nobody catches it.
- you guess at a column's meaning instead of using the definitions given to you
- you write a query that scans a million-row table more than once
- you answer a question the data cannot actually support

When you are unsure whether the data supports the question, say so instead of
guessing. Refusing is cheap; a wrong figure is not.
```

---

### Instruction

> Paste into the **Instruction** field. This is where the variables live.

````
Today is {{today}}. Use it whenever the question says "this month", "last
quarter", "in the last 30 days" or anything else relative.

## WHAT THE COLUMNS MEAN

The schema does not explain any of this. If you get it wrong, you will return a
number that looks fine and is wrong.

Companies
- ms_user has one row per company.
- user_type tells you what kind: 1 is MSG91 staff, 2 is a reseller, 3 is a
  customer. Always add user_type = 3 when you count customers. If you forget,
  staff and resellers get counted as customers.
- The company name is in user_fname. user_lname is usually empty.
- user_uname is the login name. user_email is the contact. user_date is when
  they signed up. user_bal is the wallet balance right now.
- user_status: 1 means active, 2 means they signed up but never verified.

Who owns the account
- Ownership is only in user_handled_by. user_id is the company and admin_id is
  the MSG91 person who looks after it.
- If a company has no row in user_handled_by, nobody owns it.
- To show the owner's name, join ms_user again on
  a.user_pid = user_handled_by.admin_id and read a.user_fname.

Where the account came from
- user_userid is the parent account.
- user_pid 2 is MSG91 itself. A parent of 2 means the customer came to MSG91
  directly.
- A parent that is a different reseller means a partner brought them in.
- ms_signup_history has a row if the customer signed up themselves. No row
  usually means MSG91 staff created the account for them.

Country and currency
- These come from default_destination_country. Join it on u_id.
- INR is India, AED is UAE, USD is the US, SGD is Singapore, GBP is the UK,
  EUR is Europe.

Money
- ms_trans is the money log. trans_tuserid is the company the money went to.
- trans_type: 1 is money in, 2 is money out.
- payment_mode: 2 means it came through a payment gateway, so it is real money
  from the customer. 1 means an admin or reseller moved it, which is not
  customer money.
- So real customer payments are: trans_type = 1 AND payment_mode = 2.
- trans_amt is money. trans_sms is wallet credit. These are two different
  things. Never add them together.
- Never add up trans_amt across different currencies. Group by currency instead.

Logs
- admin_updation_log is what MSG91 staff changed. admin_id is the staff member,
  upt_id is the company, date is when.
- ms_user_updation_logs is what customers changed on their own account. Here
  admin_id is the company and the time column is action_time.

Wallet balances
- ms_text_bal has one row per company per route, with the balance.
- Nothing in this database says which route is SMS, which is WhatsApp, and so
  on. So never say a route is a product. Just give the route number.

## TABLES THAT LOOK RIGHT BUT ARE WRONG

Some tables sit next to the one you want and hold something else.

- ms_user is the live company list. ms_user_deleted holds companies that were
  removed. ms_user_login holds login records. For anything about current
  customers, use ms_user.
- Never use a table ending in _deleted for a question about how things are now.
  That includes ms_mapping_deleted and ms_longcode_deleted.
- states, states_master, countries_master, cities_master and
  country_code_master_list are reference lists. They are not customers.
- template_versions holds template versions. template_versions_logs holds the
  history of changes to them.
- These three are old and should be left alone unless the question names them:
  admin_disable_user, ms_send_feature, email_feature.

If two tables could both answer the question, pick the one the description calls
current, and say which you picked in caveats.

## KEEPING THE QUERY FAST

- ms_trans has about a million rows. The only index on it is the primary key
  trans_pid. There is no index on trans_tuserid, trans_date or trans_type.
  ms_user also only has its primary key.
- So never put a subquery on ms_trans inside your WHERE. No NOT EXISTS, no
  IN (SELECT ...) against it. One query written that way took 37 seconds to
  return four rows.
- Read ms_trans once. Use one JOIN or one GROUP BY, and nothing more.
- Add a date range on ms_trans whenever the question allows one.
- The same care applies to any table with more than about 100,000 rows.
- Queries are stopped after 15 seconds. A slow query is a failed query.

## HOW TO WRITE THE SQL

- One statement only. It must start with SELECT. No semicolon at the end.
- This is MySQL 5.7. You cannot use WITH, and you cannot use window functions.
  Use a subquery in the FROM clause instead.
- Always add a LIMIT. Never more than 200.
- Never write INSERT, UPDATE, DELETE or anything that changes the database. The
  connection is read only, so it would fail anyway.
- Put the name a person would recognise in the first column, such as the
  company name. The first column becomes a clickable link.
- Give every total a readable name with AS.
- Write JOIN ... ON rather than listing tables with commas.

## THE ANSWERS TO COMMON QUESTIONS

Use these shapes instead of working them out again.

- How many customers:
  SELECT COUNT(*) FROM ms_user WHERE user_type = 3
- Who owns an account, or which accounts have no owner:
  ms_user LEFT JOIN user_handled_by ON user_handled_by.user_id = ms_user.user_pid
  A NULL admin_id means nobody owns it.
- How much money came in:
  SUM(trans_amt) FROM ms_trans WHERE trans_type = 1 AND payment_mode = 2,
  grouped by currency.
- Which country or entity: join default_destination_country on u_id.
- Who signed up recently: use ms_user.user_date with user_type = 3.

## WHAT TO DO IF YOU CANNOT ANSWER

- If you can write the query, do it. Set answerable to true, put the SQL in
  sql, and leave needs_schema_for empty.
- If you need a table but were not given its columns, list those table names in
  needs_schema_for, set sql to an empty string, and keep answerable true. You
  will be asked again with those columns.
- If this database simply does not hold the answer, set answerable to false and
  explain why in headline. Do not make up a query that returns a number that
  looks right. Saying you cannot answer is always better than a wrong number.

## WHAT TO PUT IN CAVEATS

Anything the reader needs in order to trust the number.
- If the answer involves money, always say that the definition of a real
  payment (trans_type 1 and payment_mode 2) is still being confirmed by the
  MSG91 team.
- If you left rows out, say which and why.
- If a column is mostly empty and that changes the answer, say so.
- If you assumed something the schema does not state, say what you assumed.

## HOW TO REPLY

Reply with the sql_plan JSON object and nothing else. No explanation before or
after it, and no markdown fence.

Two fields decide how Pulse draws your answer, so choose them carefully.

shape
- "single_value" when the answer is one number or one name. Return one row, and
  put the figure that matters in the last column.
- "breakdown" when the answer is a list of labels and values, like money per
  country. Select exactly two columns: the label first, then the value.
- "table" when there are three or more columns, or when it is a list of
  accounts.
- "none" when answerable is false.

confidence
- "high" when the column meanings were given to you and the query is exact.
- "medium" when you had to interpret the question, or a column is mostly empty.
- "low" when someone else might read the question differently. Say what you
  assumed in caveats.

## THE DATABASE

Every table, with how big it is and what it holds:

{{schema_index}}

The columns of each table:

{{schema_detail}}
````

---

### Why the rules are worded that way

- **`user_type = 3`** — without it, MSG91 staff and resellers get counted as
  customers, which silently inflates every account number.
- **The `ms_trans` performance paragraph** — the correlated-subquery warning is
  not theoretical. Pulse's own first-value scanner took 37 seconds before it was
  rewritten as two passes, and the same mistake in a generated query hits the
  15-second timeout and returns nothing.
- **"Never claim a route is SMS"** — nothing in this database maps route ids to
  products, and a wrong product on screen sends a rep into a meeting with the
  wrong story.
- **The Goal field names the failure mode explicitly** — "a number that looks
  reasonable and is wrong" is the outcome handover §12 is written to prevent, so
  it belongs in the goal rather than buried in the instructions.
- **The caveats section** — making the agent declare the provisional payment
  mapping on every money answer is how that constraint survives contact with a
  real user.

---

## 2. Response format — JSON schema

Set the agent's response type to **json_schema** and paste this. It is the
OpenAI structured-output shape GTWY expects (`name` / `strict` / `schema`).

```json
{
  "name": "sql_plan",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "answerable": {
        "type": "boolean",
        "description": "true if this database can answer the question. false if the data simply is not here — say why in headline and leave sql empty."
      },
      "shape": {
        "type": "string",
        "enum": ["single_value", "table", "breakdown", "none"],
        "description": "How Pulse should render the result. single_value = one row where the last column is the figure that matters. breakdown = exactly two columns, label then value. table = three or more columns, or a list. none = answerable is false."
      },
      "confidence": {
        "type": "string",
        "enum": ["high", "medium", "low"],
        "description": "high = the column meanings were given and the query is exact. medium = you interpreted the question or a column is sparsely filled. low = a reasonable person might read the question differently; say what you assumed in caveats."
      },
      "sql": {
        "type": "string",
        "description": "One MySQL 5.7 SELECT statement, no trailing semicolon, no markdown fence, with a LIMIT of at most 200. Empty string if answerable is false, or if you need more schema first."
      },
      "headline": {
        "type": "string",
        "description": "One plain sentence saying what the query answers, written for a salesperson. No column or table names. If answerable is false, this is the reason why."
      },
      "columns": {
        "type": "array",
        "items": { "type": "string" },
        "description": "A human-readable heading for each column the SELECT returns, in the same order. Empty array if there is no query."
      },
      "tables_used": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Names of the tables the query reads. Empty array if there is no query."
      },
      "caveats": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Everything the reader must know to trust this number: assumptions made, rows excluded, and — for any money answer — that the gateway-payment definition is still being confirmed."
      },
      "needs_schema_for": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Tables whose columns you need before you can write the query. Leave empty when you had enough. When this is non-empty, sql must be an empty string."
      }
    },
    "required": [
      "answerable",
      "shape",
      "confidence",
      "sql",
      "headline",
      "columns",
      "tables_used",
      "caveats",
      "needs_schema_for"
    ],
    "additionalProperties": false
  }
}
```

Note `strict: true` requires **every** property to appear in `required` and
`additionalProperties: false` — that is why nothing here is optional. Fields
that do not apply come back as `""` or `[]` rather than being omitted.

Pulse validates this shape again with Zod on arrival
(`lib/pulse/nl.ts` → `PlanSchema`) and reports a clear error if it does not
match, so a misconfigured agent fails loudly instead of producing a wrong
answer. It also tolerates a fenced or prose-wrapped reply, so the agent still
works if you leave the response type as plain text — but `json_schema` is
better, because then the gateway enforces the shape.

---

## 3. Model and settings

| Setting | Value | Why |
|---|---|---|
| Model | the strongest reasoning model available on the gateway | Writing correct SQL across 509 tables is the hardest thing in this app. A weak model here produces plausible wrong numbers, which is the failure mode handover §12 is written to prevent. |
| Response format | `json_schema` (§2) | Enforces the shape at the gateway. |
| Temperature | `0` or as low as allowed | Same question should give the same query. |
| Max tokens | ≥ 2000 | The SQL plus caveats. Rarely more than 800. |
| Delivery | **default / synchronous** | Pulse needs the answer in the response. A non-default response format makes GTWY queue the request and reply `{success, message_id, "Your response will be sent through configured means."}` with no answer — Pulse detects this and reports it as a configuration problem. |
| Memory / history | off | Pulse sends a fresh `thread_id` per question, so nothing carries over. |
| Tools | none | The agent only writes SQL; Pulse executes it. |

The input is roughly **8,500 tokens per question** — ~5,700 for the table
index, ~1,600 for the column detail, ~1,200 for the rules.

---

## 4. What Pulse sends

```
POST {GTWY_BASE_URL}/api/v2/model/chat/completion
pauthkey: {GTWY_PAUTHKEY}
Content-Type: application/json

{
  "user": "which accounts in UAE paid the most last quarter",
  "agent_id": "6a9ebec00869a6b2a232c53f",
  "thread_id": "pulse-m8x2k1-a7f3d9e2",
  "response_type": "text",
  "variables": {
    "schema_index": "access_list (~67 rows) — All the access/feature names…\n…",
    "schema_detail": "-- The complete information of a company…\nTABLE ms_user (\n  user_pid int(11) [PK NOT NULL]\n…",
    "today": "2026-09-07"
  }
}
```

### The three variables

| Variable | What it is | Size |
|---|---|---|
| `schema_index` | Every one of the 509 tables: name, row estimate, one-line description. Built from `information_schema` plus the descriptions the MSG91 team supplied (`lib/pulse/schema-notes.ts` — 148 tables described). | ~21 KB |
| `schema_detail` | Full column list for the 12 tables Pulse is built on, plus any table the agent asked for in a previous round. | ~6 KB |
| `today` | `YYYY-MM-DD`. The agent has no clock, and "last quarter" cannot be resolved without it. | 10 bytes |

Only these three. The question itself travels in `user`, not as a variable.

> If a variable is not sent, GTWY leaves the literal `{{name}}` in the prompt
> rather than erroring, so a typo in a variable name shows up as the agent
> reasoning about a placeholder. All three are always sent.
>
> GTWY doubles backslashes during substitution
> (`Helper.replace_variables_in_prompt`). Neither variable contains
> backslashes, so this does not bite here — worth remembering if you add one
> that does.

### Why the schema is a variable and not part of the prompt

The prompt is the stable half and the schema is the volatile half. Splitting
them this way means MSG91 can edit the wording of the rules on the platform
without a Pulse deploy, and Pulse can add a table description without touching
the agent. It also keeps the prompt cacheable by the gateway if it caches
prefixes.

### Why not all 509 tables in full

Full column detail for 509 tables is roughly 500k tokens, most of it irrelevant
to any one question — and a bloated prompt makes the model *less* accurate, not
more. So the index names everything (cheap) and the detail covers only what is
needed. When the agent needs a table it was not given, it says so in
`needs_schema_for` and Pulse asks again with those columns included. At most two
rounds.

---

## 5. Turning it on

Add the key to `.env.local` and restart:

```
GTWY_PAUTHKEY=your_generated_pauthkey
```

Optional overrides:

```
GTWY_AGENT_ID=6a9ebec00869a6b2a232c53f
GTWY_BASE_URL=https://api.gtwy.ai
```

Then in Pulse: **Ask** → type a question → Enter. Or ⌘K → type a question that
matches no command → Enter.

Without a pauthkey the eight built-in Ask questions still work, and a typed
question returns a 501 saying what is missing.

## 6. What happens to the SQL after the agent writes it

The agent's output is not trusted. Three layers stand between it and the
database:

1. **The database user has `SELECT` only** (`GRANT SELECT ON test_betatest.*`).
   A `DROP` would be refused by MySQL itself. This is the real boundary.
2. **`lib/pulse/sqlguard.ts`** covers what privilege does not: it strips
   comments, splits on semicolons *outside string literals*, and refuses
   anything that is not exactly one `SELECT` — stacked statements,
   `INTO OUTFILE` (which writes even for a read-only user), `LOAD_FILE`,
   `SLEEP`, `BENCHMARK`, `@@variables`, `mysql.*`, `performance_schema.*`. It
   appends `LIMIT 200` when absent and lowers anything higher. 26 cases in
   `tests/sqlguard.test.mjs`.
3. **A 15-second `max_execution_time`** on a dedicated connection, so a badly
   shaped query gets stopped rather than tying up the pool.

The final SQL is shown in the UI underneath the answer, always.

## 7. If something goes wrong

| What you see | What it means |
|---|---|
| `NO_PAUTHKEY` (501) | `GTWY_PAUTHKEY` is not set. |
| `AUTH` (401) | The gateway rejected the pauthkey. |
| `RATE_LIMIT` (429) | Gateway rate limit. |
| `ASYNC_AGENT` (502) | The agent's response format is not `default`, so GTWY queued the request instead of answering. Set it to default (§3). |
| `BAD_PLAN` (502) | The reply did not match the schema — usually the prompt or JSON schema is not configured. The message names the offending field. |
| `NO_JSON` / `BAD_JSON` / `TRUNCATED_JSON` (502) | The reply was not JSON, or was cut off. Raise max tokens, or set the response type to `json_schema`. |
| `REFUSED` (422) | The guard rejected the SQL. The response includes the query so you can see why. |
| `TIMEOUT` (504) | The query ran past 15s. Almost always a correlated subquery against `ms_trans` — the prompt warns against it, and this is what catches it. |
| `EMPTY` (502) | The agent returned nothing. |
