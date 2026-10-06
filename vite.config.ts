/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // works at <user>.github.io/network-hospital-finder/
  appType: "mpa", // missing data files must 404 in dev, like on GitHub Pages
  test: { passWithNoTests: true },
});
