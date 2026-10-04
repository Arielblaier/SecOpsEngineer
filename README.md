# Cortex, Agentic Workforce (local project)

A local, offline, editable copy of the "Cortex, Agentic Workforce" concept demo.
It was taken from a published Claude artifact and split into source files.
The page itself is unchanged: the script, the styles and the markup are
byte-for-byte the same as the original once the files are joined.

It is a scripted simulation that runs entirely in the browser. There is no
backend, no database and no LLM call anywhere in the code.

## Quick start

You need Node.js 18 or newer.

```bash
npm install      # once
npm run dev      # http://localhost:5173, the page reloads when you save a file
npm run build    # writes dist/index.html, one self-contained file
```

`dist/index.html` works by double-click, with no server and no internet. That
single file is what you send to someone or present from.

## Where things are

```
src/
  index.html        Page skeleton. Lines with "@" are filled in by the build.
  partials/         The static markup, pasted into index.html as is.
    app.html          Nav rail, the five views (home, autonomous, cases, insights, anatomy)
    landing.html      The marketing-style landing page
    explore.html      "Design directions" overlay
    intro.html        Intro card
    overlays.html     Loader, tooltip, tour, shortcuts, toast
  styles/           The page's own CSS, joined in file-name order.
  js/               The app, 58 files, joined in file-name order into ONE script.
  tailwind.css      Tailwind entry file.
  fonts.css, fonts/ Lato and JetBrains Mono, local files.          (generated)
  vendor/           lucide 0.460.0 and three.js r128, local copies. (generated)
scripts/
  build.mjs         Dev server and single-file build. About 100 lines, no bundler.
  vendor.mjs        Copies fonts and libraries out of node_modules into src/.
tailwind.config.js  Same theme the original gave to the Tailwind CDN.
```

Rough map of `src/js/`:

| Files | What is in them |
|---|---|
| 00 to 08 | Utilities, threat library, case factories, agent avatars, state |
| 09 to 14 | Agent log, the simulation loop, actions, KPIs, decision visuals |
| 15 to 22 | Hero cases, investigation model, evidence, timeline, queues, attack graph, hover cards |
| 23 | Landing page |
| 24 to 32 | Design explorations ("design decisions" v1 to v8). About 260 KB, a third of the code |
| 33 | Anatomy tutorial page |
| 34 to 37 | Case page: investigation, action plan, docked agent, brief |
| 38 to 44 | Case tables, copilot, catch-up, insights |
| 45 to 48 | Workforce graph, hero core, home thread, approval card |
| 49 to 57 | Nav and theme, case drawer, 3D entity, tour, intro, startup |

## Three rules to know before you edit

**1. File order is load order.** The original was one `<script>`. All 58 files
are joined by file name into one script again, so everything is still global:
any file can call any function, and `onclick="navigateTo('home')"` in the markup
works because `navigateTo` is a global. The number prefix decides the order.
To add a file, give it a number that puts it where it needs to run. Do not add
`import` or `export`, they do not work in a classic script.

**2. Tailwind only keeps classes it can see as plain text.** The original
loaded Tailwind in the browser, which could style any class at any time. Here
Tailwind is compiled ahead of time by scanning `src/`. Write `'bg-rose-500'`
in full and it works. Build it from pieces, like `'bg-' + color + '-500'`, and
that style silently goes missing. If you need that, add the full names to
`safelist` in `tailwind.config.js`.

**3. The design exploration files are layered.** Files 26 to 31 patch
functions from the earlier versions (`const _dxP0 = dxP; dxP = ...`), 17 such
patches in total. Changing one version can change the later ones. If you want
to keep working on that area, flatten it into one version first.

## Branching

This folder is a git repository with one commit, the untouched split of the
original. Suggested use:

```bash
git checkout -b my-variant     # try something
npm run build                  # dist/index.html is that variant, ready to share
git checkout main              # back to the original
```

`dist/` is not tracked. Rename the built file per variant if you want to keep
several side by side.

## Changing a library or font

Edit the version in `package.json`, run `npm install`, then `npm run vendor`.
That refreshes `src/vendor/`, `src/fonts/` and `src/fonts.css`, which are
tracked in git so the project still runs without internet.

## What was checked, and what was not

Checked on the single-file build, with all network access blocked:

- No request leaves the page. No console errors.
- All five views, the landing page, the explorations overlay, the case
  drawer, catch-up, the tour, dark and light theme, and a phone-sized screen.
- Every class name that appeared in the page during that walk is covered by
  the compiled Tailwind CSS (878 class names, 0 missing).
- All three "core style" options, including the three.js one.
- The joined script, styles and markup are identical to the original.

Not checked:

- A pixel comparison against the live original. The original needs the
  Tailwind CDN, which was not reachable from the build environment.
- Every single click path. The demo has several hundred handlers. A rarely
  used panel could still hit rule 2 above. If something looks unstyled, that
  is the first thing to check.
