# Birthday Scrapbook

A romantic, interactive birthday scrapbook for sharing photos, videos, music, and a personal message.

## Run & Operate

- The Birthday Scrapbook preview runs through the managed web workflow.
- `pnpm --filter @workspace/birthday-scrapbook run dev` — run the Vite development server (requires `PORT` and `BASE_PATH`, provided by the managed workflow).
- `pnpm --filter @workspace/birthday-scrapbook run build` — build the scrapbook, including the standalone `birthday-scrapbook.html` page.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, React, TypeScript, and Vite
- Express 5 API and shared PostgreSQL/Drizzle packages are also present in the workspace.

## Where things live

- `artifacts/birthday-scrapbook/src/` — React scrapbook.
- `artifacts/birthday-scrapbook/birthday-scrapbook.html` — standalone scrapbook page, also included in the Vite build.
- `artifacts/birthday-scrapbook/public/content.json` — editable scrapbook copy and featured image references.
- `artifacts/birthday-scrapbook/public/` — photos, videos, music, and generated media manifests.
- `artifacts/birthday-scrapbook/vite.config.ts` — Vite setup and automatic public media manifests.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
