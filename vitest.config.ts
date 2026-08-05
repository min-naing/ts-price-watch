import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/smoke/*.smoke.test.ts"],
    environment: "node",
    setupFiles: ["src/tests/setup.ts"],
  },
});