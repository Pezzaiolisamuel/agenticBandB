import type { Metadata } from "next";
import { getDictionary, type Locale, type PublicPageKey } from "@/lib/locales";

export function buildPublicPageMetadata(locale: Locale, key: PublicPageKey): Metadata {
  const dictionary = getDictionary(locale);
  const page = dictionary[key];

  return {
    title: page.title,
    description: page.description
  };
}
