import { describe, expect, it } from "vitest";

import { getLocaleFromValue, getLocalizedWithItalianFallback } from "./dictionaries";

describe("getLocaleFromValue", () => {
  it("returns the supported locale when present", () => {
    expect(getLocaleFromValue("en")).toBe("en");
  });

  it("falls back to Italian for unsupported values", () => {
    expect(getLocaleFromValue("fr")).toBe("it");
  });
});

describe("getLocalizedWithItalianFallback", () => {
  it("returns English when available and requested", () => {
    expect(getLocalizedWithItalianFallback("en", "Camera", "Room")).toBe("Room");
  });

  it("falls back to Italian when English content is missing", () => {
    expect(getLocalizedWithItalianFallback("en", "Camera", "")).toBe("Camera");
  });

  it("always returns Italian for the default locale", () => {
    expect(getLocalizedWithItalianFallback("it", "Camera", "Room")).toBe("Camera");
  });
});
