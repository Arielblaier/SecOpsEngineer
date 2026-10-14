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

## The `dev` branch: SecOps

`main` tells the story of Josh, the Security Analyst. `dev` adds a third mode
for SecOps, with the focus on detection engineering. It is the default mode on
this branch. The other two modes still work: switch from the demo menu (the
lightning icon) under "Agents".

The screens are about SecOps, not about an agent. One agent is in scope: the
Detection Engineer (rules, indicators, coverage). It owns every mission. Other
agents (the Investigation Agent, the Threat Hunter) only hand work over or
answer a question, and show up as a line in the mission's activity.

What the mode shows:

| Screen | What it is for |
|---|---|
| Home | The morning briefing. The chain from data source to rule, with the step where each problem starts |
| Missions | The queue, with filters (All, Pending, In progress, Done), search and live widgets. The table keeps its width and scrolls sideways |
| Activity log | A thin strip between the list and the panel. Click it (or press L) to open the live log |
| The panel | Half of the screen. Starts clean and ready to talk. The bell opens the decisions one card at a time, with Approve and Decline fixed at the bottom |
| Correlation Rules | The native table, plus two added columns: AI suggestion and Confidence. A suggested new rule has an Adopt button. A row opens in the panel |
| IOC Rules | The native table, plus the same two columns |
| Data Streams | Each pipeline as source, filter, parsing, data model, destination. A marker sits on the failing step |
| Data Sources & Integrations | The native table and its instance panel. Fixing an instance here closes the mission on its own |
| MITRE ATT&CK Coverage | The native dashboard, plus a layer that says whether the mapped detections can work: looks covered but cannot fire, no detection, coverage available, noisy |
| Insights | Value regained, and an ATT&CK status per technique instead of one percentage |

Each mission has one owner, the Detection Engineer. When a detection problem
starts in a part another team owns (a filter, a parsing rule, a data model, an
integration, a credential), it finds the cause and writes the fix, but does
not change that part. One approval sends the fix to the owning team. The
mission is Waiting until the team applies it, then the Detection Engineer
checks the detection and closes it on its own (MSN-1001, demo flow 9).

The tenant is sized like a real one: 62 data sources, about 100 instances and
about 150 correlation rules. The story rules are hand-written; the rest is
generated from a fixed seed in `60-maya-data.js`.

The AI suggestion is what is proposed: Fix, Tune, Adopt, Connect, Drop, Watch,
Hand over or Keep. Clicking a suggestion or a row on a native screen opens the
same mission card in the panel.

Moving between decisions: the arrows and dots at the top of the panel, the
left and right arrow keys, or "Later". A approves, D declines, Esc closes.

The screen is live. Three new triggers arrive one minute apart. Each one shows
the run step by step, then becomes a decision. Add `?live=10` to the address to
make them arrive every 10 seconds, or use "Send a new trigger now" in the demo
menu. The reset button in the left rail (or R) reloads the demo.

Where the code is (the file names keep the old `maya` prefix):

```
src/js/60-maya-data.js      The world: sources, pipelines, rules, indicators, tasks. The ONLY place numbers live
src/js/61-maya-core.js      State, navigation, the docked panel, return bar, live triggers
src/js/62-maya-task.js      The panel, the mission card, deciding, the prompt bar
src/js/63-maya-work.js      Missions screen, its widgets and the activity log
src/js/64-maya-home.js      Home and the scripted answers
src/js/65-maya-rules.js     Correlation Rules
src/js/66-maya-streams.js   Data Streams
src/js/67-maya-sources.js   Data Sources & Integrations
src/js/68-maya-insights.js  Insights
src/js/69-maya-iocs.js      IOC Rules
src/js/70-maya-mitre.js     MITRE ATT&CK Coverage
src/styles/16-maya.css      Styles for all of the above
```

Two rules for editing this mode:

**Numbers are computed, never typed.** Every count on every screen comes from
`myStats`, `myRuleReview`, `myIocReview` and the objects in `60-maya-data.js`.
A decision changes the world in one function, `myApply`, and every screen
redraws from it. If you add a number to a screen, derive it. Dates in the
story are counted back from the current time for the same reason.

**These files run after the original boot.** In this mode the original views
are hidden and the original simulation loop stays paused. The existing files
that were touched (`05`, `49`, `54`, `57`, and the loader timing in
`04-cortex-brand.css`) only add the mode switch, hand over to `mBoot()`, and
let the Cortex loader finish its animation.

Rule names, table columns and screen layouts follow the real product screens.
Volumes, people and failures are invented. The Data Streams screen follows a
design mockup, not a shipped screen.

## The `workspace` branch: aligned with the AgentiX Always On Experts brief

Branched from `dev`. Most of it is in `src/js/71-maya-workspace.js` and the
jobs and states at the end of `60-maya-data.js`, with edits in `61` to `68`
and `16-maya.css`. It follows the brief and the PRD of Oct 10.

**Job and mission.** A job is a predefined piece of work: a sweep, a change
check, a noise review, a review on request. Every run of a job is a mission,
also a run that finds nothing. Most of these runs belong to the Detection
Engineer's jobs (rule-health sweep, change checks, noise review). A run that finds nothing is Done, and its AI suggestion says Nothing
found. A mission has a shared part (job and version, objective, what it looked
at, result and confidence, findings, proposals with versions, decisions,
outcome, cost, feedback, activity) and a detection engineering part (card
type, root-cause layer, noise type, health, validation).

**States.** Needs you (a decision, or blocked), Running, Waiting (on the team
that owns the fix), Done. Done ends as changes applied, nothing found, partly
applied, declined (with a reason), handed over, cancelled, or closed because
the problem disappeared. The Missions screen opens on Needs you. Done shows
the end as a second line under the state.

**Decisions.** Decline asks why: wrong, not now (14 days), accepted risk (90
days), never. The reason shows on the rule and decides when the suggestion may
return; it comes back earlier only if the problem is materially worse
(MSN-1017). A mission with several findings has a decision per proposal
(MSN-1015). A change applies only to the version it expects; if part of it is
refused, the mission is Blocked (MSN-1005).

**Same object, many missions.** A mission reads the object's record when it
reaches it. Same problem: it adds evidence to the open mission (MSN-1015 and
MSN-1124 skip objects that others handle). Another change pending on the same
rule: both say so (MSN-1016 and MSN-1002). People edit or delete with a
warning; open proposals become out of date and are checked again, or cancelled.
The rule's record (open the rule with Edit or from its row) shows its version,
missions, pending changes and decisions.

**In a mission.** Steering belongs to the mission, not to the chat. The
mission card holds "Steering and activity": every decision, confirmed
steering line, handoff and the team applying a fix, shared with everyone in
the mission. The chat on the right is only your conversation with the owner
(no agent selector, no tags). The owner says how it treats each ask (question,
change, stop, outside the mission); a change is written to the mission's
steering only after you confirm it. Help from another agent shows as a
breadcrumb in the activity.

**Chats.** A general chat can switch agents, answer, and run a one-off action
with approval (no mission). A request that starts a job runs as a mission,
with its card anchored in the chat. "Review this rule now" starts a job too.

**Missions screen (product approval, Oct 15).** The app opens on Missions,
the detection engineer's home. The table has Run state and Needs you as two
columns (a finished run can still need a decision), then AI suggestion,
Mission, Confidence, Priority, Source, Age and Root cause. Filters for type
(job) and source sit next to the search; sort by impact (default), newest or
oldest. "Nothing found" runs end under Done.

**Panel.** Two sizes, switched by one button or `F`.
- Side panel: one column next to the screen, the mission and the chat
  stacked, Approve and Decline fixed at the bottom. Drag its left edge from
  30% to 70%; drag past 78% and release for the full view.
- Full view: replaces the table. The missions list on the left (same tabs as
  the table; it hides with its own button), the mission in the middle, the
  chat with the owner on the right. The agent is locked to the owner.
  - Drag the mission/chat divider left: the chat takes up to 90%, and the
    mission folds to a strip that only opens it back. The decision moves under
    the chat.
  - Drag the missions/AgentiX divider right: release under 78% and the
    Missions table comes back, with AgentiX as a side panel (from 30%).

**Mission card.** Header (job, ID, title, suggestion, confidence, result,
priority, summary); the pipeline strip with one mark per problem and the
diagnosis; the decision with the change next to what exists now (side by side
when the mission column is 42% or wider; XQL as code, settings as fields, a
new rule as code next to the coverage it fills); then the analysis folded (how
it got there, objects, cost, feedback) and the activity. "View the full …"
opens the object as its form (General, XQL Search, Issue Suppression, Action;
an environment fact as AgentiX memory), with the changed fields marked. Apply
writes it to the native table: Correlation Rules and IOC Rules show Modified
by (approver · via Detection Engineer · mission ID). A running or waiting
mission shows Now, Progress, Waiting on and Back to you.

**Artifacts.** A result in a chat worth seeing in full (a table, a mission
started from the chat) shows as a card in the chat. In full screen it opens
on the right, next to the chat. From the side panel there is no room, so
opening one switches to full screen with the artifact on the right.

**Demo flows.** A movable card (demo chrome, not product) runs 13 flows. Each
stresses one point: it says what to do and what to notice, ticks a step when
you do it, and "Show me" does it for you. `?flow=3` opens flow 3. The demo
menu reopens the card.

**Left for later:** private/public toggles, tagging, agent switching inside a
mission, the quick task-switch modal, customer-editable job policies, live
presence and real multi-user sync. Other people are scripted.

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
