import type { InferSelectModel } from "drizzle-orm";
import type { profiles, projectLinks, projectMedia, projects } from "@/lib/db/schema";

export type ProfileRow = InferSelectModel<typeof profiles>;
export type ProjectRow = InferSelectModel<typeof projects>;
export type ProjectLinkRow = InferSelectModel<typeof projectLinks>;
export type ProjectMediaRow = InferSelectModel<typeof projectMedia>;

export type MediaKind = "image" | "video";

/** Media as sent to components: includes the resolved public URL. */
export type MediaItem = {
  id: string;
  key: string;
  url: string;
  kind: MediaKind;
  contentType: string;
  size: number;
  position: number;
  isCover: boolean;
};

export type LinkItem = { id: string; label: string; url: string; position: number };

/** Public profile view. avatarUrl already resolves uploaded avatar → GitHub image → null. */
export type PublicProfile = Omit<ProfileRow, "createdAt" | "updatedAt"> & { avatarUrl: string | null };

/** Card shown in project grids and the dashboard list. */
export type ProjectCard = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  stack: string[];
  pinned: boolean;
  pinPosition: number | null;
  createdAt: Date;
  updatedAt: Date;
  cover: MediaItem | null;
};

/** Full project with ordered links and media. */
export type ProjectDetail = ProjectRow & { links: LinkItem[]; media: MediaItem[] };

/** Standard return shape for server actions. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
