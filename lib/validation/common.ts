import { z } from "zod";
import { LIMITS } from "@/lib/limits";

export const RESERVED_USERNAMES = new Set([
  "api", "auth", "dashboard", "login", "logout", "signin", "signout", "signup", "register",
  "settings", "new", "edit", "admin", "about", "help", "support", "terms", "privacy",
  "static", "public", "assets", "images", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
  "folio", "www", "app", "account", "profile", "projects", "explore", "u", "user", "users",
]);

export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_RE, "Use 1–39 lowercase letters, numbers, or dashes (no leading/trailing dash).")
  .refine((u) => !RESERVED_USERNAMES.has(u), "That username is reserved.");

/** Turns any string (e.g. a GitHub login) into a username candidate. */
export function sanitizeUsername(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 39)
    .replace(/-$/, "");
  return s || "user";
}

export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url("Enter a valid URL.")
  .refine((u) => /^https?:\/\//i.test(u), "URL must start with http:// or https://");

/** Optional URL from a form field: empty string becomes null. */
export const optionalHttpUrl = z
  .union([z.literal(""), httpUrl])
  .transform((v) => (v === "" ? null : v));

export const tagSchema = z.string().trim().min(1).max(LIMITS.tagMaxLength);

/** Deduped (case-insensitive) list of tags, capped at `max`. */
export const tagListSchema = (max: number) =>
  z
    .array(tagSchema)
    .max(max, `At most ${max} tags.`)
    .transform((tags) => {
      const seen = new Set<string>();
      return tags.filter((t) => {
        const k = t.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    });
