// Weekly check that every link in insurers.json still opens. Exit code 1 = something is broken.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import type { Insurer } from "../src/types";
import { USER_AGENT } from "./lib";

const FIELDS = ["officialSite", "hospitalSourceUrl", "docsUrl", "claimsUrl", "grievanceUrl"] as const;

/**
 * Only "page gone" fails the check. Everything else is a warning: 401/403/429 = site blocks bots (Care, ICICI),
 * network errors = slow site or a certificate chain browsers repair but Node doesn't (Aditya Birla).
 * ponytail: a dead domain only shows as a warning; read the warnings in the report now and then.
 */
export const isBroken = (status: number | string) => status === 404 || status === 410;
const isWarning = (status: number | string) => typeof status === "string" || status >= 400;

async function check(url: string): Promise<number | string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(30_000) });
    await res.body?.cancel();
    return res.status;
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    return err.cause?.code ?? err.message;
  }
}

async function main() {
  const insurers: Insurer[] = JSON.parse(fs.readFileSync("public/data/insurers.json", "utf8"));
  const broken: string[] = [];
  const warnings: string[] = [];
  for (const ins of insurers)
    for (const field of FIELDS) {
      const url = ins[field];
      if (!url) continue;
      const status = await check(url); // one at a time, to be polite
      const line = `- ${ins.id} \`${field}\`: ${status} ${url}`;
      if (isBroken(status)) broken.push(line);
      else if (isWarning(status)) warnings.push(line);
    }
  console.log(broken.length ? `Broken links (page not found) in public/data/insurers.json:\n${broken.join("\n")}` : "No broken links");
  if (warnings.length) console.log(`\nCould not check (blocked, slow or certificate issue; usually fine in a browser):\n${warnings.join("\n")}`);
  if (broken.length) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
