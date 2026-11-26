# System Design Notes

A free, static learning site for system design interview topics. SvelteKit (adapter-static), Tailwind, shadcn-svelte, mdsvex.

## Develop

Node 24+ (see `.node-version`) and pnpm.

```sh
pnpm install
pnpm dev            # local site
pnpm test           # content-check tests
pnpm check          # typecheck
pnpm build          # content check, then prerender to ./build
```

## Content

- `src/lib/outline.ts` is the single source of truth for sections, modules, titles and slugs.
- Each written module is `src/content/modules/<slug>.md`. Frontmatter holds `slug`, `title`, `section`, `readFirst` and `sources` (`id`, `title`, `url`, `license`, `use: copied | reworded | quoted`).
- Credit each copied, reworded or quoted passage with `<Src id="<source id>" />`.
- Every module needs `## What it is`, `## How it works`, `## Trade-offs` and `## Interview tips`.
- `pnpm build` runs `scripts/check-content.ts` first and fails on a missing section, source or license, a chip citing an undeclared source, or an unknown slug.

## Deploy (Cloudflare Workers static assets)

One-time setup by the maintainer:

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository**, and pick this GitHub repo.
2. Build settings:
   - Build command: `pnpm build`
   - Deploy command: `npx wrangler deploy` (reads `wrangler.jsonc`, which serves `./build`)
   - Root directory: `/`
3. Under **Variables**, set `NODE_VERSION` to `24` if the build image doesn't pick up `.node-version`.
4. Save and deploy. Every push to `main` now builds and deploys automatically.

Content is CC BY-SA 4.0. Passages from other sources are credited where they appear.
