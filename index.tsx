import type { GloomPlugin } from "gloomberb/types/plugin";

import { HackerNewsPane } from "./pane";
import { HACKERNEWS_PANE_ID, HACKERNEWS_PLUGIN_ID } from "./types";

/**
 * The reference Gloomberb plugin.
 *
 * It is deliberately small and uses only the public `gloomberb/*` API, so it is
 * the shortest path from "I want to add a pane" to something that runs. Copy
 * this repository, rename the ids, and replace `client.ts`.
 *
 * See https://github.com/gloom-sh/gloomberb/blob/main/PLUGINS.md for the full API.
 */
export const hackerNewsPlugin: GloomPlugin = {
  id: HACKERNEWS_PLUGIN_ID,
  name: "Hacker News",
  version: "0.1.0",
  description: "Hacker News front page, with Show, Ask, New, and Best",
  homepage: "https://github.com/gloom-sh/gloom-hackernews",
  toggleable: true,

  // Only public HTTPS reads, so this plugin runs on every renderer. A plugin
  // touching the filesystem or a socket would narrow this — see the IBKR
  // Gateway plugin, which is ["cli", "tui", "desktop"].
  targets: ["cli", "tui", "desktop", "web"],

  panes: [
    {
      id: HACKERNEWS_PANE_ID,
      name: "Hacker News",
      icon: "Y",
      component: HackerNewsPane,
      defaultPosition: "right",
      defaultMode: "floating",
      defaultFloatingSize: { width: 110, height: 34 },
    },
  ],

  // Pane templates make the pane reachable from the command bar. `HN` opens it.
  paneTemplates: [
    {
      id: "hackernews-pane",
      paneId: HACKERNEWS_PANE_ID,
      label: "Hacker News",
      description: "Browse the Hacker News front page — Top, New, Best, Show, and Ask — with scores, comment counts, and one-key article opening.",
      keywords: ["hacker", "news", "hn", "ycombinator", "tech"],
      shortcut: { prefix: "HN" },
      createInstance: () => ({ placement: "floating" }),
    },
  ],
};

export default hackerNewsPlugin;
