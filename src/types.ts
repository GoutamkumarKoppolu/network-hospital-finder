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
  topic: string; // keyword-based, e.g. "Claims & complaints" (pipeline/news.ts)
  paywalled?: boolean; // only a subscription/login source was found for this story
};

export type NewsFile = {
  insurer: InsurerId;
  fetchedAt: string;
  items: NewsItem[]; // newest first, max 15
};

export type Insurer = {
  id: InsurerId;
  displayName: string; // "Care Health Insurance"
  officialSite: string;
  hospitalSourceUrl: string; // where list comes from
  download: "auto" | "manual";
  newsQuery: string; // e.g. "Care Health Insurance"
  note: string; // robots/terms/permission status (requirement 3.3)
};
