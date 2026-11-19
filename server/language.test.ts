import { describe, expect, it } from "vitest";
import { copy, htmlLanguage, normalizeLanguage, textDirection } from "../shared/i18n";

describe("language selection contract", () => {
  it("accepts Persian and falls back safely to English", () => {
    expect(normalizeLanguage("fa")).toBe("fa");
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage(null)).toBe("en");
    expect(normalizeLanguage(undefined)).toBe("en");
    expect(normalizeLanguage("de")).toBe("en");
    expect(normalizeLanguage("FA")).toBe("en");
  });

  it("selects the correct translated copy without mutating either source", () => {
    const english = "Review profile";
    const persian = "بررسی پروفایل";
    expect(copy("en", english, persian)).toBe(english);
    expect(copy("fa", english, persian)).toBe(persian);
    expect(copy("fa", english, persian)).not.toBe(english);
  });

  it("keeps document language and layout direction aligned", () => {
    expect(htmlLanguage("en")).toBe("en");
    expect(htmlLanguage("fa")).toBe("fa");
    expect(textDirection("en")).toBe("ltr");
    expect(textDirection("fa")).toBe("rtl");
  });
});
