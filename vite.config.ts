import { defineConfig } from "vitest/config";
import devtoolsJson from "vite-plugin-devtools-json";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  server: { host: "0.0.0.0", fs: { allow: ["./release", "./src"] } },
  plugins: [sveltekit(), devtoolsJson()],

  test: {
    expect: { requireAssertions: true },

    projects: [
      {
        extends: "./vite.config.ts",

        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});
