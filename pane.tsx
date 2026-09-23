import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DataTableStackView,
  EmptyState,
  Notice,
  PaneStatusBody,
  Prose,
  SectionHeading,
  Tabs,
  useExternalLinkFooter,
  usePaneHeaderTabs,
  type DataTableCell,
  type DataTableColumn,
  type PaneFooterSegment,
} from "gloomberb/components";
import { usePluginPaneState } from "gloomberb/react";
import { colors } from "gloomberb/theme";
import type { PaneProps } from "gloomberb/types/plugin";
import { Box, ScrollBox } from "gloomberb/ui";
import { formatCompact, formatRelativeAge } from "gloomberb/utils";

import { discussionUrl, loadFeed, storyUrl } from "./client";
import { HACKERNEWS_PANE_ID, HN_FEEDS, type HnFeedId, type HnStory } from "./types";

const PAGE_SIZE = 50;
const REFRESH_MS = 5 * 60_000;
const FEED_TABS = HN_FEEDS.map((entry) => ({ label: entry.label, value: entry.id as string }));

type Column = DataTableColumn & { id: "score" | "title" | "site" | "comments" | "age" };

function buildColumns(width: number): Column[] {
  const scoreWidth = 5;
  const commentsWidth = 5;
  const ageWidth = 6;
  // Site gets a fixed slice; the title absorbs whatever the pane has left, so
  // the table stays readable from a narrow split up to a full-width window.
  const siteWidth = width > 90 ? 22 : 0;
  const titleWidth = Math.max(20, width - scoreWidth - commentsWidth - ageWidth - siteWidth - 8);

  const columns: Column[] = [
    { id: "score", label: "PTS", width: scoreWidth, align: "right" },
    { id: "title", label: "TITLE", width: titleWidth, align: "left" },
  ];
  if (siteWidth > 0) columns.push({ id: "site", label: "SITE", width: siteWidth, align: "left" });
  columns.push(
    { id: "comments", label: "CMT", width: commentsWidth, align: "right" },
    { id: "age", label: "AGE", width: ageWidth, align: "right" },
  );
  return columns;
}

function renderCell(story: HnStory, column: Column, rowState: { selected: boolean }): DataTableCell {
  const selected = rowState.selected ? colors.selectedText : undefined;

  switch (column.id) {
    case "score":
      return {
        text: story.score > 0 ? formatCompact(story.score) : "—",
        // Front-page threshold; enough of a signal to scan for without a legend.
        color: selected ?? (story.score >= 100 ? colors.positive : colors.textDim),
      };
    case "title":
      return { text: story.title, color: selected ?? colors.text };
    case "site":
      return { text: story.site ?? "news.ycombinator.com", color: selected ?? colors.textDim };
    case "comments":
      return {
        text: story.comments > 0 ? formatCompact(story.comments) : "—",
        color: selected ?? colors.textDim,
      };
    case "age":
      return {
        text: story.time > 0 ? formatRelativeAge(story.time * 1000) : "—",
        color: selected ?? colors.textDim,
      };
  }
}

function StoryDetail({ story, width }: { story: HnStory; width: number }) {
  return (
    <ScrollBox scrollY focusable={false} flexGrow={1} flexShrink={1} flexDirection="column" width={width} paddingLeft={1} paddingRight={1}>
      <Notice tone="muted">{[
        `${story.score} points`, `by ${story.by}`,
        story.time > 0 ? formatRelativeAge(story.time * 1000) : null,
        `${story.comments} comments`,
      ].filter(Boolean).join("  ·  ")}</Notice>
      {story.site ? <SectionHeading title={story.site} /> : null}
      {story.text ? (
        <Box flexDirection="column" paddingTop={1}>
          <Prose text={stripHtml(story.text)} width={Math.max(1, width - 2)} />
        </Box>
      ) : (
        <Box paddingTop={1}>
          <EmptyState title="No text body." hint="Press o to open the article." />
        </Box>
      )}
    </ScrollBox>
  );
}

/** Ask HN bodies are HTML fragments; the terminal renderer wants plain text. */
function stripHtml(html: string): string {
  return html
    .replace(/<p>/g, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function HackerNewsPane({ focused, width, height }: PaneProps) {
  // `usePluginPaneState` persists per pane instance, so two Hacker News panes in
  // one layout keep independent feeds and both survive a restart.
  const [feed, setFeed] = usePluginPaneState<HnFeedId>("feed", "top");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Hacker News feeds arrive already ranked, so the default is no client sort.
  const [sortColumn, setSortColumn] = useState<"score" | "comments" | "age" | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [stories, setStories] = useState<HnStory[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setStatus((current) => (current === "ready" ? current : "loading"));
    loadFeed(feed, PAGE_SIZE, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setStories(next);
        setStatus("ready");
        setFetchedAt(Date.now());
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setStatus("error");
      });
  }, [feed]);

  useEffect(() => {
    setStories([]);
    setStatus("loading");
    refresh();
    return () => requestRef.current?.abort();
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const rows = useMemo(() => {
    if (sortColumn === "score") return [...stories].sort((a, b) => b.score - a.score);
    if (sortColumn === "comments") return [...stories].sort((a, b) => b.comments - a.comments);
    if (sortColumn === "age") return [...stories].sort((a, b) => b.time - a.time);
    return stories;
  }, [sortColumn, stories]);

  const selected = useMemo(
    () => rows.find((story) => story.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  const info: PaneFooterSegment[] = [];
  if (status === "loading") info.push({ id: "loading", parts: [{ text: "loading", tone: "muted" }] });
  if (status === "error") info.push({ id: "error", parts: [{ text: "error", tone: "warning" }] });
  if (status === "ready" && fetchedAt) {
    info.push({ id: "updated", parts: [{ text: formatRelativeAge(fetchedAt), tone: "muted" }] });
  }

  // Adds the "o — open" hint and the o shortcut, and renders the link source in
  // the pane footer, the same way every other Gloomberb pane with an external
  // link does.
  useExternalLinkFooter({
    registrationId: HACKERNEWS_PANE_ID,
    focused,
    url: selected ? (detailOpen ? discussionUrl(selected) : storyUrl(selected)) : null,
    source: selected ? (detailOpen ? "news.ycombinator.com" : selected.site ?? "news.ycombinator.com") : null,
    info,
  });

  const columns = useMemo(() => buildColumns(width), [width]);

  const selectFeed = useCallback((value: string) => {
    setFeed(value as HnFeedId);
    setDetailOpen(false);
  }, [setFeed]);

  // The pane's only partition, so the desktop draws it in the title bar and the
  // table keeps the row the strip used to take.
  const tabsInHeader = usePaneHeaderTabs({
    tabs: FEED_TABS,
    activeValue: feed,
    onSelect: selectFeed,
    focused: focused && !detailOpen,
  });

  const tabs = tabsInHeader ? null : (
    <Tabs
      tabs={FEED_TABS}
      activeValue={feed}
      onSelect={selectFeed}
      focused={focused && !detailOpen}
      variant="underline"
      dense
    />
  );

  return (
    <Box flexDirection="column" width={width} height={height}>
      {tabs}
      <PaneStatusBody
        align="center"
        loading={status === "loading" && stories.length === 0}
        error={status === "error" && stories.length === 0 ? "Retries automatically." : null}
        errorTitle="Hacker News is unreachable."
      >
      <DataTableStackView<HnStory, Column>
        focused={focused}
        detailOpen={detailOpen && !!selected}
        onBack={() => setDetailOpen(false)}
        detailContent={selected ? <StoryDetail story={selected} width={width} /> : null}
        detailTitle={selected?.title}
        selection={{
          kind: "id",
          selectedId: selected ? String(selected.id) : null,
          getId: (story) => String(story.id),
          onChange: (id) => setSelectedId(id === null ? null : Number(id)),
        }}
        onActivate={() => setDetailOpen(true)}
        rootWidth={width}
        rootHeight={Math.max(1, height - (tabsInHeader ? 0 : 1))}
        columns={columns}
        items={rows}
        getItemKey={(story) => String(story.id)}
        sortColumnId={sortColumn}
        sortDirection="desc"
        onHeaderClick={(columnId) => {
          if (columnId === "score" || columnId === "comments" || columnId === "age") {
            setSortColumn((current) => (current === columnId ? null : columnId));
          }
        }}
        renderCell={(story, column, _index, rowState) => renderCell(story, column, rowState)}
        emptyStateTitle="No stories."
      />
      </PaneStatusBody>
    </Box>
  );
}
