const path = require("path");

module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    rootDir: path.join(__dirname, "src"),
    moduleNameMapper: {
        "@src/(.*)$": "<rootDir>/$1.ts"
    },
    testMatch: [ "**/__tests__/**/*.[jt]s?(x)" ]
};