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
    readTime: "5 min read",
    content: `
      <h2>The Problem: Stealth Price Hikes</h2>
      <p>In the restaurant industry, margins are razor-thin. Suppliers often change prices without notice, and catching these "stealth hikes" manually is nearly impossible when you're managing hundreds of line items.</p>
      
      <h2>Step 1: Connect Your Intelligence Center</h2>
      <p>Start by linking your Telegram or Email alerts in the <strong>Settings</strong> tab. This ensures you're notified the second our AI detects a discrepancy.</p>
      
      <h2>Step 2: Automate Ingestion</h2>
      <p>Don't waste time uploading files. Setup an auto-forwarding rule in your email (Gmail or Outlook) to send all supplier PDFs to your unique PriceShield address. Our OCR engine handles the rest.</p>
      
      <h2>Step 3: Define Your Sensitivity</h2>
      <p>Use our new <strong>Alert Sensitivity</strong> slider to ignore minor 0.5% fluctuations and focus on the 5-10% jumps that actually hurt your bottom line.</p>
      
      <h2>Step 4: Use the AI CFO</h2>
      <p>Ask our AI complex questions like "Which vendor increased meat prices the most this month?" to get instant, data-backed answers for your next supplier meeting.</p>
      
      <h2>Step 5: Negotiate with Data</h2>
      <p>Bring our historical price trend reports to your vendors. It's much harder for them to deny an increase when you have the exact date, SKU, and variance percentage in hand.</p>
    `
  },
  {
    slug: "mastering-auto-forwarding",
    title: "Automated Invoice Ingestion: Setting Up Email Forwarding for Gmail, Outlook, and More",
    excerpt: "A technical guide to setting up automated email rules so your invoices reach PriceShield without you lifting a finger.",
    date: "April 2, 2026",
    author: "Technical Team",
    category: "Tutorial",
    image: "/blog/forwarding.jpg",
    readTime: "4 min read",
    content: `
      <h2>Why Auto-Forwarding?</h2>
      <p>Manual uploads are for audits. Auto-forwarding is for <strong>active protection</strong>. By automating the flow, you ensure every single delivery is checked before the bill is even paid.</p>
      
      <h2>Setup for Gmail Users</h2>
      <ol>
        <li>Go to <strong>Settings > See all settings</strong>.</li>
        <li>Click <strong>Forwarding and POP/IMAP</strong>.</li>
        <li>Add your PriceShield address as a forwarding address.</li>
        <li>Create a filter: <em>From: (supplier email)</em> OR <em>Has attachment: pdf</em>.</li>
        <li>Select <strong>Forward it to:</strong> and choose your PriceShield address.</li>
      </ol>
      
      <h2>Setup for Outlook Users</h2>
      <ol>
        <li>Go to <strong>Rules > Manage Rules & Alerts</strong>.</li>
        <li>New Rule -> Apply rule on messages I receive.</li>
        <li>Condition: <em>from people or public group</em> AND <em>which has an attachment</em>.</li>
        <li>Action: <em>forward it to people or public group</em>.</li>
      </ol>
      
      <h2>Common Pitfalls</h2>
      <p>Ensure you are forwarding the <strong>original PDF attachment</strong>, not a link to a portal. Our AI requires the raw data to perform high-accuracy extraction.</p>
    `
  }
];
