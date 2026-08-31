export const HACKERNEWS_PLUGIN_ID = "hackernews";
export const HACKERNEWS_PANE_ID = "hackernews";

/** The feeds the Hacker News API exposes as id lists. */
export const HN_FEEDS = [
  { id: "top", label: "Top", path: "topstories" },
  { id: "new", label: "New", path: "newstories" },
  { id: "best", label: "Best", path: "beststories" },
  { id: "show", label: "Show", path: "showstories" },
  { id: "ask", label: "Ask", path: "askstories" },
] as const;

export type HnFeedId = (typeof HN_FEEDS)[number]["id"];

export interface HnStory {
  id: number;
  title: string;
  by: string;
  /** Unix seconds, as the API returns it. */
  time: number;
  score: number;
  comments: number;
  /** Absent for Ask HN and other self posts. */
  url?: string;
  /** Hostname of `url`, precomputed for the table column. */
  site?: string;
  /** HTML body on self posts. */
  text?: string;
}
