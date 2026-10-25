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

## Course identity and grades

- Curriculum routes, displayed course codes, metadata and teaching-system introductions use the original plan `course_code`.
- `lookup_table.toml` selects only the resource repository. Read `course.repoId` for GitHub links and commit queries; only legacy generated pages fall back to the route segment.
- Curriculum grading comes exclusively from that plan course's `grade_details`. Do not fill it from `grades_summary.json`; missing or empty details mean no grading information. See `skills/hoahrb-contribute/references/grades.md` for contribution instructions.

## Checks

Before finishing changes, run:

```bash
make check
```
