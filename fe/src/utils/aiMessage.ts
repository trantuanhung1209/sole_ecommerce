/** Strip markdown image syntax; product thumbnails are rendered separately. */
export function formatAiAnswer(content: string): string {
  return content
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
