/* ─── Settings API methods ─── */
export interface UserSettings {
  email: string;
  priceshield_inbox_email: string;
  forwarding_emails: string[];
  telegram_chat_id: string | null;
  telegram_linked: boolean;
  whatsapp_number: string | null;
  onesignal_player_id: string | null;
  alert_channels: string[];
  tier: string;
  invoices_uploaded: number;
  manual_uploads_count: number;
  alert_email: string | null;
  report_daily: boolean;
  report_weekly: boolean;
  report_monthly: boolean;
  locations: Location[];
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface LocationCreate {
  name: string;
  address?: string;
}

export interface SettingsUpdate {
  forwarding_emails?: string[];
  whatsapp_number?: string | null;
  onesignal_player_id?: string | null;
  alert_channels?: string[];
  report_daily?: boolean;
  alert_email?: string | null;
  report_weekly?: boolean;
  report_monthly?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    ...(fetchOptions?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Prevent Next.js or browser caching
  const separator = path.includes("?") ? "&" : "?";
  const finalPath = `${path}${separator}t=${new Date().getTime()}`;

  const res = await fetch(`${API_BASE}${finalPath}`, {
    ...fetchOptions,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API request failed");
  }
  return res.json();
}

async function uploadFiles<T>(
  path: string,
  files: File[],
  token: string,
  metadata?: Record<string, string>
): Promise<T> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (metadata) {
    Object.entries(metadata).forEach(([key, val]) => formData.append(key, val));
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Upload failed");
  }
  return res.json();
}

/* ─── Types ─── */
export interface DashboardSummary {
  total_margin_lost: number;
  hikes_caught: number;
  top_offending_vendor: string;
}

export interface PriceTrendPoint {
  date: string;
  unit_price: number;
  quantity: number;
}

export interface InvoiceRow {
  invoice_date: string;
  vendor_name: string;
  item_name: string;
  sku: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
  variance_pct: number;
}

export interface AuditResult {
  status: string;
  invoices_processed: number;
  total_historical_loss: number;
  total_hikes_found: number;
  comparisons: unknown[];
}

export interface AttachmentMetadata {
  filename: string;
  content_type: string;
  size_bytes: number;
  signed_url?: string;
}

export interface InboxMessage {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  text_body?: string;
  html_body?: string;
  has_attachments: boolean;
  attachments: AttachmentMetadata[];
  created_at: string;
}

/* ─── API methods ─── */
export const api = {
  getDashboardSummary: (token: string) =>
    request<DashboardSummary>(`/api/dashboard/summary`, { token }),

  getPriceTrends: (token: string, vendor: string, item: string) =>
    request<{ vendor: string; item: string; data: PriceTrendPoint[] }>(
      `/api/dashboard/price-trends?vendor_name=${encodeURIComponent(vendor)}&item_name=${encodeURIComponent(item)}`,
      { token }
    ),

  getInvoices: (token: string, vendor?: string) =>
    request<{ rows: InvoiceRow[]; total: number }>(
      `/api/dashboard/invoices${vendor ? `?vendor_name=${encodeURIComponent(vendor)}` : ""}`,
      { token }
    ),

  getVendors: (token: string) =>
    request<{ vendors: string[] }>(`/api/dashboard/vendors`, { token }),

  runAudit: (token: string, files: File[], locationId?: string) =>
    uploadFiles<AuditResult>(
      `/onboarding/audit`, 
      files, 
      token, 
      locationId ? { location_id: locationId } : undefined
    ),

  getSettings: (token: string) =>
    request<UserSettings>(`/api/settings`, { token }),

  updateSettings: (token: string, update: SettingsUpdate) =>
    request<{ status: string; fields: string[] }>(`/api/settings`, {
      token,
      method: "PUT",
      body: JSON.stringify(update),
    }),

  // Inbox
  getInboxMessages: (token: string) =>
    request<InboxMessage[]>(`/api/inbox`, { token }),

  // Telegram
  disconnectTelegram: (token: string) =>
    request<{ status: string }>(`/webhook/telegram/disconnect`, {
      token,
      method: "POST",
    }),

  // AI CFO
  askAICFO: (token: string, question: string) =>
    request<{ answer: string }>(`/api/ai-cfo/ask`, {
      token,
      method: "POST",
      body: JSON.stringify({ question }),
    }),

  getAICFOHistory: (token: string, limit: number = 30) =>
    request<Array<{ role: string; content: string; created_at: string }>>(
      `/api/ai-cfo/history?limit=${limit}`,
      { token }
    ),

  // Subscriptions
  getCheckoutUrl: (token: string, tier: string) =>
    request<{ url: string }>(`/api/subscriptions/checkout`, {
      token,
      method: "POST",
      body: JSON.stringify({ tier }),
    }),

  // Locations
  getLocations: (token: string) =>
    request<Location[]>(`/api/locations`, { token }),

  createLocation: (token: string, data: LocationCreate) =>
    request<Location>(`/api/locations`, {
      token,
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateLocation: (token: string, id: string, data: LocationCreate) =>
    request<Location>(`/api/locations/${id}`, {
      token,
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteLocation: (token: string, id: string) =>
    request<{ status: string }>(`/api/locations/${id}`, {
      token,
      method: "DELETE",
    }),

  triggerTestReport: (token: string, cycle: string, userId: string) =>
    request<{ status: string; message?: string }>(
      `/reports/cron/${cycle}?test_uid=${userId}`,
      { token }
    ),
};
