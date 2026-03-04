const nextConfig = require("eslint-config-next");
const tseslint = require("typescript-eslint");

module.exports = [
  ...nextConfig,
  ...tseslint.configs["recommended"],
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
];
