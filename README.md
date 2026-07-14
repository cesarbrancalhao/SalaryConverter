# SalaryConverter

Static salary/currency converter. Plain HTML/CSS/JS, no build, no dependencies. Deploys to GitHub Pages.

## Files

- `index.html` — markup
- `styles.css` — styling + dark/light themes + responsive layout
- `app.js` — all logic
- `tx/` — local notes (gitignored)

## How it works

- One salary is stored internally as an annual amount in USD (`salaryAnnualBase`). Editing any field recomputes it, then every card re-renders.
- Each **card** shows the salary in one currency across 6 periods: annual, hourly, monthly, biweekly, weekly, daily.
- Period math uses `hours/week` and `days/week` from the work card plus fixed constants (52 weeks, 12 months, 26 biweekly).
- Up to 4 cards. The `+` button clones a card (inheriting the current currency); cloned cards get a `−` button to remove themselves.
- Layout: cards auto-fit 2 per row, collapse to 1 column when narrow; with 3 cards the third centers into a triangle.
- Currency picker per card; the `$` prefix and input padding adjust to the selected symbol (e.g. `R$`).
- Theme toggle persists to `localStorage`.

## Exchange rates

Fetched client-side from the **Frankfurter** API (ECB rates, no key, CORS-enabled), cached in `localStorage` for 6h with fallback to the last cached values on failure.
