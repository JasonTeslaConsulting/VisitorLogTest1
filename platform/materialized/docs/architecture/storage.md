# Storage (not built yet — conventions for when it's added)

There is no storage/file-upload service yet. If a project needs one:

- Private buckets only — no public URLs.
- Route all calls through a `src/services/storageService.ts` (create it), expose signed URLs via
  a `useSignedUrl()` hook.
- Bucket names go in `src/lib/constants/storage.ts` as a `BUCKETS` constant (create the file).

Nothing to reuse today — this file is the canonical home for the convention. Don't duplicate it
elsewhere (see `.claude/rules/architecture-rules.md`, which points here instead of repeating it).
