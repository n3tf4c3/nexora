import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // env.ts valida no import — valores dummy de teste (nunca de produção).
    env: {
      DATABASE_URL: "postgres://dummy:dummy@localhost:5432/dummy",
      AUTH_SECRET: "dummy-secret-para-vitest-0000000000000000",
      CAPTURA_SMS_TOKEN: "token-dummy-para-vitest-000000000000000000",
    },
  },
});
