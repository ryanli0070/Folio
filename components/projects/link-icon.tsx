import { Globe, PlayCircle, Terminal, Trophy, type LucideIcon } from "lucide-react";

/**
 * Auto-detects a generic (non-branded) icon for a project link based on hostname.
 * No GitHub/Devpost/YouTube logos — generic lucide icons only.
 */
export function getLinkIcon(url: string): LucideIcon {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return Globe;
  }

  if (hostname === "github.com" || hostname.endsWith(".github.com")) return Terminal;
  if (hostname === "devpost.com" || hostname.endsWith(".devpost.com")) return Trophy;
  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be") return PlayCircle;
  return Globe;
}
