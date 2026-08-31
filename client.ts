import { createThrottledFetch, decodeHtmlEntities, normalizedHttpUrl } from "gloomberb/utils";

import { HN_FEEDS, type HnFeedId, type HnStory } from "./types";

const BASE_URL = "https://hacker-news.firebaseio.com/v0";

/**
 * `createThrottledFetch` gives every plugin the same request discipline the rest
 * of Gloomberb uses: rate limiting, retries with backoff, timeouts, and GET
 * deduplication. It also defaults to the host's transport, which is what makes
 * a plugin work unchanged across the terminal, desktop, and browser renderers —
 * so plugins should not reach for global `fetch` directly.
 */
const hnFetch = createThrottledFetch({
  requestsPerMinute: 120,
  maxRetries: 2,
  timeoutMs: 10_000,
  backoffBaseMs: 400,
  dedupeGetRequests: true,
  defaultHeaders: { Accept: "application/json" },
});

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await hnFetch.fetch(`${BASE_URL}/${path}.json`, { signal });
  if (!response.ok) throw new Error(`Hacker News request failed (${response.status})`);
  return (await response.json()) as T;
}

/**
 * Hacker News returns raw item JSON with inconsistent optional fields: deleted
 * and dead items still appear in feed id lists, `descendants` is missing on
 * fresh posts, and Ask HN entries have no `url`. Normalizing here keeps every
 * one of those shapes out of the pane.
 */
export function normalizeStory(raw: unknown): HnStory | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  if (item.deleted === true || item.dead === true) return null;
  if (typeof item.id !== "number") return null;
  if (typeof item.title !== "string" || item.title.length === 0) return null;

  const url = typeof item.url === "string" ? normalizedHttpUrl(item.url) : null;

  return {
    id: item.id,
    title: decodeHtmlEntities(item.title),
    by: typeof item.by === "string" ? item.by : "unknown",
    time: typeof item.time === "number" ? item.time : 0,
    score: typeof item.score === "number" ? item.score : 0,
    comments: typeof item.descendants === "number" ? item.descendants : 0,
    ...(url ? { url, site: hostname(url) } : {}),
    ...(typeof item.text === "string" ? { text: decodeHtmlEntities(item.text) } : {}),
  };
}

function hostname(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function storyUrl(story: HnStory): string {
  return story.url ?? discussionUrl(story);
}

export function discussionUrl(story: HnStory): string {
  return `https://news.ycombinator.com/item?id=${story.id}`;
}

export async function loadFeed(feed: HnFeedId, limit: number, signal?: AbortSignal): Promise<HnStory[]> {
  const path = HN_FEEDS.find((entry) => entry.id === feed)?.path ?? "topstories";
  const ids = await getJson<number[]>(path, signal);

  // The API has no batch endpoint, so a feed page is one request per item. The
  // throttled client caps concurrency; slicing first keeps that bounded.
  const items = await Promise.all(
    ids.slice(0, limit).map(async (id) => {
      try {
        return normalizeStory(await getJson<unknown>(`item/${id}`, signal));
      } catch {
        // One dead item should not empty the pane.
        return null;
      }
    }),
  );

  return items.filter((story): story is HnStory => story !== null);
}
