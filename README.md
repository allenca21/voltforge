# VoltForge

A field calculator for electricians. Load calcs, transformer wiring, conduit
bending, and the fraction math that comes with working in inches.

**[App Store](https://apps.apple.com/us/app/voltforge/id6762475628)** ·
[Google Play](https://play.google.com/store/apps/details?id=com.allenca21.voltforge)

---

## Why

An apprentice electrician in my family was doing conduit offset math on a phone
notepad, in a crawlspace, with gloves on. Every calculator app I looked at was
either a generic scientific calculator or a web page that assumed a desk and a
steady connection.

VoltForge is built for the actual conditions: one-handed, gloved, bad light,
no signal. Big targets, dark mode that works outdoors at dusk, everything
computed on device.

He has been the test user throughout, which is why the interaction design
changed more than the math did.

## What's in it

**Load Calculator** — NEC Article 220 service sizing. Demand factors applied by
load category, amps or watts input, single or three phase, and recommended
service size at 125%. Jobs are named and persist, so you can put one down and
come back to it. Nameplate photo capture for equipment you'd otherwise have to
write down and transcribe wrong.

**Transformer** — Seven wiring configurations with SVG diagrams, sized for
reading on a phone rather than shrunk from a print reference.

**Conduit Bending** — Offsets, saddles, and the geometry that goes with them.

**Pull Tension** — Segment-by-segment tension through a run.

**Fractions** — Inch fraction arithmetic, because the tape measure doesn't speak
decimals.

**NEC Reference** — Tables you'd otherwise be flipping to.

## Built with

- **React Native / Expo**, TypeScript
- **Stack navigation** off a home screen launchpad, with a responsive grid that
  goes two, three, or four columns by viewport
- **Themed styling** — `DARK` and `LIGHT` palettes in `theme.ts`, consumed
  through a store context, with a shared `makeStyles(C)` helper so every screen
  pulls the active palette rather than hardcoding
- **react-native-svg** for the wiring and bending diagrams
- **RevenueCat** for Pro entitlements, platform-aware so one `pro` entitlement
  covers both stores
- **EAS Build & Submit** for the pipeline

No account, no backend, no network dependency. Calculations run on device and
nothing leaves the phone. The camera is used only for nameplate photos, stored
locally.

## Structure

```
App.tsx                 Stack navigator and screen registry
src/screens/            One file per tool
src/theme.ts            DARK / LIGHT palettes
src/styles.ts           makeStyles(C) shared style factory
src/store.tsx           Theme and entitlement context
```

## Status

Live on the App Store and Google Play. Actively maintained.

Source is published for portfolio purposes.

---

© 2026 Clark Allen. All rights reserved.

This source is made publicly viewable to demonstrate my work. It is not licensed
for reuse, redistribution, or derivative works.

VoltForge is a calculation aid. It is not a substitute for the National
Electrical Code, local amendments, or a licensed electrician's judgment. Verify
against the current code before relying on any result.
