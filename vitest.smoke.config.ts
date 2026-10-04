import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/smoke/**/*.smoke.test.ts"],
    testTimeout: 60000,
    setupFiles: ["src/tests/smoke/setup.ts"],
    fileParallelism: false, // Ensures sequential execution over the VPN
    environment: "node",
  },
});
