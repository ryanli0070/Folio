import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---- Auth.js tables (shape required by @auth/drizzle-adapter) ----

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---- App tables ----

export const profiles = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull().default(""),
  bio: text("bio").notNull().default(""),
  school: text("school").notNull().default(""),
  /** R2 key of an uploaded avatar; null means fall back to users.image (GitHub). */
  avatarKey: text("avatar_key"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  xUrl: text("x_url"),
  websiteUrl: text("website_url"),
  email: text("email"),
  resumeUrl: text("resume_url"),
  skills: text("skills").array().notNull().default([]),
  openToWork: boolean("open_to_work").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const projects = pgTable(
  "project",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    stack: text("stack").array().notNull().default([]),
    collaborators: text("collaborators").array().notNull().default([]),
    pinned: boolean("pinned").notNull().default(false),
    /** 0-based order among pinned projects; null when unpinned. */
    pinPosition: integer("pin_position"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("project_user_slug_idx").on(t.userId, t.slug), index("project_user_idx").on(t.userId)],
);

export const projectLinks = pgTable(
  "project_link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("project_link_project_idx").on(t.projectId)],
);

export const mediaKind = pgEnum("media_kind", ["image", "video"]);

export const projectMedia = pgTable(
  "project_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Denormalized owner for quota checks and ownership filters. */
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull().unique(),
    kind: mediaKind("kind").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    position: integer("position").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("project_media_project_idx").on(t.projectId)],
);

/**
 * One row per presigned upload URL. Drives the per-user upload rate limit and storage quota,
 * and lets a daily cron delete objects that were uploaded but never confirmed.
 */
export const uploadIntents = pgTable(
  "upload_intent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull().unique(),
    purpose: text("purpose").$type<"avatar" | "media">().notNull(),
    size: integer("size").notNull(),
    // Stamped by the app (not DB now()) so rate-limit windows use the same clock regardless of DB timezone.
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$defaultFn(() => new Date()),
    confirmedAt: timestamp("confirmed_at", { mode: "date" }),
  },
  (t) => [index("upload_intent_user_created_idx").on(t.userId, t.createdAt)],
);

// ---- Relations (for db.query) ----

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  projects: many(projects),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  links: many(projectLinks),
  media: many(projectMedia),
}));

export const projectLinksRelations = relations(projectLinks, ({ one }) => ({
  project: one(projects, { fields: [projectLinks.projectId], references: [projects.id] }),
}));

export const projectMediaRelations = relations(projectMedia, ({ one }) => ({
  project: one(projects, { fields: [projectMedia.projectId], references: [projects.id] }),
}));
