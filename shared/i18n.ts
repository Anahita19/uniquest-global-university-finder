export type Language = "en" | "fa";

export function normalizeLanguage(value: string | null | undefined): Language {
  return value === "fa" ? "fa" : "en";
}

export function textDirection(language: Language): "ltr" | "rtl" {
  return language === "fa" ? "rtl" : "ltr";
}

export function htmlLanguage(language: Language): Language {
  return language;
}

export function copy(language: Language, english: string, persian: string): string {
  return language === "fa" ? persian : english;
}
