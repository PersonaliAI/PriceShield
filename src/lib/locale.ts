// Country + timezone helpers for onboarding and settings.
// Timezones come from the platform (all IANA zones); country names are resolved
// via Intl.DisplayNames so we don't have to hardcode 250 names.

export interface CountryOption {
  code: string;
  name: string;
}

// ISO 3166-1 alpha-2 codes.
export const COUNTRY_CODES: string[] = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AR","AT","AU","AW","AX","AZ","BA","BB",
  "BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BW",
  "BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU",
  "CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER",
  "ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI",
  "GL","GM","GN","GP","GQ","GR","GT","GU","GW","GY","HK","HN","HR","HT","HU","ID",
  "IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH",
  "KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT",
  "LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP",
  "MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI",
  "NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN",
  "PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE",
  "SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ",
  "TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","XK","YE",
  "YT","ZA","ZM","ZW",
];

// A small fallback list in case Intl.supportedValuesOf isn't available.
const FALLBACK_TIMEZONES = [
  "UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
  "America/Toronto","America/Mexico_City","America/Sao_Paulo","Europe/London",
  "Europe/Paris","Europe/Berlin","Europe/Madrid","Europe/Rome","Europe/Moscow",
  "Africa/Cairo","Africa/Johannesburg","Asia/Dubai","Asia/Kolkata","Asia/Bangkok",
  "Asia/Shanghai","Asia/Singapore","Asia/Tokyo","Asia/Seoul","Australia/Sydney",
  "Pacific/Auckland",
];

/** Full list of country options, localized and sorted by display name. */
export function getCountries(locale: string = "en"): CountryOption[] {
  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    dn = null;
  }
  return COUNTRY_CODES.map((code) => ({
    code,
    name: (dn && dn.of(code)) || code,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

/** Every IANA timezone the platform knows about (falls back to a common subset). */
export function getTimezones(): string[] {
  try {
    const sv = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
      .supportedValuesOf;
    if (typeof sv === "function") {
      const zones = sv("timeZone");
      if (zones && zones.length) return zones;
    }
  } catch {
    /* fall through */
  }
  return FALLBACK_TIMEZONES;
}

/** Best-effort current timezone from the browser. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Best-effort country code from the browser locale. */
export function detectCountry(): string {
  try {
    const lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";
    const region = new Intl.Locale(lang).maximize().region;
    if (region && COUNTRY_CODES.includes(region)) return region;
  } catch {
    /* ignore */
  }
  return "US";
}

/** Format a timezone with its current UTC offset, e.g. "Asia/Colombo (UTC+05:30)". */
export function timezoneLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === "timeZoneName")?.value;
    const name = tz.replace(/_/g, " ");
    return offset ? `${name} (${offset})` : name;
  } catch {
    return tz.replace(/_/g, " ");
  }
}

// ---- Local persistence (until the backend gains country/timezone fields) ----

const LS_KEY = "priceshield_region";

export interface RegionPrefs {
  country: string;
  timezone: string;
}

export function loadRegion(): RegionPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as RegionPrefs) : null;
  } catch {
    return null;
  }
}

export function saveRegion(prefs: RegionPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/** Region prefs, falling back to auto-detected values. */
export function getRegionOrDetect(): RegionPrefs {
  return (
    loadRegion() || { country: detectCountry(), timezone: detectTimezone() }
  );
}
