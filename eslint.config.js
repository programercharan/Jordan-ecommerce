import js from "@eslint/js";
import globals from "globals";

export default [
    {
        files: ["**/*.js"],

        ignores: [
            "node_modules/**",
            "public/**",
            "uploads/**"
        ],

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node
            }
        },

        rules: {
            ...js.configs.recommended.rules,
            "no-unused-vars": "warn",
            "no-undef": "error",
            "no-console": "off"
        }
    }
];