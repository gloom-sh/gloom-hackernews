# Hacker News for Gloom

The Hacker News front page as a Gloom pane. Top, New, Best, Show, and Ask, with scores, comment counts, and one-key article opening.

Requires Gloom 0.15.0 or later.

```bash
gloom install gloom-sh/gloom-hackernews
```

Then press `Ctrl+P`, type `HN` and press Enter.

## This is also the reference plugin

It is the smallest complete Gloom plugin: about 400 lines, no dependencies beyond the host, and it uses only the public `gloomberb/*` API. If you are writing your own plugin, start here rather than from scratch.

| File | What it shows |
|---|---|
| `index.tsx` | The whole plugin contract: id, metadata, `targets`, `hosts`, a pane, and a command-bar template |
| `types.ts` | The plugin and pane ids, the feed list, and the story shape the other files share |
| `client.ts` | Talking to a third-party API through `createThrottledFetch`, and normalizing its responses |
| `pane.tsx` | A table-plus-detail pane using shared components: title-bar tabs, a detail that opens on a `StatGrid`, pane-scoped state, and the pane footer |
| `client.test.ts` | Testing the part with real branching, and nothing else |
| `gloom.json` | The directory manifest: name, icon, `targets`, `hosts`, `linkHosts`, the pane it contributes, and `minGloom` |

### Getting started

With [Bun](https://bun.sh) and [Gloom](https://gloom.sh) installed:

```bash
git clone https://github.com/gloom-sh/gloom-hackernews my-plugin
cd my-plugin
bun install
bun test
bun run typecheck
gloom plugin link .             # Gloom loads this checkout
gloom plugin doctor my-plugin   # checks it the way the terminal, desktop and web will
```

Start Gloom, press `Ctrl+P`, type `HN` and press Enter.

Rename the ids in `types.ts` and `gloom.json`, point `client.ts` at your own API (and `hosts` at its host), and reshape `pane.tsx`. Gloom loads an edit when it restarts. Once it is on GitHub, anyone can install it:

```bash
gloom install your-github-user/my-plugin
```

### Things worth copying

**Import from `gloomberb/*`, never from a renderer.** `gloomberb/ui`, `gloomberb/components`, `gloomberb/react`, `gloomberb/theme`, and `gloomberb/utils` are the renderer contract. A plugin that imports OpenTUI, Electrobun, or DOM APIs directly stops working on the other two renderers.

**Declare `targets` honestly.** This plugin makes public HTTPS reads only, so it runs everywhere. Anything using Node builtins is not web-capable, and the registry verifies this with an import scan rather than trusting the declaration.

**Declare every host you fetch.** In `hosts`, in the plugin and in `gloom.json`: the web app proxies exactly the plugin's list, and the plugin directory shows gloom.json's. A page the pane only opens as a link goes in `linkHosts` in `gloom.json`.

**Use `createThrottledFetch`.** It provides rate limiting, retries, timeouts, and request deduplication, and it routes through the host's transport, which is what lets the same code run in the terminal and in the browser.

**Keep pane state in `usePluginPaneState`.** It is scoped per pane instance, so two copies of the pane in one layout stay independent and both survive a restart.

**Put status in the footer, not the body.** Only things that change (loading, error, staleness) belong there.

**Let the host draw the chrome.** `usePaneHeaderTabs` puts the feed strip in the desktop title bar and returns false in the terminal, where the pane draws its own `Tabs`. An open story starts on a `StatGrid` of its figures, because the stack bar already names it.

## Development

`gloomberb` and `react` are peer dependencies: Gloom serves its own copies to every plugin it loads, so there is exactly one instance of each in the process (two copies of React would throw on the first hook). `gloomberb` is also a devDependency, so `bun install` brings the latest release for the tests and the typecheck; `gloom install` leaves devDependencies out. CI runs the same `bun install`, `bun run typecheck` and `bun test`.

## License

MIT
