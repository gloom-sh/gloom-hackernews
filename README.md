# Hacker News for Gloomberb

The Hacker News front page as a Gloomberb pane. Top, New, Best, Show, and Ask, with scores, comment counts, and one-key article opening.

Requires Gloomberb 0.15.0 or later for title-bar tabs ([Gloomberb #1038](https://github.com/gloom-sh/gloomberb/pull/1038)) and `StatGrid` ([Gloomberb #1091](https://github.com/gloom-sh/gloomberb/pull/1091)); 0.14.1 provides neither.

```bash
gloomberb install gloom-sh/gloom-hackernews
```

Then press `HN` in the command bar.

## This is also the reference plugin

It is the smallest complete Gloomberb plugin: about 400 lines, no dependencies beyond the host, and it uses only the public `gloomberb/*` API. If you are writing your own plugin, start here rather than from scratch.

| File | What it shows |
|---|---|
| `index.tsx` | The whole plugin contract — id, metadata, `targets`, a pane, and a command-bar template |
| `types.ts` | The plugin and pane ids, the feed list, and the story shape the other files share |
| `client.ts` | Talking to a third-party API through `createThrottledFetch`, and normalizing its responses |
| `pane.tsx` | A table-plus-detail pane using shared components: title-bar tabs, a detail that opens on a `StatGrid`, pane-scoped state, and the pane footer |
| `client.test.ts` | Testing the part with real branching, and nothing else |
| `gloom.json` | The directory manifest: name, icon, `targets`, `hosts`, the pane it contributes, and `minGloom` |

### Getting started

```bash
git clone https://github.com/gloom-sh/gloom-hackernews my-plugin
cd my-plugin
bun install
bun test
bun run typecheck
```

Rename the ids in `types.ts`, point `client.ts` at your own API, and reshape `pane.tsx`. Then:

```bash
gloomberb install your-github-user/my-plugin
```

### Things worth copying

**Import from `gloomberb/*`, never from a renderer.** `gloomberb/ui`, `gloomberb/components`, `gloomberb/react`, `gloomberb/theme`, and `gloomberb/utils` are the renderer contract. A plugin that imports OpenTUI, Electrobun, or DOM APIs directly stops working on the other two renderers.

**Declare `targets` honestly.** This plugin makes public HTTPS reads only, so it runs everywhere. Anything using Node builtins is not web-capable, and the registry verifies this with an import scan rather than trusting the declaration.

**Use `createThrottledFetch`.** It provides rate limiting, retries, timeouts, and request deduplication, and it routes through the host's transport — which is what lets the same code run in the terminal and in the browser.

**Keep pane state in `usePluginPaneState`.** It is scoped per pane instance, so two copies of the pane in one layout stay independent and both survive a restart.

**Put status in the footer, not the body.** Only things that change — loading, error, staleness — belong there.

**Let the host draw the chrome.** `usePaneHeaderTabs` puts the feed strip in the desktop title bar and returns false in the terminal, where the pane draws its own `Tabs`. An open story starts on a `StatGrid` of its figures, because the stack bar already names it.

## Development

`gloomberb` and `react` are peer dependencies, never real ones. Gloomberb symlinks its own copies into every plugin directory on install and on load, so there is exactly one instance of each in the process — two copies of React would throw on the first hook. CI links the host the same way, which is why it typechecks against the same module graph that runs in production.

```bash
git clone --depth 1 https://github.com/gloom-sh/gloomberb.git /tmp/gloomberb
bun install --cwd /tmp/gloomberb
ln -sfn /tmp/gloomberb node_modules/gloomberb
ln -sfn /tmp/gloomberb/node_modules/react node_modules/react
```

## License

MIT
