import { describe, expect, it } from "vitest";
import {
  cleanYoutubeEmbedUrl,
  cn,
  formatDuration,
  formatPrice,
  resolveImageUrl,
} from "./utils";

describe("cn", () => {
  it("combina classes e ignora falsy", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

describe("formatPrice", () => {
  it("formata valores em BRL", () => {
    expect(formatPrice(10)).toContain("10,00");
  });

  it("trata valores vazios como zero (comportamento atual)", () => {
    expect(formatPrice(null)).toContain("0,00");
    expect(formatPrice(undefined)).toContain("0,00");
  });
});

describe("formatDuration", () => {
  it("formata minutos e segundos", () => {
    const out = formatDuration(65);
    expect(out).toMatch(/1/);
    expect(out).toMatch(/05|5/);
  });

  it("nulo quando sem duração", () => {
    expect(formatDuration(null)).toBeNull();
  });
});

describe("resolveImageUrl", () => {
  it("prefixa URL relativa de uploads", () => {
    expect(resolveImageUrl("/uploads/x.png")).toMatch(/^https?:\/\/.*\/uploads\/x\.png$/);
  });

  it("mantém URL absoluta", () => {
    expect(resolveImageUrl("https://a.com/b.png")).toBe("https://a.com/b.png");
  });

  it("undefined para entrada vazia", () => {
    expect(resolveImageUrl(undefined)).toBeUndefined();
  });
});

describe("cleanYoutubeEmbedUrl", () => {
  it("extrai id de watch URL", () => {
    expect(cleanYoutubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toContain(
      "dQw4w9WgXcQ"
    );
  });
});
