## Project overview

- Next.js/Fumadocs frontend for HOA project.
- Use `pnpm` for Node commands.

## Branch workflow

- Commit general changes to `main`.
- Commit static-only changes to `static-main`.
- After `origin/main` changes, rebase `static-main` onto the latest `origin/main`.
- If the target branch is unclear, ask the user where to commit. When rewriting remote history, use only `--force-with-lease`; never use `--force`.

## Setup and development

- Install dependencies and local tools/data: `make prepare`
- Fetch content: `make content`
- Start dev server: `make dev`
- Clean generated local state: `make clean`

`make prepare` downloads frontend data into `lib/data/` and installs `hoa-backend` into `.tools/bin/`; it must not install Cargo packages or write to global user bins.

## Checks

Before finishing changes, run:

```bash
make check
```
