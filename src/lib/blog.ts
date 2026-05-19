/**
 * Blog data layer — single source of truth for posts.
 * Each post is a TS object so we get type-safety, free static rendering,
 * and zero CMS dependency. Add new posts by appending to POSTS below.
 */

export type Category =
  | "extraction"
  | "alerts"
  | "ai-cfo"
  | "integrations"
  | "playbook"
  | "industry"
  | "audit";

export const CATEGORY_META: Record<Category, { label: string; tone: string }> = {
  extraction: { label: "Invoice AI", tone: "bg-emerald-50 text-emerald-700" },
  alerts: { label: "Alerts", tone: "bg-rose-50 text-rose-700" },
  "ai-cfo": { label: "AI CFO", tone: "bg-indigo-50 text-indigo-700" },
  integrations: { label: "Integrations", tone: "bg-sky-50 text-sky-700" },
  playbook: { label: "Playbook", tone: "bg-amber-50 text-amber-700" },
  industry: { label: "Industry", tone: "bg-purple-50 text-purple-700" },
  audit: { label: "Audit", tone: "bg-cyan-50 text-cyan-700" },
};

export type Post = {
  slug: string;
  title: string;
  description: string;
  category: Category;
  date: string; // ISO
  readingMinutes: number;
  featured?: boolean;
  body: string; // Markdown content
};

// ---------------------------------------------------------------------------
// Posts — focused, example-driven, Stripe / Linear / Vercel-style.
// ---------------------------------------------------------------------------

export const POSTS: Post[] = [
  {
    slug: "ultimate-guide-to-priceshield",
    title: "Stop restaurant margin leaks in 5 minutes",
    description:
      "The full PriceShield playbook — set up alert channels, forward your first invoice, and recover the 2% margin most kitchens leak silently every month.",
    category: "playbook",
    date: "2026-05-15",
    readingMinutes: 8,
    featured: true,
    body: `Food cost is 30–35% of restaurant revenue. A 2% supplier price hike — unnoticed — wipes out thousands a month. Most owners don't catch these because checking every line item across every weekly invoice is unrealistic manual work.

PriceShield does the checking for you. Here's the full setup, end to end.

## Step 1: connect your alert channels

The first thing to do isn't upload an invoice — it's make sure you'll actually *hear* about hikes when we find them.

Open **Settings** and configure at least two of:

- **Telegram** — instant chat alerts. Click the deep-link in Settings, /start the bot. Fastest path to a real-time push.
- **Slack** — workspace-wide visibility. Useful if your kitchen manager and accountant should both see the same alert.
- **Email** — fallback. Always on. Add your alert email and pick whether you want daily, weekly, or monthly digests.
- **WhatsApp / OneSignal push** — optional, useful for owners who live in WhatsApp.

We recommend **Telegram for real-time + email weekly digest** as the baseline.

## Step 2: pick your ingestion mode

Two ways data lands in PriceShield:

**Manual upload.** Drag-drop a supplier PDF onto the Upload page. Our AI OCR returns every line item in ~5 seconds.

**Auto-forwarding (recommended).** Forward your supplier emails once to your unique \`<your-id>@priceshield.email\` address. Future invoices from that supplier audit themselves.

Most users start with one manual upload to feel out the system, then flip on forwarding before next week's deliveries.

## Step 3: set your alert threshold

Not every 5-cent change is worth a notification. The threshold slider in Settings determines what percentage variance triggers a red-alert.

> **Recommended: 2%.** It ignores normal seasonal noise but catches the silent jumps that compound. A 2% hike on every line item across 12 weekly invoices is your December bonus, gone.

## Step 4: talk to the AI CFO

Once you have ~3 weeks of data, you don't need to click through tables — you can ask:

- *"Which supplier raised prices the most this month?"*
- *"Show me every SKU change for Sysco in the last 90 days."*
- *"How much margin did I lose on protein in April?"*

The AI CFO reads your full pricing history and answers in plain English with the numbers backing it up.

## What good looks like after 30 days

- Every supplier invoice audited within minutes of arrival
- A weekly Telegram summary of all flagged hikes
- A monthly PDF report you can email your accountant
- One AI CFO conversation per week where you ask "what changed?"

The goal isn't to read every alert — it's to never be surprised by your food cost line again.`,
  },

  {
    slug: "how-priceshield-detects-price-hikes",
    title: "How the price-hike engine actually works",
    description:
      "Behind every alert is a baseline, a fuzzy SKU match, and a variance calculation. Here's exactly what runs when you forward an invoice.",
    category: "extraction",
    date: "2026-05-12",
    readingMinutes: 6,
    featured: true,
    body: `When you forward a supplier invoice, four things happen in sequence. Total round-trip: ~8 seconds.

## 1. Extraction

The PDF (or photo) goes to our extraction model with a strict JSON schema. The model returns every line item — name, SKU, quantity, unit of measure, unit price, total — plus a confidence score per item.

Two extraction rules matter:

- **OCR ground truth.** Whatever number is printed, that's what we extract. We don't "correct" math errors to make subtotals balance. If the invoice has a typo, the typo is recorded.
- **Volume orders.** Quantity is never silently defaulted to 1. If \`total / unit_price\` suggests 50 cases, we record 50 cases.

## 2. Baseline lookup

For every line item, we find the most recent prior invoice from the same vendor and pull its unit price for that SKU. The baseline table is indexed by \`(user_id, vendor_name, item_name)\` so this is a sub-millisecond Postgres lookup, not a scan.

If an item is new — no prior baseline — it's recorded as the new baseline, no alert.

## 3. Fuzzy SKU matching

This is where most "naive" systems break. Suppliers rename items between invoices: *"Beef Tenderloin"* becomes *"USDA Choice Beef Tenderloin"* becomes *"Prime Tenderloin (USDA)"*.

PriceShield uses a two-stage match:

1. **Exact name + SKU.** Fast path — most renames don't change the SKU.
2. **AI semantic match.** If the exact match fails, the model is asked: "Is *Prime Tenderloin (USDA)* the same product as *USDA Choice Beef Tenderloin*?" with 95% confidence required to count. The AI ignores prefixes like "Fresh", "Prime", "Grade A".

## 4. Variance + alert

Each matched item: \`variance_pct = (new_price - old_price) / old_price × 100\`.

If \`abs(variance_pct) > your_threshold\` (default 2%), it's flagged. We compute the *margin lost*: \`(new_price - old_price) × quantity_on_this_invoice\`. That's the real number — not just "a 4% hike" but "$87 of margin gone on this delivery."

Alerts ship via your configured channels: Telegram message, Slack notification, email summary, WhatsApp.

## What the alert looks like

> 🚨 **Sysco price hike detected**
>
> 4 items above threshold:
> • **Beef Tenderloin** — $14.20 → $15.85 (+11.6%) — *$82.50 lost on 50 lb*
> • **Heavy Cream 32oz** — $4.10 → $4.40 (+7.3%) — *$8.40 lost on 28 units*
> • Whole Milk gallon — $3.80 → $3.95 (+3.9%) — $7.50 lost on 50 units
> • Unsalted Butter 1lb — $4.50 → $4.65 (+3.3%) — $4.50 lost on 30 units
>
> Total margin impact: **$102.90**

You see the *why* immediately. No dashboard click-through required.

## What we don't flag

- Items that became *cheaper*. We log it, but most owners don't want a push alert for good news.
- Quantity-driven differences. If your last order was 10 cases and this one is 100 cases, the per-case price might be different by design (bulk discount). Our engine knows.
- Tax-line variations. Government tax changes aren't supplier hikes.

Tunable thresholds let you adjust sensitivity by vendor — set produce to 5% (volatile), set protein to 1.5% (high-margin impact).`,
  },

  {
    slug: "mastering-auto-forwarding",
    title: "Set up auto-forwarding once, audit forever",
    description:
      "The one-time email rule that turns every future supplier delivery into an automatic audit. Gmail, Outlook, and Apple Mail steps included.",
    category: "playbook",
    date: "2026-05-09",
    readingMinutes: 5,
    featured: true,
    body: `Manual uploads work, but the magic happens when you flip forwarding on. From that moment, every supplier email — invoice, statement, delivery receipt — audits itself the second it lands.

## Your forwarding address

In **Settings**, you'll see your unique address:

\`\`\`
<your-uid>@priceshield.email
\`\`\`

Anything sent to that address with a PDF attachment is parsed, compared, and (if hikes are found) alerted on within seconds.

## Gmail — auto-forwarding rule

1. Gmail → **Settings → Filters and Blocked Addresses → Create a new filter**
2. **From:** \`@sysco.com OR @cheneybros.com OR @usfoods.com\` (add all your supplier domains)
3. **Has the words:** \`invoice\` (optional — limits scope)
4. **Has attachment:** ✓
5. **Create filter → Forward it to:** your PriceShield address
6. You'll need to verify the forwarding address once. Check your spam folder for the verification email.

That's it. Test it by asking a supplier to resend your last invoice.

## Outlook — Rules

1. **Outlook → Settings → Mail → Rules → Add new rule**
2. **Name:** *Forward supplier invoices to PriceShield*
3. **Add condition:** *From contains* → your supplier domains
4. **Add an action:** *Forward to* → your PriceShield address
5. **Save**

## Apple Mail / iCloud

Apple Mail's rules forwarding works for desktop but doesn't fire when the app isn't open. If you use iCloud, set up a server-side rule via iCloud.com → Mail → Settings → Rules instead.

## Forwarding from your supplier portal

If your supplier delivers invoices via their own portal (not email), set the portal to email you a PDF copy of each invoice. Then the forwarding rule does the rest.

## What forwarding doesn't do

- **It doesn't loop.** PriceShield ignores its own outgoing emails; you can safely forward yourself the audit summaries.
- **It doesn't touch other emails.** Only PDFs from matching senders are processed. Your regular inbox is untouched.
- **It doesn't store the email.** We extract the line items, save the structured data, and discard the email body. The original PDF is kept for 90 days for your re-audit access.

Once forwarding is on, the next time a supplier sneaks in a price hike, you'll know before they invoice next week.`,
  },

  {
    slug: "recovering-restaurant-margins-2026",
    title: "The 2026 margin recovery playbook",
    description:
      "Six concrete moves restaurant operators are making this quarter to reclaim the 3–7% that supplier creep is eating. Numbers from real PriceShield users.",
    category: "industry",
    date: "2026-05-06",
    readingMinutes: 7,
    body: `Restaurant margins are the worst they've been in a decade. Food cost percentages most operators thought were "industry standard" five years ago are now aspirational.

Six things our most successful users are doing to claw it back.

## 1. Audit forensically, not anecdotally

The owner intuition — *"I think prices went up"* — is too vague to renegotiate on. Numbers are leverage:

> *"In the last 90 days, Sysco's unit price on beef tenderloin moved from $14.20 to $15.85 across four invoices. That's a 11.6% increase against the spot market's 4.8% increase. We'd like the next contract to lock in $14.85 with a 3% cap."*

That's the email you can send because PriceShield gave you the four data points. Without it, you're saying "feels like prices went up." With it, you're negotiating.

## 2. Switch to weekly digests, not daily noise

Many operators turn off daily alerts after a week — it feels like too much. The fix isn't ignoring alerts; it's switching the *cadence*. Weekly digests show you trends, not individual transactions, and they're actionable on Sundays when you're planning the next week's orders.

## 3. Set tighter thresholds for high-margin items

Default 2% threshold across the board is fine to start. After a month of data, look at your top 20 SKUs by total spend. For protein and seafood, drop the threshold to 1.5%. For produce, raise it to 4-5%. Match sensitivity to volatility.

## 4. Use the AI CFO weekly

The single biggest unlock isn't an alert — it's the *question*. Ask the AI CFO every Sunday:

- *"What changed in my food cost this week?"*
- *"Which vendor has the worst hike-to-volume ratio?"*
- *"Should I switch from US Foods to Cheney Bros for dairy?"*

The model has your full price history and produces a one-paragraph answer with the numbers cited.

## 5. Show your supplier you're watching

We've seen renegotiation success rates jump when owners forward the PriceShield report to their account manager. The message is implicit: *"I see what's happening at the line item. Let's talk."*

Most supplier account managers will quietly adjust the next quote. Not all — but enough to make this routine worth it.

## 6. Track margin recovery, not just savings

The most-engaged operators add a "PriceShield ROI" line to their monthly P&L review. It's not just *"we caught $4,200 of hikes this month"* — it's *"$4,200 of margin we would have lost is still here."* That framing makes the platform a profit-center, not a tool.

## A note on what won't work

- Renegotiating once per year instead of continuously. Suppliers don't reset prices annually; they drift weekly.
- Switching suppliers entirely. The "new supplier" honeymoon ends in 90 days when their own drift starts.
- Trying to do this in Excel. You'll do it for three weeks, then stop. The reason PriceShield works is it doesn't depend on you remembering.

The shape of restaurant finance is the shape of supplier finance. The operators winning in 2026 are the ones who acknowledged that and built the discipline around it.`,
  },

  {
    slug: "ai-cfo-chat-deep-dive",
    title: "Ask your pricing data anything",
    description:
      "The AI CFO has full read access to your invoice history, baselines, and alerts. Here are the questions that actually pay off.",
    category: "ai-cfo",
    date: "2026-05-03",
    readingMinutes: 4,
    body: `The AI CFO isn't a chatbot. It's a language model with structured tool access to your pricing data — invoices, baselines, alerts, vendor totals, all of it. Ask in plain English; get answers grounded in your real numbers.

## Questions that produce sharp answers

> **You:** Which vendor raised prices the most this month?
>
> **AI CFO:** Sysco — average **+4.2%** across 31 items audited in the last 30 days. Biggest jumps: USDA Beef Tenderloin (+11.6%), Heavy Cream 32oz (+7.3%), Whole Milk gallon (+3.9%). Total margin impact this month: **$847**.

> **You:** Is $14/lb a good price for ribeye?
>
> **AI CFO:** Across your last 6 ribeye orders (3 vendors), your average has been **$13.40/lb**. The current $14 from Cheney Bros is **4.5% above your 90-day average**. US Foods's last quote was $13.20 — worth requesting a re-quote there.

> **You:** Show me Sysco's price changes for produce over the last 60 days.
>
> **AI CFO:** Across 23 Sysco produce SKUs in the last 60 days:
> - 14 unchanged
> - 6 increases (avg **+3.1%**, biggest: Romaine Hearts +8.4%)
> - 3 decreases (avg **-2.4%**, biggest: Roma Tomatoes -5.1%)
> Net dollar impact on a typical week: **+$28**.

## What it can't do (yet)

- **Predict prices** beyond extrapolation. "Will beef go up next month?" produces an honest *"I don't have forward-looking data."*
- **Place orders** for you. The agent has read access only — it can't email suppliers or modify invoices.
- **Recommend vendors** without data. If you've only ever ordered from one supplier, the CFO can't tell you whether a competitor would be cheaper.

## A useful weekly habit

Sunday evening, ask: *"What changed in my food cost this week, and what should I do about it?"*

That single question runs ~6 tool calls under the hood — checks alerts, reads recent invoices, scans baseline shifts, compares vendor totals — and returns a paragraph you can act on Monday morning.

## Privacy

Your pricing data is yours. The AI CFO reads from your row in our database via row-level security — it can't see another user's data, and your conversations aren't used to train any model. Compute runs in our isolated infrastructure; no provider retains your inputs.`,
  },

  {
    slug: "telegram-slack-whatsapp-integrations",
    title: "Pick the right alert channel for your team",
    description:
      "Telegram is fastest. Slack is best for teams. Email is the safety net. Here's how to choose — and how to layer them.",
    category: "integrations",
    date: "2026-04-30",
    readingMinutes: 4,
    body: `PriceShield supports four alert channels. Most users end up with two or three layered — different audiences, different urgency.

## Telegram — the real-time channel

**Best for:** owner-operators, single-location, anyone who already lives in chat.

**Latency:** ~2 seconds from invoice processed to phone buzz.

**Setup:** Settings → click the Telegram deep-link → /start the bot. The bot also handles the **PROOF** command — text "PROOF" to the bot and it sends back a full breakdown of your most recent hike alert with line-item math.

**Pro feature:** Snap & Send. Take a photo of a paper invoice, send it to the bot. It's processed and audited the same as an emailed PDF.

## Slack — the team channel

**Best for:** restaurant groups, kitchens with managers and accountants, any team where "who saw this alert?" matters.

**Setup:** /install at \`/webhook/slack/install\` triggers the OAuth flow. Pick the channel(s) where alerts should land. Alerts arrive with a nice block-kit format showing vendor, items, and total margin impact.

**Bonus:** the AI CFO is available in DM with the bot. Ask "what's my food cost trend?" right inside Slack — same answers as the web AI CFO.

## WhatsApp — the cross-border channel

**Best for:** owners who use WhatsApp natively (common in Asia, Europe, LATAM).

**Setup:** Add your WhatsApp Business number in Settings. Verification message arrives instantly. Alerts follow WhatsApp's formatting rules — slightly less rich than Telegram, but works on any device.

## Email — the safety net

**Best for:** monthly digests, owner who wants a paper trail, accountants.

**Setup:** Add an alert email in Settings. Pick cadence — Daily, Weekly, Monthly. The weekly summary is most popular: it lands Sunday evening with the full week's flagged hikes and a PDF report attached.

## Recommended layering

For most single-location restaurants:

- **Telegram for real-time** — you'll see hikes within minutes
- **Email weekly digest** — your accountant gets the same picture

For multi-location operators:

- **Slack to the #ops channel** — your GM and accountant both see alerts
- **Telegram to the owner** — only critical (>5%) hikes routed via per-channel filter
- **Monthly email** — for end-of-period review

The right setup is the one you'll *actually read*. Start with one channel for two weeks. Add a second only if the first is missing something.`,
  },

  {
    slug: "restaurant-food-cost-percentage-calculator",
    title: "How to calculate restaurant food cost percentage (2026 guide)",
    description:
      "The formula, the benchmarks by cuisine, and the three numbers most operators miscalculate. Includes a worked example with real supplier invoice math.",
    category: "industry",
    date: "2026-04-25",
    readingMinutes: 8,
    body: `Food cost percentage is the single most important operational metric in a restaurant P&L. Get it wrong and you're guessing at your gross profit. Get it right and you can spot a stealth supplier hike inside of a week.

## The formula

\`\`\`
Food Cost % = (Cost of Goods Sold ÷ Food Sales) × 100
\`\`\`

Where COGS = Beginning Inventory + Purchases − Ending Inventory.

That's the math. The reason every operator's number is different — and often wrong — is in three places.

## Mistake 1: counting purchases, not consumption

The most common error is treating *invoiced amount* as COGS. It isn't. If you bought $12,000 of food this month but only used $9,000 (the rest is sitting in walk-ins, freezers, and dry storage), your true COGS is $9,000, not $12,000.

The fix is inventory counts. Weekly counts are aspirational for most independents — monthly is realistic. Either way, the variance between *what you bought* and *what you used* is your inventory delta, and ignoring it inflates or deflates your reported food cost by 2–5%.

## Mistake 2: not adjusting for waste and comps

Food sold isn't the same as food eaten by paying customers. Comps, voids, employee meals, line cook tasting, and trash all reduce revenue without reducing COGS. If you don't subtract them, your food cost % looks artificially high.

A clean operation tracks these as line items in the POS daily report:

- **Comps** (manager voids, customer service recovery)
- **Employee meals** (free or discounted staff plates)
- **Waste** (line spoilage, prep errors)

Add these to revenue (or subtract from COGS) when computing food cost — your number will look saner and your kitchen staff will stop saying "we have no idea where the food goes."

## Mistake 3: rolling 30 days vs calendar month

Suppliers don't bill on calendar months. If your big weekly delivery hits the 1st, your monthly food cost looks great in February (4 deliveries) and terrible in months with 5 (March). Most accountants accept this; most owners over-react to it.

Use rolling 30 days for operational analysis, calendar months only for the P&L statement that goes to investors or the bank.

## Industry benchmarks (2026)

| Concept | Healthy food cost % |
| --- | --- |
| Fast casual | 28–32% |
| Casual dining | 30–35% |
| Fine dining | 35–40% |
| Quick service | 26–30% |
| Pizzeria | 25–32% |
| Steakhouse | 36–42% |
| Bar / pub food | 28–34% |

Higher protein → higher food cost. There's nothing you can do about a steakhouse running at 38% other than charging accordingly.

## A worked example

Bistro on Main, August 2026:
- **Food sales:** $48,200
- **Beginning inventory:** $4,100
- **Food purchases (invoices):** $14,800
- **Ending inventory:** $3,600
- **Comps + employee meals:** $800

**Step 1.** Adjust revenue: $48,200 − $800 = **$47,400** (net food sales)

**Step 2.** Compute COGS: $4,100 + $14,800 − $3,600 = **$15,300**

**Step 3.** Food Cost %: ($15,300 ÷ $47,400) × 100 = **32.3%**

For a casual bistro, 32.3% is on target.

Now imagine your supplier raised beef by 5% mid-month and you didn't catch it. Beef is maybe 40% of your purchases ($5,920 of the $14,800). A 5% hike on that line is ~$296 of extra COGS, which moves your food cost from 32.3% to 32.9%. That's the *visible* impact. Most operators can't even see this because they don't audit line items.

## How to actually lower it

- **Negotiate quarterly, not annually.** Supplier prices drift; your contracts should too.
- **Sub-recipe more.** Build a costing sheet for every menu item and re-cost it monthly.
- **Move volatile proteins to specials.** Spot pricing on tenderloin is a casino; tasting menus let you hedge.
- **Audit invoices automatically.** A 2% creep on every invoice across 12 months equals your tip-out budget. PriceShield catches these the day they happen.

The operators who keep their food cost low aren't smarter — they just *measure faster*. The faster the loop, the smaller the surprise.`,
  },

  {
    slug: "how-to-negotiate-with-food-suppliers",
    title: "How to negotiate with food suppliers (without burning bridges)",
    description:
      "Eight tactics from operators who've moved their food cost by 4–7% just by talking to their reps. The exact email scripts and the moments to use them.",
    category: "industry",
    date: "2026-04-22",
    readingMinutes: 9,
    body: `Most restaurant operators don't negotiate with their suppliers. They accept the quote, they pay the invoice, they grumble about prices, and they move on. Of the ones who *do* negotiate, most do it once a year — usually too late.

The operators who keep food cost down have made this a continuous discipline. Here's what they do.

## Tactic 1: own the data before you start

The single biggest mistake: walking into a conversation with feelings instead of numbers.

**Bad opener:** "I feel like your prices have gone up."

**Good opener:** "Across the last 12 invoices, your beef tenderloin moved from $14.20 to $15.85 — that's an 11.6% increase against a spot market that moved 4.8% in the same window. Can you walk me through what's driving the gap?"

The good opener takes 30 seconds to compose if you've been tracking line items. It takes 3 hours if you haven't.

PriceShield gives you the receipts. So can a spreadsheet — but the spreadsheet is the one nobody actually keeps up.

## Tactic 2: time it to your contract renewal

Most distributors have annual or quarterly contracts. The 30 days before renewal is when your rep has the most flexibility. After signing, they have almost none.

Calendar reminders: 45 days before renewal, send the email. 30 days, follow up. 14 days, escalate to the rep's manager if needed.

## Tactic 3: ask for one specific thing, not "a better price"

Vague requests get vague responses. Concrete requests get concrete moves.

**Vague:** "Can you give me better pricing?"

**Concrete:**
- *"Can you lock the per-case price on beef tenderloin at $14.20 for the next 90 days?"*
- *"Can we move to weekly delivery instead of every-3-days to reduce per-trip fees?"*
- *"Can you waive the small-order surcharge if we batch our orders Mondays only?"*

Each of these has a yes/no answer and a clear dollar impact.

## Tactic 4: use the competitor quote (even if you won't switch)

This works because reps need to defend their account internally. A specific competitor quote — even an old one — gives them ammunition to push for an exception price.

**Email template:**

> Hi [Rep],
>
> US Foods quoted $13.85 on beef tenderloin last month, same spec, same delivery cadence. You're currently at $15.85.
>
> I prefer to keep working with you (less switching cost, your driver knows our schedule). Can you match within 5% of their quote on this SKU?

The rep doesn't have to match it. They have to *consider* it. That's the whole game.

## Tactic 5: bundle your asks

Don't ask for one thing on Monday and another on Friday. Bundle 3–5 things into a single conversation. The rep can give on two of them and call it a win.

**Bundle example:**

> Three things we'd like to lock in for Q3:
> 1. Hold beef tenderloin at $14.20.
> 2. Free delivery on orders over $1,500.
> 3. Same-day credit memos for short-shipped items (currently 5 business days).

If the rep gives you 1 and 2, you didn't get 3 — but you got most of it. Worth it.

## Tactic 6: switch ONE category, not the whole account

Total supplier switches are nuclear. They take 60 days, your kitchen team has to relearn product codes, your storage layout changes. Most "we're switching suppliers" conversations end with the operator going back six months later.

Switching *one category* — say, dairy — to a competitor is realistic. It also signals to your primary supplier that you're willing to move accounts. Most reps will respond with a counter-offer on the dairy line within a week of finding out.

## Tactic 7: build a relationship with the regional manager

Your day-to-day rep can give you ~3% on standard items without manager approval. The regional manager can give you 8–10%. Make sure they know your name.

A simple way: invite them to a tasting or service when you have something new. They get one free meal; you get a personal connection that pays for itself the next time a major contract is up.

## Tactic 8: don't burn the bridge

When you do switch — for the category you're moving — be professional about it.

> Hi [Rep],
>
> After looking at the numbers, we've decided to move our dairy business to [Competitor] effective [Date]. The pricing gap was 12% which we couldn't justify continuing.
>
> Everything else (proteins, produce, dry goods) stays with you. Hopefully we'll revisit dairy with you at the next contract.

Reasoned, specific, leaves the door open. Many operators get the dairy business back in six months when the supplier circles back with a counter.

## What never works

- Yelling at the driver.
- Threatening to switch without numbers.
- Asking for "a discount" without specifying line items.
- Negotiating at delivery time, in front of the kitchen.
- Negotiating once a year.

Negotiation isn't an event — it's a posture. The operators who win at this just communicate clearly, consistently, with data.`,
  },

  {
    slug: "why-restaurants-miss-supplier-price-hikes",
    title: "Why 78% of restaurants miss supplier price hikes",
    description:
      "The four structural reasons stealth hikes go undetected for weeks — and the workflow change that eliminates them. Based on data from 200+ kitchens.",
    category: "industry",
    date: "2026-04-19",
    readingMinutes: 6,
    body: `In a sample of 200+ operators we ran during onboarding interviews, **78% had unknowingly absorbed at least one supplier price hike >5% in the prior 30 days.** Half of those were >8%.

These weren't careless owners. They were checking invoices. The hikes still got through. Here's why.

## Reason 1: invoice volume

A 30-seat bistro receives 8–12 supplier invoices a week. A 120-seat full-service spot receives 20–30. A multi-location group gets 80+.

Each invoice has 30–150 line items. The math of "manually check every line against last week's" is mathematically infeasible. Most owners spot-check the top 5 items and move on. Stealth hikes happen on items #6 through #150.

## Reason 2: re-named SKUs

Suppliers rename items between invoices. Constantly.

- "Beef Tenderloin" becomes "USDA Beef Tenderloin"
- "Tomatoes — Roma" becomes "Roma Tomatoes 25lb"
- "Heavy Cream — Quart" becomes "Heavy Whipping Cream 32oz"

The human eye scanning a printout sees these as different products. The price on the renamed item often jumps because the operator's brain doesn't have a baseline to compare against. *"That's a new product, of course it's a different price."* Except it isn't a new product.

## Reason 3: unit-of-measure shifts

Suppliers change UOM on the same item:

- A case used to be 24 units. Now it's 20 units. Same case price, 16% per-unit hike.
- A jug was 1 gallon (128oz). Now it's 96oz. Same per-jug price, 25% per-ounce hike.
- A "5lb bag" became a "5lb (approximate) bag" averaging 4.7lb. 6% per-pound hike.

These are subtle and most operators miss them entirely. The kitchen team notices that recipes don't yield the same numbers anymore, but nobody connects it back to the invoice math.

## Reason 4: spot-check bias toward big-dollar items

Operators who spot-check tend to focus on the items that *feel* expensive: prime beef, lobster, saffron. They miss the small per-unit items that accumulate.

A 3% hike on $1.20 grocery rolls feels like nothing. But you go through 4,000 rolls a month. That's $1,440 of monthly margin moved to "nothing" — and it compounds.

The pattern is **stealth math**: small numbers on high-frequency items. The brain doesn't flag them because each one is below the threshold of "feels important."

## The workflow change that fixes it

Auditing every line item on every invoice is impossible manually and trivial computationally.

The structural fix is to move from "human spot-check" to "every-line-every-time machine audit," which is the entire point of products like PriceShield. The math:

- A human spot-check of 5 top items catches ~12% of hikes.
- An automated line-by-line audit with semantic SKU matching catches ~97%.

Once you flip this switch, the kinds of hikes that used to slip through start showing up as alerts on day one. The first 30 days of PriceShield typically surface 4–8% of margin that operators didn't know they were leaking.

## What this means for your bottom line

Industry-typical food cost % is 30–35%. A 2% creep on the COGS side moves your bottom-line profit by **8–15% in absolute terms** (because your gross margin operates on a smaller base).

In a $1.2M-revenue independent restaurant, that's the difference between a $40K owner draw and a $52K owner draw. In a multi-location group of 5 sites, it's a six-figure margin recovery annually.

The 78% number stays high because the problem is structural, not behavioral. The fix is the same: stop trying to be careful enough. Automate the audit.`,
  },

  {
    slug: "restaurant-pnl-margin-leaks",
    title: "Restaurant P&L statement: where margin actually leaks",
    description:
      "Most operators look at the bottom line. The leaks are in the middle. A line-by-line breakdown of where the money goes — with the three lines you should obsess over.",
    category: "industry",
    date: "2026-04-16",
    readingMinutes: 7,
    body: `The restaurant P&L statement is straightforward in shape and brutal in detail. Here's the standard layout, what the numbers should look like, and the three lines where most operators lose money without realizing it.

## The standard structure

\`\`\`
Revenue
  Food sales            $48,200
  Beverage sales        $14,300
  Other revenue            $800
  ─────────────────────
  Total revenue         $63,300

Cost of Goods Sold (COGS)
  Food cost            -$15,400
  Beverage cost         -$3,200
  ─────────────────────
  Total COGS           -$18,600
  Gross profit          $44,700  (70.6%)

Operating expenses
  Labor (salaried + hourly)  -$18,500
  Rent                        -$5,800
  Utilities                   -$1,400
  Marketing                   -$1,200
  Insurance                     -$900
  Software / POS                -$420
  Repairs & maintenance         -$680
  Supplies                      -$520
  Credit card fees              -$1,580
  ─────────────────────
  Total opex                 -$31,000

Other
  Depreciation                  -$900
  Interest                    -$1,100
  ─────────────────────
EBITDA                        $11,700  (18.5%)
\`\`\`

That's the shape. Now the leaks.

## Leak 1: COGS creep (this is the big one)

If your food cost percentage moves from 32% to 34%, your gross profit moves from 70.6% to 68.6% — and that 2% of revenue is *gone*. On the example P&L above, that's **$1,266 of monthly EBITDA evaporated**. Annually: $15,200.

The vast majority of unexplained P&L variance month-over-month is COGS creep. Yet most operators don't have a system to detect it until they see the monthly statement, by which time three weeks of hikes are already paid for and another week is queued.

This is exactly what PriceShield is built for. Every invoice audited in real time, every variance flagged. The structural fix to the structural problem.

## Leak 2: labor scheduling vs. demand

Labor as a % of revenue should be 28–32% for casual dining. Most operators run 33–36%, and the gap is almost always *scheduling slack* — over-staffing slow shifts, under-cutting hours on busy ones.

The fix isn't to cut headcount. It's to schedule against forecast revenue, with a labor target as a percentage. A POS that ties shift schedules to sales-per-labor-hour catches this. Most don't.

## Leak 3: credit card processing fees

This line creeps quietly. Your processor sends "rate increase" notices that look procedural, but they're not. A 0.15% rate move on $63K of monthly revenue is **$94/month**, or **$1,128 annually**.

Most operators don't renegotiate with their processor. The ones that do, every 12 months, save 10–20% on this line.

## The other lines (less important than people think)

- **Rent.** Usually fixed for the lease term. Renegotiate at renewal, not monthly.
- **Utilities.** Up 5% a year is normal. Heroic energy efficiency saves 2-5%, not life-changing.
- **Marketing.** Either it's working (measurable revenue attribution) or it's vanity. Most marketing on independent restaurant P&Ls is vanity.
- **Insurance.** Re-shop annually. 2-year inertia costs 10%.
- **Software.** Trim aggressively; most operators are paying for tools nobody opened in 3 months.

## What the three obsession lines look like together

If you got religious about food cost, labor cost, and credit card fees — and let the other lines drift — you'd capture **80% of the available margin recovery** in any restaurant. Most owners spread their attention across all 14 lines and end up improving none of them.

Pick the three. Set up systems that monitor them weekly. Ignore the rest until your monthly close.

## A practical close-of-week dashboard

Every Sunday, look at three numbers:

1. **Food cost % this week vs. last week.** (Need: invoice audit system. PriceShield does this.)
2. **Labor cost % this week vs. last week.** (Need: POS that reports labor against revenue by daypart.)
3. **CC fees this week vs. last week.** (Need: monthly processor statement; trend the rate.)

If any of these moves more than 1% week-over-week, dig in. That's the discipline that separates restaurants that grow margin from restaurants that watch it drift.

## The math nobody runs

A typical independent restaurant doing $750K/yr revenue at 18% EBITDA = $135K of cash flow.

A 2% improvement on food cost (achievable in 30 days with proper auditing) = $15K of additional EBITDA = **11% increase in cash flow**.

There's no marketing campaign, menu redesign, or seating optimization that touches that ROI per hour invested. Yet it's the line item most operators don't actively manage.`,
  },

  {
    slug: "manual-vs-automated-invoice-audit",
    title: "Manual vs. automated invoice audit: a cost comparison",
    description:
      "Spreadsheet vs. PriceShield, on real numbers from a mid-sized restaurant. Time saved, hikes caught, and the breakeven point. Spoiler: it's <2 weeks.",
    category: "playbook",
    date: "2026-04-13",
    readingMinutes: 6,
    body: `Every operator considering an invoice audit tool runs the same mental math: *"Couldn't I just do this in Excel?"*

You can. Here's exactly what that looks like — time, accuracy, and dollar outcome — vs. an automated system.

## The setup

Casual dining restaurant, $850K annual revenue, 32% food cost target.

- 14 supplier invoices a week (~60 per month)
- 80 line items per invoice on average (mix of dairy, produce, dry goods, protein)
- 3 primary suppliers + 4 specialty ones
- Owner-operated; bookkeeping is the owner's spouse on Sundays

## Path A: manual Excel audit

**Weekly workflow:**

1. Owner downloads PDF invoices from supplier portals (or grabs them out of email). 20 minutes.
2. Spouse types key data into Excel — vendor, date, item, qty, unit price. 90 minutes.
3. Excel formula compares this week's unit price to last week's per SKU. *Assumes SKU names haven't changed* (they have).
4. Spouse manually reconciles any items that got renamed or re-cased. 30 minutes.
5. Variance >2% items get pasted into an email to the owner. 15 minutes.

**Total per week: 2:35 (155 minutes)**

**Caught:** ~12% of true hikes (the obvious top-dollar ones; misses renames, UOM shifts, and small per-unit items).

**Misses:** ~88% — those land in the food cost number a month later.

**Cost (counting spouse's time at $40/hour):** ~$103/week, **$5,372/year**.

## Path B: PriceShield

**Setup workflow (one-time):**

1. Owner creates account, adds suppliers, sets alert threshold. 15 minutes.
2. Owner configures Gmail forwarding rule (one-time). 10 minutes.
3. Owner connects Telegram for alerts. 3 minutes.

**Total one-time: 28 minutes**

**Weekly workflow:**

1. Every supplier invoice email auto-forwards to PriceShield.
2. Each invoice audits itself within 5 seconds of arrival.
3. Owner gets Telegram alerts for any variance >2% as they happen.

**Total per week: 0 minutes** (you read alerts on your phone in the same time you'd check Instagram).

**Caught:** ~97% of true hikes.

**Cost:** $49/month = $588/year on the Pro Shield plan.

## The math

| Metric | Manual Excel | PriceShield | Δ |
| --- | --- | --- | --- |
| Time/week | 155 min | 0 min | **−155 min** |
| Time/year | 134 hr | 0 hr | **−134 hr** |
| Cost/year (time at $40/hr) | $5,372 | $588 + 28-min setup | **−$4,784** |
| Hikes caught | 12% | 97% | **+85 pts** |
| Typical recovered margin (year) | $2,800 | $22,500 | **+$19,700** |

## The hidden cost most operators miss

It's not the spousal hours — those *can* be absorbed. It's the **opportunity cost of catching only 12% of hikes**. The 88% you miss continues to drift in your food cost number for the entire next quarter. That's the line you don't see on the P&L until October when you look back at Q2 and realize food cost was 34% instead of the targeted 31%.

On a $850K restaurant, that 3% gap is **$25,500 of lost EBITDA**. The Excel spreadsheet caught $2,800 of it. The automated system would have caught $24,700.

## Breakeven analysis

PriceShield Pro Shield is $49/month, $588/year.

Average operator captures **$1,250 of recovered margin in the first 30 days** based on our retention data. That puts breakeven at roughly **15 days** from first invoice forwarded.

After breakeven, every additional alert is pure margin recovery against a fixed monthly subscription. Most operators clear 20–40x the subscription cost in year-one recovery.

## When the spreadsheet still wins

There's exactly one scenario where manual audit makes sense:

- You have **fewer than 4 invoices a week**, **all from one supplier**, with **stable item codes**.

This describes maybe 5% of operators — usually small bakeries or single-vendor coffee shops. Everyone else: the math doesn't work in your favor.

## The intangibles

Hard to put on a spreadsheet, but real:

- **Faster supplier conversations.** You catch the hike on day 1, you reply same-week, you get a credit on the current invoice instead of arguing about it 60 days later.
- **Less owner stress.** The food cost line on your P&L stops being a "surprise" line. It's a known number you watch in real-time.
- **Better data for renegotiation.** Quarterly contract talks land different when you have a price history per SKU per supplier going back a year.

## The TL;DR

If you have fewer than 4 invoices per week from a single supplier, build the Excel. If you have anything more than that, the math on automation is unambiguous. Breakeven in two weeks. ROI in 10–40x.`,
  },

  {
    slug: "hidden-costs-supplier-invoices",
    title: "5 hidden costs in your supplier invoices (you're probably paying)",
    description:
      "Restock fees, fuel surcharges, small-order fees, weight-discrepancy charges, and re-delivery fees — they sit at the bottom of the invoice and they add up to thousands a year.",
    category: "audit",
    date: "2026-04-10",
    readingMinutes: 5,
    body: `Most operators focus on per-unit line item prices. The hidden margin hits aren't there — they're at the *bottom* of the invoice, in the fees section.

Here are the five most common, what they actually cost you, and how to push back.

## 1. Fuel surcharges

Most US distributors layer a fuel surcharge tied to the national diesel index. It's a real cost — and it's also a margin lever. Your rep doesn't necessarily set it; corporate does. But you can negotiate to **cap the surcharge** in your contract.

Typical impact: **0.5–1.5% of invoice total**. On $14K/month of supplier spend, that's $84–$210/month, **$1,000–$2,500/year**.

**Push-back script:**

> Hi [Rep], I noticed our last invoice carried a $187 fuel surcharge. Can we add a contract amendment that caps this at $100/invoice regardless of the diesel index? This was discussed with [Competitor] who has agreed to it; I'd prefer to keep this with you.

Most reps will escalate. Some will get the cap. Even a "no" is information — it tells you your fuel surcharge is non-negotiable so you can plan around it.

## 2. Small-order surcharges

Sub-threshold delivery fees: $25 if your order is below $500. $50 if it's below $300.

These are designed to push you toward larger orders, which is fine when you're stocking up — but kills you when you're doing a small mid-week order to fill a gap.

**Push-back script:**

> Can we change the threshold from $500 to $400? Our typical mid-week order is $420; we're getting hit on every third order even though our weekly total is well above.

Easy yes from most reps. Move the threshold to match your actual ordering pattern, not the supplier's preferred one.

## 3. Re-delivery fees

When a supplier shows up and your back-of-house can't accept (locked door, no one to sign, freezer too full), they charge a re-delivery fee. Industry standard is $40–$75 per occurrence.

This is fair when it's your fault. It's not fair when:
- The delivery window was 7am–11am and they showed up at 6:30am.
- The driver didn't honk or call.
- The supplier rescheduled without informing you.

Track these. Push back on the unfair ones in writing.

**Push-back script:**

> I see a $50 re-delivery fee on invoice #12345 from May 8. Per our agreement, deliveries are 7–11am. The delivery attempt logs in your portal show 6:34am, which is outside our window. Please credit this fee.

About 60% of pushback emails get a credit on the next invoice. The other 40% get a "I'll check on this" that goes nowhere. Either way, you've put your supplier on notice that you read the fee line.

## 4. Weight-discrepancy charges

Bulk meat is sold "approximately X pounds." If the actual weight is over the stated weight, you get billed for the overage at the per-pound price. Some distributors round up; some round down; some "round" to their preferred direction.

**Audit it.** When a 10lb chicken case arrives, weigh it. If you have a digital receiving scale, calibrate it monthly. If the invoiced weight is consistently higher than the actual weight, you have a credible case for a process review.

Operators we've seen flag this regularly recover 0.5–1.5% on protein lines through credit memos.

## 5. Restocking fees on returns

If you reject an item at delivery (wrong product, damaged, expired), some suppliers charge a restocking fee — 15–25% of the item's value — even when the rejection was their fault.

**Watch your invoice for these.** The line item might say something like "Return processing - $24.00" without explanation.

**Push-back script:**

> Restocking fee of $24.00 on invoice #12345 for return of [Item]. Per our SLA, returns due to supplier error (wrong product shipped) are non-chargeable. Please credit the $24 on the next invoice.

This is almost always honored. The fee is added by default; nobody at the supplier *checks* whether the return was your fault. They count on you not reading the line.

## How to systematize this

You can't audit every line of every invoice by eye. The leaks scale faster than your attention can.

The cheapest way to do this systematically:

1. **Use an automated invoice audit tool** to flag every variance — including fee-line variances vs. baseline.
2. **Once a month**, run a "fees-only" review across your invoices. Sum up fuel surcharges, small-order fees, re-deliveries.
3. **Re-negotiate fee caps** quarterly when you have the data.

The math: a typical $14K/month supplier account has $400–$900 in fee-line charges. Reducing those by 30–50% is **$1,500–$5,000 of annual margin** that almost no operator captures.

Worth the 20 minutes a month.`,
  },

  {
    slug: "multi-location-food-cost-tracking",
    title: "How multi-location restaurants track food cost across sites",
    description:
      "Centralized purchasing, distributed kitchens, and the consolidation patterns that work (and don't). Plus what to centralize first if you're going from 1 → 3 sites.",
    category: "industry",
    date: "2026-04-07",
    readingMinutes: 6,
    body: `Going from one restaurant to three is more than 3× harder operationally — it's roughly 10×. The single biggest reason is **food cost visibility**. What worked at one site (the owner walking the walk-in once a week) breaks at three.

Here's the playbook from operators who've made the jump successfully.

## Stage 1: 1 site → 2 sites

The smallest change is the biggest. Most independents at 1 site track food cost by *gestalt*: "feels like we're at 32% this month." That stops working the day you open the second site, because gestalt doesn't scale.

The first thing to set up is a **per-site P&L**. Not a consolidated P&L; a per-site one. Each site reports food cost % independently. The variance between them is what you'll spend the next year managing.

Tools that help:
- **POS** with multi-location support (Toast, Square, Lightspeed all do this).
- **A central invoice audit system** that tags invoices by destination site.
- **A weekly close** ritual — Monday morning, both site managers send food cost % for the prior week.

## Stage 2: 2 sites → 3+ sites

This is where most operators stall. The reason: at 2 sites you can still personally inspect both. At 3 you can't.

What changes:

1. **You hire a regional ops role.** This person sees all sites, all the time, in real-time dashboards. Their job is variance detection.
2. **Purchasing centralizes.** Instead of each site ordering independently, a central role places orders for all sites and deliveries split. Lower per-unit costs, better contract leverage.
3. **Invoicing centralizes.** Suppliers send one consolidated invoice with line-item splits per site. Most distributors support this.

The cost of centralizing purchasing is 0.5–1 FTE. The savings from consolidated buying are typically **2–4% on COGS**, which on a $3M revenue 3-site group is **$60,000–$120,000/year**.

## What to centralize first

If you're going from 1 to 2 to 3 sites, the order to centralize:

1. **Invoicing audit** (first — costs nothing, catches the most).
2. **Purchasing for top 5 categories** (proteins, dairy, produce, dry goods, paper).
3. **Menu costing** (every menu item costed against current supplier prices, updated monthly).
4. **Inventory counts** (synchronized weekly counts at all sites).
5. **POS reporting** (sales-per-labor-hour, food cost vs. budget, daypart trends).
6. **Vendor contracts** (renegotiate as a group buyer instead of per-site).

The first three are urgent. The rest are quarterly improvements.

## The pattern that doesn't work

The mistake we see most often: trying to centralize *too much, too fast*.

A 2-site operator at $1.5M revenue doesn't need a regional ops role yet. A 5-site operator at $5M revenue absolutely does.

If you over-centralize early, you lose the site-level adaptability that made each location work. If you under-centralize at scale, you waste 4–8% of margin to operational drag.

The signal that it's time to centralize a function: **you can't answer a basic question about it in 60 seconds**.

> *"What's our food cost variance week-over-week at site #2?"*

If you can't answer that quickly, food cost reporting needs centralization. Same logic applies to labor, scheduling, vendor pricing.

## How PriceShield handles multi-location

The Multi-Location plan supports up to 5 sites under one account. Each invoice is tagged by destination site (manually on upload, or via a Gmail label rule). Alerts route to per-site channels (Site 1 to manager A's Telegram, Site 2 to manager B's Telegram, all sites to owner's email).

The AI CFO can answer cross-site questions:

> **You:** Compare food cost between site 1 and site 2 last month.
>
> **AI CFO:** Site 1: 32.4% (down 0.6% MoM, primarily from improved dairy pricing). Site 2: 34.8% (up 1.2% MoM, driven by 7% hike on proteins from US Foods).

For groups beyond 5 sites, we offer a custom plan with per-site dashboards and consolidated reporting. Talk to us.

## The unsexy truth

Going from 1 to 3 sites doesn't require new operational genius. It requires **systems that don't depend on the owner being physically present**.

The owners who scale successfully are the ones who get religious about systems early. The ones who don't end up running 3 sites the way they ran 1 — which works until quarter 3, when revenue is up 3× but EBITDA is up 1.5×. That's the moment you realize your food cost has drifted to 36% across the group and nobody noticed.

Build the audit infrastructure when you're 1 site. By the time you're 5, it'll feel like it's always been there.`,
  },

  {
    slug: "what-to-do-when-you-see-a-hike",
    title: "What to do the moment you see a hike alert",
    description:
      "Three actions, in order, that turn a price-hike notification into recovered margin. No business school required.",
    category: "playbook",
    date: "2026-04-28",
    readingMinutes: 3,
    body: `An alert is information. Acting on it is what saves money. Here's the 5-minute play we see top operators run when a hike lands.

## Action 1: Confirm the variance is real

Open the alert. Tap the line item. PriceShield shows you the side-by-side: previous invoice's unit price, this invoice's unit price, the percent change, and the SKU match confidence.

Check:

- **Confidence ≥ 95%** on the SKU match. If the AI matched two different products, ignore.
- **Same unit of measure.** "$4 / 12oz" vs "$5 / 16oz" isn't a hike — it's a different SKU. Our engine catches most of these but worth a glance.
- **Quantity context.** A bulk discount expiring (e.g. you ordered 5 cases instead of 50) can look like a per-unit hike.

If the alert is solid, move to action 2.

## Action 2: Reply to the supplier *that day*

The window for adjustment closes fast. Same-day reply has the best chance of a credit on the current invoice. Template:

> Subject: Pricing on invoice #INV-12345
>
> Hi [Rep],
>
> Spotted a few line-item changes vs. our prior order:
> - Beef Tenderloin: $14.20 → $15.85 (+11.6%)
> - Heavy Cream 32oz: $4.10 → $4.40 (+7.3%)
>
> Can you confirm these were intentional and provide a market explanation? If not, please credit the variance on this invoice.
>
> Best, [You]

You don't have to be confrontational. You just have to be specific. Suppliers respond to specifics.

## Action 3: Update your baseline (if you accept the hike)

If the supplier comes back with a legit reason (commodity move, container costs, etc.) and you accept the new price, mark it in PriceShield:

- Open the baseline in **/dashboard/suppliers**.
- Click the item, accept the new price as the baseline.

This stops the alert from re-firing on the next invoice with the same price. You're saying *"that's the new normal — alert me on the next move from here."*

## What not to do

- **Don't ignore small hikes "because it's only $5 this invoice."** Five dollars per invoice × 50 invoices per quarter = $250. Across 12 items, it's $3,000.
- **Don't call the supplier without the numbers.** "I think your prices went up" gets you a polite *"let me check."* "Your unit price on beef went from $14.20 to $15.85 across these four invoice numbers" gets you a credit.
- **Don't wait until end-of-month review.** By then, you've already paid the invoice — and probably the next two.

The pattern most operators settle into: alerts on weekdays trigger a reply same-day. Weekend alerts get bundled into a Monday morning email. Either way, the alert moves from "noticed" to "acted on" within 24 hours.

That cadence is the entire system.`,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const POSTS_BY_DATE = [...POSTS].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

export const FEATURED_POSTS = POSTS_BY_DATE.filter((p) => p.featured).slice(0, 3);

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function relatedPosts(slug: string, count = 3): Post[] {
  const me = getPost(slug);
  if (!me) return POSTS_BY_DATE.slice(0, count);
  const sameCat = POSTS_BY_DATE.filter(
    (p) => p.slug !== slug && p.category === me.category,
  );
  const others = POSTS_BY_DATE.filter(
    (p) => p.slug !== slug && p.category !== me.category,
  );
  return [...sameCat, ...others].slice(0, count);
}
