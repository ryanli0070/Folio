/**
 * Collaborators are stored as plain strings. "@login" means a GitHub user;
 * anything else is a display name.
 */
export type Collaborator = { kind: "github"; login: string } | { kind: "name"; name: string };

const GITHUB_LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const GITHUB_URL_RE = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)\/?$/i;

/** Canonical stored form: "@login" for GitHub users (from "@login" or a profile URL), else the trimmed name. */
export function normalizeCollaborator(raw: string): string {
  const s = raw.trim();
  const login = s.startsWith("@") ? s.slice(1) : GITHUB_URL_RE.exec(s)?.[1];
  return login && GITHUB_LOGIN_RE.test(login) ? `@${login}` : s;
}

export function parseCollaborator(stored: string): Collaborator {
  const login = stored.startsWith("@") ? stored.slice(1) : null;
  return login && GITHUB_LOGIN_RE.test(login) ? { kind: "github", login } : { kind: "name", name: stored };
}
