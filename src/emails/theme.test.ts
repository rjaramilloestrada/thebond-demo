import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import palette from "../../generated/email-theme.json";
import { BRAND_COLORS, parseColorTokens } from "./parse-tokens";
import { color } from "./theme";

const tokensCss = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");

describe("tema de correo (generado desde tokens.css)", () => {
  it("parseColorTokens lee los ocho colores de marca de tokens.css", () => {
    const parsed = parseColorTokens(tokensCss);
    expect(Object.keys(parsed).sort()).toEqual([...BRAND_COLORS].sort());
    for (const hex of Object.values(parsed)) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("generated/email-theme.json no se desfasa de tokens.css (corre `npm run email-theme`)", () => {
    expect(palette).toEqual(parseColorTokens(tokensCss));
    expect(color).toEqual(palette);
  });

  it("falla con un mensaje claro si tokens.css pierde un color", () => {
    expect(() => parseColorTokens(tokensCss.replace(/--bond-butter:[^;]+;/, ""))).toThrow(/butter/);
  });

  it("ningún archivo de src/emails escribe un color literal: todos salen del tema", () => {
    const files = ["parts.tsx", "ticket.tsx", "reminder.tsx", "transfer.tsx", "waitlist-available.tsx", "theme.ts", "render.tsx"];
    for (const f of files) {
      const text = readFileSync(new URL(`./${f}`, import.meta.url), "utf8");
      expect(text, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(text, f).not.toMatch(/\b(?:rgb|hsl)a?\(/);
    }
  });
});
