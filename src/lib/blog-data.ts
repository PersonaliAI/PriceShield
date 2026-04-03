export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: string;
  image: string;
  readTime: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "ultimate-guide-to-priceshield",
    title: "How to Stop Restaurant Margin Leaks in 5 Minutes: The Ultimate PriceShield Guide",
    excerpt: "Learn how to use PriceShield to automatically detect supplier price hikes and recover lost profit with zero manual data entry.",
    date: "April 3, 2026",
    author: "PriceShield AI",
    category: "Operations",
    image: "/blog/guide.jpg",
    readTime: "8 min read",
    content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">The Problem: Stealth Price Hikes</h2>
          <p class="text-muted-foreground leading-relaxed">
            In the restaurant industry, margins are razor-thin. Food costs account for 30-35% of total revenue, meaning even a 2% unannounced price hike can wipe out thousands in monthly profit. Suppliers often change prices without notice, and catching these "stealth hikes" manually requires comparing hundreds of line items every week—a task most owners simply don't have time for.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">Step 1: Connect Your Intelligence Center</h2>
          <p class="text-muted-foreground mb-4">
            Before you upload your first invoice, you need to ensure you're actually receiving alerts. PriceShield is designed to be "set and forget."
          </p>
          <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Telegram Integration:</strong> Go to <code class="bg-muted px-1.5 py-0.5 rounded text-xs">Settings</code> and click the Telegram deep link. This links your PriceShield account to our secure bot for instant 24/7 alerts.</li>
            <li><strong>Email Alerts:</strong> Add your personal or manager's email to the <code class="bg-muted px-1.5 py-0.5 rounded text-xs">Alert Channels</code> section.</li>
            <li><strong>ROI Reporting:</strong> Choose your cadence (Daily, Weekly, or Monthly). We recommend <strong>Weekly</strong> to capture trends before you place your next order.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">Step 2: Start Automated Ingestion</h2>
          <p class="text-muted-foreground mb-4">
            PriceShield offers two ways to get data into the system:
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-card/50 border border-border/50 p-4 rounded-xl">
              <h4 class="font-bold text-emerald-400 mb-2">1. Manual Uploads</h4>
              <p class="text-sm text-muted-foreground">Perfect for "one-off" audits. Drag and drop your supplier PDFs into the <code class="bg-muted px-1.5 py-0.5 rounded text-xs">Upload Invoices</code> page. Our AI OCR will process them in seconds.</p>
            </div>
            <div class="bg-card/50 border border-border/50 p-4 rounded-xl">
              <h4 class="font-bold text-blue-400 mb-2">2. Auto-Forwarding (Recommended)</h4>
              <p class="text-sm text-muted-foreground">The "Pro" way. Forward your supplier emails once, and they’ll be audited automatically. Follow our <a href="/blog/mastering-auto-forwarding" class="text-blue-400 hover:underline">dedicated forwarding guide</a> to set this up.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">Step 3: Define Your Sensitivity</h2>
          <p class="text-muted-foreground mb-4">
            Not every 5-cent change is worth a notification. Use the <strong>Alert Threshold</strong> slider in your settings to define exactly what percentage increase triggers a red-alert.
          </p>
          <div class="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
             <p class="text-sm text-emerald-400 font-medium italic">
               "Pro Tip: We recommend a 2% threshold. This ignores standard seasonal fluctuations while highlighting the significant price jumps that actually hurt your bottom line."
             </p>
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">Step 4: Use the AI CFO for Analysis</h2>
          <p class="text-muted-foreground mb-4">
            Once you have a few weeks of data, you can stop clicking through spreadsheets and just <strong>talk</strong> to your data. Try these prompts:
          </p>
          <div class="space-y-2">
            <div class="bg-muted/30 p-3 rounded-lg border border-border/40 text-sm font-mono italic">"Which supplier has increased prices the most this month?"</div>
            <div class="bg-muted/30 p-3 rounded-lg border border-border/40 text-sm font-mono italic">"Show me all SKU price changes for Sysco over the last 90 days."</div>
            <div class="bg-muted/30 p-3 rounded-lg border border-border/40 text-sm font-mono italic">"Analyze meat and poultry across all 3 of my locations."</div>
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">Step 5: Negotiate from Strength</h2>
          <p class="text-muted-foreground">
            The final step is the most rewarding. Bring our <strong>Audit Report</strong> to your next supplier meeting. It’s much harder for a rep to deny a price hike when you have the exact date, SKU, and variance percentage in hand. PriceShield doesn't just find lost profit—it helps you take it back.
          </p>
        </section>
      </div>
    `
  },
  {
    slug: "mastering-auto-forwarding",
    title: "Mastering Auto-Forwarding: A Step-by-Step Guide for Gmail, Outlook & More",
    excerpt: "Automate your invoice audits with zero friction. Learn how to set up forwarding rules so your supplier invoices reach PriceShield automatically.",
    date: "April 2, 2026",
    author: "Technical Team",
    category: "Tutorial",
    image: "/blog/forwarding.jpg",
    readTime: "6 min read",
    content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">Setting Up Gmail Auto-Forwarding</h2>
          <p class="text-muted-foreground mb-4">Gmail requires a two-step process: verifying the address and then creating a filter.</p>
          <ol class="list-decimal pl-6 space-y-3 text-muted-foreground">
            <li>Open Gmail on a desktop. Click the <strong>Settings (Gear)</strong> icon > <strong>See all settings</strong>.</li>
            <li>Click <strong>Forwarding and POP/IMAP</strong>.</li>
            <li>Click <strong>Add a forwarding address</strong> and paste your unique PriceShield ID address (found in your Settings dashboard).</li>
            <li>Gmail will send a verification code to PriceShield. <strong>Check your PriceShield Inbox</strong> under the "Dashboard" to find that code and enter it back into Gmail.</li>
            <li>Go to <strong>Filters and Blocked Addresses</strong> > <strong>Create a new filter</strong>.</li>
            <li>In the "From" field, enter your supplier's email address. In the "Has attachment" box, check the PDF option.</li>
            <li>Click <strong>Create filter</strong>. On the next screen, check <strong>Forward it to:</strong> and select your PriceShield address.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">Setting Up Outlook (Web) Rules</h2>
          <p class="text-muted-foreground mb-4">Outlook rules are powerful but must be configured for original attachments.</p>
          <ol class="list-decimal pl-6 space-y-3 text-muted-foreground">
            <li>Click the <strong>Settings (Gear)</strong> > <strong>View all Outlook settings</strong> > <strong>Mail</strong> > <strong>Rules</strong>.</li>
            <li>Click <strong>Add new rule</strong>. Name it "PriceShield Audit".</li>
            <li>Condition: <strong>From</strong> [Supplier Email] AND <strong>Has attachment</strong>.</li>
            <li>Action: <strong>Forward to</strong> [Your PriceShield ID Email].</li>
            <li>Add another action: <strong>Mark as read</strong> (optional, if you want a clean inbox).</li>
            <li>Click <strong>Save</strong>.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">Custom Domains & Generic Email</h2>
          <p class="text-muted-foreground mb-4">Using a custom host like GoDaddy or SiteGround? You can still automate!</p>
          <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>SMTP Forwarding:</strong> Most hosting control panels (cPanel/Plesk) have a "Forwarders" menu. Simply add a rule to forward mail arriving at <code class="bg-muted px-1.5 py-0.5 rounded text-xs">orders@yourrestaurant.com</code> directly to PriceShield.</li>
            <li><strong>Supplier Direct:</strong> Some suppliers allow you to add "CC" addresses for invoices. Add your PriceShield ID as a CC to have invoices sent directly to our AI for auditing.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-foreground mb-3">Common Pitfalls & Troubleshooting</h2>
          <div class="space-y-4">
            <div class="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
              <h4 class="font-bold text-amber-400 mb-1">Beware of Portal Links</h4>
              <p class="text-sm text-muted-foreground leading-relaxed">If your supplier sends a <strong>link</strong> to a portal (like "Click here to view invoice") instead of the actual PDF, our AI cannot download it automatically. Ensure your supplier is configured to send the Raw PDF attachment.</p>
            </div>
            <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
              <h4 class="font-bold text-blue-400 mb-1">Double-Check the "From" Address</h4>
              <p class="text-sm text-muted-foreground leading-relaxed">PriceShield uses the sender's email to match invoices to your account. If you forward an invoice using a personal email that isn't registered in your <code class="bg-muted px-1.5 py-0.5 rounded text-xs">Supplier Emails</code> list, the AI might flag it as unauthorized. Ensure all manager emails are added to your Settings list.</p>
            </div>
          </div>
        </section>
      </div>
    `
  }
];
