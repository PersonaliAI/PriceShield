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

The PDF (or photo) goes to Vertex AI's Gemini 2.5 Flash model with a strict JSON schema. The model returns every line item — name, SKU, quantity, unit of measure, unit price, total — plus a confidence score per item.

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
2. **AI semantic match.** If the exact match fails, Gemini is asked: "Is *Prime Tenderloin (USDA)* the same product as *USDA Choice Beef Tenderloin*?" with 95% confidence required to count. The AI ignores prefixes like "Fresh", "Prime", "Grade A".

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
    body: `The AI CFO isn't a chatbot. It's a Vertex AI model with structured tool access to your pricing data — invoices, baselines, alerts, vendor totals, all of it. Ask in plain English; get answers grounded in your real numbers.

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

Your pricing data is yours. The AI CFO reads from your row in our database via RLS — it can't see another user's data, and your conversations aren't used to train any model. The Gemini calls run in your GCP project's Vertex AI quota (one of the reasons Vertex over the open API).`,
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
