# PC Assembly Lab

Interactive 3D PC-building tutorial (MSI B450 Gaming Plus Max, Ryzen 5 5600G). Plain HTML + three.js r147, no build step. All libraries and fonts are local in `vendor/`, so it runs offline. Open `index.html` directly in a browser.

## How the code is wired
- Every file in `js/` is a **classic `<script>`** (not an ES module), loaded in the order listed in `index.html`. They all share one global scope: a `const`/`let`/`function` declared in one file is visible in every later file.
- **Load order matters.** Top-level code may only use things from files loaded *before* it. Code that runs inside functions later on (event handlers, the render loop) can use anything.
- New file: add a `<script src>` tag to `index.html` in the right position.
- Don't convert these to `import`/`export`. ES modules fail when the page is opened via `file://`.
- `PC Assembly Lab_ B450 Gaming Plus Max build.html` is the original single-file version, kept as a backup. Edit the split files, not that one.

## Steps
- Steps are named, not numbered: `STEP_IDS` in `state.js` is the order, and code uses `ST.<id>` (e.g. `S.step===ST.gpu`). Never hard-code a step number.
- Step text is `s_<id>` / `s_<id>d` in `I18N.en` and `I18N.ar`.
- A new step needs: an id in `STEP_IDS`, its text in both languages, a `viewFor` case if it needs its own camera, and a `finishStep` entry in `skip.js`.

## File map
- `css/style.css`: all styling
- `vendor/`: three.js r147 + OrbitControls, JSZip 3.10.1, and the fonts (`vendor/fonts/fonts.css` + woff2, latin and arabic subsets). Don't link CDNs again: the page must work offline.
- `themes/real-parts.zip`: built-in photo theme 1, loaded by default (photos named after `PHOTO_SLOTS`, plus `theme.json` and `CREDITS.txt`). Theme 2 is `themes/theme2.zip`. The list is `BUILTIN_THEMES` in `photos.js`.
- `themes/<name>.zip.js`: the same zip as base64, for when the page is opened from a file (`fetch()` is blocked on `file://`). Regenerate it whenever a theme zip changes:
  `python -c "import base64,sys;f=sys.argv[1];open(f+'.js','w').write('(window.THEME_ZIPS=window.THEME_ZIPS||{})[\"'+f.split('/')[-1]+'\"]=\"'+base64.b64encode(open(f,'rb').read()).decode()+'\";\n')" themes/theme2.zip`
- `js/core/`
  - `config.js`: `PHOTO_URLS`
  - `i18n.js`: all UI text, English and Arabic (`I18N.en` / `I18N.ar`), plus `t()`
  - `helpers.js`: rng, canvas textures, tweens (`tween`, `animTo`)
  - `layout.js`: board dimensions, socket and DIMM positions
  - `textures.js`: generated canvas textures
  - `scene.js`: renderer, camera, `VIEWS`, `focus()`, lights, `mesh()`
- `js/parts/desk.js` (loaded right after scene.js): the dark desk, its RGB edge strip, and the parts mat (`PARTS_MAT`) where table.js lays the parts
- `js/parts/`: one 3D part per file, in the order the parts are built
  - motherboard, rear-io, board-headers, socket, dimm-slots, pcie-latch
  - cpu, ram, fan-headers, thermal-paste, cooler
  - cables, m2-ssd (the socket hides the SSD's gold fingers; the removed screw lies on the parts mat at `M2_TABLE`), cmos-battery, case (white), side-panel, case-fans (red LED rear fan, `updateCaseRgb`: lit only when powered and SYS_FAN1 is plugged in), psu, gpu, wifi-card
  - sata-connectors, sata-ssd, connector-cables, front-panel (power button lead, front USB lead to JUSB3, the USB stick used in troubleshooting), peripherals (keyboard, Razer Viper-style white mouse (`updateMouseLed`: green status LED, lit only when powered), monitor, rear port targets), power-strip (EU 4-socket strip on the desk: the PC power cord `CONN.ac` starts there; the monitor's power cable is plugged in at both ends)
  - cable tubes go through `cableGeo` (connector-cables.js), which keeps them above the case floor / desk
- `js/game/`
  - `state.js`: step order (`STEP_IDS`, `ST`, `STEPS`, `viewFor`, `setStep`), state `S`, `HELD`. Per-step mistakes/time (`S.stepMis`, `S.stepMs`, `stepMark`): the sidebar circle turns orange after 3 mistakes in a step, red after 60 s
  - `take-parts.js`: picking parts up from the tray (`takeCPU`, `takeRAM`, …)
  - `actions.js`: lever, slot, bracket and screw clicks, plus `rotate`/`flip`/`seat`
  - `drop.js`: placement rules per part (`drop()`), `finish`, `persist`
  - `connectors.js`: the SATA / 24-pin / CPU-power plug steps. SATA and peripheral plugs: click the plug, then click the port (`SPORTS` in connector-cables.js for SATA, `RPORTS` in peripherals.js for the rear ports)
  - `key-view.js`: small window that shows how a held keyed part lines up (SATA plug vs port L, USB-A insert vs port tongue, RAM notch vs slot key)
  - `paste.js`: thermal-paste animation
  - `power.js`: last step: power button, fans/keyboard lights on, monitor No signal → MSI logo → BIOS, then the spinning fans (`clickPowerBtn`, `powerOnNow`)
  - `skip.js`: hold Ctrl+H to skip a step (`finishStep`, `skipStep`)
  - `photos.js`: user photo textures and .zip photo themes (`PHOTO_SLOTS`, `loadTheme`, kept in IndexedDB; zip via JSZip from CDN)
  - `input.js`: raycast picking and dragging
  - `ui.js`: sidebar, tray, buttons, keyboard, full screen (⛶ in the view: `body.fs` hides header and sidebar, `#fsBar` shows the step, ☰ opens the sidebar as an overlay `body.fs-open`, just below the bar; the button turns into a red × while it's open). Step pop-up (`showStepCard`): on phones and in full screen each new step's instructions open in a card with OK; tapping the step name in `#fsBar` reopens it; Settings switch `S.card`. On phones (≤860px) settings.js moves the brightness/theme controls into the ⚙ menu
  - `hints.js`: help: pointer arrow (always on the socket lever), first-part coach card (lever + CPU flip/rotate/drag/lower), Hint button (5 per build, H key; points at the next target, demos the move with a held part then puts it back)
  - `quiz.js`: part quiz: the first time a part is taken, a card asks what it does (3 answers, shuffled). Wrong = mistake + page shake and red flash (`shakeRed`). Each take function calls `quizOk(id, retry)` after `gate()`. Text `q_<id>` (name), `q_<id>_a` (right), `_b`/`_c`. Off via Settings (`S.quiz`, persisted) and in troubleshooting mode. A new takeable part can get a quiz by adding the text and a `quizOk` call
  - `trouble.js`: troubleshooting mode (header button, remembered in sessionStorage as `mode`): starts fully built with one fault. `TS_CASES` is the numbered case list ([symptom, fault]); `TS_SYMPTOMS` is each symptom's checklist; `TS_CHECKS` has each check's camera, fault and fix. Solved cases are kept in sessionStorage (`tsDone`); a case always starts from a fresh page load (`tsGo` sets `tsNext` and reloads). New case: add it to `TS_CASES`, give the fault a `TS_CHECKS` entry with `fault`/`fix`, and add `ts_c_`/`ts_l_`/`ts_w_`/`ts_fix_` text. Text is `ts_*` in i18n. The side panel stays off in this mode. CMOS case: battery-level badges (`batLow`/`batFull`), and the fix swaps the cell via the parts mat (`tsSwapBattery`).
  - `offline.js`: the "Download offline" header button: zips the page and every local file it loads (read from the page's own tags, plus fonts and theme zips)
  - `table.js`: parts waiting on the desk (`TABLE_ITEMS`: clones of the real parts). Click → pops up and spins with a name tag, then calls the take function with `S.fromTable` set so `spawn`/`takeCPU` fly the real part in from there. With the parts bar off, the camera glides to `VIEWS.table` when a step needs a part. A new takeable part needs a `TABLE_ITEMS` entry
  - `settings.js`: header ⚙ menu: parts bar (`S.tray`, off by default; `body.no-tray`) and RGB lights (`S.rgb`), both saved by `persist`
  - `loop.js`: render loop, glow hints, startup (`applyLang(); setStep(0)`)
