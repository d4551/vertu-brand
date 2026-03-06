# UI/UX Audit — 2026-03-06

## Sources Used

- Context7: Elysia routing/static delivery guidance
- Context7: daisyUI button, drawer, join-group, and layout guidance
- Context7: HTMX history, swap, and progressive-enhancement guidance
- Repository runtime and build contracts in `src/` and `scripts/`

## System Trace

The guide now has a single SSR-first path from authoring source to runtime output:

1. `index.html` remains the authoring source for long-form guide content.
2. `src/shared/section-markup.ts` extracts and normalizes authoring sections into SSR-safe section markup.
3. `src/shared/i18n.ts`, `src/shared/config.ts`, `src/shared/shell-contract.ts`, `src/shared/social-toolkit.ts`, and `src/shared/template-catalog.ts` own shared copy, routes, DOM contracts, social query state, and template metadata.
4. `src/server/render/layout.ts` renders the SSR shell, page fragment, and full document from those shared contracts.
5. `src/server/app.ts` serves the SSR document, HTMX fragments, downloads, and social routes through Elysia.
6. `src/client/progressive-enhancements.ts`, `src/client/social-toolkit.ts`, and `src/client/logo-generator.ts` enhance the SSR markup without taking ownership away from the server.
7. `scripts/generate-templates.mjs` builds the PPTX and DOCX outputs from the shared template catalog.
8. `scripts/build-app.ts` now generates the downloadable HTML guide from the live SSR route instead of copying stale authoring markup into the public surface.

This removes the previous drift where the downloadable guide, the SSR shell, and the template metadata could disagree.

## Remediation Completed

### Navigation and Scroll

- Removed mixed query-plus-hash section navigation for guide links so one request maps to one canonical URL state.
- Stopped the post-swap forced section scrolling that was pulling the viewport away from the top of the newly rendered page.
- Added explicit top-of-page alignment when the requested section is the cover route.
- Replaced the sidebar dead-zone scroll compensation with section scroll margins that match the actual sticky header behavior.

### Sidebar Consistency

- Rebuilt theme and language controls as matching segmented button groups using the same layout contract and interaction model.
- Replaced variable-width flag-style language labels with compact text labels: `EN`, `中文`, and `EN / 中文`.
- Kept server ownership of control state through shared HTMX links and stable DOM/data contracts.

### Template and Download Architecture

- Moved guide template metadata into `src/shared/template-catalog.ts` as the single source of truth.
- Added `src/shared/template-markup.ts` so the downloads section and generated assets render from the same template definitions.
- Removed hardcoded release/version/contact literals from template generation and localized cover metadata.
- Changed the downloadable HTML build to render from the live SSR route, eliminating stale shell/layout drift.

### Accessibility and Progressive Enhancement

- Kept the mobile drawer operable from SSR markup through label-bound drawer controls.
- Preserved keyboard focus containment and focus return in the mobile drawer enhancement layer.
- Localized explicit accessible names for sidebar controls and interactive section affordances across supported languages.
- Preserved server-rendered fallback text for interactive controls before client enhancement attaches.

## Current Architecture Assessment

### Stronger Patterns Now In Use

- Elysia owns the full HTTP surface instead of loose scripts or parallel routing paths.
- HTMX navigation state is centralized through shared request headers, swap targets, and DOM ids.
- Template generation and UI presentation now consume the same typed metadata.
- The downloadable guide artifact is generated from the same SSR renderer used by the app.
- Shared constants in `src/shared/` now define the public contract for routes, downloads, shell ids, copy, and template metadata.

### Reliability Gains

- Fewer hardcoded literals across build, runtime, and UI paths.
- Lower risk of regression between SSR output and downloaded artifacts.
- Deterministic sidebar state and more stable top-of-page navigation behavior.
- Better test coverage for template metadata ownership, query-state navigation, accessibility labels, and downloadable artifact serving.

## Verification

Commands run after the refactor:

- `bun test`
- `bun run build`
- `bun run typecheck`

Result:

- `55` tests passing
- build completed successfully
- TypeScript typecheck completed successfully

## Remaining Audit Notes

No blocking UI/UX regressions remain from the issues addressed in this refactor set. Future iteration should focus on deeper content-surface optimization rather than shell correctness:

- Reduce first-load payload if the guide grows substantially beyond the current section set.
- Continue replacing authoring-only literals inside `index.html` with shared render helpers when a section becomes interactive or localized.
- Keep new downloadable assets on the shared template/catalog path instead of introducing asset-specific literals.
