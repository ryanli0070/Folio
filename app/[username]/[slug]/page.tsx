import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProfileByUsername } from "@/lib/queries/profiles";
import { getProjectBySlug } from "@/lib/queries/projects";
import { pickCover } from "@/lib/queries/mappers";
import { MediaGallery } from "@/components/media/media-gallery";
import { Markdown } from "@/components/projects/markdown";
import { getLinkIcon } from "@/components/projects/link-icon";

export async function generateMetadata(props: PageProps<"/[username]/[slug]">): Promise<Metadata> {
  const { username, slug } = await props.params;
  const profile = await getProfileByUsername(username);
  if (!profile) return {};
  const project = await getProjectBySlug(profile.userId, slug);
  if (!project) return {};

  const cover = pickCover(project.media);
  const description = project.tagline || undefined;

  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      images: cover ? [{ url: cover.url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: cover ? [cover.url] : undefined,
    },
  };
}

export default async function ProjectPage(props: PageProps<"/[username]/[slug]">) {
  const { username, slug } = await props.params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const project = await getProjectBySlug(profile.userId, slug);
  if (!project) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <Link
        href={`/${profile.username}`}
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        <Avatar size="sm">
          {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
          <AvatarFallback>{profile.username.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        {profile.displayName || profile.username}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
        {project.tagline && <p className="text-lg text-muted-foreground">{project.tagline}</p>}
      </div>

      {project.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.links.map((link) => {
            const Icon = getLinkIcon(link.url);
            return (
              <Button key={link.id} asChild variant="outline" size="sm">
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <Icon /> {link.label}
                </a>
              </Button>
            );
          })}
        </div>
      )}

      <MediaGallery media={project.media} title={project.title} />

      {project.stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {project.collaborators.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Collaborators: </span>
          {project.collaborators.join(", ")}
        </p>
      )}

      {project.description.trim() && (
        <div className="rounded-md border p-4">
          <Markdown>{project.description}</Markdown>
        </div>
      )}
    </div>
  );
}
