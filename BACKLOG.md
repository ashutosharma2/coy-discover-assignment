# Backlog (ideas parked so they don't hijack a session)

<!-- - [ ] One idea per line. Tick it when done. -->

- [ ] Run the tests on Node 22.13 and Node 24. Everything so far ran on Node 26.10.0 only, and `package.json` asks for 22.13 or newer from the docs ([ADR-003](docs/adr/003-sqlite-with-node-sqlite.md)).
- [ ] Check how smoothly the owl runs and how much battery it uses on a real phone ([ADR-012](docs/adr/012-owl-in-one-room.md)).
- [ ] Try the drag on a real phone. So far it has been tested with a mouse in a phone-sized browser window ([ADR-008](docs/adr/008-motion-for-the-drag.md)).
- [ ] Write down the reason for choosing Motion over hand-written Pointer Events ([ADR-008](docs/adr/008-motion-for-the-drag.md)).
- [ ] Write down the reason for rejecting pass-then-like. It leaks nothing, so the reason isn't privacy ([ADR-002](docs/adr/002-swipes-are-final.md)).
- [ ] List what a real deployment would need and this app doesn't have in the README: sign-in, per-user sessions, rate limiting ([ADR-001](docs/adr/001-server-decides-matches.md)).
- [ ] `create-next-app` 16.4.6 installs ESLint 9, which npm now reports as no longer supported. Move to a supported ESLint once `eslint-config-next` allows it.
