import Module from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";

/*
 * typescript-eslint (usado por eslint-config-next) todavía no soporta la API de
 * TypeScript 7 (ver typescript-eslint#10940). Siguiendo la guía "side-by-side"
 * de TS 7, el proyecto compila con TS 7 y SOLO el lint usa la API de TS 6
 * (devDependency `typescript-6`). Quitar este bloque cuando typescript-eslint
 * soporte TS >= 7.1.
 */
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return originalResolve.call(this, request === "typescript" ? "typescript-6" : request, ...rest);
};

const { default: nextVitals } = await import("eslint-config-next/core-web-vitals");
const { default: nextTs } = await import("eslint-config-next/typescript");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"]),
]);

export default eslintConfig;
