import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { HospitalFile, Insurer, InsurerId } from "../src/types";
import { applyFixes, clean, dedupe, hashFile, type Fix, type RawHospital } from "./lib";
import { validate } from "./validate";

type Parse = (rawFilePath: string) => Promise<RawHospital[]>;

// Register an insurer's adapter here once it has given permission (see README).
const adapters: Partial<Record<InsurerId, Parse>> = {};

const RAW_DIR = "data/raw";
const STATE = "data/state.json";
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));

export async function processInsurer(insurer: Insurer, rawPath: string, parse: Parse, fixes: Fix[], prev?: HospitalFile) {
  const cleaned = applyFixes(clean(await parse(rawPath), insurer.id), fixes, insurer.id);
  const { hospitals, removed } = dedupe(cleaned);
  const result = validate(hospitals, prev?.count, removed);
  const file: HospitalFile = {
    insurer: insurer.id,
    sourceUrl: insurer.hospitalSourceUrl,
    fetchedAt: new Date().toISOString(),
    count: hospitals.length,
    hospitals,
  };
  return { ...result, file };
}

async function main() {
  const insurers: Insurer[] = readJson("public/data/insurers.json");
  const fixes: Fix[] = readJson("pipeline/fixes.json");
  const state: Record<string, string> = fs.existsSync(STATE) ? readJson(STATE) : {};
  let failed = false;

  for (const insurer of insurers) {
    const { id } = insurer;
    const parse = adapters[id];
    if (!parse) {
      console.log(`${id}: no adapter yet, skipped`);
      continue;
    }
    try {
      // ponytail: only manual files for now; add a polite fetch of hospitalSourceUrl when an insurer allows "auto"
      if (insurer.download === "auto") throw new Error("auto download not implemented");
      const rawName = fs.readdirSync(RAW_DIR).find((f) => path.parse(f).name === id);
      if (!rawName) throw new Error(`no raw file ${RAW_DIR}/${id}.*`);
      const rawPath = path.join(RAW_DIR, rawName);

      const hash = hashFile(rawPath);
      const outPath = `public/data/hospitals/${id}.json`;
      if (state[id] === hash && fs.existsSync(outPath)) {
        console.log(`${id}: unchanged, skipped`);
        continue;
      }

      const prev: HospitalFile | undefined = fs.existsSync(outPath) ? readJson(outPath) : undefined;
      const r = await processInsurer(insurer, rawPath, parse, fixes, prev);
      console.log(`--- ${id}\n${r.report}`);
      if (!r.ok) {
        failed = true; // keep the old json
        continue;
      }
      fs.writeFileSync(outPath, JSON.stringify(r.file) + "\n");
      state[id] = hash;
    } catch (e) {
      console.error(`${id}: FAIL: ${(e as Error).message}`);
      failed = true;
    }
  }

  fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
  if (failed) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
