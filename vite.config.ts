/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // works at <user>.github.io/network-hospital-finder/
  test: { passWithNoTests: true },
});
