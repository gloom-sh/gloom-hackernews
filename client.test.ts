import { describe, expect, test } from "bun:test";

import { normalizeStory, storyUrl } from "./client";

/**
 * Only the normalizer is tested. It is the one place with real branching, and
 * every branch here corresponds to a shape the live API actually returns —
 * feed id lists include deleted and dead items, `descendants` is missing until
 * a post has replies, and Ask HN entries carry no `url`. Fetching and rendering
 * are covered by using the pane.
 */
describe("normalizeStory", () => {
  test("derives the display hostname from the story url", () => {
    const story = normalizeStory({
      id: 1,
      title: "A post",
      by: "pg",
      time: 1_700_000_000,
      score: 120,
      descendants: 40,
      url: "https://www.example.com/path?utm=1",
    });

    expect(story?.site).toBe("example.com");
    expect(storyUrl(story!)).toBe("https://www.example.com/path?utm=1");
  });

  test("falls back to the discussion url for self posts", () => {
    const story = normalizeStory({ id: 42, title: "Ask HN: anything?", by: "x", time: 1, score: 3 });

    expect(story?.url).toBeUndefined();
    expect(story?.site).toBeUndefined();
    expect(storyUrl(story!)).toBe("https://news.ycombinator.com/item?id=42");
  });

  test("drops deleted, dead, and untitled items that still appear in feed lists", () => {
    expect(normalizeStory({ id: 1, title: "gone", deleted: true })).toBeNull();
    expect(normalizeStory({ id: 2, title: "flagged", dead: true })).toBeNull();
    expect(normalizeStory({ id: 3 })).toBeNull();
    expect(normalizeStory(null)).toBeNull();
  });

  test("defaults the counters missing on fresh posts", () => {
    const story = normalizeStory({ id: 5, title: "New", by: "a", time: 10 });

    expect(story?.score).toBe(0);
    expect(story?.comments).toBe(0);
  });

  test("decodes the HTML entities the API leaves in titles", () => {
    const story = normalizeStory({ id: 6, title: "Rust &amp; C++ &lt;3", by: "a", time: 1, score: 1 });

    expect(story?.title).toBe("Rust & C++ <3");
  });
});
