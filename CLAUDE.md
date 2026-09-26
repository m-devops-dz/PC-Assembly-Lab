# PC Assembly Lab

Interactive 3D PC-building tutorial (MSI B450 Gaming Plus Max, Ryzen 5 5600G). Plain HTML + three.js r147 from CDN, no build step. Open `index.html` directly in a browser.

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
- `themes/real-parts.zip`: sample photo theme (photos named after `PHOTO_SLOTS`, plus `theme.json` and `CREDITS.txt`)
- `js/core/`
  - `config.js`: `PHOTO_URLS`
  - `i18n.js`: all UI text, English and Arabic (`I18N.en` / `I18N.ar`), plus `t()`
  - `helpers.js`: rng, canvas textures, tweens (`tween`, `animTo`)
  - `layout.js`: board dimensions, socket and DIMM positions
  - `textures.js`: generated canvas textures
  - `scene.js`: renderer, camera, `VIEWS`, `focus()`, lights, `mesh()`
- `js/parts/`: one 3D part per file, in the order the parts are built
  - motherboard, rear-io, board-headers, socket, dimm-slots, pcie-latch
  - cpu, ram, fan-headers, thermal-paste, cooler
  - cables, m2-ssd, cmos-battery, case, side-panel, psu, gpu
  - sata-connectors, sata-ssd, connector-cables, front-panel, peripherals (keyboard, mouse, monitor, rear port targets)
- `js/game/`
  - `state.js`: step order (`STEP_IDS`, `ST`, `STEPS`, `viewFor`, `setStep`), state `S`, `HELD`
  - `take-parts.js`: picking parts up from the tray (`takeCPU`, `takeRAM`, …)
  - `actions.js`: lever, slot, bracket and screw clicks, plus `rotate`/`flip`/`seat`
  - `drop.js`: placement rules per part (`drop()`), `finish`, `persist`
  - `connectors.js`: the SATA / 24-pin / CPU-power plug steps
  - `paste.js`: thermal-paste animation
  - `skip.js`: hold Ctrl+H to skip a step (`finishStep`, `skipStep`)
  - `photos.js`: user photo textures and .zip photo themes (`PHOTO_SLOTS`, `loadTheme`, kept in IndexedDB; zip via JSZip from CDN)
  - `input.js`: raycast picking and dragging
  - `ui.js`: sidebar, tray, buttons, keyboard
  - `loop.js`: render loop, glow hints, startup (`applyLang(); setStep(0)`)
