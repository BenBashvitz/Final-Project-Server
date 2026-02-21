/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: "ts-jest",
  setupFiles: ["./jest.setup.ts"],
  roots: ["<rootDir>/src/tests"],
};
