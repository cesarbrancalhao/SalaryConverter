# SalaryConverter

## Project structure

```
SalaryConverter/
├── index.html      # Markup, DOM structure, element hooks
├── styles.css      # All styling, themes, responsive rules
├── app.js          # Conversion logic, currency rates, UI behavior
├── README.md       # This file
├── .gitignore      # Ignores tx/
└── tx/             # Ignored working notes (project_idea.md, project_structure)
```

Static three-file site (HTML + CSS + vanilla JS), no build step, no dependencies, deployable directly to GitHub Pages.

## index.html

- `<head>`: `charset=UTF-8`, responsive viewport meta, `<title>Salary Converter</title>`, links `styles.css`.
- `.container`: root wrapper, `max-width: 900px`, centered.
- `.header`: `<h1>` title + `.theme-toggle#themeToggle` button.
- `.card.work-card` → `.work-row`: two `.field` blocks:
  - `#hoursPerWeek` (`input[type=number]`, default `40`)
  - `#daysPerWeek` (`input[type=number]`, default `5`)
- `.cards-container#cardsContainer`: grid holding one or more `.card.salary-card`.
- `.salary-card` (template, first child): cloned by JS to add cards. Contains:
  - `.card-top`:
    - `.currency-selector` → `.currency-trigger` button (`aria-haspopup="listbox"`, `aria-expanded`) with `.currency-code` (default `USD`) + `.currency-arrow` (▲); `ul.currency-list[role=listbox]` with `li[role=option][data-code]` entries: `USD, EUR, GBP, BRL, JPY, CAD, AUD`.
    - `.add-card` button containing an inline `<svg>` plus icon (`viewBox 0 0 24 24`, two `<path>` strokes). On cloned cards, JS reclassifies this to `.remove-card` and swaps the SVG to a single minus `<path>`.
  - `.salary-grid`: six `.field` blocks, each = `<label>` + `.input-wrap` (`.prefix` span + `input[type=number][data-period]`). Fields in DOM order: `annual, hourly, monthly, biweekly, weekly, daily`. `data-period` drives conversion; `id`/`for` present only on the first card.
- `.rates-note#ratesNote`: status line for exchange-rate loading state.
- `<script src="app.js">` loaded at end of `<body>`.

## styles.css

- **Reset**: universal `box-sizing: border-box`.
- **`body`**: dark default palette (`#0e0f1c` bg, `#e1e4e8` text), system font stack, `background`/`color` transition.
- **`.container`**: `max-width: 900px`, centered, `24px` padding.
- **`.header` / `h1` / `.subtitle`**: flex header layout.
- **`.theme-toggle`**: bordered pill button, hover state.
- **`.card` / `.work-card`**: card surface (`#16182b` bg, border, radius).
- **`.cards-container`**: `display: grid`, `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))`, `16px` gap — auto 2-up / collapses to 1 column.
- **`@media (min-width: 704px)` `.count-3`**: third card spans `grid-column: 1 / -1`, `justify-self: center`, `width: calc(50% - 8px)` → triangle layout for 3 cards.
- **`.card-top`**: flex, space-between (currency selector left, add/remove button right).
- **`.add-card` / `.remove-card`**: 32×32 icon buttons; shared hover; `.add-card:disabled` dimmed.
- **`.currency-selector`**: `position: relative` dropdown anchor.
- **`.currency-trigger`**: bold uppercase label-colored text, arrow gap.
- **`.currency-arrow`**: 10px.
- **`.currency-list`**: absolutely positioned dropdown, `display: none`; shown via `.currency-selector.open .currency-list`; `li` hover / `[aria-selected="true"]` highlight.
- **`.salary-grid`**: 2-column grid, `16px` gap.
- **`.field` / `.field label`**: column flex; uppercase label styling.
- **`.input-wrap` / `.prefix`**: relative wrapper; absolutely positioned currency symbol at `left: 12px` (padding computed at runtime in JS).
- **`.field input`**: full-width number input; spin buttons hidden (WebKit + Firefox); `:focus` border color.
- **`.legend` / `.rates-note`**: small muted text; `.rates-note.error` red variant.
- **Light theme** (`body.light ...`): overrides bg/text and `#0055A4` accent across toggle, buttons, cards, labels, currency dropdown, inputs, prefix, notes.
- **`@media (max-width: 520px)`**: `.salary-grid` → 1 column; `.work-row` → column.

## app.js

Vanilla JS, IIFE-free top-level script. No modules.

### Constants / state
- `WEEKS_PER_YEAR=52`, `MONTHS_PER_YEAR=12`, `BIWEEKLY_PER_YEAR=26`, `MAX_CARDS=4`.
- `BASE='USD'` — internal base currency.
- `RATES_CACHE_KEY='salary_rates'`, `RATES_TTL=6h`.
- `SYMBOLS` — currency → prefix symbol map (`$, €, £, R$, ¥, ...`).
- `rates` — `{ USD: 1, ... }` live rate table (base-relative).
- `salaryAnnualBase` — single source of truth: current salary expressed as annual amount in `BASE`.
- `work` — `{ hoursPerWeek, daysPerWeek }`.
- Cached element refs: `hoursInput`, `daysInput`, `cardsContainer`, `ratesNote`.

### Conversion
- `toAnnual(period, value)` / `fromAnnual(period, annual)` — period ↔ annual using work hours/days and per-year constants.
- `toBase(currency, value)` / `fromBase(currency, value)` — divide/multiply by `rates[currency]`.
- `fmt(n)` — rounds to 2 decimals, returns `''` for `0`/non-finite.

### Rendering
- `repaintCard(card, skipEl)` — reads `salaryAnnualBase`, converts to card currency + each period, writes into inputs (skipping `skipEl`); sets `.prefix` symbol and computes `input.style.paddingLeft` from `prefix.offsetWidth + 20` (handles multi-char symbols like `R$`).
- `repaintAll(skipEl)` — `repaintCard` over every `.salary-card`.

### Currency selector
- `getCardCurrency(card)` / `setCardCurrency(card, code)` — read/write `.currency-code` text and `aria-selected` on options.
- `closeAllCurrencies()` — collapses all open dropdowns.
- `initCurrency(card)` — wires trigger toggle (closes others first) and option click (set currency + repaint).

### Inputs / cards
- `initInputs(card)` — per-input `input` listener: parse value → `toAnnual` → `toBase` → set `salaryAnnualBase` → `repaintAll(input)`.
- `updateAddButtons()` — sets `count-N` class on container, disables `.add-card` at `MAX_CARDS`.
- `addCard()` — clones first card, clears inputs, strips `id`/`for`, converts add button → remove button (class swap + SVG minus path), appends, `initCard`, inherits first card currency, repaints.
- `removeCard(card)` — removes node, `updateAddButtons`.
- `initCard(card)` — binds currency, inputs, and add/remove handlers.
- Bootstrap: `initCard` over existing cards, `updateAddButtons`, global click listener to close dropdowns on outside click.

### Work inputs
- `onWorkChange()` — updates `work.hoursPerWeek`/`daysPerWeek`, `repaintAll(null)`; bound to both work inputs.

### Theme
- `applyTheme(theme)` — toggles `body.light`, swaps toggle label (☀ Day / ☾ Night).
- Toggle click persists choice to `localStorage['salary_theme']`; initial theme read from storage (default `dark`).

### Exchange rates (Frankfurter API)
- `currencyCodes()` — unique `data-code` set from currency options.
- `setRatesNote(text, isError)` — updates note text + `error` class.
- `applyRates(data, cached)` — merges into `rates`, formats date, sets note, `repaintAll`.
- `loadCachedRates()` — reads/parses `localStorage[RATES_CACHE_KEY]`.
- `fetchRates()` — GETs `https://api.frankfurter.dev/v1/latest?base=USD&symbols=...`; on success caches `{date, rates, fetchedAt}` + applies; on failure falls back to cache or error note.
- Bootstrap: apply cached rates immediately if present (refetch if older than `RATES_TTL`), else fetch.

## External services
- **Frankfurter** (`api.frankfurter.dev`) — ECB reference rates, no API key, CORS-enabled. Client-side `fetch`, `localStorage`-cached (6h TTL).
