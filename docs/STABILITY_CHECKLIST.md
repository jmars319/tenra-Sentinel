# Sentinel Stability Checklist

- `pnpm install` completes from the repo root.
- Workspace imports resolve across apps and packages.
- `pnpm run lint` passes.
- `pnpm run typecheck` passes.
- `pnpm run verify:web` builds the Next.js web app.
- `pnpm run verify:desktop` builds the Vite desktop UI and checks the Rust/Tauri side when cargo is available.
- `pnpm run verify:mobile` exports the Expo app bundle.
- `pnpm run verify:all` completes without local workspace errors.
- `pnpm run doctor` reports a healthy environment and repo surface.
