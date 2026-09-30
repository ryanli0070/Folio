/**
 * Video src that makes browsers (notably Safari/iOS) paint the first frame before playback.
 * The media fragment seeks to 0.1s; with preload="metadata" only the first bytes are fetched.
 */
export function videoSrcWithPoster(url: string): string {
  return `${url}#t=0.1`;
}
