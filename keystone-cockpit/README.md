# Keystone Cockpit

Joey's personal cockpit for the Keystone CMMC Level 2 build. It is a small static app. It does not change the Sentry apps in the rest of this repo.

Facts come from Draft 0.14 (October 19, 2026, commit `59adc0d2e405`) and from Dan Hardison's email on October 20, 2026. Anything those sources do not settle is marked TBD.

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

Verify checkboxes are saved in this browser's localStorage. The Today list resets on the next calendar day.
