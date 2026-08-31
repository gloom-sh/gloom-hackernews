# Hacker News for Gloomberb

The Hacker News front page as a Gloomberb pane. Top, New, Best, Show, and Ask, with scores, comment counts, and one-key article opening.

```bash
gloomberb install hackernews
```

Then press `HN` in the command bar.

## This is also the reference plugin

It is the smallest complete Gloomberb plugin: about 400 lines, no dependencies beyond the host, and it uses only the public `gloomberb/*` API. If you are writing your own plugin, start here rather than from scratch.

| File | What it shows |
|---|---|
| `index.tsx` | The whole plugin contract — id, metadata, `targets`, a pane, and a command-bar template |
| `client.ts` | Talking to a third-party API through `createThrottledFetch`, and normalizing its responses |
| `pane.tsx` | A table-plus-detail pane using shared components, pane-scoped state, and the pane footer |
| `client.test.ts` | Testing the part with real branching, and nothing else |

### Getting started

```bash
git clone https://github.com/gloom-sh/gloomberb-hackernews my-plugin
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

## Development

The `gloomberb` devDependency exists so this repo can typecheck against the real API. At runtime Gloomberb symlinks its own copy in, so plugins are installed with `--production` and never ship a second one.

## License

MIT
