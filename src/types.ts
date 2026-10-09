export type InsurerId =
  | "adityabirla"
  | "bajaj"
  | "care"
  | "galaxy"
  | "hdfcergo"
  | "icici"
  | "manipalcigna"
  | "newindia"
  | "niva"
  | "sbi"
  | "star"
  | "tataaig";

export type Hospital = {
  insurer: InsurerId;
  name: string; // cleaned, Title Case, trimmed, no double spaces
  address: string; // single line
  city: string;
  state: string; // "" if unknown
  pincode: string; // exactly 6 digits, or "" if not found
};

export type HospitalFile = {
  insurer: InsurerId;
  sourceUrl: string;
  fetchedAt: string; // ISO date
  count: number;
  hospitals: Hospital[];
};

export type NewsItem = {
  title: string;
  source: string; // publisher name
  publishedAt: string; // ISO date
  url: string; // link to original
  topic: Topic; // keyword-based (pipeline/news.ts)
  paywalled?: boolean; // only a subscription/login source was found for this story
};

// News topics. This order is both the rule priority (pipeline) and the display order (page).
export const TOPICS = [
  "Claims & complaints",
  "Legal & regulatory",
  "Leadership & people",
  "Stock market",
  "Results & finances",
  "Brand & marketing",
  "Expansion & partnerships",
  "Products & launches",
  "Health & awareness",
  "Other",
] as const;
export type Topic = (typeof TOPICS)[number];

export type NewsFile = {
  insurer: InsurerId;
  fetchedAt: string;
  items: NewsItem[]; // newest first, max 15
};

// Figures from IRDAI's Annual Report, entered by hand (irdai.gov.in blocks bots).
export type InsurerStats = {
  healthIcr: Record<string, number | null>; // financial year → health incurred claim ratio in %, null = not reported (Statement 10)
  solvency: number; // solvency ratio on 31 March at the end of `period` (Statement 12)
  // Handbook on Indian Insurance Statistics, counts as published. Only for standalone health insurers:
  // for general insurers IRDAI mixes motor, health, fire etc., so these are left out.
  claims?: { openAtStart: number; reported: number; paid: number; repudiated: number; openAtEnd: number; paidWithin3MonthsPct: number }; // Table 53
  complaints?: { openingBalance: number; reportedInclOpening: number; attended: number; closingBalance: number }; // Table 56
  healthPolicies?: number; // Table 58, total number of health policies
};

export type StatsFile = {
  sources: { name: string; url: string }[]; // official IRDAI publications the figures come from
  period: string; // financial year the figures cover, "2024-25"; "" = not entered yet
  updatedAt: string; // ISO date-time the figures were entered here
  insurers: Partial<Record<InsurerId, InsurerStats>>;
};

export type Insurer = {
  id: InsurerId;
  displayName: string; // "Care Health Insurance"
  officialSite: string;
  hospitalSourceUrl: string; // where list comes from
  download: "auto" | "manual";
  newsQuery: string; // e.g. "Care Health Insurance"
  irdaiRegNo: string; // as printed on the insurer's own site
  kind: "Standalone health insurer" | "General insurer";
  sector: "Private sector" | "Public sector";
  listed: boolean; // shares listed on NSE/BSE
  docsUrl: string; // policy wordings / brochures page, "" if not confirmed
  claimsUrl: string; // how to make a health claim, "" if not confirmed
  grievanceUrl: string; // insurer's grievance redressal page, "" if not confirmed
  note: string; // robots/terms/permission status (requirement 3.3)
};
