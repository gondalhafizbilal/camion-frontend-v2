import dynamic from "next/dynamic";

const Story = dynamic(() => import("@/componentsedit/story"), {
  ssr: true,
});

/** Home stories: GraphQL `getStories` via `initialStories` (non-empty from page). */
export default function StoryServer({ initialStories }) {
  return <Story initialStories={initialStories} />;
}
