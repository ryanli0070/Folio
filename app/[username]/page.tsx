import type { Metadata } from "next";
import { FileText, GraduationCap } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/profile/project-card";
import { SocialLinks } from "@/components/profile/social-links";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProfileByUsername } from "@/lib/queries/profiles";
import { getProjectCards } from "@/lib/queries/projects";

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile not found" };

  const name = profile.displayName || profile.username;
  return {
    title: name,
    description: profile.bio || undefined,
    openGraph: profile.avatarUrl ? { images: [{ url: profile.avatarUrl }] } : undefined,
  };
}

export default async function PublicProfilePage({ params }: PageProps<"/[username]">) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const cards = await getProjectCards(profile.userId);
  const pinned = cards.filter((c) => c.pinned);
  const rest = cards.filter((c) => !c.pinned);
  const name = profile.displayName || profile.username;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-10 md:grid md:grid-cols-[280px_1fr] md:items-start md:gap-8">
        <aside className="flex flex-col gap-4">
          <Avatar className="size-32">
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
            <AvatarFallback className="text-4xl">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-xl font-semibold">{name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          {profile.openToWork && (
            <Badge className="w-fit border-transparent bg-success-muted text-success">Open to work</Badge>
          )}

          {profile.bio && <p className="text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>}

          {profile.school && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="size-4 shrink-0" aria-hidden />
              {profile.school}
            </div>
          )}

          <SocialLinks profile={profile} />

          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {profile.resumeUrl && (
            <Button asChild variant="outline" size="sm" className="w-fit">
              <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                <FileText aria-hidden />
                Resume
              </a>
            </Button>
          )}
        </aside>

        <div className="flex flex-col gap-8">
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <>
              {pinned.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Pinned</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {pinned.map((card) => (
                      <ProjectCard key={card.id} card={card} username={profile.username} />
                    ))}
                  </div>
                </section>
              )}

              {rest.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">All projects</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {rest.map((card) => (
                      <ProjectCard key={card.id} card={card} username={profile.username} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
