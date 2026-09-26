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
  - `key-view.js`: small window that shows how a held keyed part lines up (SATA plug vs port L, RAM notch vs slot key)
  - `paste.js`: thermal-paste animation
  - `skip.js`: hold Ctrl+H to skip a step (`finishStep`, `skipStep`)
  - `photos.js`: user photo textures and .zip photo themes (`PHOTO_SLOTS`, `loadTheme`, kept in IndexedDB; zip via JSZip from CDN)
  - `input.js`: raycast picking and dragging
  - `ui.js`: sidebar, tray, buttons, keyboard
  - `loop.js`: render loop, glow hints, startup (`applyLang(); setStep(0)`)
