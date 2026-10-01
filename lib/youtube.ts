/** Extracts the 11-char video id from common YouTube URL shapes, or null. */
export function youTubeVideoId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = /^\/(?:shorts|embed|live|v)\/([^/?#]+)/.exec(u.pathname);
      id = m?.[1] ?? null;
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** YouTube's thumbnail for a video. `hqdefault` exists for every video (maxres doesn't). */
export function youTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Privacy-enhanced embed URL (no tracking cookies until the viewer presses play). */
export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/** Unique YouTube video ids among `urls`, in order. */
export function youTubeIdsFromUrls(urls: string[]): string[] {
  const ids = urls.map(youTubeVideoId).filter((id): id is string => id !== null);
  return [...new Set(ids)];
}
