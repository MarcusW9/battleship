import js from "@eslint/js";
import globals from "globals";

export default [
    { ignores: ["dist/", "node_modules/"] },

    // Recommended rules, including no-undef and no-unused-vars
    js.configs.recommended,

    // App code runs in the browser as ES modules
    {
        files: ["src/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.browser,
        },
        rules: {
            // Catches statements that do nothing, e.g. targetQueue.push[r, c]
            "no-unused-expressions": "error",
        },
    },

    // Jest tests: allow test, expect, describe, etc.
    {
        files: ["tests/**/*.js"],
        languageOptions: {
            sourceType: "module",
            globals: { ...globals.jest, ...globals.node },
        },
    },

    // Config files run in Node
    {
        files: ["*.config.js", "*.config.mjs"],
        languageOptions: {
            globals: globals.node,
        },
    },
];
