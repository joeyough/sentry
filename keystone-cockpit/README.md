# Keystone Cockpit

Joey's personal cockpit for the Keystone CMMC Level 2 build. It is a small static app. It does not change the Sentry apps in the rest of this repo.

Facts follow Draft 0.15, wording commit `53026cbfd373`, branch `cursor/draft-0-15-dan-answers`. The private architecture repo was not readable from the build that wrote this app, so the page follows that update brief. Anything it does not settle is marked TBD.

## Run

```bash
cd keystone-cockpit
npm install
npm run dev
```

The dev server prints a local URL, usually `http://localhost:5173`.

```bash
npm run build
npm run preview
```

`npm run build` writes a static site to `keystone-cockpit/dist`.

Verify checkboxes and the Today build-sheet checks are saved in this browser's localStorage. A Today check is a working note. It does not mean the step is live in AWS.
