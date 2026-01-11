# Project Instructions

## Workflow: Revising Note System

For every task requested by the user, the agent will follow this process:

1.  **Summarize Task**: Before starting, summarize the new requirements in the `00_Project Note/02_Revising note.md` file using a checkbox list.
2.  **Date Headers**: Use Date headers (e.g., `## 2026-01-10`) to organize notes.
3.  **Execute & Update**: As tasks are completed, mark the corresponding checkbox as checked (`[x]`).
4.  **Persistence**: This file serves as the primary history of all revisions. Always maintain the same format.

## Deployment Notes (Vercel + GitHub Pages redirect)

- Vercel deploys this project automatically when you push to GitHub (assuming the repo is connected in Vercel).
- GitHub Pages for this repo is only a redirect site (served from `docs/`) that forwards to the Vercel URL.
- If the Vercel URL ever changes, update it in `docs/index.html` and `docs/404.html`, then commit + push.
