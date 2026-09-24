import { AtSign, Briefcase, Code2, Globe, Mail } from "lucide-react";
import type { PublicProfile } from "@/lib/types";

type SocialDef = { href: string; label: string; icon: typeof Globe };

/** GitHub/LinkedIn/X/website/email links, shown with generic (non-brand) icons. */
export function SocialLinks({ profile }: { profile: PublicProfile }) {
  const links: SocialDef[] = [
    profile.githubUrl ? { href: profile.githubUrl, label: "GitHub", icon: Code2 } : null,
    profile.linkedinUrl ? { href: profile.linkedinUrl, label: "LinkedIn", icon: Briefcase } : null,
    profile.xUrl ? { href: profile.xUrl, label: "X", icon: AtSign } : null,
    profile.websiteUrl ? { href: profile.websiteUrl, label: "Website", icon: Globe } : null,
    profile.email ? { href: `mailto:${profile.email}`, label: profile.email, icon: Mail } : null,
  ].filter((l): l is SocialDef => l !== null);

  if (links.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={link.label + link.href} className="flex items-center gap-2 text-sm">
          <link.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <a
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
            className="truncate text-link hover:underline"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
