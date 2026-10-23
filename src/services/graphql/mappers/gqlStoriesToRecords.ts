import type { GqlStory } from "../types/story";
import type { StoryRecord } from "@/componentsedit/story/StoryViewerModal";

function sortedFrames(story: GqlStory) {
  return [...(story.frames ?? [])].sort(
    (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0),
  );
}

function durationSeconds(
  d: number | string | null | undefined,
): number | undefined {
  if (d == null || d === "") return undefined;
  const n = Number(d);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * One `StoryRecord` per story. Ring uses the first frame; modal plays all frames in order.
 */
export function gqlStoriesToStoryRecords(stories: GqlStory[]): StoryRecord[] {
  const out: StoryRecord[] = [];
  for (const s of stories) {
    const frames = sortedFrames(s).filter(
      (f) => Boolean((f.mediaUrl || f.thumbnailUrl)?.trim()),
    );
    const first = frames[0];
    const thumb = first?.thumbnailUrl || first?.mediaUrl || "";
    if (!thumb) continue;
    const primaryMedia = first?.mediaUrl || first?.thumbnailUrl || thumb;
    const frameRecords = frames.map((f) => ({
      uuid: f.uuid,
      mediaUrl: f.mediaUrl ?? undefined,
      thumbnailUrl: f.thumbnailUrl ?? undefined,
      mediaType: f.mediaType ?? undefined,
      durationSec: durationSeconds(f.duration),
    }));

    out.push({
      id: s.uuid,
      title: s.caption ?? "",
      name: s.caption ?? "",
      mediaUrl: primaryMedia,
      imageUrl: thumb,
      mediaType: first?.mediaType,
      frames: frameRecords,
      isHighlighted: Boolean(s.isHighlighted),
    });
  }
  return out;
}
