import Image from "next/image";
import { parseCollaborator } from "@/lib/collaborators";

export function CollaboratorList({ collaborators }: { collaborators: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {collaborators.map((c) => {
        const parsed = parseCollaborator(c);
        return (
          <li key={c}>
            {parsed.kind === "github" ? (
              <a
                href={`https://github.com/${parsed.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 text-sm hover:bg-accent"
              >
                {/* Loaded straight from GitHub; unoptimized so it needs no remotePatterns entry. */}
                <Image
                  src={`https://github.com/${parsed.login}.png?size=48`}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="size-5 rounded-full bg-muted"
                />
                <span className="text-link">@{parsed.login}</span>
              </a>
            ) : (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm">{parsed.name}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
